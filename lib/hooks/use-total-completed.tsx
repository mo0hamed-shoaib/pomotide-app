"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "./use-auth";

export function useTotalCompleted() {
  const { user } = useAuth();
  const supabase = createClient();
  const [total, setTotal] = useState<number | null>(null);
  const STORAGE_KEY = "pomotide_total_completed";

  const loadLocal = useCallback(() => {
    if (typeof window === "undefined") return null;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? parseInt(raw, 10) : null;
    } catch {
      return null;
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      if (!user) {
        const local = loadLocal();
        setTotal(local);
        return;
      }

      try {
        const { data, error } = await supabase
          .from("user_settings")
          .select("total_completed_pomodoros")
          .eq("id", user.id)
          .single();

        if (error) throw error;

        const val = (data as any)?.total_completed_pomodoros ?? 0;
        setTotal(val);
        try {
          localStorage.setItem(STORAGE_KEY, String(val));
        } catch {}
      } catch (err) {
        console.error("Error loading total completed:", err);
        const local = loadLocal();
        setTotal(local);
      }
    };

    init();
  }, [user, loadLocal, supabase]);

  const refresh = async () => {
    if (!user) {
      const local = loadLocal();
      setTotal(local);
      return local;
    }

    try {
      const { data, error } = await supabase
        .from("user_settings")
        .select("total_completed_pomodoros")
        .eq("id", user.id)
        .single();

      if (error) throw error;

      const val = (data as any)?.total_completed_pomodoros ?? 0;
      setTotal(val);
      try {
        localStorage.setItem(STORAGE_KEY, String(val));
      } catch {}
      return val;
    } catch (err) {
      console.error("Error refreshing total completed:", err);
      return null;
    }
  };

  return {
    total,
    refresh,
    setTotal,
  };
}
