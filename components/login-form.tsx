"use client";

import { useActionState } from "react";
import { loginAction, type AuthFormState } from "@/app/actions/auth";
import { SubmitButton } from "@/components/submit-button";

const initialState: AuthFormState = {
  success: false,
};

export function LoginForm({ next }: { next?: string }) {
  const [state, action] = useActionState(loginAction, initialState);

  return (
    <form action={action} className="space-y-4">
      <input name="next" type="hidden" value={next ?? ""} />

      <div className="space-y-2">
        <label className="text-sm font-semibold" htmlFor="email">
          E-post
        </label>
        <input className="field" id="email" name="email" placeholder="navn@bedrift.no" />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-semibold" htmlFor="password">
          Passord
        </label>
        <input className="field" id="password" name="password" type="password" />
      </div>

      {state.message ? (
        <p className="rounded-2xl bg-[var(--danger-soft)] px-4 py-3 text-sm text-[var(--danger)]">
          {state.message}
        </p>
      ) : null}

      <SubmitButton label="Logg inn" pendingLabel="Logger inn..." />
    </form>
  );
}
