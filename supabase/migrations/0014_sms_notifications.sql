-- 0014_sms_notifications.sql
--
-- SMS xabarnomalar uchun uchta jadval:
-- 1) phone_otp_codes    — ro'yxatdan o'tishda telefon raqamni SMS orqali
--                         tasdiqlash (OTP) kodlari. Faqat server (service_role)
--                         orqali ishlatiladi, brauzerdan to'g'ridan-to'g'ri
--                         kirish yo'q.
-- 2) checkout_sessions  — mijoz "Buyurtma ma'lumotlari" bosqichiga kirganini
--                         qayd etadi, shu orqali to'lovsiz chiqib ketganlarni
--                         SMS bilan eslatish mumkin bo'ladi.
-- 3) cart_reminders_sent — savatda qolgan mahsulotlar haqida qaysi bosqich
--                         (2 soat/24 soat/7 kun/30 kun) SMS'i allaqachon
--                         yuborilganini qayd etadi (takror yubormaslik uchun).

create table if not exists public.phone_otp_codes (
  id uuid primary key default gen_random_uuid(),
  phone text not null,
  code_hash text not null,
  attempts integer not null default 0,
  verified boolean not null default false,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

alter table public.phone_otp_codes enable row level security;
-- Hech qanday policy qo'shilmaydi — bu jadvalga faqat service_role kaliti
-- (RLS'ni chetlab o'tadi) orqali, server API route'laridan kiriladi.

create index if not exists phone_otp_codes_phone_idx on public.phone_otp_codes (phone, created_at desc);

create table if not exists public.checkout_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  started_at timestamptz not null default now(),
  completed boolean not null default false,
  reminded boolean not null default false
);

alter table public.checkout_sessions enable row level security;

drop policy if exists "checkout_sessions_owner_all" on public.checkout_sessions;
create policy "checkout_sessions_owner_all"
on public.checkout_sessions
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create index if not exists checkout_sessions_pending_idx
  on public.checkout_sessions (completed, reminded, started_at);

create table if not exists public.cart_reminders_sent (
  user_id uuid not null references auth.users(id) on delete cascade,
  stage text not null,
  sent_at timestamptz not null default now(),
  primary key (user_id, stage)
);

alter table public.cart_reminders_sent enable row level security;
-- Faqat service_role (cron) orqali yoziladi/o'qiladi — mijoz tomonidan
-- to'g'ridan-to'g'ri kirish shart emas.
