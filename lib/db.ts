import { randomUUID } from "node:crypto";
import { DatabaseSync } from "node:sqlite";
import type { SQLInputValue } from "node:sqlite";
import path from "node:path";
import type {
  Category,
  ImportRunItem,
  ImportRunWithRelations,
  InventoryCountWithRelations,
  Product,
  ProductWithRelations,
  Role,
  Supplier,
  User,
} from "@/lib/types";

type ProductFilters = {
  query?: string;
  categoryId?: string;
};

type InventoryCountFilters = {
  query?: string;
  categoryId?: string;
  userId?: string;
  dateFrom?: string;
  dateTo?: string;
  limit?: number;
};

const globalForDb = globalThis as unknown as {
  db: DatabaseSync | undefined;
};

function resolveDbPath() {
  const raw = process.env.DATABASE_URL ?? "file:./dev.db";

  if (raw.startsWith("file:")) {
    return path.resolve(process.cwd(), raw.replace("file:", ""));
  }

  return path.resolve(process.cwd(), raw);
}

function getDb() {
  if (!globalForDb.db) {
    globalForDb.db = new DatabaseSync(resolveDbPath());
    globalForDb.db.exec("PRAGMA foreign_keys = ON;");
  }

  return globalForDb.db;
}

function asDate(value: string | number | Date) {
  return value instanceof Date ? value : new Date(value);
}

function mapUser(row: Record<string, unknown>): User {
  return {
    id: String(row.id),
    name: String(row.name),
    email: String(row.email),
    role: String(row.role) as Role,
    passwordHash: String(row.password_hash),
    createdAt: asDate(row.created_at as string),
  };
}

function mapCategory(row: Record<string, unknown>): Category {
  return {
    id: String(row.id),
    name: String(row.name),
    slug: String(row.slug),
    createdAt: asDate(row.created_at as string),
  };
}

function mapSupplier(row: Record<string, unknown>): Supplier {
  return {
    id: String(row.id),
    name: String(row.name),
    isActive: Boolean(row.is_active),
    contactName: (row.contact_name as string | null) ?? null,
    email: (row.email as string | null) ?? null,
    phone: (row.phone as string | null) ?? null,
    createdAt: asDate(row.created_at as string),
  };
}

function mapProduct(row: Record<string, unknown>): Product {
  return {
    id: String(row.id),
    name: String(row.name),
    barcode: (row.barcode as string | null) ?? null,
    productType: (row.product_type as string | null) ?? null,
    unit: String(row.unit),
    purchasePrice: Number(row.purchase_price),
    minimumLevel: Number(row.minimum_level),
    currentStock: Number(row.current_stock),
    createdAt: asDate(row.created_at as string),
    updatedAt: asDate(row.updated_at as string),
    categoryId: String(row.category_id),
    supplierId: (row.supplier_id as string | null) ?? null,
  };
}

export function getUserByEmail(email: string) {
  const row = getDb()
    .prepare("SELECT * FROM users WHERE email = ?")
    .get(email) as Record<string, unknown> | undefined;

  return row ? mapUser(row) : null;
}

export function getUserById(id: string) {
  const row = getDb()
    .prepare("SELECT * FROM users WHERE id = ?")
    .get(id) as Record<string, unknown> | undefined;

  return row ? mapUser(row) : null;
}

export function getUsers() {
  const rows = getDb()
    .prepare("SELECT * FROM users ORDER BY role DESC, name ASC")
    .all() as Record<string, unknown>[];

  return rows.map(mapUser);
}

export function getCategories() {
  const rows = getDb()
    .prepare("SELECT * FROM categories ORDER BY name ASC")
    .all() as Record<string, unknown>[];

  return rows.map(mapCategory);
}

export function getCategoryById(id: string) {
  const row = getDb()
    .prepare("SELECT * FROM categories WHERE id = ?")
    .get(id) as Record<string, unknown> | undefined;

  return row ? mapCategory(row) : null;
}

export function getSuppliers(options?: { includeInactive?: boolean }) {
  const where = options?.includeInactive ? "" : "WHERE is_active = 1";
  const rows = getDb()
    .prepare(`SELECT * FROM suppliers ${where} ORDER BY name ASC`)
    .all() as Record<string, unknown>[];

  return rows.map(mapSupplier);
}

export function getSupplierById(id: string) {
  const row = getDb()
    .prepare("SELECT * FROM suppliers WHERE id = ?")
    .get(id) as Record<string, unknown> | undefined;

  return row ? mapSupplier(row) : null;
}

