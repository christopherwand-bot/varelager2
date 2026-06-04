import Link from "next/link";
import { notFound } from "next/navigation";
import { updateProductAction } from "@/app/actions/products";
import { ProductForm } from "@/components/product-form";
import { requireUser } from "@/lib/auth";
import { getCategories, getProductById, getSuppliers } from "@/lib/db";

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireUser("ADMIN");
  const { id } = await params;

  const [categories, suppliers, product] = await Promise.all([
    Promise.resolve(getCategories()),
    Promise.resolve(getSuppliers({ includeInactive: true })),
    Promise.resolve(getProductById(id)),
  ]);

  if (!product) {
    notFound();
  }

  const action = updateProductAction.bind(null, product.id);

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col px-4 py-6 sm:px-6">
      <div className="mb-6 flex items-center justify-between gap-3">
        <div>
          <p className="text-sm text-[var(--muted)]">Admin</p>
          <h1 className="display-font text-3xl font-bold">Rediger vare</h1>
        </div>
        <Link className="btn-secondary px-5 py-3 font-semibold" href="/admin">
          Tilbake
        </Link>
      </div>

      <ProductForm
        action={action}
        categories={categories}
        product={product}
        suppliers={suppliers}
      />
    </main>
  );
}
