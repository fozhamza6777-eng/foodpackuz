-- 0011_customer_order_edit.sql
--
-- Maqsad: mijozga hali qayta ishlanmagan ("yangi" holatidagi) buyurtmasini o'zi
-- tahrirlash — mahsulot sonini o'zgartirish yoki mahsulotni o'chirish — imkonini
-- berish. Bu orders jadvalidagi mijoz tomonidan UPDATE qilishni cheklovchi barcha
-- maxsus trigerlarni bitta izchil trigerga almashtiradi, shunda ikkala qoida ham
-- (bekor qilish so'rovi + tahrirlash) bir joyda boshqariladi va bir-biriga
-- to'g'anoq bo'lmaydi.
--
-- Ushbu faylni Supabase SQL Editor'da to'liq ishga tushiring (README'dagi
-- boshqa migratsiyalar kabi).

do $$
declare r record;
begin
  for r in
    select tgname
    from pg_trigger
    where tgrelid = 'public.orders'::regclass
      and not tgisinternal
  loop
    execute format('drop trigger if exists %I on public.orders', r.tgname);
  end loop;
end $$;

create or replace function public.enforce_orders_customer_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  is_admin_user boolean;
  computed_total numeric;
begin
  -- Admin uchun hech qanday cheklov yo'q
  select is_admin into is_admin_user from public.profiles where id = auth.uid();
  if coalesce(is_admin_user, false) then
    return new;
  end if;

  if new.user_id is distinct from old.user_id then
    raise exception 'Foydalanuvchini o''zgartirib bo''lmaydi';
  end if;

  -- 1) Bekor qilish so'rovi: yetkazilmagan va hali bekor qilinmagan buyurtmada,
  --    faqat status va cancel_reason o'zgarishi mumkin.
  if new.status = 'bekor_sorovi' and old.status not in ('bekor', 'bekor_sorovi', 'yetkazildi') then
    if new.cancel_reason is null or length(trim(new.cancel_reason)) = 0 then
      raise exception 'Bekor qilish sababini kiriting';
    end if;
    if new.items is distinct from old.items
      or new.total is distinct from old.total
      or coalesce(new.address, '') is distinct from coalesce(old.address, '')
      or new.branch_id is distinct from old.branch_id
      or new.branch_name is distinct from old.branch_name
      or new.latitude is distinct from old.latitude
      or new.longitude is distinct from old.longitude
      or coalesce(new.note, '') is distinct from coalesce(old.note, '') then
      raise exception 'Bekor qilish so''rovida faqat holat va sababni o''zgartirish mumkin';
    end if;
    return new;
  end if;

  -- 2) Buyurtmani tahrirlash: faqat "yangi" holatida (kuryer hali chiqmagan,
  --    to'lov hali olinmagan), faqat mahsulotlar ro'yxati va jami summa o'zgaradi.
  if old.status = 'yangi' and new.status = 'yangi' then
    if coalesce(new.address, '') is distinct from coalesce(old.address, '')
      or new.branch_id is distinct from old.branch_id
      or new.branch_name is distinct from old.branch_name
      or new.latitude is distinct from old.latitude
      or new.longitude is distinct from old.longitude
      or coalesce(new.note, '') is distinct from coalesce(old.note, '')
      or new.cancel_reason is distinct from old.cancel_reason then
      raise exception 'Faqat mahsulotlar ro''yxatini o''zgartirish mumkin';
    end if;
    if jsonb_array_length(new.items) = 0 then
      raise exception 'Buyurtmada kamida bitta mahsulot qolishi kerak — butunlay bekor qilish uchun "Bekor qilishni so''rash"dan foydalaning';
    end if;
    select coalesce(sum((item->>'price')::numeric * (item->>'qty')::numeric), 0)
      into computed_total
      from jsonb_array_elements(new.items) as item;
    if round(computed_total) <> round(new.total) then
      raise exception 'Jami summa mahsulotlar bilan mos kelmayapti';
    end if;
    return new;
  end if;

  raise exception 'Bu buyurtmani ushbu holatda o''zgartirib bo''lmaydi';
end;
$$;

create trigger orders_customer_update_guard
before update on public.orders
for each row execute function public.enforce_orders_customer_update();

-- Mijoz o'ziga tegishli buyurtmani UPDATE qila olishi uchun ruxsat (aniq
-- o'zgartirish qoidalarini yuqoridagi triger nazorat qiladi).
drop policy if exists "orders_customer_update_v2" on public.orders;
create policy "orders_customer_update_v2"
on public.orders
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);
