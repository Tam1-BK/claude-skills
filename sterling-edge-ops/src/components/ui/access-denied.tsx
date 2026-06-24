"use client";

import { ShieldOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export function AccessDenied() {
  const router = useRouter();
  return (
    <div className="flex flex-col items-center justify-center py-32 px-6 text-center">
      <div className="h-14 w-14 rounded-full bg-red-100 flex items-center justify-center mb-4">
        <ShieldOff className="h-7 w-7 text-red-500" />
      </div>
      <h2 className="text-lg font-semibold text-foreground mb-1">Access Denied</h2>
      <p className="text-sm text-muted-foreground mb-6 max-w-xs">
        You do not have permission to view this section.
      </p>
      <Button variant="outline" onClick={() => router.push("/")}>
        Go to Dashboard
      </Button>
    </div>
  );
}