export function getProductCountForSupplier(supplierId: string) {
  const row = getDb()
    .prepare("SELECT COUNT(*) AS count FROM products WHERE supplier_id = ?")
    .get(supplierId) as { count: number } | undefined;

  return Number(row?.count ?? 0);
}

export function getProductCountForCategory(categoryId: string) {
  const row = getDb()
    .prepare("SELECT COUNT(*) AS count FROM products WHERE category_id = ?")
    .get(categoryId) as { count: number } | undefined;

  return Number(row?.count ?? 0);
}

export function getEmployees() {
  const rows = getDb()
    .prepare("SELECT * FROM users WHERE role = 'EMPLOYEE' ORDER BY name ASC")
    .all() as Record<string, unknown>[];

  return rows.map((row) => {
    const user = mapUser(row);

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
    };
  });
}

function mapImportRunItem(row: Record<string, unknown>): ImportRunItem {
  return {
    id: String(row.id),
    importRunId: String(row.import_run_id),
    rowNumber: Number(row.row_number),
    name: String(row.name),
    categoryId: String(row.category_id),
    categoryName: String(row.category_name),
    unit: String(row.unit),
    purchasePrice: Number(row.purchase_price),
    minimumLevel: Number(row.minimum_level),
    currentStock: Number(row.current_stock),
    supplierName: (row.supplier_name as string | null) ?? null,
    productType: (row.product_type as string | null) ?? null,
    action: String(row.action) as "create" | "update",
  };
}

export function getProducts(filters?: ProductFilters) {
  const clauses: string[] = [];
  const values: SQLInputValue[] = [];

  if (filters?.categoryId && filters.categoryId !== "all") {
    clauses.push("p.category_id = ?");
    values.push(filters.categoryId);
  }

  if (filters?.query) {
    clauses.push("(p.name LIKE ? OR IFNULL(p.barcode, '') LIKE ? OR IFNULL(p.product_type, '') LIKE ? OR IFNULL(s.name, '') LIKE ?)");
    const wildcard = `%${filters.query}%`;
    values.push(wildcard, wildcard, wildcard, wildcard);
  }

  const where = clauses.length > 0 ? `WHERE ${clauses.join(" AND ")}` : "";

  const rows = getDb()
    .prepare(
      `
        SELECT
          p.*,
          c.id AS category_ref_id,
          c.name AS category_name,
          c.slug AS category_slug,
          c.created_at AS category_created_at,
          s.id AS supplier_ref_id,
          s.name AS supplier_name,
          s.contact_name AS supplier_contact_name,
          s.email AS supplier_email,
          s.phone AS supplier_phone,
          s.created_at AS supplier_created_at
        FROM products p
        JOIN categories c ON c.id = p.category_id
        LEFT JOIN suppliers s ON s.id = p.supplier_id
        ${where}
        ORDER BY p.current_stock ASC, p.name ASC
      `
    )
    .all(...values) as Record<string, unknown>[];

  return rows.map(
    (row) =>
      ({
        ...mapProduct(row),
        category: {
          id: String(row.category_ref_id),
          name: String(row.category_name),
          slug: String(row.category_slug),
          createdAt: asDate(row.category_created_at as string),
        },
        supplier: row.supplier_ref_id
          ? {
              id: String(row.supplier_ref_id),
              name: String(row.supplier_name),
              contactName: (row.supplier_contact_name as string | null) ?? null,
              email: (row.supplier_email as string | null) ?? null,
              phone: (row.supplier_phone as string | null) ?? null,
              createdAt: asDate(row.supplier_created_at as string),
            }
          : null,
      }) as ProductWithRelations
  );
}

export function getProductById(id: string) {
  return getProducts().find((product) => product.id === id) ?? null;
}

export function getProductByName(name: string) {
  const row = getDb()
    .prepare("SELECT * FROM products WHERE lower(name) = lower(?)")
    .get(name) as Record<string, unknown> | undefined;

  return row ? mapProduct(row) : null;
}

export function getProductByBarcode(barcode: string) {
  const normalized = barcode.trim();

  if (!normalized) {
    return null;
  }

  const row = getDb()
    .prepare("SELECT * FROM products WHERE barcode = ?")
    .get(normalized) as Record<string, unknown> | undefined;

  return row ? mapProduct(row) : null;
}

