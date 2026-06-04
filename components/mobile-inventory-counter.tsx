"use client";

import { useActionState, useEffect, useMemo, useRef, useState } from "react";
import { Camera, ScanBarcode, Search, X } from "lucide-react";
import { saveInventoryCountAction, type InventoryFormState } from "@/app/actions/inventory";
import { SubmitButton } from "@/components/submit-button";
import type { Category, Product } from "@/lib/types";
import { cn, formatQuantity } from "@/lib/utils";

type ProductWithCategory = Product & {
  category: Category;
};

type CounterProps = {
  products: ProductWithCategory[];
  categories: Category[];
  userName: string;
};

type DetectedBarcode = {
  rawValue?: string;
};

type BarcodeDetectorInstance = {
  detect: (source: ImageBitmapSource) => Promise<DetectedBarcode[]>;
};

type BarcodeDetectorCtor = new (options?: {
  formats?: string[];
}) => BarcodeDetectorInstance;

export function MobileInventoryCounter({
  products,
  categories,
  userName,
}: CounterProps) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [scannerOpen, setScannerOpen] = useState(false);
  const [scannerStatus, setScannerStatus] = useState<string | null>(null);
  const [scannedBarcode, setScannedBarcode] = useState("");
  const [highlightedProductId, setHighlightedProductId] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const detectorRef = useRef<BarcodeDetectorInstance | null>(null);
  const rafRef = useRef<number | null>(null);

  const productTypes = useMemo(() => {
    return Array.from(
      new Set(products.map((product) => product.productType).filter(Boolean))
    ) as string[];
  }, [products]);

  const filteredProducts = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return products.filter((product) => {
      const matchesQuery =
        normalizedQuery.length === 0 ||
        product.name.toLowerCase().includes(normalizedQuery) ||
        product.category.name.toLowerCase().includes(normalizedQuery) ||
        product.productType?.toLowerCase().includes(normalizedQuery) ||
        product.barcode?.toLowerCase().includes(normalizedQuery);

      const matchesCategory =
        category === "all" || product.categoryId === category;

      const matchesType =
        typeFilter === "all" || product.productType === typeFilter;

      return matchesQuery && matchesCategory && matchesType;
    });
  }, [category, products, query, typeFilter]);

  useEffect(() => {
    return () => {
      stopScanner();
    };
  }, []);

  async function startScanner() {
    if (
      typeof window === "undefined" ||
      !("BarcodeDetector" in window) ||
      !navigator.mediaDevices?.getUserMedia
    ) {
      setScannerStatus(
        "Kamera-skanning støttes ikke her. Bruk feltet for manuell strekkode."
      );
      return;
    }

    try {
      const Detector = (
        window as unknown as {
          BarcodeDetector: BarcodeDetectorCtor;
        }
      ).BarcodeDetector;

      detectorRef.current = new Detector({
        formats: ["ean_13", "ean_8", "code_128", "code_39", "upc_a", "upc_e"],
      });

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: "environment" },
        },
      });

      streamRef.current = stream;
      setScannerOpen(true);
      setScannerStatus("Skanner etter strekkode...");

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      scanFrame();
    } catch {
      setScannerStatus(
        "Kunne ikke starte kameraet. Sjekk kameratilgang eller bruk manuell kode."
      );
      stopScanner();
    }
  }

  function stopScanner() {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }

    if (streamRef.current) {
      for (const track of streamRef.current.getTracks()) {
        track.stop();
      }
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.srcObject = null;
    }

    setScannerOpen(false);
  }

  function scanFrame() {
    rafRef.current = requestAnimationFrame(async () => {
      if (!videoRef.current || !detectorRef.current) {
        return;
      }

      try {
        const barcodes = await detectorRef.current.detect(videoRef.current);
        const code = barcodes[0]?.rawValue?.trim();

        if (code) {
          setScannedBarcode(code);
          const matchedProduct =
            products.find((product) => product.barcode === code) ?? null;
          setQuery(matchedProduct ? matchedProduct.name : code);
          setHighlightedProductId(matchedProduct?.id ?? null);
          window.setTimeout(() => {
            setHighlightedProductId(null);
          }, 3000);
          setScannerStatus(`Fant strekkode: ${code}`);
          stopScanner();
          return;
        }
      } catch {
        setScannerStatus("Skanningen ble avbrutt. Prøv igjen.");
      }

      scanFrame();
    });
  }

  return (
    <div className="space-y-5">
      <section className="card rounded-[1.8rem] p-5">
        <div className="mb-4 flex items-center justify-between gap-4">
          <div>
            <p className="text-sm text-[var(--muted)]">Innlogget som</p>
            <h2 className="text-lg font-semibold">{userName}</h2>
          </div>
          <span className="pill bg-[var(--primary-soft)] text-[var(--primary)]">
            {filteredProducts.length} varer
          </span>
        </div>

        <div className="mb-3 grid gap-3">
          <button
            className="btn-secondary flex items-center justify-center gap-2 px-4 py-3 text-sm font-semibold"
            onClick={scannerOpen ? stopScanner : startScanner}
            type="button"
          >
            {scannerOpen ? <X size={18} /> : <Camera size={18} />}
            {scannerOpen ? "Stopp skanner" : "Skann strekkode"}
          </button>

          <div className="relative">
            <ScanBarcode className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--muted)]" size={18} />
            <input
              className="field pl-11"
              onChange={(event) => {
                const value = event.target.value;
                setScannedBarcode(value);
                setQuery(value);
              }}
              placeholder="Skann eller skriv strekkode"
              value={scannedBarcode}
            />
          </div>
        </div>

        {scannerOpen ? (
          <div className="mb-3 overflow-hidden rounded-[1.4rem] border border-[var(--border)] bg-black">
            <video
              className="aspect-video w-full object-cover"
              muted
              playsInline
              ref={videoRef}
            />
          </div>
        ) : null}

        {scannerStatus ? (
          <p className="mb-3 rounded-2xl bg-white/70 px-4 py-3 text-sm text-[var(--muted)]">
            {scannerStatus}
          </p>
        ) : null}

        <div className="relative mb-3">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--muted)]" size={18} />
          <input
            className="field pl-11"
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Søk etter varenavn, kategori, type eller strekkode"
            value={query}
          />
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <select className="field" onChange={(event) => setCategory(event.target.value)} value={category}>
            <option value="all">Alle kategorier</option>
            {categories.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>

          <select
            className="field"
            onChange={(event) => setTypeFilter(event.target.value)}
            value={typeFilter}
          >
            <option value="all">Alle varetyper</option>
            {productTypes.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </div>
      </section>

      <section className="grid gap-4">
        {filteredProducts.map((product) => (
          <CountCard
            highlighted={highlightedProductId === product.id}
            key={product.id}
            product={product}
          />
        ))}

        {filteredProducts.length === 0 ? (
          <div className="card rounded-[1.8rem] p-6 text-sm text-[var(--muted)]">
            Ingen varer matcher filtrene dine.
          </div>
        ) : null}
      </section>
    </div>
  );
}

