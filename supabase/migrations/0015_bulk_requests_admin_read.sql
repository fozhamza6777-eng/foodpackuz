-- 0015_bulk_requests_admin_read.sql
--
-- "Hamkorlik" bo'limidan kelgan so'rovlar (bulk_requests) hozirgacha faqat
-- Supabase boshqaruv paneli (Table Editor) orqali ko'rinar edi — saytda hech
-- kim, hatto admin ham, ularni o'qiy olmasdi (faqat INSERT siyosati bor edi).
-- Bu skript ADMIN uchun o'qish (SELECT) huquqini qo'shadi, shunda so'rovlar
-- admin panelida ham ko'rinadi. Oddiy mijozlar hamon o'qiy olmaydi.

drop policy if exists "bulk_requests_admin_read" on public.bulk_requests;
create policy "bulk_requests_admin_read"
on public.bulk_requests
for select
using (exists (select 1 from public.profiles where id = auth.uid() and is_admin));
