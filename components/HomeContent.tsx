"use client";

import { useEffect, useState } from "react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase/client";
import { fetchNewProducts } from "@/lib/supabase/products";
import { fetchActiveBanners, type Banner } from "@/lib/supabase/banners";
import { fetchActiveCategories, type Category } from "@/lib/supabase/categories";
import type { Product } from "@/lib/types";
import type { TrustedLogoRow } from "@/lib/supabase/types";
import TopBar from "@/components/TopBar";
import Header from "@/components/Header";
import AppInstallBanner from "@/components/AppInstallBanner";
import Hero from "@/components/Hero";
import PromoRow from "@/components/PromoRow";
import TrustBadges from "@/components/TrustBadges";
import LogoMarquee from "@/components/LogoMarquee";
import ProductGrid from "@/components/ProductGrid";
import Testimonials from "@/components/Testimonials";
import FAQAccordion from "@/components/FAQAccordion";
import Branches from "@/components/Branches";
import BulkCTA from "@/components/BulkCTA";
import Footer from "@/components/Footer";
import CartDrawer from "@/components/CartDrawer";
import CartToast from "@/components/CartToast";
import CartReminderBanner from "@/components/CartReminderBanner";

export default function HomeContent({
  initialProducts,
  initialProductsCount,
  initialNewProducts,
  initialBanners,
  initialCategories,
  initialPartnerLogos,
  initialCustomerLogos
}: {
  initialProducts: Product[];
  initialProductsCount: number;
  initialNewProducts: Product[];
  initialBanners: Banner[];
  initialCategories: Category[];
  initialPartnerLogos: TrustedLogoRow[];
  initialCustomerLogos: TrustedLogoRow[];
}) {
  const [newProducts, setNewProducts] = useState(initialNewProducts);
  const [banners, setBanners] = useState(initialBanners);
  const [categories, setCategories] = useState(initialCategories);

  // Admin panelda banner/bo'lim qo'shilsa, tahrirlansa yoki o'chirilsa,
  // saytni ochib turgan mijozlar sahifani yangilamasdan ham darhol
  // o'zgarishni ko'rishi uchun. Mahsulotlar katalogi (ProductGrid) esa
  // katta hajmda ham tez ishlashi uchun o'zining sahifalab yuklaydigan
  // va real vaqtli obunasiga ega — bu yerda faqat "Yangi mahsulotlar"
  // qatori uchun yengil ro'yxat yangilanadi.
  useEffect(() => {
    if (!isSupabaseConfigured) return;
    const channel = supabase
      .channel("public-catalog-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "products" }, () => {
        fetchNewProducts().then(setNewProducts);
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "banners" }, () => {
        fetchActiveBanners().then(setBanners);
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "categories" }, () => {
        fetchActiveCategories().then(setCategories);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <>
      <TopBar />
      <Header categories={categories} />
      <main>
        <LogoMarquee
          type="customer"
          title="Bizga ishongan mijozlar"
          initialLogos={initialCustomerLogos}
          variant="compact"
        />
        <AppInstallBanner />
        <Hero banners={banners} categories={categories} />
        <PromoRow id="yangiliklar" accent="brand" products={newProducts} />
        <TrustBadges />
        <LogoMarquee type="partner" title="Ishonchli hamkorlarimiz" initialLogos={initialPartnerLogos} />
        <ProductGrid initialProducts={initialProducts} initialTotalCount={initialProductsCount} categories={categories} />
        <Testimonials />
        <FAQAccordion />
        <Branches />
        <BulkCTA />
      </main>
      <Footer />
      <CartDrawer />
      <CartToast />
      <CartReminderBanner />
    </>
  );
}
