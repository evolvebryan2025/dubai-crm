"use client";

import { useUser } from "@/hooks/use-user";
import type { UserRole } from "@/types/enums";

interface RoleGateProps {
  allowedRoles: UserRole[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function RoleGate({ allowedRoles, children, fallback = null }: RoleGateProps) {
  const { role, loading } = useUser();

  if (loading) return null;
  if (!role || !allowedRoles.includes(role)) return <>{fallback}</>;

  return <>{children}</>;
}
