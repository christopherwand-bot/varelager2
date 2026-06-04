import { NextRequest, NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { requireUser } from "@/lib/auth";
import { getInventoryCounts } from "@/lib/db";

export async function GET(request: NextRequest) {
  await requireUser("ADMIN");

  const searchParams = request.nextUrl.searchParams;
  const counts = getInventoryCounts({
    query: searchParams.get("countsQ") ?? undefined,
    categoryId: searchParams.get("countsCategory") ?? undefined,
    userId: searchParams.get("user") ?? undefined,
    dateFrom: searchParams.get("from") ?? undefined,
    dateTo: searchParams.get("to") ?? undefined,
  });

  const workbook = XLSX.utils.book_new();

  const summaryRows = [
    { nøkkeltall: "Eksportdato", verdi: new Date().toLocaleString("nb-NO") },
    { nøkkeltall: "Antall tellinger", verdi: counts.length },
    {
      nøkkeltall: "Unike varer",
      verdi: new Set(counts.map((count) => count.productId)).size,
    },
    {
      nøkkeltall: "Ansatte i utvalg",
      verdi: new Set(counts.map((count) => count.userId)).size,
    },
  ];

  const countRows = counts.map((count) => ({
    tidspunkt: count.countedAt.toLocaleString("nb-NO"),
    varenavn: count.product.name,
    strekkode: count.product.barcode ?? "",
    kategori: count.product.category.name,
    varetype: count.product.productType ?? "",
    enhet: count.product.unit,
    registrert_antall: count.quantity,
    ansatt: count.user.name,
    epost: count.user.email,
  }));

  XLSX.utils.book_append_sheet(
    workbook,
    XLSX.utils.json_to_sheet(summaryRows),
    "Sammendrag"
  );
  XLSX.utils.book_append_sheet(
    workbook,
    XLSX.utils.json_to_sheet(countRows),
    "Tellehistorikk"
  );

  const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });

  return new NextResponse(buffer, {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": 'attachment; filename="tellehistorikk-eksport.xlsx"',
    },
  });
}
