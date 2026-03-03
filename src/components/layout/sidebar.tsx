"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useUser } from "@/hooks/use-user";
import { NAV_ITEMS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import {
  Building2,
  LayoutDashboard,
  Users,
  UserPlus,
  Database,
  Receipt,
  BadgeDollarSign,
  BarChart3,
  ScrollText,
  Settings,
  ChevronLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useState } from "react";

// Map icon name strings to actual Lucide components
const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  LayoutDashboard,
  Building2,
  Users,
  UserPlus,
  Database,
  Receipt,
  BadgeDollarSign,
  BarChart3,
  ScrollText,
  Settings,
};

interface SidebarProps {
  className?: string;
}

export function Sidebar({ className }: SidebarProps) {
  const pathname = usePathname();
  const { role, loading } = useUser();
  const [collapsed, setCollapsed] = useState(false);

  if (loading || !role) {
    return (
      <aside
        className={cn(
          "flex h-screen w-64 flex-col border-r bg-card",
          className
        )}
      >
        <div className="flex h-14 items-center border-b px-4">
          <div className="h-5 w-32 animate-pulse rounded bg-muted" />
        </div>
        <nav className="flex-1 space-y-1 p-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="h-9 animate-pulse rounded-md bg-muted"
            />
          ))}
        </nav>
      </aside>
    );
  }

  // Filter nav items based on user role
  const visibleItems = NAV_ITEMS.filter((item) => item.roles.includes(role));

  function isActive(href: string) {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  }

  return (
    <aside
      className={cn(
        "flex h-screen flex-col border-r bg-card transition-all duration-200",
        collapsed ? "w-16" : "w-64",
        className
      )}
    >
      {/* Logo / Brand */}
      <div className="flex h-14 items-center justify-between border-b px-4">
        {!collapsed && (
          <Link href="/" className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" />
            <span className="text-sm font-semibold">Dubai CRM</span>
          </Link>
        )}
        {collapsed && (
          <Link href="/" className="mx-auto">
            <Building2 className="h-5 w-5 text-primary" />
          </Link>
        )}
        <Button
          variant="ghost"
          size="icon"
          className={cn("h-7 w-7 shrink-0", collapsed && "mx-auto")}
          onClick={() => setCollapsed(!collapsed)}
        >
          <ChevronLeft
            className={cn(
              "h-4 w-4 transition-transform",
              collapsed && "rotate-180"
            )}
          />
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        {visibleItems.map((item) => {
          const Icon = ICON_MAP[item.icon];
          const active = isActive(item.href);

          const linkContent = (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
                collapsed && "justify-center px-2"
              )}
            >
              {Icon && <Icon className="h-4 w-4 shrink-0" />}
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );

          if (collapsed) {
            return (
              <Tooltip key={item.href} delayDuration={0}>
                <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
                <TooltipContent side="right" className="font-normal">
                  {item.label}
                </TooltipContent>
              </Tooltip>
            );
          }

          return linkContent;
        })}
      </nav>
    </aside>
  );
}
