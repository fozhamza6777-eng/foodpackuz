"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  ArrowLeft,
  Settings,
  Camera,
  ChevronRight,
  ChevronDown,
  ShoppingBag,
  XCircle,
  Heart,
  MessageCircle,
  MapPin,
  Lock,
  LogOut,
  Loader2,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
  Building2,
  Navigation,
  Check,
  Plus,
  Minus,
  Trash2,
  Star,
  Pencil
} from "lucide-react";
import { useAuth } from "./AuthProvider";
import { useCart } from "./CartProvider";
import { supabase } from "@/lib/supabase/client";
import { uploadAvatar } from "@/lib/supabase/storage";
import type { OrderRow, OrderItem, BranchRow } from "@/lib/supabase/types";
import { fetchActiveProducts } from "@/lib/supabase/products";
import { fetchUserComments, deleteComment, type MyComment } from "@/lib/supabase/comments";
import type { Product } from "@/lib/types";
import ProductImage from "./ProductImage";

type Screen = "home" | "settings" | "orders" | "cancelled" | "reviews" | "branches";
type GeoStatus = "idle" | "loading" | "granted" | "denied" | "error";

const statusLabels: Record<string, string> = {
  yangi: "Yangi",
  jarayonda: "Jarayonda",
  yetkazildi: "Yetkazildi",
  bekor: "Bekor qilindi",
  bekor_sorovi: "Bekor so'ralgan"
};

const statusColors: Record<string, string> = {
  yangi: "bg-brand-50 text-brand-600",
  jarayonda: "bg-amber-light text-amber",
  yetkazildi: "bg-success/10 text-success",
  bekor: "bg-danger/10 text-danger",
  bekor_sorovi: "bg-amber-light text-amber"
};

const CANCELLED_STATUSES = ["bekor", "bekor_sorovi"];

function canRequestCancel(status: string) {
  return !CANCELLED_STATUSES.includes(status) && status !== "yetkazildi";
}

function canEditOrder(status: string) {
  return status === "yangi";
}

function initialsOf(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  return parts
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
}

