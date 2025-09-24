"use client";

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";

import { useState, useEffect } from "react";
import {
  PomodoroTimer,
  type TimerState,
} from "@/components/timer/pomodoro-timer";
import { TaskList, type Task } from "@/components/tasks/task-list";
import { TimerTabs } from "@/components/timer/timer-tabs";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Moon,
  Sun,
  BarChart3,
  Settings,
  LogIn,
  LogOut,
  User,
  Github,
  Linkedin,
} from "lucide-react";
import { useTheme } from "next-themes";
import { useAuth } from "@/lib/hooks/use-auth";
import { useTasks } from "@/lib/hooks/use-tasks";
import { useSettings } from "@/lib/hooks/use-settings";
import { usePomodoroSessions } from "@/lib/hooks/use-pomodoro-sessions";
import { useTotalCompleted } from "@/lib/hooks/use-total-completed";

export default function HomePage() {
  const { user, loading, signOut } = useAuth();
  const {
    tasks,
    loading: tasksLoading,
    addTask,
    updateTask,
    deleteTask,
  } = useTasks();
  const { settings } = useSettings();
  const { recordSession } = usePomodoroSessions();
  const {
    total: totalCompleted,
    refresh: refreshTotal,
    setTotal,
  } = useTotalCompleted();
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [timerState, setTimerState] = useState<TimerState>("work");
  const [externalStateSource, setExternalStateSource] = useState<
    "tab" | "arrow" | undefined
  >(undefined);
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Handle hydration
  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSessionComplete = async (type: TimerState, duration: number) => {
    // Record session in database
    const updatedTotal = await recordSession(
      activeTask?.id || null,
      type,
      duration
    );

    // Centralized user feedback: show a clear toast about the saved session
    try {
      const { toast } = await import("sonner");
      const where =
        typeof updatedTotal === "number" ? "Saved to cloud" : "Saved locally";
      toast.success(
        `${where}: ${
          type === "work"
            ? "Focus"
            : type === "short_break"
            ? "Short break"
            : "Long break"
        } session (${duration}m)`
      );
    } catch {}

    // If we got a server-updated total back, refresh local hook state
    if (typeof updatedTotal === "number") {
      setTotal(updatedTotal);
    } else {
      // fallback: refresh hook
      refreshTotal();
    }

    if (type === "work" && activeTask) {
      const newCompletedPomodoros = activeTask.completedPomodoros + 1;
      const isCompleted =
        newCompletedPomodoros >= activeTask.estimatedPomodoros;

      await updateTask(activeTask.id, {
        completedPomodoros: newCompletedPomodoros,
        status: isCompleted ? "completed" : "in_progress",
      });

      // If task is completed, clear active task
      if (isCompleted) {
        setActiveTask(null);
      }
    }
  };

  const handleTaskAdd = async (
    taskData: Omit<Task, "id" | "createdAt" | "completedPomodoros" | "status">
  ) => {
    await addTask(taskData);
  };

  const handleTaskEdit = async (taskId: string, updates: Partial<Task>) => {
    await updateTask(taskId, updates);

    // Update active task if it's being edited
    if (activeTask?.id === taskId) {
      setActiveTask((prev) => (prev ? { ...prev, ...updates } : null));
    }
  };

  const handleTaskDelete = async (taskId: string) => {
    await deleteTask(taskId);
    if (activeTask?.id === taskId) {
      setActiveTask(null);
    }
  };

  const handleTaskDuplicate = (task: Task) => {
    handleTaskAdd({
      title: `${task.title} (Copy)`,
      description: task.description,
      estimatedPomodoros: task.estimatedPomodoros,
    });
  };

  const handleTaskSelect = (task: Task) => {
    if (activeTask?.id === task.id) {
      // If clicking the same task, deactivate it
      setActiveTask(null);
    } else {
      // If clicking a different task, activate it
      setActiveTask(task);
      // Update task status to in_progress
      handleTaskEdit(task.id, { status: "in_progress" });
    }
  };

  const handleTimerStateChange = (newState: TimerState) => {
    setTimerState(newState);
    // Reset external state source after timer completes to avoid conflicts
    setExternalStateSource(undefined);
  };

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!mounted) {
    return null; // Prevent hydration mismatch
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img 
                src="/pomotide-logo.png" 
                alt="Pomotide Logo" 
                className="h-8 w-8"
              />
              <h1 className="text-2xl font-bold">Pomotide</h1>
            </div>

            <div className="flex items-center gap-2">
              {/* Statistics & Settings next to theme toggle (moved before theme) */}
              <nav className="flex items-center gap-1">
                <Link href="/statistics">
                  <Button variant="ghost" size="sm">
                    <BarChart3 className="h-4 w-4 sm:mr-2 mr-0" />
                    <span className="hidden sm:inline">Statistics</span>
                  </Button>
                </Link>
                <Link href="/settings">
                  <Button variant="ghost" size="sm">
                    <Settings className="h-4 w-4 sm:mr-2 mr-0" />
                    <span className="hidden sm:inline">Settings</span>
                  </Button>
                </Link>
              </nav>

              {/* Theme Toggle (now last) */}
              <Button variant="ghost" size="icon" onClick={toggleTheme}>
                {theme === "dark" ? (
                  <Sun className="h-4 w-4" />
                ) : (
                  <Moon className="h-4 w-4" />
                )}
              </Button>

              {/* User Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="relative h-10 w-10 rounded-full"
                  >
                    <Avatar className="h-10 w-10">
                      {user ? (
                        (() => {
                          // Try several common fields where providers store profile images
                          const meta = (user as any).user_metadata || {};
                          const url =
                            meta.avatar_url ||
                            meta.picture ||
                            meta.photo_url ||
                            meta.picture_url ||
                            (user as any).avatar_url ||
                            null;
                          return url ? (
                            <AvatarImage
                              src={url}
                              alt={user.email ?? "Profile"}
                            />
                          ) : (
                            <AvatarFallback>
                              {user.email?.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          );
                        })()
                      ) : (
                        <AvatarFallback>
                          <User className="h-4 w-4" />
                        </AvatarFallback>
                      )}
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  {user ? (
                    <>
                      <div className="flex flex-col space-y-1 p-2">
                        <p className="text-sm font-medium leading-none">
                          {user.email}
                        </p>
                        <p className="text-xs leading-none text-muted-foreground">
                          Data synced to cloud
                        </p>
                        <p className="text-xs leading-none text-muted-foreground">
                          Total Pomodoros: {totalCompleted ?? "—"}
                        </p>
                      </div>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={signOut}>
                        <LogOut className="mr-2 h-4 w-4" />
                        <span>Log out</span>
                      </DropdownMenuItem>
                    </>
                  ) : (
                    <>
                      <div className="flex flex-col space-y-1 p-2">
                        <p className="text-sm font-medium leading-none">
                          Guest User
                        </p>
                        <p className="text-xs leading-none text-muted-foreground">
                          Data stored locally
                        </p>
                      </div>
                      <DropdownMenuSeparator />
                      <Link href="/auth/login">
                        <DropdownMenuItem>
                          <LogIn className="mr-2 h-4 w-4" />
                          <span>Sign in with Google</span>
                        </DropdownMenuItem>
                      </Link>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 container mx-auto px-4 py-8 flex items-center justify-center">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 min-h-0 w-full">
          {/* Timer Section */}
          <div className="flex flex-col space-y-6">
            <Card className="flex-1 flex flex-col">
              <CardContent className="p-6 flex flex-col h-full">
                <div className="flex justify-center mb-6">
                  <TimerTabs
                    currentState={timerState}
                    onStateChange={(value) => {
                      // Tabs are an explicit activation by the user from the page
                      // treat them like arrow navigation and auto-start the timer.
                      setTimerState(value);
                      setExternalStateSource("tab");
                      // keep the centralized handler in sync
                      handleTimerStateChange(value);
                    }}
                  />
                </div>

                <div className="flex-1 flex items-center justify-center">
                  <PomodoroTimer
                    workDuration={settings.workDuration}
                    shortBreakDuration={settings.shortBreakDuration}
                    longBreakDuration={settings.longBreakDuration}
                    cycleLength={settings.cycleLength}
                    autoStartBreaks={settings.autoStartBreaks}
                    autoStartPomodoros={settings.autoStartPomodoros}
                    autoStartOnNavigation={settings.autoStartOnNavigation}
                    notificationsEnabled={settings.notificationsEnabled}
                    soundEnabled={settings.soundEnabled}
                    onSessionComplete={handleSessionComplete}
                    onTimerStateChange={handleTimerStateChange}
                    externalState={timerState}
                    externalStateSource={externalStateSource}
                    currentTask={
                      activeTask
                        ? {
                            id: activeTask.id,
                            title: activeTask.title,
                            estimatedPomodoros: activeTask.estimatedPomodoros,
                            completedPomodoros: activeTask.completedPomodoros,
                          }
                        : null
                    }
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Tasks Section */}
          <div className="flex flex-col h-full">
            <TaskList
              tasks={tasks}
              activeTaskId={activeTask?.id}
              timerState={timerState}
              onTaskSelect={handleTaskSelect}
              onTaskAdd={handleTaskAdd}
              onTaskEdit={handleTaskEdit}
              onTaskDelete={handleTaskDelete}
              onTaskDuplicate={handleTaskDuplicate}
            />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <img src="/jimmy-logo.svg" alt="Jimmy" width="16" height="16" />
              Jimmy
            </span>
            <a 
              href={process.env.NEXT_PUBLIC_GITHUB_URL} 
              target="_blank" 
              rel="noopener noreferrer"
              className="hover:text-foreground transition-colors"
            >
              <Github className="h-4 w-4" />
            </a>
            <a 
              href={process.env.NEXT_PUBLIC_LINKEDIN_URL} 
              target="_blank" 
              rel="noopener noreferrer"
              className="hover:text-foreground transition-colors"
            >
              <Linkedin className="h-4 w-4" />
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
