-- =====================================================================
-- FOOD BOX — 3-migratsiya: admin panel va mahsulotlar bazasi
-- Bu faylni Supabase loyihangizda "SQL Editor" bo'limiga to'liq nusxalab,
-- "Run" tugmasini bosing (0001 va 0002 dan KEYIN ishga tushiring).
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1) PROFILES jadvaliga "is_admin" ustunini qo'shish
--    Standart holatda hamma false (oddiy mijoz). Admin panelga kirish
--    huquqini berish uchun keyinroq bitta qatorni qo'lda true qilasiz
--    (fayl oxirida ko'rsatiladi).
-- ---------------------------------------------------------------------
alter table public.profiles
  add column if not exists is_admin boolean not null default false;

-- Admin ekanini xavfsiz tekshiruvchi yordamchi funksiya (RLS siyosatlarida
-- qayta-qayta ishlatiladi; SECURITY DEFINER tufayli o'zi RLS'ga qaram emas,
-- shu sababli rekursiya bo'lmaydi).
create or replace function public.is_admin()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select coalesce((select is_admin from public.profiles where id = auth.uid()), false);
$$;

-- Admin barcha mijozlarning profilini (ism, telefon, tashkilot nomi)
-- ko'ra olishi kerak — buyurtmalar ro'yxatida kim buyurtma berganini
-- ko'rsatish uchun. Oddiy mijozlar hamon faqat o'z profilini ko'radi
-- (bu siyosat mavjud "o'zinikini ko'radi" siyosatiga QO'SHILADI, uni
-- almashtirmaydi).
drop policy if exists "Profiles: admin barchasini ko'radi" on public.profiles;
create policy "Profiles: admin barchasini ko'radi"
  on public.profiles for select
  using (public.is_admin());

-- ---------------------------------------------------------------------
-- 2) ORDERS — admin uchun "barcha buyurtmalarni ko'rish/yangilash"
--    siyosatlarini qo'shish (mavjud "faqat o'zinikini ko'radi" siyosati
--    o'zgarishsiz qoladi, bu safar admin uchun QO'SHIMCHA siyosat)
-- ---------------------------------------------------------------------
drop policy if exists "Orders: admin barchasini ko'radi" on public.orders;
create policy "Orders: admin barchasini ko'radi"
  on public.orders for select
  using (public.is_admin());

drop policy if exists "Orders: admin holatini yangilaydi" on public.orders;
create policy "Orders: admin holatini yangilaydi"
  on public.orders for update
  using (public.is_admin());

-- ---------------------------------------------------------------------
-- 3) PRODUCTS — endi mahsulotlar kodda emas, ma'lumotlar bazasida.
--    Hamma (mehmonlar ham) o'qiy oladi, lekin faqat admin qo'shishi,
--    o'zgartirishi yoki o'chirishi mumkin. "is_active" orqali mahsulotni
--    o'chirmasdan turib saytdan vaqtincha yashirish ham mumkin.
-- ---------------------------------------------------------------------
create table if not exists public.products (
  id text primary key,
  name text not null,
  category text not null,
  price bigint not null check (price >= 0),
  old_price bigint,
  is_new boolean not null default false,
  unit text not null default 'dona',
  pack_size integer not null default 1,
  image text not null default 'clamshell',
  badges text[] not null default '{}',
  material text not null default '',
  sizes text[] not null default '{}',
  description text not null default '',
  code text not null default '',
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.products enable row level security;

drop policy if exists "Products: hamma o'qiy oladi" on public.products;
create policy "Products: hamma o'qiy oladi"
  on public.products for select
  using (true);

drop policy if exists "Products: faqat admin qo'sha oladi" on public.products;
create policy "Products: faqat admin qo'sha oladi"
  on public.products for insert
  with check (public.is_admin());

drop policy if exists "Products: faqat admin yangilaydi" on public.products;
create policy "Products: faqat admin yangilaydi"
  on public.products for update
  using (public.is_admin());

drop policy if exists "Products: faqat admin o'chiradi" on public.products;
create policy "Products: faqat admin o'chiradi"
  on public.products for delete
  using (public.is_admin());

-- updated_at ustunini har safar UPDATE'da avtomatik yangilaydigan trigger
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_products_updated_at on public.products;
create trigger set_products_updated_at
  before update on public.products
  for each row execute procedure public.set_updated_at();

-- ---------------------------------------------------------------------
-- 4) Mavjud katalogni boshlang'ich ma'lumot sifatida yuklash
--    (agar bu mahsulot ID'lari bilan qator allaqachon bo'lsa, o'tkazib
--    yuboriladi — xavfsiz qayta ishga tushirish mumkin)
-- ---------------------------------------------------------------------
insert into public.products
  (id, name, category, price, old_price, is_new, unit, pack_size, image, badges, material, sizes, description, code, is_active, sort_order)
