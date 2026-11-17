"use client";

import { Toaster } from "@/shared/ui/sonner";
import { TooltipProvider } from "@/shared/ui/tooltip";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <TooltipProvider delayDuration={250}>
      {children}
      <Toaster
        position="top-right"
        closeButton
        richColors
        toastOptions={{
          className: "font-sans",
        }}
      />
    </TooltipProvider>
  );
}
