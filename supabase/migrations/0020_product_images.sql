-- Bitta mahsulotga 4 tagacha rasm: mijozlar mahsulotni turli tomondan ko'ra olishi uchun.
--
-- `images` — barcha rasmlarning tartiblangan ro'yxati (birinchisi — asosiy rasm).
-- Eski `image_url` ustuni saqlanib qoladi va doim `images[1]` bilan bir xil bo'ladi
-- (savat, sevimlilar, statistika va boshqa joylar shu ustundan foydalanadi).

alter table products add column if not exists images text[] not null default '{}';

-- Mavjud mahsulotlar: bitta rasmni galereyaning birinchi rasmi qilib ko'chiramiz.
update products
set images = array[image_url]
where image_url is not null
  and image_url <> ''
  and cardinality(images) = 0;

alter table products drop constraint if exists products_images_max_4;
alter table products
  add constraint products_images_max_4 check (cardinality(images) <= 4);
