"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { getProductById, saveInventoryCount } from "@/lib/db";

export type InventoryFormState = {
  success: boolean;
  message?: string;
};

const countSchema = z.object({
  productId: z.string().min(1, "Mangler vare."),
  quantity: z
    .string()
    .min(1, "Antall er påkrevd.")
    .transform((value) => Number(value.replace(",", ".")))
    .refine((value) => Number.isFinite(value) && value >= 0, {
      message: "Antall må være 0 eller høyere.",
    }),
});

export async function saveInventoryCountAction(
  _previousState: InventoryFormState,
  formData: FormData
): Promise<InventoryFormState> {
  const user = await requireUser("EMPLOYEE");

  const parsed = countSchema.safeParse({
    productId: formData.get("productId"),
    quantity: formData.get("quantity"),
  });

  if (!parsed.success) {
    return {
      success: false,
      message: parsed.error.issues[0]?.message ?? "Kunne ikke lagre tellingen.",
    };
  }

  const product = getProductById(parsed.data.productId);

  if (!product) {
    return {
      success: false,
      message: "Fant ikke varen du prøvde å telle.",
    };
  }

  // We update the current stock and store a full history row in the same transaction.
  saveInventoryCount({
    productId: parsed.data.productId,
    userId: user.id,
    quantity: parsed.data.quantity,
  });

  revalidatePath("/employee");
  revalidatePath("/admin");

  return {
    success: true,
    message: "Telling lagret.",
  };
}
