import Header from "@/components/Header";
import Hero from "@/components/Hero";
import ProductGrid from "@/components/ProductGrid";
import Features from "@/components/Features";
import Testimonials from "@/components/Testimonials";
import BulkCTA from "@/components/BulkCTA";
import Footer from "@/components/Footer";
import CartDrawer from "@/components/CartDrawer";

export default function Home() {
  return (
    <>
      <Header />
      <main>
        <Hero />
        <ProductGrid />
        <Features />
        <Testimonials />
        <BulkCTA />
      </main>
      <Footer />
      <CartDrawer />
    </>
  );
}
