import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { CommissionApproval, Profile, Transaction } from "@/types/database";
import { PageHeader } from "@/components/shared/page-header";
import { CommissionTable } from "@/components/commissions/commission-table";

export const dynamic = "force-dynamic";

type CommissionWithRelations = CommissionApproval & {
  agent?: Pick<Profile, "full_name"> | null;
  transaction?: Pick<Transaction, "reference_no" | "deal_value" | "type"> | null;
};

export default async function CommissionsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: rawCommissions } = await supabase
    .from("commission_approvals")
    .select(
      "*, agent:profiles!commission_approvals_agent_id_fkey(full_name), transaction:transactions!commission_approvals_transaction_id_fkey(reference_no, deal_value, type)"
    )
    .order("created_at", { ascending: false });

  const commissions = (rawCommissions ?? []) as CommissionWithRelations[];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Commission Approvals"
        description="Review and approve agent commissions"
      />
      <CommissionTable commissions={commissions} />
    </div>
  );
}
