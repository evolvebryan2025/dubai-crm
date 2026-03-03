import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import type { Profile, Listing, Transaction } from "@/types/database";
import { PageHeader } from "@/components/shared/page-header";
import { TransactionTable } from "@/components/transactions/transaction-table";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export const dynamic = "force-dynamic";

type TransactionWithRelations = Transaction & {
  agent?: Pick<Profile, "full_name"> | null;
  listing?: Pick<Listing, "reference_no" | "title"> | null;
};

export default async function TransactionsPage() {
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

  const role = (profileRaw as { role: string } | null)?.role ?? "agent";
  const isAdmin = role === "super_admin" || role === "admin";

  const { data: rawTransactions } = await supabase
    .from("transactions")
    .select(
      "*, agent:profiles!transactions_agent_id_fkey(full_name), listing:listings!transactions_listing_id_fkey(reference_no, title)"
    )
    .order("created_at", { ascending: false });

  const transactions = (rawTransactions ?? []) as TransactionWithRelations[];

  return (
    <div className="space-y-6">
      <PageHeader title="Transactions" description="Manage deals and transactions">
        {isAdmin && (
          <Button asChild>
            <Link href="/transactions/new">
              <Plus className="mr-2 h-4 w-4" />
              New Transaction
            </Link>
          </Button>
        )}
      </PageHeader>
      <TransactionTable transactions={transactions} />
    </div>
  );
}
