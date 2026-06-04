import { NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { requireUser } from "@/lib/auth";
import { getProducts } from "@/lib/db";

export async function GET() {
  await requireUser("ADMIN");

  const products = getProducts();
  const workbook = XLSX.utils.book_new();

  const totalValue = products.reduce(
    (sum, product) => sum + product.currentStock * product.purchasePrice,
    0
  );
  const lowStockCount = products.filter(
    (product) => product.currentStock <= product.minimumLevel
  ).length;

  const summaryRows = [
    { nøkkeltall: "Eksportdato", verdi: new Date().toLocaleString("nb-NO") },
    { nøkkeltall: "Antall varer", verdi: products.length },
    { nøkkeltall: "Lav beholdning", verdi: lowStockCount },
    { nøkkeltall: "Total lagerverdi", verdi: totalValue },
  ];

  const productRows = products.map((product) => ({
    varenavn: product.name,
    strekkode: product.barcode ?? "",
    kategori: product.category.name,
    varetype: product.productType ?? "",
    enhet: product.unit,
    leverandør: product.supplier?.name ?? "",
    lagerbeholdning: product.currentStock,
    minimumsnivå: product.minimumLevel,
    innkjøpspris: product.purchasePrice,
    lagerværdi: product.currentStock * product.purchasePrice,
  }));

  const summarySheet = XLSX.utils.json_to_sheet(summaryRows);
  const productsSheet = XLSX.utils.json_to_sheet(productRows);

  XLSX.utils.book_append_sheet(workbook, summarySheet, "Sammendrag");
  XLSX.utils.book_append_sheet(workbook, productsSheet, "Lagerstatus");

  const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });

  return new NextResponse(buffer, {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": 'attachment; filename="lagerstatus-eksport.xlsx"',
    },
  });
}
