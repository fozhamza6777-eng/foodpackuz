"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Package,
  ShoppingBag,
  LogOut,
  ArrowLeft,
  ShieldAlert,
  Loader2,
  Image as ImageIcon,
  Layers,
  CreditCard,
  Handshake,
  MessageCircle,
  Bug,
  BarChart3,
  Menu,
  X,
  type LucideIcon
} from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import StatsTab from "./StatsTab";
import OrdersTab from "./OrdersTab";
import ProductsTab from "./ProductsTab";
import BannersTab from "./BannersTab";
import CategoriesTab from "./CategoriesTab";
import PaymentCardsTab from "./PaymentCardsTab";
import BulkRequestsTab from "./BulkRequestsTab";
import SupportChatTab from "./SupportChatTab";
import ErrorLogsTab from "./ErrorLogsTab";
import AdminNotifications from "./AdminNotifications";

type Tab =
  | "stats"
  | "orders"
  | "products"
  | "categories"
  | "banners"
  | "payment-cards"
  | "bulk-requests"
  | "chat"
  | "errors";

const navItems: { id: Tab; label: string; icon: LucideIcon }[] = [
  { id: "stats", label: "Statistika", icon: BarChart3 },
  { id: "orders", label: "Buyurtmalar", icon: ShoppingBag },
  { id: "products", label: "Mahsulotlar", icon: Package },
  { id: "categories", label: "Bo'limlar", icon: Layers },
  { id: "banners", label: "Bannerlar", icon: ImageIcon },
  { id: "payment-cards", label: "To'lov kartalari", icon: CreditCard },
  { id: "bulk-requests", label: "Hamkorlik so'rovlari", icon: Handshake },
  { id: "chat", label: "Mijozlar chati", icon: MessageCircle },
  { id: "errors", label: "Xatoliklar", icon: Bug }
];

