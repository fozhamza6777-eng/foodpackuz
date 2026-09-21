"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin } from "lucide-react";
import { useBranch, type BranchCity } from "./BranchProvider";
import { useLanguage } from "./LanguageProvider";

const cities: BranchCity[] = ["Toshkent", "Qo'qon"];
const cityLabelKeys: Record<BranchCity, string> = {
  "Toshkent": "topbar.city_tashkent",
  "Qo'qon": "topbar.city_qoqon"
};

export default function BranchSelectModal() {
  const { city, hydrated, setCity } = useBranch();
  const { t } = useLanguage();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const isOpen = hydrated && city === null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-ink/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className="bg-white rounded-2xl w-full max-w-sm p-6 text-center shadow-2xl"
          >
            <span className="w-12 h-12 rounded-full bg-brand-50 flex items-center justify-center mx-auto mb-4">
              <MapPin className="w-6 h-6 text-brand-500" />
            </span>
            <h2 className="font-display font-extrabold text-lg text-ink mb-2">{t("branch_modal.question")}</h2>
            <p className="text-sm text-ink/50 mb-6">{t("branch_modal.subtitle")}</p>
            <div className="flex flex-col gap-2.5">
              {cities.map((c) => (
                <button
                  key={c}
                  onClick={() => setCity(c)}
                  className="w-full flex items-center justify-center gap-2 bg-brand-500 text-white font-bold py-3 rounded-lg hover:bg-brand-600 transition-colors"
                >
                  <MapPin className="w-4 h-4" />
                  {t(cityLabelKeys[c])}
                </button>
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
