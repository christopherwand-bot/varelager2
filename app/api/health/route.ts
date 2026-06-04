import { NextResponse } from "next/server";
import { getCategories } from "@/lib/db";

export async function GET() {
  const categories = getCategories();

  return NextResponse.json({
    ok: true,
    timestamp: new Date().toISOString(),
    categoryCount: categories.length,
  });
}
