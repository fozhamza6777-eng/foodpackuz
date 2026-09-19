-- Muammo: ro'yxatdan o'tgan foydalanuvchi savatdan mahsulotni o'chirsa,
-- saytga qaytib kirganda o'chirilgan mahsulot yana savatda paydo bo'lib
-- qolardi. Sababi: "cart_items" jadvalida foydalanuvchiga o'z qatorlarini
-- O'CHIRISHGA (DELETE) ruxsat beruvchi RLS siyosati yo'q edi — DELETE
-- so'rovi xatosiz, lekin 0 qator o'chirgan holda "muvaffaqiyatli" qaytardi,
-- shuning uchun brauzerda mahsulot yo'qolgandek ko'rinardi, lekin serverda
-- qolib ketardi va keyingi tashrifda serverdagi eski ma'lumot ustunlik
-- qilib, mahsulot qaytadan paydo bo'lardi.

alter table cart_items enable row level security;

drop policy if exists "cart_items_select_own" on cart_items;
create policy "cart_items_select_own" on cart_items
  for select
  using (auth.uid() = user_id);

drop policy if exists "cart_items_insert_own" on cart_items;
create policy "cart_items_insert_own" on cart_items
  for insert
  with check (auth.uid() = user_id);

drop policy if exists "cart_items_update_own" on cart_items;
create policy "cart_items_update_own" on cart_items
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "cart_items_delete_own" on cart_items;
create policy "cart_items_delete_own" on cart_items
  for delete
  using (auth.uid() = user_id);
