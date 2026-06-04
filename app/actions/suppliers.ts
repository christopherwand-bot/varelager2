"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import {
  createSupplier,
  deleteSupplier,
  getProductCountForSupplier,
  setSupplierActiveState,
  updateSupplier,
} from "@/lib/db";

export type SupplierFormState = {
  success: boolean;
  message?: string;
};

const supplierSchema = z.object({
  name: z.string().min(2, "Leverandørnavn må ha minst 2 tegn."),
  contactName: z.string().optional(),
  email: z
    .string()
    .optional()
    .refine((value) => !value || z.email().safeParse(value).success, {
      message: "E-postadressen er ikke gyldig.",
    }),
  phone: z.string().optional(),
});

export async function createSupplierAction(
  _previousState: SupplierFormState,
  formData: FormData
): Promise<SupplierFormState> {
  await requireUser("ADMIN");

  const parsed = supplierSchema.safeParse({
    name: formData.get("name"),
    contactName: formData.get("contactName") || undefined,
    email: formData.get("email") || undefined,
    phone: formData.get("phone") || undefined,
  });

  if (!parsed.success) {
    return {
      success: false,
      message:
        parsed.error.issues[0]?.message ?? "Kunne ikke opprette leverandøren.",
    };
  }

  createSupplier({
    name: parsed.data.name.trim(),
    contactName: parsed.data.contactName?.trim() || null,
    email: parsed.data.email?.trim() || null,
    phone: parsed.data.phone?.trim() || null,
  });

  revalidatePath("/admin");
  revalidatePath("/admin/low-stock");
  revalidatePath("/admin/suppliers");
  redirect("/admin/suppliers");
}

export async function updateSupplierAction(
  supplierId: string,
  _previousState: SupplierFormState,
  formData: FormData
): Promise<SupplierFormState> {
  await requireUser("ADMIN");

  const parsed = supplierSchema.safeParse({
    name: formData.get("name"),
    contactName: formData.get("contactName") || undefined,
    email: formData.get("email") || undefined,
    phone: formData.get("phone") || undefined,
  });

  if (!parsed.success) {
    return {
      success: false,
      message:
        parsed.error.issues[0]?.message ?? "Kunne ikke oppdatere leverandøren.",
    };
  }

  updateSupplier(supplierId, {
    name: parsed.data.name.trim(),
    contactName: parsed.data.contactName?.trim() || null,
    email: parsed.data.email?.trim() || null,
    phone: parsed.data.phone?.trim() || null,
  });

  revalidatePath("/admin");
  revalidatePath("/admin/low-stock");
  revalidatePath("/admin/suppliers");
  revalidatePath(`/admin/suppliers/${supplierId}/edit`);
  redirect("/admin/suppliers");
}

export async function deleteSupplierAction(
  supplierId: string,
  previousState: SupplierFormState,
  formData: FormData
): Promise<SupplierFormState> {
  await requireUser("ADMIN");
  void previousState;
  void formData;

  const linkedProducts = getProductCountForSupplier(supplierId);

  if (linkedProducts > 0) {
    return {
      success: false,
      message: `Kan ikke slette leverandøren ennå. ${linkedProducts} varer er fortsatt koblet til den.`,
    };
  }

  deleteSupplier(supplierId);

  revalidatePath("/admin");
  revalidatePath("/admin/low-stock");
  revalidatePath("/admin/suppliers");
  redirect("/admin/suppliers");
}

export async function deactivateSupplierAction(
  supplierId: string,
  previousState: SupplierFormState,
  formData: FormData
): Promise<SupplierFormState> {
  await requireUser("ADMIN");
  void previousState;
  void formData;

  setSupplierActiveState(supplierId, false);

  revalidatePath("/admin");
  revalidatePath("/admin/low-stock");
  revalidatePath("/admin/suppliers");
  revalidatePath(`/admin/suppliers/${supplierId}/edit`);
  return {
    success: true,
    message: "Leverandøren er deaktivert.",
  };
}

export async function reactivateSupplierAction(
  supplierId: string,
  previousState: SupplierFormState,
  formData: FormData
): Promise<SupplierFormState> {
  await requireUser("ADMIN");
  void previousState;
  void formData;

  setSupplierActiveState(supplierId, true);

  revalidatePath("/admin");
  revalidatePath("/admin/low-stock");
  revalidatePath("/admin/suppliers");
  revalidatePath(`/admin/suppliers/${supplierId}/edit`);
  return {
    success: true,
    message: "Leverandøren er aktiv igjen.",
  };
}
