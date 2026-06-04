import Link from "next/link";
import type { ReactNode } from "react";
import { Boxes, ClipboardList, ShieldCheck } from "lucide-react";

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-6 py-8 sm:px-10 lg:px-12">
      <section className="card relative overflow-hidden rounded-[2rem] px-6 py-10 sm:px-10 sm:py-14">
        <div className="absolute right-0 top-0 h-48 w-48 rounded-full bg-[rgba(215,122,54,0.18)] blur-3xl" />
        <div className="absolute bottom-0 left-10 h-40 w-40 rounded-full bg-[rgba(35,83,71,0.14)] blur-3xl" />
        <div className="relative grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
          <div className="space-y-6">
            <div className="pill w-fit bg-[var(--primary-soft)] text-[var(--primary)]">
              <Boxes size={16} />
              Lagerflyt for ansatte og admin
            </div>
            <div className="space-y-4">
              <h1 className="display-font max-w-3xl text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
                Enkel varetelling på mobil. Klar lageroversikt på kontoret.
              </h1>
              <p className="max-w-2xl text-base leading-7 text-[var(--muted)] sm:text-lg">
                En samlet løsning for raske opptellinger, lav beholdning-varsler,
                produktregister og historikk. Bygget for ansatte som trenger fart,
                og admin som trenger kontroll.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link className="btn-primary px-6 py-3 font-semibold" href="/login?next=/employee">
                Ansattinnlogging
              </Link>
              <Link className="btn-secondary px-6 py-3 font-semibold" href="/login?next=/admin">
                Admin-dashboard
              </Link>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <FeatureCard
              icon={<ClipboardList className="text-[var(--primary)]" size={22} />}
              title="Rask telling"
              text="Finn varer via søk, kategori eller type og lagre antall på sekunder."
            />
            <FeatureCard
              icon={<ShieldCheck className="text-[var(--accent)]" size={22} />}
              title="Rollebasert tilgang"
              text="Ansatte teller varer, admin styrer priser, kategorier og lagerstatus."
            />
            <FeatureCard
              icon={<Boxes className="text-[var(--primary)]" size={22} />}
              title="Lagerverdi"
              text="Se beholdning, verdi per vare, totalverdi og hvilke varer som må fylles på."
            />
            <FeatureCard
              icon={<ClipboardList className="text-[var(--accent)]" size={22} />}
              title="Historikk"
              text="Hver telling lagres med tidspunkt, produkt, antall og hvem som telte."
            />
          </div>
        </div>
      </section>
    </main>
  );
}

function FeatureCard({
  icon,
  title,
  text,
}: {
  icon: ReactNode;
  title: string;
  text: string;
}) {
  return (
    <div className="card rounded-[1.75rem] p-5">
      <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-white/80">
        {icon}
      </div>
      <h2 className="mb-2 text-lg font-semibold">{title}</h2>
      <p className="text-sm leading-6 text-[var(--muted)]">{text}</p>
    </div>
  );
}
