export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';
/** Multi-phase GPT-4o analysis — allow enough time on Vercel. */
export const maxDuration = 120;

import { NextResponse } from 'next/server';
import {
  IELTS_TASK1_STANDARD_INSTRUCTION,
  buildTask1QuestionPaperText,
} from '@/lib/task1Prompt.js';
import { buildGtLetterUserContext } from '@/lib/task1LetterPrompt.js';
import { CREDITS_EXHAUSTED_CODE, userHasCheckCredits } from '@/lib/credits';
import { SUPPORT_EMAIL } from '@/lib/support';
import {
  createChatCompletionWithModelFallback,
  getOpenAIBaseURL,
  getOpenAIVisionModel,
  getTrimmedOpenAIKey,
  getTrimmedOpenAIProjectId,
  openAIErrorToJsonResponse,
  validateOpenAIEnvForRoute,
} from '@/lib/openaiServer.js';
import {
  isAuxiliaryOpenAiCheckRequest,
  resolveAuxiliaryAiAccess,
  resolveMainCheckAccess,
  tryConsumeGuestCheckQuota,
  refundGuestCheckQuota,
  jsonGuestQuotaExhausted,
} from '@/lib/aiRouteGuard.js';
import { MAX_ESSAY_CHARS, MAX_ESSAY_WORDS } from '@/lib/aiAccessShared.js';
import { toGuestCheckPreview, countWords, GUEST_PREVIEW_MAX_WORDS, GUEST_PREVIEW_MIN_WORDS } from '@/lib/guestCheckPreview.js';
import { getOpenAIClient } from '@/lib/ielts/checkOpenai.js';
import {
  MAX_DATA_URL_CHARS,
  imageUrlToBase64,
  sanitizeTask1VisionIntro,
} from '@/lib/ielts/imageHelpers.js';
import { buildDescribeImageSystemPrompt } from '@/lib/ielts/prompts.js';
import { normalizeTask1Kind } from '@/lib/ielts/parseResponse.js';
import { runFullIeltsCheck } from '@/lib/ielts/runFullIeltsCheck.js';
import { normalizeCheckResult } from '@/lib/ielts/normalizeCheckResult.js';
import {
  persistCheckResult,
  reserveCheckCredit,
  refundCheckCredit,
} from '@/lib/ielts/persistCheck.js';
import { buildE2eMockCheckResult } from '@/lib/ielts/e2eMockCheckResult.js';
import {
  buildDevMockGeneratedTask1Text,
  buildDevMockLetterTask,
  buildDevMockTask2Question,
} from '@/lib/ielts/devOpenAiMock.js';
import { shouldUseDevOpenAiMock } from '@/lib/openaiServer.js';

const e2eMockOpenAI = () => process.env.E2E_MOCK_OPENAI === '1';
const shouldUseOpenAiMock = () => e2eMockOpenAI() || shouldUseDevOpenAiMock();

export async function DELETE(req) {
  return NextResponse.json({ message: "Archive cleared" }, { status: 200 });
}

