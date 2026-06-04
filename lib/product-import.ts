import { z } from "zod";

export type ParsedImportRow = {
  name: string;
  categoryName: string;
  unit: string;
  purchasePrice: number;
  minimumLevel: number;
  currentStock: number;
  supplierName: string | null;
  productType: string | null;
};

export type ParsedImportFailure = {
  ok: false;
  rowNumber: number;
  error: string;
};

export type ParsedImportSuccess = {
  ok: true;
  value: ParsedImportRow;
};

export const HEADER_ALIASES: Record<string, string[]> = {
  name: ["varenavn", "vare", "produkt", "product", "product_name", "navn"],
  categoryName: ["kategori", "category"],
  unit: ["enhet", "unit"],
  purchasePrice: ["innkjopspris", "innkjøpspris", "pris", "purchaseprice", "purchase_price"],
  minimumLevel: ["minimumsniva", "minimumsnivå", "minimum", "minimum_level"],
  currentStock: ["lagerbeholdning", "beholdning", "stock", "currentstock", "current_stock"],
  supplierName: ["leverandor", "leverandør", "supplier", "supplier_name"],
  productType: ["varetype", "type", "producttype", "product_type"],
};

const importRowSchema = z.object({
  name: z.string().min(2, "Varenavn må ha minst 2 tegn."),
  categoryName: z.string().min(1, "Kategori mangler."),
  unit: z.string().min(1, "Enhet mangler."),
  purchasePrice: z.number().min(0, "Innkjøpspris må være 0 eller høyere."),
  minimumLevel: z.number().min(0, "Minimumsnivå må være 0 eller høyere."),
  currentStock: z.number().min(0, "Lagerbeholdning må være 0 eller høyere."),
  supplierName: z.string().nullable().optional(),
  productType: z.string().nullable().optional(),
});

export function normalizeHeader(value: unknown) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "")
    .replace(/[^a-z0-9_]/g, "");
}

function normalizeTextCell(value: unknown) {
  const text = String(value ?? "").trim();
  return text.length > 0 ? text : "";
}

function parseNumericCell(value: unknown, fallback = 0) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  const normalized = String(value ?? "")
    .trim()
    .replace(/\s/g, "")
    .replace(",", ".");

  if (!normalized) {
    return fallback;
  }

  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : Number.NaN;
}

export function parseImportRecords(rows: Array<Record<string, unknown>>) {
  return rows.map((row, index) => {
    const normalizedRow = new Map<string, unknown>();

    for (const [key, value] of Object.entries(row)) {
      normalizedRow.set(normalizeHeader(key), value);
    }

    function getField(field: keyof typeof HEADER_ALIASES) {
      const match = HEADER_ALIASES[field].find((alias) => normalizedRow.has(alias));
      return match ? normalizedRow.get(match) : undefined;
    }

    const parsed = importRowSchema.safeParse({
      name: normalizeTextCell(getField("name")),
      categoryName: normalizeTextCell(getField("categoryName")),
      unit: normalizeTextCell(getField("unit")) || "stk",
      purchasePrice: parseNumericCell(getField("purchasePrice")),
      minimumLevel: parseNumericCell(getField("minimumLevel"), 0),
      currentStock: parseNumericCell(getField("currentStock"), 0),
      supplierName: normalizeTextCell(getField("supplierName")) || null,
      productType: normalizeTextCell(getField("productType")) || null,
    });

    if (!parsed.success) {
      return {
        ok: false,
        rowNumber: index + 2,
        error:
          parsed.error.issues[0]?.message ??
          "Ugyldige verdier i importfilen.",
      } satisfies ParsedImportFailure;
    }

    return {
      ok: true,
      value: {
        ...parsed.data,
        supplierName: parsed.data.supplierName ?? null,
        productType: parsed.data.productType ?? null,
      },
    } satisfies ParsedImportSuccess;
  });
}
