"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Plus, X } from "lucide-react"

interface TaskFormData {
  title: string
  description: string
  estimatedPomodoros: number
}

interface TaskFormProps {
  onSubmit: (task: TaskFormData) => void
  onCancel?: () => void
  initialData?: Partial<TaskFormData>
  isEditing?: boolean
}

export function TaskForm({ onSubmit, onCancel, initialData, isEditing = false }: TaskFormProps) {
  const [formData, setFormData] = useState<TaskFormData>({
    title: initialData?.title || "",
    description: initialData?.description || "",
    estimatedPomodoros: initialData?.estimatedPomodoros || 1,
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (formData.title.trim()) {
      onSubmit(formData)
      if (!isEditing) {
        setFormData({ title: "", description: "", estimatedPomodoros: 1 })
      }
    }
  }

  const adjustPomodoros = (delta: number) => {
    setFormData((prev) => ({
      ...prev,
      estimatedPomodoros: Math.max(1, prev.estimatedPomodoros + delta),
    }))
  }

  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="text-lg">{isEditing ? "Edit Task" : "Add New Task"}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">What are you working on?</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
              placeholder="Enter your task..."
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="pomodoros">Estimated Pomodoros</Label>
            <div className="flex items-center gap-3">
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => adjustPomodoros(-1)}
                disabled={formData.estimatedPomodoros <= 1}
                className="h-8 w-8"
              >
                <X className="h-4 w-4" />
              </Button>
              <Badge variant="secondary" className="px-4 py-2 text-base font-mono">
                {formData.estimatedPomodoros}
              </Badge>
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => adjustPomodoros(1)}
                className="h-8 w-8"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Notes (optional)</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
              placeholder="Add any notes about this task..."
              rows={3}
            />
          </div>

          <div className="flex gap-2 pt-2">
            <Button type="submit" className="flex-1">
              {isEditing ? "Save Changes" : "Add Task"}
            </Button>
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancel
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
