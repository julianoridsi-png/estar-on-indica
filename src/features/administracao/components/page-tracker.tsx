"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { trackPageViewAction } from "@/features/administracao/services/actions";

export function PageTracker() {
  const pathname = usePathname();

  useEffect(() => {
    if (pathname) {
      trackPageViewAction(pathname);
    }
  }, [pathname]);

  return null;
}
