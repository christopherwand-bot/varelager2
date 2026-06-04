import Link from "next/link";
import { Shield, UserRound } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { getUsers } from "@/lib/db";
import { formatDateTime } from "@/lib/utils";

export default async function UsersPage() {
  await requireUser("ADMIN");
  const users = getUsers();

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col px-4 py-5 sm:px-6 lg:px-8">
      <header className="mb-6 rounded-[2rem] bg-[linear-gradient(135deg,#324a78_0%,#202f4e_100%)] px-6 py-6 text-white sm:px-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="mb-2 text-sm text-white/70">Brukere</p>
            <h1 className="display-font text-3xl font-bold sm:text-4xl">
              Brukeradministrasjon
            </h1>
            <p className="mt-3 max-w-2xl text-sm text-white/75">
              Opprett og vedlikehold ansatte og administratorer.
            </p>
          </div>
          <div className="flex gap-3">
            <Link
              className="rounded-full bg-white/12 px-5 py-3 text-sm font-semibold text-white"
              href="/admin/users/new"
            >
              Ny bruker
            </Link>
            <Link
              className="rounded-full bg-white px-5 py-3 text-sm font-semibold text-[#202f4e]"
              href="/admin"
            >
              Tilbake til admin
            </Link>
          </div>
        </div>
      </header>

      <section className="card rounded-[2rem] p-6">
        <div className="mb-5 flex items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold">Brukerliste</h2>
            <p className="text-sm text-[var(--muted)]">
              Roller styrer tilgang til mobilflate og admin-dashboard.
            </p>
          </div>
          <span className="pill bg-[var(--primary-soft)] text-[var(--primary)]">
            {users.length} brukere
          </span>
        </div>

        <div className="overflow-hidden rounded-[1.5rem] border border-[var(--border)]">
          <div className="overflow-x-auto">
            <table className="min-w-full bg-[var(--card-strong)] text-left text-sm">
              <thead className="bg-black/5 text-[var(--muted)]">
                <tr>
                  <th className="px-4 py-3 font-semibold">Navn</th>
                  <th className="px-4 py-3 font-semibold">E-post</th>
                  <th className="px-4 py-3 font-semibold">Rolle</th>
                  <th className="px-4 py-3 font-semibold">Opprettet</th>
                  <th className="px-4 py-3 font-semibold" />
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className="border-t border-[var(--border)]">
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[var(--secondary)] text-[var(--primary)]">
                          {user.role === "ADMIN" ? <Shield size={18} /> : <UserRound size={18} />}
                        </div>
                        <span className="font-semibold">{user.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4">{user.email}</td>
                    <td className="px-4 py-4">
                      <span className="pill bg-[var(--primary-soft)] text-[var(--primary)]">
                        {user.role === "ADMIN" ? "Admin" : "Ansatt"}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-[var(--muted)]">
                      {formatDateTime(user.createdAt)}
                    </td>
                    <td className="px-4 py-4">
                      <Link
                        className="text-sm font-semibold text-[var(--primary)]"
                        href={`/admin/users/${user.id}/edit`}
                      >
                        Rediger
                      </Link>
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