export default function AdminPanel() {
  const auth = useAuth();
  const [tab, setTab] = useState<Tab>("orders");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!auth.hydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-violet-50/40">
        <Loader2 className="w-8 h-8 animate-spin text-violet-600" />
      </div>
    );
  }

  if (!auth.isAuthenticated) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-violet-50/40 px-6 text-center">
        <ShieldAlert className="w-12 h-12 text-ink/30 mb-4" />
        <h1 className="font-display font-extrabold text-xl text-ink mb-2">Avval tizimga kiring</h1>
        <p className="text-ink/50 max-w-sm mb-6">
          Admin panelga kirish uchun saytda ro'yxatdan o'ting yoki hisobingizga kiring.
        </p>
        <Link href="/" className="bg-violet-600 text-white font-bold px-6 py-3 rounded-lg hover:bg-violet-700 transition-colors">
          Bosh sahifaga qaytish
        </Link>
      </div>
    );
  }

  if (!auth.user?.isAdmin) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-violet-50/40 px-6 text-center">
        <ShieldAlert className="w-12 h-12 text-danger/60 mb-4" />
        <h1 className="font-display font-extrabold text-xl text-ink mb-2">Sizda admin huquqlari yo'q</h1>
        <p className="text-ink/50 max-w-sm mb-6">
          Bu bo'lim faqat FOOD BOX administratorlari uchun. Agar bu xato deb hisoblasangiz, tizim
          egasiga murojaat qiling.
        </p>
        <Link href="/" className="bg-ink text-white font-bold px-6 py-3 rounded-lg hover:bg-violet-700 transition-colors">
          Bosh sahifaga qaytish
        </Link>
      </div>
    );
  }

  const activeLabel = navItems.find((n) => n.id === tab)?.label ?? "";

  const sidebarContent = (
    <div className="relative flex flex-col h-full w-64 shrink-0 bg-violet-800 overflow-hidden">
      <div
        className="absolute -top-24 -right-16 w-56 h-56 rounded-full bg-white/10 blur-2xl"
        aria-hidden="true"
      />
      <div className="relative flex items-center gap-3 px-6 pt-6 pb-5">
        <span className="w-10 h-10 rounded-2xl bg-white flex items-center justify-center font-display font-extrabold text-violet-700 shrink-0">
          F
        </span>
        <span className="font-display font-extrabold text-white text-sm leading-tight">
          FOOD BOX
          <span className="block text-[11px] font-semibold text-white/50">Admin panel</span>
        </span>
        <button
          onClick={() => setSidebarOpen(false)}
          className="ml-auto p-1.5 rounded-lg hover:bg-white/10 text-white/70 lg:hidden"
          aria-label="Yopish"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <p className="relative px-6 text-[10px] font-bold uppercase tracking-widest text-white/35 mb-2 mt-2">
        Bo'limlar
      </p>

      <nav className="relative flex-1 flex flex-col gap-1 px-3 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = tab === item.id;
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => {
                setTab(item.id);
                setSidebarOpen(false);
              }}
              className={`relative flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-bold transition-colors text-left ${
                isActive ? "text-violet-700" : "text-white/70 hover:bg-white/10 hover:text-white"
              }`}
            >
              {isActive && (
                <motion.span
                  layoutId="admin-sidebar-active"
                  transition={{ type: "spring", stiffness: 380, damping: 32 }}
                  className="absolute inset-0 bg-white rounded-xl -z-10"
                />
              )}
              <Icon className="w-[18px] h-[18px] shrink-0" />
              <span className="truncate">{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="relative m-3 p-4 rounded-2xl bg-white/10">
        <p className="text-xs font-bold text-white truncate">{auth.user?.name}</p>
        <p className="text-[11px] text-white/50 mb-3">Administrator</p>
        <div className="flex items-center gap-2">
          <Link
            href="/"
            className="flex-1 flex items-center justify-center gap-1.5 text-[11px] font-bold text-white bg-white/10 hover:bg-white/20 transition-colors rounded-lg py-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Sayt
          </Link>
          <button
            onClick={() => auth.logout()}
            className="flex-1 flex items-center justify-center gap-1.5 text-[11px] font-bold text-white bg-white/10 hover:bg-danger/80 transition-colors rounded-lg py-2"
          >
            <LogOut className="w-3.5 h-3.5" /> Chiqish
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex bg-violet-50/40">
      <aside className="hidden lg:flex sticky top-0 h-screen">{sidebarContent}</aside>

      {mounted &&
        createPortal(
          <AnimatePresence>
            {sidebarOpen && (
              <>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setSidebarOpen(false)}
                  className="fixed inset-0 bg-ink/50 backdrop-blur-sm z-[90] lg:hidden"
                />
                <motion.div
                  initial={{ x: "-100%" }}
                  animate={{ x: 0 }}
                  exit={{ x: "-100%" }}
                  transition={{ type: "spring", stiffness: 320, damping: 34 }}
                  className="fixed top-0 left-0 h-full z-[95] lg:hidden"
                >
                  {sidebarContent}
                </motion.div>
              </>
            )}
          </AnimatePresence>,
          document.body
        )}

      <div className="flex-1 min-w-0">
        <header className="bg-white border-b border-ink/8 sticky top-0 z-30">
          <div className="px-5 lg:px-8 h-16 flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 -ml-2 rounded-lg hover:bg-surface transition-colors lg:hidden"
              aria-label="Menyu"
            >
              <Menu className="w-5 h-5 text-ink/60" />
            </button>
            <h1 className="font-display font-extrabold text-lg text-ink truncate">{activeLabel}</h1>
            <div className="ml-auto flex items-center gap-1">
              <AdminNotifications
                onGoToOrders={() => setTab("orders")}
                onGoToChat={() => setTab("chat")}
                onGoToErrors={() => setTab("errors")}
              />
            </div>
          </div>
        </header>

        <main className="px-5 lg:px-8 py-6 max-w-7xl">
          {tab === "stats" && <StatsTab />}
          {tab === "orders" && <OrdersTab />}
          {tab === "products" && <ProductsTab />}
          {tab === "categories" && <CategoriesTab />}
          {tab === "banners" && <BannersTab />}
          {tab === "payment-cards" && <PaymentCardsTab />}
          {tab === "bulk-requests" && <BulkRequestsTab />}
          {tab === "chat" && <SupportChatTab />}
          {tab === "errors" && <ErrorLogsTab />}
        </main>
      </div>
    </div>
  );
}
