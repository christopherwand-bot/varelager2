import { NextRequest, NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { requireUser } from "@/lib/auth";
import { getProducts } from "@/lib/db";
import { getLowStockReport } from "@/lib/low-stock";

export async function GET(request: NextRequest) {
  await requireUser("ADMIN");

  const searchParams = request.nextUrl.searchParams;
  const categoryId = searchParams.get("category") ?? undefined;
  const supplierId = searchParams.get("supplier") ?? undefined;

  const products = getProducts({
    categoryId,
  });

  const filteredProducts =
    supplierId && supplierId !== "all"
      ? products.filter((product) => product.supplier?.id === supplierId)
      : products;

  const report = getLowStockReport(filteredProducts);
  const workbook = XLSX.utils.book_new();

  const summaryRows = [
    { nøkkeltall: "Eksportdato", verdi: new Date().toLocaleString("nb-NO") },
    { nøkkeltall: "Varer under minimum", verdi: report.summary.totalItems },
    { nøkkeltall: "Mangler totalt", verdi: report.summary.totalShortage },
    {
      nøkkeltall: "Estimert innkjøpskostnad",
      verdi: report.summary.totalEstimatedCost,
    },
  ];

  const supplierRows = report.supplierGroups.map((group) => ({
    leverandør: group.supplierLabel,
    varelinjer: group.totalItems,
    estimert_kostnad: group.totalEstimatedCost,
  }));

  const itemRows = report.items.map((item) => ({
    varenavn: item.product.name,
    kategori: item.product.category.name,
    varetype: item.product.productType ?? "",
    strekkode: item.product.barcode ?? "",
    enhet: item.product.unit,
    leverandør: item.supplierLabel,
    beholdning: item.product.currentStock,
    minimumsnivå: item.product.minimumLevel,
    mangler: item.shortage,
    foreslått_bestilling: item.suggestedOrderQuantity,
    innkjøpspris: item.product.purchasePrice,
    estimert_kostnad: item.estimatedCost,
  }));

  XLSX.utils.book_append_sheet(
    workbook,
    XLSX.utils.json_to_sheet(summaryRows),
    "Sammendrag"
  );
  XLSX.utils.book_append_sheet(
    workbook,
    XLSX.utils.json_to_sheet(supplierRows),
    "Leverandører"
  );
  XLSX.utils.book_append_sheet(
    workbook,
    XLSX.utils.json_to_sheet(itemRows),
    "Innkjøpsliste"
  );

  const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });

  return new NextResponse(buffer, {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": 'attachment; filename="lav-beholdning-rapport.xlsx"',
    },
  });
}
