-- =====================================================================
-- FOOD BOX — 4-migratsiya: haqiqiy rasmlar (mahsulot va banner)
-- Bu faylni Supabase loyihangizda "SQL Editor" bo'limiga to'liq nusxalab,
-- "Run" tugmasini bosing (0001, 0002, 0003 dan KEYIN ishga tushiring).
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1) STORAGE — mahsulot va banner rasmlari uchun ochiq (public) bucket
-- ---------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do nothing;

drop policy if exists "Product images: hamma ko'radi" on storage.objects;
create policy "Product images: hamma ko'radi"
  on storage.objects for select
  using (bucket_id = 'product-images');

drop policy if exists "Product images: faqat admin yuklaydi" on storage.objects;
create policy "Product images: faqat admin yuklaydi"
  on storage.objects for insert
  with check (bucket_id = 'product-images' and public.is_admin());

drop policy if exists "Product images: faqat admin yangilaydi" on storage.objects;
create policy "Product images: faqat admin yangilaydi"
  on storage.objects for update
  using (bucket_id = 'product-images' and public.is_admin());

drop policy if exists "Product images: faqat admin o'chiradi" on storage.objects;
create policy "Product images: faqat admin o'chiradi"
  on storage.objects for delete
  using (bucket_id = 'product-images' and public.is_admin());

-- ---------------------------------------------------------------------
-- 2) PRODUCTS jadvaliga haqiqiy rasm havolasini saqlash uchun ustun
--    (bo'sh bo'lsa, sayt avvalgidek chizilgan SVG belgini ko'rsatadi)
-- ---------------------------------------------------------------------
alter table public.products
  add column if not exists image_url text;

-- ---------------------------------------------------------------------
-- 3) BANNERS — bosh sahifadagi aylanib turuvchi reklama banneri endi
--    ma'lumotlar bazasidan boshqariladi, admin haqiqiy rasm qo'ya oladi
-- ---------------------------------------------------------------------
create table if not exists public.banners (
  id uuid primary key default gen_random_uuid(),
  tag text not null default '',
  title text not null,
  description text not null default '',
  cta_label text not null default 'Katalogni ko''rish',
  cta_href text not null default '#katalog',
  image_url text,
  gradient_from text not null default 'from-brand-500',
  gradient_to text not null default 'to-brand-300',
  art text not null default 'clamshell',
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.banners enable row level security;

drop policy if exists "Banners: hamma o'qiy oladi" on public.banners;
create policy "Banners: hamma o'qiy oladi"
  on public.banners for select
  using (true);

drop policy if exists "Banners: faqat admin qo'sha oladi" on public.banners;
create policy "Banners: faqat admin qo'sha oladi"
  on public.banners for insert
  with check (public.is_admin());

drop policy if exists "Banners: faqat admin yangilaydi" on public.banners;
create policy "Banners: faqat admin yangilaydi"
  on public.banners for update
  using (public.is_admin());

drop policy if exists "Banners: faqat admin o'chiradi" on public.banners;
create policy "Banners: faqat admin o'chiradi"
  on public.banners for delete
  using (public.is_admin());

drop trigger if exists set_banners_updated_at on public.banners;
create trigger set_banners_updated_at
  before update on public.banners
  for each row execute procedure public.set_updated_at();

-- Boshlang'ich 3 ta banner (hozirgi saytdagi bannerlar bilan bir xil matn,
-- rasmsiz — admin panelda ularga haqiqiy rasm qo'yishingiz mumkin)
insert into public.banners (tag, title, description, cta_label, cta_href, gradient_from, gradient_to, art, sort_order)
values
  ('Yangi kolleksiya', 'Fast-food biznesingiz uchun to''liq qadoqlash yechimi', 'Klamshell qutilardan termo-konteynerlargacha — bitta manzilda, ulgurji narxda.', 'Katalogni ko''rish', '#katalog', 'from-brand-500', 'to-brand-300', 'clamshell', 10),
  ('100% ekologik', 'Tabiatga zarar bermaydigan biologik chiriydigan qadoqlar', 'Kraft karton va bambukdan tayyorlangan mahsulotlar — mijozlaringizga ham, tabiatga ham foydali.', 'Yangiliklarni ko''rish', '#yangiliklar', 'from-success', 'to-brand-400', 'bag', 20),
  ('Bepul yetkazib berish', 'Toshkent bo''ylab 24 soat ichida yetkazib beramiz', '10 000 so''mdan yuqori buyurtmalarga yetkazib berish mutlaqo bepul.', 'Shartlarni bilish', '#nega-biz', 'from-brand-600', 'to-brand-300', 'thermo', 30)
on conflict do nothing;

-- =====================================================================
-- MUHIM: Bucket sozlamalarini tekshirish
-- Agar yuqoridagi "insert into storage.buckets" qatori xatolik bersa
-- (ba'zi eski Supabase loyihalarida storage.buckets jadvaliga to'g'ridan
-- to'g'ri SQL orqali yozish cheklangan bo'lishi mumkin), unda buni
-- Supabase paneli orqali qo'lda bajaring:
--   Storage → New bucket → Name: product-images → Public bucket: ON
-- =====================================================================
