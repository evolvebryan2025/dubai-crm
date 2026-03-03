"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useUser } from "@/hooks/use-user";
import { NAV_ITEMS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
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
  Menu,
} from "lucide-react";
import { useState } from "react";

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

export function MobileNav() {
  const pathname = usePathname();
  const { role } = useUser();
  const [open, setOpen] = useState(false);

  if (!role) return null;

  const visibleItems = NAV_ITEMS.filter((item) => item.roles.includes(role));

  function isActive(href: string) {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="lg:hidden">
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-64 p-0">
        <div className="flex h-14 items-center border-b px-4">
          <Link
            href="/"
            className="flex items-center gap-2"
            onClick={() => setOpen(false)}
          >
            <Building2 className="h-5 w-5 text-primary" />
            <span className="text-sm font-semibold">Dubai CRM</span>
          </Link>
        </div>
        <nav className="space-y-1 p-3">
          {visibleItems.map((item) => {
            const Icon = ICON_MAP[item.icon];
            const active = isActive(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  active
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                {Icon && <Icon className="h-4 w-4 shrink-0" />}
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </SheetContent>
    </Sheet>
  );
}
