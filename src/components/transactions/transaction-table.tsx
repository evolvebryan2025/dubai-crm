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
import type { Transaction, Profile, Listing } from "@/types/database";
import { Pencil } from "lucide-react";

type TransactionWithRelations = Transaction & {
  agent?: Pick<Profile, "full_name"> | null;
  listing?: Pick<Listing, "reference_no" | "title"> | null;
};

interface TransactionTableProps {
  transactions: TransactionWithRelations[];
}

const STATUS_VARIANT: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  pending: "outline",
  completed: "default",
  cancelled: "destructive",
};

function formatPrice(price: number) {
  return new Intl.NumberFormat("en-AE", {
    style: "currency",
    currency: "AED",
    maximumFractionDigits: 0,
  }).format(price);
}

export function TransactionTable({ transactions }: TransactionTableProps) {
  if (transactions.length === 0) {
    return (
      <div className="flex h-40 items-center justify-center rounded-lg border border-dashed text-sm text-muted-foreground">
        No transactions found
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Ref</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Listing</TableHead>
            <TableHead>Agent</TableHead>
            <TableHead>Deal Value</TableHead>
            <TableHead>Commission</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="w-10" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {transactions.map((txn) => (
            <TableRow key={txn.id}>
              <TableCell className="font-mono text-xs">
                {txn.reference_no}
              </TableCell>
              <TableCell className="capitalize">{txn.type}</TableCell>
              <TableCell className="text-sm">
                {txn.listing
                  ? `${txn.listing.reference_no}`
                  : "—"}
              </TableCell>
              <TableCell className="text-sm">
                {txn.agent?.full_name ?? "—"}
              </TableCell>
              <TableCell>{formatPrice(txn.deal_value)}</TableCell>
              <TableCell>{formatPrice(txn.commission_amount)}</TableCell>
              <TableCell className="text-sm">
                {new Date(txn.deal_date).toLocaleDateString("en-GB")}
              </TableCell>
              <TableCell>
                <Badge variant={STATUS_VARIANT[txn.status] ?? "secondary"}>
                  {txn.status.charAt(0).toUpperCase() + txn.status.slice(1)}
                </Badge>
              </TableCell>
              <TableCell>
                <Button variant="ghost" size="icon" asChild>
                  <Link href={`/transactions/${txn.id}`}>
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
