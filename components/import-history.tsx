import Link from "next/link";
import { formatDateTime } from "@/lib/utils";
import type { ImportRunWithRelations } from "@/lib/types";

export function ImportHistory({
  runs,
}: {
  runs: ImportRunWithRelations[];
}) {
  return (
    <section className="card rounded-[2rem] p-6">
      <h2 className="text-lg font-semibold">Importhistorikk</h2>
      <p className="mt-2 text-sm text-[var(--muted)]">
        Siste importer med filnavn, status og hvem som kjørte dem.
      </p>

      <div className="mt-4 space-y-3">
        {runs.map((run) => (
          <Link
            key={run.id}
            className="block rounded-[1.4rem] bg-white/70 p-4 transition-transform hover:-translate-y-0.5"
            href={`/admin/import-history/${run.id}`}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-semibold">{run.fileName}</p>
                <p className="mt-1 text-sm text-[var(--muted)]">
                  {run.user.name} • {run.totalRows} varelinjer • {run.createdCount} nye •{" "}
                  {run.updatedCount} oppdaterte
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
            <p className="mt-2 text-xs text-[var(--muted)]">
              Opprettet {formatDateTime(run.createdAt)}
              {run.confirmedAt ? ` • Bekreftet ${formatDateTime(run.confirmedAt)}` : ""}
            </p>
          </Link>
        ))}

        {runs.length === 0 ? (
          <p className="rounded-[1.4rem] bg-white/70 p-4 text-sm text-[var(--muted)]">
            Ingen importer er registrert ennå.
          </p>
        ) : null}
      </div>
    </section>
  );
}
