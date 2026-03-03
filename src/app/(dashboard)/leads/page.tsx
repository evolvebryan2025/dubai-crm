import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import type { Lead, Profile } from "@/types/database";
import { PageHeader } from "@/components/shared/page-header";
import { LeadPipeline } from "@/components/leads/lead-pipeline";
import { LeadTable } from "@/components/leads/lead-table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export const dynamic = "force-dynamic";

type LeadWithAgent = Lead & {
  agent?: Pick<Profile, "full_name"> | null;
};

export default async function LeadsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // RLS handles agent scoping
  const { data: rawLeads } = await supabase
    .from("leads")
    .select("*, agent:profiles!leads_assigned_agent_id_fkey(full_name)")
    .order("created_at", { ascending: false });

  const leads = (rawLeads ?? []) as LeadWithAgent[];

  return (
    <div className="space-y-6">
      <PageHeader title="Leads" description="Manage your leads pipeline">
        <Button asChild>
          <Link href="/leads/new">
            <Plus className="mr-2 h-4 w-4" />
            Add Lead
          </Link>
        </Button>
      </PageHeader>

      <Tabs defaultValue="pipeline">
        <TabsList>
          <TabsTrigger value="pipeline">Pipeline</TabsTrigger>
          <TabsTrigger value="table">Table View</TabsTrigger>
        </TabsList>
        <TabsContent value="pipeline" className="mt-4">
          <LeadPipeline leads={leads} />
        </TabsContent>
        <TabsContent value="table" className="mt-4">
          <LeadTable leads={leads} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
