"use client";

import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { ActivityLog, Profile } from "@/types/database";

type ActivityLogWithUser = ActivityLog & {
  user?: Pick<Profile, "full_name" | "email"> | null;
};

interface ActivityTableProps {
  logs: ActivityLogWithUser[];
}

const ACTION_LABELS: Record<string, string> = {
  login: "Login",
  listing_created: "Listing Created",
  listing_updated: "Listing Updated",
  listing_deleted: "Listing Deleted",
  listing_published: "Listing Published",
  lead_created: "Lead Created",
  lead_updated: "Lead Updated",
  lead_status_changed: "Lead Status Changed",
  lead_deleted: "Lead Deleted",
  owner_created: "Owner Created",
  owner_updated: "Owner Updated",
  owner_deleted: "Owner Deleted",
  transaction_created: "Transaction Created",
  commission_owner_approved: "Commission Approved",
  commission_finance_cleared: "Commission Cleared",
  commission_rejected: "Commission Rejected",
  csv_upload: "CSV Upload",
  contacts_uploaded: "Contacts Uploaded",
  contact_assigned: "Contact Assigned",
  batch_assigned: "Batch Assigned",
};

const ACTION_VARIANT: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  login: "outline",
  listing_created: "default",
  listing_deleted: "destructive",
  lead_created: "default",
  lead_deleted: "destructive",
  transaction_created: "default",
  commission_rejected: "destructive",
  commission_finance_cleared: "default",
};

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function ActivityTable({ logs }: ActivityTableProps) {
  if (logs.length === 0) {
    return (
      <div className="flex h-40 items-center justify-center rounded-lg border border-dashed text-sm text-muted-foreground">
        No activity logs found
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Timestamp</TableHead>
            <TableHead>User</TableHead>
            <TableHead>Action</TableHead>
            <TableHead>Entity</TableHead>
            <TableHead>Details</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {logs.map((log) => (
            <TableRow key={log.id}>
              <TableCell className="whitespace-nowrap text-xs">
                {formatDate(log.created_at)}
              </TableCell>
              <TableCell className="text-sm">
                {log.user?.full_name ?? log.user?.email ?? "System"}
              </TableCell>
              <TableCell>
                <Badge
                  variant={ACTION_VARIANT[log.action] ?? "secondary"}
                >
                  {ACTION_LABELS[log.action] ?? log.action}
                </Badge>
              </TableCell>
              <TableCell className="text-sm capitalize">
                {log.entity_type?.replace(/_/g, " ") ?? "—"}
              </TableCell>
              <TableCell className="max-w-[200px] truncate text-xs text-muted-foreground">
                {log.metadata && typeof log.metadata === "object"
                  ? JSON.stringify(log.metadata)
                  : "—"}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
