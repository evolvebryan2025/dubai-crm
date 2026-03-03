import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Profile, Owner } from "@/types/database";
import { PageHeader } from "@/components/shared/page-header";
import { OwnerForm } from "@/components/owners/owner-form";
import { updateOwner } from "../actions";

export const dynamic = "force-dynamic";

export default async function EditOwnerPage({
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

  const { data: ownerRaw } = await supabase
    .from("owners")
    .select("*")
    .eq("id", id)
    .single();

  const owner = ownerRaw as Owner | null;
  if (!owner) notFound();

  const { data: agentsRaw } = await supabase
    .from("profiles")
    .select("id, full_name")
    .eq("is_active", true)
    .order("full_name");

  const agents = (agentsRaw ?? []) as Pick<Profile, "id" | "full_name">[];

  async function handleUpdate(formData: FormData) {
    "use server";
    return updateOwner(id, formData);
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader
        title="Edit Owner"
        description={owner.full_name}
      />
      <OwnerForm owner={owner} agents={agents} action={handleUpdate} />
    </div>
  );
}
