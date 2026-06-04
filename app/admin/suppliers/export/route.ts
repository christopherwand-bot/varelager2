import { NextRequest, NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { requireUser } from "@/lib/auth";
import { getProducts } from "@/lib/db";
import { getLowStockReport } from "@/lib/low-stock";

export async function GET(request: NextRequest) {
  await requireUser("ADMIN");

  const supplierId = request.nextUrl.searchParams.get("supplier");
  const products = getProducts();
  const report = getLowStockReport(products);
  const groups =
    supplierId && supplierId !== "all"
      ? report.supplierGroups.filter((group) => group.supplier?.id === supplierId)
      : report.supplierGroups;

  const workbook = XLSX.utils.book_new();

  const supplierRows = groups.map((group) => ({
    leverandør: group.supplierLabel,
    kontaktperson: group.supplier?.contactName ?? "",
    epost: group.supplier?.email ?? "",
    telefon: group.supplier?.phone ?? "",
    varelinjer: group.totalItems,
    estimert_innkjøp: group.totalEstimatedCost,
  }));

  const itemRows = groups.flatMap((group) =>
    group.items.map((item) => ({
      leverandør: group.supplierLabel,
      varenavn: item.product.name,
      kategori: item.product.category.name,
      strekkode: item.product.barcode ?? "",
      beholdning: item.product.currentStock,
      minimumsnivå: item.product.minimumLevel,
      foreslått_bestilling: item.suggestedOrderQuantity,
      innkjøpspris: item.product.purchasePrice,
      estimert_kostnad: item.estimatedCost,
    }))
  );

  XLSX.utils.book_append_sheet(
    workbook,
    XLSX.utils.json_to_sheet(supplierRows),
    "Leverandører"
  );
  XLSX.utils.book_append_sheet(
    workbook,
    XLSX.utils.json_to_sheet(itemRows),
    "Bestillingsgrunnlag"
  );

  const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });

  return new NextResponse(buffer, {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": 'attachment; filename="leverandor-oversikt.xlsx"',
    },
  });
}
