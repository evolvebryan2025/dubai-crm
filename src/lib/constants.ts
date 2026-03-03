import type { UserRole } from "@/types/enums";

// Routes each role lands on after login
export const ROLE_REDIRECT: Record<UserRole, string> = {
  super_admin: "/",
  admin: "/",
  finance: "/transactions",
  agent: "/",
};

// Sidebar navigation items with role-based visibility
export type NavItem = {
  label: string;
  href: string;
  icon: string; // Lucide icon name
  roles: UserRole[]; // Which roles can see this item
};

export const NAV_ITEMS: NavItem[] = [
  {
    label: "Dashboard",
    href: "/",
    icon: "LayoutDashboard",
    roles: ["super_admin", "admin", "finance", "agent"],
  },
  {
    label: "Listings",
    href: "/listings",
    icon: "Building2",
    roles: ["super_admin", "admin", "agent"],
  },
  {
    label: "Owner List",
    href: "/owners",
    icon: "Users",
    roles: ["super_admin", "admin", "agent"],
  },
  {
    label: "Leads",
    href: "/leads",
    icon: "UserPlus",
    roles: ["super_admin", "admin", "agent"],
  },
  {
    label: "Bulk Database",
    href: "/bulk-database",
    icon: "Database",
    roles: ["super_admin", "admin", "agent"],
  },
  {
    label: "Transactions",
    href: "/transactions",
    icon: "Receipt",
    roles: ["super_admin", "admin", "finance", "agent"],
  },
  {
    label: "Commissions",
    href: "/commissions",
    icon: "BadgeDollarSign",
    roles: ["super_admin", "admin", "finance", "agent"],
  },
  {
    label: "Reports",
    href: "/reports",
    icon: "BarChart3",
    roles: ["super_admin", "admin"],
  },
  {
    label: "Activity Log",
    href: "/activity-log",
    icon: "ScrollText",
    roles: ["super_admin", "admin"],
  },
  {
    label: "Settings",
    href: "/settings",
    icon: "Settings",
    roles: ["super_admin"],
  },
];

// Dubai-specific area list
export const DUBAI_AREAS = [
  "Abu Dhabi Gate City",
  "Al Barsha",
  "Al Furjan",
  "Al Nahda",
  "Al Quoz",
  "Al Reem Island",
  "Arabian Ranches",
  "Barsha Heights (TECOM)",
  "Business Bay",
  "City Walk",
  "DAMAC Hills",
  "DIFC",
  "Discovery Gardens",
  "Downtown Dubai",
  "Dubai Creek Harbour",
  "Dubai Hills Estate",
  "Dubai Investment Park",
  "Dubai Marina",
  "Dubai Production City",
  "Dubai Silicon Oasis",
  "Dubai South",
  "Dubai Sports City",
  "Emirates Hills",
  "International City",
  "JBR",
  "Jumeirah",
  "Jumeirah Lake Towers (JLT)",
  "Jumeirah Village Circle (JVC)",
  "Jumeirah Village Triangle (JVT)",
  "Meydan",
  "MBR City",
  "Motor City",
  "Palm Jumeirah",
  "Sobha Hartland",
  "The Greens",
  "The Springs",
  "The Views",
  "Town Square",
  "Zabeel",
] as const;
