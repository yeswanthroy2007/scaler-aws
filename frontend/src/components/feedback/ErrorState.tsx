import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface ErrorStateProps {
  message?: string;
  onRetry?: () => void;
}

export function ErrorState({ message = "Something went wrong while loading this data.", onRetry }: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 px-6 py-14 text-center">
      <AlertTriangle size={28} className="mb-1 text-[var(--color-danger)]" aria-hidden="true" />
      <p className="text-sm font-semibold text-[var(--color-text)]">Unable to load data</p>
      <p className="max-w-sm text-sm text-[var(--color-text-secondary)]">{message}</p>
      {onRetry && (
        <Button variant="secondary" size="sm" onClick={onRetry} className="mt-2">
          Try again
        </Button>
      )}
    </div>
  );
}
