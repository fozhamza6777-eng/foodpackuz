-- Faqat o'lchami bilan farq qiladigan mahsulotlarni bitta kartochkada ko'rsatish.
--
-- Har bir o'lcham alohida haqiqiy mahsulot bo'lib qoladi (o'z narxi, qadoq hajmi,
-- kodi va rasmlari bilan) — shuning uchun savat, buyurtma, sevimlilar va sharhlar
-- o'zgarishsiz ishlaydi. `variant_of` — shu mahsulot qaysi "asosiy" mahsulot
-- kartochkasida o'lcham tugmasi bo'lib chiqishini bildiradi. Katalogda faqat
-- `variant_of` bo'sh mahsulotlar kartochka bo'ladi.
--
-- Asosiy mahsulot o'chirilsa, uning o'lchamlari yo'qolib ketmaydi — ular
-- alohida kartochka bo'lib qoladi (on delete set null).

alter table products add column if not exists variant_of text references products(id) on delete set null;
alter table products add column if not exists variant_label text;

alter table products drop constraint if exists products_variant_not_self;
alter table products
  add constraint products_variant_not_self check (variant_of is null or variant_of <> id);

create index if not exists products_variant_of_idx on products (variant_of) where variant_of is not null;