export function getInventoryCounts(filters?: InventoryCountFilters) {
  const clauses: string[] = [];
  const values: SQLInputValue[] = [];

  if (filters?.categoryId && filters.categoryId !== "all") {
    clauses.push("p.category_id = ?");
    values.push(filters.categoryId);
  }

  if (filters?.userId && filters.userId !== "all") {
    clauses.push("ic.user_id = ?");
    values.push(filters.userId);
  }

  if (filters?.query) {
    const wildcard = `%${filters.query}%`;
    clauses.push(
      "(p.name LIKE ? OR IFNULL(p.barcode, '') LIKE ? OR IFNULL(p.product_type, '') LIKE ? OR u.name LIKE ?)"
    );
    values.push(wildcard, wildcard, wildcard, wildcard);
  }

  if (filters?.dateFrom) {
    clauses.push("date(ic.counted_at) >= date(?)");
    values.push(filters.dateFrom);
  }

  if (filters?.dateTo) {
    clauses.push("date(ic.counted_at) <= date(?)");
    values.push(filters.dateTo);
  }

  const where = clauses.length > 0 ? `WHERE ${clauses.join(" AND ")}` : "";
  const limitClause =
    typeof filters?.limit === "number" ? "LIMIT ?" : "";

  if (typeof filters?.limit === "number") {
    values.push(filters.limit);
  }

  const rows = getDb()
    .prepare(
      `
        SELECT
          ic.*,
          p.name AS product_name,
          p.barcode AS product_barcode,
          p.product_type AS product_type,
          p.unit AS product_unit,
          p.purchase_price AS product_purchase_price,
          p.minimum_level AS product_minimum_level,
          p.current_stock AS product_current_stock,
          p.created_at AS product_created_at,
          p.updated_at AS product_updated_at,
          p.category_id AS product_category_id,
          p.supplier_id AS product_supplier_id,
          c.id AS category_ref_id,
          c.name AS category_name,
          c.slug AS category_slug,
          c.created_at AS category_created_at,
          s.id AS supplier_ref_id,
          s.name AS supplier_name,
          s.contact_name AS supplier_contact_name,
          s.email AS supplier_email,
          s.phone AS supplier_phone,
          s.created_at AS supplier_created_at,
          u.name AS user_name,
          u.email AS user_email,
          u.role AS user_role,
          u.created_at AS user_created_at
        FROM inventory_counts ic
        JOIN products p ON p.id = ic.product_id
        JOIN categories c ON c.id = p.category_id
        LEFT JOIN suppliers s ON s.id = p.supplier_id
        JOIN users u ON u.id = ic.user_id
        ${where}
        ORDER BY ic.counted_at DESC
        ${limitClause}
      `
    )
    .all(...values) as Record<string, unknown>[];

  return rows.map(
    (row) =>
      ({
        id: String(row.id),
        quantity: Number(row.quantity),
        countedAt: asDate(row.counted_at as string),
        productId: String(row.product_id),
        userId: String(row.user_id),
        product: {
          id: String(row.product_id),
          name: String(row.product_name),
          barcode: (row.product_barcode as string | null) ?? null,
          productType: (row.product_type as string | null) ?? null,
          unit: String(row.product_unit),
          purchasePrice: Number(row.product_purchase_price),
          minimumLevel: Number(row.product_minimum_level),
          currentStock: Number(row.product_current_stock),
          createdAt: asDate(row.product_created_at as string),
          updatedAt: asDate(row.product_updated_at as string),
          categoryId: String(row.product_category_id),
          supplierId: (row.product_supplier_id as string | null) ?? null,
          category: {
            id: String(row.category_ref_id),
            name: String(row.category_name),
            slug: String(row.category_slug),
            createdAt: asDate(row.category_created_at as string),
          },
          supplier: row.supplier_ref_id
            ? {
                id: String(row.supplier_ref_id),
                name: String(row.supplier_name),
                contactName: (row.supplier_contact_name as string | null) ?? null,
                email: (row.supplier_email as string | null) ?? null,
                phone: (row.supplier_phone as string | null) ?? null,
                createdAt: asDate(row.supplier_created_at as string),
              }
            : null,
        },
        user: {
          id: String(row.user_id),
          name: String(row.user_name),
          email: String(row.user_email),
          role: String(row.user_role) as Role,
          createdAt: asDate(row.user_created_at as string),
        },
      }) as InventoryCountWithRelations
  );
}

export function getRecentCounts(limit = 8) {
  return getInventoryCounts({ limit });
}

