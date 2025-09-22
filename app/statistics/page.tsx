"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Clock, Calendar, Flame, CheckCircle } from "lucide-react"
import Link from "next/link"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts"
import { useAuth } from "@/lib/hooks/use-auth"

type TimeRange = "week" | "month" | "year"

export default function StatisticsPage() {
  const { user, loading } = useAuth()
  const [timeRange, setTimeRange] = useState<TimeRange>("week")

  // Mock data - will be replaced with real data from database
  const mockSessions = [
    { date: "2024-01-15", type: "work", duration: 25, productivity: 4 },
    { date: "2024-01-15", type: "work", duration: 25, productivity: 5 },
    { date: "2024-01-15", type: "work", duration: 25, productivity: 3 },
    { date: "2024-01-16", type: "work", duration: 25, productivity: 4 },
    { date: "2024-01-16", type: "work", duration: 25, productivity: 4 },
    { date: "2024-01-17", type: "work", duration: 25, productivity: 5 },
    { date: "2024-01-17", type: "work", duration: 25, productivity: 5 },
    { date: "2024-01-17", type: "work", duration: 25, productivity: 4 },
    { date: "2024-01-18", type: "work", duration: 25, productivity: 3 },
    { date: "2024-01-19", type: "work", duration: 25, productivity: 4 },
    { date: "2024-01-19", type: "work", duration: 25, productivity: 5 },
    { date: "2024-01-20", type: "work", duration: 25, productivity: 4 },
    { date: "2024-01-21", type: "work", duration: 25, productivity: 5 },
    { date: "2024-01-21", type: "work", duration: 25, productivity: 4 },
  ]

  const mockTasks = [
    { id: "1", title: "Design System Updates", completedPomodoros: 8, estimatedPomodoros: 6, status: "completed" },
    { id: "2", title: "API Integration", completedPomodoros: 4, estimatedPomodoros: 5, status: "in_progress" },
    { id: "3", title: "User Testing", completedPomodoros: 3, estimatedPomodoros: 3, status: "completed" },
  ]

  const stats = useMemo(() => {
    const workSessions = mockSessions.filter((s) => s.type === "work")
    const totalMinutes = workSessions.reduce((sum, s) => sum + s.duration, 0)
    const totalHours = Math.floor(totalMinutes / 60)
    const avgProductivity = workSessions.reduce((sum, s) => sum + s.productivity, 0) / workSessions.length
    const uniqueDays = new Set(workSessions.map((s) => s.date)).size
    const completedTasks = mockTasks.filter((t) => t.status === "completed").length

    // Calculate streak (consecutive days with sessions)
    const dates = Array.from(new Set(workSessions.map((s) => s.date))).sort()
    let currentStreak = 0
    const today = new Date().toISOString().split("T")[0]

    for (let i = dates.length - 1; i >= 0; i--) {
      const date = dates[i]
      const daysDiff = Math.floor((new Date(today).getTime() - new Date(date).getTime()) / (1000 * 60 * 60 * 24))

      if (daysDiff === currentStreak) {
        currentStreak++
      } else {
        break
      }
    }

    return {
      totalHours,
      totalMinutes,
      avgProductivity: Math.round(avgProductivity * 10) / 10,
      daysAccessed: uniqueDays,
      dayStreak: currentStreak,
      completedTasks,
      totalPomodoros: workSessions.length,
    }
  }, [])

  const chartData = useMemo(() => {
    const sessionsByDate = mockSessions.reduce(
      (acc, session) => {
        if (!acc[session.date]) {
          acc[session.date] = { date: session.date, pomodoros: 0, productivity: 0, count: 0 }
        }
        if (session.type === "work") {
          acc[session.date].pomodoros++
          acc[session.date].productivity += session.productivity
          acc[session.date].count++
        }
        return acc
      },
      {} as Record<string, { date: string; pomodoros: number; productivity: number; count: number }>,
    )

    return Object.values(sessionsByDate).map((day) => ({
      date: new Date(day.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      pomodoros: day.pomodoros,
      productivity: day.count > 0 ? Math.round((day.productivity / day.count) * 10) / 10 : 0,
    }))
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <h1 className="text-2xl font-bold">Statistics</h1>
            {user ? (
              <Badge variant="default" className="text-xs">
                Data synced to cloud
              </Badge>
            ) : (
              <Badge variant="secondary" className="text-xs">
                Data stored locally
              </Badge>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="space-y-8">
          {/* Time Range Selector */}
          <Tabs value={timeRange} onValueChange={(value) => setTimeRange(value as TimeRange)}>
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
                    <CardTitle className="text-sm font-medium">Hours Focused</CardTitle>
                    <Clock className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.totalHours}h</div>
                    <p className="text-xs text-muted-foreground">{stats.totalMinutes} minutes total</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Days Accessed</CardTitle>
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.daysAccessed}</div>
                    <p className="text-xs text-muted-foreground">Active days this {timeRange}</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Day Streak</CardTitle>
                    <Flame className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.dayStreak}</div>
                    <p className="text-xs text-muted-foreground">Consecutive active days</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Tasks</CardTitle>
                    <CheckCircle className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.completedTasks}</div>
                    <p className="text-xs text-muted-foreground">Tasks completed</p>
                  </CardContent>
                </Card>
              </div>

              {/* Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Pomodoros Chart */}
                <Card>
                  <CardHeader>
                    <CardTitle>Daily Pomodoros</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis dataKey="date" className="text-muted-foreground" />
                        <YAxis className="text-muted-foreground" />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "hsl(var(--card))",
                            border: "1px solid hsl(var(--border))",
                            borderRadius: "8px",
                          }}
                        />
                        <Bar dataKey="pomodoros" fill="url(#colorGradient)" radius={[4, 4, 0, 0]} />
                        <defs>
                          <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="hsl(var(--chart-1))" />
                            <stop offset="100%" stopColor="hsl(var(--chart-2))" />
                          </linearGradient>
                        </defs>
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* Productivity Chart */}
                <Card>
                  <CardHeader>
                    <CardTitle>Productivity Trend</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis dataKey="date" className="text-muted-foreground" />
                        <YAxis domain={[1, 5]} className="text-muted-foreground" />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "hsl(var(--card))",
                            border: "1px solid hsl(var(--border))",
                            borderRadius: "8px",
                          }}
                        />
                        <Line
                          type="monotone"
                          dataKey="productivity"
                          stroke="hsl(var(--chart-3))"
                          strokeWidth={3}
                          dot={{ fill: "hsl(var(--chart-4))", strokeWidth: 2, r: 6 }}
                          activeDot={{ r: 8, fill: "hsl(var(--chart-5))" }}
                          connectNulls={true}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>

              {/* Productivity Overview */}
              <Card>
                <CardHeader>
                  <CardTitle>Productivity Overview</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Average Productivity</span>
                      <div className="flex items-center gap-2">
                        <div className="flex gap-1">
                          {Array.from({ length: 5 }, (_, i) => (
                            <div
                              key={i}
                              className={`w-3 h-3 rounded-full ${
                                i < Math.floor(stats.avgProductivity)
                                  ? "bg-chart-4"
                                  : i < stats.avgProductivity
                                    ? "bg-chart-4 opacity-50"
                                    : "bg-muted"
                              }`}
                            />
                          ))}
                        </div>
                        <Badge variant="secondary">{stats.avgProductivity}/5</Badge>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-chart-1">{stats.totalPomodoros}</div>
                        <div className="text-sm text-muted-foreground">Total Pomodoros</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-chart-2">
                          {Math.round((stats.totalPomodoros / stats.daysAccessed) * 10) / 10}
                        </div>
                        <div className="text-sm text-muted-foreground">Avg per Day</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-chart-3">
                          {Math.round((stats.totalHours / stats.daysAccessed) * 10) / 10}h
                        </div>
                        <div className="text-sm text-muted-foreground">Avg Hours per Day</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  )
}
