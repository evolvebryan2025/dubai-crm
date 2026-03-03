import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Profile, Lead } from "@/types/database";
import type { UserRole } from "@/types/enums";
import { PageHeader } from "@/components/shared/page-header";
import { LeadForm } from "@/components/leads/lead-form";
import { updateLead } from "../actions";

export const dynamic = "force-dynamic";

export default async function EditLeadPage({
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

  const { data: leadRaw } = await supabase
    .from("leads")
    .select("*")
    .eq("id", id)
    .single();

  const lead = leadRaw as Lead | null;
  if (!lead) notFound();

  const { data: agentsRaw } = await supabase
    .from("profiles")
    .select("id, full_name")
    .eq("is_active", true)
    .order("full_name");

  const agents = (agentsRaw ?? []) as Pick<Profile, "id" | "full_name">[];

  async function handleUpdate(formData: FormData) {
    "use server";
    return updateLead(id, formData);
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader title="Edit Lead" description={lead.full_name} />
      <LeadForm
        lead={lead}
        agents={agents}
        action={handleUpdate}
        isAdmin={isAdmin}
      />
    </div>
  );
}
