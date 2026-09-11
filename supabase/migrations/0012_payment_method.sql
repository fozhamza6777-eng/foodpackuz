-- 0012_payment_method.sql
--
-- Buyurtma rasmiylashtirilayotganda mijoz to'lov usulini (naqd yoki karta)
-- tanlaydi. Bu ustun shu tanlovni saqlaydi — haqiqiy to'lov hamon kuryerga
-- yetkazib berish paytida qabul qilinadi (onlayn to'lov shlyuzi ulanmagan).

alter table public.orders
  add column if not exists payment_method text not null default 'naqd';

alter table public.orders
  drop constraint if exists orders_payment_method_check;

alter table public.orders
  add constraint orders_payment_method_check check (payment_method in ('naqd', 'karta'));

-- 0011_customer_order_edit.sql'dagi trigerni payment_method ustunini ham
-- hisobga oladigan qilib yangilaymiz (mijoz "Yangi" holatda mahsulotlarni
-- tahrirlaganda to'lov usulini o'zgartira olmasligi kerak).
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
  select is_admin into is_admin_user from public.profiles where id = auth.uid();
  if coalesce(is_admin_user, false) then
    return new;
  end if;

  if new.user_id is distinct from old.user_id then
    raise exception 'Foydalanuvchini o''zgartirib bo''lmaydi';
  end if;

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
      or new.payment_method is distinct from old.payment_method
      or coalesce(new.note, '') is distinct from coalesce(old.note, '') then
      raise exception 'Bekor qilish so''rovida faqat holat va sababni o''zgartirish mumkin';
    end if;
    return new;
  end if;

  if old.status = 'yangi' and new.status = 'yangi' then
    if coalesce(new.address, '') is distinct from coalesce(old.address, '')
      or new.branch_id is distinct from old.branch_id
      or new.branch_name is distinct from old.branch_name
      or new.latitude is distinct from old.latitude
      or new.longitude is distinct from old.longitude
      or new.payment_method is distinct from old.payment_method
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
