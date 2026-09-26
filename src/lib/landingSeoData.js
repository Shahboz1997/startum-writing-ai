/** Shared copy for landing SEO (server HTML + JSON-LD) and interactive landing. */

export const LANDING_HERO = {
  tagline: 'IELTS Writing Task 1 & Task 2',
  title:
    'Catches Task 1 data errors and scores Task 1 & Task 2 like an examiner — in ~30 seconds.',
  description:
    'Paste your Academic chart, GT letter, or Task 2 essay. Get examiner-style scores on all four criteria, flagged data/logic mistakes, lexical upgrades, and a model rewrite. Practice estimates only — not an official IELTS score.',
};

export const LANDING_FEATURES = [
  {
    title: 'Task 1 & Task 2 analysis',
    description:
      'Examiner-style feedback on Academic charts, GT letters, and Task 2 essays when you are signed in.',
  },
  {
    title: 'Lexical upgrades & corrections',
    description:
      'Highlight weak vocabulary, apply C1/C2 upgrades, and review grammar corrections with a model rewrite.',
  },
  {
    title: 'Study plan & history',
    description:
      'Save checks to your archive, track criterion trends, and build a writing profile from real practice data.',
  },
];

/** Compact conversion funnel: paste → score → fixes → rewrite */
export const LANDING_WORKFLOW_STEPS = [
  {
    step: 1,
    title: 'Paste',
    description:
      'Drop in your Task 1 report, GT letter, or Task 2 essay — or generate a fresh prompt in the lab.',
  },
  {
    step: 2,
    title: '4 criteria',
    description:
      'Get scores for Task Achievement/Response, Coherence & Cohesion, Lexical Resource, and Grammar.',
  },
  {
    step: 3,
    title: 'Fixes',
    description:
      'See corrections plus Task 1 data and logic flags tutors often miss — not just surface grammar.',
  },
  {
    step: 4,
    title: 'Rewrite',
    description:
      'Compare your draft to a model rewrite and lexical upgrades, then save the check to your study plan.',
  },
];

export const LANDING_FAQ_ITEMS = [
  {
    q: 'Can I see a sample IELTS Writing report before signing up?',
    a: 'Yes. Open the sample reports on the landing page (Task 2 Band 5.5, Task 2 Band 7.5, Academic Task 1, or the flagship Task 1+2 report). They use the same examiner pipeline as a real Analyze. You also get one free demo check per network before creating an account.',
  },
  {
    q: 'How accurate is Stratum AI for IELTS scoring?',
    a: 'Stratum scores Writing using the same four official criteria examiners apply. Scores are AI practice estimates for learning — not an official IELTS result. Use them to spot recurring gaps (especially Task 1 data/logic errors), then confirm progress with a real mock or exam.',
  },
  {
    q: 'Does it support both Academic and General Training?',
    a: 'Yes. Use Academic mode for charts, graphs, and tables (Vision + overview/grouping strategy). Use GT Letter mode for General Training Task 1: tone (formal/semi-formal), every bullet point, salutation & closing, and a dedicated Letter Strategy panel after each check.',
  },
  {
    q: 'How does GT Letter checking work?',
    a: 'Choose GT Letter in Task 1, paste or generate a letter task with bullet points, set tone and purpose, then submit. The AI scores Task Achievement on bullet coverage and register — not chart language — and returns letter_strategy with per-bullet feedback and a full model letter rewrite.',
  },
  {
    q: 'Will using Stratum AI guarantee Band 8.0?',
    a: 'No tool can guarantee a band. Stratum highlights recurring grammar and lexical gaps and shows a model rewrite so you can practice deliberately. Your final score still depends on exam-day performance and official marking.',
  },
  {
    q: 'Is my data secure and private?',
    a: 'We prioritize your privacy. Your essays are processed via encrypted channels and are never shared with third parties or used for public model training.',
  },
  {
    q: 'Does STRATUM include a study plan and practice reminders?',
    a: 'Yes. Your Study plan page turns saved checks into a Writing profile: criterion averages, recurring error patterns, sub-topic trends, and curated links for weak areas. Optional email reminders in Settings let you pick local time, weekdays, and timezone so consistency becomes effortless.',
  },
  {
    q: 'Do I need an account to use STRATUM?',
    a: 'You can paste a short excerpt on the home page for one free band preview without signing in. Create a free account for full essay checks (3 included credits), saved history, model rewrite, and credit top-ups.',
  },
  {
    q: 'Can tutors add personal feedback and share reports with students?',
    a: "Yes. After AI analysis, use Tutor's notes below the essay for custom feedback. Adjust criterion scores manually if needed, then Save to Archive, Share a link, or download an Official PDF — tutor notes appear in the shared report and PDF.",
  },
];

export const LANDING_GUEST_OFFER =
  'Create a free account for full analysis, saved history, and writing credits.';

export const LANDING_TELEGRAM = {
  tagline: 'On the go',
  title: 'Telegram — free quick score, full report on the site',
  description:
    'Get a free quick Writing score in the Telegram bot between study sessions. For the full 4-criteria report, data-error flags, lexical upgrade, model rewrite, and credit packs — continue on stratumielts.com.',
  features: [
    {
      title: 'Free quick score in Telegram',
      description:
        'Send a short Writing excerpt to the bot for a fast preliminary band when you are away from the desk.',
      command: '/check',
      commandHint: 'quick Writing score in DM',
    },
    {
      title: 'Full examiner report on the site',
      description:
        'Open STRATUM on the web for criteria breakdown, Task 1 logic flags, rewrite, history, and USD credit packs.',
      command: 'web',
      commandHint: 'deep lab · Lemon Squeezy credits',
    },
    {
      title: 'Daily tips & topics',
      description:
        'Morning tips and evening prompts in the channel keep practice consistent between full checks.',
      command: '/tip',
      commandHint: 'tips & quizzes · channel posts',
    },
  ],
  resourceCommand: '/resource',
  resourceHint: 'curated study links matched to your weak areas',
  cta: 'Free quick score in Telegram',
  channelCta: 'Join Telegram channel',
};

/** Practice-score disclaimer (hero, results, SEO topic pages). */
export const LANDING_SCORE_DISCLAIMER =
  'Practice estimate only — not an official IELTS score.';
