import LegalPageLayout from '@/components/LegalPageLayout';
import { BUSINESS_ADDRESS, LEGAL_COMPANY_NAME, REGISTERED_AGENT_ADDRESS, REGISTERED_AGENT_NAME, SUPPORT_EMAIL, SUPPORT_PHONE_TEL, CONTACT_SUPPORT_LABEL } from '@/lib/support';

export const metadata = {
  title: 'Terms of Service | STRATUM',
  description: 'STRATUM terms of service: service description, credits, and user conduct.',
};

const LAST_UPDATED = 'September 24, 2026';

export default function TermsPage() {
  return (
    <LegalPageLayout title="Terms of Service" lastUpdated={LAST_UPDATED}>
      <section>
        <h2>Service description</h2>
        <p>
          stratum provides AI-based IELTS writing evaluation for educational purposes. The
          service gives you band-style scores and feedback on Task 1 and Task 2 essays. It is not
          affiliated with IDP or British Council and is intended to support practice and
          self-improvement only.
        </p>
      </section>

      <section>
        <h2>Credits system</h2>
        <p>
          One (1) credit equals one (1) essay check (either Task 1 or Task 2). Credits are consumed
          when you submit an essay for analysis. <strong>Non-refundable once credits are used.</strong> Once a
          credit has been used, it cannot be refunded or restored. Unused credits may be subject to
          expiry depending on your plan; see the{' '}
          <a href="/pricing" className="text-indigo-600 dark:text-indigo-400 hover:underline">
            pricing page
          </a>{' '}
          for current packs and prices. Credit packs are digital products fulfilled automatically to
          your account after successful payment.
        </p>
      </section>

      <section>
        <h2>User conduct</h2>
        <p>
          You may not use automated tools to scrape, bulk-submit, or otherwise abuse the AI engine.
          You may not attempt to reverse-engineer the service or use it in a way that could harm
          the platform or other users. We reserve the right to suspend or terminate accounts that
          violate these terms.
        </p>
      </section>

      <section>
        <h2>Disclaimer</h2>
        <p>
          The band score and feedback provided by stratum are AI-generated estimates based on
          public IELTS band descriptors. They do not constitute an official IELTS result from IDP or
          British Council and cannot be used in place of an actual exam. Use the service for
          practice and guidance only.
        </p>
      </section>

      <section>
        <h2>Governing law</h2>
        <p>
          These Terms of Service are governed by the laws of the State of Wyoming, USA, without regard
          to conflict of law principles.
        </p>
      </section>

      <section>
        <h2>Company</h2>
        <p>
          These Terms of Service are entered into with {LEGAL_COMPANY_NAME}, which operates
          stratum. Principal office and mailing address: {BUSINESS_ADDRESS}. Registered agent:{' '}
          {REGISTERED_AGENT_NAME}, {REGISTERED_AGENT_ADDRESS}.
        </p>
      </section>

      <section>
        <h2>Contact</h2>
        <p>
          For questions about these Terms of Service, contact us at{' '}
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
