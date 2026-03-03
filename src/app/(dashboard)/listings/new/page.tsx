import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/types/database";
import { PageHeader } from "@/components/shared/page-header";
import { ListingForm } from "@/components/listings/listing-form";
import { createListing } from "../actions";

export const dynamic = "force-dynamic";

export default async function NewListingPage() {
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
      <PageHeader title="New Listing" description="Add a new property listing" />
      <ListingForm agents={agents} action={createListing} />
    </div>
  );
}
