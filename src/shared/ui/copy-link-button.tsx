"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/shared/ui/button";

export function CopyLinkButton({
 url,
 label = "Copiar link",
}: {
 url: string;
 label?: string;
}) {
 const [copied, setCopied] = useState(false);

 async function handleCopy() {
  try {
   await navigator.clipboard.writeText(url);
   setCopied(true);
   toast.success("Link copiado para a área de transferência.");
   setTimeout(() => setCopied(false), 2000);
  } catch {
   toast.error("Não foi possível copiar o link.");
  }
 }

 return (
  <Button
   type="button"
   variant="outline"
   size="sm"
   className="h-9"
   onClick={handleCopy}
   aria-label={label}
  >
   {copied ? (
    <Check className="size-4" aria-hidden="true" />
   ) : (
    <Copy className="size-4" aria-hidden="true" />
   )}
   {copied ? "Copiado" : label}
  </Button>
 );
}
