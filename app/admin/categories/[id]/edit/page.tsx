import Link from "next/link";
import { notFound } from "next/navigation";
import { updateCategoryAction } from "@/app/actions/categories";
import { CategoryForm } from "@/components/category-form";
import { requireUser } from "@/lib/auth";
import { getCategoryById, getProductCountForCategory } from "@/lib/db";

export default async function EditCategoryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireUser("ADMIN");
  const { id } = await params;
  const category = getCategoryById(id);

  if (!category) {
    notFound();
  }

  const action = updateCategoryAction.bind(null, category.id);
  const linkedProducts = getProductCountForCategory(category.id);

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col px-4 py-6 sm:px-6">
      <div className="mb-6 flex items-center justify-between gap-3">
        <div>
          <p className="text-sm text-[var(--muted)]">Admin</p>
          <h1 className="display-font text-3xl font-bold">Rediger kategori</h1>
        </div>
        <Link className="btn-secondary px-5 py-3 font-semibold" href="/admin/categories">
          Tilbake
        </Link>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <CategoryForm action={action} category={category} />

        <aside className="card rounded-[2rem] p-6">
          <h2 className="text-lg font-semibold">Bruk i varer</h2>
          <p className="mt-2 text-sm text-[var(--muted)]">
            Denne kategorien brukes av {linkedProducts} {linkedProducts === 1 ? "vare" : "varer"}.
          </p>
          <p className="mt-3 text-sm text-[var(--muted)]">
            Endringer i navn oppdaterer visningen i admin og på mobil uten å påvirke historikken.
          </p>
        </aside>
      </div>
    </main>
  );
}
