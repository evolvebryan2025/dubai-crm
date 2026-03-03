import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { UserRole } from "@/types/enums";
import type { CommissionApproval, Transaction, Profile } from "@/types/database";
import { PageHeader } from "@/components/shared/page-header";
import { CommissionDetail } from "@/components/commissions/commission-detail";

export const dynamic = "force-dynamic";

export default async function CommissionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profileRaw } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  const role = (profileRaw?.role as UserRole) ?? "agent";

  // Fetch approval with transaction + agent
  const { data: approvalRaw } = await supabase
    .from("commission_approvals")
    .select("*")
    .eq("id", id)
    .single();

  if (!approvalRaw) notFound();
  const approval = approvalRaw as CommissionApproval;

  // Fetch transaction
  const { data: txnRaw } = await supabase
    .from("transactions")
    .select("reference_no, type, deal_value, deal_date")
    .eq("id", approval.transaction_id)
    .single();

  const transaction = (txnRaw as Pick<
    Transaction,
    "reference_no" | "type" | "deal_value" | "deal_date"
  >) ?? {
    reference_no: "—",
    type: "sale",
    deal_value: 0,
    deal_date: "",
  };

  // Fetch agent name
  const { data: agentRaw } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", approval.agent_id)
    .single();

  const agentName = (agentRaw as Pick<Profile, "full_name"> | null)?.full_name ?? "Unknown";

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader
        title="Commission Detail"
        description={`Transaction: ${transaction.reference_no}`}
      />
      <CommissionDetail
        approval={approval}
        transaction={transaction}
        agentName={agentName}
        role={role}
      />
    </div>
  );
}