export function createProduct(input: {
  name: string;
  barcode?: string | null;
  categoryId: string;
  unit: string;
  purchasePrice: number;
  minimumLevel: number;
  currentStock: number;
  supplierId?: string | null;
  productType?: string | null;
}) {
  const id = randomUUID();

  getDb()
    .prepare(
      `
        INSERT INTO products (
          id, name, barcode, product_type, unit, purchase_price, minimum_level,
          current_stock, category_id, supplier_id, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      `
    )
    .run(
      id,
      input.name,
      input.barcode ?? null,
      input.productType ?? null,
      input.unit,
      input.purchasePrice,
      input.minimumLevel,
      input.currentStock,
      input.categoryId,
      input.supplierId ?? null
    );

  return id;
}

function getOrCreateSupplierId(db: DatabaseSync, supplierName?: string | null) {
  if (!supplierName) {
    return null;
  }

  const normalized = supplierName.trim();

  if (!normalized) {
    return null;
  }

  const existing = db
    .prepare("SELECT id FROM suppliers WHERE lower(name) = lower(?)")
    .get(normalized) as { id: string } | undefined;

  if (existing?.id) {
    return existing.id;
  }

  const supplierId = randomUUID();

  db.prepare(
    `
        INSERT INTO suppliers (id, name, created_at)
        VALUES (?, ?, CURRENT_TIMESTAMP)
      `
  ).run(supplierId, normalized);

  return supplierId;
}

export function createSupplier(input: {
  name: string;
  contactName?: string | null;
  email?: string | null;
  phone?: string | null;
}) {
  const id = randomUUID();

  getDb()
    .prepare(
      `
        INSERT INTO suppliers (id, name, contact_name, email, phone, created_at)
        VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      `
    )
    .run(
      id,
      input.name,
      input.contactName ?? null,
      input.email ?? null,
      input.phone ?? null
    );

  return id;
}

export function createCategory(input: { name: string; slug: string }) {
  const id = randomUUID();

  getDb()
    .prepare(
      `
        INSERT INTO categories (id, name, slug, created_at)
        VALUES (?, ?, ?, CURRENT_TIMESTAMP)
      `
    )
    .run(id, input.name, input.slug);

  return id;
}

export function updateCategory(
  categoryId: string,
  input: { name: string; slug: string }
) {
  getDb()
    .prepare(
      `
        UPDATE categories
        SET name = ?, slug = ?
        WHERE id = ?
      `
    )
    .run(input.name, input.slug, categoryId);
}

export function updateSupplier(
  supplierId: string,
  input: {
    name: string;
    contactName?: string | null;
    email?: string | null;
    phone?: string | null;
  }
) {
  getDb()
    .prepare(
      `
        UPDATE suppliers
        SET name = ?, contact_name = ?, email = ?, phone = ?
        WHERE id = ?
      `
    )
    .run(
      input.name,
      input.contactName ?? null,
      input.email ?? null,
      input.phone ?? null,
      supplierId
    );
}

export function createUser(input: {
  name: string;
  email: string;
  passwordHash: string;
  role: Role;
}) {
  const id = randomUUID();

  getDb()
    .prepare(
      `
        INSERT INTO users (id, name, email, password_hash, role, created_at)
        VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      `
    )
    .run(id, input.name, input.email, input.passwordHash, input.role);

  return id;
}

export function updateUser(
  userId: string,
  input: {
    name: string;
    email: string;
    role: Role;
    passwordHash?: string;
  }
) {
  if (input.passwordHash) {
    getDb()
      .prepare(
        `
          UPDATE users
          SET name = ?, email = ?, role = ?, password_hash = ?
          WHERE id = ?
        `
      )
      .run(input.name, input.email, input.role, input.passwordHash, userId);

    return;
  }

  getDb()
    .prepare(
      `
        UPDATE users
        SET name = ?, email = ?, role = ?
        WHERE id = ?
      `
    )
    .run(input.name, input.email, input.role, userId);
}

export function deleteSupplier(supplierId: string) {
  getDb().prepare("DELETE FROM suppliers WHERE id = ?").run(supplierId);
}

export function setSupplierActiveState(supplierId: string, isActive: boolean) {
  getDb()
    .prepare("UPDATE suppliers SET is_active = ? WHERE id = ?")
    .run(isActive ? 1 : 0, supplierId);
}

