"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { createUser, getUserByEmail, getUserById, updateUser } from "@/lib/db";
import type { Role } from "@/lib/types";

export type UserFormState = {
  success: boolean;
  message?: string;
};

const userSchema = z.object({
  name: z.string().min(2, "Navn må ha minst 2 tegn."),
  email: z.email("Skriv inn en gyldig e-postadresse."),
  role: z.enum(["ADMIN", "EMPLOYEE"]),
  password: z.string().optional(),
});

export async function createUserAction(
  _previousState: UserFormState,
  formData: FormData
): Promise<UserFormState> {
  await requireUser("ADMIN");

  const parsed = userSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    role: formData.get("role"),
    password: formData.get("password") || undefined,
  });

  if (!parsed.success) {
    return {
      success: false,
      message: parsed.error.issues[0]?.message ?? "Kunne ikke opprette bruker.",
    };
  }

  if (!parsed.data.password || parsed.data.password.length < 8) {
    return {
      success: false,
      message: "Passord må være minst 8 tegn.",
    };
  }

  const normalizedEmail = parsed.data.email.toLowerCase().trim();

  if (getUserByEmail(normalizedEmail)) {
    return {
      success: false,
      message: "Det finnes allerede en bruker med denne e-posten.",
    };
  }

  createUser({
    name: parsed.data.name.trim(),
    email: normalizedEmail,
    role: parsed.data.role as Role,
    passwordHash: await bcrypt.hash(parsed.data.password, 10),
  });

  revalidatePath("/admin");
  revalidatePath("/admin/users");
  redirect("/admin/users");
}

export async function updateUserAction(
  userId: string,
  _previousState: UserFormState,
  formData: FormData
): Promise<UserFormState> {
  await requireUser("ADMIN");

  const parsed = userSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    role: formData.get("role"),
    password: formData.get("password") || undefined,
  });

  if (!parsed.success) {
    return {
      success: false,
      message: parsed.error.issues[0]?.message ?? "Kunne ikke oppdatere bruker.",
    };
  }

  const existing = getUserById(userId);

  if (!existing) {
    return {
      success: false,
      message: "Fant ikke brukeren du prøvde å oppdatere.",
    };
  }

  const normalizedEmail = parsed.data.email.toLowerCase().trim();
  const duplicate = getUserByEmail(normalizedEmail);

  if (duplicate && duplicate.id !== userId) {
    return {
      success: false,
      message: "Denne e-posten er allerede i bruk av en annen bruker.",
    };
  }

  if (parsed.data.password && parsed.data.password.length < 8) {
    return {
      success: false,
      message: "Nytt passord må være minst 8 tegn.",
    };
  }

  updateUser(userId, {
    name: parsed.data.name.trim(),
    email: normalizedEmail,
    role: parsed.data.role as Role,
    passwordHash: parsed.data.password
      ? await bcrypt.hash(parsed.data.password, 10)
      : undefined,
  });

  revalidatePath("/admin");
  revalidatePath("/admin/users");
  revalidatePath(`/admin/users/${userId}/edit`);
  redirect("/admin/users");
}
