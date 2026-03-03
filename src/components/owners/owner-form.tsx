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
import { PROPERTY_TYPES, OWNER_PURPOSES } from "@/types/enums";
import { DUBAI_AREAS } from "@/lib/constants";
import type { Owner, Profile } from "@/types/database";
import { Loader2 } from "lucide-react";

interface OwnerFormProps {
  owner?: Owner | null;
  agents: Pick<Profile, "id" | "full_name">[];
  action: (formData: FormData) => Promise<{ error?: string } | void>;
}

export function OwnerForm({ owner, agents, action }: OwnerFormProps) {
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
          <CardTitle className="text-base">Owner Information</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="full_name">Owner Name *</Label>
            <Input
              id="full_name"
              name="full_name"
              defaultValue={owner?.full_name ?? ""}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Contact Number</Label>
            <Input
              id="phone"
              name="phone"
              defaultValue={owner?.phone ?? ""}
              placeholder="+971"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              defaultValue={owner?.email ?? ""}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="source">Source</Label>
            <Input
              id="source"
              name="source"
              defaultValue={owner?.source ?? ""}
              placeholder="e.g. Referral, Cold Call"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Property Details (Off-Market)</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="property_type">Property Type</Label>
            <Select
              name="property_type"
              defaultValue={owner?.property_type ?? ""}
            >
              <SelectTrigger id="property_type">
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                {PROPERTY_TYPES.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t.charAt(0).toUpperCase() + t.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="area">Area</Label>
            <Select name="area" defaultValue={owner?.area ?? ""}>
              <SelectTrigger id="area">
                <SelectValue placeholder="Select area" />
              </SelectTrigger>
              <SelectContent>
                {DUBAI_AREAS.map((a) => (
                  <SelectItem key={a} value={a}>
                    {a}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="building_name">Building / Address</Label>
            <Input
              id="building_name"
              name="building_name"
              defaultValue={owner?.building_name ?? ""}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="unit_number">Unit Number</Label>
            <Input
              id="unit_number"
              name="unit_number"
              defaultValue={owner?.unit_number ?? ""}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="bedrooms">Bedrooms</Label>
            <Input
              id="bedrooms"
              name="bedrooms"
              type="number"
              min="0"
              defaultValue={owner?.bedrooms ?? ""}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="bathrooms">Bathrooms</Label>
            <Input
              id="bathrooms"
              name="bathrooms"
              type="number"
              min="0"
              defaultValue={owner?.bathrooms ?? ""}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="size_sqft">Size (sqft)</Label>
            <Input
              id="size_sqft"
              name="size_sqft"
              type="number"
              min="0"
              defaultValue={owner?.size_sqft ?? ""}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="asking_price">Asking Price (AED)</Label>
            <Input
              id="asking_price"
              name="asking_price"
              type="number"
              min="0"
              defaultValue={owner?.asking_price ?? ""}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="purpose">Purpose</Label>
            <Select name="purpose" defaultValue={owner?.purpose ?? ""}>
              <SelectTrigger id="purpose">
                <SelectValue placeholder="Select" />
              </SelectTrigger>
              <SelectContent>
                {OWNER_PURPOSES.map((p) => (
                  <SelectItem key={p} value={p}>
                    {p.charAt(0).toUpperCase() + p.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="assigned_agent_id">Assign to Agent</Label>
            <Select
              name="assigned_agent_id"
              defaultValue={owner?.assigned_agent_id ?? ""}
            >
              <SelectTrigger id="assigned_agent_id">
                <SelectValue placeholder="None (admin only)" />
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

          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              name="notes"
              rows={3}
              defaultValue={owner?.notes ?? ""}
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-2">
        <Button type="submit" disabled={loading}>
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {owner ? "Update Owner" : "Add Owner"}
        </Button>
      </div>
    </form>
  );
}
