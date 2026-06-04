"use client";

import { useActionState } from "react";
import type { SupplierFormState } from "@/app/actions/suppliers";

const initialState: SupplierFormState = {
  success: false,
};

export function DeleteSupplierForm({
  action,
  disabled,
}: {
  action: (
    state: SupplierFormState,
    formData: FormData
  ) => Promise<SupplierFormState>;
  disabled?: boolean;
}) {
  const [state, formAction] = useActionState(action, initialState);

  return (
    <form action={formAction} className="rounded-[1.6rem] border border-[var(--border)] bg-white/70 p-5">
      <h2 className="text-lg font-semibold text-[var(--danger)]">Slett leverandør</h2>
      <p className="mt-2 text-sm text-[var(--muted)]">
        Leverandøren kan bare slettes hvis ingen varer fortsatt er koblet til den.
      </p>

      {state.message ? (
        <p className="mt-4 rounded-2xl bg-[var(--danger-soft)] px-4 py-3 text-sm text-[var(--danger)]">
          {state.message}
        </p>
      ) : null}

      <button
        className="mt-4 rounded-full bg-[var(--danger)] px-5 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-70"
        disabled={disabled}
        type="submit"
      >
        Slett leverandør
      </button>
    </form>
  );
}