function CountCard({
  product,
  highlighted,
}: {
  product: ProductWithCategory;
  highlighted: boolean;
}) {
  const [state, action] = useActionState<InventoryFormState, FormData>(
    saveInventoryCountAction,
    { success: false }
  );

  return (
    <form
      action={action}
      className={cn(
        "card rounded-[1.8rem] p-5 transition-transform",
        highlighted && "ring-4 ring-[rgba(35,83,71,0.16)]"
      )}
    >
      <input name="productId" type="hidden" value={product.id} />

      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">
            {product.category.name}
          </p>
          <h3 className="text-lg font-semibold">{product.name}</h3>
          <p className="mt-1 text-sm text-[var(--muted)]">
            {product.productType || "Uten type"} • Nåværende beholdning{" "}
            {formatQuantity(product.currentStock)} {product.unit}
          </p>
          <p className="mt-1 text-xs text-[var(--muted)]">
            Strekkode: {product.barcode ?? "Ikke satt"}
          </p>
        </div>

        <span
          className={cn(
            "pill",
            product.currentStock <= product.minimumLevel
              ? "bg-[var(--danger-soft)] text-[var(--danger)]"
              : "bg-[var(--success-soft)] text-[var(--primary)]"
          )}
        >
          Min {formatQuantity(product.minimumLevel)} {product.unit}
        </span>
      </div>

      <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
        <div className="space-y-2">
          <label className="text-sm font-semibold" htmlFor={`quantity-${product.id}`}>
            Registrer antall
          </label>
          <input
            className="field"
            defaultValue={product.currentStock}
            id={`quantity-${product.id}`}
            inputMode="decimal"
            name="quantity"
            step="0.01"
            type="number"
          />
        </div>

        <SubmitButton
          className="sm:w-auto sm:px-6"
          label="Lagre telling"
          pendingLabel="Lagrer..."
        />
      </div>

      {state.message ? (
        <p
          className={cn(
            "mt-3 rounded-2xl px-4 py-3 text-sm",
            state.success
              ? "bg-[var(--success-soft)] text-[var(--primary)]"
              : "bg-[var(--danger-soft)] text-[var(--danger)]"
          )}
        >
          {state.message}
        </p>
      ) : null}
    </form>
  );
}
