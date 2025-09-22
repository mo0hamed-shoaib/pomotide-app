"use client";

import { useState, useEffect, useCallback } from "react";
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
  const [sessionFocusSeconds, setSessionFocusSeconds] = useState(0);

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

  const getProgress = () => {
    const totalDuration = getDuration(timerState);
    return ((totalDuration - timeLeft) / totalDuration) * 100;
  };

  const switchTimerState = (newState: TimerState, autoStart = false) => {
    setTimerState(newState);
    setTimerStatus(autoStart ? "running" : "idle");
    onTimerStateChange?.(newState);
  };

  const handleTimerComplete = () => {
    const currentDuration = getDuration(timerState);
    onSessionComplete?.(timerState, Math.floor(currentDuration / 60));

    if (timerState === "work") {
      const newCompletedPomodoros = completedPomodoros + 1;
      setCompletedPomodoros(newCompletedPomodoros);

      setRemainingTimes((prev) => ({
        ...prev,
        work: getDuration("work"),
      }));

      // After 4 pomodoros, take a long break
      const nextState =
        newCompletedPomodoros % 4 === 0 ? "long_break" : "short_break";
      switchTimerState(nextState, autoStartBreaks);
    } else {
      setRemainingTimes((prev) => ({
        ...prev,
        [timerState]: getDuration(timerState),
      }));

      // Break finished, back to work
      switchTimerState("work", autoStartPomodoros);
    }
  };

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

  // Timer countdown effect
  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (timerStatus === "running" && timeLeft > 0) {
      interval = setInterval(() => {
        setRemainingTimes((prev) => {
          const newTime = prev[timerState] - 1;
          if (newTime <= 0) {
            handleTimerComplete();
            return prev;
          }
          return {
            ...prev,
            [timerState]: newTime,
          };
        });
        // Increment session focus stopwatch only when in work state
        if (timerState === "work") {
          setSessionFocusSeconds((s) => s + 1);
        }
      }, 1000);
    }

    return () => clearInterval(interval);
  }, [timerStatus, timeLeft, timerState]);

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
              {Math.floor(sessionFocusSeconds / 60)}:
              {String(sessionFocusSeconds % 60).padStart(2, "0")}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSessionFocusSeconds(0)}
            >
              Reset
            </Button>
          </div>

          {/* Pomodoro Progress */}
          <div className="flex items-center gap-2">
            {Array.from({ length: 4 }, (_, i) => (
              <div
                key={i}
                className={cn(
                  "w-3 h-3 rounded-full border-2",
                  i < completedPomodoros % 4
                    ? "bg-primary border-primary"
                    : "border-muted-foreground"
                )}
              />
            ))}
            <span className="text-sm text-muted-foreground ml-2">
              {completedPomodoros} completed
            </span>
          </div>

          {/* No Task Warning */}
          {!currentTask && timerState === "work" && (
            <div className="text-center text-sm text-muted-foreground">
              Add a task to start your focus session
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
