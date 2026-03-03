import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { UserRole } from "@/types/enums";
import type { Profile, Listing, Transaction } from "@/types/database";
import { PageHeader } from "@/components/shared/page-header";
import { TransactionForm } from "@/components/transactions/transaction-form";
import { updateTransaction } from "../actions";

export const dynamic = "force-dynamic";

export default async function EditTransactionPage({
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
  const isAdmin = role === "super_admin" || role === "admin";
  if (!isAdmin) redirect("/transactions");

  const [{ data: txnRaw }, { data: agentsRaw }, { data: listingsRaw }] =
    await Promise.all([
      supabase.from("transactions").select("*").eq("id", id).single(),
      supabase
        .from("profiles")
        .select("id, full_name")
        .eq("role", "agent")
        .eq("is_active", true)
        .order("full_name"),
      supabase
        .from("listings")
        .select("id, reference_no, title")
        .in("status", ["active", "under_offer"])
        .order("reference_no"),
    ]);

  if (!txnRaw) notFound();

  const transaction = txnRaw as Transaction;
  const agents = (agentsRaw ?? []) as Pick<Profile, "id" | "full_name">[];
  const listings = (listingsRaw ?? []) as Pick<Listing, "id" | "reference_no" | "title">[];

  async function handleUpdate(formData: FormData) {
    "use server";
    return updateTransaction(id, formData);
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader
        title="Edit Transaction"
        description={`Ref: ${transaction.reference_no}`}
      />
      <TransactionForm
        transaction={transaction}
        agents={agents}
        listings={listings}
        action={handleUpdate}
      />
    </div>
  );
}
