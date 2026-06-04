import { NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { getCategories } from "@/lib/db";

export async function GET() {
  const categories = getCategories();
  const workbook = XLSX.utils.book_new();

  const templateRows = [
    {
      varenavn: "Pappkrus 3 dl",
      kategori: categories[0]?.name ?? "Emballasje",
      innkjøpspris: 49.9,
      enhet: "pakke",
      varetype: "Kopper",
      leverandør: "Eksempel Leverandør",
      minimumsnivå: 10,
      lagerbeholdning: 25,
    },
    {
      varenavn: "Espressobonner Husblend",
      kategori: categories[1]?.name ?? "Mat",
      innkjøpspris: 219,
      enhet: "kg",
      varetype: "Kaffe",
      leverandør: "Eksempel Leverandør",
      minimumsnivå: 6,
      lagerbeholdning: 12,
    },
  ];

  const instructionRows = [
    ["Obligatoriske kolonner", "varenavn, kategori, innkjøpspris"],
    ["Valgfrie kolonner", "enhet, varetype, leverandør, minimumsnivå, lagerbeholdning"],
    [
      "Gyldige kategorier",
      categories.map((category) => category.name).join(", "),
    ],
  ];

  const templateSheet = XLSX.utils.json_to_sheet(templateRows);
  const infoSheet = XLSX.utils.aoa_to_sheet(instructionRows);

  XLSX.utils.book_append_sheet(workbook, templateSheet, "Importmal");
  XLSX.utils.book_append_sheet(workbook, infoSheet, "Info");

  const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });

  return new NextResponse(buffer, {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": 'attachment; filename="lagerflyt-importmal.xlsx"',
    },
  });
}
