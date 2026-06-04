"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import {
  createCategory,
  getCategories,
  getCategoryById,
  getProductCountForCategory,
  updateCategory,
} from "@/lib/db";

export type CategoryFormState = {
  success: boolean;
  message?: string;
};

const categorySchema = z.object({
  name: z.string().min(2, "Kategorinavn må ha minst 2 tegn."),
});

function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export async function createCategoryAction(
  _previousState: CategoryFormState,
  formData: FormData
): Promise<CategoryFormState> {
  await requireUser("ADMIN");

  const parsed = categorySchema.safeParse({
    name: formData.get("name"),
  });

  if (!parsed.success) {
    return {
      success: false,
      message: parsed.error.issues[0]?.message ?? "Kunne ikke opprette kategori.",
    };
  }

  const name = parsed.data.name.trim();
  const slug = slugify(name);
  const exists = getCategories().some(
    (category) => category.slug === slug || category.name.toLowerCase() === name.toLowerCase()
  );

  if (exists) {
    return {
      success: false,
      message: "Det finnes allerede en kategori med dette navnet.",
    };
  }

  createCategory({ name, slug });

  revalidatePath("/admin");
  revalidatePath("/admin/categories");
  redirect("/admin/categories");
}

export async function updateCategoryAction(
  categoryId: string,
  _previousState: CategoryFormState,
  formData: FormData
): Promise<CategoryFormState> {
  await requireUser("ADMIN");

  const parsed = categorySchema.safeParse({
    name: formData.get("name"),
  });

  if (!parsed.success) {
    return {
      success: false,
      message: parsed.error.issues[0]?.message ?? "Kunne ikke oppdatere kategori.",
    };
  }

  const existing = getCategoryById(categoryId);

  if (!existing) {
    return {
      success: false,
      message: "Fant ikke kategorien du prøvde å oppdatere.",
    };
  }

  const name = parsed.data.name.trim();
  const slug = slugify(name);
  const duplicate = getCategories().find(
    (category) =>
      category.id !== categoryId &&
      (category.slug === slug || category.name.toLowerCase() === name.toLowerCase())
  );

  if (duplicate) {
    return {
      success: false,
      message: "Det finnes allerede en annen kategori med dette navnet.",
    };
  }

  updateCategory(categoryId, { name, slug });

  revalidatePath("/admin");
  revalidatePath("/admin/categories");
  revalidatePath(`/admin/categories/${categoryId}/edit`);
  redirect("/admin/categories");
}

export async function deleteCategoryAction(
  categoryId: string,
  previousState: CategoryFormState,
  formData: FormData
): Promise<CategoryFormState> {
  await requireUser("ADMIN");
  void previousState;
  void formData;

  const linkedProducts = getProductCountForCategory(categoryId);

  if (linkedProducts > 0) {
    return {
      success: false,
      message: `Kan ikke slette kategorien ennå. ${linkedProducts} varer er fortsatt koblet til den.`,
    };
  }

  return {
    success: false,
    message: "Sletting av tomme kategorier kan legges til senere. Kategorien er trygg å beholde nå.",
  };
}
