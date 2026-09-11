-- 0013_payment_verification.sql
--
-- "Karta orqali" to'lovni tasdiqlash uchun:
-- 1) `payment_cards` jadvali - admin panelda ko'rsatiladigan (mijoz pul
--    o'tkazadigan) karta raqamlari.
-- 2) `orders` jadvaliga to'lov chekining Storage yo'li va tekshiruv holati
--    ustunlari.
-- 3) Chek skrinshotlari uchun maxfiy (public bo'lmagan) Storage bucket -
--    faqat egasi va admin ko'ra oladi.

create table if not exists public.payment_cards (
  id uuid primary key default gen_random_uuid(),
  bank_name text,
  card_holder text,
  card_number text not null,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

alter table public.payment_cards enable row level security;

drop policy if exists "payment_cards_public_read" on public.payment_cards;
create policy "payment_cards_public_read"
on public.payment_cards
for select
using (is_active = true);

drop policy if exists "payment_cards_admin_all" on public.payment_cards;
create policy "payment_cards_admin_all"
on public.payment_cards
for all
using (exists (select 1 from public.profiles where id = auth.uid() and is_admin))
with check (exists (select 1 from public.profiles where id = auth.uid() and is_admin));

alter table public.orders
  add column if not exists payment_receipt_path text,
  add column if not exists payment_status text not null default 'none';

alter table public.orders
  drop constraint if exists orders_payment_status_check;

alter table public.orders
  add constraint orders_payment_status_check
  check (payment_status in ('none', 'kutilmoqda', 'tasdiqlangan', 'rad_etilgan'));

insert into storage.buckets (id, name, public)
values ('payment-receipts', 'payment-receipts', false)
on conflict (id) do nothing;

drop policy if exists "payment_receipts_owner_insert" on storage.objects;
create policy "payment_receipts_owner_insert"
on storage.objects for insert
with check (
  bucket_id = 'payment-receipts'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "payment_receipts_read" on storage.objects;
create policy "payment_receipts_read"
on storage.objects for select
using (
  bucket_id = 'payment-receipts'
  and (
    (storage.foldername(name))[1] = auth.uid()::text
    or exists (select 1 from public.profiles where id = auth.uid() and is_admin)
  )
);
