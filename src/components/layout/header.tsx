"use client";

import { UserMenu } from "./user-menu";
import { MobileNav } from "./mobile-nav";

export function Header() {
  return (
    <header className="flex h-14 items-center justify-between border-b bg-card px-4 lg:px-6">
      <div className="flex items-center gap-2">
        <MobileNav />
      </div>
      <div className="flex items-center gap-2">
        <UserMenu />
      </div>
    </header>
  );
}
