"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Profile } from "@/types/database";
import type { UserRole } from "@/types/enums";

export function useUser() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    async function fetchProfile() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setLoading(false);
        return;
      }

      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      setProfile(data as Profile | null);
      setLoading(false);
    }

    fetchProfile();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      fetchProfile();
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  return {
    profile,
    loading,
    role: (profile?.role as UserRole) ?? null,
    isAdmin: profile?.role === "super_admin" || profile?.role === "admin",
    isSuperAdmin: profile?.role === "super_admin",
    isFinance: profile?.role === "finance",
    isAgent: profile?.role === "agent",
  };
}
