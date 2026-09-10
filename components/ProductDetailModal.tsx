"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Heart, ShoppingBag, Plus, Minus, MessageCircle, Loader2, Send, Trash2 } from "lucide-react";
import type { Product } from "@/lib/types";
import { useCart } from "./CartProvider";
import { useLikes } from "./LikesProvider";
import { useAuth } from "./AuthProvider";
import ProductImage from "./ProductImage";
import ProductInfoBadge from "./ProductInfoBadge";
import AuthModal from "./AuthModal";
import { fetchComments, addComment, deleteComment, type Comment } from "@/lib/supabase/comments";

export default function ProductDetailModal({
  product,
  onClose
}: {
  product: Product | null;
  onClose: () => void;
}) {
  const { addItem } = useCart();
  const { isLiked, toggleLike } = useLikes();
  const auth = useAuth();
  const [packQty, setPackQty] = useState(1);
  const [justAdded, setJustAdded] = useState(false);
  const [comments, setComments] = useState<Comment[] | null>(null);
  const [newComment, setNewComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);

  useEffect(() => {
    setPackQty(1);
    setJustAdded(false);
    setComments(null);
    setNewComment("");
    if (product) {
      fetchComments(product.id).then(setComments);
    }
  }, [product?.id]);

  if (!product) return null;

  const discount = product.oldPrice
    ? Math.round(((product.oldPrice - product.price) / product.oldPrice) * 100)
    : 0;
  const packPrice = product.price * product.packSize;
  const liked = isLiked(product.id);

  const handleAdd = () => {
    addItem(product, packQty * product.packSize);
    setJustAdded(true);
    setPackQty(1);
    window.setTimeout(() => setJustAdded(false), 1100);
  };

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.session?.user || !auth.user) {
      setAuthOpen(true);
      return;
    }
    if (!newComment.trim()) return;
    setSubmitting(true);
    await addComment({
      productId: product.id,
      userId: auth.session.user.id,
      authorName: auth.user.name,
      body: newComment.trim()
    });
    setNewComment("");
    setSubmitting(false);
    fetchComments(product.id).then(setComments);
  };

  const handleDeleteComment = async (id: string) => {
    await deleteComment(id);
    setComments((prev) => (prev ? prev.filter((c) => c.id !== id) : prev));
  };

  return (
    <>
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-ink/50 backdrop-blur-sm z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4"
        >
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 40 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-lg max-h-[92vh] shadow-2xl overflow-hidden flex flex-col"
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-ink/8 shrink-0">
              <h3 className="font-display font-extrabold text-lg text-ink truncate pr-4">{product.name}</h3>
              <button onClick={onClose} className="p-1.5 hover:bg-surface rounded-lg shrink-0">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">
              <div className="p-5">
                <div className="relative h-48 bg-surface rounded-xl flex items-center justify-center overflow-hidden mb-4">
                  <div className="w-32 h-32">
                    <ProductImage imageUrl={product.imageUrl} art={product.image} />
                  </div>
                  <button
                    onClick={() => (auth.session ? toggleLike(product.id) : setAuthOpen(true))}
                    className="absolute top-3 right-3 w-9 h-9 rounded-full bg-white shadow-card flex items-center justify-center"
                    aria-label="Yoqtirish"
                  >
                    <Heart className={`w-4 h-4 ${liked ? "fill-danger text-danger" : "text-ink/40"}`} />
                  </button>
                  {product.isNew && (
                    <span className="absolute top-3 left-3 text-[10px] font-extrabold uppercase bg-brand-500 text-white px-2 py-1 rounded-md">
                      Yangi
                    </span>
                  )}
                </div>

                {product.infoBadgeType && (
                  <div className="mb-3">
                    <ProductInfoBadge type={product.infoBadgeType} text={product.infoBadgeText} />
                  </div>
                )}

                <p className="text-sm text-ink/60 leading-relaxed mb-4">{product.description}</p>

                <div className="grid grid-cols-2 gap-3 text-xs mb-4">
                  <div className="bg-surface rounded-lg p-3">
                    <p className="text-ink/40 font-bold uppercase mb-1">Material</p>
                    <p className="font-semibold text-ink">{product.material}</p>
                  </div>
                  <div className="bg-surface rounded-lg p-3">
                    <p className="text-ink/40 font-bold uppercase mb-1">O'lcham</p>
                    <p className="font-semibold text-ink">{product.sizes.join(", ")}</p>
                  </div>
                </div>

                <div className="flex flex-col gap-0.5 mb-4">
                  <div className="flex items-baseline gap-2">
                    <span className="font-display font-extrabold text-xl text-ink">
                      {product.price.toLocaleString("uz-UZ")}
                    </span>
                    <span className="text-xs font-semibold text-ink/40">so'm/{product.unit}</span>
                    {product.oldPrice && (
                      <span className="text-xs font-semibold text-ink/35 line-through">
                        {product.oldPrice.toLocaleString("uz-UZ")}
                      </span>
                    )}
                    {discount > 0 && (
                      <span className="text-[10px] font-extrabold uppercase bg-danger text-white px-1.5 py-0.5 rounded">
                        −{discount}%
                      </span>
                    )}
                  </div>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-sm font-bold text-brand-600">{packPrice.toLocaleString("uz-UZ")} so'm</span>
                    <span className="text-[11px] font-semibold text-ink/40">
                      / pachka ({product.packSize} {product.unit})
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 mb-6">
                  <div className="flex items-center border border-ink/15 rounded-lg shrink-0">
                    <button
                      onClick={() => setPackQty((q) => Math.max(1, q - 1))}
                      className="p-2.5 hover:bg-surface active:scale-90 transition-transform"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="w-8 text-center font-mono font-bold text-sm">{packQty}</span>
                    <button
                      onClick={() => setPackQty((q) => q + 1)}
                      className="p-2.5 hover:bg-surface active:scale-90 transition-transform"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                  <motion.button
                    onClick={handleAdd}
                    whileTap={{ scale: 0.96 }}
                    className={`flex-1 flex items-center justify-center gap-2 font-bold text-sm px-4 py-3 rounded-lg transition-colors ${
                      justAdded ? "bg-success text-white" : "bg-brand-500 text-white hover:bg-brand-600"
                    }`}
                  >
                    <ShoppingBag className="w-4 h-4" />
                    {justAdded ? "Qo'shildi!" : `Savatga (${packQty} pachka)`}
                  </motion.button>
                </div>

                <div className="border-t border-ink/8 pt-4">
                  <h4 className="font-bold text-sm text-ink flex items-center gap-1.5 mb-3">
                    <MessageCircle className="w-4 h-4" /> Sharhlar {comments ? `(${comments.length})` : ""}
                  </h4>

                  <form onSubmit={handleSubmitComment} className="flex gap-2 mb-4">
                    <input
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder={auth.session ? "Fikringizni yozing..." : "Yozish uchun tizimga kiring"}
                      className="flex-1 border border-ink/15 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:border-brand-400"
                    />
                    <button
                      type="submit"
                      disabled={submitting}
                      className="bg-brand-500 text-white px-3.5 rounded-lg hover:bg-brand-600 transition-colors disabled:opacity-70 shrink-0"
                    >
                      {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    </button>
                  </form>

                  {comments === null && (
                    <div className="flex justify-center py-6 text-ink/30">
                      <Loader2 className="w-5 h-5 animate-spin" />
                    </div>
                  )}

                  {comments !== null && comments.length === 0 && (
                    <p className="text-sm text-ink/40 text-center py-4">
                      Hali sharh yo'q — birinchi bo'lib fikr bildiring!
                    </p>
                  )}

                  <div className="flex flex-col gap-3">
                    {comments?.map((c) => (
                      <div key={c.id} className="bg-surface rounded-lg p-3">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-bold text-xs text-ink">{c.authorName}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] text-ink/35">
                              {new Date(c.createdAt).toLocaleDateString("uz-UZ")}
                            </span>
                            {auth.session?.user.id === c.userId && (
                              <button
                                onClick={() => handleDeleteComment(c.id)}
                                className="text-ink/25 hover:text-danger transition-colors"
                                aria-label="O'chirish"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        </div>
                        <p className="text-sm text-ink/70 leading-relaxed">{c.body}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </AnimatePresence>

      <AuthModal isOpen={authOpen} onClose={() => setAuthOpen(false)} />
    </>
  );
}
