import TopicPageClient from './TopicPageClient';

export async function generateMetadata({ params }) {
  const p = await params;
  const id = p?.id;
  return {
    title: id ? `Topic ${id}` : 'Topic',
    description: 'IELTS Writing bank topic — STRATUM.ai',
  };
}

export default async function TopicPage({ params }) {
  const p = await params;
  const id = String(p?.id ?? '');
  return <TopicPageClient topicId={id} />;
}
