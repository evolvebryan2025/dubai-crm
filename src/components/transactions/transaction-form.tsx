"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Transaction, Profile, Listing } from "@/types/database";
import { Loader2 } from "lucide-react";

interface TransactionFormProps {
  transaction?: Transaction | null;
  agents: Pick<Profile, "id" | "full_name">[];
  listings: Pick<Listing, "id" | "reference_no" | "title">[];
  action: (formData: FormData) => Promise<{ error?: string } | void>;
}

export function TransactionForm({
  transaction,
  agents,
  listings,
  action,
}: TransactionFormProps) {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(formData: FormData) {
    setError(null);
    setLoading(true);
    const result = await action(formData);
    if (result?.error) {
      setError(result.error);
      setLoading(false);
    }
  }

  return (
    <form action={handleSubmit} className="space-y-6">
      {error && (
        <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Deal Information</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="type">Type *</Label>
            <Select name="type" defaultValue={transaction?.type ?? "sale"}>
              <SelectTrigger id="type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="sale">Sale</SelectItem>
                <SelectItem value="rent">Rental</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="listing_id">Linked Listing</Label>
            <Select
              name="listing_id"
              defaultValue={transaction?.listing_id ?? "none"}
            >
              <SelectTrigger id="listing_id">
                <SelectValue placeholder="Select listing" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No linked listing</SelectItem>
                {listings.map((l) => (
                  <SelectItem key={l.id} value={l.id}>
                    {l.reference_no} — {l.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="agent_id">Agent *</Label>
            <Select
              name="agent_id"
              defaultValue={transaction?.agent_id ?? ""}
            >
              <SelectTrigger id="agent_id">
                <SelectValue placeholder="Select agent" />
              </SelectTrigger>
              <SelectContent>
                {agents.map((a) => (
                  <SelectItem key={a.id} value={a.id}>
                    {a.full_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="deal_date">Deal Date *</Label>
            <Input
              id="deal_date"
              name="deal_date"
              type="date"
              defaultValue={
                transaction?.deal_date
                  ? transaction.deal_date.split("T")[0]
                  : new Date().toISOString().split("T")[0]
              }
              required
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Financial Details</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="deal_value">Deal Value (AED) *</Label>
            <Input
              id="deal_value"
              name="deal_value"
              type="number"
              min="0"
              step="0.01"
              defaultValue={transaction?.deal_value ?? ""}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="commission_pct">Commission %</Label>
            <Input
              id="commission_pct"
              name="commission_pct"
              type="number"
              min="0"
              max="100"
              step="0.01"
              defaultValue={transaction?.commission_pct ?? ""}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="commission_amount">Commission Amount (AED) *</Label>
            <Input
              id="commission_amount"
              name="commission_amount"
              type="number"
              min="0"
              step="0.01"
              defaultValue={transaction?.commission_amount ?? ""}
              required
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Notes</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            id="notes"
            name="notes"
            rows={3}
            placeholder="Additional notes about this transaction..."
            defaultValue={transaction?.notes ?? ""}
          />
        </CardContent>
      </Card>

      <div className="flex justify-end gap-2">
        <Button type="submit" disabled={loading}>
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {transaction ? "Update Transaction" : "Create Transaction"}
        </Button>
      </div>
    </form>
  );
}
