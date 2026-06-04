"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import * as XLSX from "xlsx";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import {
  confirmImportRun,
  createImportPreview,
  createProduct,
  getCategories,
  getProducts,
  updateProduct,
} from "@/lib/db";
import { normalizeHeader, parseImportRecords } from "@/lib/product-import";
import type { ImportRunItem } from "@/lib/types";

export type ProductFormState = {
  success: boolean;
  message?: string;
};

export type ProductImportFormState = {
  success: boolean;
  message?: string;
  stage?: "idle" | "preview" | "done";
  importRunId?: string;
  previewRows?: ImportRunItem[];
  createdCount?: number;
  updatedCount?: number;
  fileName?: string;
};

const productSchema = z.object({
  name: z.string().min(2, "Varenavn må ha minst 2 tegn."),
  barcode: z.string().optional(),
  categoryId: z.string().min(1, "Velg kategori."),
  unit: z.string().min(1, "Enhet er påkrevd."),
  purchasePrice: z
    .string()
    .min(1, "Innkjøpspris er påkrevd.")
    .transform((value) => Number(value.replace(",", ".")))
    .refine((value) => Number.isFinite(value) && value >= 0, {
      message: "Innkjøpspris må være 0 eller høyere.",
    }),
  minimumLevel: z
    .string()
    .min(1, "Minimumsnivå er påkrevd.")
    .transform((value) => Number(value.replace(",", ".")))
    .refine((value) => Number.isFinite(value) && value >= 0, {
      message: "Minimumsnivå må være 0 eller høyere.",
    }),
  currentStock: z
    .string()
    .min(1, "Lagerbeholdning er påkrevd.")
    .transform((value) => Number(value.replace(",", ".")))
    .refine((value) => Number.isFinite(value) && value >= 0, {
      message: "Lagerbeholdning må være 0 eller høyere.",
    }),
  supplierId: z.string().optional(),
  productType: z.string().optional(),
});

export async function createProductAction(
  _previousState: ProductFormState,
  formData: FormData
): Promise<ProductFormState> {
  await requireUser("ADMIN");

  const parsed = productSchema.safeParse({
    name: formData.get("name"),
    barcode: formData.get("barcode") || undefined,
    categoryId: formData.get("categoryId"),
    unit: formData.get("unit"),
    purchasePrice: formData.get("purchasePrice"),
    minimumLevel: formData.get("minimumLevel"),
    currentStock: formData.get("currentStock"),
    supplierId: formData.get("supplierId") || undefined,
    productType: formData.get("productType") || undefined,
  });

  if (!parsed.success) {
    return {
      success: false,
      message: parsed.error.issues[0]?.message ?? "Kunne ikke lagre varen.",
    };
  }

  createProduct({
    name: parsed.data.name.trim(),
    barcode: parsed.data.barcode?.trim() || null,
    categoryId: parsed.data.categoryId,
    unit: parsed.data.unit.trim(),
    purchasePrice: parsed.data.purchasePrice,
    minimumLevel: parsed.data.minimumLevel,
    currentStock: parsed.data.currentStock,
    supplierId: parsed.data.supplierId || null,
    productType: parsed.data.productType?.trim() || null,
  });

  revalidatePath("/admin");
  redirect("/admin");
}

export async function updateProductAction(
  productId: string,
  _previousState: ProductFormState,
  formData: FormData
): Promise<ProductFormState> {
  await requireUser("ADMIN");

  const parsed = productSchema.safeParse({
    name: formData.get("name"),
    barcode: formData.get("barcode") || undefined,
    categoryId: formData.get("categoryId"),
    unit: formData.get("unit"),
    purchasePrice: formData.get("purchasePrice"),
    minimumLevel: formData.get("minimumLevel"),
    currentStock: formData.get("currentStock"),
    supplierId: formData.get("supplierId") || undefined,
    productType: formData.get("productType") || undefined,
  });

  if (!parsed.success) {
    return {
      success: false,
      message: parsed.error.issues[0]?.message ?? "Kunne ikke oppdatere varen.",
    };
  }

  updateProduct(productId, {
    name: parsed.data.name.trim(),
    barcode: parsed.data.barcode?.trim() || null,
    categoryId: parsed.data.categoryId,
    unit: parsed.data.unit.trim(),
    purchasePrice: parsed.data.purchasePrice,
    minimumLevel: parsed.data.minimumLevel,
    currentStock: parsed.data.currentStock,
    supplierId: parsed.data.supplierId || null,
    productType: parsed.data.productType?.trim() || null,
  });

  revalidatePath("/admin");
  revalidatePath(`/admin/products/${productId}/edit`);
  redirect("/admin");
}

