import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, FileSpreadsheet, History, PackageCheck } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { getImportRunById } from "@/lib/db";
import { formatDateTime } from "@/lib/utils";

export default async function ImportHistoryDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireUser("ADMIN");
  const { id } = await params;
  const run = getImportRunById(id);

  if (!run) {
    notFound();
  }

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col px-4 py-6 sm:px-6 lg:px-8">
      <div className="mb-6 flex items-center justify-between gap-3">
        <div>
          <p className="text-sm text-[var(--muted)]">Admin / Importhistorikk</p>
          <h1 className="display-font text-3xl font-bold">Importdetaljer</h1>
        </div>
        <Link className="btn-secondary px-5 py-3 font-semibold" href="/admin">
          <span className="inline-flex items-center gap-2">
            <ArrowLeft size={16} />
            Tilbake
          </span>
        </Link>
      </div>

      <section className="mb-6 grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="card rounded-[2rem] p-6">
          <div className="mb-4 flex items-start justify-between gap-4">
            <div>
              <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--primary-soft)] text-[var(--primary)]">
                <FileSpreadsheet size={20} />
              </div>
              <h2 className="text-xl font-semibold">{run.fileName}</h2>
              <p className="mt-2 text-sm text-[var(--muted)]">
                Import kjørt av {run.user.name} ({run.user.email})
              </p>
            </div>
            <span
              className={`pill ${
                run.status === "IMPORTED"
                  ? "bg-[var(--success-soft)] text-[var(--primary)]"
                  : "bg-[rgba(215,122,54,0.16)] text-[var(--accent)]"
              }`}
            >
              {run.status === "IMPORTED" ? "Importert" : "Kun forhåndsvisning"}
            </span>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <InfoCard label="Varelinjer" value={String(run.totalRows)} icon={<PackageCheck size={16} />} />
            <InfoCard label="Nye varer" value={String(run.createdCount)} icon={<PackageCheck size={16} />} />
            <InfoCard label="Oppdaterte varer" value={String(run.updatedCount)} icon={<History size={16} />} />
            <InfoCard
              label="Opprettet"
              value={formatDateTime(run.createdAt)}
              icon={<History size={16} />}
            />
          </div>

          <div className="mt-4 rounded-[1.4rem] bg-white/70 p-4 text-sm text-[var(--muted)]">
            <p>Opprettet: {formatDateTime(run.createdAt)}</p>
            <p className="mt-1">
              Bekreftet: {run.confirmedAt ? formatDateTime(run.confirmedAt) : "Ikke bekreftet"}
            </p>
          </div>
        </div>

        <div className="card rounded-[2rem] p-6">
          <h2 className="text-lg font-semibold">Oppsummering</h2>
          <div className="mt-4 space-y-3">
            <div className="rounded-[1.4rem] bg-white/70 p-4">
              <p className="font-semibold">Importstatus</p>
              <p className="mt-1 text-sm text-[var(--muted)]">
                {run.status === "IMPORTED"
                  ? "Denne importen er bekreftet og lagret i lagerdatabasen."
                  : "Denne importen ble bare kjørt som forhåndsvisning og er ikke lagret."}
              </p>
            </div>
            <div className="rounded-[1.4rem] bg-white/70 p-4">
              <p className="font-semibold">Endringsbilde</p>
              <p className="mt-1 text-sm text-[var(--muted)]">
                {run.createdCount} varelinjer ville opprette nye varer, og {run.updatedCount} ville
                oppdatere eksisterende varer basert på varenavn.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="card rounded-[2rem] p-6">
        <div className="mb-4">
          <h2 className="text-xl font-semibold">Varelinjer i importen</h2>
          <p className="mt-2 text-sm text-[var(--muted)]">
            Full liste over linjene som ble lest fra filen.
          </p>
        </div>

        <div className="overflow-hidden rounded-[1.5rem] border border-[var(--border)]">
          <div className="overflow-x-auto">
            <table className="min-w-full bg-[var(--card-strong)] text-left text-sm">
              <thead className="bg-black/5 text-[var(--muted)]">
                <tr>
                  <th className="px-4 py-3 font-semibold">Rad</th>
                  <th className="px-4 py-3 font-semibold">Vare</th>
                  <th className="px-4 py-3 font-semibold">Kategori</th>
                  <th className="px-4 py-3 font-semibold">Pris</th>
                  <th className="px-4 py-3 font-semibold">Beholdning</th>
                  <th className="px-4 py-3 font-semibold">Leverandør</th>
                  <th className="px-4 py-3 font-semibold">Handling</th>
                </tr>
              </thead>
              <tbody>
                {run.items.map((item) => (
                  <tr key={item.id} className="border-t border-[var(--border)] align-top">
                    <td className="px-4 py-4">{item.rowNumber}</td>
                    <td className="px-4 py-4">
                      <p className="font-semibold">{item.name}</p>
                      <p className="mt-1 text-xs text-[var(--muted)]">
                        {item.productType || "Ingen type"} • {item.unit}
                      </p>
                    </td>
                    <td className="px-4 py-4">{item.categoryName}</td>
                    <td className="px-4 py-4">{item.purchasePrice}</td>
                    <td className="px-4 py-4">
                      <p>{item.currentStock}</p>
                      <p className="mt-1 text-xs text-[var(--muted)]">
                        Min {item.minimumLevel}
                      </p>
                    </td>
                    <td className="px-4 py-4">{item.supplierName || "Ikke satt"}</td>
                    <td className="px-4 py-4">
                      <span
                        className={`pill ${
                          item.action === "create"
                            ? "bg-[var(--success-soft)] text-[var(--primary)]"
                            : "bg-[rgba(215,122,54,0.16)] text-[var(--accent)]"
                        }`}
                      >
                        {item.action === "create" ? "Opprettes" : "Oppdateres"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </main>
  );
}

function InfoCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-[1.4rem] bg-white/70 p-4">
      <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-2xl bg-[var(--primary-soft)] text-[var(--primary)]">
        {icon}
      </div>
      <p className="text-sm text-[var(--muted)]">{label}</p>
      <p className="mt-1 font-semibold">{value}</p>
    </div>
  );
}
