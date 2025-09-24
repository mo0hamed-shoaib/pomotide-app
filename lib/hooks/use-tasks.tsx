"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { useAuth } from "./use-auth"
import type { Task } from "@/components/tasks/task-card"

export function useTasks() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()
  const supabase = createClient()

  const STORAGE_KEY = "pomodoro_tasks"

  // Load tasks from localStorage
  const loadFromLocalStorage = (): Task[] => {
    if (typeof window === "undefined") return []
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      return stored ? JSON.parse(stored) : []
    } catch {
      return []
    }
  }

  // Save tasks to localStorage
  const saveToLocalStorage = (tasks: Task[]) => {
    if (typeof window === "undefined") return
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks))
    } catch (error) {
      console.error("Error saving to localStorage:", error)
    }
  }

  // Fetch tasks from database or localStorage
  const fetchTasks = async () => {
    if (!user) {
      const localTasks = loadFromLocalStorage()
      setTasks(localTasks)
      setLoading(false)
      return
    }

    try {
      const { data, error } = await supabase
        .from("tasks")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })

      if (error) throw error

      const formattedTasks: Task[] = data.map((task) => ({
        id: task.id,
        title: task.title,
        description: task.description,
        status: task.status,
        createdAt: new Date(task.created_at),
      }))

      setTasks(formattedTasks)
    } catch (error) {
      console.error("Error fetching tasks:", error)
      const localTasks = loadFromLocalStorage()
      setTasks(localTasks)
    } finally {
      setLoading(false)
    }
  }

  // Add new task
  const addTask = async (taskData: Omit<Task, "id" | "createdAt" | "status">) => {
    if (!user) {
      const newTask: Task = {
        id: `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        title: taskData.title,
        description: taskData.description,
        status: "pending",
        createdAt: new Date(),
      }
      const updatedTasks = [newTask, ...tasks]
      setTasks(updatedTasks)
      saveToLocalStorage(updatedTasks)
      return
    }

    try {
      const { data, error } = await supabase
        .from("tasks")
        .insert({
          user_id: user.id,
          title: taskData.title,
          description: taskData.description,
          status: "pending",
        })
        .select()
        .single()

      if (error) throw error

      const newTask: Task = {
        id: data.id,
        title: data.title,
        description: data.description,
        status: data.status,
        createdAt: new Date(data.created_at),
      }

      setTasks((prev) => [newTask, ...prev])
    } catch (error) {
      console.error("Error adding task:", error)
    }
  }

  // Update task
  const updateTask = async (taskId: string, updates: Partial<Task>) => {
    if (!user) {
      const updatedTasks = tasks.map((task) => (task.id === taskId ? { ...task, ...updates } : task))
      setTasks(updatedTasks)
      saveToLocalStorage(updatedTasks)
      return
    }

    try {
      const dbUpdates: any = {}
      if (updates.title !== undefined) dbUpdates.title = updates.title
      if (updates.description !== undefined) dbUpdates.description = updates.description
      if (updates.status !== undefined) dbUpdates.status = updates.status

      const { error } = await supabase.from("tasks").update(dbUpdates).eq("id", taskId).eq("user_id", user.id)

      if (error) throw error

      setTasks((prev) => prev.map((task) => (task.id === taskId ? { ...task, ...updates } : task)))
    } catch (error) {
      console.error("Error updating task:", error)
    }
  }

  // Delete task
  const deleteTask = async (taskId: string) => {
    if (!user) {
      const updatedTasks = tasks.filter((task) => task.id !== taskId)
      setTasks(updatedTasks)
      saveToLocalStorage(updatedTasks)
      return
    }

    try {
      const { error } = await supabase.from("tasks").delete().eq("id", taskId).eq("user_id", user.id)

      if (error) throw error

      setTasks((prev) => prev.filter((task) => task.id !== taskId))
    } catch (error) {
      console.error("Error deleting task:", error)
    }
  }

  useEffect(() => {
    fetchTasks()
  }, [user])

  return {
    tasks,
    loading,
    addTask,
    updateTask,
    deleteTask,
    refetch: fetchTasks,
  }
}
