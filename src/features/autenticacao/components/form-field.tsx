import type { ReactNode } from "react";
import { Label } from "@/shared/ui/label";
import { cn } from "@/shared/lib/utils";

type FormFieldProps = {
 label: string;
 htmlFor: string;
 error?: string;
 hint?: ReactNode;
 required?: boolean;
 className?: string;
 children: ReactNode;
};

export function FormField({
 label,
 htmlFor,
 error,
 hint,
 required,
 className,
 children,
}: FormFieldProps) {
 const descriptionId = `${htmlFor}-description`;

 return (
 <div className={cn("space-y-1.5", className)}>
 <Label
 htmlFor={htmlFor}
 className="text-[13px] font-semibold text-foreground"
 >
 {label}
 {required ? (
 <span className="ml-0.5 text-destructive" aria-hidden="true">
 *
 </span>
 ) : null}
 </Label>
 {children}
 {error ? (
 <p
 id={descriptionId}
 role="alert"
 className="text-xs font-medium text-destructive"
 >
 {error}
 </p>
 ) : hint ? (
 <div
 id={descriptionId}
 className="text-xs leading-relaxed text-muted-foreground"
 >
 {hint}
 </div>
 ) : null}
 </div>
 );
}
