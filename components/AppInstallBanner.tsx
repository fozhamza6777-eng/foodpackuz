"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Smartphone, Share2, X } from "lucide-react";
import { useLanguage } from "./LanguageProvider";

const DISMISS_KEY = "foodbox_app_banner_dismissed";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

// Bizda hali alohida mobil ilova (App Store / Google Play) yo'q, sayt PWA
// sifatida "bosh ekranga qo'shish" imkoniyatiga ega. Android/Chrome bu
// jarayonni tugma bosilganda avtomatik ko'rsata oladi (beforeinstallprompt),
// iOS Safari esa buni dasturiy tarzda ochishga ruxsat bermaydi — shuning
// uchun bitta umumiy tugma orqasida ikkala holat ham boshqariladi: Androidda
// darhol o'rnatish oynasi, iOS'da esa qisqa qo'lda qo'shish ko'rsatmasi.
export default function AppInstallBanner() {
  const { t } = useLanguage();
  const [mounted, setMounted] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [installed, setInstalled] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showHint, setShowHint] = useState(false);

  useEffect(() => {
    setMounted(true);
    try {
      if (window.localStorage.getItem(DISMISS_KEY)) setDismissed(true);
    } catch {
      // localStorage mavjud bo'lmasa — jim o'tkazamiz
    }

    const standalone =
      window.matchMedia("(display-mode: standalone)").matches || (window.navigator as any).standalone === true;
    setInstalled(standalone);

    const handlePrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    const handleInstalled = () => setInstalled(true);

    window.addEventListener("beforeinstallprompt", handlePrompt);
    window.addEventListener("appinstalled", handleInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", handlePrompt);
      window.removeEventListener("appinstalled", handleInstalled);
    };
  }, []);

  const handleDismiss = () => {
    setDismissed(true);
    try {
      window.localStorage.setItem(DISMISS_KEY, "1");
    } catch {
      // jim o'tkazamiz
    }
  };

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      setDeferredPrompt(null);
      if (choice.outcome === "accepted") handleDismiss();
      return;
    }
    // Dasturiy o'rnatish imkoni bo'lmasa (iOS Safari yoki boshqa brauzer) —
    // qo'lda qo'shish uchun qisqa ko'rsatma ko'rsatamiz.
    setShowHint((v) => !v);
  };

  if (!mounted || dismissed || installed) return null;

  return (
    <div className="mx-auto max-w-7xl px-5 lg:px-8 pt-4">
      <div className="relative bg-ink rounded-2xl px-6 md:px-10 py-5 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4 text-white">
          <span className="w-11 h-11 rounded-xl bg-brand-gradient flex items-center justify-center shrink-0">
            <Smartphone className="w-5 h-5" />
          </span>
          <div>
            <h3 className="font-display font-extrabold text-base">{t("app_promo.title")}</h3>
            <p className="text-white/60 text-xs font-medium mt-0.5">{t("app_promo.text")}</p>
          </div>
        </div>

        <div className="relative shrink-0">
          <button
            onClick={handleInstallClick}
            className="flex items-center gap-2 bg-white text-ink text-xs font-bold px-4 py-2.5 rounded-lg hover:bg-white/90 transition-colors"
          >
            <Smartphone className="w-3.5 h-3.5" /> {t("app_promo.install_button")}
          </button>

          <AnimatePresence>
            {showHint && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowHint(false)} />
                <motion.div
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 top-full mt-2 w-64 bg-white text-ink rounded-xl shadow-card-hover border border-ink/8 p-4 text-xs font-medium leading-relaxed z-20"
                >
                  <div className="flex items-center gap-2 mb-2 font-bold">
                    <Share2 className="w-3.5 h-3.5 text-brand-500 shrink-0" /> {t("app_promo.ios_title")}
                  </div>
                  {t("app_promo.ios_steps")}
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>

        <button
          onClick={handleDismiss}
          className="absolute -top-2 -right-2 md:top-3 md:right-3 bg-white text-ink/50 hover:text-ink rounded-full p-1 shadow-card"
          aria-label={t("common.close")}
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
