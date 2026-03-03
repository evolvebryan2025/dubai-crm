"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  LEAD_STATUSES,
  LEAD_STATUS_LABELS,
  LEAD_SOURCE_LABELS,
} from "@/types/enums";
import type { LeadStatus, LeadSource } from "@/types/enums";
import type { Lead, Profile } from "@/types/database";
import { updateLeadStatus } from "@/app/(dashboard)/leads/actions";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Phone, Mail, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";

type LeadWithAgent = Lead & {
  agent?: Pick<Profile, "full_name"> | null;
};

interface LeadPipelineProps {
  leads: LeadWithAgent[];
}

const STATUS_COLOR: Record<string, string> = {
  new: "border-l-blue-500",
  contacted: "border-l-yellow-500",
  qualified: "border-l-purple-500",
  closed: "border-l-green-500",
  lost: "border-l-red-500",
};

function formatBudget(min: number | null, max: number | null) {
  const fmt = (n: number) =>
    new Intl.NumberFormat("en-AE", {
      style: "currency",
      currency: "AED",
      maximumFractionDigits: 0,
    }).format(n);

  if (min && max) return `${fmt(min)} – ${fmt(max)}`;
  if (min) return `From ${fmt(min)}`;
  if (max) return `Up to ${fmt(max)}`;
  return null;
}

export function LeadPipeline({ leads }: LeadPipelineProps) {
  async function handleStatusChange(id: string, newStatus: string) {
    const result = await updateLeadStatus(id, newStatus);
    if (result?.error) {
      toast.error(result.error);
    } else {
      toast.success(`Lead moved to ${LEAD_STATUS_LABELS[newStatus as LeadStatus]}`);
    }
  }

  return (
    <div className="grid gap-4 lg:grid-cols-5">
      {LEAD_STATUSES.map((status) => {
        const columnLeads = leads.filter((l) => l.status === status);
        return (
          <div key={status} className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold">
                {LEAD_STATUS_LABELS[status]}
              </h3>
              <Badge variant="secondary" className="text-xs">
                {columnLeads.length}
              </Badge>
            </div>
            <div className="space-y-2">
              {columnLeads.map((lead) => (
                <Card
                  key={lead.id}
                  className={`border-l-4 ${STATUS_COLOR[status] ?? ""}`}
                >
                  <CardContent className="p-3 space-y-2">
                    <div className="flex items-start justify-between">
                      <p className="text-sm font-medium">{lead.full_name}</p>
                      <Button variant="ghost" size="icon" className="h-6 w-6" asChild>
                        <Link href={`/leads/${lead.id}`}>
                          <Pencil className="h-3 w-3" />
                        </Link>
                      </Button>
                    </div>

                    {lead.phone && (
                      <p className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Phone className="h-3 w-3" />
                        {lead.phone}
                      </p>
                    )}
                    {lead.email && (
                      <p className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Mail className="h-3 w-3" />
                        {lead.email}
                      </p>
                    )}

                    {lead.source && (
                      <Badge variant="outline" className="text-xs">
                        {LEAD_SOURCE_LABELS[lead.source as LeadSource] ??
                          lead.source}
                      </Badge>
                    )}

                    {formatBudget(lead.budget_min, lead.budget_max) && (
                      <p className="text-xs text-muted-foreground">
                        {formatBudget(lead.budget_min, lead.budget_max)}
                      </p>
                    )}

                    {lead.agent?.full_name && (
                      <p className="text-xs text-muted-foreground">
                        Agent: {lead.agent.full_name}
                      </p>
                    )}

                    <Select
                      value={lead.status}
                      onValueChange={(val) =>
                        handleStatusChange(lead.id, val)
                      }
                    >
                      <SelectTrigger className="h-7 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {LEAD_STATUSES.map((s) => (
                          <SelectItem key={s} value={s}>
                            {LEAD_STATUS_LABELS[s]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </CardContent>
                </Card>
              ))}
              {columnLeads.length === 0 && (
                <div className="rounded-lg border border-dashed p-4 text-center text-xs text-muted-foreground">
                  No leads
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
