import { CircleAlert } from "lucide-react";
import { Alert, AlertDescription } from "@/shared/ui/alert";

export function FormErrorAlert({ message }: { message?: string | null }) {
  if (!message) return null;

  return (
    <Alert
      variant="destructive"
      className="border-red-200 bg-red-50 text-red-900"
    >
      <CircleAlert className="size-4" aria-hidden="true" />
      <AlertDescription className="text-xs leading-relaxed text-red-800">
        {message}
      </AlertDescription>
    </Alert>
  );
}
