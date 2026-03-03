import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Profile, Listing } from "@/types/database";
import { PageHeader } from "@/components/shared/page-header";
import { ListingForm } from "@/components/listings/listing-form";
import { updateListing } from "../actions";

export const dynamic = "force-dynamic";

export default async function EditListingPage({
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

  const { data: listingRaw } = await supabase
    .from("listings")
    .select("*")
    .eq("id", id)
    .single();

  const listing = listingRaw as Listing | null;
  if (!listing) notFound();

  const { data: agentsRaw } = await supabase
    .from("profiles")
    .select("id, full_name")
    .eq("is_active", true)
    .order("full_name");

  const agents = (agentsRaw ?? []) as Pick<Profile, "id" | "full_name">[];

  async function handleUpdate(formData: FormData) {
    "use server";
    return updateListing(id, formData);
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader
        title="Edit Listing"
        description={`Ref: ${listing.reference_no}`}
      />
      <ListingForm listing={listing} agents={agents} action={handleUpdate} />
    </div>
  );
}
