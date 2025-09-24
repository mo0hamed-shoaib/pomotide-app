"use client"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Edit, MoreVertical, Copy, Trash2 } from "lucide-react"
import { cn } from "@/lib/utils"

export interface Task {
  id: string
  title: string
  description?: string
  status: "pending" | "in_progress" | "completed"
  createdAt: Date
}

interface TaskCardProps {
  task: Task
  isActive?: boolean
  timerState?: "work" | "short_break" | "long_break"
  onEdit: (task: Task) => void
  onDelete: (taskId: string) => void
  onDuplicate: (task: Task) => void
  onSelect: (task: Task) => void
}

export function TaskCard({
  task,
  isActive,
  timerState = "work",
  onEdit,
  onDelete,
  onDuplicate,
  onSelect,
}: TaskCardProps) {
  const isCompleted = task.status === "completed"

  const getBorderColor = () => {
    if (!isActive) return ""
    switch (timerState) {
      case "work":
        return "border-red-500"
      case "short_break":
        return "border-green-500"
      case "long_break":
        return "border-blue-500"
      default:
        return "border-primary"
    }
  }

  const getStatusBadge = () => {
    if (!isActive) return null

    switch (timerState) {
      case "work":
        return (
          <Badge variant="destructive" className="text-xs">
            Working
          </Badge>
        )
      case "short_break":
        return <Badge className="text-xs bg-green-500 hover:bg-green-600">Short Break</Badge>
      case "long_break":
        return <Badge className="text-xs bg-blue-500 hover:bg-blue-600">Long Break</Badge>
      default:
        return null
    }
  }

  return (
    <Card
      className={cn(
        "transition-all cursor-pointer hover:shadow-md",
        isActive && `border-2 ${getBorderColor()}`,
        isCompleted && "opacity-75",
      )}
      onClick={() => !isCompleted && onSelect(task)}
    >
      <CardContent className="p-4">
        <div className="space-y-3">
          {/* Header */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <h3
                className={cn(
                  "font-medium text-balance leading-tight mb-1",
                  isCompleted && "line-through text-muted-foreground",
                )}
              >
                {task.title}
              </h3>
              {task.description && (
                <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{task.description}</p>
              )}
            </div>

            <div className="flex items-center gap-2">
              {getStatusBadge()}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation()
                      onEdit(task)
                    }}
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation()
                      onDuplicate(task)
                    }}
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    Duplicate
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation()
                      onDelete(task.id)
                    }}
                    className="text-destructive"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

        </div>
      </CardContent>
    </Card>
  )
}
