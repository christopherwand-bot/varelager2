import { logoutAction } from "@/app/actions/auth";
import { MobileInventoryCounter } from "@/components/mobile-inventory-counter";
import { requireUser } from "@/lib/auth";
import { getCategories, getProducts } from "@/lib/db";

export default async function EmployeePage() {
  const user = await requireUser("EMPLOYEE");

  const [categories, products] = await Promise.all([
    Promise.resolve(getCategories()),
    Promise.resolve(getProducts()),
  ]);

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col px-4 py-5 sm:px-6">
      <header className="mb-5 flex items-center justify-between gap-3">
        <div>
          <p className="text-sm text-[var(--muted)]">Ansattflate</p>
          <h1 className="display-font text-3xl font-bold">Varetelling</h1>
        </div>

        <form action={logoutAction}>
          <button className="btn-secondary px-4 py-2 text-sm font-semibold" type="submit">
            Logg ut
          </button>
        </form>
      </header>

      <MobileInventoryCounter
        categories={categories}
        products={products}
        userName={user.name}
      />
    </main>
  );
}
