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
import { products } from "@/lib/products";

export default function Home() {
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
        <ProductGrid />
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
