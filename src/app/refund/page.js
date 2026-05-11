import LegalPageLayout from '@/components/LegalPageLayout';
import { SUPPORT_EMAIL } from '@/lib/support';

export const metadata = {
  title: 'Refund Policy | STRATUM.ai',
  description: 'STRATUM.ai refund policy: credits, subscriptions, and refund eligibility.',
};

const LAST_UPDATED = 'February 19, 2026';

export default function RefundPage() {
  return (
    <LegalPageLayout title="Refund Policy" lastUpdated={LAST_UPDATED}>
      <section>
        <h2>Credit purchases</h2>
        <p>
          Credits are consumed when you submit an essay for AI analysis. Once a credit has been used,
          it cannot be refunded or restored. <strong>Non-refundable once credits are used.</strong> Unused
          credits may be eligible for refund or transfer only as described below and in our Terms of Service.
        </p>
      </section>

      <section>
        <h2>Subscription plans</h2>
        <p>
          If you purchase a subscription (e.g. monthly or yearly plan), you may cancel before the next
          billing cycle. Refunds for the current billing period are considered on a case-by-case basis
          and are not guaranteed. Subscription fees are generally non-refundable once the billing period
          has started. Contact support for billing questions.
        </p>
      </section>

      <section>
        <h2>Eligibility</h2>
        <p>
          Refunds, when applicable, are processed to the original payment method within 5–10 business days.
          We do not refund credits that have already been used for essay checks. This policy is in place
          to prevent abuse and to align with the digital nature of the service.
        </p>
      </section>

      <section>
        <h2>Contact</h2>
        <p>
          For refund requests or questions about this policy, contact us at{' '}
          <a href={`mailto:${SUPPORT_EMAIL}`} className="text-indigo-600 dark:text-indigo-400 hover:underline">
            {SUPPORT_EMAIL}
          </a>{' '}
          or write to our business address: 30 N Gould St Ste R, Sheridan, WY 82801, USA.
        </p>
      </section>
    </LegalPageLayout>
  );
}
