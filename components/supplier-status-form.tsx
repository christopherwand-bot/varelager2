"use client";

import { useActionState } from "react";
import type { SupplierFormState } from "@/app/actions/suppliers";

const initialState: SupplierFormState = {
  success: false,
};

export function SupplierStatusForm({
  action,
  label,
  description,
  tone,
}: {
  action: (
    state: SupplierFormState,
    formData: FormData
  ) => Promise<SupplierFormState>;
  label: string;
  description: string;
  tone: "primary" | "danger";
}) {
  const [state, formAction] = useActionState(action, initialState);

  return (
    <form action={formAction} className="rounded-[1.6rem] border border-[var(--border)] bg-white/70 p-5">
      <h2 className="text-lg font-semibold">{label}</h2>
      <p className="mt-2 text-sm text-[var(--muted)]">{description}</p>

      {state.message ? (
        <p
          className={`mt-4 rounded-2xl px-4 py-3 text-sm ${
            state.success
              ? "bg-[var(--primary-soft)] text-[var(--primary)]"
              : "bg-[var(--danger-soft)] text-[var(--danger)]"
          }`}
        >
          {state.message}
        </p>
      ) : null}

      <button
        className={`mt-4 rounded-full px-5 py-3 text-sm font-semibold text-white ${
          tone === "danger" ? "bg-[var(--danger)]" : "bg-[var(--primary)]"
        }`}
        type="submit"
      >
        {label}
      </button>
    </form>
  );
}
