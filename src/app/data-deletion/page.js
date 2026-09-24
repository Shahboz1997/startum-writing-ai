import LegalPageLayout from '@/components/LegalPageLayout';
import {
  LEGAL_COMPANY_NAME,
  SUPPORT_EMAIL,
  SUPPORT_PHONE_TEL,
  CONTACT_SUPPORT_LABEL,
} from '@/lib/support';

export const metadata = {
  title: 'Data Deletion | STRATUM',
  description:
    'How to request deletion of your stratum account and personal data, including instructions for Meta app users.',
};

const LAST_UPDATED = 'June 20, 2026';

export default function DataDeletionPage() {
  return (
    <LegalPageLayout title="User Data Deletion" lastUpdated={LAST_UPDATED}>
      <section>
        <h2>Overview</h2>
        <p>
          stratum (stratumielts.com) is operated by {LEGAL_COMPANY_NAME}. This page explains how
          you can request deletion of personal data we hold about you.
        </p>
      </section>

      <section>
        <h2>Delete your stratum account</h2>
        <p>
          If you created an account on stratumielts.com, email us from your registered address at{' '}
          <a href={`mailto:${SUPPORT_EMAIL}`} className="text-indigo-600 dark:text-indigo-400 hover:underline">
            {SUPPORT_EMAIL}
          </a>{' '}
          with the subject line <strong>Data deletion request</strong>.
        </p>
        <p>Include the email address linked to your account. We will confirm your request and delete:</p>
        <ul className="list-disc pl-6 space-y-1 my-3">
          <li>Your account profile (name and email)</li>
          <li>Essays and AI feedback stored in your history</li>
          <li>Credit balance and usage records tied to your account</li>
          <li>Authentication and session data</li>
        </ul>
        <p>
          We complete verified deletion requests within <strong>30 days</strong>. Some records may be
          retained longer only where required by law (e.g. billing or fraud prevention).
        </p>
      </section>

      <section>
        <h2>Facebook Page followers</h2>
        <p>
          Our Meta app is used to publish content to the stratum Facebook Page. If you only follow or
          interact with that Page and have <strong>not</strong> registered on stratumielts.com, we do
          not store your personal data in our application. To manage data held by Meta on Facebook,
          use{' '}
          <a
            href="https://www.facebook.com/help/delete_account"
            className="text-indigo-600 dark:text-indigo-400 hover:underline"
            rel="noopener noreferrer"
            target="_blank"
          >
            Meta&apos;s account and data settings
          </a>
          .
        </p>
      </section>

      <section>
        <h2>Telegram</h2>
        <p>
          If you use our Telegram bot or channel, message history in Telegram is governed by
          Telegram&apos;s policies. To stop receiving messages, leave the channel or block the bot in
          your Telegram app.
        </p>
      </section>

      <section>
        <h2>Contact</h2>
        <p>
          Questions about data deletion? Email{' '}
          <a href={`mailto:${SUPPORT_EMAIL}`} className="text-indigo-600 dark:text-indigo-400 hover:underline">
            {SUPPORT_EMAIL}
          </a>{' '}
          or{' '}
          <a href={SUPPORT_PHONE_TEL} className="text-indigo-600 dark:text-indigo-400 hover:underline">
            {CONTACT_SUPPORT_LABEL}
          </a>
          . See also our{' '}
          <a href="/privacy" className="text-indigo-600 dark:text-indigo-400 hover:underline">
            Privacy Policy
          </a>
          .
        </p>
      </section>
    </LegalPageLayout>
  );
}
