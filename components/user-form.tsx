"use client";

import { useActionState } from "react";
import type { UserFormState } from "@/app/actions/users";
import { SubmitButton } from "@/components/submit-button";
import type { User } from "@/lib/types";

type UserFormProps = {
  action: (
    state: UserFormState,
    formData: FormData
  ) => Promise<UserFormState>;
  user?: User;
};

const initialState: UserFormState = {
  success: false,
};

export function UserForm({ action, user }: UserFormProps) {
  const [state, formAction] = useActionState(action, initialState);

  return (
    <form action={formAction} className="card rounded-[2rem] p-6 sm:p-8">
      <div className="mb-6 grid gap-4 sm:grid-cols-2">
        <Field label="Navn" name="name" defaultValue={user?.name} />
        <Field
          label="E-post"
          name="email"
          defaultValue={user?.email}
          placeholder="navn@firma.no"
          type="email"
        />
        <div className="space-y-2">
          <label className="text-sm font-semibold" htmlFor="role">
            Rolle
          </label>
          <select className="field" defaultValue={user?.role ?? "EMPLOYEE"} id="role" name="role">
            <option value="EMPLOYEE">Ansatt</option>
            <option value="ADMIN">Admin</option>
          </select>
        </div>
        <Field
          label={user ? "Nytt passord (valgfritt)" : "Passord"}
          name="password"
          placeholder={user ? "La stå tomt for å beholde passord" : "Minst 8 tegn"}
          type="password"
        />
      </div>

      {state.message ? (
        <p className="mb-4 rounded-2xl bg-[var(--danger-soft)] px-4 py-3 text-sm text-[var(--danger)]">
          {state.message}
        </p>
      ) : null}

      <SubmitButton
        className="sm:w-auto sm:px-6"
        label={user ? "Oppdater bruker" : "Opprett bruker"}
        pendingLabel={user ? "Oppdaterer..." : "Oppretter..."}
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
