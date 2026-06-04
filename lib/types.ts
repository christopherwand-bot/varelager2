export type Role = "EMPLOYEE" | "ADMIN";

export type User = {
  id: string;
  name: string;
  email: string;
  role: Role;
  passwordHash: string;
  createdAt: Date;
};

export type Category = {
  id: string;
  name: string;
  slug: string;
  createdAt: Date;
};

export type Supplier = {
  id: string;
  name: string;
  isActive: boolean;
  contactName: string | null;
  email: string | null;
  phone: string | null;
  createdAt: Date;
};

export type Product = {
  id: string;
  name: string;
  barcode: string | null;
  productType: string | null;
  unit: string;
  purchasePrice: number;
  minimumLevel: number;
  currentStock: number;
  createdAt: Date;
  updatedAt: Date;
  categoryId: string;
  supplierId: string | null;
};

export type ProductWithRelations = Product & {
  category: Category;
  supplier: Supplier | null;
};

export type InventoryCount = {
  id: string;
  quantity: number;
  countedAt: Date;
  productId: string;
  userId: string;
};

export type InventoryCountWithRelations = InventoryCount & {
  product: ProductWithRelations;
  user: Omit<User, "passwordHash">;
};

export type ImportRunStatus = "PREVIEW" | "IMPORTED";

export type ImportRun = {
  id: string;
  userId: string;
  fileName: string;
  status: ImportRunStatus;
  createdCount: number;
  updatedCount: number;
  totalRows: number;
  createdAt: Date;
  confirmedAt: Date | null;
};

export type ImportRunItem = {
  id: string;
  importRunId: string;
  rowNumber: number;
  name: string;
  categoryId: string;
  categoryName: string;
  unit: string;
  purchasePrice: number;
  minimumLevel: number;
  currentStock: number;
  supplierName: string | null;
  productType: string | null;
  action: "create" | "update";
};

export type ImportRunWithRelations = ImportRun & {
  user: Omit<User, "passwordHash">;
  items: ImportRunItem[];
};
