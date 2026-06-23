"use client";

import { useToast } from "@/components/ui/use-toast";
import { X } from "lucide-react";

export function Toaster() {
  const { toasts, dismiss } = useToast();

  return (
    <div className="fixed bottom-4 right-4 z-[100] flex max-h-screen flex-col-reverse gap-2">
      {toasts.map(({ id, title, description, variant }) => (
        <div
          key={id}
          className={`relative flex w-80 items-start gap-3 rounded-lg border p-4 shadow-lg animate-in slide-in-from-right-full ${
            variant === "destructive"
              ? "border-red-200 bg-red-50 text-red-900"
              : "border-border bg-white text-foreground"
          }`}
        >
          <div className="flex-1">
            {title && <div className="text-sm font-semibold">{title}</div>}
            {description && <div className="text-sm text-muted-foreground">{description}</div>}
          </div>
          <button onClick={() => dismiss(id)} className="text-muted-foreground hover:text-foreground">
            <X className="h-4 w-4" />
          </button>
        </div>
      ))}
    </div>
  );
}
