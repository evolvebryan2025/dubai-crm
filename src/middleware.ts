import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";
import { ROLE_REDIRECT } from "@/lib/constants";
import type { UserRole } from "@/types/enums";

export async function middleware(request: NextRequest) {
  const { supabaseResponse, user, supabase } = await updateSession(request);
  const { pathname } = request.nextUrl;

  // Public routes that don't require auth
  const isAuthRoute = pathname.startsWith("/login") || pathname.startsWith("/forgot-password");

  if (!user && !isAuthRoute) {
    // Not logged in and trying to access protected route → redirect to login
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  if (user && isAuthRoute) {
    // Already logged in and on auth page → redirect to role-based dashboard
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    const role = (profile?.role as UserRole) || "agent";
    const url = request.nextUrl.clone();
    url.pathname = ROLE_REDIRECT[role];
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    // Match all routes except static files and API routes
    "/((?!_next/static|_next/image|favicon.ico|api/webhooks|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
