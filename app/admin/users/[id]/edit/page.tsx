import Link from "next/link";
import { notFound } from "next/navigation";
import { updateUserAction } from "@/app/actions/users";
import { UserForm } from "@/components/user-form";
import { requireUser } from "@/lib/auth";
import { getUserById } from "@/lib/db";

export default async function EditUserPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireUser("ADMIN");
  const { id } = await params;
  const user = getUserById(id);

  if (!user) {
    notFound();
  }

  const action = updateUserAction.bind(null, user.id);

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col px-4 py-6 sm:px-6">
      <div className="mb-6 flex items-center justify-between gap-3">
        <div>
          <p className="text-sm text-[var(--muted)]">Admin</p>
          <h1 className="display-font text-3xl font-bold">Rediger bruker</h1>
        </div>
        <Link className="btn-secondary px-5 py-3 font-semibold" href="/admin/users">
          Tilbake
        </Link>
      </div>

      <UserForm action={action} user={user} />
    </main>
  );
}
