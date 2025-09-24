"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Play,
  Pause,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { audioManager, type SoundType } from "@/lib/audio/sounds";

export type TimerState = "work" | "short_break" | "long_break";
export type TimerStatus = "idle" | "running" | "paused";

interface PomodoroTimerProps {
  workDuration?: number;
  shortBreakDuration?: number;
  longBreakDuration?: number;
  autoStartBreaks?: boolean;
  autoStartPomodoros?: boolean;
  onSessionComplete?: (type: TimerState, duration: number) => void;
  autoStartOnNavigation?: boolean;
  notificationsEnabled?: boolean;
  soundEnabled?: boolean;
  onTimerStateChange?: (state: TimerState) => void;
  currentTask?: {
    id: string;
    title: string;
  } | null;
  externalState?: TimerState;
  externalStateSource?: "tab" | "arrow"; // Added to differentiate between tab and arrow navigation
  cycleLength?: number;
}

export function PomodoroTimer({
  workDuration = 25,
  shortBreakDuration = 5,
  longBreakDuration = 15,
  autoStartBreaks = true,
  autoStartPomodoros = true,
  autoStartOnNavigation = true,
  notificationsEnabled = false,
  soundEnabled = false,
  onSessionComplete,
  onTimerStateChange,
  currentTask,
  externalState,
  externalStateSource,
  cycleLength,
}: PomodoroTimerProps) {
  // Synchronously initialize from snapshot if available to avoid any reset/flicker
  const initialFromSnapshot = (() => {
    if (typeof window === "undefined") {
      return {
        timerState: "work" as TimerState,
        timerStatus: "idle" as TimerStatus,
        remainingTimes: {
          work: workDuration * 60,
          short_break: shortBreakDuration * 60,
          long_break: longBreakDuration * 60,
        } as Record<TimerState, number>,
      };
    }
    try {
      const raw = localStorage.getItem("pomotide_running_snapshot");
      if (!raw) {
        return {
          timerState: "work" as TimerState,
          timerStatus: "idle" as TimerStatus,
          remainingTimes: {
            work: workDuration * 60,
            short_break: shortBreakDuration * 60,
            long_break: longBreakDuration * 60,
          } as Record<TimerState, number>,
        };
      }
      const parsed = JSON.parse(raw);
      if (!parsed || !parsed.timestamp || !parsed.remainingTimes) {
        throw new Error("invalid snapshot");
      }
      const pickNumber = (v: any): number | undefined => {
        const n = Number(v);
        return Number.isFinite(n) ? n : undefined;
      };

      const restored: Record<TimerState, number> = {
        work:
          pickNumber(
            parsed.remainingTimes.work ??
              parsed.remainingTimes.workSeconds ??
              parsed.remainingTimes.work_sec
          ) ?? workDuration * 60,
        short_break:
          pickNumber(
            parsed.remainingTimes.short_break ??
              parsed.remainingTimes.shortBreak ??
              parsed.remainingTimes.short_break_seconds
          ) ?? shortBreakDuration * 60,
        long_break:
          pickNumber(
            parsed.remainingTimes.long_break ??
              parsed.remainingTimes.longBreak ??
              parsed.remainingTimes.long_break_seconds
          ) ?? longBreakDuration * 60,
      };

      const parsedState = (parsed.timerState as TimerState) ?? "work";
      const wasRunning = parsed.timerStatus === "running";
      const elapsedSec = Math.floor((Date.now() - parsed.timestamp) / 1000);
      const adjusted = { ...restored } as Record<TimerState, number>;
      adjusted[parsedState] = Math.max(
        0,
        restored[parsedState] - (wasRunning ? elapsedSec : 0)
      );

      const status: TimerStatus = adjusted[parsedState] > 0
        ? (wasRunning ? "running" : "paused")
        : "idle";

      return {
        timerState: parsedState,
        timerStatus: status,
        remainingTimes: adjusted,
      };
    } catch {
      return {
        timerState: "work" as TimerState,
        timerStatus: "idle" as TimerStatus,
        remainingTimes: {
          work: workDuration * 60,
          short_break: shortBreakDuration * 60,
          long_break: longBreakDuration * 60,
        } as Record<TimerState, number>,
      };
    }
  })();

  const [timerState, setTimerState] = useState<TimerState>(
    initialFromSnapshot.timerState
  );
  const [timerStatus, setTimerStatus] = useState<TimerStatus>(
    initialFromSnapshot.timerStatus
  );

  const [remainingTimes, setRemainingTimes] = useState<
    Record<TimerState, number>
  >(initialFromSnapshot.remainingTimes);

  const [completedPomodoros, setCompletedPomodoros] = useState(0);
  const LOCAL_COMPLETED_KEY = "pomotide_completedPomodoros";
  const SESSION_FOCUS_KEY = "pomotide_sessionFocusSeconds";
  const RUNNING_SNAPSHOT_KEY = "pomotide_running_snapshot";

  // Read persisted session focus synchronously on first render so a reload
  // doesn't start the UI at 0 before effects run.
  const getInitialSessionFocus = () => {
    try {
      const raw = localStorage.getItem(SESSION_FOCUS_KEY);
      if (raw) {
        const parsed = parseInt(raw, 10);
        if (!Number.isNaN(parsed)) return parsed;
      }
    } catch {}
    return 0;
  };

  const [sessionFocusSeconds, setSessionFocusSeconds] = useState<number>(() =>
    getInitialSessionFocus()
  );
  const sessionFocusRef = useRef<number>(sessionFocusSeconds);
  // Throttling helpers for persistence: write at most once every 5s
  const lastPersistRef = useRef<number>(Date.now());
  const persistTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [resetConfirm, setResetConfirm] = useState(false);
  const cycleLengthNormalized = Math.max(1, Math.floor(cycleLength ?? 4));

  // Load persisted local cycle count from localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem(LOCAL_COMPLETED_KEY);
      if (raw) {
        const parsed = parseInt(raw, 10);
        if (!Number.isNaN(parsed)) setCompletedPomodoros(parsed);
      }
    } catch {
      // ignore
    }
  }, []);

  // Note: session focus is initialized synchronously from localStorage above
  // so we don't need a separate load effect. sessionFocusRef was seeded
  // with that initial value.

  // Persist local cycle count
  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_COMPLETED_KEY, String(completedPomodoros));
    } catch {
      // ignore
    }
  }, [completedPomodoros]);

  // Persist session focus seconds (throttled) so a refresh won't lose the running total
  useEffect(() => {
    const MAX_INTERVAL = 5000; // ms
    const now = Date.now();
    const elapsed = now - lastPersistRef.current;

    const write = () => {
      try {
        localStorage.setItem(SESSION_FOCUS_KEY, String(sessionFocusSeconds));
      } catch {}
      lastPersistRef.current = Date.now();
      if (persistTimeoutRef.current) {
        clearTimeout(persistTimeoutRef.current);
        persistTimeoutRef.current = null;
      }
    };

    if (elapsed >= MAX_INTERVAL) {
      write();
    } else {
      if (persistTimeoutRef.current) clearTimeout(persistTimeoutRef.current);
      persistTimeoutRef.current = setTimeout(write, MAX_INTERVAL - elapsed);
    }

    // keep ref up to date for beforeunload handler
    sessionFocusRef.current = sessionFocusSeconds;

    return () => {
      // noop; timeout is cleared when a newer one is scheduled or on unmount below
    };
  }, [sessionFocusSeconds]);

  // Persist running timer snapshot when status/state changes so we can restore
  const initialLoadRef = useRef(true);

  useEffect(() => {
    try {
      // Persist snapshot for running/paused; for idle we keep the last snapshot so reloads can restore.
      if (timerStatus === "running" || timerStatus === "paused") {
        const snapshot = {
          timerState,
          timerStatus,
          remainingTimes,
          timestamp: Date.now(),
        };
        try {
          const json = JSON.stringify(snapshot);
          localStorage.setItem(RUNNING_SNAPSHOT_KEY, json);
        } catch (err) {
        }
      }
    } catch {}
  }, [timerState, timerStatus, remainingTimes]);

  // Restore running timer snapshot on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(RUNNING_SNAPSHOT_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && parsed.timestamp && parsed.remainingTimes) {
          // compute elapsed time since snapshot (seconds)
          const elapsedSec = Math.floor((Date.now() - parsed.timestamp) / 1000);

          // Defensive: accept multiple possible key shapes but DO NOT fallback
          // to full durations on restore; if a key is missing, keep current state.
          const pickNumber = (v: any): number | undefined => {
            const n = Number(v);
            return Number.isFinite(n) ? n : undefined;
          };

          const restored: Record<TimerState, number> = {
            work:
              pickNumber(
                parsed.remainingTimes.work ??
                  parsed.remainingTimes.workSeconds ??
                  parsed.remainingTimes.work_sec
              ) ?? remainingTimes.work,
            short_break:
              pickNumber(
                parsed.remainingTimes.short_break ??
                  parsed.remainingTimes.shortBreak ??
                  parsed.remainingTimes.short_break_seconds
              ) ?? remainingTimes.short_break,
            long_break:
              pickNumber(
                parsed.remainingTimes.long_break ??
                  parsed.remainingTimes.longBreak ??
                  parsed.remainingTimes.long_break_seconds
              ) ?? remainingTimes.long_break,
          };

          const parsedState = (parsed.timerState as TimerState) ?? "work";

          // Only subtract elapsed if the snapshot was running; if it was paused, keep the paused remaining time
          const wasRunning = parsed.timerStatus === "running";
          const newRemaining = Math.max(
            0,
            restored[parsedState] - (wasRunning ? elapsedSec : 0)
          );
          restored[parsedState] = newRemaining;

          setRemainingTimes((prev) => ({ ...prev, ...restored }));
          

          // Persist a normalized snapshot immediately so we don't get an
          // intermediate write that contains stale default durations.
          try {
            const normalized = {
              timerState: parsedState,
              timerStatus: wasRunning ? ("running" as const) : ("paused" as const),
              remainingTimes: restored,
              timestamp: Date.now(),
            };
            const njson = JSON.stringify(normalized);
            localStorage.setItem(RUNNING_SNAPSHOT_KEY, njson);
          } catch (err) {
            
          }

          // restore state/status but if it reached zero, treat as idle and let completion flow run
          if (newRemaining > 0) {
            setTimerState(parsedState);
            setTimerStatus(wasRunning ? "running" : "paused");
          } else {
            // remove stale snapshot
            localStorage.removeItem(RUNNING_SNAPSHOT_KEY);
          }
          // mark restore attempt complete so persist effect can clear stale snapshots
          initialLoadRef.current = false;
        }
      }
    } catch {}
    // Ensure we always clear initial load flag even if there was no snapshot
    initialLoadRef.current = false;
  }, []);

  // Handle browser sleep/wake cycles and visibility changes
  useEffect(() => {
    const handleBeforeUnload = () => {
      try {
        localStorage.setItem(
          SESSION_FOCUS_KEY,
          String(sessionFocusRef.current)
        );
      } catch {}
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Page is hidden - save current state
        if (timerStatus === "running") {
          try {
            const snapshot = {
              timerState,
              timerStatus: "running" as const,
              remainingTimes,
              timestamp: Date.now(),
            };
            const json = JSON.stringify(snapshot);
            localStorage.setItem(RUNNING_SNAPSHOT_KEY, json);
          } catch {}
        }
      } else {
        // Page is visible again - check if we need to adjust time
        if (timerStatus === "running") {
          try {
            const raw = localStorage.getItem(RUNNING_SNAPSHOT_KEY);
            if (raw) {
              const parsed = JSON.parse(raw);
              if (parsed && parsed.timestamp && parsed.remainingTimes) {
                const elapsedSec = Math.floor((Date.now() - parsed.timestamp) / 1000);
                if (elapsedSec > 0) {
                  // Adjust remaining time based on elapsed time while hidden
                  setRemainingTimes((prev) => {
                    const adjusted = { ...prev };
                    const currentRemaining = prev[timerState];
                    const newRemaining = Math.max(0, currentRemaining - elapsedSec);
                    adjusted[timerState] = newRemaining;
                    
                    // Update snapshot with adjusted time
                    try {
                      const updatedSnapshot = {
                        timerState,
                        timerStatus: "running" as const,
                        remainingTimes: adjusted,
                        timestamp: Date.now(),
                      };
                      const json = JSON.stringify(updatedSnapshot);
                      localStorage.setItem(RUNNING_SNAPSHOT_KEY, json);
                    } catch {}
                    
                    return adjusted;
                  });
                }
              }
            }
          } catch {}
        }
      }
    };

    if (typeof window !== "undefined") {
      window.addEventListener("beforeunload", handleBeforeUnload);
      document.addEventListener("visibilitychange", handleVisibilityChange);
    }

    return () => {
      try {
        localStorage.setItem(
          SESSION_FOCUS_KEY,
          String(sessionFocusRef.current)
        );
      } catch {}
      // clear any pending scheduled persist
      if (persistTimeoutRef.current) {
        clearTimeout(persistTimeoutRef.current);
        persistTimeoutRef.current = null;
      }
      if (typeof window !== "undefined") {
        window.removeEventListener("beforeunload", handleBeforeUnload);
        document.removeEventListener("visibilitychange", handleVisibilityChange);
      }
    };
  }, [timerStatus, timerState, remainingTimes]);

  const getDuration = useCallback(
    (state: TimerState) => {
      switch (state) {
        case "work":
          return workDuration * 60;
        case "short_break":
          return shortBreakDuration * 60;
        case "long_break":
          return longBreakDuration * 60;
      }
    },
    [workDuration, shortBreakDuration, longBreakDuration]
  );

  // When durations change, clear outdated snapshot so we don't restore old lengths
  useEffect(() => {
    try {
      localStorage.removeItem(RUNNING_SNAPSHOT_KEY);
    } catch {}
  }, [workDuration, shortBreakDuration, longBreakDuration]);

  const timeLeft = remainingTimes[timerState];

  const formatTime = useCallback((seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  }, []);

  const formatHMS = useCallback((seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    // Always render HH:MM:SS (pad hours)
    return `${String(hrs).padStart(2, "0")}:${String(mins).padStart(
      2,
      "0"
    )}:${String(secs).padStart(2, "0")}`;
  }, []);

  const getProgress = useCallback(() => {
    const totalDuration = getDuration(timerState);
    return ((totalDuration - timeLeft) / totalDuration) * 100;
  }, [getDuration, timerState, timeLeft]);

  const switchTimerState = (newState: TimerState, autoStart = false) => {
    setTimerState(newState);
    setTimerStatus(autoStart ? "running" : "idle");
    // Reset completing ref when switching states to allow new completions
    completingRef.current = false;
    onTimerStateChange?.(newState);
  };

  const completingRef = useRef(false);

  const handleTimerComplete = useCallback(async () => {
    const currentDuration = getDuration(timerState);
    
    // For work sessions, complete immediately and determine next state
    if (timerState === "work") {
      // Complete the work session
      const newCompletedPomodoros = completedPomodoros + 1;
      setCompletedPomodoros(newCompletedPomodoros);
      
      onSessionComplete?.(timerState, Math.floor(currentDuration / 60));

      // Reset work timer
      setRemainingTimes((prev) => ({
        ...prev,
        work: getDuration("work"),
      }));

      // After cycleLength pomodoros, take a long break
      const nextState =
        newCompletedPomodoros % cycleLengthNormalized === 0
          ? "long_break"
          : "short_break";

      switchTimerState(nextState, autoStartBreaks);
      
      // Play work completion sound
      if (soundEnabled) {
        try {
          await audioManager.playSound("work");
        } catch (error) {
          console.error("Failed to play completion sound:", error);
        }
      }
      return;
    }
    
    // For breaks, complete immediately and return to work
    if (timerState === "short_break" || timerState === "long_break") {
      onSessionComplete?.(timerState, Math.floor(currentDuration / 60));

      setRemainingTimes((prev) => ({
        ...prev,
        [timerState]: getDuration(timerState),
      }));

      // Break finished, back to work
      switchTimerState("work", autoStartPomodoros);
      
      // Play break completion sound
      if (soundEnabled) {
        try {
          const soundType = timerState === "short_break" ? "shortBreak" : "longBreak";
          await audioManager.playSound(soundType);
        } catch (error) {
          console.error("Failed to play completion sound:", error);
        }
      }
    }

    // allow future completions after a short delay
    setTimeout(() => {
      completingRef.current = false;
    }, 800);

    // Notify the user via the Notification API (if enabled)
    try {
      if (
        notificationsEnabled &&
        typeof window !== "undefined" &&
        "Notification" in window &&
        Notification.permission === "granted"
      ) {
        const title = "Session Complete";
        const body = "Session finished — time for a break or to continue";
        try {
          new Notification(title, { body });
        } catch {}
      }
    } catch {}
  }, [
    timerState,
    completedPomodoros,
    getDuration,
    onSessionComplete,
    autoStartBreaks,
    autoStartPomodoros,
    notificationsEnabled,
  ]);


  const toggleTimer = () => {
    const nextStatus: TimerStatus =
      timerStatus === "running" ? "paused" : "running";
    setTimerStatus(nextStatus);
    // Persist immediately on user action to guarantee key exists
    try {
            const snapshot = {
              timerState,
              timerStatus: nextStatus,
              remainingTimes,
              timestamp: Date.now(),
            };
      const json = JSON.stringify(snapshot);
      localStorage.setItem(RUNNING_SNAPSHOT_KEY, json);
    } catch {}
  };

  const resetCurrentTimer = () => {
    // Reset only the current timer's remaining time and stop it; keep session totals
    setRemainingTimes((prev) => ({
      ...prev,
      [timerState]: getDuration(timerState),
    }));
    setTimerStatus("idle");
    (async () => {
      try {
        const { toast } = await import("sonner");
        toast("Timer reset");
      } catch {}
    })();
  };

  const navigateTimer = (direction: "prev" | "next") => {
    const states: TimerState[] = ["work", "short_break", "long_break"];
    const currentIndex = states.indexOf(timerState);

    let newIndex;
    if (direction === "next") {
      newIndex = (currentIndex + 1) % states.length;
    } else {
      newIndex = currentIndex === 0 ? states.length - 1 : currentIndex - 1;
    }

    switchTimerState(states[newIndex], true);
  };

  // Timer countdown effect (uses timeout to avoid overlapping intervals and
  // debounce completion so handleTimerComplete is called once per completion)
  useEffect(() => {
    let timer: NodeJS.Timeout | undefined;

    if (timerStatus === "running") {
      if (timeLeft > 0) {
        timer = setTimeout(() => {
          setRemainingTimes((prev) => {
            const next = { ...prev, [timerState]: prev[timerState] - 1 };
            // also persist immediately so reloads always find a snapshot
            try {
            const snapshot = {
              timerState,
              timerStatus: "running" as const,
              remainingTimes: next,
              timestamp: Date.now(),
            };
              const json = JSON.stringify(snapshot);
              localStorage.setItem(RUNNING_SNAPSHOT_KEY, json);
            } catch (err) {}

            return next;
          });

          // Increment session focus stopwatch only when in work state
          if (timerState === "work") {
            setSessionFocusSeconds((s) => s + 1);
          }
        }, 1000);
      } else {
        // timeLeft is 0 or less -> complete the timer once
        if (!completingRef.current) {
          completingRef.current = true;
          handleTimerComplete();
        }
      }
    }

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [timerStatus, timeLeft, timerState, handleTimerComplete]);

  useEffect(() => {
    // Skip the initial mount so we don't overwrite a restored snapshot's remaining times.
    if (initialLoadRef.current) {
      return;
    }

    // If user changed settings, reflect new durations:
    // - Update non-active states to new durations
    // - For the active state, only update if idle
    setRemainingTimes((prev) => ({
      ...prev,
      work:
        timerState === "work"
          ? (timerStatus === "idle" ? getDuration("work") : prev.work)
          : getDuration("work"),
      short_break:
        timerState === "short_break"
          ? (timerStatus === "idle"
              ? getDuration("short_break")
              : prev.short_break)
          : getDuration("short_break"),
      long_break:
        timerState === "long_break"
          ? (timerStatus === "idle" ? getDuration("long_break") : prev.long_break)
          : getDuration("long_break"),
    }));
  }, [
    workDuration,
    shortBreakDuration,
    longBreakDuration,
    timerState,
    timerStatus,
    getDuration,
  ]);

  useEffect(() => {
    if (externalState && externalState !== timerState) {
      // Treat tab navigation the same as arrow navigation (auto-start) to keep
      // behavior consistent across controls.
      if (externalStateSource === "tab" || externalStateSource === "arrow") {
        switchTimerState(externalState, true);
      } else {
        // Default behavior (manual start)
        switchTimerState(externalState, false);
      }
    }
  }, [externalState, externalStateSource, timerState, switchTimerState]);

  const getStateLabel = useCallback(() => {
    switch (timerState) {
      case "work":
        return "Focus Time";
      case "short_break":
        return "Short Break";
      case "long_break":
        return "Long Break";
    }
  }, [timerState]);

  const getStateColor = useCallback(() => {
    switch (timerState) {
      case "work":
        return "bg-red-500 text-white";
      case "short_break":
        return "bg-green-500 text-white";
      case "long_break":
        return "bg-blue-500 text-white";
    }
  }, [timerState]);

  const getTimerColors = useCallback(() => {
    switch (timerState) {
      case "work":
        return {
          progress: "text-red-500",
          button: "bg-red-500 hover:bg-red-600 text-white",
        };
      case "short_break":
        return {
          progress: "text-green-500",
          button: "bg-green-500 hover:bg-green-600 text-white",
        };
      case "long_break":
        return {
          progress: "text-blue-500",
          button: "bg-blue-500 hover:bg-blue-600 text-white",
        };
    }
  }, [timerState]);

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="p-8">
        <div className="flex flex-col items-center space-y-6">
          {/* Current Task Display */}
          {currentTask && (
            <div className="text-center space-y-2">
              <h3 className="font-medium text-lg text-balance">
                {currentTask.title}
              </h3>
            </div>
          )}

          {/* Timer State Badge */}
          <Badge
            className={cn("px-4 py-2 text-sm font-medium", getStateColor())}
          >
            {getStateLabel()}
          </Badge>

          {/* Timer Circle */}
          <div className="relative w-48 h-48">
            <svg
              className="w-full h-full transform -rotate-90"
              viewBox="0 0 100 100"
            >
              {/* Background circle */}
              <circle
                cx="50"
                cy="50"
                r="45"
                stroke="currentColor"
                strokeWidth="2"
                fill="none"
                className="text-muted"
              />
              {/* Progress circle */}
              <circle
                cx="50"
                cy="50"
                r="45"
                stroke="currentColor"
                strokeWidth="3"
                fill="none"
                strokeDasharray={`${2 * Math.PI * 45}`}
                strokeDashoffset={`${
                  2 * Math.PI * 45 * (1 - getProgress() / 100)
                }`}
                className={cn(
                  "transition-all duration-1000 ease-linear",
                  getTimerColors().progress,
                  timerStatus === "running" && "timer-active"
                )}
                strokeLinecap="round"
              />
            </svg>

            {/* Timer Display */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="text-4xl font-mono font-bold">
                  {formatTime(timeLeft)}
                </div>
                <div className="text-sm text-muted-foreground mt-1">
                  {timerStatus === "running"
                    ? "Running"
                    : timerStatus === "paused"
                    ? "Paused"
                    : "Ready"}
                </div>
              </div>

              {/* Reset button is positioned absolutely so it doesn't affect vertical centering */}
              <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={resetCurrentTimer}
                  aria-label="Reset timer"
                  className="h-7 w-7"
                  title="Reset timer"
                >
                  <RotateCcw className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Timer Controls */}
          <div className="flex items-center gap-4">
            {/* Previous State */}
            <Button
              variant="outline"
              size="icon"
              onClick={() => navigateTimer("prev")}
              className="h-12 w-12"
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>

            {/* Play/Pause */}
            <Button
              onClick={toggleTimer}
              size="lg"
              className={cn("h-14 w-14 rounded-full", getTimerColors().button)}
            >
              {timerStatus === "running" ? (
                <Pause className="h-6 w-6" />
              ) : (
                <Play className="h-6 w-6" />
              )}
            </Button>

            {/* Next State */}
            <Button
              variant="outline"
              size="icon"
              onClick={() => navigateTimer("next")}
              className="h-12 w-12"
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>

          {/* Session Stopwatch (focus time this session) */}
          <div className="flex items-center gap-3 mt-3">
            <div className="text-sm text-muted-foreground">Session Focus:</div>
            <div className="font-mono font-medium tabular-nums">
              {formatHMS(sessionFocusSeconds)}
            </div>
            <Button
              variant={resetConfirm ? "destructive" : "ghost"}
              size="sm"
              onClick={async () => {
                if (!resetConfirm) {
                  // First click: flip to confirm state
                  setResetConfirm(true);
                  try {
                    const { toast } = await import("sonner");
                    toast(`Click again to confirm reset`, {
                      id: "reset-confirm",
                    });
                  } catch {}
                  // Auto clear confirmation after 4 seconds
                  setTimeout(() => setResetConfirm(false), 4000);
                  return;
                }

                // Confirmed: perform reset (session-level only)
                // Reset session focus totals and persisted keys, but do NOT touch the
                // running timer or its remaining time.
                setSessionFocusSeconds(0);

            try {
              localStorage.removeItem(LOCAL_COMPLETED_KEY);
              localStorage.removeItem(SESSION_FOCUS_KEY);
            } catch {}
                setCompletedPomodoros(0);

                (async () => {
                  try {
                    const { toast } = await import("sonner");
                    toast.success("Session totals cleared (timer unchanged)");
                  } catch {}
                })();

                try {
                  const { toast } = await import("sonner");
                  toast.success("Session reset");
                } catch {}

                setResetConfirm(false);
              }}
            >
              {resetConfirm ? "Confirm" : "Reset"}
            </Button>
          </div>

          

          {/* Pomodoro Progress: cycle dots + task progress */}
          <div
            className="flex flex-col sm:flex-row items-start sm:items-center gap-3"
            title={`Dots show progress in the current ${cycleLengthNormalized}-pomodoro cycle. Cycle persists across reloads in this browser.`}
          >
            <div className="flex items-center gap-2">
              <div className="text-sm text-muted-foreground">
                Cycle: {completedPomodoros % cycleLengthNormalized}/
                {cycleLengthNormalized}
              </div>
              <div className="flex items-center gap-2 ml-2">
                {Array.from({ length: cycleLengthNormalized }, (_, i) => (
                  <div
                    key={i}
                    className={cn(
                      "w-3 h-3 rounded-full border-2",
                      i < completedPomodoros % cycleLengthNormalized
                        ? "bg-primary border-primary"
                        : "border-muted-foreground"
                    )}
                  />
                ))}
              </div>
            </div>

            <div className="text-sm text-muted-foreground w-full sm:w-auto mt-2 sm:mt-0">
              <span>Session: {completedPomodoros} completed</span>
            </div>
          </div>

          {/* No Task Warning removed as requested */}
        </div>
      </div>

    </div>
  );
}
