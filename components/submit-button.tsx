"use client";

import { useFormStatus } from "react-dom";
import { cn } from "@/lib/utils";

export function SubmitButton({
  label,
  pendingLabel,
  className,
  disabled = false,
}: {
  label: string;
  pendingLabel: string;
  className?: string;
  disabled?: boolean;
}) {
  const { pending } = useFormStatus();

  return (
    <button
      className={cn(
        "btn-primary w-full px-4 py-3 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-70",
        className
      )}
      disabled={pending || disabled}
      type="submit"
    >
      {pending ? pendingLabel : label}
    </button>
  );
}
