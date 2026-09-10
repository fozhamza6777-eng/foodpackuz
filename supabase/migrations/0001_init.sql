-- =====================================================================
-- FOOD BOX — Supabase boshlang'ich sxemasi
-- Bu faylni Supabase loyihangizda "SQL Editor" bo'limiga to'liq nusxalab,
-- "Run" tugmasini bosing. Barcha jadvallar avtomatik xavfsizlik (RLS)
-- siyosatlari bilan birga yaratiladi.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1) PROFILES — har bir ro'yxatdan o'tgan mijozning ism/telefon ma'lumoti
--    auth.users jadvaliga bog'langan (Supabase Auth avtomatik boshqaradi,
--    parollar hech qachon shu jadvalga yozilmaydi va ochiq holda saqlanmaydi).
-- ---------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null,
  phone text not null,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

drop policy if exists "Profiles: foydalanuvchi faqat o'zinikini ko'radi" on public.profiles;
create policy "Profiles: foydalanuvchi faqat o'zinikini ko'radi"
  on public.profiles for select
  using (auth.uid() = id);

drop policy if exists "Profiles: foydalanuvchi faqat o'zinikini yangilaydi" on public.profiles;
create policy "Profiles: foydalanuvchi faqat o'zinikini yangilaydi"
  on public.profiles for update
  using (auth.uid() = id);

drop policy if exists "Profiles: foydalanuvchi faqat o'zinikini yaratadi" on public.profiles;
create policy "Profiles: foydalanuvchi faqat o'zinikini yaratadi"
  on public.profiles for insert
  with check (auth.uid() = id);

-- Yangi foydalanuvchi ro'yxatdan o'tganda profil qatorini avtomatik yaratuvchi trigger
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, phone)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    coalesce(new.raw_user_meta_data ->> 'phone', '')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ---------------------------------------------------------------------
-- 2) ORDERS — mijozlarning buyurtmalari
-- ---------------------------------------------------------------------
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  items jsonb not null,
  total bigint not null check (total >= 0),
  address text,
  note text,
  status text not null default 'yangi',
  created_at timestamptz not null default now()
);

alter table public.orders enable row level security;

drop policy if exists "Orders: foydalanuvchi faqat o'zinikini ko'radi" on public.orders;
create policy "Orders: foydalanuvchi faqat o'zinikini ko'radi"
  on public.orders for select
  using (auth.uid() = user_id);

drop policy if exists "Orders: foydalanuvchi faqat o'zinikini yaratadi" on public.orders;
create policy "Orders: foydalanuvchi faqat o'zinikini yaratadi"
  on public.orders for insert
  with check (auth.uid() = user_id);

-- ---------------------------------------------------------------------
-- 3) BULK_REQUESTS — "Hamkorlik" bo'limidagi ulgurji narx so'rovlari.
--    Har kim (hatto ro'yxatdan o'tmagan mehmon ham) so'rov yubora oladi,
--    lekin faqat sayt egasi (Supabase paneli orqali) buni o'qiy oladi —
--    shuning uchun SELECT siyosati atayin qo'shilmagan.
-- ---------------------------------------------------------------------
create table if not exists public.bulk_requests (
  id uuid primary key default gen_random_uuid(),
  company text not null,
  phone text not null,
  volume text not null,
  created_at timestamptz not null default now()
);

alter table public.bulk_requests enable row level security;

drop policy if exists "Bulk requests: hamma so'rov yubora oladi" on public.bulk_requests;
create policy "Bulk requests: hamma so'rov yubora oladi"
  on public.bulk_requests for insert
  with check (true);

-- =====================================================================
-- TEKSHIRISH: quyidagi so'rovlar orqali jadvallar to'g'ri yaratilganini
-- ko'rishingiz mumkin (ixtiyoriy, ishga tushirish shart emas):
--   select * from public.profiles;
--   select * from public.orders;
--   select * from public.bulk_requests;
-- =====================================================================
