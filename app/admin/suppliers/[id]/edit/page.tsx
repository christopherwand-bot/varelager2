import Link from "next/link";
import { notFound } from "next/navigation";
import {
  deactivateSupplierAction,
  deleteSupplierAction,
  reactivateSupplierAction,
  updateSupplierAction,
} from "@/app/actions/suppliers";
import { DeleteSupplierForm } from "@/components/delete-supplier-form";
import { SupplierForm } from "@/components/supplier-form";
import { SupplierStatusForm } from "@/components/supplier-status-form";
import { requireUser } from "@/lib/auth";
import { getProductCountForSupplier, getSupplierById } from "@/lib/db";

export default async function EditSupplierPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireUser("ADMIN");
  const { id } = await params;
  const supplier = getSupplierById(id);

  if (!supplier) {
    notFound();
  }

  const linkedProducts = getProductCountForSupplier(supplier.id);
  const action = updateSupplierAction.bind(null, supplier.id);
  const removeAction = deleteSupplierAction.bind(null, supplier.id);
  const statusAction = (supplier.isActive
    ? deactivateSupplierAction
    : reactivateSupplierAction
  ).bind(null, supplier.id);

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col px-4 py-6 sm:px-6">
      <div className="mb-6 flex items-center justify-between gap-3">
        <div>
          <p className="text-sm text-[var(--muted)]">Admin</p>
          <h1 className="display-font text-3xl font-bold">Rediger leverandør</h1>
        </div>
        <Link className="btn-secondary px-5 py-3 font-semibold" href="/admin/suppliers">
          Tilbake
        </Link>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <SupplierForm action={action} supplier={supplier} />

        <aside className="space-y-4">
          <section className="card rounded-[2rem] p-6">
            <h2 className="text-lg font-semibold">Bruk i varer</h2>
            <p className="mt-2 text-sm text-[var(--muted)]">
              Denne leverandøren er koblet til {linkedProducts}{" "}
              {linkedProducts === 1 ? "vare" : "varer"}.
            </p>
            <p className="mt-3 text-sm text-[var(--muted)]">
              For å slette leverandøren må du først fjerne koblingen på alle tilhørende varer.
            </p>
            <p className="mt-3 text-sm text-[var(--muted)]">
              Status nå: {supplier.isActive ? "Aktiv" : "Inaktiv"}.
            </p>
          </section>

          <SupplierStatusForm
            action={statusAction}
            description={
              supplier.isActive
                ? "Deaktiver leverandøren for å skjule den fra nye valg uten å miste historikk."
                : "Reaktiver leverandøren for å gjøre den tilgjengelig igjen i admin og på nye varer."
            }
            label={supplier.isActive ? "Deaktiver leverandør" : "Reaktiver leverandør"}
            tone={supplier.isActive ? "danger" : "primary"}
          />
          <DeleteSupplierForm action={removeAction} disabled={linkedProducts > 0} />
        </aside>
      </div>
    </main>
  );
}
