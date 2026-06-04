import Link from "next/link";
import { createUserAction } from "@/app/actions/users";
import { UserForm } from "@/components/user-form";
import { requireUser } from "@/lib/auth";

export default async function NewUserPage() {
  await requireUser("ADMIN");

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col px-4 py-6 sm:px-6">
      <div className="mb-6 flex items-center justify-between gap-3">
        <div>
          <p className="text-sm text-[var(--muted)]">Admin</p>
          <h1 className="display-font text-3xl font-bold">Ny bruker</h1>
        </div>
        <Link className="btn-secondary px-5 py-3 font-semibold" href="/admin/users">
          Tilbake
        </Link>
      </div>

      <UserForm action={createUserAction} />
    </main>
  );
}
