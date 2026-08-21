"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Plus, Minus, Trash2, ShoppingBag, ArrowLeft, CheckCircle2, Loader2 } from "lucide-react";
import { useCart } from "./CartProvider";
import ProductArt from "./ProductArt";

type Step = "cart" | "checkout" | "success";

export default function CartDrawer() {
  const { items, isOpen, closeCart, setQty, removeItem, totalSum, totalCount } = useCart();
  const [step, setStep] = useState<Step>("cart");
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ name: "", phone: "", address: "", note: "" });

  const handleClose = () => {
    closeCart();
    window.setTimeout(() => setStep("cart"), 300);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await fetch("/api/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items, total: totalSum, customer: form })
      });
    } catch {
      // demo muhitida xatolikni jimgina o'tkazamiz
    } finally {
      setSubmitting(false);
      setStep("success");
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
            className="fixed top-0 right-0 h-full w-full sm:w-[420px] bg-paper border-l-2 border-ink z-50 flex flex-col"
          >
            <div className="flex items-center justify-between px-5 py-4 border-b-2 border-ink">
              <div className="flex items-center gap-2">
                {step === "checkout" && (
                  <button onClick={() => setStep("cart")} className="p-1 -ml-1">
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                )}
                <h3 className="font-display text-xl uppercase">
                  {step === "cart" && `Savat (${totalCount})`}
                  {step === "checkout" && "Buyurtma ma'lumotlari"}
                  {step === "success" && "Qabul qilindi"}
                </h3>
              </div>
              <button onClick={handleClose} aria-label="Yopish" className="p-1.5 hover:bg-ink/5 rounded-md">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">
              {step === "cart" && (
                <div className="p-5">
                  {items.length === 0 ? (
                    <div className="flex flex-col items-center justify-center text-center py-20 text-ink/50">
                      <ShoppingBag className="w-10 h-10 mb-3" />
                      <p className="font-semibold">Savat hozircha bo'sh</p>
                      <p className="text-sm mt-1">Katalogdan mahsulot qo'shing.</p>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-4">
                      <AnimatePresence initial={false}>
                        {items.map((item) => (
                          <motion.div
                            key={item.product.id}
                            layout
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            className="flex gap-3 border-2 border-ink/15 rounded-lg p-3"
                          >
                            <div className="w-16 h-16 bg-kraft-50 rounded-md border border-ink/15 p-2 shrink-0">
                              <ProductArt art={item.product.image} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-bold text-sm leading-tight truncate">{item.product.name}</p>
                              <p className="text-xs text-ink/55 font-mono mt-0.5">
                                {item.product.price.toLocaleString("uz-UZ")} so'm / {item.product.unit}
                              </p>
                              <div className="flex items-center justify-between mt-2">
                                <div className="flex items-center border-2 border-ink rounded-md">
                                  <button
                                    onClick={() => setQty(item.product.id, item.qty - 1)}
                                    className="p-1.5 hover:bg-ink/5"
                                  >
                                    <Minus className="w-3 h-3" />
                                  </button>
                                  <span className="w-6 text-center font-mono text-xs font-bold">{item.qty}</span>
                                  <button
                                    onClick={() => setQty(item.product.id, item.qty + 1)}
                                    className="p-1.5 hover:bg-ink/5"
                                  >
                                    <Plus className="w-3 h-3" />
                                  </button>
                                </div>
                                <button
                                  onClick={() => removeItem(item.product.id)}
                                  className="text-ink/40 hover:text-stamp transition-colors"
                                  aria-label="O'chirish"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </AnimatePresence>
                    </div>
                  )}
                </div>
              )}

              {step === "checkout" && (
                <form id="checkout-form" onSubmit={handleSubmit} className="p-5 flex flex-col gap-4">
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wide text-ink/60">Ism-familiya</label>
                    <input
                      required
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      className="mt-1 w-full border-2 border-ink rounded-md px-3 py-2.5 bg-paper focus:outline-none"
                      placeholder="Ism Familiya"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wide text-ink/60">Telefon raqam</label>
                    <input
                      required
                      type="tel"
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      className="mt-1 w-full border-2 border-ink rounded-md px-3 py-2.5 bg-paper focus:outline-none"
                      placeholder="+998 90 123 45 67"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wide text-ink/60">Yetkazish manzili</label>
                    <input
                      required
                      value={form.address}
                      onChange={(e) => setForm({ ...form, address: e.target.value })}
                      className="mt-1 w-full border-2 border-ink rounded-md px-3 py-2.5 bg-paper focus:outline-none"
                      placeholder="Shahar, tuman, ko'cha"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wide text-ink/60">Izoh (ixtiyoriy)</label>
                    <textarea
                      value={form.note}
                      onChange={(e) => setForm({ ...form, note: e.target.value })}
                      rows={3}
                      className="mt-1 w-full border-2 border-ink rounded-md px-3 py-2.5 bg-paper focus:outline-none resize-none"
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
                    <CheckCircle2 className="w-16 h-16 text-eco" />
                  </motion.div>
                  <h4 className="font-display text-2xl uppercase mt-4">Rahmat, {form.name.split(" ")[0] || "mijoz"}!</h4>
                  <p className="text-ink/60 mt-2 max-w-xs">
                    Buyurtmangiz qabul qilindi. Menejerimiz 15 daqiqa ichida{" "}
                    <span className="font-semibold text-ink">{form.phone}</span> raqamiga aloqaga chiqadi.
                  </p>
                  <button
                    onClick={handleClose}
                    className="mt-6 bg-ink text-paper font-bold px-6 py-3 rounded-md hover:bg-ink-soft"
                  >
                    Yopish
                  </button>
                </div>
              )}
            </div>

            {step !== "success" && items.length > 0 && (
              <div className="border-t-2 border-ink p-5 bg-kraft-50/60">
                <div className="flex items-center justify-between mb-4 font-display text-xl uppercase">
                  <span>Jami</span>
                  <span>{totalSum.toLocaleString("uz-UZ")} so'm</span>
                </div>
                {step === "cart" ? (
                  <button
                    onClick={() => setStep("checkout")}
                    className="w-full bg-signal text-paper font-bold py-3.5 rounded-md shadow-crate-sm hover:-translate-y-0.5 transition-transform"
                  >
                    Rasmiylashtirish
                  </button>
                ) : (
                  <button
                    form="checkout-form"
                    type="submit"
                    disabled={submitting}
                    className="w-full flex items-center justify-center gap-2 bg-signal text-paper font-bold py-3.5 rounded-md shadow-crate-sm hover:-translate-y-0.5 transition-transform disabled:opacity-70"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" /> Yuborilmoqda...
                      </>
                    ) : (
                      "Buyurtmani tasdiqlash"
                    )}
                  </button>
                )}
              </div>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
