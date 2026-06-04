import { clsx } from "clsx";

export function cn(...values: Array<string | false | null | undefined>) {
  return clsx(values);
}

export function formatCurrency(value: number) {
  return new Intl.NumberFormat("nb-NO", {
    style: "currency",
    currency: "NOK",
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatDateTime(value: Date) {
  return new Intl.DateTimeFormat("nb-NO", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(value);
}

export function formatQuantity(value: number) {
  return new Intl.NumberFormat("nb-NO", {
    maximumFractionDigits: 2,
  }).format(value);
}
