import Link from "next/link";
import { AlertTriangle, Boxes, ShoppingCart } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { getCategories, getProducts, getSuppliers } from "@/lib/db";
import { getLowStockReport } from "@/lib/low-stock";
import { formatCurrency, formatQuantity } from "@/lib/utils";

export default async function LowStockPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; supplier?: string }>;
}) {
  await requireUser("ADMIN");
  const params = await searchParams;

  const [categories, suppliers, products] = await Promise.all([
    Promise.resolve(getCategories()),
    Promise.resolve(getSuppliers({ includeInactive: true })),
    Promise.resolve(
      getProducts({
        categoryId: params.category,
      })
    ),
  ]);

  const filteredProducts =
    params.supplier && params.supplier !== "all"
      ? products.filter((product) => product.supplier?.id === params.supplier)
      : products;

  const report = getLowStockReport(filteredProducts);

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col px-4 py-5 sm:px-6 lg:px-8">
      <header className="mb-6 rounded-[2rem] bg-[linear-gradient(135deg,#6d432b_0%,#45291f_100%)] px-6 py-6 text-white sm:px-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="mb-2 text-sm text-white/70">Innkjøp og oppfølging</p>
            <h1 className="display-font text-3xl font-bold sm:text-4xl">
              Lav beholdning og innkjøpsliste
            </h1>
            <p className="mt-3 max-w-2xl text-sm text-white/75">
              Se varer under minimumsnivå, foreslått bestillingsantall og estimert kostnad.
            </p>
          </div>
          <div className="flex gap-3">
            <Link
              className="rounded-full bg-white/12 px-5 py-3 text-sm font-semibold text-white"
              href={`/admin/low-stock/export?category=${encodeURIComponent(params.category ?? "all")}&supplier=${encodeURIComponent(params.supplier ?? "all")}`}
            >
              Eksporter innkjøpsliste
            </Link>
            <Link
              className="rounded-full bg-white px-5 py-3 text-sm font-semibold text-[#45291f]"
              href="/admin"
            >
              Tilbake til admin
            </Link>
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <MetricCard
            icon={<AlertTriangle size={18} />}
            label="Varer under minimum"
            value={`${report.summary.totalItems} varer`}
          />
          <MetricCard
            icon={<Boxes size={18} />}
            label="Mangler totalt"
            value={`${formatQuantity(report.summary.totalShortage)} enheter`}
          />
          <MetricCard
            icon={<ShoppingCart size={18} />}
            label="Estimert innkjøp"
            value={formatCurrency(report.summary.totalEstimatedCost)}
          />
        </div>
      </header>

      <section className="mb-6 card rounded-[2rem] p-6">
        <div className="mb-5 flex items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold">Filtrer rapport</h2>
            <p className="text-sm text-[var(--muted)]">
              Begrens innkjøpslisten på kategori eller leverandør.
            </p>
          </div>
        </div>

        <form className="grid gap-3 md:grid-cols-[1fr_1fr_auto_auto]">
          <select className="field" defaultValue={params.category ?? "all"} name="category">
            <option value="all">Alle kategorier</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
          <select className="field" defaultValue={params.supplier ?? "all"} name="supplier">
            <option value="all">Alle leverandører</option>
            {suppliers.map((supplier) => (
              <option key={supplier.id} value={supplier.id}>
                {supplier.name}
              </option>
            ))}
          </select>
          <button className="btn-secondary px-5 py-3 font-semibold" type="submit">
            Filtrer
          </button>
          <Link
            className="rounded-full border border-[var(--border)] px-5 py-3 text-center text-sm font-semibold text-[var(--muted)]"
            href="/admin/low-stock"
          >
            Nullstill
          </Link>
        </form>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.35fr_0.95fr]">
        <div className="card rounded-[2rem] p-6">
          <div className="mb-5 flex items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold">Foreslått innkjøpsliste</h2>
              <p className="text-sm text-[var(--muted)]">
                Basert på differansen mellom beholdning og minimumsnivå.
              </p>
            </div>
            <span className="pill bg-[var(--danger-soft)] text-[var(--danger)]">
              {report.items.length} varelinjer
            </span>
          </div>

          <div className="overflow-hidden rounded-[1.5rem] border border-[var(--border)]">
            <div className="overflow-x-auto">
              <table className="min-w-full bg-[var(--card-strong)] text-left text-sm">
                <thead className="bg-black/5 text-[var(--muted)]">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Vare</th>
                    <th className="px-4 py-3 font-semibold">Beholdning</th>
                    <th className="px-4 py-3 font-semibold">Manglende</th>
                    <th className="px-4 py-3 font-semibold">Bestill</th>
                    <th className="px-4 py-3 font-semibold">Estimert kostnad</th>
                    <th className="px-4 py-3 font-semibold">Leverandør</th>
                  </tr>
                </thead>
                <tbody>
                  {report.items.map((item) => (
                    <tr key={item.product.id} className="border-t border-[var(--border)] align-top">
                      <td className="px-4 py-4">
                        <p className="font-semibold">{item.product.name}</p>
                        <p className="mt-1 text-xs text-[var(--muted)]">
                          {item.product.category.name}
                          {item.product.productType ? ` · ${item.product.productType}` : ""}
                        </p>
                      </td>
                      <td className="px-4 py-4">
                        {formatQuantity(item.product.currentStock)} {item.product.unit}
                        <p className="mt-1 text-xs text-[var(--muted)]">
                          Min {formatQuantity(item.product.minimumLevel)} {item.product.unit}
                        </p>
                      </td>
                      <td className="px-4 py-4">
                        {formatQuantity(item.shortage)} {item.product.unit}
                      </td>
                      <td className="px-4 py-4">
                        <span className="pill bg-[var(--primary-soft)] text-[var(--primary)]">
                          {formatQuantity(item.suggestedOrderQuantity)} {item.product.unit}
                        </span>
                      </td>
                      <td className="px-4 py-4">{formatCurrency(item.estimatedCost)}</td>
                      <td className="px-4 py-4">{item.supplierLabel}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {report.items.length === 0 ? (
            <p className="mt-4 rounded-[1.4rem] bg-white/70 p-4 text-sm text-[var(--muted)]">
              Ingen varer matcher filtrene eller ligger under minimum akkurat nå.
            </p>
          ) : null}
        </div>

        <div className="space-y-4">
          <section className="card rounded-[2rem] p-6">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[var(--primary-soft)] text-[var(--primary)]">
                <ShoppingCart size={18} />
              </div>
              <div>
                <h2 className="text-lg font-semibold">Per leverandør</h2>
                <p className="text-sm text-[var(--muted)]">
                  Gruppert for enklere bestilling.
                </p>
              </div>
            </div>

            <div className="space-y-3">
              {report.supplierGroups.map((group) => (
                <div key={group.supplierLabel} className="rounded-[1.4rem] bg-white/70 p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-semibold">{group.supplierLabel}</p>
                      <p className="mt-1 text-sm text-[var(--muted)]">
                        {group.totalItems} varer i innkjøpslisten
                      </p>
                    </div>
                    <span className="pill bg-[var(--primary-soft)] text-[var(--primary)]">
                      {formatCurrency(group.totalEstimatedCost)}
                    </span>
                  </div>
                </div>
              ))}

              {report.supplierGroups.length === 0 ? (
                <p className="rounded-[1.4rem] bg-white/70 p-4 text-sm text-[var(--muted)]">
                  Ingen leverandørgrupper å vise akkurat nå.
                </p>
              ) : null}
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}

function MetricCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-[1.5rem] bg-white/10 p-4 backdrop-blur-sm">
      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-2xl bg-white/12">
        {icon}
      </div>
      <p className="text-sm text-white/70">{label}</p>
      <p className="mt-1 text-2xl font-semibold">{value}</p>
    </div>
  );
}
