import Link from "next/link";
import { createSupplierAction } from "@/app/actions/suppliers";
import { SupplierForm } from "@/components/supplier-form";
import { requireUser } from "@/lib/auth";

export default async function NewSupplierPage() {
  await requireUser("ADMIN");

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col px-4 py-6 sm:px-6">
      <div className="mb-6 flex items-center justify-between gap-3">
        <div>
          <p className="text-sm text-[var(--muted)]">Admin</p>
          <h1 className="display-font text-3xl font-bold">Ny leverandør</h1>
        </div>
        <Link className="btn-secondary px-5 py-3 font-semibold" href="/admin/suppliers">
          Tilbake
        </Link>
      </div>

      <SupplierForm action={createSupplierAction} />
    </main>
  );
}
