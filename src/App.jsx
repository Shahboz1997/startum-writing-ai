/**
 * STRATUM.ai uses the Next.js App Router (`src/app/`), not a central React Router tree.
 *
 * Relevant routes:
 * - `/` — main app (`app/page.js`)
 * - `/topics/[id]` — Writing bank topic detail (`app/topics/[id]/page.js`)
 * - `GET /api/bank/topic/[id]` — topic JSON (`app/api/bank/topic/[id]/route.js`)
 */
export function topicDetailPath(id) {
  return `/topics/${id}`;
}