export function updateProduct(
  productId: string,
  input: {
    name: string;
    barcode?: string | null;
    categoryId: string;
    unit: string;
    purchasePrice: number;
    minimumLevel: number;
    currentStock: number;
    supplierId?: string | null;
    productType?: string | null;
  }
) {
  getDb()
    .prepare(
      `
        UPDATE products
        SET
          name = ?,
          barcode = ?,
          product_type = ?,
          unit = ?,
          purchase_price = ?,
          minimum_level = ?,
          current_stock = ?,
          category_id = ?,
          supplier_id = ?,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `
    )
    .run(
      input.name,
      input.barcode ?? null,
      input.productType ?? null,
      input.unit,
      input.purchasePrice,
      input.minimumLevel,
      input.currentStock,
      input.categoryId,
      input.supplierId ?? null,
      productId
    );
}

export function importProducts(
  items: Array<{
    name: string;
    barcode?: string | null;
    categoryId: string;
    unit: string;
    purchasePrice: number;
    minimumLevel: number;
    currentStock: number;
    supplierName?: string | null;
    productType?: string | null;
  }>
) {
  const db = getDb();
  let created = 0;
  let updated = 0;

  db.exec("BEGIN");

  try {
    for (const item of items) {
      const supplierId = getOrCreateSupplierId(db, item.supplierName);
      const existing = db
        .prepare("SELECT id FROM products WHERE lower(name) = lower(?)")
        .get(item.name) as { id: string } | undefined;

      if (existing?.id) {
        db.prepare(
          `
            UPDATE products
            SET
              product_type = ?,
              barcode = ?,
              unit = ?,
              purchase_price = ?,
              minimum_level = ?,
              current_stock = ?,
              category_id = ?,
              supplier_id = ?,
              updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
          `
        ).run(
          item.productType ?? null,
          item.barcode ?? null,
          item.unit,
          item.purchasePrice,
          item.minimumLevel,
          item.currentStock,
          item.categoryId,
          supplierId,
          existing.id
        );
        updated += 1;
      } else {
        db.prepare(
          `
            INSERT INTO products (
              id, name, barcode, product_type, unit, purchase_price, minimum_level,
              current_stock, category_id, supplier_id, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
          `
        ).run(
          randomUUID(),
          item.name,
          item.barcode ?? null,
          item.productType ?? null,
          item.unit,
          item.purchasePrice,
          item.minimumLevel,
          item.currentStock,
          item.categoryId,
          supplierId
        );
        created += 1;
      }
    }

    db.exec("COMMIT");

    return { created, updated };
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }
}

export function createImportPreview(
  userId: string,
  fileName: string,
  items: Array<{
    rowNumber: number;
    name: string;
    categoryId: string;
    categoryName: string;
    unit: string;
    purchasePrice: number;
    minimumLevel: number;
    currentStock: number;
    supplierName?: string | null;
    productType?: string | null;
    action: "create" | "update";
  }>
) {
  const db = getDb();
  const importRunId = randomUUID();
  const createdCount = items.filter((item) => item.action === "create").length;
  const updatedCount = items.filter((item) => item.action === "update").length;

  db.exec("BEGIN");

  try {
    db.prepare(
      `
        INSERT INTO import_runs (
          id, user_id, file_name, status, created_count, updated_count, total_rows, created_at
        ) VALUES (?, ?, ?, 'PREVIEW', ?, ?, ?, CURRENT_TIMESTAMP)
      `
    ).run(importRunId, userId, fileName, createdCount, updatedCount, items.length);

    const insertItem = db.prepare(
      `
        INSERT INTO import_run_items (
          id, import_run_id, row_number, name, category_id, category_name, unit,
          purchase_price, minimum_level, current_stock, supplier_name, product_type, action
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `
    );

    for (const item of items) {
      insertItem.run(
        randomUUID(),
        importRunId,
        item.rowNumber,
        item.name,
        item.categoryId,
        item.categoryName,
        item.unit,
        item.purchasePrice,
        item.minimumLevel,
        item.currentStock,
        item.supplierName ?? null,
        item.productType ?? null,
        item.action
      );
    }

    db.exec("COMMIT");
    return importRunId;
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }
}

