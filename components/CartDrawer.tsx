"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  ShoppingBag,
  ArrowLeft,
  CheckCircle2,
  Loader2,
  UserPlus,
  Lock,
  LogIn,
  AlertCircle,
  Building2,
  MapPin,
  Navigation,
  Check,
  Wallet,
  CreditCard,
  Upload,
  Copy
} from "lucide-react";
import { useCart } from "./CartProvider";
import { useAuth } from "./AuthProvider";
import { supabase } from "@/lib/supabase/client";
import type { BranchRow, PaymentCardRow } from "@/lib/supabase/types";
import { fetchActivePaymentCards } from "@/lib/supabase/paymentCards";
import { uploadPaymentReceipt } from "@/lib/supabase/storage";
import CartItemCard from "./CartItemCard";
import TermsCheckbox from "./TermsCheckbox";

type Step = "cart" | "auth" | "checkout" | "success";
type AuthMode = "register" | "login";
type GeoStatus = "idle" | "loading" | "granted" | "denied" | "error";

export default function CartDrawer() {
  const { items, isOpen, closeCart, setQty, removeItem, totalSum, totalCount, clearCart } = useCart();
  const auth = useAuth();
  const [step, setStep] = useState<Step>("cart");
  const [authMode, setAuthMode] = useState<AuthMode>("register");
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [orderError, setOrderError] = useState<string | null>(null);
  const [regForm, setRegForm] = useState({ name: "", phone: "", password: "", companyName: "" });
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [form, setForm] = useState({ name: "", phone: "", address: "", note: "" });
  const [paymentMethod, setPaymentMethod] = useState<"naqd" | "karta">("naqd");
  const [paymentCards, setPaymentCards] = useState<PaymentCardRow[] | null>(null);
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null);
  const [copiedCardId, setCopiedCardId] = useState<string | null>(null);

  const [branches, setBranches] = useState<BranchRow[] | null>(null);
  const [selectedBranch, setSelectedBranch] = useState<string>("new");
  const [newBranchName, setNewBranchName] = useState("");
  const [saveBranch, setSaveBranch] = useState(true);
  const [geo, setGeo] = useState<{ lat: number; lng: number } | null>(null);
  const [geoStatus, setGeoStatus] = useState<GeoStatus>("idle");

  useEffect(() => {
    if (paymentMethod === "karta" && paymentCards === null) {
      fetchActivePaymentCards().then(setPaymentCards);
    }
  }, [paymentMethod, paymentCards]);

  const handleClose = () => {
    closeCart();
    window.setTimeout(() => {
      setStep("cart");
      setAuthError(null);
      setOrderError(null);
      setBranches(null);
      setSelectedBranch("new");
      setNewBranchName("");
      setGeo(null);
      setGeoStatus("idle");
      setAcceptedTerms(false);
      setPaymentMethod("naqd");
      setReceiptFile(null);
      setReceiptPreview(null);
    }, 300);
  };

  const handleReceiptSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setReceiptFile(file);
    setReceiptPreview(URL.createObjectURL(file));
  };

  const handleCopyCard = async (card: PaymentCardRow) => {
    try {
      await navigator.clipboard.writeText(card.card_number.replace(/\s+/g, ""));
      setCopiedCardId(card.id);
      window.setTimeout(() => setCopiedCardId(null), 1800);
    } catch {
      // clipboard mavjud bo'lmasa jimgina o'tkazamiz
    }
  };

  useEffect(() => {
    if (step === "checkout" && auth.session && branches === null) {
      supabase
        .from("branches")
        .select("*")
        .eq("user_id", auth.session.user.id)
        .order("created_at", { ascending: false })
        .then(({ data }) => {
          const list = (data as BranchRow[]) ?? [];
          setBranches(list);
          if (list.length > 0) setSelectedBranch(list[0].id);
        });
    }
  }, [step, auth.session, branches]);

  const handleShareLocation = () => {
    if (!navigator.geolocation) {
      setGeoStatus("error");
      return;
    }
    setGeoStatus("loading");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGeo({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setGeoStatus("granted");
      },
      () => setGeoStatus("denied"),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const goToCheckout = () => {
    if (auth.isAuthenticated && auth.user) {
      setForm((f) => ({ ...f, name: f.name || auth.user!.name, phone: f.phone || auth.user!.phone }));
      setStep("checkout");
    } else {
      setAuthError(null);
      setStep("auth");
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!acceptedTerms) {
      setAuthError("Davom etish uchun Ommaviy oferta shartlariga rozilik bildirishingiz kerak.");
      return;
    }
    setAuthError(null);
    setAuthLoading(true);
    const { error } = await auth.register(regForm);
    setAuthLoading(false);
    if (error) {
      setAuthError(error);
      return;
    }
    setAcceptedTerms(false);
    setForm((f) => ({ ...f, name: regForm.name, phone: regForm.phone }));
    setStep("checkout");
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setAuthLoading(true);
    const { error } = await auth.login({ phone: regForm.phone, password: regForm.password });
    setAuthLoading(false);
    if (error) {
      setAuthError(error);
      return;
    }
    setStep("checkout");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.session) {
      setOrderError("Sessiya tugagan. Iltimos, qaytadan kiring.");
      setStep("auth");
      return;
    }
    if (items.length === 0) {
      setOrderError("Savat bo'sh — buyurtma berish uchun kamida bitta mahsulot qoldiring.");
      return;
    }
    if (paymentMethod === "karta" && !receiptFile) {
      setOrderError("Karta orqali to'laganingizni tasdiqlash uchun chek skrinshotini yuklang.");
      return;
    }
    setOrderError(null);
    setSubmitting(true);

    let receiptPath: string | null = null;
    if (paymentMethod === "karta" && receiptFile) {
      const { path, error: uploadError } = await uploadPaymentReceipt(receiptFile, auth.session.user.id);
      if (uploadError || !path) {
        setSubmitting(false);
        setOrderError(uploadError ?? "Chekni yuklashda xatolik yuz berdi.");
        return;
      }
      receiptPath = path;
    }

    let branchId: string | null = null;
    let branchName: string | null = null;
    let addressToSave = form.address;

    const existingBranch = branches?.find((b) => b.id === selectedBranch) ?? null;

    if (existingBranch) {
      branchId = existingBranch.id;
      branchName = existingBranch.name;
      addressToSave = existingBranch.address;
    } else {
      branchName = newBranchName || null;
      if (saveBranch && form.address) {
        const { data: newBranch } = await supabase
          .from("branches")
          .insert({
            user_id: auth.session.user.id,
            name: newBranchName || "Filial",
            address: form.address,
            latitude: geo?.lat ?? null,
            longitude: geo?.lng ?? null
          })
          .select()
          .single();
        if (newBranch) {
          branchId = newBranch.id;
          branchName = newBranch.name;
        }
      }
    }

    const { error } = await supabase.from("orders").insert({
      user_id: auth.session.user.id,
      items: items.map((i) => ({
        id: i.product.id,
        name: i.product.name,
        price: i.product.price,
        qty: i.qty,
        unit: i.product.unit
      })),
      total: totalSum,
      address: addressToSave,
      note: form.note || null,
      branch_id: branchId,
      branch_name: branchName,
      latitude: geo?.lat ?? null,
      longitude: geo?.lng ?? null,
      payment_method: paymentMethod,
      payment_receipt_path: receiptPath,
      payment_status: paymentMethod === "karta" ? "kutilmoqda" : "none"
    });

    setSubmitting(false);

    if (error) {
      setOrderError("Buyurtmani saqlashda xatolik yuz berdi: " + error.message);
      return;
    }

    clearCart();
    setStep("success");
  };

  const titles: Record<Step, string> = {
    cart: `Savat (${totalCount})`,
    auth: authMode === "register" ? "Ro'yxatdan o'tish" : "Kirish",
    checkout: "Buyurtma ma'lumotlari",
    success: "Qabul qilindi"
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
              <div className="flex items-center gap-2">
                {(step === "checkout" || step === "auth") && (
                  <button onClick={() => setStep("cart")} className="p-1 -ml-1">
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                )}
                <h3 className="font-display font-extrabold text-lg text-ink">{titles[step]}</h3>
              </div>
              <button onClick={handleClose} aria-label="Yopish" className="p-1.5 hover:bg-surface rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">
              {step === "cart" && (
                <div className="p-5">
                  {items.length === 0 ? (
                    <div className="flex flex-col items-center justify-center text-center py-20 text-ink/40">
                      <ShoppingBag className="w-10 h-10 mb-3" />
                      <p className="font-semibold">Savat hozircha bo'sh</p>
                      <p className="text-sm mt-1">Katalogdan mahsulot qo'shing.</p>
                    </div>
                  ) : (
                    <>
                      <div className="mb-5">
                        <h4 className="font-display font-extrabold text-lg text-ink">
                          Buyurtmangizni rasmiylashtiring
                        </h4>
                        <p className="text-sm text-ink/50 font-medium mt-1 leading-relaxed">
                          Yetkazib berish manzilini va to'lov usulini tanlang. Buyurtmangizni tasdiqlaganimizdan
                          keyin tayyorlashni boshlaymiz.
                        </p>
                      </div>

                      <p className="text-xs font-bold uppercase tracking-wide text-ink/40 mb-3">
                        1. Savatni tekshiring
                      </p>

                      <div className="flex flex-col gap-3">
                        <AnimatePresence initial={false}>
                          {items.map((item) => (
                            <motion.div
                              key={item.product.id}
                              layout
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: "auto" }}
                              exit={{ opacity: 0, height: 0 }}
                            >
                              <CartItemCard
                                item={item}
                                onQtyChange={(qty) => setQty(item.product.id, qty)}
                                onRemove={() => removeItem(item.product.id)}
                              />
                            </motion.div>
                          ))}
                        </AnimatePresence>
                      </div>
                    </>
                  )}
                </div>
              )}

              {step === "auth" && (
                <div className="p-5">
                  <div className="flex items-start gap-3 bg-brand-50 border border-brand-100 rounded-xl p-4 mb-5">
                    {authMode === "register" ? (
                      <UserPlus className="w-5 h-5 text-brand-600 shrink-0 mt-0.5" />
                    ) : (
                      <LogIn className="w-5 h-5 text-brand-600 shrink-0 mt-0.5" />
                    )}
                    <p className="text-sm text-ink/70 font-medium leading-relaxed">
                      {authMode === "register"
                        ? "Buyurtmani rasmiylashtirish uchun avval ro'yxatdan o'ting. Bu atigi 30 soniya vaqt oladi."
                        : "Ro'yxatdan o'tgan bo'lsangiz, telefon raqam va parolingiz bilan kiring."}
                    </p>
                  </div>

                  <div className="flex gap-2 mb-5 bg-surface rounded-lg p-1">
                    <button
                      onClick={() => {
                        setAuthMode("register");
                        setAuthError(null);
                      }}
                      className={`flex-1 py-2 rounded-md text-sm font-bold transition-colors ${
                        authMode === "register" ? "bg-white text-ink shadow-sm" : "text-ink/50"
                      }`}
                    >
                      Ro'yxatdan o'tish
                    </button>
                    <button
                      onClick={() => {
                        setAuthMode("login");
                        setAuthError(null);
                      }}
                      className={`flex-1 py-2 rounded-md text-sm font-bold transition-colors ${
                        authMode === "login" ? "bg-white text-ink shadow-sm" : "text-ink/50"
                      }`}
                    >
                      Kirish
                    </button>
                  </div>

                  <AnimatePresence>
                    {authError && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="flex items-start gap-2 bg-danger/10 border border-danger/20 text-danger text-sm font-medium rounded-lg p-3 mb-4 overflow-hidden"
                      >
                        <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                        <span>{authError}</span>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {authMode === "register" ? (
                    <form id="auth-form" onSubmit={handleRegister} className="flex flex-col gap-4">
                      <div>
                        <label className="text-xs font-bold uppercase tracking-wide text-ink/45">
                          Tashkilot nomi
                        </label>
                        <div className="relative mt-1">
                          <input
                            required
                            value={regForm.companyName}
                            onChange={(e) => setRegForm({ ...regForm, companyName: e.target.value })}
                            className="w-full border border-ink/15 rounded-lg pl-9 pr-3.5 py-2.5 bg-white focus:outline-none focus:border-brand-400"
                            placeholder="Masalan: «Tez Osh» fast-food"
                          />
                          <Building2 className="w-4 h-4 text-ink/30 absolute left-3 top-1/2 -translate-y-1/2" />
                        </div>
                      </div>
                      <div>
                        <label className="text-xs font-bold uppercase tracking-wide text-ink/45">Ism-familiya</label>
                        <input
                          required
                          value={regForm.name}
                          onChange={(e) => setRegForm({ ...regForm, name: e.target.value })}
                          className="mt-1 w-full border border-ink/15 rounded-lg px-3.5 py-2.5 bg-white focus:outline-none focus:border-brand-400"
                          placeholder="Ism Familiya"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-bold uppercase tracking-wide text-ink/45">Telefon raqam</label>
                        <input
                          required
                          type="tel"
                          value={regForm.phone}
                          onChange={(e) => setRegForm({ ...regForm, phone: e.target.value })}
                          className="mt-1 w-full border border-ink/15 rounded-lg px-3.5 py-2.5 bg-white focus:outline-none focus:border-brand-400"
                          placeholder="+998 90 123 45 67"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-bold uppercase tracking-wide text-ink/45">Parol</label>
                        <div className="relative mt-1">
                          <input
                            required
                            type="password"
                            value={regForm.password}
                            onChange={(e) => setRegForm({ ...regForm, password: e.target.value })}
                            className="w-full border border-ink/15 rounded-lg pl-9 pr-3.5 py-2.5 bg-white focus:outline-none focus:border-brand-400"
                            placeholder="Kamida 6 ta belgi"
                            minLength={6}
                          />
                          <Lock className="w-4 h-4 text-ink/30 absolute left-3 top-1/2 -translate-y-1/2" />
                        </div>
                      </div>
                      <TermsCheckbox checked={acceptedTerms} onChange={setAcceptedTerms} />
                    </form>
                  ) : (
                    <form id="auth-form" onSubmit={handleLogin} className="flex flex-col gap-4">
                      <div>
                        <label className="text-xs font-bold uppercase tracking-wide text-ink/45">Telefon raqam</label>
                        <input
                          required
                          type="tel"
                          value={regForm.phone}
                          onChange={(e) => setRegForm({ ...regForm, phone: e.target.value })}
                          className="mt-1 w-full border border-ink/15 rounded-lg px-3.5 py-2.5 bg-white focus:outline-none focus:border-brand-400"
                          placeholder="+998 90 123 45 67"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-bold uppercase tracking-wide text-ink/45">Parol</label>
                        <div className="relative mt-1">
                          <input
                            required
                            type="password"
                            value={regForm.password}
                            onChange={(e) => setRegForm({ ...regForm, password: e.target.value })}
                            className="w-full border border-ink/15 rounded-lg pl-9 pr-3.5 py-2.5 bg-white focus:outline-none focus:border-brand-400"
                            placeholder="Parolingiz"
                          />
                          <Lock className="w-4 h-4 text-ink/30 absolute left-3 top-1/2 -translate-y-1/2" />
                        </div>
                      </div>
                    </form>
                  )}
                </div>
              )}

              {step === "checkout" && (
                <form id="checkout-form" onSubmit={handleSubmit} className="p-5 flex flex-col gap-4">
                  <AnimatePresence>
                    {orderError && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="flex items-start gap-2 bg-danger/10 border border-danger/20 text-danger text-sm font-medium rounded-lg p-3 overflow-hidden"
                      >
                        <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                        <span>{orderError}</span>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div className="bg-surface/60 rounded-xl p-3.5">
                    <p className="text-xs font-bold uppercase tracking-wide text-ink/40 mb-2">Buyurtma tarkibi</p>
                    <div className="flex flex-col gap-3">
                      {items.map((item) => (
                        <CartItemCard
                          key={item.product.id}
                          item={item}
                          onQtyChange={(qty) => setQty(item.product.id, qty)}
                          onRemove={() => removeItem(item.product.id)}
                        />
                      ))}
                    </div>
                    <div className="flex items-center justify-between text-sm font-bold text-ink pt-3 mt-1 border-t border-ink/8">
                      <span>Jami</span>
                      <span>{totalSum.toLocaleString("uz-UZ")} so'm</span>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold uppercase tracking-wide text-ink/45">Ism-familiya</label>
                    <input
                      required
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      className="mt-1 w-full border border-ink/15 rounded-lg px-3.5 py-2.5 bg-white focus:outline-none focus:border-brand-400"
                      placeholder="Ism Familiya"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wide text-ink/45">Telefon raqam</label>
                    <input
                      required
                      type="tel"
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      className="mt-1 w-full border border-ink/15 rounded-lg px-3.5 py-2.5 bg-white focus:outline-none focus:border-brand-400"
                      placeholder="+998 90 123 45 67"
                    />
                  </div>
                  {branches && branches.length > 0 && (
                    <div>
                      <label className="text-xs font-bold uppercase tracking-wide text-ink/45">
                        Qaysi filial uchun?
                      </label>
                      <select
                        value={selectedBranch}
                        onChange={(e) => setSelectedBranch(e.target.value)}
                        className="mt-1 w-full border border-ink/15 rounded-lg px-3.5 py-2.5 bg-white focus:outline-none focus:border-brand-400"
                      >
                        {branches.map((b) => (
                          <option key={b.id} value={b.id}>
                            {b.name} — {b.address}
                          </option>
                        ))}
                        <option value="new">+ Yangi manzil kiritish</option>
                      </select>
                    </div>
                  )}

                  {selectedBranch === "new" && (
                    <>
                      <div>
                        <label className="text-xs font-bold uppercase tracking-wide text-ink/45">
                          Filial nomi (ixtiyoriy)
                        </label>
                        <input
                          value={newBranchName}
                          onChange={(e) => setNewBranchName(e.target.value)}
                          className="mt-1 w-full border border-ink/15 rounded-lg px-3.5 py-2.5 bg-white focus:outline-none focus:border-brand-400"
                          placeholder="Masalan: Chilonzor filiali"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-bold uppercase tracking-wide text-ink/45">
                          Yetkazish manzili
                        </label>
                        <input
                          required
                          value={form.address}
                          onChange={(e) => setForm({ ...form, address: e.target.value })}
                          className="mt-1 w-full border border-ink/15 rounded-lg px-3.5 py-2.5 bg-white focus:outline-none focus:border-brand-400"
                          placeholder="Shahar, tuman, ko'cha"
                        />
                      </div>
                      <label className="flex items-center gap-2 text-sm text-ink/60 font-medium">
                        <input
                          type="checkbox"
                          checked={saveBranch}
                          onChange={(e) => setSaveBranch(e.target.checked)}
                          className="w-4 h-4 accent-brand-500"
                        />
                        Bu manzilni keyingi safar uchun filial sifatida saqlash
                      </label>
                    </>
                  )}

                  <div>
                    <button
                      type="button"
                      onClick={handleShareLocation}
                      disabled={geoStatus === "loading"}
                      className={`w-full flex items-center justify-center gap-2 border-2 rounded-lg py-2.5 text-sm font-bold transition-colors ${
                        geoStatus === "granted"
                          ? "border-success text-success bg-success/5"
                          : "border-ink/15 text-ink/60 hover:border-brand-400 hover:text-brand-600"
                      }`}
                    >
                      {geoStatus === "loading" && <Loader2 className="w-4 h-4 animate-spin" />}
                      {geoStatus === "granted" && <Check className="w-4 h-4" />}
                      {geoStatus !== "loading" && geoStatus !== "granted" && <Navigation className="w-4 h-4" />}
                      {geoStatus === "loading"
                        ? "Aniqlanmoqda..."
                        : geoStatus === "granted"
                        ? "Joylashuv ulandi"
                        : "Joriy joylashuvni yuborish"}
                    </button>
                    {geoStatus === "denied" && (
                      <p className="text-xs text-danger mt-1.5">
                        Joylashuvga ruxsat berilmadi. Brauzer sozlamalaridan ruxsat berishingiz mumkin.
                      </p>
                    )}
                    {geoStatus === "error" && (
                      <p className="text-xs text-danger mt-1.5">Bu qurilmada geolokatsiya qo'llab-quvvatlanmaydi.</p>
                    )}
                    <p className="text-xs text-ink/40 mt-1.5">
                      Kuryerga aniq manzilni topishga yordam beradi (ixtiyoriy).
                    </p>
                  </div>
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wide text-ink/45">To'lov usuli</label>
                    <div className="flex gap-2 mt-1">
                      <button
                        type="button"
                        onClick={() => setPaymentMethod("naqd")}
                        className={`flex-1 flex items-center justify-center gap-2 text-sm font-bold py-2.5 rounded-lg border-2 transition-colors ${
                          paymentMethod === "naqd"
                            ? "bg-ink text-white border-ink"
                            : "border-ink/15 text-ink/60 hover:border-brand-400"
                        }`}
                      >
                        <Wallet className="w-4 h-4" /> Naqd pul
                      </button>
                      <button
                        type="button"
                        onClick={() => setPaymentMethod("karta")}
                        className={`flex-1 flex items-center justify-center gap-2 text-sm font-bold py-2.5 rounded-lg border-2 transition-colors ${
                          paymentMethod === "karta"
                            ? "bg-ink text-white border-ink"
                            : "border-ink/15 text-ink/60 hover:border-brand-400"
                        }`}
                      >
                        <CreditCard className="w-4 h-4" /> Karta orqali
                      </button>
                    </div>
                    {paymentMethod === "naqd" ? (
                      <p className="text-xs text-ink/40 mt-1.5">
                        To'lov yetkazib berish payti kuryerga naqd pul bilan amalga oshiriladi.
                      </p>
                    ) : (
                      <div className="mt-3 flex flex-col gap-3">
                        {paymentCards === null ? (
                          <div className="flex items-center gap-2 text-sm text-ink/40 font-medium py-2">
                            <Loader2 className="w-4 h-4 animate-spin" /> Kartalar yuklanmoqda...
                          </div>
                        ) : paymentCards.length === 0 ? (
                          <p className="text-xs text-danger font-medium bg-danger/10 rounded-lg p-3">
                            Hozircha to'lov kartasi kiritilmagan. Iltimos, "Naqd pul" usulini tanlang yoki
                            biz bilan bog'laning.
                          </p>
                        ) : (
                          <div className="flex flex-col gap-2">
                            {paymentCards.map((card) => (
                              <div
                                key={card.id}
                                className="flex items-center justify-between gap-2 border border-ink/15 rounded-lg px-3.5 py-2.5 bg-white"
                              >
                                <div className="min-w-0">
                                  <p className="font-mono font-bold text-sm text-ink">{card.card_number}</p>
                                  <p className="text-xs text-ink/45 font-medium truncate">
                                    {[card.bank_name, card.card_holder].filter(Boolean).join(" · ") || " "}
                                  </p>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => handleCopyCard(card)}
                                  className="flex items-center gap-1.5 text-xs font-bold text-brand-600 hover:text-brand-700 shrink-0"
                                >
                                  {copiedCardId === card.id ? (
                                    <>
                                      <Check className="w-3.5 h-3.5" /> Nusxalandi
                                    </>
                                  ) : (
                                    <>
                                      <Copy className="w-3.5 h-3.5" /> Nusxalash
                                    </>
                                  )}
                                </button>
                              </div>
                            ))}
                          </div>
                        )}

                        <div>
                          <label className="text-xs font-bold uppercase tracking-wide text-ink/45">
                            To'lov chekining skrinshoti
                          </label>
                          <label className="mt-1 flex items-center gap-2 border-2 border-dashed border-ink/15 rounded-lg px-3.5 py-3 cursor-pointer hover:border-brand-400 transition-colors">
                            <Upload className="w-4 h-4 text-ink/40 shrink-0" />
                            <span className="text-sm text-ink/60 font-medium truncate">
                              {receiptFile ? receiptFile.name : "Skrinshot tanlash..."}
                            </span>
                            <input type="file" accept="image/*" onChange={handleReceiptSelect} className="hidden" />
                          </label>
                          {receiptPreview && (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={receiptPreview}
                              alt=""
                              className="mt-2 max-h-40 rounded-lg border border-ink/10 object-contain"
                            />
                          )}
                          <p className="text-xs text-ink/40 mt-1.5">
                            Yuqoridagi kartaga o'tkazma qilib, chekning skrinshotini yuklang — admin tez
                            orada tekshirib tasdiqlaydi.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wide text-ink/45">Izoh (ixtiyoriy)</label>
                    <textarea
                      value={form.note}
                      onChange={(e) => setForm({ ...form, note: e.target.value })}
                      rows={3}
                      className="mt-1 w-full border border-ink/15 rounded-lg px-3.5 py-2.5 bg-white focus:outline-none focus:border-brand-400 resize-none"
                      placeholder="Yetkazish vaqti yoki qo'shimcha talablar"
                    />
                  </div>
                </form>
              )}

              {step === "success" && (
                <div className="flex flex-col items-center justify-center text-center py-20 px-6">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", bounce: 0.55, delay: 0.1 }}
                  >
                    <CheckCircle2 className="w-16 h-16 text-success" />
                  </motion.div>
                  <h4 className="font-display font-extrabold text-xl text-ink mt-4">
                    Rahmat, {form.name.split(" ")[0] || "mijoz"}!
                  </h4>
                  <p className="text-ink/50 text-sm mt-2 max-w-xs">
                    Buyurtmangiz xavfsiz saqlandi. Menejerimiz 15 daqiqa ichida{" "}
                    <span className="font-semibold text-ink">{form.phone}</span> raqamiga aloqaga chiqadi.
                  </p>
                  {paymentMethod === "karta" ? (
                    <p className="text-ink/40 text-xs mt-2 max-w-xs">
                      To'lov chekingiz qabul qilindi — admin tez orada tekshirib tasdiqlaydi.
                    </p>
                  ) : (
                    <p className="text-ink/40 text-xs mt-2 max-w-xs">
                      To'lov yetkazib berishda naqd pul bilan kuryerga amalga oshiriladi.
                    </p>
                  )}
                  <button
                    onClick={handleClose}
                    className="mt-6 bg-ink text-white font-bold px-6 py-3 rounded-lg hover:bg-brand-600 transition-colors"
                  >
                    Yopish
                  </button>
                </div>
              )}
            </div>

            {step === "cart" && items.length > 0 && (
              <div className="border-t border-ink/8 p-5 bg-surface/60">
                <div className="flex items-center justify-between mb-4">
                  <span className="font-bold text-ink/60 text-sm">Jami</span>
                  <span className="font-display font-extrabold text-xl text-ink">
                    {totalSum.toLocaleString("uz-UZ")} so'm
                  </span>
                </div>
                <button
                  onClick={goToCheckout}
                  className="w-full bg-brand-500 text-white font-bold py-3.5 rounded-lg hover:bg-brand-600 transition-colors"
                >
                  Rasmiylashtirish
                </button>
              </div>
            )}

            {step === "auth" && (
              <div className="border-t border-ink/8 p-5 bg-surface/60">
                <button
                  form="auth-form"
                  type="submit"
                  disabled={authLoading || (authMode === "register" && !acceptedTerms)}
                  className="w-full flex items-center justify-center gap-2 bg-brand-500 text-white font-bold py-3.5 rounded-lg hover:bg-brand-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {authLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : authMode === "register" ? (
                    <UserPlus className="w-4 h-4" />
                  ) : (
                    <LogIn className="w-4 h-4" />
                  )}
                  {authLoading
                    ? "Yuborilmoqda..."
                    : authMode === "register"
                    ? "Ro'yxatdan o'tish va davom etish"
                    : "Kirish va davom etish"}
                </button>
              </div>
            )}

            {step === "checkout" && (
              <div className="border-t border-ink/8 p-5 bg-surface/60">
                <div className="flex items-center justify-between mb-4">
                  <span className="font-bold text-ink/60 text-sm">Jami</span>
                  <span className="font-display font-extrabold text-xl text-ink">
                    {totalSum.toLocaleString("uz-UZ")} so'm
                  </span>
                </div>
                <button
                  form="checkout-form"
                  type="submit"
                  disabled={submitting || items.length === 0 || (paymentMethod === "karta" && !receiptFile)}
                  className="w-full flex items-center justify-center gap-2 bg-brand-500 text-white font-bold py-3.5 rounded-lg hover:bg-brand-600 transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Yuborilmoqda...
                    </>
                  ) : items.length === 0 ? (
                    "Savat bo'sh"
                  ) : paymentMethod === "karta" && !receiptFile ? (
                    "Avval chek skrinshotini yuklang"
                  ) : (
                    "Buyurtmani tasdiqlash"
                  )}
                </button>
              </div>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
