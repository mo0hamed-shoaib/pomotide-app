"use client";

import { createClient } from "@/lib/supabase/client";
import { useAuth } from "./use-auth";
import { showErrorToast } from "@/lib/error-handling";
import type { TimerState } from "@/components/timer/pomodoro-timer";

interface PomodoroSession {
  id: string;
  taskId: string | null;
  sessionType: TimerState;
  durationMinutes: number;
  productivityRating?: number;
  completedAt: Date;
}

export function usePomodoroSessions() {
  const { user } = useAuth();
  const supabase = createClient();

  const STORAGE_KEY = "pomodoro_sessions";

  // Load sessions from localStorage
  const loadFromLocalStorage = (): PomodoroSession[] => {
    if (typeof window === "undefined") return [];
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  };

  // Save sessions to localStorage
  const saveToLocalStorage = (sessions: PomodoroSession[]) => {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
    } catch (error) {
      console.error("Error saving to localStorage:", error);
    }
  };

  const recordSession = async (
    taskId: string | null,
    sessionType: TimerState,
    durationMinutes: number
  ): Promise<number | null> => {
    if (!user) {
      const newSession: PomodoroSession = {
        id: `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        taskId,
        sessionType,
        durationMinutes,
        completedAt: new Date(),
      };
      const sessions = loadFromLocalStorage();
      const updatedSessions = [newSession, ...sessions];
      saveToLocalStorage(updatedSessions);
      // Return local total completed work sessions
      const localTotal = updatedSessions.filter(
        (s) => s.sessionType === "work"
      ).length;
      return localTotal;
    }

    try {
      const { error } = await supabase.from("pomodoro_sessions").insert({
        user_id: user.id,
        task_id: taskId,
        session_type: sessionType,
        duration_minutes: durationMinutes,
      });

      if (error) throw error;

      // If this was a completed work session, increment the user's total completed pomodoros and return the updated total
      if (sessionType === "work") {
        try {
          // Read current total (if the column exists)
          const { data: settingsData, error: settingsError } = await supabase
            .from("user_settings")
            .select("total_completed_pomodoros")
            .eq("id", user.id)
            .single();

          const current = !settingsError
            ? (settingsData as { total_completed_pomodoros?: number })?.total_completed_pomodoros ?? 0
            : 0;

          const { data: updatedData, error: incError } = await supabase
            .from("user_settings")
            .update({ total_completed_pomodoros: current + 1 })
            .eq("id", user.id)
            .select("total_completed_pomodoros")
            .single();

          if (incError) throw incError;

          return (updatedData as { total_completed_pomodoros?: number })?.total_completed_pomodoros ?? current + 1;
        } catch (err) {
          await showErrorToast(err, "increment-total-pomodoros");
          return null;
        }
      }

      return null;
    } catch (error) {
      await showErrorToast(error, "record-session");
      return null;
    }
  };

  const getSessionStats = async (
    timeRange: "week" | "month" | "year" = "week"
  ) => {
    if (!user) {
      const sessions = loadFromLocalStorage();
      const startDate = new Date();
      switch (timeRange) {
        case "week":
          startDate.setDate(startDate.getDate() - 7);
          break;
        case "month":
          startDate.setMonth(startDate.getMonth() - 1);
          break;
        case "year":
          startDate.setFullYear(startDate.getFullYear() - 1);
          break;
      }

      return sessions.filter(
        (session) => new Date(session.completedAt) >= startDate
      );
    }

    try {
      const startDate = new Date();
      switch (timeRange) {
        case "week":
          startDate.setDate(startDate.getDate() - 7);
          break;
        case "month":
          startDate.setMonth(startDate.getMonth() - 1);
          break;
        case "year":
          startDate.setFullYear(startDate.getFullYear() - 1);
          break;
      }

      const { data, error } = await supabase
        .from("pomodoro_sessions")
        .select("*")
        .eq("user_id", user.id)
        .gte("completed_at", startDate.toISOString())
        .order("completed_at", { ascending: true });

      if (error) throw error;

      return data;
    } catch (error) {
      await showErrorToast(error, "fetch-session-stats");
      return null;
    }
  };

  return {
    recordSession,
    getSessionStats,
  };
}
