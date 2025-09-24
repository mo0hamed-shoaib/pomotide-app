"use client";

import { useState, useEffect, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "./use-auth";
import { useTasks } from "./use-tasks";
import { showErrorToast } from "@/lib/error-handling";

export interface SessionData {
  id: string;
  sessionType: "work" | "short_break" | "long_break";
  durationMinutes: number;
  productivityRating?: number;
  completedAt: Date;
  taskId?: string;
  taskTitle?: string;
}

export interface StatisticsData {
  totalSessions: number;
  totalWorkSessions: number;
  totalHours: number;
  totalMinutes: number;
  averageProductivity: number;
  sessionsByDay: Array<{
    date: string;
    work: number;
    shortBreak: number;
    longBreak: number;
    productivity: number;
  }>;
  sessionsByWeek: Array<{
    week: string;
    sessions: number;
    hours: number;
    productivity: number;
  }>;
  topTasks: Array<{
    taskId: string;
    taskTitle: string;
    sessions: number;
    hours: number;
  }>;
}

type TimeRange = "week" | "month" | "year";

export function useStatistics(timeRange: TimeRange = "week") {
  const [sessions, setSessions] = useState<SessionData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const { tasks } = useTasks();
  const supabase = createClient();

  const STORAGE_KEY = "pomodoro_sessions";

  // Load sessions from localStorage for guest users
  const loadFromLocalStorage = (): SessionData[] => {
    if (typeof window === "undefined") return [];
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) return [];
      
      const parsed = JSON.parse(stored);
      return parsed.map((session: any) => ({
        id: session.id,
        sessionType: session.sessionType,
        durationMinutes: session.durationMinutes,
        productivityRating: session.productivityRating,
        completedAt: new Date(session.completedAt),
        taskId: session.taskId,
      }));
    } catch {
      return [];
    }
  };

  // Fetch sessions from database or localStorage
  const fetchSessions = async () => {
    setLoading(true);
    setError(null);

    try {
      if (!user) {
        // Guest user - load from localStorage
        const localSessions = loadFromLocalStorage();
        setSessions(localSessions);
        setLoading(false);
        return;
      }

      // Authenticated user - fetch from database
      const { data, error: fetchError } = await supabase
        .from("pomodoro_sessions")
        .select(`
          id,
          session_type,
          duration_minutes,
          productivity_rating,
          completed_at,
          task_id
        `)
        .eq("user_id", user.id)
        .order("completed_at", { ascending: false });

      if (fetchError) throw fetchError;

      const formattedSessions: SessionData[] = (data || []).map((session) => ({
        id: session.id,
        sessionType: session.session_type as "work" | "short_break" | "long_break",
        durationMinutes: session.duration_minutes,
        productivityRating: session.productivity_rating,
        completedAt: new Date(session.completed_at),
        taskId: session.task_id,
      }));

      setSessions(formattedSessions);
    } catch (err) {
      await showErrorToast(err, "fetch-statistics");
      setError("Failed to load session data");
      // Fallback to localStorage for authenticated users
      const localSessions = loadFromLocalStorage();
      setSessions(localSessions);
    } finally {
      setLoading(false);
    }
  };

  // Calculate statistics based on time range
  const statistics = useMemo((): StatisticsData => {
    const now = new Date();
    let startDate: Date;

    switch (timeRange) {
      case "week":
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case "month":
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case "year":
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    }

    const filteredSessions = sessions.filter(
      (session) => session.completedAt >= startDate
    );

    const workSessions = filteredSessions.filter(
      (session) => session.sessionType === "work"
    );

    const totalMinutes = workSessions.reduce(
      (sum, session) => sum + session.durationMinutes,
      0
    );

    const totalHours = Math.floor(totalMinutes / 60);
    const remainingMinutes = totalMinutes % 60;

    const productivityRatings = workSessions
      .map((session) => session.productivityRating)
      .filter((rating): rating is number => rating !== undefined);

    const averageProductivity =
      productivityRatings.length > 0
        ? productivityRatings.reduce((sum, rating) => sum + rating, 0) /
          productivityRatings.length
        : 0;

    // Group sessions by day
    const sessionsByDayMap = new Map<string, {
      work: number;
      shortBreak: number;
      longBreak: number;
      productivity: number[];
    }>();

    filteredSessions.forEach((session) => {
      const dateKey = session.completedAt.toISOString().split("T")[0];
      if (!sessionsByDayMap.has(dateKey)) {
        sessionsByDayMap.set(dateKey, {
          work: 0,
          shortBreak: 0,
          longBreak: 0,
          productivity: [],
        });
      }

      const dayData = sessionsByDayMap.get(dateKey)!;
      if (session.sessionType === "work") {
        dayData.work++;
      } else if (session.sessionType === "short_break") {
        dayData.shortBreak++;
      } else if (session.sessionType === "long_break") {
        dayData.longBreak++;
      }
      
      if (session.productivityRating) {
        dayData.productivity.push(session.productivityRating);
      }
    });

    const sessionsByDay = Array.from(sessionsByDayMap.entries())
      .map(([date, data]) => ({
        date,
        work: data.work,
        shortBreak: data.shortBreak,
        longBreak: data.longBreak,
        productivity: data.productivity.length > 0
          ? data.productivity.reduce((sum, rating) => sum + rating, 0) / data.productivity.length
          : 0,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // Group sessions by week
    const sessionsByWeekMap = new Map<string, {
      sessions: number;
      hours: number;
      productivity: number[];
    }>();

    filteredSessions.forEach((session) => {
      const weekStart = new Date(session.completedAt);
      weekStart.setDate(weekStart.getDate() - weekStart.getDay());
      const weekKey = weekStart.toISOString().split("T")[0];

      if (!sessionsByWeekMap.has(weekKey)) {
        sessionsByWeekMap.set(weekKey, {
          sessions: 0,
          hours: 0,
          productivity: [],
        });
      }

      const weekData = sessionsByWeekMap.get(weekKey)!;
      weekData.sessions++;
      if (session.sessionType === "work") {
        weekData.hours += session.durationMinutes / 60;
      }
      if (session.productivityRating) {
        weekData.productivity.push(session.productivityRating);
      }
    });

    const sessionsByWeek = Array.from(sessionsByWeekMap.entries())
      .map(([week, data]) => ({
        week,
        sessions: data.sessions,
        hours: Math.round(data.hours * 10) / 10,
        productivity: data.productivity.length > 0
          ? data.productivity.reduce((sum, rating) => sum + rating, 0) / data.productivity.length
          : 0,
      }))
      .sort((a, b) => a.week.localeCompare(b.week));

    // Top tasks by session count
    const taskSessionMap = new Map<string, {
      taskTitle: string;
      sessions: number;
      hours: number;
    }>();

    workSessions.forEach((session) => {
      if (session.taskId) {
        const task = tasks.find((t) => t.id === session.taskId);
        const taskTitle = task?.title || "Unknown Task";
        
        if (!taskSessionMap.has(session.taskId)) {
          taskSessionMap.set(session.taskId, {
            taskTitle,
            sessions: 0,
            hours: 0,
          });
        }

        const taskData = taskSessionMap.get(session.taskId)!;
        taskData.sessions++;
        taskData.hours += session.durationMinutes / 60;
      }
    });

    const topTasks = Array.from(taskSessionMap.entries())
      .map(([taskId, data]) => ({
        taskId,
        taskTitle: data.taskTitle,
        sessions: data.sessions,
        hours: Math.round(data.hours * 10) / 10,
      }))
      .sort((a, b) => b.sessions - a.sessions)
      .slice(0, 5);

    return {
      totalSessions: filteredSessions.length,
      totalWorkSessions: workSessions.length,
      totalHours,
      totalMinutes: remainingMinutes,
      averageProductivity: Math.round(averageProductivity * 10) / 10,
      sessionsByDay,
      sessionsByWeek,
      topTasks,
    };
  }, [sessions, timeRange, tasks]);

  useEffect(() => {
    fetchSessions();
  }, [user, timeRange]);

  return {
    sessions,
    statistics,
    loading,
    error,
    refetch: fetchSessions,
  };
}
