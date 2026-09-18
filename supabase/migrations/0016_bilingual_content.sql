-- 2-bosqich: mahsulot, kategoriya va banner matnlariga rus tilidagi
-- variantlarni qo'shish. Barcha ustunlar ixtiyoriy (NULL bo'lishi mumkin) —
-- ru matni kiritilmagan bo'lsa, sayt avtomatik o'zbekcha matnni ko'rsatadi.

alter table products add column if not exists name_ru text;
alter table products add column if not exists description_ru text;

alter table categories add column if not exists name_ru text;

alter table banners add column if not exists tag_ru text;
alter table banners add column if not exists title_ru text;
alter table banners add column if not exists description_ru text;
alter table banners add column if not exists cta_label_ru text;
