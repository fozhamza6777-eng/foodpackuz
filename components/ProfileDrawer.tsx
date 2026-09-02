"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  User,
  Package,
  Lock,
  LogOut,
  Loader2,
  CheckCircle2,
  AlertCircle,
  ChevronDown,
  RotateCcw,
  Building2,
  MapPin,
  Navigation,
  Check,
  Plus,
  Trash2
} from "lucide-react";
import { useAuth } from "./AuthProvider";
import { useCart } from "./CartProvider";
import { supabase } from "@/lib/supabase/client";
import type { OrderRow, BranchRow } from "@/lib/supabase/types";
import { products } from "@/lib/products";

type Tab = "profile" | "branches" | "orders";
type GeoStatus = "idle" | "loading" | "granted" | "denied" | "error";

const statusLabels: Record<string, string> = {
  yangi: "Yangi",
  jarayonda: "Jarayonda",
  yetkazildi: "Yetkazildi",
  bekor: "Bekor qilindi"
};

export default function ProfileDrawer({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const auth = useAuth();
  const cart = useCart();
  const [tab, setTab] = useState<Tab>("profile");

  const [name, setName] = useState(auth.user?.name ?? "");
  const [companyName, setCompanyName] = useState(auth.user?.companyName ?? "");
  const [nameStatus, setNameStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [nameError, setNameError] = useState<string | null>(null);

  const [newPassword, setNewPassword] = useState("");
  const [passStatus, setPassStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [passError, setPassError] = useState<string | null>(null);

  const [orders, setOrders] = useState<OrderRow[] | null>(null);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [reorderNotice, setReorderNotice] = useState<string | null>(null);

  const [branches, setBranches] = useState<BranchRow[] | null>(null);
  const [branchesLoading, setBranchesLoading] = useState(false);
  const [showAddBranch, setShowAddBranch] = useState(false);
  const [newBranchName, setNewBranchName] = useState("");
  const [newBranchAddress, setNewBranchAddress] = useState("");
  const [newBranchGeo, setNewBranchGeo] = useState<{ lat: number; lng: number } | null>(null);
  const [newBranchGeoStatus, setNewBranchGeoStatus] = useState<GeoStatus>("idle");
  const [addBranchStatus, setAddBranchStatus] = useState<"idle" | "saving" | "error">("idle");
  const [addBranchError, setAddBranchError] = useState<string | null>(null);

  useEffect(() => {
    setName(auth.user?.name ?? "");
    setCompanyName(auth.user?.companyName ?? "");
  }, [auth.user]);

  useEffect(() => {
    if (isOpen && tab === "orders" && auth.session?.user && orders === null) {
      setOrdersLoading(true);
      supabase
        .from("orders")
        .select("*")
        .eq("user_id", auth.session.user.id)
        .order("created_at", { ascending: false })
        .then(({ data }) => {
          setOrders((data as OrderRow[]) ?? []);
          setOrdersLoading(false);
        });
    }
  }, [isOpen, tab, auth.session, orders]);

  useEffect(() => {
    if (isOpen && tab === "branches" && auth.session?.user && branches === null) {
      setBranchesLoading(true);
      supabase
        .from("branches")
        .select("*")
        .eq("user_id", auth.session.user.id)
        .order("created_at", { ascending: false })
        .then(({ data }) => {
          setBranches((data as BranchRow[]) ?? []);
          setBranchesLoading(false);
        });
    }
  }, [isOpen, tab, auth.session, branches]);

  const handleClose = () => {
    onClose();
    window.setTimeout(() => {
      setTab("profile");
      setNameStatus("idle");
      setPassStatus("idle");
      setNewPassword("");
      resetAddBranchForm();
    }, 300);
  };

  const handleSaveName = async (e: React.FormEvent) => {
    e.preventDefault();
    setNameStatus("saving");
    setNameError(null);
    const { error } = await auth.updateName(name);
    if (error) {
      setNameError(error);
      setNameStatus("error");
      return;
    }
    const { error: companyError } = await auth.updateCompanyName(companyName);
    if (companyError) {
      setNameError(companyError);
      setNameStatus("error");
      return;
    }
    setNameStatus("saved");
    window.setTimeout(() => setNameStatus("idle"), 1500);
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPassStatus("saving");
    setPassError(null);
    const { error } = await auth.changePassword(newPassword);
    if (error) {
      setPassError(error);
      setPassStatus("error");
      return;
    }
    setNewPassword("");
    setPassStatus("saved");
    window.setTimeout(() => setPassStatus("idle"), 1500);
  };

  const handleLogout = async () => {
    if (window.confirm("Hisobingizdan chiqmoqchimisiz?")) {
      await auth.logout();
      handleClose();
    }
  };

  const handleShareNewBranchLocation = () => {
    if (!navigator.geolocation) {
      setNewBranchGeoStatus("error");
      return;
    }
    setNewBranchGeoStatus("loading");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setNewBranchGeo({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setNewBranchGeoStatus("granted");
      },
      () => setNewBranchGeoStatus("denied"),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const resetAddBranchForm = () => {
    setShowAddBranch(false);
    setNewBranchName("");
    setNewBranchAddress("");
    setNewBranchGeo(null);
    setNewBranchGeoStatus("idle");
    setAddBranchStatus("idle");
    setAddBranchError(null);
  };

  const handleAddBranch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.session?.user) return;
    setAddBranchStatus("saving");
    setAddBranchError(null);

    const { data, error } = await supabase
      .from("branches")
      .insert({
        user_id: auth.session.user.id,
        name: newBranchName,
        address: newBranchAddress,
        latitude: newBranchGeo?.lat ?? null,
        longitude: newBranchGeo?.lng ?? null
      })
      .select()
      .single();

    if (error) {
      setAddBranchError(error.message);
      setAddBranchStatus("error");
      return;
    }

    setBranches((prev) => [data as BranchRow, ...(prev ?? [])]);
    resetAddBranchForm();
  };

  const handleDeleteBranch = async (id: string) => {
    if (!window.confirm("Bu filialni o'chirmoqchimisiz?")) return;
    const { error } = await supabase.from("branches").delete().eq("id", id);
    if (!error) {
      setBranches((prev) => (prev ? prev.filter((b) => b.id !== id) : prev));
    }
  };

  const handleReorder = (order: OrderRow) => {
    let addedCount = 0;
    let missingCount = 0;

    for (const item of order.items) {
      const product = products.find((p) => p.id === item.id);
      if (product) {
        cart.addItem(product, item.qty);
        addedCount += 1;
      } else {
        missingCount += 1;
      }
    }

    if (addedCount > 0) {
      setReorderNotice(
        missingCount > 0
          ? `${addedCount} ta mahsulot savatga qo'shildi, ${missingCount} tasi endi mavjud emas.`
          : `${addedCount} ta mahsulot savatga qo'shildi.`
      );
    } else {
      setReorderNotice("Afsuski, bu buyurtmadagi mahsulotlar endi mavjud emas.");
    }

    window.setTimeout(() => setReorderNotice(null), 3000);

    if (addedCount > 0) {
      window.setTimeout(() => {
        handleClose();
        cart.openCart();
      }, 600);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 bg-ink/50 backdrop-blur-sm z-50"
          />
          <motion.aside
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 320, damping: 34 }}
            className="fixed top-0 right-0 h-full w-full sm:w-[420px] bg-white z-50 flex flex-col shadow-2xl"
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-ink/8">
              <h3 className="font-display font-extrabold text-lg text-ink">Mening profilim</h3>
              <button onClick={handleClose} aria-label="Yopish" className="p-1.5 hover:bg-surface rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex gap-2 p-4 pb-0">
              <button
                onClick={() => setTab("profile")}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-sm font-bold transition-colors ${
                  tab === "profile" ? "bg-brand-500 text-white" : "bg-surface text-ink/50"
                }`}
              >
                <User className="w-4 h-4" /> Profilim
              </button>
              <button
                onClick={() => setTab("branches")}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-sm font-bold transition-colors ${
                  tab === "branches" ? "bg-brand-500 text-white" : "bg-surface text-ink/50"
                }`}
              >
                <MapPin className="w-4 h-4" /> Filiallar
              </button>
              <button
                onClick={() => setTab("orders")}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-sm font-bold transition-colors ${
                  tab === "orders" ? "bg-brand-500 text-white" : "bg-surface text-ink/50"
                }`}
              >
                <Package className="w-4 h-4" /> Buyurtmalar
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5">
              {tab === "profile" && (
                <div className="flex flex-col gap-6">
                  <form onSubmit={handleSaveName} className="flex flex-col gap-3">
                    <div>
                      <label className="text-xs font-bold uppercase tracking-wide text-ink/45">Ism-familiya</label>
                      <input
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="mt-1 w-full border border-ink/15 rounded-lg px-3.5 py-2.5 bg-white focus:outline-none focus:border-brand-400"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold uppercase tracking-wide text-ink/45">
                        Tashkilot nomi
                      </label>
                      <div className="relative mt-1">
                        <input
                          value={companyName}
                          onChange={(e) => setCompanyName(e.target.value)}
                          placeholder="Masalan: «Tez Osh» fast-food"
                          className="w-full border border-ink/15 rounded-lg pl-9 pr-3.5 py-2.5 bg-white focus:outline-none focus:border-brand-400"
                        />
                        <Building2 className="w-4 h-4 text-ink/30 absolute left-3 top-1/2 -translate-y-1/2" />
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-bold uppercase tracking-wide text-ink/45">Telefon raqam</label>
                      <input
                        disabled
                        value={auth.user?.phone ?? ""}
                        className="mt-1 w-full border border-ink/10 rounded-lg px-3.5 py-2.5 bg-surface text-ink/50"
                      />
                      <p className="text-xs text-ink/40 mt-1">
                        Telefon raqamni o'zgartirish uchun operatorga murojaat qiling.
                      </p>
                    </div>
                    {nameError && (
                      <div className="flex items-start gap-2 bg-danger/10 border border-danger/20 text-danger text-sm font-medium rounded-lg p-3">
                        <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                        <span>{nameError}</span>
                      </div>
                    )}
                    <button
                      type="submit"
                      disabled={nameStatus === "saving"}
                      className="flex items-center justify-center gap-2 bg-brand-500 text-white font-bold py-2.5 rounded-lg hover:bg-brand-600 transition-colors disabled:opacity-70"
                    >
                      {nameStatus === "saving" && <Loader2 className="w-4 h-4 animate-spin" />}
                      {nameStatus === "saved" && <CheckCircle2 className="w-4 h-4" />}
                      {nameStatus === "saving" ? "Saqlanmoqda..." : nameStatus === "saved" ? "Saqlandi" : "Saqlash"}
                    </button>
                  </form>

                  <div className="h-px bg-ink/8" />

                  <form onSubmit={handleChangePassword} className="flex flex-col gap-3">
                    <h4 className="font-bold text-sm text-ink flex items-center gap-1.5">
                      <Lock className="w-4 h-4" /> Parolni almashtirish
                    </h4>
                    <input
                      required
                      type="password"
                      minLength={6}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Yangi parol (kamida 6 belgi)"
                      className="w-full border border-ink/15 rounded-lg px-3.5 py-2.5 bg-white focus:outline-none focus:border-brand-400"
                    />
                    {passError && (
                      <div className="flex items-start gap-2 bg-danger/10 border border-danger/20 text-danger text-sm font-medium rounded-lg p-3">
                        <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                        <span>{passError}</span>
                      </div>
                    )}
                    <button
                      type="submit"
                      disabled={passStatus === "saving"}
                      className="flex items-center justify-center gap-2 border-2 border-ink text-ink font-bold py-2.5 rounded-lg hover:bg-ink hover:text-white transition-colors disabled:opacity-70"
                    >
                      {passStatus === "saving" && <Loader2 className="w-4 h-4 animate-spin" />}
                      {passStatus === "saved" && <CheckCircle2 className="w-4 h-4" />}
                      {passStatus === "saving"
                        ? "Saqlanmoqda..."
                        : passStatus === "saved"
                        ? "Parol yangilandi"
                        : "Parolni yangilash"}
                    </button>
                  </form>

                  <div className="h-px bg-ink/8" />

                  <button
                    onClick={handleLogout}
                    className="flex items-center justify-center gap-2 text-danger font-bold py-2.5 rounded-lg hover:bg-danger/10 transition-colors"
                  >
                    <LogOut className="w-4 h-4" /> Hisobdan chiqish
                  </button>
                </div>
              )}

              {tab === "branches" && (
                <div className="flex flex-col gap-3">
                  {branchesLoading && (
                    <div className="flex items-center justify-center py-16 text-ink/40">
                      <Loader2 className="w-6 h-6 animate-spin" />
                    </div>
                  )}

                  {!branchesLoading && branches && branches.length === 0 && !showAddBranch && (
                    <div className="flex flex-col items-center justify-center text-center py-12 text-ink/40">
                      <MapPin className="w-10 h-10 mb-3" />
                      <p className="font-semibold">Hali filiallar qo'shilmagan</p>
                      <p className="text-sm mt-1">Bir nechta shoxobchangiz bo'lsa, shu yerdan qo'shing.</p>
                    </div>
                  )}

                  {!branchesLoading &&
                    branches &&
                    branches.map((b) => (
                      <div
                        key={b.id}
                        className="flex items-start justify-between gap-3 border border-ink/8 rounded-xl p-4"
                      >
                        <div className="flex items-start gap-3 min-w-0">
                          <span className="w-9 h-9 shrink-0 rounded-lg bg-brand-50 flex items-center justify-center">
                            <MapPin className="w-4 h-4 text-brand-600" />
                          </span>
                          <div className="min-w-0">
                            <p className="font-bold text-sm text-ink truncate">{b.name}</p>
                            <p className="text-xs text-ink/45 font-medium mt-0.5">{b.address}</p>
                            {b.latitude && b.longitude && (
                              <p className="text-[11px] text-brand-600 font-semibold mt-1 flex items-center gap-1">
                                <Navigation className="w-3 h-3" /> Geolokatsiya ulangan
                              </p>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={() => handleDeleteBranch(b.id)}
                          className="text-ink/30 hover:text-danger transition-colors shrink-0"
                          aria-label="O'chirish"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}

                  {!showAddBranch ? (
                    <button
                      onClick={() => setShowAddBranch(true)}
                      className="flex items-center justify-center gap-2 border-2 border-dashed border-ink/15 text-ink/50 hover:border-brand-300 hover:text-brand-600 font-bold text-sm py-3 rounded-lg transition-colors"
                    >
                      <Plus className="w-4 h-4" /> Yangi filial qo'shish
                    </button>
                  ) : (
                    <form
                      onSubmit={handleAddBranch}
                      className="flex flex-col gap-3 border border-ink/8 rounded-xl p-4 bg-surface/60"
                    >
                      <h4 className="font-bold text-sm text-ink">Yangi filial</h4>
                      <input
                        required
                        value={newBranchName}
                        onChange={(e) => setNewBranchName(e.target.value)}
                        placeholder="Filial nomi (masalan: Chilonzor filiali)"
                        className="w-full border border-ink/15 rounded-lg px-3.5 py-2.5 bg-white text-sm focus:outline-none focus:border-brand-400"
                      />
                      <input
                        required
                        value={newBranchAddress}
                        onChange={(e) => setNewBranchAddress(e.target.value)}
                        placeholder="Manzil"
                        className="w-full border border-ink/15 rounded-lg px-3.5 py-2.5 bg-white text-sm focus:outline-none focus:border-brand-400"
                      />
                      <button
                        type="button"
                        onClick={handleShareNewBranchLocation}
                        disabled={newBranchGeoStatus === "loading"}
                        className={`w-full flex items-center justify-center gap-2 border-2 rounded-lg py-2 text-sm font-bold transition-colors ${
                          newBranchGeoStatus === "granted"
                            ? "border-success text-success bg-success/5"
                            : "border-ink/15 text-ink/60 hover:border-brand-400 hover:text-brand-600"
                        }`}
                      >
                        {newBranchGeoStatus === "loading" && <Loader2 className="w-4 h-4 animate-spin" />}
                        {newBranchGeoStatus === "granted" && <Check className="w-4 h-4" />}
                        {newBranchGeoStatus !== "loading" && newBranchGeoStatus !== "granted" && (
                          <Navigation className="w-4 h-4" />
                        )}
                        {newBranchGeoStatus === "loading"
                          ? "Aniqlanmoqda..."
                          : newBranchGeoStatus === "granted"
                          ? "Joylashuv ulandi"
                          : "Joylashuvni ulash (ixtiyoriy)"}
                      </button>
                      {addBranchError && (
                        <div className="flex items-start gap-2 bg-danger/10 border border-danger/20 text-danger text-sm font-medium rounded-lg p-3">
                          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                          <span>{addBranchError}</span>
                        </div>
                      )}
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={resetAddBranchForm}
                          className="flex-1 border-2 border-ink/15 text-ink/60 font-bold text-sm py-2.5 rounded-lg hover:bg-ink/5 transition-colors"
                        >
                          Bekor qilish
                        </button>
                        <button
                          type="submit"
                          disabled={addBranchStatus === "saving"}
                          className="flex-1 flex items-center justify-center gap-2 bg-brand-500 text-white font-bold text-sm py-2.5 rounded-lg hover:bg-brand-600 transition-colors disabled:opacity-70"
                        >
                          {addBranchStatus === "saving" && <Loader2 className="w-4 h-4 animate-spin" />}
                          Saqlash
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              )}

              {tab === "orders" && (
                <div className="flex flex-col gap-3">
                  <AnimatePresence>
                    {reorderNotice && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="flex items-start gap-2 bg-brand-50 border border-brand-100 text-brand-700 text-sm font-medium rounded-lg p-3 overflow-hidden"
                      >
                        <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                        <span>{reorderNotice}</span>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {ordersLoading && (
                    <div className="flex items-center justify-center py-16 text-ink/40">
                      <Loader2 className="w-6 h-6 animate-spin" />
                    </div>
                  )}

                  {!ordersLoading && orders && orders.length === 0 && (
                    <div className="flex flex-col items-center justify-center text-center py-16 text-ink/40">
                      <Package className="w-10 h-10 mb-3" />
                      <p className="font-semibold">Hali buyurtmalar yo'q</p>
                    </div>
                  )}

                  {!ordersLoading &&
                    orders &&
                    orders.map((order) => {
                      const expanded = expandedOrder === order.id;
                      return (
                        <div key={order.id} className="border border-ink/8 rounded-xl overflow-hidden">
                          <div
                            role="button"
                            tabIndex={0}
                            onClick={() => setExpandedOrder(expanded ? null : order.id)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" || e.key === " ") {
                                setExpandedOrder(expanded ? null : order.id);
                              }
                            }}
                            className="w-full flex items-center justify-between p-4 text-left cursor-pointer"
                          >
                            <div>
                              <p className="font-bold text-sm text-ink">
                                {new Date(order.created_at).toLocaleDateString("uz-UZ", {
                                  day: "2-digit",
                                  month: "long",
                                  year: "numeric"
                                })}
                              </p>
                              <p className="text-xs text-ink/45 font-medium mt-0.5">
                                {order.items.length} mahsulot · {order.total.toLocaleString("uz-UZ")} so'm
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-[11px] font-bold uppercase bg-brand-50 text-brand-600 px-2 py-1 rounded-md">
                                {statusLabels[order.status] ?? order.status}
                              </span>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleReorder(order);
                                }}
                                title="Qayta buyurtma qilish"
                                className="p-1.5 rounded-md hover:bg-brand-50 text-ink/40 hover:text-brand-600 transition-colors"
                              >
                                <RotateCcw className="w-3.5 h-3.5" />
                              </button>
                              <motion.span animate={{ rotate: expanded ? 180 : 0 }}>
                                <ChevronDown className="w-4 h-4 text-ink/40" />
                              </motion.span>
                            </div>
                          </div>
                          <AnimatePresence initial={false}>
                            {expanded && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="overflow-hidden border-t border-ink/8"
                              >
                                <div className="p-4 flex flex-col gap-2 bg-surface/60">
                                  {order.items.map((it, i) => (
                                    <div key={i} className="flex items-center justify-between text-sm">
                                      <span className="text-ink/70 font-medium">
                                        {it.name} × {it.qty}
                                      </span>
                                      <span className="font-semibold text-ink">
                                        {(it.price * it.qty).toLocaleString("uz-UZ")} so'm
                                      </span>
                                    </div>
                                  ))}
                                  {order.address && (
                                    <p className="text-xs text-ink/45 mt-2 pt-2 border-t border-ink/8">
                                      Manzil: {order.address}
                                    </p>
                                  )}
                                  <button
                                    onClick={() => handleReorder(order)}
                                    className="flex items-center justify-center gap-2 bg-brand-500 text-white font-bold text-sm py-2.5 rounded-lg hover:bg-brand-600 transition-colors mt-2"
                                  >
                                    <RotateCcw className="w-4 h-4" /> Qayta buyurtma qilish
                                  </button>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      );
                    })}
                </div>
              )}
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
