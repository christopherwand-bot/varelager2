import Link from "next/link";
import { Mail, Phone, ShoppingCart, Truck } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { getProducts, getSuppliers } from "@/lib/db";
import { getLowStockReport } from "@/lib/low-stock";
import { formatCurrency, formatQuantity } from "@/lib/utils";

export default async function SuppliersPage({
  searchParams,
}: {
  searchParams: Promise<{ supplier?: string }>;
}) {
  await requireUser("ADMIN");
  const params = await searchParams;

  const [suppliers, products] = await Promise.all([
    Promise.resolve(getSuppliers({ includeInactive: true })),
    Promise.resolve(getProducts()),
  ]);

  const report = getLowStockReport(products);
  const supplierGroups =
    params.supplier && params.supplier !== "all"
      ? report.supplierGroups.filter((group) => group.supplier?.id === params.supplier)
      : report.supplierGroups;

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col px-4 py-5 sm:px-6 lg:px-8">
      <header className="mb-6 rounded-[2rem] bg-[linear-gradient(135deg,#29506d_0%,#183246_100%)] px-6 py-6 text-white sm:px-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="mb-2 text-sm text-white/70">Leverandører</p>
            <h1 className="display-font text-3xl font-bold sm:text-4xl">
              Leverandøroversikt og bestillingsgrunnlag
            </h1>
            <p className="mt-3 max-w-2xl text-sm text-white/75">
              Se kontaktinfo og hvilke varer som bør bestilles per leverandør.
            </p>
          </div>
          <div className="flex gap-3">
            <Link
              className="rounded-full bg-white/12 px-5 py-3 text-sm font-semibold text-white"
              href="/admin/suppliers/new"
            >
              Ny leverandør
            </Link>
            <Link
              className="rounded-full bg-white/12 px-5 py-3 text-sm font-semibold text-white"
              href={`/admin/suppliers/export?supplier=${encodeURIComponent(params.supplier ?? "all")}`}
            >
              Eksporter leverandører
            </Link>
            <Link
              className="rounded-full bg-white px-5 py-3 text-sm font-semibold text-[#183246]"
              href="/admin"
            >
              Tilbake til admin
            </Link>
          </div>
        </div>
      </header>

      <section className="mb-6 card rounded-[2rem] p-6">
        <form className="grid gap-3 md:grid-cols-[1fr_auto_auto]">
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
            href="/admin/suppliers"
          >
            Nullstill
          </Link>
        </form>
      </section>

      <section className="space-y-4">
        {supplierGroups.map((group) => (
          <article key={group.supplierLabel} className="card rounded-[2rem] p-6">
            <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <div className="mb-3 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[var(--primary-soft)] text-[var(--primary)]">
                    <Truck size={18} />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold">{group.supplierLabel}</h2>
                    <p className="text-sm text-[var(--muted)]">
                      {group.totalItems} varer i bestillingsgrunnlaget
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-3 text-sm text-[var(--muted)]">
                  <span className="pill bg-[var(--primary-soft)] text-[var(--primary)]">
                    {formatCurrency(group.totalEstimatedCost)}
                  </span>
                  {group.supplier ? (
                    <Link
                      className="inline-flex items-center font-semibold text-[var(--primary)]"
                      href={`/admin/suppliers/${group.supplier.id}/edit`}
                    >
                      Rediger
                    </Link>
                  ) : null}
                  {group.supplier ? (
                    <span
                      className={`pill ${
                        group.supplier.isActive
                          ? "bg-[var(--success-soft)] text-[var(--primary)]"
                          : "bg-[var(--danger-soft)] text-[var(--danger)]"
                      }`}
                    >
                      {group.supplier.isActive ? "Aktiv" : "Inaktiv"}
                    </span>
                  ) : null}
                  {group.supplier?.email ? (
                    <span className="inline-flex items-center gap-2">
                      <Mail size={14} />
                      {group.supplier.email}
                    </span>
                  ) : null}
                  {group.supplier?.phone ? (
                    <span className="inline-flex items-center gap-2">
                      <Phone size={14} />
                      {group.supplier.phone}
                    </span>
                  ) : null}
                  {group.supplier?.contactName ? (
                    <span>Kontakt: {group.supplier.contactName}</span>
                  ) : null}
                </div>
              </div>

              <div className="grid gap-3 sm:min-w-56">
                <MetricCard
                  icon={<ShoppingCart size={16} />}
                  label="Estimert innkjøp"
                  value={formatCurrency(group.totalEstimatedCost)}
                />
                <MetricCard
                  icon={<Truck size={16} />}
                  label="Linjer"
                  value={`${group.totalItems} varer`}
                />
              </div>
            </div>

            <div className="overflow-hidden rounded-[1.5rem] border border-[var(--border)]">
              <div className="overflow-x-auto">
                <table className="min-w-full bg-[var(--card-strong)] text-left text-sm">
                  <thead className="bg-black/5 text-[var(--muted)]">
                    <tr>
                      <th className="px-4 py-3 font-semibold">Vare</th>
                      <th className="px-4 py-3 font-semibold">Kategori</th>
                      <th className="px-4 py-3 font-semibold">Beholdning</th>
                      <th className="px-4 py-3 font-semibold">Bestill</th>
                      <th className="px-4 py-3 font-semibold">Kostnad</th>
                    </tr>
                  </thead>
                  <tbody>
                    {group.items.map((item) => (
                      <tr key={item.product.id} className="border-t border-[var(--border)]">
                        <td className="px-4 py-4">
                          <p className="font-semibold">{item.product.name}</p>
                          <p className="mt-1 text-xs text-[var(--muted)]">
                            {item.product.barcode ?? "Ingen strekkode"}
                          </p>
                        </td>
                        <td className="px-4 py-4">{item.product.category.name}</td>
                        <td className="px-4 py-4">
                          {formatQuantity(item.product.currentStock)} {item.product.unit}
                          <p className="mt-1 text-xs text-[var(--muted)]">
                            Min {formatQuantity(item.product.minimumLevel)} {item.product.unit}
                          </p>
                        </td>
                        <td className="px-4 py-4">
                          {formatQuantity(item.suggestedOrderQuantity)} {item.product.unit}
                        </td>
                        <td className="px-4 py-4">{formatCurrency(item.estimatedCost)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </article>
        ))}

        {supplierGroups.length === 0 ? (
          <p className="card rounded-[2rem] p-6 text-sm text-[var(--muted)]">
            Ingen leverandører matcher filteret, eller ingen varer ligger under minimum akkurat nå.
          </p>
        ) : null}
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
    <div className="rounded-[1.5rem] bg-[var(--secondary)] p-4">
      <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-2xl bg-white text-[var(--primary)]">
        {icon}
      </div>
      <p className="text-sm text-[var(--muted)]">{label}</p>
      <p className="mt-1 text-lg font-semibold">{value}</p>
    </div>
  );
}
