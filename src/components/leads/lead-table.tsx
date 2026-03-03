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
import {
  LEAD_STATUS_LABELS,
  LEAD_SOURCE_LABELS,
} from "@/types/enums";
import type { LeadStatus, LeadSource } from "@/types/enums";
import type { Lead, Profile } from "@/types/database";
import { Pencil } from "lucide-react";

type LeadWithAgent = Lead & {
  agent?: Pick<Profile, "full_name"> | null;
};

interface LeadTableProps {
  leads: LeadWithAgent[];
}

const STATUS_VARIANT: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  new: "default",
  contacted: "outline",
  qualified: "secondary",
  closed: "default",
  lost: "destructive",
};

export function LeadTable({ leads }: LeadTableProps) {
  if (leads.length === 0) {
    return (
      <div className="flex h-40 items-center justify-center rounded-lg border border-dashed text-sm text-muted-foreground">
        No leads found
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Contact</TableHead>
            <TableHead>Source</TableHead>
            <TableHead>Interest</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Agent</TableHead>
            <TableHead className="w-10" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {leads.map((lead) => (
            <TableRow key={lead.id}>
              <TableCell className="font-medium">{lead.full_name}</TableCell>
              <TableCell className="text-sm">
                {lead.phone || lead.email || "—"}
              </TableCell>
              <TableCell className="text-sm">
                {lead.source
                  ? LEAD_SOURCE_LABELS[lead.source as LeadSource] ?? lead.source
                  : "—"}
              </TableCell>
              <TableCell className="text-sm">
                {[
                  lead.property_type
                    ? lead.property_type.charAt(0).toUpperCase() +
                      lead.property_type.slice(1)
                    : null,
                  lead.purpose === "buy"
                    ? "Buy"
                    : lead.purpose === "rent"
                      ? "Rent"
                      : null,
                ]
                  .filter(Boolean)
                  .join(" / ") || "—"}
              </TableCell>
              <TableCell>
                <Badge
                  variant={STATUS_VARIANT[lead.status] ?? "secondary"}
                >
                  {LEAD_STATUS_LABELS[lead.status as LeadStatus] ??
                    lead.status}
                </Badge>
              </TableCell>
              <TableCell className="text-sm">
                {lead.agent?.full_name ?? (
                  <span className="text-muted-foreground">Unassigned</span>
                )}
              </TableCell>
              <TableCell>
                <Button variant="ghost" size="icon" asChild>
                  <Link href={`/leads/${lead.id}`}>
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
