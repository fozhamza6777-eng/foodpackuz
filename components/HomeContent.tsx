"use client";

import { useEffect, useState } from "react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase/client";
import { fetchActiveProducts } from "@/lib/supabase/products";
import { fetchActiveBanners, type Banner } from "@/lib/supabase/banners";
import { fetchActiveCategories, type Category } from "@/lib/supabase/categories";
import type { Product } from "@/lib/types";
import TopBar from "@/components/TopBar";
import Header from "@/components/Header";
import Hero from "@/components/Hero";
import PromoRow from "@/components/PromoRow";
import TrustBadges from "@/components/TrustBadges";
import PartnersMarquee from "@/components/PartnersMarquee";
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
  initialBanners,
  initialCategories
}: {
  initialProducts: Product[];
  initialBanners: Banner[];
  initialCategories: Category[];
}) {
  const [products, setProducts] = useState(initialProducts);
  const [banners, setBanners] = useState(initialBanners);
  const [categories, setCategories] = useState(initialCategories);

  // Admin panelda mahsulot/banner/bo'lim qo'shilsa, tahrirlansa yoki
  // o'chirilsa, saytni ochib turgan mijozlar sahifani yangilamasdan ham
  // darhol o'zgarishni ko'rishi uchun — har bir jadval bo'yicha real vaqtli
  // obuna, o'zgarish kelganda esa faol ro'yxatni qaytadan yuklaymiz.
  useEffect(() => {
    if (!isSupabaseConfigured) return;
    const channel = supabase
      .channel("public-catalog-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "products" }, () => {
        fetchActiveProducts().then(setProducts);
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

  const newProducts = products.filter((p) => p.isNew);

  return (
    <>
      <TopBar />
      <Header categories={categories} />
      <main>
        <Hero banners={banners} categories={categories} />
        <PromoRow id="yangiliklar" accent="brand" products={newProducts} />
        <TrustBadges />
        <PartnersMarquee />
        <ProductGrid products={products} categories={categories} />
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
