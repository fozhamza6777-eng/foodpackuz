-- =====================================================================
-- FOOD BOX — 2-migratsiya: tashkilot nomi, filiallar va geolokatsiya
-- Bu faylni ham Supabase loyihangizda "SQL Editor" bo'limiga to'liq
-- nusxalab, "Run" tugmasini bosing. (0001_init.sql allaqachon
-- ishga tushirilgan bo'lishi kerak — bu fayl o'shani TO'LDIRADI,
-- uni almashtirmaydi.)
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1) PROFILES jadvaliga tashkilot nomini qo'shish
--    (kafe, restoran yoki fast-food shoxobchasi nomi)
-- ---------------------------------------------------------------------
alter table public.profiles
  add column if not exists company_name text;

-- Yangi ro'yxatdan o'tuvchilar uchun trigger funksiyasini yangilaymiz,
-- endi u company_name'ni ham avtomatik saqlaydi.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, phone, company_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    coalesce(new.raw_user_meta_data ->> 'phone', ''),
    coalesce(new.raw_user_meta_data ->> 'company_name', '')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

-- ---------------------------------------------------------------------
-- 2) BRANCHES — bitta profildan bir nechta filialga (shoxobcha) buyurtma
--    berish uchun saqlanadigan manzillar ro'yxati.
-- ---------------------------------------------------------------------
create table if not exists public.branches (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  address text not null,
  latitude double precision,
  longitude double precision,
  created_at timestamptz not null default now()
);

alter table public.branches enable row level security;

drop policy if exists "Branches: foydalanuvchi faqat o'zinikini ko'radi" on public.branches;
create policy "Branches: foydalanuvchi faqat o'zinikini ko'radi"
  on public.branches for select
  using (auth.uid() = user_id);

drop policy if exists "Branches: foydalanuvchi faqat o'zinikini yaratadi" on public.branches;
create policy "Branches: foydalanuvchi faqat o'zinikini yaratadi"
  on public.branches for insert
  with check (auth.uid() = user_id);

drop policy if exists "Branches: foydalanuvchi faqat o'zinikini yangilaydi" on public.branches;
create policy "Branches: foydalanuvchi faqat o'zinikini yangilaydi"
  on public.branches for update
  using (auth.uid() = user_id);

drop policy if exists "Branches: foydalanuvchi faqat o'zinikini o'chiradi" on public.branches;
create policy "Branches: foydalanuvchi faqat o'zinikini o'chiradi"
  on public.branches for delete
  using (auth.uid() = user_id);

-- ---------------------------------------------------------------------
-- 3) ORDERS jadvaliga filial havolasi va geolokatsiya ustunlarini qo'shish
-- ---------------------------------------------------------------------
alter table public.orders
  add column if not exists branch_id uuid references public.branches (id) on delete set null,
  add column if not exists branch_name text,
  add column if not exists latitude double precision,
  add column if not exists longitude double precision;

-- =====================================================================
-- TEKSHIRISH (ixtiyoriy):
--   select * from public.branches;
--   select id, full_name, company_name from public.profiles;
--   select id, branch_name, latitude, longitude from public.orders;
-- =====================================================================
