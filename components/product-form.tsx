"use client";

import type { InputHTMLAttributes } from "react";
import { useActionState } from "react";
import type { ProductFormState } from "@/app/actions/products";
import { SubmitButton } from "@/components/submit-button";
import type { Category, Product, Supplier } from "@/lib/types";

type ProductWithRelations = Product & {
  supplier: Supplier | null;
};

type ProductFormProps = {
  action: (
    state: ProductFormState,
    formData: FormData
  ) => Promise<ProductFormState>;
  categories: Category[];
  suppliers: Supplier[];
  product?: ProductWithRelations;
};

const initialState: ProductFormState = {
  success: false,
};

export function ProductForm({
  action,
  categories,
  suppliers,
  product,
}: ProductFormProps) {
  const [state, formAction] = useActionState(action, initialState);

  return (
    <form action={formAction} className="card rounded-[2rem] p-6 sm:p-8">
      <div className="mb-6 grid gap-4 sm:grid-cols-2">
        <Field label="Varenavn" name="name" defaultValue={product?.name} />
        <Field label="Strekkode" name="barcode" defaultValue={product?.barcode ?? ""} placeholder="EAN / intern kode" />
        <Field label="Type vare" name="productType" defaultValue={product?.productType ?? ""} />
        <SelectField
          label="Kategori"
          name="categoryId"
          defaultValue={product?.categoryId}
          options={categories.map((category) => ({
            label: category.name,
            value: category.id,
          }))}
        />
        <Field label="Enhet" name="unit" defaultValue={product?.unit} placeholder="stk, kg, liter, pakke" />
        <Field
          label="Innkjøpspris per enhet"
          name="purchasePrice"
          defaultValue={product?.purchasePrice.toString()}
          inputMode="decimal"
          step="0.01"
          type="number"
        />
        <Field
          label="Minimumsnivå på lager"
          name="minimumLevel"
          defaultValue={product?.minimumLevel.toString()}
          inputMode="decimal"
          step="0.01"
          type="number"
        />
        <Field
          label="Nåværende lagerbeholdning"
          name="currentStock"
          defaultValue={product?.currentStock.toString()}
          inputMode="decimal"
          step="0.01"
          type="number"
        />
        <SelectField
          label="Leverandør"
          name="supplierId"
          defaultValue={product?.supplierId ?? ""}
          options={[
            { label: "Ingen leverandør valgt", value: "" },
            ...suppliers.map((supplier) => ({
              label: supplier.name,
              value: supplier.id,
            })),
          ]}
        />
      </div>

      {state.message ? (
        <p className="mb-4 rounded-2xl bg-[var(--danger-soft)] px-4 py-3 text-sm text-[var(--danger)]">
          {state.message}
        </p>
      ) : null}

      <SubmitButton
        className="sm:w-auto sm:px-6"
        label={product ? "Oppdater vare" : "Opprett vare"}
        pendingLabel={product ? "Oppdaterer..." : "Oppretter..."}
      />
    </form>
  );
}

function Field({
  label,
  name,
  defaultValue,
  placeholder,
  inputMode,
  step,
  type = "text",
}: {
  label: string;
  name: string;
  defaultValue?: string;
  placeholder?: string;
  inputMode?: InputHTMLAttributes<HTMLInputElement>["inputMode"];
  step?: string;
  type?: string;
}) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-semibold" htmlFor={name}>
        {label}
      </label>
      <input
        className="field"
        defaultValue={defaultValue}
        id={name}
        inputMode={inputMode}
        name={name}
        placeholder={placeholder}
        step={step}
        type={type}
      />
    </div>
  );
}

function SelectField({
  label,
  name,
  defaultValue,
  options,
}: {
  label: string;
  name: string;
  defaultValue?: string;
  options: Array<{ label: string; value: string }>;
}) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-semibold" htmlFor={name}>
        {label}
      </label>
      <select className="field" defaultValue={defaultValue} id={name} name={name}>
        {options.map((option) => (
          <option key={`${name}-${option.value}`} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}
