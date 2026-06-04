import type { ProductWithRelations, Supplier } from "@/lib/types";

export type LowStockReportItem = {
  product: ProductWithRelations;
  shortage: number;
  suggestedOrderQuantity: number;
  estimatedCost: number;
  supplierLabel: string;
};

export type LowStockSupplierGroup = {
  supplier: Supplier | null;
  supplierLabel: string;
  totalEstimatedCost: number;
  totalItems: number;
  items: LowStockReportItem[];
};

export function getLowStockReport(products: ProductWithRelations[]) {
  const items = products
    .filter((product) => product.currentStock <= product.minimumLevel)
    .map((product) => {
      const shortage = Math.max(product.minimumLevel - product.currentStock, 0);
      const suggestedOrderQuantity = shortage;
      const estimatedCost = suggestedOrderQuantity * product.purchasePrice;

      return {
        product,
        shortage,
        suggestedOrderQuantity,
        estimatedCost,
        supplierLabel: product.supplier?.name ?? "Uten leverandør",
      };
    })
    .sort((left, right) => {
      if (right.shortage !== left.shortage) {
        return right.shortage - left.shortage;
      }

      return left.product.name.localeCompare(right.product.name, "nb-NO");
    });

  const summary = items.reduce(
    (accumulator, item) => ({
      totalItems: accumulator.totalItems + 1,
      totalShortage: accumulator.totalShortage + item.shortage,
      totalEstimatedCost: accumulator.totalEstimatedCost + item.estimatedCost,
    }),
    { totalItems: 0, totalShortage: 0, totalEstimatedCost: 0 }
  );

  const supplierGroups = Array.from(
    items.reduce((groups, item) => {
      const existing = groups.get(item.supplierLabel);

      if (existing) {
        existing.items.push(item);
        existing.totalEstimatedCost += item.estimatedCost;
        existing.totalItems += 1;
      } else {
        groups.set(item.supplierLabel, {
          supplier: item.product.supplier,
          supplierLabel: item.supplierLabel,
          totalEstimatedCost: item.estimatedCost,
          totalItems: 1,
          items: [item],
        });
      }

      return groups;
    }, new Map<string, LowStockSupplierGroup>())
  )
    .map(([, group]) => group)
    .sort((left, right) => {
      if (right.totalEstimatedCost !== left.totalEstimatedCost) {
        return right.totalEstimatedCost - left.totalEstimatedCost;
      }

      return left.supplierLabel.localeCompare(right.supplierLabel, "nb-NO");
    });

  return {
    items,
    supplierGroups,
    summary,
  };
}
