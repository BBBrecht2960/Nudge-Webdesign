import QuoteBuilderClient from './QuoteBuilderClient';

export default async function QuoteBuilderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <QuoteBuilderClient leadId={id} />;
}
