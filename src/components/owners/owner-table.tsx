"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Owner, Profile } from "@/types/database";
import { Pencil } from "lucide-react";

interface OwnerTableProps {
  owners: (Owner & { agent?: Pick<Profile, "full_name"> | null })[];
}

export function OwnerTable({ owners }: OwnerTableProps) {
  if (owners.length === 0) {
    return (
      <div className="flex h-40 items-center justify-center rounded-lg border border-dashed text-sm text-muted-foreground">
        No owners found
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Owner</TableHead>
            <TableHead>Contact</TableHead>
            <TableHead>Property</TableHead>
            <TableHead>Area</TableHead>
            <TableHead>Purpose</TableHead>
            <TableHead>Assigned Agent</TableHead>
            <TableHead className="w-10" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {owners.map((owner) => (
            <TableRow key={owner.id}>
              <TableCell className="font-medium">{owner.full_name}</TableCell>
              <TableCell className="text-sm">
                {owner.phone || owner.email || "—"}
              </TableCell>
              <TableCell className="text-sm">
                {[owner.property_type, owner.building_name]
                  .filter(Boolean)
                  .join(" — ") || "—"}
              </TableCell>
              <TableCell>{owner.area || "—"}</TableCell>
              <TableCell>
                {owner.purpose ? (
                  <Badge variant="outline">
                    {owner.purpose.charAt(0).toUpperCase() +
                      owner.purpose.slice(1)}
                  </Badge>
                ) : (
                  "—"
                )}
              </TableCell>
              <TableCell className="text-sm">
                {owner.agent?.full_name ?? (
                  <span className="text-muted-foreground">Unassigned</span>
                )}
              </TableCell>
              <TableCell>
                <Button variant="ghost" size="icon" asChild>
                  <Link href={`/owners/${owner.id}`}>
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