export default function ProfileDrawer({
  isOpen,
  onClose,
  onOpenFavorites
}: {
  isOpen: boolean;
  onClose: () => void;
  onOpenFavorites: () => void;
}) {
  const auth = useAuth();
  const cart = useCart();
  const [screen, setScreen] = useState<Screen>("home");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // --- profil ma'lumotlari ---
  const [name, setName] = useState(auth.user?.name ?? "");
  const [companyName, setCompanyName] = useState(auth.user?.companyName ?? "");
  const [nameStatus, setNameStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [nameError, setNameError] = useState<string | null>(null);

  const [birthDate, setBirthDate] = useState(auth.user?.birthDate ?? "");
  const [gender, setGender] = useState<"" | "male" | "female">((auth.user?.gender as any) ?? "");
  const [extraStatus, setExtraStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");

  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const [newPassword, setNewPassword] = useState("");
  const [passStatus, setPassStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [passError, setPassError] = useState<string | null>(null);

  // --- buyurtmalar ---
  const [orders, setOrders] = useState<OrderRow[] | null>(null);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [reorderNotice, setReorderNotice] = useState<string | null>(null);
  const [allProducts, setAllProducts] = useState<Product[] | null>(null);

  const [cancelReasonOrderId, setCancelReasonOrderId] = useState<string | null>(null);
  const [cancelReasonText, setCancelReasonText] = useState("");
  const [cancelSubmitting, setCancelSubmitting] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);

  const [editingOrderId, setEditingOrderId] = useState<string | null>(null);
  const [editItems, setEditItems] = useState<OrderItem[] | null>(null);
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  // --- sharhlar ---
  const [reviews, setReviews] = useState<MyComment[] | null>(null);
  const [reviewsLoading, setReviewsLoading] = useState(false);

  // --- filiallar ---
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
    setBirthDate(auth.user?.birthDate ?? "");
    setGender((auth.user?.gender as any) ?? "");
  }, [auth.user]);

  // Buyurtmalar — "Buyurtmalarim" va "Bekor qilinganlar" ikkalasi ham shu
  // ro'yxatdan filtrlanadi, shuning uchun bir marta yuklab olamiz.
  useEffect(() => {
    if (isOpen && auth.session?.user && orders === null) {
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
    if (isOpen && allProducts === null) {
      fetchActiveProducts().then(setAllProducts);
    }
  }, [isOpen, auth.session, orders, allProducts]);

  useEffect(() => {
    if (isOpen && screen === "reviews" && auth.session?.user && reviews === null) {
      setReviewsLoading(true);
      fetchUserComments(auth.session.user.id).then((data) => {
        setReviews(data);
        setReviewsLoading(false);
      });
    }
  }, [isOpen, screen, auth.session, reviews]);

  useEffect(() => {
    if (isOpen && screen === "branches" && auth.session?.user && branches === null) {
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
  }, [isOpen, screen, auth.session, branches]);

  const handleClose = () => {
    onClose();
    window.setTimeout(() => {
      setScreen("home");
      setNameStatus("idle");
      setExtraStatus("idle");
      setPassStatus("idle");
      setNewPassword("");
      setAvatarError(null);
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

  const handleSaveExtra = async (e: React.FormEvent) => {
    e.preventDefault();
    setExtraStatus("saving");
    const { error } = await auth.updateExtraInfo({
      birthDate: birthDate || undefined,
      gender: gender ? gender : undefined
    });
    if (error) {
      setExtraStatus("error");
      return;
    }
    setExtraStatus("saved");
    window.setTimeout(() => setExtraStatus("idle"), 1500);
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

  const handleAvatarSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !auth.session?.user) return;
    setAvatarUploading(true);
    setAvatarError(null);
    const { url, error } = await uploadAvatar(file, auth.session.user.id);
    if (error) {
      setAvatarError(error);
      setAvatarUploading(false);
      return;
    }
    if (url) await auth.updateAvatar(url);
    setAvatarUploading(false);
    if (avatarInputRef.current) avatarInputRef.current.value = "";
  };

  const handleRemoveAvatar = async () => {
    await auth.updateAvatar("");
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

  const handleCancelWithReason = async (order: OrderRow) => {
    if (!cancelReasonText.trim()) {
      setCancelError("Iltimos, sababni yozing.");
      return;
    }
    setCancelSubmitting(true);
    setCancelError(null);
    const { error } = await supabase
      .from("orders")
      .update({ status: "bekor_sorovi", cancel_reason: cancelReasonText.trim() })
      .eq("id", order.id);
    setCancelSubmitting(false);
    if (error) {
      setCancelError("Xatolik yuz berdi, qaytadan urinib ko'ring.");
      return;
    }
    setOrders((prev) =>
      prev
        ? prev.map((o) =>
            o.id === order.id ? { ...o, status: "bekor_sorovi", cancel_reason: cancelReasonText.trim() } : o
          )
        : prev
    );
    setCancelReasonOrderId(null);
    setCancelReasonText("");
  };

  const startEditOrder = (order: OrderRow) => {
    setEditingOrderId(order.id);
    setEditItems(order.items.map((it) => ({ ...it })));
    setEditError(null);
  };

  const cancelEditOrder = () => {
    setEditingOrderId(null);
    setEditItems(null);
    setEditError(null);
  };

  const editStepFor = (itemId: string) => {
    const product = allProducts?.find((p) => p.id === itemId);
    return product?.packSize && product.packSize > 0 ? product.packSize : 1;
  };

  const adjustEditQty = (itemId: string, direction: 1 | -1) => {
    setEditItems((prev) =>
      prev
        ? prev.map((it) => {
            if (it.id !== itemId) return it;
            const step = editStepFor(itemId);
            return { ...it, qty: Math.max(step, it.qty + direction * step) };
          })
        : prev
    );
  };

  const removeEditItem = (itemId: string) => {
    setEditItems((prev) => (prev ? prev.filter((it) => it.id !== itemId) : prev));
  };

  const handleSaveEdit = async (order: OrderRow) => {
    if (!editItems || editItems.length === 0) {
      setEditError(
        "Buyurtmada kamida bitta mahsulot qolishi kerak. Butunlay bekor qilish uchun \"Bekor qilishni so'rash\"dan foydalaning."
      );
      return;
    }
    setEditSaving(true);
    setEditError(null);
    const newTotal = editItems.reduce((s, it) => s + it.price * it.qty, 0);
    const { error } = await supabase
      .from("orders")
      .update({ items: editItems, total: newTotal })
      .eq("id", order.id);
    setEditSaving(false);
    if (error) {
      setEditError("Saqlashda xatolik yuz berdi. Qaytadan urinib ko'ring.");
      return;
    }
    setOrders((prev) =>
      prev ? prev.map((o) => (o.id === order.id ? { ...o, items: editItems, total: newTotal } : o)) : prev
    );
    setEditingOrderId(null);
    setEditItems(null);
  };

  const handleReorder = (order: OrderRow) => {
    if (!allProducts) return;
    let addedCount = 0;
    let missingCount = 0;

    for (const item of order.items) {
      const product = allProducts.find((p) => p.id === item.id);
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

  const handleDeleteReview = async (id: string) => {
    if (!window.confirm("Bu sharhni o'chirmoqchimisiz?")) return;
    await deleteComment(id);
    setReviews((prev) => (prev ? prev.filter((r) => r.id !== id) : prev));
  };

  const activeOrders = (orders ?? []).filter((o) => !CANCELLED_STATUSES.includes(o.status));
  const cancelledOrders = (orders ?? []).filter((o) => CANCELLED_STATUSES.includes(o.status));
  const totalSpent = activeOrders.reduce((s, o) => s + o.total, 0);

  const screenTitles: Record<Exclude<Screen, "home">, string> = {
    settings: "Sozlamalar",
    orders: "Buyurtmalarim",
    cancelled: "Bekor qilingan buyurtmalar",
    reviews: "Sharhlarim",
    branches: "Filiallarim"
  };

  const renderOrderRow = (order: OrderRow) => {
    const expanded = expandedOrder === order.id;
    return (
      <div key={order.id} className="border border-ink/8 rounded-xl overflow-hidden">
        <div
          role="button"
          tabIndex={0}
          onClick={() => setExpandedOrder(expanded ? null : order.id)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") setExpandedOrder(expanded ? null : order.id);
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
            <span
              className={`text-[11px] font-bold uppercase px-2 py-1 rounded-md ${
                statusColors[order.status] ?? "bg-ink/5 text-ink/60"
              }`}
            >
              {statusLabels[order.status] ?? order.status}
            </span>
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
                {editingOrderId === order.id ? (
                  <div className="flex flex-col gap-2">
                    {(editItems ?? []).map((it) => (
                      <div key={it.id} className="flex items-center justify-between gap-2 text-sm">
                        <span className="text-ink/70 font-medium flex-1 min-w-0 truncate">{it.name}</span>
                        <div className="flex items-center border border-ink/15 rounded-lg shrink-0">
                          <button
                            onClick={() => adjustEditQty(it.id, -1)}
                            className="p-1.5 hover:bg-white"
                            aria-label="Kamaytirish"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="px-2 text-center font-mono text-xs font-bold whitespace-nowrap">
                            {it.qty} {it.unit}
                          </span>
                          <button
                            onClick={() => adjustEditQty(it.id, 1)}
                            className="p-1.5 hover:bg-white"
                            aria-label="Ko'paytirish"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                        <span className="font-semibold text-ink w-20 text-right shrink-0">
                          {(it.price * it.qty).toLocaleString("uz-UZ")} so'm
                        </span>
                        <button
                          onClick={() => removeEditItem(it.id)}
                          className="text-ink/30 hover:text-danger transition-colors shrink-0"
                          aria-label="O'chirish"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}

                    <div className="flex items-center justify-between text-sm font-bold text-ink pt-2 border-t border-ink/8 mt-1">
                      <span>Yangi jami</span>
                      <span>{(editItems ?? []).reduce((s, it) => s + it.price * it.qty, 0).toLocaleString("uz-UZ")} so'm</span>
                    </div>

                    {editError && <p className="text-xs text-danger font-semibold">{editError}</p>}

                    <div className="flex gap-2 mt-1">
                      <button
                        onClick={cancelEditOrder}
                        disabled={editSaving}
                        className="flex-1 border-2 border-ink/15 text-ink/60 font-bold text-xs py-2 rounded-lg hover:bg-ink/5 transition-colors disabled:opacity-70"
                      >
                        Bekor qilish
                      </button>
                      <button
                        onClick={() => handleSaveEdit(order)}
                        disabled={editSaving}
                        className="flex-1 flex items-center justify-center gap-1.5 bg-brand-500 text-white font-bold text-xs py-2 rounded-lg hover:bg-brand-600 transition-colors disabled:opacity-70"
                      >
                        {editSaving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                        Saqlash
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
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
                      <p className="text-xs text-ink/45 mt-2 pt-2 border-t border-ink/8">Manzil: {order.address}</p>
                    )}
                    {order.payment_method && (
                      <p className="text-xs text-ink/45">
                        To'lov: {order.payment_method === "karta" ? "Karta orqali" : "Naqd pul"}
                      </p>
                    )}

                    {order.status === "bekor_sorovi" && order.cancel_reason && (
                      <p className="text-xs text-amber font-medium bg-amber-light rounded-lg p-2.5">
                        Bekor qilish so'rovingiz ko'rib chiqilmoqda. Sabab: "{order.cancel_reason}"
                      </p>
                    )}
                    {order.status === "bekor" && order.cancel_reason && (
                      <p className="text-xs text-ink/40 font-medium">Bekor qilish sababi: {order.cancel_reason}</p>
                    )}

                    {canEditOrder(order.status) && (
                      <button
                        onClick={() => startEditOrder(order)}
                        className="w-full flex items-center justify-center gap-2 border-2 border-brand-500/25 text-brand-600 font-bold text-xs py-2.5 rounded-lg hover:bg-brand-50 transition-colors mt-1"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                        Buyurtmani tahrirlash
                      </button>
                    )}
                  </>
                )}

                {editingOrderId !== order.id && canRequestCancel(order.status) && (
                  <div className="pt-1">
                    {cancelReasonOrderId === order.id ? (
                      <div className="flex flex-col gap-2">
                        <p className="text-xs text-ink/50 font-medium">
                          Nega bekor qilmoqchisiz? Sababni yozing — buni administrator ko'rib chiqadi.
                        </p>
                        <textarea
                          value={cancelReasonText}
                          onChange={(e) => setCancelReasonText(e.target.value)}
                          rows={2}
                          placeholder="Nega bekor qilmoqchisiz?"
                          className="w-full border border-ink/15 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:border-brand-400 resize-none"
                        />
                        {cancelError && <p className="text-xs text-danger font-semibold">{cancelError}</p>}
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              setCancelReasonOrderId(null);
                              setCancelReasonText("");
                              setCancelError(null);
                            }}
                            className="flex-1 border-2 border-ink/15 text-ink/60 font-bold text-xs py-2 rounded-lg hover:bg-ink/5 transition-colors"
                          >
                            Yopish
                          </button>
                          <button
                            onClick={() => handleCancelWithReason(order)}
                            disabled={cancelSubmitting}
                            className="flex-1 flex items-center justify-center gap-1.5 bg-danger text-white font-bold text-xs py-2 rounded-lg hover:bg-danger/90 transition-colors disabled:opacity-70"
                          >
                            {cancelSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                            So'rovni yuborish
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => setCancelReasonOrderId(order.id)}
                        disabled={cancelSubmitting}
                        className="w-full flex items-center justify-center gap-2 border-2 border-danger/25 text-danger font-bold text-xs py-2.5 rounded-lg hover:bg-danger/5 transition-colors disabled:opacity-70"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        Bekor qilishni so'rash
                      </button>
                    )}
                  </div>
                )}

                {editingOrderId !== order.id && (
                  <button
                    onClick={() => handleReorder(order)}
                    className="flex items-center justify-center gap-2 bg-brand-500 text-white font-bold text-sm py-2.5 rounded-lg hover:bg-brand-600 transition-colors mt-1"
                  >
                    <RotateCcw className="w-4 h-4" /> Qayta buyurtma qilish
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  };

  if (!mounted) return null;

  return createPortal(
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
            {screen === "home" ? (
              <div className="relative bg-brand-gradient px-5 pt-5 pb-6 shrink-0">
                <div className="flex items-center justify-between mb-6">
                  <button
                    onClick={() => setScreen("settings")}
                    className="p-2 rounded-lg bg-white/15 hover:bg-white/25 transition-colors"
                    aria-label="Sozlamalar"
                  >
                    <Settings className="w-5 h-5 text-white" />
                  </button>
                  <span className="font-display font-extrabold text-white text-lg">Profil</span>
                  <button
                    onClick={handleClose}
                    className="p-2 rounded-lg bg-white/15 hover:bg-white/25 transition-colors"
                    aria-label="Yopish"
                  >
                    <X className="w-5 h-5 text-white" />
                  </button>
                </div>

                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-white/20 border-2 border-white/40 flex items-center justify-center overflow-hidden shrink-0">
                    {auth.user?.avatarUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={auth.user.avatarUrl} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span className="font-display font-extrabold text-xl text-white">
                        {initialsOf(auth.user?.name ?? "")}
                      </span>
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="font-display font-extrabold text-white text-lg truncate">{auth.user?.name}</p>
                    <p className="text-white/75 text-sm font-medium">{auth.user?.phone}</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between px-5 py-4 border-b border-ink/8 shrink-0">
                <div className="flex items-center gap-2">
                  <button onClick={() => setScreen("home")} className="p-1 -ml-1">
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                  <h3 className="font-display font-extrabold text-lg text-ink">{screenTitles[screen]}</h3>
                </div>
                <button onClick={handleClose} aria-label="Yopish" className="p-1.5 hover:bg-surface rounded-lg">
                  <X className="w-5 h-5" />
                </button>
              </div>
            )}

            <div className="flex-1 overflow-y-auto">
              {screen === "home" && (
                <div className="px-5 pt-5 pb-5">
                  <button
                    onClick={() => setScreen("orders")}
                    className="w-full bg-white rounded-2xl shadow-card p-4 flex items-center justify-between text-left mb-5"
                  >
                    <div>
                      {ordersLoading && orders === null ? (
                        <p className="font-bold text-sm text-ink/40">Yuklanmoqda...</p>
                      ) : activeOrders.length === 0 ? (
                        <>
                          <p className="font-bold text-ink">Hali buyurtma yo'q</p>
                          <p className="text-xs text-ink/45 font-medium mt-0.5">
                            Birinchi buyurtmangizni bering!
                          </p>
                        </>
                      ) : (
                        <>
                          <p className="font-bold text-ink">{activeOrders.length} ta buyurtma berildi</p>
                          <p className="text-xs text-ink/45 font-medium mt-0.5">
                            Jami {totalSpent.toLocaleString("uz-UZ")} so'mlik xarid qilingan
                          </p>
                        </>
                      )}
                    </div>
                    <ChevronRight className="w-5 h-5 text-ink/30 shrink-0" />
                  </button>

                  <div className="flex flex-col gap-1">
                    {[
                      { icon: ShoppingBag, label: "Buyurtmalarim", onClick: () => setScreen("orders") },
                      { icon: XCircle, label: "Bekor qilingan buyurtmalar", onClick: () => setScreen("cancelled") },
                      {
                        icon: Heart,
                        label: "Yoqtirganlarim",
                        onClick: () => {
                          handleClose();
                          onOpenFavorites();
                        }
                      },
                      { icon: MessageCircle, label: "Sharhlarim", onClick: () => setScreen("reviews") },
                      { icon: MapPin, label: "Filiallarim", onClick: () => setScreen("branches") }
                    ].map((item) => (
                      <button
                        key={item.label}
                        onClick={item.onClick}
                        className="w-full flex items-center gap-3 px-3 py-3.5 rounded-xl hover:bg-surface transition-colors text-left"
                      >
                        <span className="w-9 h-9 rounded-lg bg-brand-50 flex items-center justify-center shrink-0">
                          <item.icon className="w-4 h-4 text-brand-600" />
                        </span>
                        <span className="flex-1 font-semibold text-sm text-ink">{item.label}</span>
                        <ChevronRight className="w-4 h-4 text-ink/25" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {screen === "settings" && (
                <div className="p-5 flex flex-col gap-6">
                  <div className="flex flex-col items-center gap-3">
                    <div className="relative w-20 h-20">
                      <div className="w-20 h-20 rounded-full bg-surface border border-ink/10 flex items-center justify-center overflow-hidden">
                        {auth.user?.avatarUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={auth.user.avatarUrl} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <span className="font-display font-extrabold text-2xl text-ink/30">
                            {initialsOf(auth.user?.name ?? "")}
                          </span>
                        )}
                      </div>
                      <button
                        onClick={() => avatarInputRef.current?.click()}
                        disabled={avatarUploading}
                        className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-brand-500 border-2 border-white flex items-center justify-center hover:bg-brand-600 transition-colors"
                        aria-label="Rasmni o'zgartirish"
                      >
                        {avatarUploading ? (
                          <Loader2 className="w-3.5 h-3.5 text-white animate-spin" />
                        ) : (
                          <Camera className="w-3.5 h-3.5 text-white" />
                        )}
                      </button>
                      <input
                        ref={avatarInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleAvatarSelect}
                        className="hidden"
                      />
                    </div>
                    {auth.user?.avatarUrl && (
                      <button
                        onClick={handleRemoveAvatar}
                        className="text-xs text-danger font-semibold hover:underline"
                      >
                        Rasmni olib tashlash
                      </button>
                    )}
                    {avatarError && <p className="text-xs text-danger font-semibold text-center">{avatarError}</p>}
                  </div>

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
                      <label className="text-xs font-bold uppercase tracking-wide text-ink/45">Tashkilot nomi</label>
                      <div className="relative mt-1">
                        <input
                          value={companyName}
                          onChange={(e) => setCompanyName(e.target.value)}
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

                  <form onSubmit={handleSaveExtra} className="flex flex-col gap-3">
                    <h4 className="font-bold text-sm text-ink">Qo'shimcha ma'lumot (ixtiyoriy)</h4>
                    <div>
                      <label className="text-xs font-bold uppercase tracking-wide text-ink/45">Tug'ilgan sana</label>
                      <input
                        type="date"
                        value={birthDate}
                        onChange={(e) => setBirthDate(e.target.value)}
                        className="mt-1 w-full border border-ink/15 rounded-lg px-3.5 py-2.5 bg-white focus:outline-none focus:border-brand-400"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold uppercase tracking-wide text-ink/45">Jins</label>
                      <select
                        value={gender}
                        onChange={(e) => setGender(e.target.value as "" | "male" | "female")}
                        className="mt-1 w-full border border-ink/15 rounded-lg px-3.5 py-2.5 bg-white focus:outline-none focus:border-brand-400"
                      >
                        <option value="">Ko'rsatilmagan</option>
                        <option value="male">Erkak</option>
                        <option value="female">Ayol</option>
                      </select>
                    </div>
                    <button
                      type="submit"
                      disabled={extraStatus === "saving"}
                      className="flex items-center justify-center gap-2 border-2 border-ink text-ink font-bold py-2.5 rounded-lg hover:bg-ink hover:text-white transition-colors disabled:opacity-70"
                    >
                      {extraStatus === "saving" && <Loader2 className="w-4 h-4 animate-spin" />}
                      {extraStatus === "saved" && <CheckCircle2 className="w-4 h-4" />}
                      {extraStatus === "saving" ? "Saqlanmoqda..." : extraStatus === "saved" ? "Saqlandi" : "Saqlash"}
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

              {(screen === "orders" || screen === "cancelled") && (
                <div className="p-5 flex flex-col gap-3">
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

                  {ordersLoading && orders === null && (
                    <div className="flex items-center justify-center py-16 text-ink/40">
                      <Loader2 className="w-6 h-6 animate-spin" />
                    </div>
                  )}

                  {orders !== null &&
                    (screen === "orders" ? activeOrders : cancelledOrders).length === 0 &&
                    !ordersLoading && (
                      <div className="flex flex-col items-center justify-center text-center py-16 text-ink/40">
                        {screen === "orders" ? (
                          <ShoppingBag className="w-10 h-10 mb-3" />
                        ) : (
                          <XCircle className="w-10 h-10 mb-3" />
                        )}
                        <p className="font-semibold">
                          {screen === "orders" ? "Hali buyurtmalar yo'q" : "Bekor qilingan buyurtma yo'q"}
                        </p>
                      </div>
                    )}

                  {(screen === "orders" ? activeOrders : cancelledOrders).map(renderOrderRow)}
                </div>
              )}

              {screen === "reviews" && (
                <div className="p-5 flex flex-col gap-3">
                  {reviewsLoading && reviews === null && (
                    <div className="flex items-center justify-center py-16 text-ink/40">
                      <Loader2 className="w-6 h-6 animate-spin" />
                    </div>
                  )}

                  {reviews !== null && reviews.length === 0 && !reviewsLoading && (
                    <div className="flex flex-col items-center justify-center text-center py-16 text-ink/40">
                      <Star className="w-10 h-10 mb-3" />
                      <p className="font-semibold">Hali sharh yozmagansiz</p>
                      <p className="text-sm mt-1">Mahsulot sahifasida fikringizni bildiring.</p>
                    </div>
                  )}

                  {reviews?.map((r) => (
                    <div key={r.id} className="flex gap-3 border border-ink/8 rounded-xl p-3">
                      <div className="w-12 h-12 bg-surface rounded-lg p-2 shrink-0 overflow-hidden">
                        <ProductImage imageUrl={r.productImageUrl} art={r.productImage} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className="font-bold text-xs text-ink truncate">{r.productName}</p>
                          <button
                            onClick={() => handleDeleteReview(r.id)}
                            className="text-ink/25 hover:text-danger transition-colors shrink-0"
                            aria-label="O'chirish"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <p className="text-sm text-ink/70 leading-relaxed mt-1">{r.body}</p>
                        <p className="text-[11px] text-ink/35 mt-1">
                          {new Date(r.createdAt).toLocaleDateString("uz-UZ")}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {screen === "branches" && (
                <div className="p-5 flex flex-col gap-3">
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
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
}
