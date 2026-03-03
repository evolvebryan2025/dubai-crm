import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { UserRole } from "@/types/enums";
import { PageHeader } from "@/components/shared/page-header";
import { CsvUploader } from "@/components/bulk-database/csv-uploader";

export const dynamic = "force-dynamic";

export default async function UploadPage() {
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

  // Only admins can upload
  if (!isAdmin) redirect("/bulk-database");

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader title="Upload CSV" description="Import contacts from a CSV file" />
      <CsvUploader />
    </div>
  );
}
