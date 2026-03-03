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
import type { CommissionApproval, Profile, Transaction } from "@/types/database";
import { Eye } from "lucide-react";

type CommissionWithRelations = CommissionApproval & {
  agent?: Pick<Profile, "full_name"> | null;
  transaction?: Pick<Transaction, "reference_no" | "deal_value" | "type"> | null;
};

interface CommissionTableProps {
  commissions: CommissionWithRelations[];
}

const STATUS_VARIANT: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  pending: "outline",
  owner_approved: "secondary",
  finance_cleared: "default",
  rejected: "destructive",
};

const STATUS_LABELS: Record<string, string> = {
  pending: "Pending",
  owner_approved: "Owner Approved",
  finance_cleared: "Finance Cleared",
  rejected: "Rejected",
};

function formatPrice(price: number) {
  return new Intl.NumberFormat("en-AE", {
    style: "currency",
    currency: "AED",
    maximumFractionDigits: 0,
  }).format(price);
}

export function CommissionTable({ commissions }: CommissionTableProps) {
  if (commissions.length === 0) {
    return (
      <div className="flex h-40 items-center justify-center rounded-lg border border-dashed text-sm text-muted-foreground">
        No commission records found
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Transaction</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Agent</TableHead>
            <TableHead>Deal Value</TableHead>
            <TableHead>Commission</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="w-10" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {commissions.map((c) => (
            <TableRow key={c.id}>
              <TableCell className="font-mono text-xs">
                {c.transaction?.reference_no ?? "—"}
              </TableCell>
              <TableCell className="capitalize">
                {c.transaction?.type ?? "—"}
              </TableCell>
              <TableCell className="text-sm">
                {c.agent?.full_name ?? "—"}
              </TableCell>
              <TableCell>
                {c.transaction?.deal_value
                  ? formatPrice(c.transaction.deal_value)
                  : "—"}
              </TableCell>
              <TableCell>{formatPrice(c.commission_amount)}</TableCell>
              <TableCell>
                <Badge variant={STATUS_VARIANT[c.status] ?? "secondary"}>
                  {STATUS_LABELS[c.status] ?? c.status}
                </Badge>
              </TableCell>
              <TableCell>
                <Button variant="ghost" size="icon" asChild>
                  <Link href={`/commissions/${c.id}`}>
                    <Eye className="h-4 w-4" />
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
