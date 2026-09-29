/**
 * Block common disposable / throwaway email domains so users cannot
 * register with a mailbox they do not control long-term.
 */

const DISPOSABLE_DOMAINS = new Set(
  [
    'mailinator.com',
    'guerrillamail.com',
    'guerrillamail.de',
    'sharklasers.com',
    'grr.la',
    'tempmail.com',
    'temp-mail.org',
    'temp-mail.io',
    '10minutemail.com',
    '10minutemail.net',
    'yopmail.com',
    'trashmail.com',
    'trashmail.me',
    'discard.email',
    'discardmail.com',
    'getnada.com',
    'nada.email',
    'emailondeck.com',
    'fakeinbox.com',
    'maildrop.cc',
    'mailnesia.com',
    'mintemail.com',
    'moakt.com',
    'throwaway.email',
    'throwawaymail.com',
    'tmpmail.org',
    'tmpmail.net',
    'mailcatch.com',
    'inboxkitten.com',
    'spamgourmet.com',
    'mailnull.com',
    'spam4.me',
    'mytemp.email',
    'tempail.com',
    'tempr.email',
    'dispostable.com',
    'mail-temporaire.fr',
    'example.com',
    'example.org',
    'example.net',
    'test.com',
    'test.org',
    'localhost',
    'invalid',
    'localdomain',
  ].map((d) => d.toLowerCase())
);

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * @param {string} rawEmail
 * @returns {{ ok: true, email: string } | { ok: false, reason: string }}
 */
export function validateSignupEmail(rawEmail) {
  const email = String(rawEmail ?? '')
    .trim()
    .toLowerCase();
  if (!email || !EMAIL_RE.test(email)) {
    return { ok: false, reason: 'invalid' };
  }

  const domain = email.split('@')[1] || '';
  if (!domain || domain.includes('..') || domain.startsWith('.') || domain.endsWith('.')) {
    return { ok: false, reason: 'invalid' };
  }

  if (DISPOSABLE_DOMAINS.has(domain)) {
    return { ok: false, reason: 'disposable' };
  }

  // Block dotted TLD leftovers / clearly synthetic hosts
  if (
    domain.endsWith('.local') ||
    domain.endsWith('.test') ||
    domain.endsWith('.invalid') ||
    domain.endsWith('.example')
  ) {
    return { ok: false, reason: 'disposable' };
  }

  return { ok: true, email };
}

export function disposableEmailMessage(reason) {
  if (reason === 'disposable') {
    return 'Please use a real email address (temporary / disposable inboxes are not allowed).';
  }
  return 'Please enter a valid email address.';
}
