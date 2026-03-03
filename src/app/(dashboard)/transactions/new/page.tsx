import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { UserRole } from "@/types/enums";
import type { Profile, Listing } from "@/types/database";
import { PageHeader } from "@/components/shared/page-header";
import { TransactionForm } from "@/components/transactions/transaction-form";
import { createTransaction } from "../actions";

export const dynamic = "force-dynamic";

export default async function NewTransactionPage() {
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

  const [{ data: agentsRaw }, { data: listingsRaw }] = await Promise.all([
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

  const agents = (agentsRaw ?? []) as Pick<Profile, "id" | "full_name">[];
  const listings = (listingsRaw ?? []) as Pick<Listing, "id" | "reference_no" | "title">[];

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader title="New Transaction" description="Record a new deal" />
      <TransactionForm agents={agents} listings={listings} action={createTransaction} />
    </div>
  );
}
