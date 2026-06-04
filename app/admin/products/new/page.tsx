import Link from "next/link";
import { createProductAction } from "@/app/actions/products";
import { ProductForm } from "@/components/product-form";
import { requireUser } from "@/lib/auth";
import { getCategories, getSuppliers } from "@/lib/db";

export default async function NewProductPage() {
  await requireUser("ADMIN");

  const [categories, suppliers] = await Promise.all([
    Promise.resolve(getCategories()),
    Promise.resolve(getSuppliers()),
  ]);

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col px-4 py-6 sm:px-6">
      <div className="mb-6 flex items-center justify-between gap-3">
        <div>
          <p className="text-sm text-[var(--muted)]">Admin</p>
          <h1 className="display-font text-3xl font-bold">Ny vare</h1>
        </div>
        <Link className="btn-secondary px-5 py-3 font-semibold" href="/admin">
          Tilbake
        </Link>
      </div>

      <ProductForm action={createProductAction} categories={categories} suppliers={suppliers} />
    </main>
  );
}