export async function POST(req) {
  let creditReserved = false;
  let guestQuotaConsumed = false;
  let reservedUserId = null;
  let reservedGuestIpHash = null;
  let prismaForRefund = null;

  try {
    // Debug: confirm request reaches this route (never log full secrets).
    const _trimKey = getTrimmedOpenAIKey();
    console.log('[/api/check] POST start', {
      hasKey: _trimKey.length > 0,
      hasProject: Boolean(getTrimmedOpenAIProjectId()),
      baseURL: getOpenAIBaseURL(),
      nodeEnv: process.env.NODE_ENV,
      time: new Date().toISOString(),
    });

    const body = await req.json();
    if (!shouldUseOpenAiMock()) {
      const envError = validateOpenAIEnvForRoute();
      if (envError) return envError;
    }

    const { safeAuth } = await import('@/lib/safeAuth');
    const session = await safeAuth();

    console.log('[/api/check] session', {
      authed: Boolean(session?.user?.id),
      userId: session?.user?.id ?? null,
      hasEmail: Boolean(session?.user?.email),
    });

    if (isAuxiliaryOpenAiCheckRequest(body)) {
      const auxAccess = await resolveAuxiliaryAiAccess(req, session, 'check');
      if (!auxAccess.ok) return auxAccess.response;
    }

    console.log('[/api/check] request body flags', {
      describeImage: Boolean(body?.describeImage),
      hasImage: Boolean(body?.image),
      hasEssay1: typeof body?.essay1 === 'string' && body.essay1.trim().length > 0,
      hasEssay2: typeof body?.essay2 === 'string' && body.essay2.trim().length > 0,
      analysisMode: body?.analysisMode,
    });
    // Footer feedback opens the user's mail client (mailto) — no server SMTP.
    // --- 1. РЕЖИМ: Глубокий анализ изображения (Vision / OCR) ---
    // Frontend sends POST with { describeImage: true, image: base64OrUrl }. API key is read at request time via getOpenAIClient().
    if (body.describeImage && body.image) {
      // Chart vision always uses the real OpenAI API (never E2E_MOCK_OPENAI placeholder text).
      const rawImage = typeof body.image === 'string' ? body.image.trim() : '';
      if (!rawImage) {
        return NextResponse.json({ error: 'Missing image.' }, { status: 400 });
      }
      if (rawImage.startsWith('data:')) {
        if (!rawImage.startsWith('data:image/')) {
          return NextResponse.json({ error: 'Unsupported data URL type. Please upload a valid image.' }, { status: 400 });
        }
        if (rawImage.length > MAX_DATA_URL_CHARS) {
          return NextResponse.json({ error: 'Image is too large. Please upload a smaller image (under ~6MB).' }, { status: 413 });
        }
      }

      const clientResult = getOpenAIClient();
      if (clientResult.error) return clientResult.error;
      const openai = clientResult.openai;
      const visionModel = getOpenAIVisionModel();
      const describeMessages = (imageUrlForApi) => [
        {
          role: 'system',
          content: buildDescribeImageSystemPrompt(),
        },
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: 'Write the introductory stem only. Do not write the essay or report.',
            },
            { type: 'image_url', image_url: { url: imageUrlForApi } },
          ],
        },
      ];
      try {
        const isPublicHttp = /^https?:\/\//i.test(rawImage);

        let response;
        // Let OpenAI fetch public URLs first (avoids our server download + huge base64); fallback if it fails.
        if (isPublicHttp) {
          try {
            response = await createChatCompletionWithModelFallback(
              openai,
              {
                messages: describeMessages(rawImage),
                max_tokens: 220,
              },
              {
                preferredModel: visionModel,
                requestOptions: { timeout: 180_000 },
                label: 'describeImage-url',
              }
            );
          } catch (directErr) {
            console.warn(
              "[/api/check] describeImage: vision with public URL failed, trying downloaded image:",
              directErr?.message || directErr
            );
            const finalImage = await imageUrlToBase64(rawImage);
            response = await createChatCompletionWithModelFallback(
              openai,
              {
                messages: describeMessages(finalImage),
                max_tokens: 220,
              },
              {
                preferredModel: visionModel,
                requestOptions: { timeout: 180_000 },
                label: 'describeImage-base64',
              }
            );
          }
        } else {
          response = await createChatCompletionWithModelFallback(
            openai,
            {
              messages: describeMessages(body.image),
              max_tokens: 220,
            },
            {
              preferredModel: visionModel,
              requestOptions: { timeout: 180_000 },
              label: 'describeImage',
            }
          );
        }

        const rawIntro = response?.choices?.[0]?.message?.content;
        const intro = sanitizeTask1VisionIntro(
          typeof rawIntro === 'string' ? rawIntro : ''
        );
        const question = intro
          ? buildTask1QuestionPaperText(intro)
          : IELTS_TASK1_STANDARD_INSTRUCTION;

        return NextResponse.json({ question });
      } catch (error) {
        console.error(
          "OpenAI error (describeImage):",
          error?.response ?? error?.error ?? error?.message,
          "response?.data:",
          error?.response?.data ?? error?.error
        );
        const openAiRes = openAIErrorToJsonResponse(error);
        if (openAiRes) return openAiRes;
        const upstreamStatus = error?.status ?? error?.statusCode ?? error?.response?.status;
        const message =
          typeof error?.message === 'string' && error.message
            ? error.message
            : 'Image description failed.';
        return NextResponse.json(
          {
            error:
              upstreamStatus === 400
                ? 'Invalid image for vision. Please try another image.'
                : 'The selected image source is protected, too large, or invalid. Please upload a smaller file or try another topic.',
            detail: process.env.NODE_ENV === 'development' ? message : undefined,
            question: null,
          },
          { status: 502 }
        );
      }
    }

    // --- 2. РЕЖИМ: Генерация случайного Task 1 (Текст) ---
    if (body.generateTask1) {
      if (shouldUseOpenAiMock()) {
        return NextResponse.json({ question: buildDevMockGeneratedTask1Text() });
      }
      const clientResult = getOpenAIClient();
      if (clientResult.error) return clientResult.error;
      const openai = clientResult.openai;
      try {
        const response = await createChatCompletionWithModelFallback(
          openai,
          {
            messages: [
              {
                role: 'system',
                content: `You write ONLY the written description that appears above the task instructions on an IELTS Academic Task 1 paper.

Return 2–4 sentences that describe a hypothetical chart, table, map, or process (type + what it shows). Do NOT invent specific numbers. Do NOT write the candidate's report, overview of trends, or analysis.

Do NOT include "Summarize the information" or "Write at least 150 words".`,
              },
              { role: 'user', content: 'Generate a new Academic Task 1 written prompt (description only).' },
            ],
            max_tokens: 220,
          },
          { label: 'generateTask1' }
        );
        const raw = response?.choices?.[0]?.message?.content;
        const intro = sanitizeTask1VisionIntro(typeof raw === 'string' ? raw : '');
        const question = intro
          ? buildTask1QuestionPaperText(intro)
          : IELTS_TASK1_STANDARD_INSTRUCTION;
        return NextResponse.json({ question });
      } catch (err) {
        console.error('Generate Task 1 error:', err, 'response?.data:', err?.response?.data ?? err?.error);
        const openAiRes = openAIErrorToJsonResponse(err);
        if (openAiRes) return openAiRes;
        return NextResponse.json({ error: err?.message || 'Topic generation failed.' }, { status: 500 });
      }
    }

    // --- 2b. Генерация GT Task 1 (письмо) ---
    if (body.generateLetterTask) {
      if (shouldUseOpenAiMock()) {
        return NextResponse.json({ question: buildDevMockLetterTask(), task1Kind: 'gt_letter' });
      }
      const clientResult = getOpenAIClient();
      if (clientResult.error) return clientResult.error;
      const openai = clientResult.openai;
      const keyword = typeof body.keyword === 'string' ? body.keyword.trim() : '';
      try {
        const response = await createChatCompletionWithModelFallback(
          openai,
          {
            messages: [
              {
                role: 'system',
                content: `You write an authentic IELTS General Training Writing Task 1 question (letter only).

Return ONLY the task text as it appears on the exam paper:
- 1–2 sentences of situation (who you are, context)
- Exactly 3 bullet points starting with "•" or "-" listing what the letter must include
- End with: "Write at least 150 words. You do not need to write any addresses. Begin your letter as follows:"
- Then one opening line starter e.g. "Dear Sir or Madam," or "Dear Mr Jones,"

Do NOT write the candidate's letter. Do NOT include band descriptors or examiner notes.`,
              },
              {
                role: 'user',
                content: keyword
                  ? `Generate a new GT letter task about: ${keyword}`
                  : 'Generate a new GT formal letter task (complaint or request to an organisation).',
              },
            ],
            max_tokens: 400,
          },
          { label: 'generateLetterTask' }
        );
        const raw = response?.choices?.[0]?.message?.content;
        const text = (typeof raw === 'string' ? raw : '').trim();
        if (!text) {
          return NextResponse.json(
            { error: 'Could not generate a letter task. Please try again.' },
            { status: 502 }
          );
        }
        return NextResponse.json({ question: text, task1Kind: 'gt_letter' });
      } catch (err) {
        console.error('Generate letter task error:', err);
        const openAiRes = openAIErrorToJsonResponse(err);
        if (openAiRes) return openAiRes;
        return NextResponse.json(
          { error: err?.message || 'Letter task generation failed.' },
          { status: 500 }
        );
      }
    }

    // --- 3. РЕЖИМ: Генерация темы Task 2 ---
    if (body.generateTopic) {
      if (shouldUseOpenAiMock()) {
        const keyword = typeof body.keyword === 'string' ? body.keyword.trim() : '';
        return NextResponse.json({ question: buildDevMockTask2Question(keyword) });
      }
      const clientResult = getOpenAIClient();
      if (clientResult.error) return clientResult.error;
      const openai = clientResult.openai;
      const keyword = typeof body.keyword === 'string' ? body.keyword.trim() : '';
      try {
        const response = await createChatCompletionWithModelFallback(
          openai,
          {
            messages: [
              { role: 'system', content: 'You are an IELTS Examiner. Generate a Task 2 question. Return ONLY the text.' },
              { role: 'user', content: `Topic: ${keyword || 'General'}` },
            ],
          },
          { label: 'generateTopic' }
        );
        const raw = response?.choices?.[0]?.message?.content;
        const text = (typeof raw === 'string' ? raw : '').trim();
        if (!text) {
          return NextResponse.json(
            { error: 'Could not generate a topic. Please try again.' },
            { status: 502 }
          );
        }
        return NextResponse.json({ question: text });
      } catch (err) {
        console.error('Generate topic error:', err, 'response?.data:', err?.response?.data ?? err?.error);
        const openAiRes = openAIErrorToJsonResponse(err);
        if (openAiRes) return openAiRes;
        return NextResponse.json(
          { error: err?.message || err?.error?.message || 'Topic generation failed.' },
          { status: 500 }
        );
      }
    }

    // --- 4. ОСНОВНОЙ РЕЖИМ: Глубокий анализ эссе ---
    const { essay1, essay2, image, analysisMode, promptText, task1Kind: rawTask1Kind, letterMeta } = body;
    const isT1 = analysisMode === 'task1';
    const task1Kind = isT1 ? normalizeTask1Kind(rawTask1Kind) : 'academic';
    const isGtLetter = isT1 && task1Kind === 'gt_letter';
    const userText = isT1 ? essay1 : essay2;
    const taskCriteriaName = isT1 ? 'Task_Achievement' : 'Task_Response';

    if (!userText || userText.trim().length < 10) {
      return NextResponse.json({ error: "Text is too short for analysis." }, { status: 400 });
    }
    if (userText.length > MAX_ESSAY_CHARS) {
      return NextResponse.json(
        {
          error: `Essay is too long (max ${MAX_ESSAY_CHARS.toLocaleString()} characters). Shorten your draft and try again.`,
        },
        { status: 400 }
      );
    }
    const essayWords = countWords(userText);
    if (essayWords > MAX_ESSAY_WORDS) {
      return NextResponse.json(
        {
          error: `Essay is too long (max ${MAX_ESSAY_WORDS} words). Shorten your draft and try again.`,
        },
        { status: 400 }
      );
    }
    if (typeof image === 'string' && image.startsWith('data:') && image.length > MAX_DATA_URL_CHARS) {
      return NextResponse.json(
        { error: 'Image is too large. Please upload a smaller image (under ~6MB).' },
        { status: 413 }
      );
    }

    const mainAccess = await resolveMainCheckAccess(req, session);
    if (!mainAccess.ok) return mainAccess.response;

    const isGuestPreview = Boolean(mainAccess.isGuest);
    if (isGuestPreview) {
      const words = countWords(userText);
      if (words < GUEST_PREVIEW_MIN_WORDS) {
        return NextResponse.json(
          { error: `Write at least ${GUEST_PREVIEW_MIN_WORDS} words for a free preview.` },
          { status: 400 }
        );
      }
      if (words > GUEST_PREVIEW_MAX_WORDS) {
        return NextResponse.json(
          {
            error: `Free preview allows up to ${GUEST_PREVIEW_MAX_WORDS} words. Shorten the excerpt, or sign in for a full essay check.`,
          },
          { status: 400 }
        );
      }
    }

    const { getPrisma, withPrismaRetry } = await import('@/lib/prisma');
    const userId = mainAccess.userId;
    const prisma = getPrisma();
    prismaForRefund = prisma;

    if (userId) {
      const user = await withPrismaRetry(() =>
        prisma.user.findUnique({ where: { id: userId }, select: { id: true, credits: true } })
      );
      if (!user) {
        console.warn('[/api/check] Session user not in DB; running analysis without save.', { userId });
      } else if (!userHasCheckCredits(user.credits)) {
        return NextResponse.json(
          {
            code: CREDITS_EXHAUSTED_CODE,
            error:
              'You have used your included checks and have no credits left. Analysis is not available until you top up. For credit purchases and billing questions, use the support email shown in the site footer.',
            supportEmail: SUPPORT_EMAIL,
          },
          { status: 403 }
        );
      } else {
        const reserved = await withPrismaRetry(() => reserveCheckCredit(prisma, userId));
        if (!reserved.ok) {
          return NextResponse.json(
            {
              code: CREDITS_EXHAUSTED_CODE,
              error:
                'You have used your included checks and have no credits left. Analysis is not available until you top up. For credit purchases and billing questions, use the support email shown in the site footer.',
              supportEmail: SUPPORT_EMAIL,
            },
            { status: 403 }
          );
        }
        creditReserved = true;
        reservedUserId = userId;
      }
    } else if (isGuestPreview) {
      const consumed = await tryConsumeGuestCheckQuota(mainAccess.ipHash);
      if (!consumed.ok) {
        return jsonGuestQuotaExhausted();
      }
      guestQuotaConsumed = true;
      reservedGuestIpHash = mainAccess.ipHash;
    }

    let result;

    // Guests: text-only analysis (no chart vision) to keep the free preview cheap.
    const guestSafeImage = isGuestPreview ? null : image;

    const refundOnFailure = async () => {
      if (creditReserved && reservedUserId && prismaForRefund) {
        try {
          await withPrismaRetry(() => refundCheckCredit(prismaForRefund, reservedUserId));
        } catch (refundErr) {
          console.error('[/api/check] credit refund failed', refundErr);
        }
        creditReserved = false;
      }
      if (guestQuotaConsumed && reservedGuestIpHash) {
        try {
          await refundGuestCheckQuota(reservedGuestIpHash);
        } catch (refundErr) {
          console.warn('[/api/check] guest quota refund failed', refundErr);
        }
        guestQuotaConsumed = false;
      }
    };

    if (shouldUseOpenAiMock()) {
      result = normalizeCheckResult(
        buildE2eMockCheckResult({ userText, promptText, isT1 }),
        { taskCriteriaName, userText, isT1, isGtLetter, task1Kind }
      );
    } else {
      const clientResult = getOpenAIClient();
      if (clientResult.error) {
        await refundOnFailure();
        return clientResult.error;
      }
      const openai = clientResult.openai;

      const userTextBlock = isGtLetter
        ? `${buildGtLetterUserContext({ promptText, letterMeta })}\n\nSTUDENT LETTER:\n${userText}`
        : `TASK: ${analysisMode.toUpperCase()}\nPROMPT: ${promptText}\nSTUDENT ESSAY:\n${userText}`;

      try {
        const fullCheck = await runFullIeltsCheck({
          openai,
          userTextBlock,
          taskCriteriaName,
          userText,
          isT1,
          isGtLetter,
          task1Kind,
          image: guestSafeImage,
          skipRewrite: isGuestPreview,
        });
        if (!fullCheck.ok) {
          await refundOnFailure();
          return NextResponse.json({ error: fullCheck.message }, { status: fullCheck.status });
        }
        result = fullCheck.result;
      } catch (err) {
        await refundOnFailure();
        console.error('OpenAI error (essay check):', err?.response ?? err?.error ?? err?.message, 'response?.data:', err?.response?.data ?? err?.error);
        const openAiRes = openAIErrorToJsonResponse(err);
        if (openAiRes) return openAiRes;
        throw err;
      }
    }

    if (isGuestPreview) {
      return NextResponse.json(toGuestCheckPreview(result));
    }

    if (creditReserved && userId) {
      try {
        const { savedId, creditsRemaining } = await withPrismaRetry(() =>
          persistCheckResult({
            prisma,
            userId,
            userText,
            promptText,
            isT1,
            result,
            creditAlreadyReserved: true,
          })
        );
        return NextResponse.json({ ...result, savedId, creditsRemaining });
      } catch (persistErr) {
        console.error('[/api/check] persist failed after successful analysis', persistErr);
        // Credit already spent; still return analysis so the user is not left empty-handed.
        const bal = await prisma.user
          .findUnique({ where: { id: userId }, select: { credits: true } })
          .catch(() => null);
        return NextResponse.json({
          ...result,
          savedId: null,
          creditsRemaining: bal?.credits ?? undefined,
          persistWarning: 'Analysis completed but could not be saved to history.',
        });
      }
    }

    return NextResponse.json({ ...result, savedId: null });
  } catch (error) {
    console.error("API ERROR:", error);
    // Best-effort refund if we reserved before the unexpected failure.
    if (creditReserved && reservedUserId && prismaForRefund) {
      try {
        await refundCheckCredit(prismaForRefund, reservedUserId);
      } catch (refundErr) {
        console.error('[/api/check] outer credit refund failed', refundErr);
      }
    }
    if (guestQuotaConsumed && reservedGuestIpHash) {
      try {
        await refundGuestCheckQuota(reservedGuestIpHash);
      } catch (refundErr) {
        console.warn('[/api/check] outer guest quota refund failed', refundErr);
      }
    }
    const openAiRes = openAIErrorToJsonResponse(error);
    if (openAiRes) return openAiRes;
    const isProd = process.env.NODE_ENV === 'production';
    return NextResponse.json(
      {
        error: isProd
          ? 'Server error. Please try again in a moment.'
          : error?.message || 'Server error.',
      },
      { status: 500 }
    );
  }
}
