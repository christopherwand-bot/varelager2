import Link from "next/link";
import { Boxes } from "lucide-react";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/login-form";
import { getCurrentUser } from "@/lib/auth";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const [user, params] = await Promise.all([getCurrentUser(), searchParams]);

  if (user) {
    redirect(user.role === "ADMIN" ? "/admin" : "/employee");
  }

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 items-center px-6 py-10 sm:px-10">
      <div className="grid w-full gap-6 lg:grid-cols-[1fr_480px]">
        <section className="card rounded-[2rem] p-8 sm:p-10">
          <div className="pill mb-5 w-fit bg-[var(--primary-soft)] text-[var(--primary)]">
            <Boxes size={16} />
            Lagerflyt
          </div>
          <h1 className="display-font max-w-xl text-4xl font-bold tracking-tight">
            Logg inn for å telle varer eller administrere lageret.
          </h1>
          <p className="mt-4 max-w-xl text-base leading-7 text-[var(--muted)]">
            Første versjon er satt opp med en enkel rollemodell og seedede testbrukere,
            slik at dere raskt kan prøve både ansattflyten og admin-dashboardet.
          </p>

          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <div className="rounded-[1.6rem] bg-white/70 p-5">
              <p className="text-sm font-semibold text-[var(--muted)]">Ansatt</p>
              <p className="mt-2 text-sm leading-6">
                Tell varer fra mobilen med søk, kategorier og enkel registrering.
              </p>
            </div>
            <div className="rounded-[1.6rem] bg-white/70 p-5">
              <p className="text-sm font-semibold text-[var(--muted)]">Admin</p>
              <p className="mt-2 text-sm leading-6">
                Se lagerstatus, verdi, lav beholdning og historikk i ett dashboard.
              </p>
            </div>
          </div>
        </section>

        <section className="card rounded-[2rem] p-8 sm:p-10">
          <h2 className="display-font text-2xl font-bold">Innlogging</h2>
          <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
            Seedede testbrukere står forklart i README.
          </p>

          <div className="mt-6">
            <LoginForm next={params.next} />
          </div>

          <Link className="mt-6 inline-flex text-sm font-semibold text-[var(--primary)]" href="/">
            Tilbake til forsiden
          </Link>
        </section>
      </div>
    </main>
  );
}
