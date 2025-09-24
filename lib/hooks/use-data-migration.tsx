"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "./use-auth";
import { showErrorToast, showSuccessToast } from "@/lib/error-handling";
import type { TimerState } from "@/components/timer/pomodoro-timer";
import type { Task } from "@/components/tasks/task-card";

interface LocalPomodoroSession {
  id: string;
  taskId: string | null;
  sessionType: TimerState;
  durationMinutes: number;
  completedAt: string; // ISO string
}

interface LocalTask {
  id: string;
  title: string;
  description: string;
  estimatedPomodoros: number;
  completedPomodoros: number;
  status: "pending" | "in_progress" | "completed";
  createdAt: string; // ISO string
}

interface LocalSettings {
  workDuration: number;
  shortBreakDuration: number;
  longBreakDuration: number;
  autoStartBreaks: boolean;
  autoStartPomodoros: boolean;
  autoStartOnNavigation?: boolean;
  notificationsEnabled?: boolean;
  soundEnabled?: boolean;
  autoCheckCompletedTasks: boolean;
  cycleLength?: number;
}

export function useDataMigration() {
  const [isMigrating, setIsMigrating] = useState(false);
  const [migrationStatus, setMigrationStatus] = useState<{
    sessions: number;
    tasks: number;
    settings: boolean;
  } | null>(null);
  const { user } = useAuth();
  const supabase = createClient();

  // Load data from localStorage
  const loadLocalData = () => {
    if (typeof window === "undefined") return null;

    try {
      const sessionsData = localStorage.getItem("pomodoro_sessions");
      const tasksData = localStorage.getItem("pomodoro_tasks");
      const settingsData = localStorage.getItem("pomodoro_settings");

      return {
        sessions: sessionsData ? JSON.parse(sessionsData) as LocalPomodoroSession[] : [],
        tasks: tasksData ? JSON.parse(tasksData) as LocalTask[] : [],
        settings: settingsData ? JSON.parse(settingsData) as LocalSettings : null,
      };
    } catch (error) {
      console.error("Error loading local data:", error);
      return null;
    }
  };

  // Clear localStorage data after successful migration
  const clearLocalData = () => {
    if (typeof window === "undefined") return;
    try {
      localStorage.removeItem("pomodoro_sessions");
      localStorage.removeItem("pomodoro_tasks");
      localStorage.removeItem("pomodoro_settings");
    } catch (error) {
      console.error("Error clearing local data:", error);
    }
  };

  // Migrate sessions to database
  const migrateSessions = async (sessions: LocalPomodoroSession[]): Promise<number> => {
    if (!user || sessions.length === 0) return 0;

    try {
      const sessionsToInsert = sessions.map((session) => ({
        user_id: user.id,
        task_id: session.taskId,
        session_type: session.sessionType,
        duration_minutes: session.durationMinutes,
        completed_at: session.completedAt,
      }));

      const { error } = await supabase
        .from("pomodoro_sessions")
        .insert(sessionsToInsert);

      if (error) throw error;

      return sessions.length;
    } catch (error) {
      await showErrorToast(error, "migrate-sessions");
      return 0;
    }
  };

  // Migrate tasks to database
  const migrateTasks = async (tasks: LocalTask[]): Promise<number> => {
    if (!user || tasks.length === 0) return 0;

    try {
      const tasksToInsert = tasks.map((task) => ({
        user_id: user.id,
        title: task.title,
        description: task.description,
        estimated_pomodoros: task.estimatedPomodoros,
        completed_pomodoros: task.completedPomodoros,
        status: task.status,
        created_at: task.createdAt,
      }));

      const { error } = await supabase
        .from("tasks")
        .insert(tasksToInsert);

      if (error) throw error;

      return tasks.length;
    } catch (error) {
      await showErrorToast(error, "migrate-tasks");
      return 0;
    }
  };

  // Migrate settings to database
  const migrateSettings = async (settings: LocalSettings): Promise<boolean> => {
    if (!user || !settings) return false;

    try {
      const settingsPayload: Record<string, unknown> = {
        id: user.id,
        work_duration: settings.workDuration,
        short_break_duration: settings.shortBreakDuration,
        long_break_duration: settings.longBreakDuration,
        auto_start_breaks: settings.autoStartBreaks,
        auto_start_pomodoros: settings.autoStartPomodoros,
        auto_check_completed_tasks: settings.autoCheckCompletedTasks,
      };

      // Add optional fields if they exist
      if (typeof settings.autoStartOnNavigation !== "undefined") {
        settingsPayload.auto_start_on_navigation = settings.autoStartOnNavigation;
      }
      if (typeof settings.notificationsEnabled !== "undefined") {
        settingsPayload.notifications_enabled = settings.notificationsEnabled;
      }
      if (typeof settings.soundEnabled !== "undefined") {
        settingsPayload.sound_enabled = settings.soundEnabled;
      }
      if (typeof settings.cycleLength !== "undefined") {
        settingsPayload.cycle_length = settings.cycleLength;
      }

      // Calculate total completed pomodoros from sessions
      const workSessions = localStorage.getItem("pomodoro_sessions");
      if (workSessions) {
        try {
          const sessions = JSON.parse(workSessions) as LocalPomodoroSession[];
          const completedWorkSessions = sessions.filter(s => s.sessionType === "work").length;
          settingsPayload.total_completed_pomodoros = completedWorkSessions;
        } catch {
          // Ignore parsing errors
        }
      }

      const { error } = await supabase
        .from("user_settings")
        .upsert(settingsPayload, { onConflict: "id" });

      if (error) throw error;

      return true;
    } catch (error) {
      await showErrorToast(error, "migrate-settings");
      return false;
    }
  };

  // Main migration function
  const migrateData = async () => {
    if (!user || isMigrating) return;

    setIsMigrating(true);
    setMigrationStatus(null);

    try {
      const localData = loadLocalData();
      if (!localData) {
        setIsMigrating(false);
        return;
      }

      const { sessions, tasks, settings } = localData;

      // Migrate data in parallel
      const [migratedSessions, migratedTasks, migratedSettings] = await Promise.all([
        migrateSessions(sessions),
        migrateTasks(tasks),
        settings ? migrateSettings(settings) : Promise.resolve(false),
      ]);

      const status = {
        sessions: migratedSessions,
        tasks: migratedTasks,
        settings: migratedSettings,
      };

      setMigrationStatus(status);

      // Show success message
      const migratedItems = [];
      if (migratedSessions > 0) migratedItems.push(`${migratedSessions} sessions`);
      if (migratedTasks > 0) migratedItems.push(`${migratedTasks} tasks`);
      if (migratedSettings) migratedItems.push("settings");

      if (migratedItems.length > 0) {
        await showSuccessToast(
          `Successfully migrated ${migratedItems.join(", ")} to your account!`
        );
        
        // Clear local data after successful migration
        clearLocalData();
      }

    } catch (error) {
      await showErrorToast(error, "migrate-data");
    } finally {
      setIsMigrating(false);
    }
  };

  // Auto-migrate when user signs in (if they have local data)
  useEffect(() => {
    if (user && !isMigrating) {
      const localData = loadLocalData();
      if (localData && (
        localData.sessions.length > 0 || 
        localData.tasks.length > 0 || 
        localData.settings
      )) {
        // Auto-migrate silently
        migrateData();
      }
    }
  }, [user]);

  return {
    isMigrating,
    migrationStatus,
    migrateData,
  };
}
