"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { USER_ROLES, ROLE_LABELS } from "@/types/enums";
import type { UserRole } from "@/types/enums";
import type { Profile, Team } from "@/types/database";
import {
  createTeam,
  deleteTeam,
  assignUserToTeam,
  updateUserRole,
  toggleUserActive,
  updateCompanySetting,
} from "@/app/(dashboard)/settings/actions";
import { toast } from "sonner";
import { Loader2, Trash2, Plus } from "lucide-react";

interface SettingsPanelProps {
  teams: Team[];
  users: Pick<Profile, "id" | "full_name" | "email" | "role" | "team_id" | "is_active">[];
  companySettings: Record<string, string>;
}

export function SettingsPanel({ teams, users, companySettings }: SettingsPanelProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [companyName, setCompanyName] = useState(companySettings.company_name || "");
  const [companyLogo, setCompanyLogo] = useState(companySettings.company_logo || "");

  // --- Team Management ---
  async function handleCreateTeam(formData: FormData) {
    setLoading(true);
    const result = await createTeam(formData);
    if (result.error) toast.error(result.error);
    else {
      toast.success("Team created");
      router.refresh();
    }
    setLoading(false);
  }

  async function handleDeleteTeam(teamId: string) {
    setLoading(true);
    const result = await deleteTeam(teamId);
    if (result.error) toast.error(result.error);
    else {
      toast.success("Team deleted");
      router.refresh();
    }
    setLoading(false);
  }

  async function handleAssignTeam(userId: string, teamId: string) {
    const result = await assignUserToTeam(userId, teamId === "none" ? null : teamId);
    if (result.error) toast.error(result.error);
    else {
      toast.success("Team updated");
      router.refresh();
    }
  }

  async function handleRoleChange(userId: string, role: string) {
    const result = await updateUserRole(userId, role as UserRole);
    if (result.error) toast.error(result.error);
    else {
      toast.success("Role updated");
      router.refresh();
    }
  }

  async function handleToggleActive(userId: string, checked: boolean) {
    const result = await toggleUserActive(userId, checked);
    if (result.error) toast.error(result.error);
    else {
      toast.success(checked ? "User activated" : "User deactivated");
      router.refresh();
    }
  }

  async function handleSaveCompany() {
    setLoading(true);
    if (companyName) {
      await updateCompanySetting("company_name", companyName);
    }
    if (companyLogo) {
      await updateCompanySetting("company_logo", companyLogo);
    }
    toast.success("Company settings saved");
    setLoading(false);
  }

  return (
    <div className="space-y-8">
      {/* Section 1: Team Management */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Team Management</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <form action={handleCreateTeam} className="flex items-end gap-3">
            <div className="flex-1 space-y-2">
              <Label htmlFor="team-name">Team Name</Label>
              <Input id="team-name" name="name" placeholder="e.g. Sales Team A" required />
            </div>
            <div className="flex-1 space-y-2">
              <Label htmlFor="team-desc">Description</Label>
              <Input id="team-desc" name="description" placeholder="Optional" />
            </div>
            <Button type="submit" disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="mr-1 h-4 w-4" />}
              Add
            </Button>
          </form>

          {teams.length === 0 && (
            <p className="text-sm text-muted-foreground">No teams created yet.</p>
          )}

          {teams.length > 0 && (
            <div className="overflow-x-auto rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Team</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Members</TableHead>
                    <TableHead className="w-10" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {teams.map((team) => {
                    const memberCount = users.filter((u) => u.team_id === team.id).length;
                    return (
                      <TableRow key={team.id}>
                        <TableCell className="font-medium">{team.name}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {team.description || "—"}
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">{memberCount}</Badge>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteTeam(team.id)}
                            disabled={loading}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Separator />

      {/* Section 2: Role Assignment & User Management */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Users & Roles</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Team</TableHead>
                  <TableHead>Active</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell className="font-medium">{u.full_name}</TableCell>
                    <TableCell className="text-sm">{u.email}</TableCell>
                    <TableCell>
                      <Select
                        value={u.role}
                        onValueChange={(v) => handleRoleChange(u.id, v)}
                      >
                        <SelectTrigger className="w-[140px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {USER_ROLES.map((r) => (
                            <SelectItem key={r} value={r}>
                              {ROLE_LABELS[r]}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Select
                        value={u.team_id ?? "none"}
                        onValueChange={(v) => handleAssignTeam(u.id, v)}
                      >
                        <SelectTrigger className="w-[160px]">
                          <SelectValue placeholder="No team" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">No team</SelectItem>
                          {teams.map((t) => (
                            <SelectItem key={t.id} value={t.id}>
                              {t.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Switch
                        checked={u.is_active}
                        onCheckedChange={(checked) =>
                          handleToggleActive(u.id, checked)
                        }
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Separator />

      {/* Section 3: Integrations */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Integrations</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[
            { name: "Property Finder", key: "property_finder" },
            { name: "Bayut", key: "bayut" },
            { name: "WhatsApp", key: "whatsapp" },
          ].map((integration) => (
            <div
              key={integration.key}
              className="flex items-center justify-between rounded-lg border p-4"
            >
              <div>
                <p className="font-medium">{integration.name}</p>
                <p className="text-sm text-muted-foreground">
                  Portal integration for listing syndication
                </p>
              </div>
              <Badge variant="outline" className="text-muted-foreground">
                Not Connected
              </Badge>
            </div>
          ))}
          <p className="text-xs text-muted-foreground">
            Integration connections will be configured via n8n workflows.
          </p>
        </CardContent>
      </Card>

      <Separator />

      {/* Section 4: Company Profile */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Company Profile</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="company-name">Company Name</Label>
              <Input
                id="company-name"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="e.g. Dubai Properties LLC"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="company-logo">Logo URL (for watermark)</Label>
              <Input
                id="company-logo"
                value={companyLogo}
                onChange={(e) => setCompanyLogo(e.target.value)}
                placeholder="https://example.com/logo.png"
              />
            </div>
          </div>
          {companyLogo && (
            <div className="space-y-2">
              <Label>Preview</Label>
              <div className="flex h-20 w-40 items-center justify-center rounded-md border bg-muted p-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={companyLogo}
                  alt="Company logo"
                  className="max-h-full max-w-full object-contain"
                />
              </div>
            </div>
          )}
          <Button onClick={handleSaveCompany} disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Company Settings
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
