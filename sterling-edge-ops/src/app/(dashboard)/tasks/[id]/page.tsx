"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, CheckCircle2, Circle, Calendar, Link as LinkIcon, Edit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatDate, getStatusColor, formatLabel, isOverdue, isDueSoon } from "@/lib/utils";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { TaskFormModal } from "@/components/tasks/task-form-modal";
import { toast } from "@/components/ui/use-toast";

const PRIORITY_COLORS: Record<string, string> = {
  URGENT: "bg-red-100 text-red-800",
  HIGH: "bg-orange-100 text-orange-800",
  MEDIUM: "bg-yellow-100 text-yellow-800",
  LOW: "bg-gray-100 text-gray-800",
};

export default function TaskDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [task, setTask] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [marking, setMarking] = useState(false);

  async function load() {
    setLoading(true);
    const res = await fetch(`/api/tasks/${id}`);
    if (res.status === 404) { setNotFound(true); setLoading(false); return; }
    const data = await res.json();
    setTask(data);
    setLoading(false);
  }

  useEffect(() => { load(); }, [id]);

  async function markDone() {
    setMarking(true);
    await fetch(`/api/tasks/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "DONE" }),
    });
    toast({ title: "Task marked complete" });
    load();
    setMarking(false);
  }

  if (loading) return (
    <div className="p-6 space-y-4">
      <div className="h-8 w-48 rounded bg-gray-100 animate-pulse" />
      <div className="h-40 rounded bg-gray-100 animate-pulse" />
    </div>
  );

  if (notFound) return (
    <div className="p-6 text-center py-24 text-muted-foreground">
      <div className="text-lg font-medium mb-2">Task not found</div>
      <Button variant="outline" onClick={() => router.push("/tasks")}>Back to Tasks</Button>
    </div>
  );

  if (!task) return null;

  const overdue = isOverdue(task.dueDate) && task.status !== "DONE";
  const dueSoon = isDueSoon(task.dueDate, 2) && task.status !== "DONE";
  const isDone = task.status === "DONE";

  return (
    <div className="flex flex-col h-full">
      <header className="h-14 border-b bg-white flex items-center justify-between px-6 shrink-0 sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => router.push("/tasks")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="min-w-0">
            <h1 className={cn("text-base font-semibold line-clamp-1", isDone && "line-through text-muted-foreground")}>
              {task.title}
            </h1>
            <p className="text-xs text-muted-foreground">{formatLabel(task.status)}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {!isDone && (
            <Button size="sm" variant="outline" onClick={markDone} disabled={marking}>
              <CheckCircle2 className="h-3.5 w-3.5" /> Mark Done
            </Button>
          )}
          <Button size="sm" variant="outline" onClick={() => setShowEdit(true)}>
            <Edit className="h-3.5 w-3.5" /> Edit
          </Button>
        </div>
      </header>

      <div className="p-6 space-y-6">
        {/* Overdue alert */}
        {overdue && (
          <div className="p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700 font-medium">
            This task is overdue. Please action or reschedule.
          </div>
        )}

        {/* Status cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="border rounded-lg p-4 bg-white">
            <div className="text-xs text-muted-foreground">Priority</div>
            <div className="mt-2">
              <span className={cn("inline-flex items-center rounded px-2 py-1 text-sm font-medium", PRIORITY_COLORS[task.priority])}>
                {task.priority}
              </span>
            </div>
          </div>
          <div className="border rounded-lg p-4 bg-white">
            <div className="text-xs text-muted-foreground">Status</div>
            <div className="mt-2">
              <span className={cn("inline-flex items-center rounded px-2 py-1 text-sm font-medium", getStatusColor(task.status))}>
                {isDone ? <CheckCircle2 className="h-3.5 w-3.5 mr-1 text-green-600" /> : <Circle className="h-3.5 w-3.5 mr-1" />}
                {formatLabel(task.status)}
              </span>
            </div>
          </div>
          <div className="border rounded-lg p-4 bg-white">
            <div className="text-xs text-muted-foreground">Due Date</div>
            <div className={cn("text-sm font-medium mt-2", overdue ? "text-red-600" : dueSoon ? "text-orange-600" : "")}>
              {task.dueDate ? (overdue ? `⚠ ${formatDate(task.dueDate)}` : formatDate(task.dueDate)) : "—"}
            </div>
          </div>
          <div className="border rounded-lg p-4 bg-white">
            <div className="text-xs text-muted-foreground">Assigned To</div>
            <div className="text-sm font-medium mt-2">{task.assignee?.name ?? "Unassigned"}</div>
          </div>
        </div>

        {/* Details card */}
        <div className="border rounded-lg p-5 bg-white space-y-3">
          <div className="font-medium text-sm">Task Details</div>
          <div className="space-y-3 text-sm">
            {task.description && (
              <div>
                <div className="text-xs text-muted-foreground mb-1">Description</div>
                <div className="text-sm whitespace-pre-wrap">{task.description}</div>
              </div>
            )}

            {/* Linked records */}
            {(task.client || task.tender || task.contract || task.supplier) && (
              <div className="pt-3 border-t space-y-2">
                <div className="text-xs text-muted-foreground font-medium">Linked To</div>
                {task.client && (
                  <div className="flex items-center gap-2">
                    <LinkIcon className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-muted-foreground text-xs">Client:</span>
                    <Link href={`/crm/${task.client.id}`} className="text-blue-600 hover:underline text-sm">
                      {task.client.name}
                    </Link>
                  </div>
                )}
                {task.tender && (
                  <div className="flex items-center gap-2">
                    <LinkIcon className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-muted-foreground text-xs">Tender:</span>
                    <Link href={`/tenders/${task.tender.id}`} className="text-blue-600 hover:underline text-sm">
                      {task.tender.tenderName}
                    </Link>
                  </div>
                )}
                {task.contract && (
                  <div className="flex items-center gap-2">
                    <LinkIcon className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-muted-foreground text-xs">Contract:</span>
                    <Link href={`/contracts/${task.contract.id}`} className="text-blue-600 hover:underline text-sm">
                      {task.contract.title}
                    </Link>
                  </div>
                )}
                {task.supplier && (
                  <div className="flex items-center gap-2">
                    <LinkIcon className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-muted-foreground text-xs">Supplier:</span>
                    <Link href={`/suppliers/${task.supplier.id}`} className="text-blue-600 hover:underline text-sm">
                      {task.supplier.name}
                    </Link>
                  </div>
                )}
              </div>
            )}

            {/* Meta */}
            <div className="pt-3 border-t grid grid-cols-2 gap-3 text-xs">
              {task.creator && (
                <div>
                  <div className="text-muted-foreground mb-0.5">Created by</div>
                  <div>{task.creator.name}</div>
                </div>
              )}
              <div>
                <div className="text-muted-foreground mb-0.5">Created</div>
                <div>{formatDate(task.createdAt)}</div>
              </div>
              {isDone && task.completedAt && (
                <div>
                  <div className="text-muted-foreground mb-0.5">Completed</div>
                  <div className="text-green-700 font-medium">{formatDate(task.completedAt)}</div>
                </div>
              )}
            </div>

            {task.notes && (
              <div className="pt-3 border-t text-xs text-muted-foreground whitespace-pre-wrap">{task.notes}</div>
            )}
          </div>
        </div>
      </div>

      <TaskFormModal open={showEdit} onClose={() => setShowEdit(false)} onSaved={load} task={task} />
    </div>
  );
}
