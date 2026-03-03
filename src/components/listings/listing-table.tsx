"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { LISTING_STATUS_LABELS } from "@/types/enums";
import type { ListingStatus } from "@/types/enums";
import type { Listing, Profile } from "@/types/database";
import { togglePublish } from "@/app/(dashboard)/listings/actions";
import { toast } from "sonner";
import { Pencil } from "lucide-react";

interface ListingTableProps {
  listings: (Listing & { agent?: Pick<Profile, "full_name"> | null })[];
}

const STATUS_VARIANT: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  active: "default",
  draft: "secondary",
  under_offer: "outline",
  sold: "destructive",
  rented: "destructive",
  archived: "secondary",
};

function formatPrice(price: number) {
  return new Intl.NumberFormat("en-AE", {
    style: "currency",
    currency: "AED",
    maximumFractionDigits: 0,
  }).format(price);
}

export function ListingTable({ listings }: ListingTableProps) {
  async function handleToggle(id: string, checked: boolean) {
    const result = await togglePublish(id, checked);
    if (result?.error) {
      toast.error(result.error);
    } else {
      toast.success(checked ? "Listing published" : "Listing unpublished");
    }
  }

  if (listings.length === 0) {
    return (
      <div className="flex h-40 items-center justify-center rounded-lg border border-dashed text-sm text-muted-foreground">
        No listings found
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Ref</TableHead>
            <TableHead>Property</TableHead>
            <TableHead>Area</TableHead>
            <TableHead>Price</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Agent</TableHead>
            <TableHead>Published</TableHead>
            <TableHead className="w-10" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {listings.map((listing) => (
            <TableRow key={listing.id}>
              <TableCell className="font-mono text-xs">
                {listing.reference_no}
              </TableCell>
              <TableCell className="font-medium">{listing.title}</TableCell>
              <TableCell>{listing.area}</TableCell>
              <TableCell>{formatPrice(listing.price)}</TableCell>
              <TableCell>
                <Badge variant={STATUS_VARIANT[listing.status] ?? "secondary"}>
                  {LISTING_STATUS_LABELS[listing.status as ListingStatus] ??
                    listing.status}
                </Badge>
              </TableCell>
              <TableCell className="text-sm">
                {listing.agent?.full_name ?? "—"}
              </TableCell>
              <TableCell>
                <Switch
                  checked={listing.is_published}
                  onCheckedChange={(checked) =>
                    handleToggle(listing.id, checked)
                  }
                />
              </TableCell>
              <TableCell>
                <Button variant="ghost" size="icon" asChild>
                  <Link href={`/listings/${listing.id}`}>
                    <Pencil className="h-4 w-4" />
                  </Link>
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
