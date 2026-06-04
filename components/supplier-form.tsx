"use client";

import { useActionState } from "react";
import type { SupplierFormState } from "@/app/actions/suppliers";
import { SubmitButton } from "@/components/submit-button";
import type { Supplier } from "@/lib/types";

type SupplierFormProps = {
  action: (
    state: SupplierFormState,
    formData: FormData
  ) => Promise<SupplierFormState>;
  supplier?: Supplier;
};

const initialState: SupplierFormState = {
  success: false,
};

export function SupplierForm({ action, supplier }: SupplierFormProps) {
  const [state, formAction] = useActionState(action, initialState);

  return (
    <form action={formAction} className="card rounded-[2rem] p-6 sm:p-8">
      <div className="mb-6 grid gap-4 sm:grid-cols-2">
        <Field
          label="Leverandørnavn"
          name="name"
          defaultValue={supplier?.name}
          placeholder="Navn på leverandør"
        />
        <Field
          label="Kontaktperson"
          name="contactName"
          defaultValue={supplier?.contactName ?? ""}
          placeholder="Navn på kontaktperson"
        />
        <Field
          label="E-post"
          name="email"
          defaultValue={supplier?.email ?? ""}
          placeholder="kontakt@firma.no"
          type="email"
        />
        <Field
          label="Telefon"
          name="phone"
          defaultValue={supplier?.phone ?? ""}
          placeholder="+47 99 99 99 99"
        />
      </div>

      {state.message ? (
        <p className="mb-4 rounded-2xl bg-[var(--danger-soft)] px-4 py-3 text-sm text-[var(--danger)]">
          {state.message}
        </p>
      ) : null}

      <SubmitButton
        className="sm:w-auto sm:px-6"
        label={supplier ? "Oppdater leverandør" : "Opprett leverandør"}
        pendingLabel={supplier ? "Oppdaterer..." : "Oppretter..."}
      />
    </form>
  );
}

function Field({
  label,
  name,
  defaultValue,
  placeholder,
  type = "text",
}: {
  label: string;
  name: string;
  defaultValue?: string;
  placeholder?: string;
  type?: string;
}) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-semibold" htmlFor={name}>
        {label}
      </label>
      <input
        className="field"
        defaultValue={defaultValue}
        id={name}
        name={name}
        placeholder={placeholder}
        type={type}
      />
    </div>
  );
}
