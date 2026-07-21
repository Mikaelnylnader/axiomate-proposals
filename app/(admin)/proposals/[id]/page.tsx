import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { getProposal } from "@/lib/proposal/service";
import { createAdminClient } from "@/lib/supabase/admin";
import { ProposalDetail } from "@/components/admin/proposal-detail";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ProposalPage({ params }: PageProps) {
  await requireAdmin();
  const { id } = await params;

  let proposal;
  try {
    proposal = await getProposal(id);
  } catch {
    notFound();
  }

  // Load acceptance data for admin signature
  const supabase = createAdminClient();
  const { data: acceptance } = await supabase
    .from("acceptances")
    .select("*")
    .eq("proposal_id", id)
    .maybeSingle();

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const publicLink = `${appUrl}/p/${proposal.public_token}`;

  return (
    <ProposalDetail
      proposal={proposal}
      publicLink={publicLink}
      acceptance={acceptance}
    />
  );
}
