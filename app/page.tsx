"use client";

import { useEffect, useState } from "react";

type WarehouseStock = {
  stockId: string;
  warehouseId: string;
  warehouseName: string;
  warehouseLocation: string;
  totalUnits: number;
  reservedUnits: number;
  availableUnits: number;
};

type Product = {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  warehouses: WarehouseStock[];
};

type Reservation = {
  id: string;
  productId: string;
  warehouseId: string;
  quantity: number;
  status: "PENDING" | "CONFIRMED" | "RELEASED";
  expiresAt: string;
  product: {
    name: string;
  };
  warehouse: {
    name: string;
    location: string;
  };
};

export default function Home() {
  const [products, setProducts] = useState<Product[]>([]);
  const [reservation, setReservation] = useState<Reservation | null>(null);
  const [loadingAction, setLoadingAction] = useState<
    "reserve" | "confirm" | "cancel" | null
  >(null);
  const [message, setMessage] = useState("");
  const [timeLeft, setTimeLeft] = useState("");

  async function fetchProducts() {
    const response = await fetch("/api/products");
    const data = await response.json();
    setProducts(data);
  }

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    if (!reservation || reservation.status !== "PENDING") return;

    const timer = setInterval(() => {
      const expiry = new Date(reservation.expiresAt).getTime();
      const now = Date.now();
      const difference = expiry - now;

      if (difference <= 0) {
        setTimeLeft("Expired");
        setMessage("Reservation expired. Stock will be released automatically.");
        fetchProducts();
        clearInterval(timer);
        return;
      }

      const minutes = Math.floor(difference / 1000 / 60);
      const seconds = Math.floor((difference / 1000) % 60);

      setTimeLeft(`${minutes}m ${seconds}s`);
    }, 1000);

    return () => clearInterval(timer);
  }, [reservation]);

  async function reserveStock(stockId: string) {
    setLoadingAction("reserve");
    setMessage("");

    try {
      const response = await fetch("/api/reservations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          stockId,
          quantity: 1,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setMessage(data.error || "Could not reserve stock");
        return;
      }

      setReservation(data);
      setMessage("Reservation created successfully.");
      await fetchProducts();
    } catch {
      setMessage("Something went wrong.");
    } finally {
      setLoadingAction(null);
    }
  }

  async function confirmReservation() {
    if (!reservation) return;

    setLoadingAction("confirm");
    setMessage("");

    try {
      const response = await fetch(`/api/reservations/${reservation.id}/confirm`, {
        method: "POST",
      });

      const data = await response.json();

      if (!response.ok) {
        setMessage(data.error || "Could not confirm reservation");
        return;
      }

      setReservation(data);
      setMessage("Purchase confirmed successfully.");
      await fetchProducts();
    } catch {
      setMessage("Something went wrong.");
    } finally {
      setLoadingAction(null);
    }
  }

  async function cancelReservation() {
    if (!reservation) return;

    setLoadingAction("cancel");
    setMessage("");

    try {
      const response = await fetch(`/api/reservations/${reservation.id}/release`, {
        method: "POST",
      });

      const data = await response.json();

      if (!response.ok) {
        setMessage(data.error || "Could not cancel reservation");
        return;
      }

      setReservation(data);
      setMessage("Reservation cancelled and stock released.");
      await fetchProducts();
    } catch {
      setMessage("Something went wrong.");
    } finally {
      setLoadingAction(null);
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-8 text-white">
      <section className="mx-auto max-w-6xl">
        <div className="mb-8">
          <p className="mb-2 text-sm font-medium text-cyan-400">
            Inventory Reservation System
          </p>
          <h1 className="text-4xl font-bold tracking-tight">
            Allo Inventory Checkout Hold
          </h1>
          <p className="mt-3 max-w-2xl text-slate-300">
            Reserve inventory during checkout, confirm successful payments, or
            release stock when a customer cancels.
          </p>
        </div>

        {message && (
          <div className="mb-6 rounded-xl border border-slate-700 bg-slate-900 p-4 text-sm text-slate-100">
            {message}
          </div>
        )}

        {reservation && (
          <div className="mb-8 rounded-2xl border border-cyan-700 bg-cyan-950/40 p-5 shadow-lg">
            <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
              <div>
                <p className="text-sm text-cyan-300">Current Reservation</p>
                <h2 className="mt-1 text-xl font-semibold">
                  {reservation.product.name}
                </h2>
                <p className="mt-1 text-sm text-slate-300">
                  Warehouse: {reservation.warehouse.name}
                </p>
                <p className="mt-1 text-sm text-slate-300">
                  Quantity: {reservation.quantity}
                </p>
                <p className="mt-1 text-sm">
                  Status:{" "}
                  <span className="font-semibold text-cyan-300">
                    {reservation.status}
                  </span>
                </p>
                {reservation.status === "PENDING" && (
                  <p className="mt-1 text-sm text-yellow-300">
                    Expires in: {timeLeft}
                  </p>
                )}
              </div>

              {reservation.status === "PENDING" && (
                <div className="flex gap-3">
                  <button
                    onClick={confirmReservation}
                    disabled={loadingAction !== null}
                    className="rounded-xl bg-green-500 px-4 py-2 font-semibold text-slate-950 hover:bg-green-400 disabled:opacity-60"
                  >
                    {loadingAction === "confirm"
                      ? "Confirming..."
                      : "Confirm Purchase"}
                  </button>

                  <button
                    onClick={cancelReservation}
                    disabled={loadingAction !== null}
                    className="rounded-xl bg-red-500 px-4 py-2 font-semibold text-white hover:bg-red-400 disabled:opacity-60"
                  >
                    {loadingAction === "cancel" ? "Cancelling..." : "Cancel"}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {products.map((product) => (
            <article
              key={product.id}
              className="rounded-2xl border border-slate-800 bg-slate-900 p-5 shadow-xl"
            >
              <div className="mb-4 flex h-28 items-center justify-center rounded-xl bg-slate-800">
                <span className="text-4xl">📦</span>
              </div>

              <h2 className="text-xl font-semibold">{product.name}</h2>
              <p className="mt-2 text-sm text-slate-400">
                {product.description}
              </p>

              <div className="mt-5 space-y-4">
                {product.warehouses.map((warehouse) => (
                  <div
                    key={warehouse.stockId}
                    className="rounded-xl border border-slate-700 bg-slate-950 p-4"
                  >
                    <div className="mb-3">
                      <p className="font-medium">{warehouse.warehouseName}</p>
                      <p className="text-xs text-slate-400">
                        {warehouse.warehouseLocation}
                      </p>
                    </div>

                    <div className="mb-4 grid grid-cols-3 gap-2 text-center text-sm">
                      <div className="rounded-lg bg-slate-800 p-2">
                        <p className="text-slate-400">Total</p>
                        <p className="font-bold">{warehouse.totalUnits}</p>
                      </div>

                      <div className="rounded-lg bg-slate-800 p-2">
                        <p className="text-slate-400">Reserved</p>
                        <p className="font-bold">{warehouse.reservedUnits}</p>
                      </div>

                      <div className="rounded-lg bg-slate-800 p-2">
                        <p className="text-slate-400">Available</p>
                        <p className="font-bold text-cyan-300">
                          {warehouse.availableUnits}
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => reserveStock(warehouse.stockId)}
                      disabled={
                        loadingAction !== null || warehouse.availableUnits <= 0
                      }
                      className="w-full rounded-xl bg-cyan-400 px-4 py-2 font-semibold text-slate-950 hover:bg-cyan-300 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400"
                    >
                      {loadingAction === "reserve"
                        ? "Reserving..."
                        : warehouse.availableUnits > 0
                        ? "Reserve 1 Unit"
                        : "Out of Stock"}
                    </button>
                  </div>
                ))}
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}