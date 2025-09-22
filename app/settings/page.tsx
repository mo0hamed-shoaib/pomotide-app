"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Clock, Play, RotateCcw } from "lucide-react"
import Link from "next/link"

interface Settings {
  workDuration: number
  shortBreakDuration: number
  longBreakDuration: number
  autoStartBreaks: boolean
  autoStartPomodoros: boolean
  autoCheckCompletedTasks: boolean
}

const defaultSettings: Settings = {
  workDuration: 25,
  shortBreakDuration: 5,
  longBreakDuration: 15,
  autoStartBreaks: true,
  autoStartPomodoros: true,
  autoCheckCompletedTasks: false,
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings>(defaultSettings)
  const [hasChanges, setHasChanges] = useState(false)

  const updateSetting = <K extends keyof Settings>(key: K, value: Settings[K]) => {
    setSettings((prev) => ({ ...prev, [key]: value }))
    setHasChanges(true)
  }

  const handleDurationChange = (
    key: keyof Pick<Settings, "workDuration" | "shortBreakDuration" | "longBreakDuration">,
    value: string,
  ) => {
    const numValue = Number.parseInt(value) || 1
    const clampedValue = Math.max(1, Math.min(120, numValue)) // 1-120 minutes
    updateSetting(key, clampedValue)
  }

  const resetToDefaults = () => {
    setSettings(defaultSettings)
    setHasChanges(true)
  }

  const saveSettings = () => {
    // TODO: Save to database when data persistence is integrated
    console.log("Saving settings:", settings)
    setHasChanges(false)
    // Show success toast or feedback
  }

  const formatDuration = (minutes: number) => {
    if (minutes >= 60) {
      const hours = Math.floor(minutes / 60)
      const mins = minutes % 60
      return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`
    }
    return `${minutes}m`
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
              <h1 className="text-2xl font-bold">Settings</h1>
            </div>
            {hasChanges && <Button onClick={saveSettings}>Save Changes</Button>}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="space-y-8">
          {/* Timer Durations */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Timer Durations
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Work Duration */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label htmlFor="work-duration" className="text-base font-medium">
                    Pomodoro Duration
                  </Label>
                  <Badge variant="outline">{formatDuration(settings.workDuration)}</Badge>
                </div>
                <div className="flex items-center gap-4">
                  <Input
                    id="work-duration"
                    type="number"
                    min="1"
                    max="120"
                    value={settings.workDuration}
                    onChange={(e) => handleDurationChange("workDuration", e.target.value)}
                    className="w-24"
                  />
                  <span className="text-sm text-muted-foreground">minutes</span>
                </div>
                <p className="text-sm text-muted-foreground">Duration of focused work sessions (default: 25 minutes)</p>
              </div>

              <Separator />

              {/* Short Break Duration */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label htmlFor="short-break-duration" className="text-base font-medium">
                    Short Break Duration
                  </Label>
                  <Badge variant="outline">{formatDuration(settings.shortBreakDuration)}</Badge>
                </div>
                <div className="flex items-center gap-4">
                  <Input
                    id="short-break-duration"
                    type="number"
                    min="1"
                    max="60"
                    value={settings.shortBreakDuration}
                    onChange={(e) => handleDurationChange("shortBreakDuration", e.target.value)}
                    className="w-24"
                  />
                  <span className="text-sm text-muted-foreground">minutes</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Duration of short breaks between pomodoros (default: 5 minutes)
                </p>
              </div>

              <Separator />

              {/* Long Break Duration */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label htmlFor="long-break-duration" className="text-base font-medium">
                    Long Break Duration
                  </Label>
                  <Badge variant="outline">{formatDuration(settings.longBreakDuration)}</Badge>
                </div>
                <div className="flex items-center gap-4">
                  <Input
                    id="long-break-duration"
                    type="number"
                    min="1"
                    max="120"
                    value={settings.longBreakDuration}
                    onChange={(e) => handleDurationChange("longBreakDuration", e.target.value)}
                    className="w-24"
                  />
                  <span className="text-sm text-muted-foreground">minutes</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Duration of long breaks after 4 pomodoros (default: 15 minutes)
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Automation Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Play className="h-5 w-5" />
                Automation
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Auto Start Breaks */}
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label htmlFor="auto-start-breaks" className="text-base font-medium">
                    Auto-start Breaks
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Automatically start break timers when work sessions end
                  </p>
                </div>
                <Switch
                  id="auto-start-breaks"
                  checked={settings.autoStartBreaks}
                  onCheckedChange={(checked) => updateSetting("autoStartBreaks", checked)}
                />
              </div>

              <Separator />

              {/* Auto Start Pomodoros */}
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label htmlFor="auto-start-pomodoros" className="text-base font-medium">
                    Auto-start Pomodoros
                  </Label>
                  <p className="text-sm text-muted-foreground">Automatically start work sessions when breaks end</p>
                </div>
                <Switch
                  id="auto-start-pomodoros"
                  checked={settings.autoStartPomodoros}
                  onCheckedChange={(checked) => updateSetting("autoStartPomodoros", checked)}
                />
              </div>

              <Separator />

              {/* Auto Check Completed Tasks */}
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label htmlFor="auto-check-completed" className="text-base font-medium">
                    Auto-check Completed Tasks
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Automatically mark tasks as completed when all pomodoros are finished
                  </p>
                </div>
                <Switch
                  id="auto-check-completed"
                  checked={settings.autoCheckCompletedTasks}
                  onCheckedChange={(checked) => updateSetting("autoCheckCompletedTasks", checked)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Preview */}
          <Card>
            <CardHeader>
              <CardTitle>Timer Preview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-mono font-bold text-primary">
                    {String(settings.workDuration).padStart(2, "0")}:00
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">Focus Time</div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-mono font-bold text-chart-2">
                    {String(settings.shortBreakDuration).padStart(2, "0")}:00
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">Short Break</div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-mono font-bold text-chart-3">
                    {String(settings.longBreakDuration).padStart(2, "0")}:00
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">Long Break</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Reset to Defaults */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <RotateCcw className="h-5 w-5" />
                Reset Settings
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-base font-medium">Reset to Default Values</p>
                  <p className="text-sm text-muted-foreground">
                    This will reset all settings to their original values (25/5/15 minutes)
                  </p>
                </div>
                <Button variant="outline" onClick={resetToDefaults}>
                  Reset
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Save Button */}
          {hasChanges && (
            <div className="flex justify-center pt-4">
              <Button onClick={saveSettings} size="lg" className="w-full md:w-auto">
                Save Settings
              </Button>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
