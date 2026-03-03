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
import { PROPERTY_TYPES, LISTING_STATUSES, LISTING_STATUS_LABELS, FURNISHED_OPTIONS } from "@/types/enums";
import { DUBAI_AREAS } from "@/lib/constants";
import type { Listing, Profile } from "@/types/database";
import { Loader2 } from "lucide-react";

interface ListingFormProps {
  listing?: Listing | null;
  agents: Pick<Profile, "id" | "full_name">[];
  action: (formData: FormData) => Promise<{ error?: string } | void>;
}

export function ListingForm({ listing, agents, action }: ListingFormProps) {
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
          <CardTitle className="text-base">Basic Information</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="title">Property Name *</Label>
            <Input
              id="title"
              name="title"
              defaultValue={listing?.title ?? ""}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="type">Listing Type *</Label>
            <Select name="type" defaultValue={listing?.type ?? "sale"}>
              <SelectTrigger id="type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="sale">For Sale</SelectItem>
                <SelectItem value="rent">For Rent</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="property_type">Property Type *</Label>
            <Select
              name="property_type"
              defaultValue={listing?.property_type ?? "apartment"}
            >
              <SelectTrigger id="property_type">
                <SelectValue />
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
            <Label htmlFor="status">Status</Label>
            <Select name="status" defaultValue={listing?.status ?? "draft"}>
              <SelectTrigger id="status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LISTING_STATUSES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {LISTING_STATUS_LABELS[s]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="assigned_agent_id">Assigned Agent</Label>
            <Select
              name="assigned_agent_id"
              defaultValue={listing?.assigned_agent_id ?? ""}
            >
              <SelectTrigger id="assigned_agent_id">
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
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Location</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="area">Area *</Label>
            <Select name="area" defaultValue={listing?.area ?? ""}>
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
            <Label htmlFor="community">Community</Label>
            <Input
              id="community"
              name="community"
              defaultValue={listing?.community ?? ""}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="building_name">Building / Developer</Label>
            <Input
              id="building_name"
              name="building_name"
              defaultValue={listing?.building_name ?? ""}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="unit_number">Unit Number</Label>
            <Input
              id="unit_number"
              name="unit_number"
              defaultValue={listing?.unit_number ?? ""}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Details & Pricing</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="price">Price (AED) *</Label>
            <Input
              id="price"
              name="price"
              type="number"
              min="0"
              step="0.01"
              defaultValue={listing?.price ?? ""}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="bedrooms">Bedrooms</Label>
            <Input
              id="bedrooms"
              name="bedrooms"
              type="number"
              min="0"
              defaultValue={listing?.bedrooms ?? ""}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="bathrooms">Bathrooms</Label>
            <Input
              id="bathrooms"
              name="bathrooms"
              type="number"
              min="0"
              defaultValue={listing?.bathrooms ?? ""}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="size_sqft">Size (sqft)</Label>
            <Input
              id="size_sqft"
              name="size_sqft"
              type="number"
              min="0"
              defaultValue={listing?.size_sqft ?? ""}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="furnished">Furnished</Label>
            <Select
              name="furnished"
              defaultValue={listing?.furnished ?? ""}
            >
              <SelectTrigger id="furnished">
                <SelectValue placeholder="Select" />
              </SelectTrigger>
              <SelectContent>
                {FURNISHED_OPTIONS.map((f) => (
                  <SelectItem key={f} value={f}>
                    {f.charAt(0).toUpperCase() + f.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="parking_spaces">Parking Spaces</Label>
            <Input
              id="parking_spaces"
              name="parking_spaces"
              type="number"
              min="0"
              defaultValue={listing?.parking_spaces ?? 0}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="permit_number">Permit Number</Label>
            <Input
              id="permit_number"
              name="permit_number"
              defaultValue={listing?.permit_number ?? ""}
            />
          </div>

          <div className="space-y-2 sm:col-span-3">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              name="description"
              rows={4}
              defaultValue={listing?.description ?? ""}
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-2">
        <Button type="submit" disabled={loading}>
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {listing ? "Update Listing" : "Create Listing"}
        </Button>
      </div>
    </form>
  );
}
