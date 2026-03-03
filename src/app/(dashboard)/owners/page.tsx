import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import type { Owner, Profile } from "@/types/database";
import { PageHeader } from "@/components/shared/page-header";
import { OwnerTable } from "@/components/owners/owner-table";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export const dynamic = "force-dynamic";

type OwnerWithAgent = Owner & {
  agent?: Pick<Profile, "full_name"> | null;
};

export default async function OwnersPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // RLS handles visibility: admin sees all, agent sees only assigned
  const { data: rawOwners } = await supabase
    .from("owners")
    .select("*, agent:profiles!owners_assigned_agent_id_fkey(full_name)")
    .order("created_at", { ascending: false });

  const owners = (rawOwners ?? []) as OwnerWithAgent[];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Owner List"
        description="Off-market properties from owners"
      >
        <Button asChild>
          <Link href="/owners/new">
            <Plus className="mr-2 h-4 w-4" />
            Add Owner
          </Link>
        </Button>
      </PageHeader>

      <OwnerTable owners={owners} />
    </div>
  );
}
