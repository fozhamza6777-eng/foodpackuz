-- 2-bosqich: hozirda saytda mavjud kategoriya, mahsulot va bannerlar uchun
-- boshlang'ich rus tilidagi tarjimalarni to'ldirish. Mahsulot tavsiflari
-- (description_ru) faqat "Ice Koffee cup" uchun to'ldirilgan — qolganlari
-- uchun admin panelning yangi "Tavsif (ruscha)" maydonidan foydalanib
-- to'ldirish kerak. Nom (name_ru) barcha mahsulot va kategoriyalar uchun
-- kiritilgan.

-- Kategoriyalar
update categories set name_ru = 'Клэмшелл-коробки' where name = 'Klamshell qutilar';
update categories set name_ru = 'Стаканы' where name = 'Stakanlar';
update categories set name_ru = 'Коробки для пиццы' where name = 'Pitsa qutilari';
update categories set name_ru = 'Салатники' where name = 'Salat idishlari';
update categories set name_ru = 'Крафт-пакеты' where name = 'Kraft paketlar';
update categories set name_ru = 'Кухонные принадлежности' where name = 'oshxona anjomlari';
update categories set name_ru = 'Термоконтейнеры' where name = 'Termo konteynerlar';
update categories set name_ru = 'Контейнеры «KFC»' where name = '"KFC" idishlar';

-- Mahsulotlar
update products set name_ru = 'Стакан для Ice Coffee',
  description_ru = 'Этот стакан предназначен в основном для холодных напитков — айс-кофе, коктейлей.'
  where name = 'Ice Koffee cup';
update products set name_ru = 'Крафт клэмшелл-коробка для бургера' where name = 'Kraft klamshell burger qutisi';
update products set name_ru = 'Картонная коробка для сэндвича' where name = 'Sendvich uchun karton quti';
update products set name_ru = 'Одноразовый бумажный стакан (для горячих напитков)' where name = 'Bir martalik qog''oz stakan (issiq)';
update products set name_ru = 'ПЭТ-стакан для горячих напитков' where name = 'Qaynoq ichimliklar uchun PET stakan';
update products set name_ru = 'Коробка для пиццы (гофрокартон)' where name = 'Pitsa qutisi (gofra karton)';
update products set name_ru = 'Дели-контейнер для салата и лагмана' where name = 'Salat va lag''mon uchun deli idish';
update products set name_ru = 'Контейнер с крышкой для плова' where name = 'Osh/plov uchun qopqoqli konteyner';
update products set name_ru = 'Крафт-пакет (с ручками)' where name = 'Kraft paket (qo''lchali)';
update products set name_ru = 'Бумажная упаковка для самсы/фастфуда' where name = 'Somsa/fast-food uchun qog''oz qadoq';
update products set name_ru = 'Набор деревянных приборов' where name = 'Yog''och asboblar to''plami';
update products set name_ru = 'Соусник маленький' where name = 'Sous uchun kichik idishcha';
update products set name_ru = 'Термоконтейнер (для доставки)' where name = 'Termo konteyner (dostavka uchun)';

-- Bannerlar
update banners set
  tag_ru = 'НОВАЯ КОЛЛЕКЦИЯ',
  title_ru = 'Комплексное решение для упаковки вашего фастфуд-бизнеса',
  description_ru = 'От клэмшелл-коробок до термоконтейнеров — в одном месте, по оптовым ценам.',
  cta_label_ru = 'Смотреть каталог'
  where title = 'Fast-food biznesingiz uchun to''liq qadoqlash yechimi';

update banners set
  tag_ru = '100% ЭКОЛОГИЧНО',
  title_ru = 'Экологичная упаковка, безопасная для природы',
  description_ru = 'Изделия из крафт-картона и бамбука — полезны и вашим клиентам, и природе.',
  cta_label_ru = 'Смотреть новинки'
  where title = 'Tabiatga zarar bermaydigan biologik chiriydigan qadoqlar';
