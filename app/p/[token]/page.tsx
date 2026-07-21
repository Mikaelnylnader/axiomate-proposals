import { notFound } from "next/navigation";
import { getPublicProposal, recordProposalView } from "@/lib/proposal/public";
import { PublicProposalView } from "@/components/proposal/public-view";

interface PageProps {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ payment?: string }>;
}

export default async function PublicProposalPage({
  params,
  searchParams,
}: PageProps) {
  const { token } = await params;
  const sp = await searchParams;

  const proposal = await getPublicProposal(token);
  if (!proposal) notFound();

  // Record the view (fire-and-forget, don't block render)
  recordProposalView(token).catch(() => {});

  return (
    <PublicProposalView
      proposal={proposal}
      token={token}
      paymentCancelled={sp.payment === "cancelled"}
    />
  );
}
