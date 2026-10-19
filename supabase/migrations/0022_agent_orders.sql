-- AI agent orqali buyurtma berish.
--
-- Oqim: mijoz profilida "AI kalit" yaratadi -> AI agent shu kalit bilan buyurtma SO'ROVI
-- (qoralama) yaratadi -> buyurtma faqat profil egasi saytda bitta tugmani bosib TASDIQLAGANDAN
-- keyin haqiqiy buyurtmaga (orders) aylanadi. Tasdiqlanmagan qoralamalar admin panelda,
-- CRM'da va statistikada ko'rinmaydi.
--
-- Kalitning o'zi bazada saqlanmaydi — faqat SHA-256 xeshi (kalit mijozga bir marta ko'rsatiladi).

-- 1) AI kalitlar ---------------------------------------------------------------

create table if not exists public.agent_api_keys (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 60),
  key_hash text not null unique check (key_hash ~ '^[0-9a-f]{64}$'),
  key_prefix text not null,
  created_at timestamptz not null default now(),
  last_used_at timestamptz,
  revoked_at timestamptz
);

create index if not exists agent_api_keys_user_idx on public.agent_api_keys (user_id);

alter table public.agent_api_keys enable row level security;

drop policy if exists "Agent keys: foydalanuvchi faqat o'zinikini ko'radi" on public.agent_api_keys;
create policy "Agent keys: foydalanuvchi faqat o'zinikini ko'radi"
  on public.agent_api_keys for select
  using (auth.uid() = user_id);

drop policy if exists "Agent keys: foydalanuvchi faqat o'zinikini yangilaydi" on public.agent_api_keys;
create policy "Agent keys: foydalanuvchi faqat o'zinikini yangilaydi"
  on public.agent_api_keys for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Yaratish faqat quyidagi funksiya orqali (RLS'da INSERT siyosati yo'q). Mijoz kalitni brauzerda
-- yaratadi va faqat xeshini yuboradi.
create or replace function public.create_agent_api_key(p_name text, p_key_hash text, p_key_prefix text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  active_count integer;
  new_id uuid;
begin
  if uid is null then
    raise exception 'Tizimga kiring';
  end if;
  if p_name is null or char_length(trim(p_name)) = 0 or char_length(p_name) > 60 then
    raise exception 'Kalit nomi 1 dan 60 gacha belgi bo''lishi kerak';
  end if;
  if p_key_hash is null or p_key_hash !~ '^[0-9a-f]{64}$' then
    raise exception 'Noto''g''ri kalit';
  end if;

  select count(*) into active_count
    from public.agent_api_keys
   where user_id = uid and revoked_at is null;
  if active_count >= 5 then
    raise exception 'Eng ko''pi bilan 5 ta faol kalit bo''lishi mumkin. Keraksizini bekor qiling';
  end if;

  insert into public.agent_api_keys (user_id, name, key_hash, key_prefix)
  values (uid, trim(p_name), p_key_hash, left(coalesce(p_key_prefix, ''), 12))
  returning id into new_id;

  return new_id;
end;
$$;

revoke all on function public.create_agent_api_key(text, text, text) from public;
-- Supabase yangi funksiyalarga anon uchun ham ruxsat beradi — kalitni faqat tizimga kirganlar yarata olsin.
revoke execute on function public.create_agent_api_key(text, text, text) from anon;
grant execute on function public.create_agent_api_key(text, text, text) to authenticated;

-- Mijoz kalitda faqat "bekor qilish"ni (revoked_at) bajara oladi; qolgan maydonlarni o'zgartirib bo'lmaydi.
-- (Server tomoni — service_role, auth.uid() bo'sh — last_used_at'ni yangilaydi.)
create or replace function public.agent_api_keys_guard()
returns trigger
language plpgsql
as $$
begin
  if auth.uid() is null then
    return new;
  end if;
  if new.user_id is distinct from old.user_id
     or new.name is distinct from old.name
     or new.key_hash is distinct from old.key_hash
     or new.key_prefix is distinct from old.key_prefix
     or new.created_at is distinct from old.created_at
     or new.last_used_at is distinct from old.last_used_at
     or (old.revoked_at is not null and new.revoked_at is distinct from old.revoked_at) then
    raise exception 'Kalitda faqat bekor qilish mumkin';
  end if;
  return new;
end;
$$;

drop trigger if exists agent_api_keys_guard on public.agent_api_keys;
create trigger agent_api_keys_guard
  before update on public.agent_api_keys
  for each row execute function public.agent_api_keys_guard();

-- 2) Tasdiqlashni kutayotgan buyurtmalar (qoralamalar) -----------------------------

create table if not exists public.agent_orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  key_id uuid references public.agent_api_keys (id) on delete set null,
  agent_name text not null,
  items jsonb not null,
  total bigint not null check (total > 0),
  address text not null,
  branch_id uuid references public.branches (id) on delete set null,
  branch_name text,
  latitude double precision,
  longitude double precision,
  note text,
  payment_method text not null default 'naqd' check (payment_method = 'naqd'),
  idempotency_key text,
  status text not null default 'pending' check (status in ('pending', 'confirmed', 'rejected', 'expired')),
  order_id uuid references public.orders (id) on delete set null,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  decided_at timestamptz
);

create unique index if not exists agent_orders_idempotency_idx
  on public.agent_orders (user_id, idempotency_key)
  where idempotency_key is not null;

create index if not exists agent_orders_user_status_idx
  on public.agent_orders (user_id, status, created_at desc);

alter table public.agent_orders enable row level security;

-- Mijoz faqat o'zining qoralamalarini ko'ra oladi. Yaratish/yangilash faqat server (service_role) orqali —
-- narxlar serverda bazadagi narxlar bo'yicha hisoblanadi, tasdiqlash ham serverda bajariladi.
drop policy if exists "Agent orders: foydalanuvchi faqat o'zinikini ko'radi" on public.agent_orders;
create policy "Agent orders: foydalanuvchi faqat o'zinikini ko'radi"
  on public.agent_orders for select
  using (auth.uid() = user_id);

-- 3) Buyurtma manbasi: "AI" belgisi -------------------------------------------------

alter table public.orders add column if not exists source text not null default 'web';
alter table public.orders add column if not exists agent_name text;

alter table public.orders drop constraint if exists orders_source_check;
alter table public.orders add constraint orders_source_check check (source in ('web', 'ai_agent'));

-- Brauzer orqali (auth.uid() bor) "AI orqali" belgisi bilan buyurtma yaratib yoki manbani o'zgartirib bo'lmaydi;
-- faqat server (service_role) va admin buni bajara oladi.
create or replace function public.orders_protect_source()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  is_admin_user boolean;
begin
  if auth.uid() is null then
    return new;
  end if;
  select is_admin into is_admin_user from public.profiles where id = auth.uid();
  if coalesce(is_admin_user, false) then
    return new;
  end if;

  if tg_op = 'INSERT' then
    if new.source <> 'web' or new.agent_name is not null then
      raise exception 'Buyurtma manbasini belgilab bo''lmaydi';
    end if;
  else
    if new.source is distinct from old.source or new.agent_name is distinct from old.agent_name then
      raise exception 'Buyurtma manbasini o''zgartirib bo''lmaydi';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists orders_protect_source on public.orders;
create trigger orders_protect_source
  before insert or update on public.orders
  for each row execute function public.orders_protect_source();
