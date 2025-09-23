"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "./use-auth";

export interface UserSettings {
  workDuration: number;
  shortBreakDuration: number;
  longBreakDuration: number;
  autoStartBreaks: boolean;
  autoStartPomodoros: boolean;
  autoCheckCompletedTasks: boolean;
  cycleLength?: number;
}

const defaultSettings: UserSettings = {
  workDuration: 25,
  shortBreakDuration: 5,
  longBreakDuration: 15,
  autoStartBreaks: true,
  autoStartPomodoros: true,
  autoCheckCompletedTasks: false,
  cycleLength: 4,
};

export function useSettings() {
  const [settings, setSettings] = useState<UserSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const supabase = createClient();

  const STORAGE_KEY = "pomodoro_settings";

  // Load settings from localStorage
  const loadFromLocalStorage = (): UserSettings => {
    if (typeof window === "undefined") return defaultSettings;
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored
        ? { ...defaultSettings, ...JSON.parse(stored) }
        : defaultSettings;
    } catch {
      return defaultSettings;
    }
  };

  // Save settings to localStorage
  const saveToLocalStorage = (settings: UserSettings) => {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch (error) {
      console.error("Error saving to localStorage:", error);
    }
  };

  // Fetch settings from database or localStorage
  const fetchSettings = async () => {
    if (!user) {
      const localSettings = loadFromLocalStorage();
      setSettings(localSettings);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("user_settings")
        .select("*")
        .eq("id", user.id)
        .single();

      if (error) {
        // If no settings found, use defaults
        if (error.code === "PGRST116") {
          setSettings(defaultSettings);
        } else {
          throw error;
        }
      } else {
        setSettings({
          workDuration: data.work_duration,
          shortBreakDuration: data.short_break_duration,
          longBreakDuration: data.long_break_duration,
          autoStartBreaks: data.auto_start_breaks,
          autoStartPomodoros: data.auto_start_pomodoros,
          autoCheckCompletedTasks: data.auto_check_completed_tasks,
          cycleLength: data.cycle_length ?? defaultSettings.cycleLength,
        });
      }
    } catch (error) {
      console.error("Error fetching settings:", error);
      const localSettings = loadFromLocalStorage();
      setSettings(localSettings);
    } finally {
      setLoading(false);
    }
  };

  // Save settings to database or localStorage
  const saveSettings = async (newSettings: UserSettings) => {
    if (!user) {
      setSettings(newSettings);
      saveToLocalStorage(newSettings);
      return;
    }

    try {
      const { error } = await supabase
        .from("user_settings")
        .upsert({
          id: user.id,
          work_duration: newSettings.workDuration,
          short_break_duration: newSettings.shortBreakDuration,
          long_break_duration: newSettings.longBreakDuration,
          auto_start_breaks: newSettings.autoStartBreaks,
          auto_start_pomodoros: newSettings.autoStartPomodoros,
          auto_check_completed_tasks: newSettings.autoCheckCompletedTasks,
          cycle_length: newSettings.cycleLength ?? defaultSettings.cycleLength,
        })
        .eq("id", user.id);

      if (error) throw error;

      setSettings(newSettings);
    } catch (error) {
      console.error("Error saving settings:", error);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, [user]);

  return {
    settings,
    loading,
    saveSettings,
    refetch: fetchSettings,
  };
}
