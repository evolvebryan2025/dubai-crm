"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";

const ACTION_OPTIONS = [
  { value: "all", label: "All Actions" },
  { value: "login", label: "Login" },
  { value: "listing_created", label: "Listing Created" },
  { value: "listing_updated", label: "Listing Updated" },
  { value: "listing_deleted", label: "Listing Deleted" },
  { value: "lead_created", label: "Lead Created" },
  { value: "lead_updated", label: "Lead Updated" },
  { value: "lead_status_changed", label: "Lead Status Changed" },
  { value: "transaction_created", label: "Transaction Created" },
  { value: "commission_owner_approved", label: "Commission Approved" },
  { value: "commission_finance_cleared", label: "Commission Cleared" },
  { value: "commission_rejected", label: "Commission Rejected" },
  { value: "contacts_uploaded", label: "CSV Upload" },
];

export function ActivityFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const currentAction = searchParams.get("action") ?? "all";
  const currentFrom = searchParams.get("from") ?? "";
  const currentTo = searchParams.get("to") ?? "";

  function applyFilters(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value && value !== "all") {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    router.push(`/activity-log?${params.toString()}`);
  }

  function clearFilters() {
    router.push("/activity-log");
  }

  return (
    <Card>
      <CardContent className="flex flex-wrap items-end gap-4 pt-6">
        <div className="space-y-2">
          <Label>Action Type</Label>
          <Select
            value={currentAction}
            onValueChange={(v) => applyFilters("action", v)}
          >
            <SelectTrigger className="w-[200px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ACTION_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>From Date</Label>
          <Input
            type="date"
            value={currentFrom}
            onChange={(e) => applyFilters("from", e.target.value)}
            className="w-[160px]"
          />
        </div>

        <div className="space-y-2">
          <Label>To Date</Label>
          <Input
            type="date"
            value={currentTo}
            onChange={(e) => applyFilters("to", e.target.value)}
            className="w-[160px]"
          />
        </div>

        <Button variant="outline" onClick={clearFilters}>
          Clear
        </Button>
      </CardContent>
    </Card>
  );
}
