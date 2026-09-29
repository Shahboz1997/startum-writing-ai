import { getPrisma } from "@/lib/prisma";
import { CREDITS_DEFAULT_NEW_USER } from "@/lib/credits";
import { issueVerificationEmailForUser } from "@/lib/emailVerification";
import {
  disposableEmailMessage,
  validateSignupEmail,
} from "@/lib/emailValidation";
import { isOutboundMailConfigured } from "@/lib/resendMail";
import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request) {
  try {
    // Ensure DATABASE_URL (or DIRECT_URL) is available before using Prisma
    const dbUrl = process.env.DATABASE_URL || process.env.DIRECT_URL;
    if (!dbUrl) {
      console.error("REGISTRATION_ERROR: DATABASE_URL and DIRECT_URL are not set in .env");
      return NextResponse.json(
        { error: "Server configuration error: database URL not configured." },
        { status: 503 }
      );
    }

    const prisma = getPrisma();

    const body = await request.json();
    const name = typeof body?.name === "string" ? body.name.trim() : "";
    const password = body?.password;

    if (!body?.email || !password) {
      return NextResponse.json(
        { error: "Email and password are required." },
        { status: 400 }
      );
    }

    const emailCheck = validateSignupEmail(body.email);
    if (!emailCheck.ok) {
      return NextResponse.json(
        { error: disposableEmailMessage(emailCheck.reason) },
        { status: 400 }
      );
    }
    const email = emailCheck.email;

    if (!name) {
      return NextResponse.json({ error: "Name is required." }, { status: 400 });
    }

    // If the user already exists, return 400 instead of 500
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "Email already exists" },
        { status: 400 }
      );
    }

    // Hash password with bcrypt (rounds: 10)
    const hashedPassword = await bcrypt.hash(String(password), 10);

    // Save user to database; User model fields: email, password, name (id, createdAt, etc. are auto-set)
    const user = await prisma.user.create({
      data: {
        email,
        name: name || null,
        password: hashedPassword,
        credits: CREDITS_DEFAULT_NEW_USER,
      },
    });

    const mailConfigured = isOutboundMailConfigured();
    const emailResult = await issueVerificationEmailForUser(user);
    let verifiedUser = user;

    if (!emailResult.ok) {
      if (mailConfigured) {
        // Mail infra exists but delivery failed — do NOT auto-verify fake inboxes.
        await prisma.user.delete({ where: { id: user.id } }).catch(() => {});
        return NextResponse.json(
          {
            error:
              "Could not send a confirmation email to that address. Use a real inbox and try again.",
          },
          { status: 502 }
        );
      }
      // Local/dev without mail: allow signup so the app remains usable.
      verifiedUser = await prisma.user.update({
        where: { id: user.id },
        data: { emailVerified: new Date() },
      });
    }

    // Return 201 with user object (omit password)
    const { password: _p, ...userWithoutPassword } = verifiedUser;
    return NextResponse.json(
      {
        ...userWithoutPassword,
        needsVerification: emailResult.ok,
        emailSent: emailResult.ok,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("REGISTRATION_ERROR:", error);

    const code = error?.code;
    const message = error?.message ?? "";

    if (code === "P2002") {
      return NextResponse.json(
        { error: "Email already exists" },
        { status: 400 }
      );
    }

    // Table missing / migrations not applied (common right after deploy)
    const isSchemaMissing =
      code === "P2021" ||
      /does not exist/i.test(message) ||
      /relation .* does not exist/i.test(message);
    if (isSchemaMissing) {
      return NextResponse.json(
        {
          error:
            "Database schema is missing. Run Prisma migrations / push schema in production.",
        },
        { status: 503 }
      );
    }

    const isDbUnreachable =
      code === "P1001" ||
      /Can't reach database server/i.test(message) ||
      /Connection refused/i.test(message) ||
      /self signed certificate/i.test(message) ||
      /certificate/i.test(message);

    if (isDbUnreachable) {
      return NextResponse.json(
        {
          error:
            "Database unavailable. Check DATABASE_URL (and DIRECT_URL) in .env.local.",
        },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { error: "Registration failed. Please try again.", details: code || undefined },
      { status: 500 }
    );
  }
}
