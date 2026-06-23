import { Header } from "@/components/layout/header";
import { TasksContent } from "@/components/tasks/tasks-content";

export default function TasksPage() {
  return (
    <div className="flex flex-col h-full">
      <Header title="Task Manager" subtitle="Track deadlines, follow-ups, and action items" />
      <TasksContent />
    </div>
  );
}
