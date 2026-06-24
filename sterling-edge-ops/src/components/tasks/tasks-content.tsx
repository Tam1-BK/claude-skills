"use client";

import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search, CheckCircle2, Circle, Calendar, Link as LinkIcon, ExternalLink } from "lucide-react";
import Link from "next/link";
import { formatDate, getStatusColor, formatLabel, isOverdue, isDueSoon } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { TaskFormModal } from "@/components/tasks/task-form-modal";
import { toast } from "@/components/ui/use-toast";

const PRIORITY_COLORS: Record<string, string> = {
  URGENT: "bg-red-500",
  HIGH: "bg-orange-500",
  MEDIUM: "bg-yellow-500",
  LOW: "bg-gray-300",
};

export function TasksContent() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [showForm, setShowForm] = useState(false);
  const [showDone, setShowDone] = useState(false);

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (priorityFilter !== "all") params.set("priority", priorityFilter);
    if (showDone) params.set("status", "DONE");
    const res = await fetch(`/api/tasks?${params}`);
    const json = await res.json();
    setTasks(json.data ?? []);
    setLoading(false);
  }, [priorityFilter, showDone]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  async function markDone(id: string) {
    await fetch(`/api/tasks/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "DONE" }),
    });
    toast({ title: "Task marked complete" });
    fetchTasks();
  }

  const overdue = tasks.filter(t => isOverdue(t.dueDate) && t.status !== "DONE");
  const dueToday = tasks.filter(t => {
    const d = t.dueDate ? new Date(t.dueDate) : null;
    if (!d) return false;
    const today = new Date();
    return d.toDateString() === today.toDateString();
  });
  const urgent = tasks.filter(t => t.priority === "URGENT");

  return (
    <div className="p-6 space-y-5">
      {/* Summary */}
      <div className="flex gap-4 flex-wrap">
        {overdue.length > 0 && (
          <div className="flex items-center gap-2 px-3 py-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">
            <span className="font-semibold">{overdue.length}</span> overdue
          </div>
        )}
        {dueToday.length > 0 && (
          <div className="flex items-center gap-2 px-3 py-2 bg-orange-50 border border-orange-200 rounded text-sm text-orange-700">
            <span className="font-semibold">{dueToday.length}</span> due today
          </div>
        )}
        {urgent.length > 0 && (
          <div className="flex items-center gap-2 px-3 py-2 bg-yellow-50 border border-yellow-200 rounded text-sm text-yellow-700">
            <span className="font-semibold">{urgent.length}</span> urgent
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Select value={priorityFilter} onValueChange={setPriorityFilter}>
          <SelectTrigger className="w-36"><SelectValue placeholder="All priorities" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All priorities</SelectItem>
            {["URGENT", "HIGH", "MEDIUM", "LOW"].map((p) => (
              <SelectItem key={p} value={p}>{p}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button variant="outline" size="sm" onClick={() => setShowDone(!showDone)}>
          {showDone ? "Hide completed" : "Show completed"}
        </Button>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="h-4 w-4" /> Add Task
        </Button>
      </div>

      {loading ? (
        <div className="space-y-2">
          {[...Array(6)].map((_, i) => <div key={i} className="h-16 rounded bg-gray-100 animate-pulse" />)}
        </div>
      ) : tasks.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          No tasks found. <button onClick={() => setShowForm(true)} className="text-blue-600 hover:underline">Add a task.</button>
        </div>
      ) : (
        <div className="space-y-2">
          {tasks.map((task) => {
            const overdueBadge = isOverdue(task.dueDate) && task.status !== "DONE";
            const dueSoon = isDueSoon(task.dueDate, 2) && task.status !== "DONE";
            const isDone = task.status === "DONE";

            return (
              <div key={task.id} className={cn(
                "flex items-start gap-3 p-4 border rounded-lg bg-white hover:shadow-sm transition-shadow",
                isDone && "opacity-60",
                overdueBadge && "border-red-200 bg-red-50/30"
              )}>
                <button
                  onClick={() => !isDone && markDone(task.id)}
                  className="mt-0.5 shrink-0"
                >
                  {isDone ? (
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                  ) : (
                    <Circle className="h-5 w-5 text-muted-foreground hover:text-green-500 transition-colors" />
                  )}
                </button>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className={cn("h-2 w-2 rounded-full shrink-0 mt-1.5", PRIORITY_COLORS[task.priority])} />
                      <Link href={`/tasks/${task.id}`} className={cn("font-medium text-sm hover:text-blue-600 transition-colors", isDone && "line-through text-muted-foreground")}>
                        {task.title}
                      </Link>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {task.priority === "URGENT" && !isDone && (
                        <span className="text-xs font-medium text-red-700 bg-red-100 px-1.5 py-0.5 rounded">URGENT</span>
                      )}
                      <span className={cn("text-xs rounded px-2 py-0.5", getStatusColor(task.status))}>
                        {formatLabel(task.status)}
                      </span>
                    </div>
                  </div>

                  {task.description && (
                    <div className="text-xs text-muted-foreground mt-1 ml-4">{task.description}</div>
                  )}

                  <div className="flex flex-wrap items-center gap-3 mt-2 ml-4 text-xs text-muted-foreground">
                    {task.dueDate && (
                      <span className={cn(
                        "flex items-center gap-1",
                        overdueBadge ? "text-red-600 font-medium" : dueSoon ? "text-orange-600 font-medium" : ""
                      )}>
                        <Calendar className="h-3 w-3" />
                        {overdueBadge ? "Overdue · " : ""}{formatDate(task.dueDate)}
                      </span>
                    )}
                    {task.assignee && (
                      <span>→ {task.assignee.name}</span>
                    )}
                    {task.client && (
                      <span className="flex items-center gap-1">
                        <LinkIcon className="h-3 w-3" /> {task.client.name}
                      </span>
                    )}
                    {task.tender && (
                      <span className="flex items-center gap-1">
                        <LinkIcon className="h-3 w-3" /> {task.tender.tenderName.substring(0, 30)}...
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <TaskFormModal open={showForm} onClose={() => setShowForm(false)} onSaved={fetchTasks} />
    </div>
  );
}
