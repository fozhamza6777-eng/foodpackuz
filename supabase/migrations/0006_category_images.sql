-- =====================================================================
-- FOOD BOX — 6-migratsiya: bo'limlarga (kategoriyalarga) haqiqiy rasm
-- Bu faylni Supabase loyihangizda "SQL Editor" bo'limiga to'liq nusxalab,
-- "Run" tugmasini bosing (0001–0005 dan KEYIN ishga tushiring).
-- =====================================================================

alter table public.categories
  add column if not exists image_url text;

-- "product-images" bucket allaqachon mavjud (0004-migratsiyada yaratilgan) va
-- admin-only yozish siyosati bucket darajasida ishlaydi, shuning uchun
-- kategoriyalar uchun alohida bucket yoki siyosat kerak emas — rasm shu
-- bucket ichida "categories/" papkasida saqlanadi.

-- =====================================================================
-- TEKSHIRISH (ixtiyoriy):
--   select id, name, image_url from public.categories order by sort_order;
-- =====================================================================
