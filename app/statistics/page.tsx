"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Clock, Calendar, Flame, CheckCircle, TrendingUp, AlertCircle } from "lucide-react";
import Link from "next/link";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  LineChart,
  Line,
  ResponsiveContainer,
} from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { useAuth } from "@/lib/hooks/use-auth";
import { useStatistics } from "@/lib/hooks/use-statistics";

type TimeRange = "week" | "month" | "year";

export default function StatisticsPage() {
  const { user, loading: authLoading } = useAuth();
  const [timeRange, setTimeRange] = useState<TimeRange>("week");
  const { statistics, loading: statsLoading, error } = useStatistics(timeRange);

  const loading = authLoading || statsLoading;

  const chartConfig = useMemo(
    () =>
      ({
        work: {
          label: "Work",
          color: "var(--color-chart-1)",
        },
        shortBreak: {
          label: "Short Break",
          color: "var(--color-chart-2)",
        },
        longBreak: {
          label: "Long Break",
          color: "var(--color-chart-3)",
        },
        sessions: {
          label: "Sessions",
          color: "var(--color-chart-4)",
        },
        hours: {
          label: "Hours",
          color: "var(--color-chart-5)",
        },
      } satisfies ChartConfig),
    []
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b bg-card">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Link href="/">
                  <Button variant="ghost" size="icon">
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                </Link>
                <h1 className="text-2xl font-bold">Statistics</h1>
              </div>
            </div>
          </div>
        </header>
        <main className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading statistics...</p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b bg-card">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Link href="/">
                  <Button variant="ghost" size="icon">
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                </Link>
                <h1 className="text-2xl font-bold">Statistics</h1>
              </div>
            </div>
          </div>
        </header>
        <main className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <Card className="max-w-md">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3 text-destructive">
                  <AlertCircle className="h-5 w-5" />
                  <div>
                    <h3 className="font-semibold">Error Loading Statistics</h3>
                    <p className="text-sm text-muted-foreground mt-1">{error}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/">
                <Button variant="ghost" size="icon">
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              </Link>
              <h1 className="text-2xl font-bold">Statistics</h1>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline">
                {user ? "Cloud Data" : "Local Data"}
              </Badge>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="space-y-8">
          {/* Time Range Selector */}
          <Tabs
            value={timeRange}
            onValueChange={(value) => setTimeRange(value as TimeRange)}
          >
            <TabsList className="grid w-full max-w-md grid-cols-3">
              <TabsTrigger value="week">Week</TabsTrigger>
              <TabsTrigger value="month">Month</TabsTrigger>
              <TabsTrigger value="year">Year</TabsTrigger>
            </TabsList>

            <TabsContent value={timeRange} className="space-y-8">
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Hours Focused
                    </CardTitle>
                    <Clock className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {statistics.totalHours}h
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {statistics.totalMinutes} minutes total
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Pomodoros Completed
                    </CardTitle>
                    <CheckCircle className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {statistics.totalWorkSessions}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {statistics.totalSessions} total sessions
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Average Productivity
                    </CardTitle>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {statistics.averageProductivity || "N/A"}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Out of 5.0 rating
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Top Tasks
                    </CardTitle>
                    <Flame className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {statistics.topTasks.length}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Active projects
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Daily Sessions Chart */}
                <Card>
                  <CardHeader>
                    <CardTitle>Daily Sessions</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-4 items-center">
                      <ChartContainer config={chartConfig} className="h-[280px] w-full">
                        <BarChart data={statistics.sessionsByDay} margin={{ top: 20, right: 20, left: 10, bottom: 40 }}>
                          <CartesianGrid vertical={false} strokeDasharray="3 3" />
                          <XAxis
                            dataKey="date"
                            tickFormatter={(value) => {
                              const date = new Date(value);
                              return `${date.getMonth() + 1}/${date.getDate()}`;
                            }}
                            height={50}
                            tick={{ fontSize: 11 }}
                            axisLine={false}
                            tickLine={false}
                            label={{ value: "Date", position: "insideBottom", offset: -15 }}
                          />
                          <YAxis
                            width={40}
                            tick={{ fontSize: 11 }}
                            axisLine={false}
                            tickLine={false}
                            label={{ value: "Sessions", angle: -90, position: "insideLeft" }}
                          />
                          <ChartTooltip
                            content={
                              <ChartTooltipContent
                                labelFormatter={(value: string) => {
                                  const date = new Date(value);
                                  return date.toLocaleDateString();
                                }}
                              />
                            }
                          />
                          <Bar dataKey="work" name="Work" fill="var(--color-work)" radius={[4,4,0,0]} className="opacity-90 hover:opacity-100" />
                          <Bar dataKey="shortBreak" name="Short Break" fill="var(--color-shortBreak)" radius={[4,4,0,0]} className="opacity-90 hover:opacity-100" />
                          <Bar dataKey="longBreak" name="Long Break" fill="var(--color-longBreak)" radius={[4,4,0,0]} className="opacity-90 hover:opacity-100" />
                        </BarChart>
                      </ChartContainer>

                    </div>
                  </CardContent>
                </Card>

                {/* Weekly Progress Chart */}
                <Card>
                  <CardHeader>
                    <CardTitle>Weekly Progress</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-4 items-center">
                      <ChartContainer config={chartConfig} className="h-[280px] w-full">
                        <LineChart data={statistics.sessionsByWeek} margin={{ top: 20, right: 20, left: 10, bottom: 40 }}>
                          <CartesianGrid vertical={false} strokeDasharray="3 3" />
                          <XAxis
                            dataKey="week"
                            tickFormatter={(value) => {
                              const date = new Date(value);
                              return `W${Math.ceil(date.getDate() / 7)}`;
                            }}
                            height={50}
                            tick={{ fontSize: 11 }}
                            axisLine={false}
                            tickLine={false}
                            label={{ value: "Week", position: "insideBottom", offset: -15 }}
                          />
                          <YAxis
                            width={40}
                            tick={{ fontSize: 11 }}
                            axisLine={false}
                            tickLine={false}
                            label={{ value: "Count / Hours", angle: -90, position: "insideLeft" }}
                          />
                          <ChartTooltip
                            content={
                              <ChartTooltipContent
                                labelFormatter={(value: string) => {
                                  const date = new Date(value);
                                  return `Week of ${date.toLocaleDateString()}`;
                                }}
                              />
                            }
                          />
                          <Line
                            type="natural"
                            dataKey="sessions"
                            stroke="var(--color-sessions)"
                            strokeWidth={2.5}
                            dot={{ fill: "var(--color-sessions)", strokeWidth: 2, r: 4, stroke: "hsl(var(--background))" }}
                            activeDot={{ r: 5, stroke: "var(--color-sessions)", strokeWidth: 2, fill: "var(--color-sessions)" }}
                            name="Sessions"
                            className="opacity-90 hover:opacity-100 transition-opacity"
                          />
                          <Line
                            type="natural"
                            dataKey="hours"
                            stroke="var(--color-hours)"
                            strokeWidth={2.5}
                            dot={{ fill: "var(--color-hours)", strokeWidth: 2, r: 4, stroke: "hsl(var(--background))" }}
                            activeDot={{ r: 5, stroke: "var(--color-hours)", strokeWidth: 2, fill: "var(--color-hours)" }}
                            name="Hours"
                            className="opacity-90 hover:opacity-100 transition-opacity"
                          />
                        </LineChart>
                      </ChartContainer>

                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Top Tasks */}
              {statistics.topTasks.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Top Tasks by Sessions</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {statistics.topTasks.map((task, index) => (
                        <div
                          key={task.taskId}
                          className="flex items-center justify-between p-4 border rounded-lg"
                        >
                          <div className="flex items-center gap-3">
                            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-medium">
                              {index + 1}
                            </div>
                            <div>
                              <h4 className="font-medium">{task.taskTitle}</h4>
                              <p className="text-sm text-muted-foreground">
                                {task.sessions} sessions • {task.hours}h total
                              </p>
                            </div>
                          </div>
                          <Badge variant="outline">
                            {task.sessions} pomodoros
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Empty State */}
              {statistics.totalSessions === 0 && (
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center py-8">
                      <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-semibold mb-2">No Sessions Yet</h3>
                      <p className="text-muted-foreground mb-4">
                        Start your first Pomodoro session to see your statistics here.
                      </p>
                      <Link href="/">
                        <Button>Start Timer</Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}

