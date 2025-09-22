"use client"

import { useEffect } from "react"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { TimerState } from "./pomodoro-timer"

interface TimerTabsProps {
  currentState: TimerState
  onStateChange: (state: TimerState) => void
}

export function TimerTabs({ currentState, onStateChange }: TimerTabsProps) {
  useEffect(() => {
    // This ensures the tabs stay in sync when timer state changes from arrow navigation
  }, [currentState])

  return (
    <Tabs value={currentState} onValueChange={(value) => onStateChange(value as TimerState)}>
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="work" className="text-sm">
          Focus
        </TabsTrigger>
        <TabsTrigger value="short_break" className="text-sm">
          Short Break
        </TabsTrigger>
        <TabsTrigger value="long_break" className="text-sm">
          Long Break
        </TabsTrigger>
      </TabsList>
    </Tabs>
  )
}
