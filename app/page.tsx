import HomeContent from "@/components/HomeContent";
import { fetchProductsPage, fetchNewProducts } from "@/lib/supabase/products";
import { fetchActiveBanners } from "@/lib/supabase/banners";
import { fetchActiveCategories } from "@/lib/supabase/categories";
import { fetchActiveLogos } from "@/lib/supabase/trustedLogos";

// Boshlang'ich yuklashda eng so'nggi ma'lumot bilan render qilinishi uchun
// bu sahifa statik keshlanmaydi; keyingi o'zgarishlar esa HomeContent
// ichidagi real vaqtli (Supabase Realtime) obuna orqali yetkaziladi.
export const dynamic = "force-dynamic";

// Katalog ProductGrid'ning standart holati (filtrsiz, "mashhur" tartib,
// birinchi sahifa, 24 tadan) bilan bir xil bo'lishi kerak — aks holda
// mijoz sahifani ochganda ko'rgan ro'yxati ulanish tugagach bir zumga
// almashib ketadi.
export default async function Home() {
  const [productsPage, newProducts, banners, categories, partnerLogos, customerLogos] = await Promise.all([
    fetchProductsPage({ category: "Barchasi", sortBy: "popular", page: 1, perPage: 24 }),
    fetchNewProducts(),
    fetchActiveBanners(),
    fetchActiveCategories(),
    fetchActiveLogos("partner"),
    fetchActiveLogos("customer")
  ]);

  return (
    <HomeContent
      initialProducts={productsPage.products}
      initialProductsCount={productsPage.totalCount}
      initialNewProducts={newProducts}
      initialBanners={banners}
      initialCategories={categories}
      initialPartnerLogos={partnerLogos}
      initialCustomerLogos={customerLogos}
    />
  );
}
