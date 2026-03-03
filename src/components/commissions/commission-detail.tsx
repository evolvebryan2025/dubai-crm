"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  approveCommission,
  financeCleared,
  rejectCommission,
} from "@/app/(dashboard)/commissions/actions";
import { toast } from "sonner";
import { Loader2, CheckCircle, XCircle, Clock } from "lucide-react";

interface CommissionDetailProps {
  approval: {
    id: string;
    status: string;
    commission_amount: number;
    owner_approved_at: string | null;
    owner_approved_by: string | null;
    owner_notes: string | null;
    finance_cleared_at: string | null;
    finance_cleared_by: string | null;
    finance_notes: string | null;
    rejected_at: string | null;
    rejected_by: string | null;
    rejection_reason: string | null;
    created_at: string;
  };
  transaction: {
    reference_no: string;
    type: string;
    deal_value: number;
    deal_date: string;
  };
  agentName: string;
  role: string;
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

function formatDate(dateStr: string | null) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function CommissionDetail({
  approval,
  transaction,
  agentName,
  role,
}: CommissionDetailProps) {
  const router = useRouter();
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);

  const isAdmin = role === "super_admin" || role === "admin";
  const isFinance = role === "finance";
  const canApprove = isAdmin && approval.status === "pending";
  const canFinanceClear =
    (isFinance || isAdmin) && approval.status === "owner_approved";
  const canReject =
    (isAdmin || isFinance) &&
    (approval.status === "pending" || approval.status === "owner_approved");

  async function handleApprove() {
    setLoading(true);
    const result = await approveCommission(approval.id, notes || null);
    if (result.error) {
      toast.error(result.error);
      setLoading(false);
    } else {
      toast.success("Commission approved by owner");
      router.refresh();
      setLoading(false);
    }
  }

  async function handleFinanceClear() {
    setLoading(true);
    const result = await financeCleared(approval.id, notes || null);
    if (result.error) {
      toast.error(result.error);
      setLoading(false);
    } else {
      toast.success("Commission cleared by finance");
      router.refresh();
      setLoading(false);
    }
  }

  async function handleReject() {
    if (!notes.trim()) {
      toast.error("Please provide a rejection reason");
      return;
    }
    setLoading(true);
    const result = await rejectCommission(approval.id, notes);
    if (result.error) {
      toast.error(result.error);
      setLoading(false);
    } else {
      toast.success("Commission rejected");
      router.refresh();
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Deal Summary</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className="text-sm text-muted-foreground">Transaction</p>
            <p className="font-mono text-sm font-medium">
              {transaction.reference_no}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Type</p>
            <p className="text-sm font-medium capitalize">{transaction.type}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Deal Value</p>
            <p className="text-sm font-medium">
              {formatPrice(transaction.deal_value)}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Commission</p>
            <p className="text-sm font-medium">
              {formatPrice(approval.commission_amount)}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Agent</p>
            <p className="text-sm font-medium">{agentName}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Deal Date</p>
            <p className="text-sm font-medium">
              {new Date(transaction.deal_date).toLocaleDateString("en-GB")}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Status</p>
            <Badge variant={STATUS_VARIANT[approval.status] ?? "secondary"}>
              {STATUS_LABELS[approval.status] ?? approval.status}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Approval Timeline */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Approval Timeline</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start gap-3">
            <Clock className="mt-0.5 h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">Created</p>
              <p className="text-xs text-muted-foreground">
                {formatDate(approval.created_at)}
              </p>
            </div>
          </div>

          <Separator />

          <div className="flex items-start gap-3">
            {approval.owner_approved_at ? (
              <CheckCircle className="mt-0.5 h-4 w-4 text-green-600" />
            ) : (
              <Clock className="mt-0.5 h-4 w-4 text-muted-foreground" />
            )}
            <div>
              <p className="text-sm font-medium">Owner Approval</p>
              <p className="text-xs text-muted-foreground">
                {approval.owner_approved_at
                  ? formatDate(approval.owner_approved_at)
                  : "Pending"}
              </p>
              {approval.owner_notes && (
                <p className="mt-1 text-xs text-muted-foreground">
                  Notes: {approval.owner_notes}
                </p>
              )}
            </div>
          </div>

          <Separator />

          <div className="flex items-start gap-3">
            {approval.finance_cleared_at ? (
              <CheckCircle className="mt-0.5 h-4 w-4 text-green-600" />
            ) : approval.rejected_at ? (
              <XCircle className="mt-0.5 h-4 w-4 text-destructive" />
            ) : (
              <Clock className="mt-0.5 h-4 w-4 text-muted-foreground" />
            )}
            <div>
              <p className="text-sm font-medium">Finance Clearance</p>
              <p className="text-xs text-muted-foreground">
                {approval.finance_cleared_at
                  ? formatDate(approval.finance_cleared_at)
                  : approval.rejected_at
                    ? `Rejected — ${formatDate(approval.rejected_at)}`
                    : "Pending"}
              </p>
              {approval.finance_notes && (
                <p className="mt-1 text-xs text-muted-foreground">
                  Notes: {approval.finance_notes}
                </p>
              )}
              {approval.rejection_reason && (
                <p className="mt-1 text-xs text-destructive">
                  Reason: {approval.rejection_reason}
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action buttons */}
      {(canApprove || canFinanceClear || canReject) && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Notes / Reason</Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={
                  canReject
                    ? "Required for rejection..."
                    : "Optional notes..."
                }
                rows={3}
              />
            </div>
            <div className="flex gap-2">
              {canApprove && (
                <Button onClick={handleApprove} disabled={loading}>
                  {loading && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Approve (Owner)
                </Button>
              )}
              {canFinanceClear && (
                <Button onClick={handleFinanceClear} disabled={loading}>
                  {loading && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Clear (Finance)
                </Button>
              )}
              {canReject && (
                <Button
                  variant="destructive"
                  onClick={handleReject}
                  disabled={loading}
                >
                  {loading && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Reject
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
