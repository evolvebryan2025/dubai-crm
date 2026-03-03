import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import type { Contact, Profile, UserRole } from "@/types";
import { PageHeader } from "@/components/shared/page-header";
import { ContactTable } from "@/components/bulk-database/contact-table";
import { Button } from "@/components/ui/button";
import { Upload } from "lucide-react";

export const dynamic = "force-dynamic";

type ContactWithAgent = Contact & {
  agent?: Pick<Profile, "full_name"> | null;
};

export default async function BulkDatabasePage() {
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

  // RLS handles scoping
  const { data: rawContacts } = await supabase
    .from("contacts")
    .select("*, agent:profiles!contacts_assigned_agent_id_fkey(full_name)")
    .order("created_at", { ascending: false })
    .limit(200);

  const contacts = (rawContacts ?? []) as ContactWithAgent[];

  const { data: agentsRaw } = await supabase
    .from("profiles")
    .select("id, full_name")
    .eq("is_active", true)
    .order("full_name");

  const agents = (agentsRaw ?? []) as Pick<Profile, "id" | "full_name">[];

  return (
    <div className="space-y-6">
      <PageHeader title="Bulk Database" description="Uploaded contacts from CSV">
        {isAdmin && (
          <Button asChild>
            <Link href="/bulk-database/upload">
              <Upload className="mr-2 h-4 w-4" />
              Upload CSV
            </Link>
          </Button>
        )}
      </PageHeader>

      <ContactTable contacts={contacts} agents={agents} isAdmin={isAdmin} />
    </div>
  );
}
