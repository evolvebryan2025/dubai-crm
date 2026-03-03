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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Contact, Profile } from "@/types/database";
import { assignContactToAgent } from "@/app/(dashboard)/bulk-database/actions";
import { toast } from "sonner";

type ContactWithAgent = Contact & {
  agent?: Pick<Profile, "full_name"> | null;
};

interface ContactTableProps {
  contacts: ContactWithAgent[];
  agents: Pick<Profile, "id" | "full_name">[];
  isAdmin: boolean;
}

export function ContactTable({ contacts, agents, isAdmin }: ContactTableProps) {
  async function handleAssign(contactId: string, agentId: string) {
    const result = await assignContactToAgent(contactId, agentId);
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success("Contact assigned");
    }
  }

  if (contacts.length === 0) {
    return (
      <div className="flex h-40 items-center justify-center rounded-lg border border-dashed text-sm text-muted-foreground">
        No contacts found
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Phone</TableHead>
            <TableHead>Area Tags</TableHead>
            <TableHead>Notes</TableHead>
            <TableHead>Assigned Agent</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {contacts.map((contact) => (
            <TableRow key={contact.id}>
              <TableCell className="font-medium">{contact.full_name}</TableCell>
              <TableCell className="text-sm">{contact.phone || "—"}</TableCell>
              <TableCell>
                <div className="flex flex-wrap gap-1">
                  {(Array.isArray(contact.area_tags) ? contact.area_tags : []).map(
                    (tag, i) => (
                      <Badge key={i} variant="outline" className="text-xs">
                        {String(tag)}
                      </Badge>
                    )
                  )}
                  {(!contact.area_tags ||
                    (Array.isArray(contact.area_tags) &&
                      contact.area_tags.length === 0)) && (
                    <span className="text-sm text-muted-foreground">—</span>
                  )}
                </div>
              </TableCell>
              <TableCell className="text-sm max-w-[200px] truncate">
                {contact.notes || "—"}
              </TableCell>
              <TableCell>
                {isAdmin ? (
                  <Select
                    value={contact.assigned_agent_id ?? ""}
                    onValueChange={(val) => handleAssign(contact.id, val)}
                  >
                    <SelectTrigger className="h-8 w-[160px] text-xs">
                      <SelectValue placeholder="Assign agent" />
                    </SelectTrigger>
                    <SelectContent>
                      {agents.map((a) => (
                        <SelectItem key={a.id} value={a.id}>
                          {a.full_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <span className="text-sm">
                    {contact.agent?.full_name ?? "Unassigned"}
                  </span>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
