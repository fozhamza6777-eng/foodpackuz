import HomeContent from "@/components/HomeContent";
import { fetchActiveProducts } from "@/lib/supabase/products";
import { fetchActiveBanners } from "@/lib/supabase/banners";
import { fetchActiveCategories } from "@/lib/supabase/categories";

// Boshlang'ich yuklashda eng so'nggi ma'lumot bilan render qilinishi uchun
// bu sahifa statik keshlanmaydi; keyingi o'zgarishlar esa HomeContent
// ichidagi real vaqtli (Supabase Realtime) obuna orqali yetkaziladi.
export const dynamic = "force-dynamic";

export default async function Home() {
  const [products, banners, categories] = await Promise.all([
    fetchActiveProducts(),
    fetchActiveBanners(),
    fetchActiveCategories()
  ]);

  return <HomeContent initialProducts={products} initialBanners={banners} initialCategories={categories} />;
}
