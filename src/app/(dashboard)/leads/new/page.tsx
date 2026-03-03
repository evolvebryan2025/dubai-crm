import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/types/database";
import type { UserRole } from "@/types/enums";
import { PageHeader } from "@/components/shared/page-header";
import { LeadForm } from "@/components/leads/lead-form";
import { createLead } from "../actions";

export const dynamic = "force-dynamic";

export default async function NewLeadPage() {
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

  const { data: agentsRaw } = await supabase
    .from("profiles")
    .select("id, full_name")
    .eq("is_active", true)
    .order("full_name");

  const agents = (agentsRaw ?? []) as Pick<Profile, "id" | "full_name">[];

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader title="New Lead" description="Add a new lead" />
      <LeadForm agents={agents} action={createLead} isAdmin={isAdmin} />
    </div>
  );
}
