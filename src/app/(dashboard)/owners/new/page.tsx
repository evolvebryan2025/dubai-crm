import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/types/database";
import { PageHeader } from "@/components/shared/page-header";
import { OwnerForm } from "@/components/owners/owner-form";
import { createOwner } from "../actions";

export const dynamic = "force-dynamic";

export default async function NewOwnerPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: agentsRaw } = await supabase
    .from("profiles")
    .select("id, full_name")
    .eq("is_active", true)
    .order("full_name");

  const agents = (agentsRaw ?? []) as Pick<Profile, "id" | "full_name">[];

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader
        title="Add Owner"
        description="Register an off-market property owner"
      />
      <OwnerForm agents={agents} action={createOwner} />
    </div>
  );
}
