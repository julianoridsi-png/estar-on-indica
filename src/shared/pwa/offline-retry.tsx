"use client";

import { RefreshCw } from "lucide-react";
import { Button } from "@/shared/ui/button";

export function OfflineRetry() {
  return (
    <Button
      type="button"
      size="lg"
      className="w-full"
      onClick={() => window.location.reload()}
    >
      <RefreshCw className="size-4" aria-hidden="true" />
      Tentar novamente
    </Button>
  );
}
