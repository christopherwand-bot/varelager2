import Link from "next/link";
import { createCategoryAction } from "@/app/actions/categories";
import { CategoryForm } from "@/components/category-form";
import { requireUser } from "@/lib/auth";

export default async function NewCategoryPage() {
  await requireUser("ADMIN");

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col px-4 py-6 sm:px-6">
      <div className="mb-6 flex items-center justify-between gap-3">
        <div>
          <p className="text-sm text-[var(--muted)]">Admin</p>
          <h1 className="display-font text-3xl font-bold">Ny kategori</h1>
        </div>
        <Link className="btn-secondary px-5 py-3 font-semibold" href="/admin/categories">
          Tilbake
        </Link>
      </div>

      <CategoryForm action={createCategoryAction} />
    </main>
  );
}
