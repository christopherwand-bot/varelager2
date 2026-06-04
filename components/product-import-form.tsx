"use client";

import Link from "next/link";
import { useActionState, useEffect } from "react";
import {
  confirmImportProductsAction,
  importProductsAction,
  type ProductImportFormState,
} from "@/app/actions/products";
import { SubmitButton } from "@/components/submit-button";

const initialState: ProductImportFormState = {
  success: false,
  stage: "idle",
};

export function ProductImportForm() {
  const [previewState, previewAction] = useActionState(
    importProductsAction,
    initialState
  );
  const [confirmState, confirmAction] = useActionState(
    confirmImportProductsAction,
    initialState
  );

  useEffect(() => {
    if (confirmState.stage === "done") {
      window.location.reload();
    }
  }, [confirmState.stage]);

  const activePreview =
    previewState.stage === "preview" && previewState.previewRows?.length
      ? previewState
      : null;

  return (
    <div className="card rounded-[2rem] p-6">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold">Importer varer fra Excel</h2>
          <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
            Last opp et ark med kolonnene <strong>varenavn</strong>,{" "}
            <strong>kategori</strong> og <strong>innkjøpspris</strong>. Du kan også
            ta med <strong>enhet</strong>, <strong>varetype</strong>,{" "}
            <strong>leverandør</strong>, <strong>minimumsnivå</strong> og{" "}
            <strong>lagerbeholdning</strong>.
          </p>
        </div>

        <Link
          className="btn-secondary shrink-0 px-4 py-3 text-sm font-semibold"
          href="/admin/import-template"
        >
          Last ned mal
        </Link>
      </div>

      <div className="mb-4 rounded-[1.4rem] bg-white/70 p-4 text-sm text-[var(--muted)]">
        Importen kjører først som tørrkjøring på serveren. Deretter bekrefter du
        før varene faktisk blir opprettet eller oppdatert.
      </div>

      <form action={previewAction} className="mb-4">
        <div className="mb-4 space-y-2">
          <label className="text-sm font-semibold" htmlFor="file">
            Excel- eller CSV-fil
          </label>
          <input
            accept=".xlsx,.xls,.csv"
            className="field"
            id="file"
            name="file"
            type="file"
          />
        </div>

        {previewState.message && previewState.stage !== "preview" ? (
          <p
            className={`mb-4 rounded-2xl px-4 py-3 text-sm ${
              previewState.success
                ? "bg-[var(--success-soft)] text-[var(--primary)]"
                : "bg-[var(--danger-soft)] text-[var(--danger)]"
            }`}
          >
            {previewState.message}
          </p>
        ) : null}

        <SubmitButton label="Kjør tørrkjøring" pendingLabel="Leser fil..." />
      </form>

      {activePreview ? (
        <div className="rounded-[1.5rem] border border-[var(--border)] bg-white/75 p-4">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <span className="pill bg-[var(--primary-soft)] text-[var(--primary)]">
              {activePreview.previewRows?.length ?? 0} varelinjer
            </span>
            <span className="pill bg-[var(--success-soft)] text-[var(--primary)]">
              {activePreview.createdCount ?? 0} nye
            </span>
            <span className="pill bg-[rgba(215,122,54,0.16)] text-[var(--accent)]">
              {activePreview.updatedCount ?? 0} oppdateres
            </span>
          </div>

          <p className="mb-4 text-sm text-[var(--muted)]">
            {activePreview.message} Fil: <strong>{activePreview.fileName}</strong>
          </p>

          <div className="overflow-hidden rounded-[1.25rem] border border-[var(--border)]">
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white text-left text-sm">
                <thead className="bg-black/5 text-[var(--muted)]">
                  <tr>
                    <th className="px-3 py-3 font-semibold">Rad</th>
                    <th className="px-3 py-3 font-semibold">Vare</th>
                    <th className="px-3 py-3 font-semibold">Kategori</th>
                    <th className="px-3 py-3 font-semibold">Pris</th>
                    <th className="px-3 py-3 font-semibold">Beholdning</th>
                    <th className="px-3 py-3 font-semibold">Handling</th>
                  </tr>
                </thead>
                <tbody>
                  {activePreview.previewRows?.slice(0, 8).map((row) => (
                    <tr key={row.id} className="border-t border-[var(--border)]">
                      <td className="px-3 py-3">{row.rowNumber}</td>
                      <td className="px-3 py-3">
                        <p className="font-semibold">{row.name}</p>
                        <p className="text-xs text-[var(--muted)]">
                          {row.unit} • min {row.minimumLevel}
                        </p>
                      </td>
                      <td className="px-3 py-3">{row.categoryName}</td>
                      <td className="px-3 py-3">{row.purchasePrice}</td>
                      <td className="px-3 py-3">{row.currentStock}</td>
                      <td className="px-3 py-3">
                        <span
                          className={`pill ${
                            row.action === "create"
                              ? "bg-[var(--success-soft)] text-[var(--primary)]"
                              : "bg-[rgba(215,122,54,0.16)] text-[var(--accent)]"
                          }`}
                        >
                          {row.action === "create" ? "Opprettes" : "Oppdateres"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {(activePreview.previewRows?.length ?? 0) > 8 ? (
            <p className="mt-3 text-xs text-[var(--muted)]">
              Viser de første 8 radene av {activePreview.previewRows?.length}.
            </p>
          ) : null}

          <form action={confirmAction} className="mt-4">
            <input
              name="importRunId"
              type="hidden"
              value={activePreview.importRunId ?? ""}
            />

            {confirmState.message ? (
              <p
                className={`mb-4 rounded-2xl px-4 py-3 text-sm ${
                  confirmState.success
                    ? "bg-[var(--success-soft)] text-[var(--primary)]"
                    : "bg-[var(--danger-soft)] text-[var(--danger)]"
                }`}
              >
                {confirmState.message}
              </p>
            ) : null}

            <SubmitButton
              label="Bekreft og importer"
              pendingLabel="Lagrer import..."
            />
          </form>
        </div>
      ) : null}
    </div>
  );
}