export async function importProductsAction(
  _previousState: ProductImportFormState,
  formData: FormData
): Promise<ProductImportFormState> {
  const user = await requireUser("ADMIN");

  const file = formData.get("file");

  if (!(file instanceof File) || file.size === 0) {
    return {
      success: false,
      message: "Velg en Excel- eller CSV-fil før du importerer.",
    };
  }

  const allowedExtensions = [".xlsx", ".xls", ".csv"];
  const lowerName = file.name.toLowerCase();

  if (!allowedExtensions.some((extension) => lowerName.endsWith(extension))) {
    return {
      success: false,
      message: "Filen må være .xlsx, .xls eller .csv.",
    };
  }

  const categories = getCategories();
  const existingProducts = getProducts();
  const existingProductNames = new Set(
    existingProducts.map((product) => normalizeHeader(product.name))
  );
  const categoryMap = new Map(
    categories.map((category) => [normalizeHeader(category.name), category.id])
  );

  const workbook = XLSX.read(await file.arrayBuffer(), { type: "array" });
  const firstSheetName = workbook.SheetNames[0];

  if (!firstSheetName) {
    return {
      success: false,
      message: "Filen ser tom ut. Legg inn minst ett ark med varer.",
    };
  }

  const sheet = workbook.Sheets[firstSheetName];
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
    defval: "",
    raw: true,
  });

  if (rows.length === 0) {
    return {
      success: false,
      message: "Filen inneholder ingen varelinjer.",
    };
  }

  const preparedRows = parseImportRecords(rows).map((row, index) => {
    if (!row.ok) {
      return row;
    }

    const categoryId = categoryMap.get(normalizeHeader(row.value.categoryName));

    if (!categoryId) {
      return {
        ok: false as const,
        rowNumber: index + 2,
        error: `Kategorien "${row.value.categoryName}" finnes ikke.`,
      };
    }

    return {
      ok: true as const,
      value: {
        rowNumber: index + 2,
        name: row.value.name,
        categoryId,
        categoryName: row.value.categoryName,
        unit: row.value.unit,
        purchasePrice: row.value.purchasePrice,
        minimumLevel: row.value.minimumLevel,
        currentStock: row.value.currentStock,
        supplierName: row.value.supplierName ?? null,
        productType: row.value.productType ?? null,
        action: existingProductNames.has(normalizeHeader(row.value.name))
          ? ("update" as const)
          : ("create" as const),
      },
    };
  });

  const invalidRow = preparedRows.find((row) => !row.ok);

  if (invalidRow && !invalidRow.ok) {
    return {
      success: false,
      message: `Feil på rad ${invalidRow.rowNumber}: ${invalidRow.error}`,
    };
  }

  const validRows = preparedRows
    .filter((row): row is Extract<(typeof preparedRows)[number], { ok: true }> => row.ok)
    .map((row) => row.value);

  if (validRows.length === 0) {
    return {
      success: false,
      message: "Fant ingen gyldige varelinjer å importere.",
    };
  }

  const importRunId = createImportPreview(
    user.id,
    file.name,
    validRows.map((row) => ({
      rowNumber: row.rowNumber,
      name: row.name,
      categoryId: row.categoryId,
      categoryName: row.categoryName,
      unit: row.unit,
      purchasePrice: row.purchasePrice,
      minimumLevel: row.minimumLevel,
      currentStock: row.currentStock,
      supplierName: row.supplierName ?? null,
      productType: row.productType ?? null,
      action: row.action,
    }))
  );

  return {
    success: true,
    stage: "preview",
    importRunId,
    previewRows: validRows.map((row, index) => ({
      id: `${importRunId}-${index}`,
      importRunId,
      rowNumber: row.rowNumber,
      name: row.name,
      categoryId: row.categoryId,
      categoryName: row.categoryName,
      unit: row.unit,
      purchasePrice: row.purchasePrice,
      minimumLevel: row.minimumLevel,
      currentStock: row.currentStock,
      supplierName: row.supplierName ?? null,
      productType: row.productType ?? null,
      action: row.action,
    })),
    createdCount: validRows.filter((row) => row.action === "create").length,
    updatedCount: validRows.filter((row) => row.action === "update").length,
    fileName: file.name,
    message: "Tørrkjøring klar. Bekreft importen for å lagre endringene.",
  };
}

export async function confirmImportProductsAction(
  _previousState: ProductImportFormState,
  formData: FormData
): Promise<ProductImportFormState> {
  const user = await requireUser("ADMIN");
  const importRunId = String(formData.get("importRunId") ?? "");

  if (!importRunId) {
    return {
      success: false,
      stage: "idle",
      message: "Mangler import-ID. Kjør forhåndsvisning på nytt.",
    };
  }

  const result = confirmImportRun(importRunId, user.id);

  if (!result) {
    return {
      success: false,
      stage: "idle",
      message: "Fant ikke en gyldig tørrkjøring å bekrefte.",
    };
  }

  revalidatePath("/admin");

  return {
    success: true,
    stage: "done",
    message: `Import fullført. Opprettet ${result.createdCount} og oppdaterte ${result.updatedCount} varer.`,
  };
}
