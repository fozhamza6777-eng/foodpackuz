"use client";

import { Phone, Mail, MapPin, Instagram, Send, Smartphone } from "lucide-react";
import { useLanguage } from "./LanguageProvider";

export default function Footer() {
  const { t } = useLanguage();

  return (
    <footer id="aloqa" className="bg-white border-t border-ink/8">
      {/* ilova banneri */}
      <div className="mx-auto max-w-7xl px-5 lg:px-8 py-10">
        <div className="bg-ink rounded-2xl px-6 md:px-10 py-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4 text-white">
            <span className="w-12 h-12 rounded-xl bg-brand-gradient flex items-center justify-center shrink-0">
              <Smartphone className="w-6 h-6" />
            </span>
            <div>
              <h3 className="font-display font-extrabold text-lg">{t("footer.app_title")}</h3>
              <p className="text-white/60 text-sm font-medium mt-0.5">{t("footer.app_text")}</p>
            </div>
          </div>
          <div className="flex gap-3 shrink-0">
            <a href="#" className="bg-white/10 hover:bg-white/20 text-white text-xs font-bold px-4 py-2.5 rounded-lg transition-colors">
              App Store
            </a>
            <a href="#" className="bg-white/10 hover:bg-white/20 text-white text-xs font-bold px-4 py-2.5 rounded-lg transition-colors">
              Google Play
            </a>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-5 lg:px-8 pb-14">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">
          <div>
            <div className="mb-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo.svg" alt="FOOD BOX" className="h-10 w-auto" />
            </div>
            <p className="text-sm text-ink/50 font-medium max-w-xs">{t("footer.about")}</p>
          </div>

          <div>
            <h4 className="font-bold text-ink text-sm mb-4">{t("footer.catalog")}</h4>
            <ul className="space-y-2.5 text-sm text-ink/55 font-medium">
              <li><a href="#katalog" className="hover:text-brand-500 transition-colors">{t("footer.cat_clamshell")}</a></li>
              <li><a href="#katalog" className="hover:text-brand-500 transition-colors">{t("footer.cat_cups")}</a></li>
              <li><a href="#katalog" className="hover:text-brand-500 transition-colors">{t("footer.cat_pizza")}</a></li>
              <li><a href="#katalog" className="hover:text-brand-500 transition-colors">{t("footer.cat_thermo")}</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-ink text-sm mb-4">{t("footer.company")}</h4>
            <ul className="space-y-2.5 text-sm text-ink/55 font-medium">
              <li><a href="#nega-biz" className="hover:text-brand-500 transition-colors">{t("footer.why_us")}</a></li>
              <li><a href="#mijozlar" className="hover:text-brand-500 transition-colors">{t("footer.reviews")}</a></li>
              <li><a href="#hamkorlik" className="hover:text-brand-500 transition-colors">{t("footer.partnership_terms")}</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-ink text-sm mb-4">{t("footer.contact")}</h4>
            <ul className="space-y-3 text-sm text-ink/55 font-medium">
              <li className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-brand-500 shrink-0" /> {t("topbar.city_tashkent")}: +998 95 872 83 83
              </li>
              <li className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-brand-500 shrink-0" /> {t("topbar.city_qoqon")}: +998 91 382 83 83
              </li>
              <li className="flex items-center gap-2.5"><Mail className="w-4 h-4 text-brand-500" /> sales@foodbox.uz</li>
              <li className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-brand-500 shrink-0 mt-0.5" />
                <span>{t("topbar.city_tashkent")}, Uchtepa tumani, O'rikzor mahallasi, Bositxon ko'chasi 85-uy</span>
              </li>
              <li className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-brand-500 shrink-0 mt-0.5" />
                <span>{t("topbar.city_qoqon")}, Rais mahallasi, 2-uy</span>
              </li>
            </ul>
            <div className="flex gap-3 mt-4">
              <a
                href="https://t.me/fastfood_box"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Telegram"
                className="p-2 border border-ink/10 rounded-full hover:bg-brand-500 hover:text-white hover:border-brand-500 transition-colors"
              >
                <Send className="w-4 h-4" />
              </a>
              <a
                href="https://www.instagram.com/foodbox_uz?stkn=bGFoMnBnZW92MHY2"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
                className="p-2 border border-ink/10 rounded-full hover:bg-brand-500 hover:text-white hover:border-brand-500 transition-colors"
              >
                <Instagram className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>

        <div className="border-t border-ink/8 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-ink/40 font-medium">
          <span>© {new Date().getFullYear()} FOOD BOX MCHJ. {t("footer.rights")}</span>
          <span className="font-mono">{t("footer.tagline")}</span>
        </div>
      </div>
    </footer>
  );
}
