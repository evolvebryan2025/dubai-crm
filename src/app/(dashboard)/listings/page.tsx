import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import type { Profile, Listing } from "@/types/database";
import { PageHeader } from "@/components/shared/page-header";
import { ListingTable } from "@/components/listings/listing-table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export const dynamic = "force-dynamic";

type ListingWithAgent = Listing & {
  agent?: Pick<Profile, "full_name"> | null;
};

export default async function ListingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Fetch listings — RLS handles agent scoping
  const { data: rawListings } = await supabase
    .from("listings")
    .select("*, agent:profiles!listings_assigned_agent_id_fkey(full_name)")
    .order("created_at", { ascending: false });

  const listings = (rawListings ?? []) as ListingWithAgent[];

  const saleListings = listings.filter((l) => l.type === "sale");
  const rentListings = listings.filter((l) => l.type === "rent");

  return (
    <div className="space-y-6">
      <PageHeader title="Listings" description="Manage property listings">
        <Button asChild>
          <Link href="/listings/new">
            <Plus className="mr-2 h-4 w-4" />
            Add Listing
          </Link>
        </Button>
      </PageHeader>

      <Tabs defaultValue="sale">
        <TabsList>
          <TabsTrigger value="sale">
            For Sale ({saleListings.length})
          </TabsTrigger>
          <TabsTrigger value="rent">
            For Rent ({rentListings.length})
          </TabsTrigger>
        </TabsList>
        <TabsContent value="sale" className="mt-4">
          <ListingTable listings={saleListings} />
        </TabsContent>
        <TabsContent value="rent" className="mt-4">
          <ListingTable listings={rentListings} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
