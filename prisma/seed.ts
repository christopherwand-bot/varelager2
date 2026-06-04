import bcrypt from "bcryptjs";
import { randomUUID } from "node:crypto";
import { DatabaseSync } from "node:sqlite";
import type { SQLInputValue } from "node:sqlite";
import path from "node:path";

const databaseUrl = process.env.DATABASE_URL ?? "file:./dev.db";
const dbPath = path.resolve(process.cwd(), databaseUrl.replace("file:", ""));
const db = new DatabaseSync(dbPath);

function run(sql: string, ...values: SQLInputValue[]) {
  db.prepare(sql).run(...values);
}

async function main() {
  db.exec("PRAGMA foreign_keys = ON;");

  run("DELETE FROM inventory_counts");
  run("DELETE FROM products");
  run("DELETE FROM suppliers");
  run("DELETE FROM categories");
  run("DELETE FROM users");

  const categoryIds = {
    emballasje: randomUUID(),
    mat: randomUUID(),
    forbruksmateriell: randomUUID(),
  };

  run(
    "INSERT INTO categories (id, name, slug) VALUES (?, ?, ?)",
    categoryIds.emballasje,
    "Emballasje",
    "emballasje"
  );
  run(
    "INSERT INTO categories (id, name, slug) VALUES (?, ?, ?)",
    categoryIds.mat,
    "Mat",
    "mat"
  );
  run(
    "INSERT INTO categories (id, name, slug) VALUES (?, ?, ?)",
    categoryIds.forbruksmateriell,
    "Forbruksmateriell",
    "forbruksmateriell"
  );

  const supplierIds = {
    nordicPack: randomUUID(),
    freshFoods: randomUUID(),
    cleanSupply: randomUUID(),
  };

  run(
    `
      INSERT INTO suppliers (id, name, contact_name, email, phone)
      VALUES (?, ?, ?, ?, ?)
    `,
    supplierIds.nordicPack,
    "Nordic Pack AS",
    "Lena Berg",
    "ordre@nordicpack.no",
    "+47 21 21 21 21"
  );
  run(
    `
      INSERT INTO suppliers (id, name, contact_name, email)
      VALUES (?, ?, ?, ?)
    `,
    supplierIds.freshFoods,
    "Fresh Foods Norge",
    "Eirik Halvorsen",
    "bestilling@freshfoods.no"
  );
  run(
    `
      INSERT INTO suppliers (id, name, contact_name, email)
      VALUES (?, ?, ?, ?)
    `,
    supplierIds.cleanSupply,
    "Clean Supply",
    "Nora Kvale",
    "kundeservice@cleansupply.no"
  );

  const adminId = randomUUID();
  const employeeId = randomUUID();
  const adminPassword = await bcrypt.hash("Admin123!", 10);
  const employeePassword = await bcrypt.hash("Ansatt123!", 10);

  run(
    `
      INSERT INTO users (id, name, email, password_hash, role)
      VALUES (?, ?, ?, ?, ?)
    `,
    adminId,
    "Mia Admin",
    "admin@lagerflyt.no",
    adminPassword,
    "ADMIN"
  );
  run(
    `
      INSERT INTO users (id, name, email, password_hash, role)
      VALUES (?, ?, ?, ?, ?)
    `,
    employeeId,
    "Ola Ansatt",
    "ansatt@lagerflyt.no",
    employeePassword,
    "EMPLOYEE"
  );

  const products = [
    {
      id: randomUUID(),
      name: "Pappkrus 2 dl",
      barcode: "5701000000011",
      productType: "Kopper",
      unit: "pakke",
      purchasePrice: 39.9,
      currentStock: 18,
      minimumLevel: 10,
      categoryId: categoryIds.emballasje,
      supplierId: supplierIds.nordicPack,
    },
    {
      id: randomUUID(),
      name: "Takeaway-boks medium",
      barcode: "5701000000012",
      productType: "Beholdere",
      unit: "stk",
      purchasePrice: 4.5,
      currentStock: 75,
      minimumLevel: 40,
      categoryId: categoryIds.emballasje,
      supplierId: supplierIds.nordicPack,
    },
    {
      id: randomUUID(),
      name: "Espressobonner",
      barcode: "5701000000013",
      productType: "Kaffe",
      unit: "kg",
      purchasePrice: 189,
      currentStock: 6,
      minimumLevel: 8,
      categoryId: categoryIds.mat,
      supplierId: supplierIds.freshFoods,
    },
    {
      id: randomUUID(),
      name: "Havremelk",
      barcode: "5701000000014",
      productType: "Drikke",
      unit: "liter",
      purchasePrice: 24.9,
      currentStock: 14,
      minimumLevel: 12,
      categoryId: categoryIds.mat,
      supplierId: supplierIds.freshFoods,
    },
    {
      id: randomUUID(),
      name: "Engangshansker",
      barcode: "5701000000015",
      productType: "Hygiene",
      unit: "pakke",
      purchasePrice: 59,
      currentStock: 9,
      minimumLevel: 12,
      categoryId: categoryIds.forbruksmateriell,
      supplierId: supplierIds.cleanSupply,
    },
    {
      id: randomUUID(),
      name: "Overflatespray",
      barcode: "5701000000016",
      productType: "Rengjoring",
      unit: "flaske",
      purchasePrice: 72.5,
      currentStock: 11,
      minimumLevel: 6,
      categoryId: categoryIds.forbruksmateriell,
      supplierId: supplierIds.cleanSupply,
    },
  ];

  for (const product of products) {
    run(
      `
        INSERT INTO products (
          id, name, barcode, product_type, unit, purchase_price, minimum_level,
          current_stock, category_id, supplier_id
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      product.id,
      product.name,
      product.barcode,
      product.productType,
      product.unit,
      product.purchasePrice,
      product.minimumLevel,
      product.currentStock,
      product.categoryId,
      product.supplierId
    );
  }

  run(
    `
      INSERT INTO inventory_counts (id, quantity, counted_at, product_id, user_id)
      VALUES (?, ?, datetime('now', '-90 minutes'), ?, ?)
    `,
    randomUUID(),
    18,
    products[0].id,
    employeeId
  );
  run(
    `
      INSERT INTO inventory_counts (id, quantity, counted_at, product_id, user_id)
      VALUES (?, ?, datetime('now', '-50 minutes'), ?, ?)
    `,
    randomUUID(),
    6,
    products[2].id,
    employeeId
  );
  run(
    `
      INSERT INTO inventory_counts (id, quantity, counted_at, product_id, user_id)
      VALUES (?, ?, datetime('now', '-20 minutes'), ?, ?)
    `,
    randomUUID(),
    9,
    products[4].id,
    adminId
  );
}

main()
  .then(() => {
    db.close();
  })
  .catch((error) => {
    console.error(error);
    db.close();
    process.exit(1);
  });
