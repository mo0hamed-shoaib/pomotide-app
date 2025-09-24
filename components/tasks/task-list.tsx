"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Plus } from "lucide-react";
import { TaskCard, type Task } from "./task-card";
export type { Task };
import { TaskForm } from "./task-form";

interface TaskListProps {
  tasks: Task[];
  activeTaskId?: string;
  timerState?: "work" | "short_break" | "long_break";
  onTaskSelect: (task: Task) => void;
  onTaskAdd: (
    task: Omit<Task, "id" | "createdAt" | "status">
  ) => void;
  onTaskEdit: (taskId: string, updates: Partial<Task>) => void;
  onTaskDelete: (taskId: string) => void;
  onTaskDuplicate: (task: Task) => void;
}

export function TaskList({
  tasks,
  activeTaskId,
  timerState = "work",
  onTaskSelect,
  onTaskAdd,
  onTaskEdit,
  onTaskDelete,
  onTaskDuplicate,
}: TaskListProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const handleAddTask = (taskData: {
    title: string;
    description: string;
  }) => {
    onTaskAdd(taskData);
    setShowAddForm(false);
  };

  const handleEditTask = (taskData: {
    title: string;
    description: string;
  }) => {
    if (editingTask) {
      onTaskEdit(editingTask.id, taskData);
      setEditingTask(null);
    }
  };

  const handleDuplicateTask = (task: Task) => {
    onTaskAdd({
      title: `${task.title} (Copy)`,
      description: task.description,
    });
  };

  const sortedTasks = [...tasks].sort((a, b) => {
    if (a.status === "completed" && b.status !== "completed") return 1;
    if (b.status === "completed" && a.status !== "completed") return -1;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Tasks</CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowAddForm(true)}
            disabled={showAddForm || editingTask !== null}
          >
            <Plus className="h-4 w-4 mr-1" />
            Add Task
          </Button>
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col min-h-0 p-0">
        <ScrollArea className="h-[510px] px-6">
          <div className="space-y-3 pb-6">
            {/* Add Task Form */}
            {showAddForm && (
              <TaskForm
                onSubmit={handleAddTask}
                onCancel={() => setShowAddForm(false)}
              />
            )}

            {/* Task Cards */}
            {sortedTasks.map((task) => (
              <div key={task.id}>
                {editingTask?.id === task.id ? (
                  <TaskForm
                    onSubmit={handleEditTask}
                    onCancel={() => setEditingTask(null)}
                    initialData={editingTask}
                    isEditing
                  />
                ) : (
                  <TaskCard
                    task={task}
                    isActive={task.id === activeTaskId}
                    timerState={timerState}
                    onEdit={setEditingTask}
                    onDelete={onTaskDelete}
                    onDuplicate={handleDuplicateTask}
                    onSelect={onTaskSelect}
                  />
                )}
              </div>
            ))}

            {/* Empty State */}
            {tasks.length === 0 && !showAddForm && (
              <div className="text-center py-12 text-muted-foreground">
                <div className="space-y-2">
                  <p className="text-lg">No tasks yet</p>
                  <p className="text-mm">When you add a task, you can click it to start or stop working on it, and tasks do not have a mark as completed option because they are not a list of things to do, but a list of things you are doing.</p>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
