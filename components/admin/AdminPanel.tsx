"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Package, ShoppingBag, LogOut, ArrowLeft, ShieldAlert, Loader2 } from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import OrdersTab from "./OrdersTab";
import ProductsTab from "./ProductsTab";

type Tab = "orders" | "products";

export default function AdminPanel() {
  const auth = useAuth();
  const [tab, setTab] = useState<Tab>("orders");

  if (!auth.hydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface">
        <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
      </div>
    );
  }

  if (!auth.isAuthenticated) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-surface px-6 text-center">
        <ShieldAlert className="w-12 h-12 text-ink/30 mb-4" />
        <h1 className="font-display font-extrabold text-xl text-ink mb-2">Avval tizimga kiring</h1>
        <p className="text-ink/50 max-w-sm mb-6">
          Admin panelga kirish uchun saytda ro'yxatdan o'ting yoki hisobingizga kiring.
        </p>
        <Link href="/" className="bg-brand-500 text-white font-bold px-6 py-3 rounded-lg hover:bg-brand-600 transition-colors">
          Bosh sahifaga qaytish
        </Link>
      </div>
    );
  }

  if (!auth.user?.isAdmin) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-surface px-6 text-center">
        <ShieldAlert className="w-12 h-12 text-danger/60 mb-4" />
        <h1 className="font-display font-extrabold text-xl text-ink mb-2">Sizda admin huquqlari yo'q</h1>
        <p className="text-ink/50 max-w-sm mb-6">
          Bu bo'lim faqat FOOD BOX administratorlari uchun. Agar bu xato deb hisoblasangiz, tizim
          egasiga murojaat qiling.
        </p>
        <Link href="/" className="bg-ink text-white font-bold px-6 py-3 rounded-lg hover:bg-brand-600 transition-colors">
          Bosh sahifaga qaytish
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface">
      <header className="bg-white border-b border-ink/8 sticky top-0 z-30">
        <div className="mx-auto max-w-7xl px-5 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="p-2 -ml-2 rounded-lg hover:bg-surface transition-colors" title="Saytga qaytish">
              <ArrowLeft className="w-5 h-5 text-ink/60" />
            </Link>
            <span className="font-display font-extrabold text-lg text-ink">
              Food<span className="text-brand-500">Box</span> · Admin
            </span>
          </div>
          <button
            onClick={() => auth.logout()}
            className="flex items-center gap-1.5 text-sm font-bold text-ink/60 hover:text-danger transition-colors"
          >
            <LogOut className="w-4 h-4" /> Chiqish
          </button>
        </div>

        <div className="mx-auto max-w-7xl px-5 lg:px-8 flex gap-2 pb-3">
          <button
            onClick={() => setTab("orders")}
            className={`relative flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-colors ${
              tab === "orders" ? "text-white" : "text-ink/50 hover:text-ink"
            }`}
          >
            {tab === "orders" && (
              <motion.span
                layoutId="admin-tab-pill"
                transition={{ type: "spring", stiffness: 380, damping: 30 }}
                className="absolute inset-0 bg-brand-500 rounded-lg -z-10"
              />
            )}
            <ShoppingBag className="w-4 h-4" /> Buyurtmalar
          </button>
          <button
            onClick={() => setTab("products")}
            className={`relative flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-colors ${
              tab === "products" ? "text-white" : "text-ink/50 hover:text-ink"
            }`}
          >
            {tab === "products" && (
              <motion.span
                layoutId="admin-tab-pill"
                transition={{ type: "spring", stiffness: 380, damping: 30 }}
                className="absolute inset-0 bg-brand-500 rounded-lg -z-10"
              />
            )}
            <Package className="w-4 h-4" /> Mahsulotlar
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-5 lg:px-8 py-6">
        {tab === "orders" && <OrdersTab />}
        {tab === "products" && <ProductsTab />}
      </main>
    </div>
  );
}
