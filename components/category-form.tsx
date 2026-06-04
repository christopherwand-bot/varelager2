"use client";

import { useActionState } from "react";
import type { CategoryFormState } from "@/app/actions/categories";
import { SubmitButton } from "@/components/submit-button";
import type { Category } from "@/lib/types";

type CategoryFormProps = {
  action: (
    state: CategoryFormState,
    formData: FormData
  ) => Promise<CategoryFormState>;
  category?: Category;
};

const initialState: CategoryFormState = {
  success: false,
};

export function CategoryForm({ action, category }: CategoryFormProps) {
  const [state, formAction] = useActionState(action, initialState);

  return (
    <form action={formAction} className="card rounded-[2rem] p-6 sm:p-8">
      <div className="mb-6 max-w-xl">
        <div className="space-y-2">
          <label className="text-sm font-semibold" htmlFor="name">
            Kategorinavn
          </label>
          <input
            className="field"
            defaultValue={category?.name}
            id="name"
            name="name"
            placeholder="For eksempel Emballasje"
          />
        </div>
      </div>

      {state.message ? (
        <p className="mb-4 rounded-2xl bg-[var(--danger-soft)] px-4 py-3 text-sm text-[var(--danger)]">
          {state.message}
        </p>
      ) : null}

      <SubmitButton
        className="sm:w-auto sm:px-6"
        label={category ? "Oppdater kategori" : "Opprett kategori"}
        pendingLabel={category ? "Oppdaterer..." : "Oppretter..."}
      />
    </form>
  );
}