export function getImportRunById(importRunId: string) {
  const db = getDb();
  const runRow = db
    .prepare(
      `
        SELECT
          ir.*,
          u.name AS user_name,
          u.email AS user_email,
          u.role AS user_role,
          u.created_at AS user_created_at
        FROM import_runs ir
        JOIN users u ON u.id = ir.user_id
        WHERE ir.id = ?
      `
    )
    .get(importRunId) as Record<string, unknown> | undefined;

  if (!runRow) {
    return null;
  }

  const itemRows = db
    .prepare(
      `
        SELECT *
        FROM import_run_items
        WHERE import_run_id = ?
        ORDER BY row_number ASC
      `
    )
    .all(importRunId) as Record<string, unknown>[];

  return {
    id: String(runRow.id),
    userId: String(runRow.user_id),
    fileName: String(runRow.file_name),
    status: String(runRow.status) as "PREVIEW" | "IMPORTED",
    createdCount: Number(runRow.created_count),
    updatedCount: Number(runRow.updated_count),
    totalRows: Number(runRow.total_rows),
    createdAt: asDate(runRow.created_at as string),
    confirmedAt: runRow.confirmed_at ? asDate(runRow.confirmed_at as string) : null,
    user: {
      id: String(runRow.user_id),
      name: String(runRow.user_name),
      email: String(runRow.user_email),
      role: String(runRow.user_role) as Role,
      createdAt: asDate(runRow.user_created_at as string),
    },
    items: itemRows.map(mapImportRunItem),
  } as ImportRunWithRelations;
}

export function confirmImportRun(importRunId: string, userId: string) {
  const db = getDb();
  const run = getImportRunById(importRunId);

  if (!run || run.userId !== userId || run.status !== "PREVIEW") {
    return null;
  }

  db.exec("BEGIN");

  try {
    for (const item of run.items) {
      const supplierId = getOrCreateSupplierId(db, item.supplierName);
      const existing = db
        .prepare("SELECT id FROM products WHERE lower(name) = lower(?)")
        .get(item.name) as { id: string } | undefined;

      if (existing?.id) {
        db.prepare(
          `
        UPDATE products
        SET
          product_type = ?,
          barcode = ?,
          unit = ?,
              purchase_price = ?,
              minimum_level = ?,
              current_stock = ?,
              category_id = ?,
              supplier_id = ?,
              updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
          `
        ).run(
          item.productType ?? null,
          null,
          item.unit,
          item.purchasePrice,
          item.minimumLevel,
          item.currentStock,
          item.categoryId,
          supplierId,
          existing.id
        );
      } else {
        db.prepare(
          `
            INSERT INTO products (
              id, name, barcode, product_type, unit, purchase_price, minimum_level,
              current_stock, category_id, supplier_id, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
          `
        ).run(
          randomUUID(),
          item.name,
          null,
          item.productType ?? null,
          item.unit,
          item.purchasePrice,
          item.minimumLevel,
          item.currentStock,
          item.categoryId,
          supplierId
        );
      }
    }

    db.prepare(
      `
        UPDATE import_runs
        SET status = 'IMPORTED', confirmed_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `
    ).run(importRunId);

    db.exec("COMMIT");

    return getImportRunById(importRunId);
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }
}

export function getRecentImportRuns(limit = 8) {
  const db = getDb();
  const rows = db
    .prepare(
      `
        SELECT
          ir.*,
          u.name AS user_name,
          u.email AS user_email,
          u.role AS user_role,
          u.created_at AS user_created_at
        FROM import_runs ir
        JOIN users u ON u.id = ir.user_id
        ORDER BY ir.created_at DESC
        LIMIT ?
      `
    )
    .all(limit) as Record<string, unknown>[];

  return rows.map((row) => ({
    id: String(row.id),
    userId: String(row.user_id),
    fileName: String(row.file_name),
    status: String(row.status) as "PREVIEW" | "IMPORTED",
    createdCount: Number(row.created_count),
    updatedCount: Number(row.updated_count),
    totalRows: Number(row.total_rows),
    createdAt: asDate(row.created_at as string),
    confirmedAt: row.confirmed_at ? asDate(row.confirmed_at as string) : null,
    user: {
      id: String(row.user_id),
      name: String(row.user_name),
      email: String(row.user_email),
      role: String(row.user_role) as Role,
      createdAt: asDate(row.user_created_at as string),
    },
    items: [],
  })) as ImportRunWithRelations[];
}

export function saveInventoryCount(input: {
  productId: string;
  userId: string;
  quantity: number;
}) {
  const db = getDb();

  db.exec("BEGIN");

  try {
    db.prepare(
      `
        INSERT INTO inventory_counts (id, quantity, counted_at, product_id, user_id)
        VALUES (?, ?, CURRENT_TIMESTAMP, ?, ?)
      `
    ).run(randomUUID(), input.quantity, input.productId, input.userId);

    db.prepare(
      `
        UPDATE products
        SET current_stock = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `
    ).run(input.quantity, input.productId);

    db.exec("COMMIT");
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }
}
