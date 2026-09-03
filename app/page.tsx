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
import { fetchActiveProducts } from "@/lib/supabase/products";

// Mahsulotlar admin panelda o'zgartirilganda sayt darhol yangilanishi uchun
// bu sahifa har bir so'rovda qaytadan (statik keshlanmasdan) render qilinadi.
export const dynamic = "force-dynamic";

export default async function Home() {
  const products = await fetchActiveProducts();
  const newProducts = products.filter((p) => p.isNew);

  return (
    <>
      <TopBar />
      <Header />
      <main>
        <Hero />
        <PromoRow
          id="yangiliklar"
          title="Yangi mahsulotlar"
          subtitle="Yangiliklar"
          accent="brand"
          products={newProducts}
        />
        <TrustBadges />
        <PartnersMarquee />
        <ProductGrid products={products} />
        <Testimonials />
        <FAQAccordion />
        <Branches />
        <BulkCTA />
      </main>
      <Footer />
      <CartDrawer />
    </>
  );
}