values
  ('cl-01', 'Kraft klamshell burger qutisi', 'Klamshell qutilar', 780, NULL, true, 'dona', 50, 'clamshell', '{"Biologik chiriydigan","Yog''ga chidamli"}', 'Kraft karton, 350 gsm', '{"S — 12×12 sm","M — 15×15 sm","L — 18×18 sm"}', 'Bitta qo''l bilan yopiladigan qulay qopqoq, ichki qatlami yog'' va namlikka chidamli. Burger, hot-dog va shaurma uchun ideal.', 'FP-CL-101', true, 10),
  ('cl-02', 'Sendvich uchun kraft quti', 'Klamshell qutilar', 620, NULL, false, 'dona', 50, 'clamshell', '{"Qayta ishlanadigan"}', 'Kraft karton, 300 gsm', '{"14×10 sm"}', 'Yupqa profil, shtabellash uchun qulay — yetkazib berish kuryerlari uchun eng ixcham variant.', 'FP-CL-102', true, 20),
  ('cup-01', 'Bir martalik qog''oz stakan (issiq)', 'Stakanlar', 340, NULL, true, 'dona', 100, 'cup', '{"Ikki qatlamli","70°C gacha chidamli"}', 'Qog''oz + PE qatlam', '{"200 ml","300 ml","400 ml"}', 'Choy, qahva va issiq ichimliklar uchun. Qo''lni kuydirmaydigan qo''shimcha qatlam bilan.', 'FP-CP-201', true, 30),
  ('cup-02', 'Sovuq ichimliklar uchun PET stakan', 'Stakanlar', 410, NULL, false, 'dona', 100, 'cup', '{"Shaffof","Qopqoqli"}', 'PET plastik', '{"350 ml","500 ml","700 ml"}', 'Limonad, milkshake va sovuq kofe uchun tiniq, mustahkam devorli stakan, qopqoq va nay bilan birga.', 'FP-CP-202', true, 40),
  ('pz-01', 'Pitsa qutisi (gofra karton)', 'Pitsa qutilari', 1450, 1780, false, 'dona', 50, 'pizza', '{"Havo teshiklari bor","Mustahkam"}', '3 qatlamli gofra karton', '{"26 sm","30 sm","33 sm","40 sm"}', 'Bug''ni chiqaruvchi teshiklar pitsa asosini mo''rt saqlaydi, tashish paytida shaklini yo''qotmaydi.', 'FP-PZ-301', true, 50),
  ('sl-01', 'Salat va lag''mon uchun deli idish', 'Salat idishlari', 590, NULL, false, 'dona', 50, 'deli', '{"Sizib chiqmaydigan qopqoq","Mikroto''lqinli pechga mos"}', 'PP plastik, shaffof qopqoq', '{"500 ml","750 ml","1000 ml"}', 'Salat, osh, lag''mon va sho''rvalar uchun germetik qopqoqli, isitishga chidamli idish.', 'FP-SL-401', true, 60),
  ('sl-02', 'Osh/plov uchun qopqoqli konteyner', 'Salat idishlari', 540, NULL, false, 'dona', 50, 'deli', '{"Moyga chidamli"}', 'Alyuminiy folga + karton qopqoq', '{"650 ml","900 ml"}', 'Issiq taomlarni uzoq vaqt saqlaydi, pechda qizdirish mumkin — dostavka xizmatlari uchun sinovdan o''tgan.', 'FP-SL-402', true, 70),
  ('bg-01', 'Kraft paket (qo''lchali)', 'Kraft paketlar', 480, NULL, true, 'dona', 100, 'bag', '{"Qattiq tutqich","Brendlash mumkin"}', 'Kraft qog''oz, 120 gsm', '{"S","M","L"}', 'Fast-food va dostavka buyurtmalarini olib ketish uchun mustahkam qo''lchali paket, logotip bosish mumkin.', 'FP-BG-501', true, 80),
  ('bg-02', 'Somsa/fast-food uchun qog''oz qadoq', 'Kraft paketlar', 210, NULL, false, 'dona', 100, 'bag', '{"Yog'' o''tkazmaydi"}', 'Pergament qog''oz', '{"20×20 sm"}', 'Somsa, pirojkina va boshqa yog''li mahsulotlarni o''rash uchun pergament qog''oz varag''i.', 'FP-BG-502', true, 90),
  ('ut-01', 'Yog''och asboblar to''plami', 'Asboblar va sous', 260, 320, false, 'to''plam', 100, 'cutlery', '{"100% biologik","Salfetka bilan"}', 'Qayin yog''ochi', '{"Vilka + qoshiq + salfetka"}', 'Plastiksiz muqobil — vilka, qoshiq va salfetkadan iborat individual o''ralgan to''plam.', 'FP-UT-601', true, 100),
  ('ut-02', 'Sous uchun kichik idishcha', 'Asboblar va sous', 90, NULL, false, 'dona', 200, 'sauce', '{"Sizib chiqmaydi"}', 'PP plastik + qopqoq', '{"30 ml","60 ml"}', 'Ketchup, mayonez va milliy souslar uchun qopqoqli kichik idishcha, avtomat dozatorlarga mos.', 'FP-UT-602', true, 110),
  ('th-01', 'Termo konteyner (dostavka uchun)', 'Termo konteynerlar', 3200, 3850, false, 'dona', 10, 'thermo', '{"4 soatgacha issiq saqlaydi"}', 'EPP ko''pik + kraft qoplama', '{"8 L","15 L","25 L"}', 'Kuryer sumkalari va velosipedlar uchun issiqlikni uzoq saqlaydigan qattiq korpusli konteyner.', 'FP-TH-701', true, 120)
on conflict (id) do nothing;

-- =====================================================================
-- MUHIM: O'ZINGIZNI ADMIN QILIB TAYINLASH
-- Avval saytda oddiy mijoz sifatida ro'yxatdan o'ting (yoki allaqachon
-- ro'yxatdan o'tgan bo'lsangiz), so'ng quyidagi so'rovni ALOHIDA ishga
-- tushiring — pastdagi telefon raqamni ro'yxatdan o'tishda ko'rsatgan
-- AYNAN o'sha raqamga almashtiring:
--
-- update public.profiles set is_admin = true
-- where phone = '+998901234567';
--
-- Ishga tushirgach, saytda /admin manziliga kirib ko'ring.
-- =====================================================================
