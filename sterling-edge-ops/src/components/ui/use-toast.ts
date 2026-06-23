"use client";

import { useState, useCallback } from "react";

type ToastVariant = "default" | "destructive";

interface Toast {
  id: string;
  title?: string;
  description?: string;
  variant?: ToastVariant;
}

let toastListeners: ((toasts: Toast[]) => void)[] = [];
let currentToasts: Toast[] = [];

function setToasts(toasts: Toast[]) {
  currentToasts = toasts;
  toastListeners.forEach((l) => l(toasts));
}

export function toast({ title, description, variant = "default" }: Omit<Toast, "id">) {
  const id = Math.random().toString(36).slice(2);
  setToasts([...currentToasts, { id, title, description, variant }]);
  setTimeout(() => {
    setToasts(currentToasts.filter((t) => t.id !== id));
  }, 4000);
}

export function useToast() {
  const [toasts, setLocalToasts] = useState<Toast[]>(currentToasts);

  const subscribe = useCallback((listener: (t: Toast[]) => void) => {
    toastListeners.push(listener);
    return () => {
      toastListeners = toastListeners.filter((l) => l !== listener);
    };
  }, []);

  useState(() => {
    const unsub = subscribe(setLocalToasts);
    return unsub;
  });

  return {
    toasts,
    toast,
    dismiss: (id: string) => setToasts(currentToasts.filter((t) => t.id !== id)),
  };
}
