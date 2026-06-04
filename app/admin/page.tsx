import Link from "next/link";
import type { ReactNode } from "react";
import { AlertTriangle, Boxes, ChartColumnIncreasing, History } from "lucide-react";
import { logoutAction } from "@/app/actions/auth";
import { requireUser } from "@/lib/auth";
import { ImportHistory } from "@/components/import-history";
import { ProductImportForm } from "@/components/product-import-form";
import {
  getCategories,
  getEmployees,
  getInventoryCounts,
  getProducts,
  getRecentImportRuns,
} from "@/lib/db";
import { formatCurrency, formatDateTime, formatQuantity } from "@/lib/utils";

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    category?: string;
    countsQ?: string;
    countsCategory?: string;
    user?: string;
    from?: string;
    to?: string;
  }>;
}) {
  await requireUser("ADMIN");
  const params = await searchParams;

  const [categories, employees, products, counts, importRuns] = await Promise.all([
    Promise.resolve(getCategories()),
    Promise.resolve(getEmployees()),
    Promise.resolve(
      getProducts({
        query: params.q,
        categoryId: params.category,
      })
    ),
    Promise.resolve(
      getInventoryCounts({
        query: params.countsQ,
        categoryId: params.countsCategory,
        userId: params.user,
        dateFrom: params.from,
        dateTo: params.to,
        limit: 12,
      })
    ),
    Promise.resolve(getRecentImportRuns(6)),
  ]);

  const metrics = products.reduce(
    (accumulator, product) => {
      const price = Number(product.purchasePrice);
      const value = product.currentStock * price;

      return {
        quantity: accumulator.quantity + product.currentStock,
        value: accumulator.value + value,
        lowStock: accumulator.lowStock + (product.currentStock <= product.minimumLevel ? 1 : 0),
      };
    },
    { quantity: 0, value: 0, lowStock: 0 }
  );

  const lowStockProducts = products.filter(
    (product) => product.currentStock <= product.minimumLevel
  );

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col px-4 py-5 sm:px-6 lg:px-8">
      <header className="mb-6 flex flex-col gap-4 rounded-[2rem] bg-[linear-gradient(135deg,#214c41_0%,#17342e_100%)] px-6 py-6 text-white sm:px-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="mb-2 text-sm text-white/70">Admin-dashboard</p>
            <h1 className="display-font text-3xl font-bold sm:text-4xl">
              Lageroversikt og vareadministrasjon
            </h1>
          </div>
          <div className="flex gap-3">
            <Link className="rounded-full bg-white/12 px-5 py-3 text-sm font-semibold text-white" href="/admin/export">
              Eksporter Excel
            </Link>
            <Link className="rounded-full bg-white/12 px-5 py-3 text-sm font-semibold text-white" href="/admin/low-stock">
              Innkjøpsliste
            </Link>
            <Link className="rounded-full bg-white/12 px-5 py-3 text-sm font-semibold text-white" href="/admin/suppliers">
              Leverandører
            </Link>
            <Link className="rounded-full bg-white/12 px-5 py-3 text-sm font-semibold text-white" href="/admin/categories">
              Kategorier
            </Link>
            <Link className="rounded-full bg-white/12 px-5 py-3 text-sm font-semibold text-white" href="/admin/users">
              Brukere
            </Link>
            <Link className="rounded-full bg-white px-5 py-3 text-sm font-semibold text-[var(--primary)]" href="/admin/products/new">
              Ny vare
            </Link>
            <form action={logoutAction}>
              <button className="rounded-full border border-white/20 px-5 py-3 text-sm font-semibold" type="submit">
                Logg ut
              </button>
            </form>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <MetricCard icon={<Boxes size={18} />} label="Total beholdning" value={`${formatQuantity(metrics.quantity)} enheter`} />
          <MetricCard icon={<ChartColumnIncreasing size={18} />} label="Total lagerverdi" value={formatCurrency(metrics.value)} />
          <MetricCard icon={<AlertTriangle size={18} />} label="Lav beholdning" value={`${metrics.lowStock} varer`} />
        </div>
      </header>

      <section className="mb-6 grid gap-4 xl:grid-cols-[1.45fr_0.95fr]">
        <div className="card rounded-[2rem] p-6">
          <div className="mb-5 flex items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold">Varer og lagerstatus</h2>
              <p className="text-sm text-[var(--muted)]">
                Søk, filtrer og gå til redigering for hver vare.
              </p>
            </div>
            <span className="pill bg-[var(--primary-soft)] text-[var(--primary)]">
              {products.length} varer
            </span>
          </div>

          <form className="mb-5 grid gap-3 md:grid-cols-[1fr_220px_auto]">
            <input
              className="field"
              defaultValue={params.q ?? ""}
              name="q"
              placeholder="Søk på vare, type eller leverandør"
            />
            <select className="field" defaultValue={params.category ?? "all"} name="category">
              <option value="all">Alle kategorier</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
            <button className="btn-secondary px-5 py-3 font-semibold" type="submit">
              Filtrer
            </button>
          </form>

          <div className="overflow-hidden rounded-[1.5rem] border border-[var(--border)]">
            <div className="overflow-x-auto">
              <table className="min-w-full bg-[var(--card-strong)] text-left text-sm">
                <thead className="bg-black/5 text-[var(--muted)]">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Vare</th>
                    <th className="px-4 py-3 font-semibold">Kategori</th>
                    <th className="px-4 py-3 font-semibold">Strekkode</th>
                    <th className="px-4 py-3 font-semibold">Beholdning</th>
                    <th className="px-4 py-3 font-semibold">Verdi</th>
                    <th className="px-4 py-3 font-semibold">Leverandør</th>
                    <th className="px-4 py-3 font-semibold" />
                  </tr>
                </thead>
                <tbody>
                  {products.map((product) => {
                    const value = product.currentStock * Number(product.purchasePrice);
                    const isLow = product.currentStock <= product.minimumLevel;

                    return (
                      <tr key={product.id} className="border-t border-[var(--border)] align-top">
                        <td className="px-4 py-4">
                          <p className="font-semibold">{product.name}</p>
                          <p className="mt-1 text-xs text-[var(--muted)]">
                            {product.productType || "Ingen type"}
                          </p>
                        </td>
                        <td className="px-4 py-4">{product.category.name}</td>
                        <td className="px-4 py-4">
                          <span className="text-xs text-[var(--muted)]">
                            {product.barcode ?? "Ikke satt"}
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          <span
                            className={`pill ${isLow ? "bg-[var(--danger-soft)] text-[var(--danger)]" : "bg-[var(--success-soft)] text-[var(--primary)]"}`}
                          >
                            {formatQuantity(product.currentStock)} {product.unit}
                          </span>
                          <p className="mt-2 text-xs text-[var(--muted)]">
                            Min {formatQuantity(product.minimumLevel)} {product.unit}
                          </p>
                        </td>
                        <td className="px-4 py-4">
                          <p className="font-semibold">{formatCurrency(value)}</p>
                          <p className="mt-1 text-xs text-[var(--muted)]">
                            {formatCurrency(Number(product.purchasePrice))} per {product.unit}
                          </p>
                        </td>
                        <td className="px-4 py-4">{product.supplier?.name ?? "Ikke satt"}</td>
                        <td className="px-4 py-4">
                          <Link className="text-sm font-semibold text-[var(--primary)]" href={`/admin/products/${product.id}/edit`}>
                            Rediger
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <ProductImportForm />
          <ImportHistory runs={importRuns} />

          <section className="card rounded-[2rem] p-6">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[var(--danger-soft)] text-[var(--danger)]">
                <AlertTriangle size={18} />
              </div>
              <div>
                <h2 className="text-lg font-semibold">Lav beholdning</h2>
                <p className="text-sm text-[var(--muted)]">Varer som bør følges opp</p>
              </div>
            </div>

            <div className="space-y-3">
              {lowStockProducts.slice(0, 6).map((product) => (
                <div key={product.id} className="rounded-[1.4rem] bg-white/70 p-4">
                  <p className="font-semibold">{product.name}</p>
                  <p className="mt-1 text-sm text-[var(--muted)]">
                    {formatQuantity(product.currentStock)} {product.unit} igjen, minimum{" "}
                    {formatQuantity(product.minimumLevel)} {product.unit}
                  </p>
                  <p className="mt-1 text-xs text-[var(--muted)]">
                    Foreslått bestilling:{" "}
                    {formatQuantity(Math.max(product.minimumLevel - product.currentStock, 0))}{" "}
                    {product.unit}
                  </p>
                </div>
              ))}

              {lowStockProducts.length === 0 ? (
                <p className="rounded-[1.4rem] bg-white/70 p-4 text-sm text-[var(--muted)]">
                  Ingen varer ligger under minimum akkurat nå.
                </p>
              ) : null}

              <Link
                className="block rounded-[1.4rem] border border-[var(--border)] px-4 py-3 text-center text-sm font-semibold text-[var(--primary)]"
                href="/admin/low-stock"
              >
                Åpne full innkjøpsliste
              </Link>
            </div>
          </section>

          <section className="card rounded-[2rem] p-6">
            <div className="mb-4 flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[var(--primary-soft)] text-[var(--primary)]">
                  <History size={18} />
                </div>
                <div>
                  <h2 className="text-lg font-semibold">Tellehistorikk</h2>
                  <p className="text-sm text-[var(--muted)]">
                    Filtrer på vare, kategori, ansatt og dato
                  </p>
                </div>
              </div>
              <Link
                className="rounded-full bg-[var(--primary-soft)] px-4 py-2 text-sm font-semibold text-[var(--primary)]"
                href={`/admin/counts/export?countsQ=${encodeURIComponent(params.countsQ ?? "")}&countsCategory=${encodeURIComponent(params.countsCategory ?? "all")}&user=${encodeURIComponent(params.user ?? "all")}&from=${encodeURIComponent(params.from ?? "")}&to=${encodeURIComponent(params.to ?? "")}`}
              >
                Eksporter tellinger
              </Link>
            </div>

            <form className="mb-4 grid gap-3 md:grid-cols-2">
              <input
                className="field"
                defaultValue={params.countsQ ?? ""}
                name="countsQ"
                placeholder="Søk på vare, strekkode, type eller ansatt"
              />
              <select
                className="field"
                defaultValue={params.countsCategory ?? "all"}
                name="countsCategory"
              >
                <option value="all">Alle kategorier</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
              <select className="field" defaultValue={params.user ?? "all"} name="user">
                <option value="all">Alle ansatte</option>
                {employees.map((employee) => (
                  <option key={employee.id} value={employee.id}>
                    {employee.name}
                  </option>
                ))}
              </select>
              <div className="grid grid-cols-2 gap-3">
                <input className="field" defaultValue={params.from ?? ""} name="from" type="date" />
                <input className="field" defaultValue={params.to ?? ""} name="to" type="date" />
              </div>
              <div className="flex gap-3 md:col-span-2">
                <button className="btn-secondary px-5 py-3 font-semibold" type="submit">
                  Filtrer historikk
                </button>
                <Link
                  className="rounded-full border border-[var(--border)] px-5 py-3 text-sm font-semibold text-[var(--muted)]"
                  href="/admin"
                >
                  Nullstill
                </Link>
              </div>
            </form>

            <div className="space-y-3">
              {counts.map((count) => (
                <div key={count.id} className="rounded-[1.4rem] bg-white/70 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold">{count.product.name}</p>
                      <p className="mt-1 text-sm text-[var(--muted)]">
                        {count.user.name} registrerte {formatQuantity(count.quantity)}{" "}
                        {count.product.unit}
                      </p>
                      <p className="mt-1 text-xs text-[var(--muted)]">
                        {count.product.category.name}
                        {count.product.barcode ? ` · ${count.product.barcode}` : ""}
                      </p>
                    </div>
                    <span className="text-xs text-[var(--muted)]">
                      {formatDateTime(count.countedAt)}
                    </span>
                  </div>
                </div>
              ))}

              {counts.length === 0 ? (
                <p className="rounded-[1.4rem] bg-white/70 p-4 text-sm text-[var(--muted)]">
                  Ingen tellinger matcher filtrene dine.
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
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-[1.6rem] bg-white/10 p-5">
      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-2xl bg-white/12">
        {icon}
      </div>
      <p className="text-sm text-white/70">{label}</p>
      <p className="mt-2 text-xl font-semibold">{value}</p>
    </div>
  );
}
