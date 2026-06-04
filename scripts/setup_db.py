from pathlib import Path
import os
import sqlite3


ROOT = Path(__file__).resolve().parent.parent


def resolve_db_path() -> Path:
  raw = os.environ.get("DATABASE_URL", "file:./dev.db")

  if raw.startswith("file:"):
    raw = raw.replace("file:", "", 1)

  path = Path(raw)

  if not path.is_absolute():
    path = ROOT / path

  return path.resolve()


DB_PATH = resolve_db_path()


SCHEMA_SQL = """
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('EMPLOYEE', 'ADMIN')),
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS suppliers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  is_active INTEGER NOT NULL DEFAULT 1,
  contact_name TEXT,
  email TEXT,
  phone TEXT,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  barcode TEXT,
  product_type TEXT,
  unit TEXT NOT NULL,
  purchase_price REAL NOT NULL DEFAULT 0,
  minimum_level REAL NOT NULL DEFAULT 0,
  current_stock REAL NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  category_id TEXT NOT NULL,
  supplier_id TEXT,
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE RESTRICT,
  FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS inventory_counts (
  id TEXT PRIMARY KEY,
  quantity REAL NOT NULL,
  counted_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  product_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS import_runs (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  file_name TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('PREVIEW', 'IMPORTED')),
  created_count INTEGER NOT NULL DEFAULT 0,
  updated_count INTEGER NOT NULL DEFAULT 0,
  total_rows INTEGER NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  confirmed_at DATETIME,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS import_run_items (
  id TEXT PRIMARY KEY,
  import_run_id TEXT NOT NULL,
  row_number INTEGER NOT NULL,
  name TEXT NOT NULL,
  category_id TEXT NOT NULL,
  category_name TEXT NOT NULL,
  unit TEXT NOT NULL,
  purchase_price REAL NOT NULL,
  minimum_level REAL NOT NULL,
  current_stock REAL NOT NULL,
  supplier_name TEXT,
  product_type TEXT,
  action TEXT NOT NULL CHECK (action IN ('create', 'update')),
  FOREIGN KEY (import_run_id) REFERENCES import_runs(id) ON DELETE CASCADE,
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS users_role_idx ON users(role);
CREATE INDEX IF NOT EXISTS products_name_idx ON products(name);
CREATE INDEX IF NOT EXISTS products_category_id_idx ON products(category_id);
CREATE INDEX IF NOT EXISTS inventory_counts_product_id_counted_at_idx
  ON inventory_counts(product_id, counted_at);
CREATE INDEX IF NOT EXISTS inventory_counts_user_id_counted_at_idx
  ON inventory_counts(user_id, counted_at);
CREATE INDEX IF NOT EXISTS import_runs_user_id_created_at_idx
  ON import_runs(user_id, created_at);
CREATE INDEX IF NOT EXISTS import_run_items_import_run_id_idx
  ON import_run_items(import_run_id);
"""


def main() -> None:
  DB_PATH.parent.mkdir(parents=True, exist_ok=True)
  connection = sqlite3.connect(DB_PATH)

  try:
    connection.executescript(SCHEMA_SQL)
    product_columns = {
      row[1] for row in connection.execute("PRAGMA table_info(products)").fetchall()
    }
    if "barcode" not in product_columns:
      connection.execute("ALTER TABLE products ADD COLUMN barcode TEXT")
    supplier_columns = {
      row[1] for row in connection.execute("PRAGMA table_info(suppliers)").fetchall()
    }
    if "is_active" not in supplier_columns:
      connection.execute(
        "ALTER TABLE suppliers ADD COLUMN is_active INTEGER NOT NULL DEFAULT 1"
      )
    connection.execute("CREATE INDEX IF NOT EXISTS products_barcode_idx ON products(barcode)")
    connection.execute("CREATE INDEX IF NOT EXISTS suppliers_is_active_idx ON suppliers(is_active)")
    connection.commit()
    print(f"SQLite schema ready at {DB_PATH}")
  finally:
    connection.close()


if __name__ == "__main__":
  main()
