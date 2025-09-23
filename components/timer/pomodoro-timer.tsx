"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Play, Pause, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export type TimerState = "work" | "short_break" | "long_break";
export type TimerStatus = "idle" | "running" | "paused";

interface PomodoroTimerProps {
  workDuration?: number;
  shortBreakDuration?: number;
  longBreakDuration?: number;
  autoStartBreaks?: boolean;
  autoStartPomodoros?: boolean;
  onSessionComplete?: (type: TimerState, duration: number) => void;
  onTimerStateChange?: (state: TimerState) => void;
  currentTask?: {
    id: string;
    title: string;
    estimatedPomodoros: number;
    completedPomodoros: number;
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
  onSessionComplete,
  onTimerStateChange,
  currentTask,
  externalState,
  externalStateSource,
  cycleLength,
}: PomodoroTimerProps) {
  const [timerState, setTimerState] = useState<TimerState>("work");
  const [timerStatus, setTimerStatus] = useState<TimerStatus>("idle");

  const [remainingTimes, setRemainingTimes] = useState<
    Record<TimerState, number>
  >({
    work: workDuration * 60,
    short_break: shortBreakDuration * 60,
    long_break: longBreakDuration * 60,
  });

  const [completedPomodoros, setCompletedPomodoros] = useState(0);
  const LOCAL_COMPLETED_KEY = "pomotide_completedPomodoros";
  const SESSION_FOCUS_KEY = "pomotide_sessionFocusSeconds";

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

  // Ensure last known sessionFocusSeconds is persisted on page unload / unmount
  useEffect(() => {
    const handleBeforeUnload = () => {
      try {
        localStorage.setItem(
          SESSION_FOCUS_KEY,
          String(sessionFocusRef.current)
        );
      } catch {}
    };

    if (typeof window !== "undefined") {
      window.addEventListener("beforeunload", handleBeforeUnload);
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
      }
    };
  }, []);

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

  const timeLeft = remainingTimes[timerState];

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  const formatHMS = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    // Always render HH:MM:SS (pad hours)
    return `${String(hrs).padStart(2, "0")}:${String(mins).padStart(
      2,
      "0"
    )}:${String(secs).padStart(2, "0")}`;
  };

  const getProgress = () => {
    const totalDuration = getDuration(timerState);
    return ((totalDuration - timeLeft) / totalDuration) * 100;
  };

  const switchTimerState = (newState: TimerState, autoStart = false) => {
    setTimerState(newState);
    setTimerStatus(autoStart ? "running" : "idle");
    onTimerStateChange?.(newState);
  };

  const completingRef = useRef(false);

  const handleTimerComplete = useCallback(() => {
    const currentDuration = getDuration(timerState);
    onSessionComplete?.(timerState, Math.floor(currentDuration / 60));

    if (timerState === "work") {
      const newCompletedPomodoros = completedPomodoros + 1;
      setCompletedPomodoros(newCompletedPomodoros);

      // Reset the work remaining time (visual)
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
    } else {
      setRemainingTimes((prev) => ({
        ...prev,
        [timerState]: getDuration(timerState),
      }));

      // Break finished, back to work
      switchTimerState("work", autoStartPomodoros);
    }

    // allow future completions after a short delay
    setTimeout(() => {
      completingRef.current = false;
    }, 800);
  }, [
    timerState,
    completedPomodoros,
    getDuration,
    onSessionComplete,
    autoStartBreaks,
    autoStartPomodoros,
  ]);

  const toggleTimer = () => {
    if (timerStatus === "running") {
      setTimerStatus("paused");
    } else {
      setTimerStatus("running");
    }
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
          setRemainingTimes((prev) => ({
            ...prev,
            [timerState]: prev[timerState] - 1,
          }));

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
    setRemainingTimes((prev) => ({
      ...prev,
      work:
        timerStatus === "idle" && timerState === "work"
          ? getDuration("work")
          : prev.work,
      short_break:
        timerStatus === "idle" && timerState === "short_break"
          ? getDuration("short_break")
          : prev.short_break,
      long_break:
        timerStatus === "idle" && timerState === "long_break"
          ? getDuration("long_break")
          : prev.long_break,
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
      if (externalStateSource === "tab") {
        // Tab navigation requires manual start
        switchTimerState(externalState, false);
      } else if (externalStateSource === "arrow") {
        // Arrow navigation auto-starts
        switchTimerState(externalState, true);
      } else {
        // Default behavior (manual start)
        switchTimerState(externalState, false);
      }
    }
  }, [externalState, externalStateSource]);

  const getStateLabel = () => {
    switch (timerState) {
      case "work":
        return "Focus Time";
      case "short_break":
        return "Short Break";
      case "long_break":
        return "Long Break";
    }
  };

  const getStateColor = () => {
    switch (timerState) {
      case "work":
        return "bg-red-500 text-white";
      case "short_break":
        return "bg-green-500 text-white";
      case "long_break":
        return "bg-blue-500 text-white";
    }
  };

  const getTimerColors = () => {
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
  };

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
              <div className="flex items-center justify-center gap-2">
                <Badge variant="outline">
                  {currentTask.completedPomodoros}/
                  {currentTask.estimatedPomodoros} Pomodoros
                </Badge>
              </div>
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

                // Confirmed: perform reset
                setSessionFocusSeconds(0);

                try {
                  console.debug("[pomodoro] reset: removing persisted keys");
                  localStorage.removeItem(LOCAL_COMPLETED_KEY);
                  localStorage.removeItem(SESSION_FOCUS_KEY);
                } catch {}
                setCompletedPomodoros(0);

                setTimerStatus("idle");
                setRemainingTimes(() => ({
                  work: getDuration("work"),
                  short_break: getDuration("short_break"),
                  long_break: getDuration("long_break"),
                }));

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
              {currentTask ? (
                <span>
                  Task: {currentTask.completedPomodoros}/
                  {currentTask.estimatedPomodoros}
                </span>
              ) : (
                <span>Session: {completedPomodoros} completed</span>
              )}
            </div>
          </div>

          {/* No Task Warning removed as requested */}
        </div>
      </div>
    </div>
  );
}
