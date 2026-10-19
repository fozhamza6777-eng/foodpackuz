-- Buyurtma narxlarini SERVERDA (bazada) tekshirish.
--
-- Muammo: buyurtma brauzerdan to'g'ridan-to'g'ri Supabase'ga yozilardi va narx/summa mijozning brauzerida
-- hisoblanardi — tajribali foydalanuvchi narxni o'zgartirib (masalan 1 so'm) buyurtma yuborishi mumkin edi.
-- Yana: tahrirlashda narxlarning o'zi tekshirilmasdi, to'lov holatini ("tasdiqlangan") mijozning o'zi belgilashi mumkin edi.
--
-- Yechim: orders jadvalidagi trigger (brauzerni chetlab o'tib bo'lmaydi):
--  * YANGI buyurtma: har bir mahsulot katalogda mavjud va faol, narxi katalogdagi hozirgi narxga teng,
--    miqdor qadoqqa karrali, jami summa to'g'ri; holat "yangi", to'lov holati faqat to'g'ri boshlang'ich.
--  * TAHRIR (mijoz "yangi" buyurtmani o'zgartirganda): mahsulotning o'z (buyurtma vaqtidagi) narxi saqlanadi,
--    yangi mahsulot qo'shib bo'lmaydi, miqdorni faqat narx o'zgarmagan bo'lsa oshirish mumkin, takroriy qator yo'q.
--  * Mijoz to'lov holati, chek va CRM maydonlarini o'zgartira olmaydi.
-- Admin va server (service_role) cheklanmaydi.

create or replace function public.assert_order_items(p_items jsonb, p_total numeric, p_old_items jsonb default null)
returns void
language plpgsql
stable
set search_path = public
as $$
declare
  it jsonb;
  old_it jsonb;
  pid text;
  price_n numeric;
  qty_n numeric;
  prod record;
  prod_found boolean;
  computed numeric := 0;
  line_count integer;
  distinct_ids integer;
begin
  if p_items is null or jsonb_typeof(p_items) <> 'array' then
    raise exception 'Buyurtma tarkibi noto''g''ri';
  end if;
  line_count := jsonb_array_length(p_items);
  if line_count < 1 or line_count > 100 then
    raise exception 'Buyurtmada 1 tadan 100 tagacha mahsulot bo''lishi kerak';
  end if;

  if p_old_items is not null then
    select count(distinct e ->> 'id') into distinct_ids from jsonb_array_elements(p_items) e;
    if distinct_ids <> line_count then
      raise exception 'Bir xil mahsulotni takroran kiritib bo''lmaydi';
    end if;
  end if;

  for it in select e from jsonb_array_elements(p_items) e loop
    if jsonb_typeof(it) <> 'object' then
      raise exception 'Buyurtma tarkibi noto''g''ri';
    end if;
    pid := it ->> 'id';
    if pid is null
       or coalesce(it ->> 'price', '') !~ '^[0-9]{1,12}$'
       or coalesce(it ->> 'qty', '') !~ '^[0-9]{1,9}$' then
      raise exception 'Buyurtma tarkibi noto''g''ri';
    end if;
    price_n := (it ->> 'price')::numeric;
    qty_n := (it ->> 'qty')::numeric;
    if qty_n < 1 then
      raise exception 'Miqdor kamida 1 bo''lishi kerak';
    end if;

    select p.price, p.pack_size, p.carton_size, p.is_active, p.name
      into prod
      from products p
     where p.id = pid;
    prod_found := found;

    if p_old_items is null then
      -- Yangi buyurtma: hamma narsa katalogdagi hozirgi holatga mos bo'lishi shart.
      if not prod_found or not prod.is_active or prod.price <> price_n then
        raise exception 'Narxlar o''zgargan yoki mahsulot sotuvda yo''q (%). Savatni yangilab, qayta urinib ko''ring.', coalesce(prod.name, pid);
      end if;
      if not (qty_n % prod.pack_size = 0 or (prod.carton_size is not null and qty_n % prod.carton_size = 0)) then
        raise exception 'Miqdor qadoq hajmiga karrali bo''lishi kerak (%)', prod.name;
      end if;
    else
      -- Mavjud buyurtmani tahrirlash: faqat o'zining qatorlari, o'z narxi bilan.
      select o into old_it from jsonb_array_elements(p_old_items) o where o ->> 'id' = pid limit 1;
      if old_it is null then
        raise exception 'Mavjud buyurtmaga yangi mahsulot qo''shib bo''lmaydi';
      end if;
      if price_n <> (old_it ->> 'price')::numeric then
        raise exception 'Buyurtmadagi mahsulot narxini o''zgartirib bo''lmaydi';
      end if;
      if qty_n > (old_it ->> 'qty')::numeric then
        -- Miqdorni oshirish: narx hozirgi katalog narxi bilan bir xil bo'lgandagina.
        if not prod_found or not prod.is_active or prod.price <> price_n then
          raise exception 'Narxlar o''zgargan — (%) miqdorini oshirib bo''lmaydi', coalesce(prod.name, pid);
        end if;
        if not (qty_n % prod.pack_size = 0 or (prod.carton_size is not null and qty_n % prod.carton_size = 0)) then
          raise exception 'Miqdor qadoq hajmiga karrali bo''lishi kerak (%)', prod.name;
        end if;
      end if;
    end if;

    computed := computed + price_n * qty_n;
  end loop;

  if p_total is null or round(computed) <> round(p_total) then
    raise exception 'Jami summa mahsulotlar bilan mos kelmayapti';
  end if;
end;
$$;

create or replace function public.orders_validate_integrity()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  is_admin_user boolean;
begin
  -- Server (service_role) va admin cheklanmaydi.
  if auth.uid() is null then
    return new;
  end if;
  select is_admin into is_admin_user from public.profiles where id = auth.uid();
  if coalesce(is_admin_user, false) then
    return new;
  end if;

  if tg_op = 'INSERT' then
    if new.status <> 'yangi' then
      raise exception 'Yangi buyurtma "yangi" holatida bo''lishi kerak';
    end if;
    if new.payment_status is distinct from (case when new.payment_method = 'karta' then 'kutilmoqda' else 'none' end) then
      raise exception 'To''lov holati noto''g''ri';
    end if;
    if new.crm_lead_id is not null or new.crm_synced_at is not null or new.cancel_reason is not null then
      raise exception 'Buyurtma ma''lumotlari noto''g''ri';
    end if;
    perform public.assert_order_items(new.items, new.total, null);
  else
    if new.payment_status is distinct from old.payment_status
       or new.payment_receipt_path is distinct from old.payment_receipt_path
       or new.crm_lead_id is distinct from old.crm_lead_id
       or new.crm_synced_at is distinct from old.crm_synced_at then
      raise exception 'To''lov va CRM ma''lumotlarini o''zgartirib bo''lmaydi';
    end if;
    if new.items is distinct from old.items or new.total is distinct from old.total then
      perform public.assert_order_items(new.items, new.total, old.items);
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists orders_validate_integrity on public.orders;
create trigger orders_validate_integrity
  before insert or update on public.orders
  for each row execute function public.orders_validate_integrity();

-- 3) Eski himoya (enforce_orders_customer_update) server tomonidan (service_role, auth.uid() bo'sh) qilinadigan
--    yangilanishlarni ham to'sib qo'yardi: masalan amoCRM sinxronizatsiyasi "yangi"dan boshqa holatdagi buyurtmada
--    CRM maydonlarini yoki holatni yangilay olmasdi ("Bu buyurtmani ushbu holatda o'zgartirib bo'lmaydi").
--    Faqat boshiga "server cheklanmaydi" tekshiruvi qo'shildi; mijozlar uchun qoidalar o'zgarmadi.
create or replace function public.enforce_orders_customer_update()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  is_admin_user boolean;
  computed_total numeric;
begin
  if auth.uid() is null then
    return new;
  end if;

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