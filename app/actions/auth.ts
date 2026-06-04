"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createSession, clearSession } from "@/lib/auth";
import { getUserByEmail } from "@/lib/db";

export type AuthFormState = {
  success: boolean;
  message?: string;
};

const loginSchema = z.object({
  email: z.email("Skriv inn en gyldig e-postadresse."),
  password: z.string().min(1, "Passord er påkrevd."),
  next: z.string().optional(),
});

export async function loginAction(
  _previousState: AuthFormState,
  formData: FormData
): Promise<AuthFormState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    next: formData.get("next"),
  });

  if (!parsed.success) {
    return {
      success: false,
      message: parsed.error.issues[0]?.message ?? "Ugyldig innlogging.",
    };
  }

  const user = getUserByEmail(parsed.data.email.toLowerCase().trim());

  if (!user) {
    return {
      success: false,
      message: "Fant ingen bruker med denne e-postadressen.",
    };
  }

  const passwordMatches = await bcrypt.compare(
    parsed.data.password,
    user.passwordHash
  );

  if (!passwordMatches) {
    return {
      success: false,
      message: "Feil passord. Prøv igjen.",
    };
  }

  await createSession({
    userId: user.id,
    role: user.role,
  });

  const nextPath = parsed.data.next;

  if (nextPath === "/admin" && user.role !== "ADMIN") {
    redirect("/employee");
  }

  if (nextPath === "/employee" && user.role !== "EMPLOYEE") {
    redirect("/admin");
  }

  redirect(nextPath || (user.role === "ADMIN" ? "/admin" : "/employee"));
}

export async function logoutAction() {
  await clearSession();
  redirect("/login");
}
