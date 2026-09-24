import LegalPageLayout from '@/components/LegalPageLayout';
import { BUSINESS_ADDRESS, LEGAL_COMPANY_NAME, REGISTERED_AGENT_ADDRESS, REGISTERED_AGENT_NAME, SUPPORT_EMAIL, SUPPORT_PHONE_TEL, CONTACT_SUPPORT_LABEL } from '@/lib/support';

export const metadata = {
  title: 'Privacy Policy | STRATUM',
  description: 'STRATUM privacy policy: how we collect, use, and protect your data.',
};

const LAST_UPDATED = 'September 24, 2026';

export default function PrivacyPage() {
  return (
    <LegalPageLayout title="Privacy Policy" lastUpdated={LAST_UPDATED}>
      <section>
        <h2>Data collection</h2>
        <p>
          We collect your email address and name when you create an account. This is done through
          Google Sign-In or our email/password registration (NextAuth). We use this information only
          to manage your account, provide the service, and communicate with you about your usage
          (e.g. credits and subscription).
        </p>
      </section>

      <section>
        <h2>AI processing</h2>
        <p>
          Your essays are sent to OpenAI&apos;s API to generate band scores and feedback. We do not use
          your essays or any student data to train our own models. OpenAI processes the content
          according to their data use policy; we do not retain essay content for model training
          purposes.
        </p>
      </section>

      <section>
        <h2>Cookies</h2>
        <p>
          We use essential cookies for authentication (NextAuth session) so you can stay logged in.
          We may also use analytics cookies to understand how the site is used and to improve the
          product. You can control non-essential cookies through your browser settings.
        </p>
      </section>

      <section>
        <h2>Credits &amp; payments</h2>
        <p>
          We store your credit balance so you can use AI writing checks. Payment card details are
          processed by our payment provider (Lemon Squeezy) — we do not store card numbers on our
          servers. Purchased credits are added to your account automatically after a successful
          payment. See{' '}
          <a href="/pricing" className="text-indigo-600 dark:text-indigo-400 hover:underline">
            Pricing
          </a>{' '}
          for available packs.
        </p>
      </section>

      <section>
        <h2>Governing law</h2>
        <p>
          This Privacy Policy is governed by the laws of the State of Wyoming, USA, without regard to
          conflict of law principles.
        </p>
      </section>

      <section>
        <h2>Company</h2>
        <p>
          {LEGAL_COMPANY_NAME} operates stratum. Principal office and mailing address:{' '}
          {BUSINESS_ADDRESS}. Registered agent: {REGISTERED_AGENT_NAME},{' '}
          {REGISTERED_AGENT_ADDRESS}.
        </p>
      </section>

      <section>
        <h2>Contact</h2>
        <p>
          If you have questions about this Privacy Policy or your data, contact us at{' '}
          <a href={`mailto:${SUPPORT_EMAIL}`} className="text-indigo-600 dark:text-indigo-400 hover:underline">
            {SUPPORT_EMAIL}
          </a>{' '}
          or{' '}
          <a href={SUPPORT_PHONE_TEL} className="text-indigo-600 dark:text-indigo-400 hover:underline">
            {CONTACT_SUPPORT_LABEL}
          </a>.
        </p>
      </section>
    </LegalPageLayout>
  );
}
