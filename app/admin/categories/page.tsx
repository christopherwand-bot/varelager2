import Link from "next/link";
import { Layers3 } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { getCategories, getProductCountForCategory } from "@/lib/db";

export default async function CategoriesPage() {
  await requireUser("ADMIN");
  const categories = getCategories();

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-4 py-5 sm:px-6 lg:px-8">
      <header className="mb-6 rounded-[2rem] bg-[linear-gradient(135deg,#67552c_0%,#3b3118_100%)] px-6 py-6 text-white sm:px-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="mb-2 text-sm text-white/70">Kategorier</p>
            <h1 className="display-font text-3xl font-bold sm:text-4xl">
              Kategoriadministrasjon
            </h1>
            <p className="mt-3 max-w-2xl text-sm text-white/75">
              Hold varekategoriene ryddige og konsistente på tvers av lageret.
            </p>
          </div>
          <div className="flex gap-3">
            <Link
              className="rounded-full bg-white/12 px-5 py-3 text-sm font-semibold text-white"
              href="/admin/categories/new"
            >
              Ny kategori
            </Link>
            <Link
              className="rounded-full bg-white px-5 py-3 text-sm font-semibold text-[#3b3118]"
              href="/admin"
            >
              Tilbake til admin
            </Link>
          </div>
        </div>
      </header>

      <section className="card rounded-[2rem] p-6">
        <div className="mb-5 flex items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold">Kategoriliste</h2>
            <p className="text-sm text-[var(--muted)]">
              Viser navn, slug og hvor mange varer som er knyttet til kategorien.
            </p>
          </div>
          <span className="pill bg-[var(--primary-soft)] text-[var(--primary)]">
            {categories.length} kategorier
          </span>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {categories.map((category) => (
            <article key={category.id} className="rounded-[1.6rem] border border-[var(--border)] bg-white/70 p-5">
              <div className="mb-3 flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[var(--secondary)] text-[var(--primary)]">
                    <Layers3 size={18} />
                  </div>
                  <div>
                    <h3 className="font-semibold">{category.name}</h3>
                    <p className="text-sm text-[var(--muted)]">{category.slug}</p>
                  </div>
                </div>
                <Link
                  className="text-sm font-semibold text-[var(--primary)]"
                  href={`/admin/categories/${category.id}/edit`}
                >
                  Rediger
                </Link>
              </div>
              <p className="text-sm text-[var(--muted)]">
                {getProductCountForCategory(category.id)} varer i denne kategorien
              </p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
