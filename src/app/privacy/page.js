import LegalPageLayout from '@/components/LegalPageLayout';

export const metadata = {
  title: 'Privacy Policy | STRATUM.ai',
  description: 'STRATUM.ai privacy policy: how we collect, use, and protect your data.',
};

const LAST_UPDATED = 'February 19, 2026';

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
        <h2>Payments (Stripe)</h2>
        <p>
          All payment data is handled exclusively by Stripe, the world&apos;s leading payment processor.
          We never store your credit card number or full card details. Stripe is PCI-DSS compliant.
          We only store the fact that you have a subscription and your credit balance where relevant.
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
        <h2>Contact</h2>
        <p>
          If you have questions about this Privacy Policy or your data, contact us at{' '}
          <a href="mailto:supportstratum@gmail.com" className="text-indigo-600 dark:text-indigo-400 hover:underline">
            supportstratum@gmail.com
          </a>.
        </p>
      </section>
    </LegalPageLayout>
  );
}
