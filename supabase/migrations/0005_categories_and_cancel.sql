-- =====================================================================
-- FOOD BOX — 5-migratsiya: dinamik kategoriyalar, ko'p bo'limli
-- mahsulotlar va mijoz tomonidan buyurtmani bekor qilish
-- Bu faylni Supabase loyihangizda "SQL Editor" bo'limiga to'liq nusxalab,
-- "Run" tugmasini bosing (0001–0004 dan KEYIN ishga tushiring).
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1) ORDERS — bekor qilish sababi va mijoz uchun cheklangan UPDATE
--    siyosati (faqat status'ni "bekor" yoki "bekor_sorovi" ga
--    o'zgartirishga ruxsat beradi, boshqa hech nimaga emas)
-- ---------------------------------------------------------------------
alter table public.orders add column if not exists cancel_reason text;

drop policy if exists "Orders: mijoz bekor qiladi" on public.orders;
create policy "Orders: mijoz bekor qiladi"
  on public.orders for update
  using (
    auth.uid() = user_id
    and status not in ('bekor', 'bekor_sorovi', 'yetkazildi')
  )
  with check (
    auth.uid() = user_id
    and (
      (status = 'bekor' and created_at > now() - interval '1 hour')
      or (status = 'bekor_sorovi' and cancel_reason is not null and length(trim(cancel_reason)) > 0)
    )
  );

-- ---------------------------------------------------------------------
-- 2) CATEGORIES — admin tomonidan boshqariladigan bo'limlar ro'yxati
-- ---------------------------------------------------------------------
create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.categories enable row level security;

drop policy if exists "Categories: hamma o'qiydi" on public.categories;
create policy "Categories: hamma o'qiydi"
  on public.categories for select
  using (true);

drop policy if exists "Categories: faqat admin qo'shadi" on public.categories;
create policy "Categories: faqat admin qo'shadi"
  on public.categories for insert
  with check (public.is_admin());

drop policy if exists "Categories: faqat admin yangilaydi" on public.categories;
create policy "Categories: faqat admin yangilaydi"
  on public.categories for update
  using (public.is_admin());

drop policy if exists "Categories: faqat admin o'chiradi" on public.categories;
create policy "Categories: faqat admin o'chiradi"
  on public.categories for delete
  using (public.is_admin());

insert into public.categories (name, sort_order) values
  ('Klamshell qutilar', 10),
  ('Stakanlar', 20),
  ('Pitsa qutilari', 30),
  ('Salat idishlari', 40),
  ('Kraft paketlar', 50),
  ('Asboblar va sous', 60),
  ('Termo konteynerlar', 70)
on conflict (name) do nothing;

-- ---------------------------------------------------------------------
-- 3) PRODUCTS — bitta mahsulot endi bir nechta bo'limga tegishli
--    bo'lishi mumkin (masalan, "Pitsa qutisi" ham "Pitsa qutilari"da,
--    ham "Gofro qutilar"da ko'rinishi mumkin)
-- ---------------------------------------------------------------------
alter table public.products add column if not exists categories text[];

update public.products
set categories = array[category]
where categories is null or array_length(categories, 1) is null;

alter table public.products alter column categories set default '{}';
alter table public.products alter column categories set not null;

-- =====================================================================
-- TEKSHIRISH (ixtiyoriy):
--   select id, name, category, categories from public.products;
--   select * from public.categories order by sort_order;
-- =====================================================================
