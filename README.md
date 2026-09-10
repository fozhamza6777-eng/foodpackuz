# FOOD BOX — bir martalik oziq-ovqat qadoqlari sayti

Fast-food va dostavka biznesi uchun onlayn qadoqlash do'koni. Next.js 14 (App Router) + TypeScript +
Tailwind CSS + Framer Motion + **Supabase** (autentifikatsiya va ma'lumotlar bazasi) asosida qurilgan.

## Texnologiyalar

- **Next.js 14** — App Router, Vercelga eng mos freymvork
- **TypeScript**
- **Tailwind CSS** — yashil urg'uli zamonaviy B2B rang va shrift tokenlari
- **Framer Motion** — sahifa animatsiyalari (banner-karusel, scroll-reveal, savat animatsiyasi va h.k.)
- **Supabase** — foydalanuvchi ro'yxatdan o'tishi/kirishi (Auth) va buyurtmalarni xavfsiz saqlash (Postgres + RLS)
- **lucide-react** — ikonalar

## Loyiha tuzilishi

```
foodpack-site/
├── app/
│   ├── api/order/route.ts     # ixtiyoriy bildirishnoma route'i (ma'lumot saqlamaydi)
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── components/                 # barcha UI bloklari (Header, Hero, CartDrawer, AuthProvider, ...)
├── lib/
│   ├── products.ts             # mahsulotlar bazasi
│   ├── types.ts
│   └── supabase/
│       ├── client.ts           # Supabase brauzer klienti
│       └── types.ts            # jadval tiplari
├── supabase/
│   └── migrations/0001_init.sql   # Supabase SQL sxemasi va xavfsizlik siyosatlari
├── .env.local.example          # muhit o'zgaruvchilari namunasi
├── tailwind.config.ts
└── package.json
```

## 1-qadam: Supabase loyihasini yaratish

1. [supabase.com](https://supabase.com) saytiga kiring, bepul akkaunt oching (GitHub orqali kirsa bo'ladi).
2. **New Project** tugmasini bosing. Nomini (masalan, `food-box`), parolni (Database Password —
   buni alohida joyga yozib qo'ying) va hududni (Region — `Frankfurt` yoki eng yaqinini) tanlang.
3. Loyiha yaratilishini kuting (~2 daqiqa).

## 2-qadam: Jadvallarni yaratish (SQL migratsiya)

1. Supabase loyihangizda chap menyudan **SQL Editor** bo'limini oching.
2. **New query** tugmasini bosing.
3. Ushbu repozitoriyadagi `supabase/migrations/0001_init.sql` faylining **butun mazmunini** nusxalab,
   shu yerga joylashtiring.
4. **Run** tugmasini bosing. "Success. No rows returned" degan xabar chiqsa — hammasi to'g'ri ishladi.

Bu skript quyidagilarni avtomatik yaratadi:
- `profiles` jadvali — mijozning ismi va telefoni (parolni EMAS, chunki parollar Supabase Auth'ning
  o'zida, qaytarib bo'lmas holatda shifrlanib saqlanadi)
- `orders` jadvali — buyurtmalar
- `bulk_requests` jadvali — "Hamkorlik" bo'limidagi so'rovlar
- **Row Level Security (RLS)** siyosatlari — har bir foydalanuvchi FAQAT o'zining ma'lumotlarini
  ko'ra oladi, boshqa birovnikini emas

### 2.1-qadam: Tashkilot nomi, filiallar va geolokatsiya (ikkinchi migratsiya)

Agar mijozlaringiz bir nechta filial/shoxobchaga ega bo'lsa (kafe, restoran, fast-food tarmog'i),
quyidagi qo'shimcha migratsiyani ham ishga tushiring:

1. **SQL Editor**'da yana **New query** tugmasini bosing.
2. `supabase/migrations/0002_branches_and_geo.sql` faylining **butun mazmunini** nusxalab joylashtiring.
3. **Run** tugmasini bosing.

Bu qo'shimcha skript quyidagilarni qo'shadi:
- `profiles` jadvaliga **tashkilot nomi** (`company_name`) ustuni
- Yangi `branches` jadvali — bitta hisobdan bir nechta filial/manzilni saqlash uchun (RLS bilan
  himoyalangan — har bir mijoz faqat o'z filiallarini ko'radi)
- `orders` jadvaliga **filial havolasi** va **geolokatsiya** (`latitude`, `longitude`) ustunlari —
  buyurtma qaysi filial uchun va qaysi aniq joylashuvdan berilganini saqlash uchun

### 2.2-qadam: Admin panel va mahsulotlar jadvali (uchinchi migratsiya)

Saytni va tushgan buyurtmalarni **admin panel** orqali boshqarish uchun (mahsulot qo'shish/o'chirish,
narxlarni o'zgartirish, buyurtmalar holatini kuzatish) quyidagi migratsiyani ham ishga tushiring:

1. **SQL Editor**'da yana **New query** tugmasini bosing.
2. `supabase/migrations/0003_admin_and_products.sql` faylining **butun mazmunini** nusxalab
   joylashtiring.
3. **Run** tugmasini bosing.

Bu skript quyidagilarni qo'shadi:
- `profiles` jadvaliga **admin belgisi** (`is_admin`) ustuni
- Yangi `products` jadvali — barcha mahsulotlar endi shu yerda saqlanadi (avval kod ichida qattiq
  yozilgan edi), va saytdagi mavjud 12 ta mahsulot avtomatik shu jadvalga ko'chiriladi
- `orders` jadvaliga admin uchun qo'shimcha RLS siyosatlari (admin BARCHA buyurtmalarni ko'ra va
  ularning holatini o'zgartira oladi, oddiy mijozlar esa hamon faqat o'zinikini ko'radi)

**O'zingizni admin qilib tayinlash:**

1. Avval saytda **oddiy foydalanuvchi sifatida ro'yxatdan o'ting** (o'zingiz ishlatadigan telefon
   raqam bilan).
2. Supabase'da **SQL Editor**'da yangi so'rov oching va quyidagini ishga tushiring (telefon raqamni
   o'zingiznikiga almashtiring, xalqaro formatda, masalan `+998901234567`):
   ```sql
   update public.profiles set is_admin = true where phone = '+998901234567';
   ```
3. Saytga qaytib, sahifani yangilang (F5) — endi header'da **"Admin"** havolasi paydo bo'ladi, yoki
   to'g'ridan-to'g'ri `https://<saytingiz>/admin` manziliga kiring.

### 2.3-qadam: Haqiqiy rasmlar va bannerlar (to'rtinchi migratsiya)

Mahsulotlarga va bosh sahifadagi aylanib turuvchi bannerga **haqiqiy fotosuratlar** qo'yish imkonini
berish uchun quyidagi so'nggi migratsiyani ham ishga tushiring:

1. **SQL Editor**'da yana **New query** tugmasini bosing.
2. `supabase/migrations/0004_images_and_banners.sql` faylining **butun mazmunini** nusxalab
   joylashtiring.
3. **Run** tugmasini bosing.

Bu skript quyidagilarni qo'shadi:
- Rasmlar uchun ochiq (public) **Storage bucket** (`product-images`) — hamma ko'radi, faqat admin
  yuklaydi/o'chiradi
- `products` jadvaliga **haqiqiy rasm havolasi** (`image_url`) ustuni — bo'sh bo'lsa, avvalgidek
  chizilgan SVG belgi ko'rsatiladi
- Yangi `banners` jadvali — bosh sahifadagi banner endi to'liq admin panel orqali boshqariladi
  (matn, tugma, va haqiqiy rasm), 3 ta boshlang'ich banner bilan birga

**Agar "insert into storage.buckets" qatori xatolik bersa:** Supabase panelida **Storage → New
bucket** orqali qo'lda `product-images` nomli **public** bucket yarating, so'ng qolgan qismini
(RLS siyosatlari va jadvallarni) alohida ishga tushiring.

### 2.4-qadam: Bo'limlar va buyurtmani bekor qilish (beshinchi migratsiya)

So'nggi migratsiyani ham ishga tushiring:

1. **SQL Editor**'da yana **New query** tugmasini bosing.
2. `supabase/migrations/0005_categories_and_cancel.sql` faylining **butun mazmunini** nusxalab
   joylashtiring.
3. **Run** tugmasini bosing.

Bu skript quyidagilarni qo'shadi:
- Admin tomonidan boshqariladigan `categories` jadvali (7 ta boshlang'ich bo'lim bilan)
- `products` jadvaliga `categories` (ko'plik) ustuni — bitta mahsulot bir nechta bo'limga tegishli
  bo'lishi mumkin
- `orders` jadvaliga `cancel_reason` ustuni va mijoz uchun cheklangan "faqat bekor qilish uchun"
  UPDATE siyosati (1 soat qoidasi ma'lumotlar bazasi darajasida ta'minlangan)

### 2.5-qadam: Bo'limlarga haqiqiy rasm (oltinchi migratsiya)

Bo'limlarga (kategoriyalarga) ham haqiqiy fotosurat qo'yish imkonini berish uchun so'nggi migratsiyani
ishga tushiring:

1. **SQL Editor**'da yana **New query** tugmasini bosing.
2. `supabase/migrations/0006_category_images.sql` faylining **butun mazmunini** nusxalab joylashtiring.
3. **Run** tugmasini bosing.

Bu skript `categories` jadvaliga `image_url` ustunini qo'shadi (mavjud `product-images` bucket'idan
foydalanadi, yangi bucket yaratish shart emas).

### 2.6-qadam: Layk, sharh, bekor qilish yangilanishi va real-vaqt bildirishnomalar (yettinchi migratsiya)

1. **SQL Editor**'da yana **New query** tugmasini bosing.
2. `supabase/migrations/0007_likes_comments_notify.sql` faylining **butun mazmunini** nusxalab
   joylashtiring.
3. **Run** tugmasini bosing.

Bu skript quyidagilarni qo'shadi:
- Mahsulotni "yoqtirish" (`product_likes`) va sharh qoldirish (`product_comments`) jadvallari
- Mahsulotga ijodiy ma'lumot belgisi (`info_badge_type`, `info_badge_text`) ustunlari
- Buyurtmani bekor qilishda **1 soatlik muhlat olib tashlandi** — endi mijoz istalgan vaqt bekor
  qilmoqchi bo'lsa, DARHOL sababni yozishi shart
- `orders` jadvali uchun **Realtime** (real-vaqt) yoqiladi — admin panelda yangi buyurtma va bekor
  qilish so'rovlari darhol ovozli/vizual bildirishnoma sifatida ko'rinishi uchun zarur

**Agar "alter publication supabase_realtime add table" qatori xatolik bersa** (masalan, "relation is
already member of publication"): bu xato emas, bu jadval allaqachon real-vaqt rejimida ekanini
bildiradi — shunchaki keyingi qatorlarni ishga tushiring.

### 2.7-qadam: Savatni saqlash (sakkizinchi migratsiya)

Savatni tashlab ketgan mijozlarga eslatma ko'rsatish uchun savat endi ma'lumotlar bazasida ham
saqlanadi:

1. **SQL Editor**'da yana **New query** tugmasini bosing.
2. `supabase/migrations/0008_persistent_cart.sql` faylining **butun mazmunini** nusxalab
   joylashtiring.
3. **Run** tugmasini bosing.

### 2.8-qadam: Ikki bosqichli qadoq — pachka va karobka (to'qqizinchi migratsiya)

1. **SQL Editor**'da yana **New query** tugmasini bosing.
2. `supabase/migrations/0009_carton_size.sql` faylining **butun mazmunini** nusxalab joylashtiring.
3. **Run** tugmasini bosing.

Bu skript `products` jadvaliga ixtiyoriy `carton_size` (karobka hajmi) ustunini qo'shadi. Admin
panelda mahsulotga karobka hajmini kiritsangiz, katalogda mijoz "Pachka" yoki "Karobka" birligini
tanlab, shunga mos narxni ko'rib, savatga qo'sha oladi.

## 3-qadam: Email tasdiqlashni o'chirish (muhim!)

Sayt telefon raqam + parol orqali ro'yxatdan o'tkazadi (email so'ramaydi), shuning uchun Supabase'ning
standart "email tasdiqlash" talabini o'chirib qo'yish kerak:

1. Supabase loyihangizda **Authentication → Providers → Email** bo'limiga o'ting.
2. **"Confirm email"** sozlamasini **o'chiring (off)**.
3. **Save** tugmasini bosing.

Bu qadam bajarilmasa, ro'yxatdan o'tgan foydalanuvchilar tizimga kira olmay qoladi.

## 4-qadam: API kalitlarini olish

1. Supabase loyihangizda **Project Settings → API** bo'limiga o'ting.
2. **Project URL** va **anon / public** kalitini nusxalang (⚠️ **service_role** kalitini emas —
   u maxfiy va bu loyihada umuman ishlatilmaydi).

## 5-qadam: Loyihaga ulash

1. `.env.local.example` faylini nusxalab, nomini **`.env.local`** deb o'zgartiring.
2. Ichidagi qiymatlarni 4-qadamda olgan haqiqiy ma'lumotlaringiz bilan almashtiring:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   ```
3. Lokal ishga tushirish:
   ```bash
   npm install
   npm run dev
   ```

`.env.local` fayli **hech qachon GitHub'ga yuklanmaydi** (u `.gitignore` ichida allaqachon istisno
qilingan) — bu maxfiy kalitlaringizni xavfsiz saqlaydi.

## Vercel'da muhit o'zgaruvchilarini sozlash

GitHub orqali Vercel'ga joylaganingizda, `.env.local` fayli birga yuklanmaydi (bu — xavfsizlik uchun
to'g'ri xatti-harakat), shuning uchun kalitlarni Vercel panelida qo'lda kiritishingiz kerak:

1. Vercel loyihangizda **Settings → Environment Variables** bo'limiga o'ting.
2. Ikkita o'zgaruvchi qo'shing:
   - `NEXT_PUBLIC_SUPABASE_URL` → Supabase Project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` → Supabase anon key
3. **Save** qiling, so'ng **Deployments** bo'limidan oxirgi joylashtirishni **Redeploy** qiling.

## Ma'lumotlar xavfsizligi qanday ta'minlangan?

- **Parollar hech qachon ochiq holda saqlanmaydi.** Ro'yxatdan o'tishda parolni biz emas, Supabase
  Auth (`auth.users` jadvali) qabul qiladi va uni qaytarib bo'lmaydigan (bcrypt) shifrlash bilan
  saqlaydi — hatto loyiha egasi ham uni ko'ra olmaydi.
- **Row Level Security (RLS) yoqilgan.** `orders` va `profiles` jadvallarida har bir foydalanuvchi
  faqat `auth.uid() = user_id` shartiga mos keladigan, ya'ni FAQAT o'zining qatorlarini ko'ra va
  yoza oladi. Boshqa mijozning buyurtmasini hech kim ko'ra olmaydi.
- **"anon" kalit xavfsiz ochiq kalit.** Brauzerga chiqadigan `NEXT_PUBLIC_SUPABASE_ANON_KEY` maxsus
  shunday ishlatilishi uchun mo'ljallangan — uning o'zi hech narsaga ruxsat bermaydi, faqat RLS
  siyosatlari ruxsat bergan amallarni bajara oladi.
- **"service_role" (super-maxfiy) kalit bu loyihada umuman ishlatilmaydi**, shuning uchun uni hech
  qayerga joylashtirmang va hech kimga bermang.
- **Barcha ma'lumot almashinuvi HTTPS orqali** (Supabase va Vercel buni standart ravishda ta'minlaydi).
- `bulk_requests` jadvalida atayin faqat **INSERT** (yozish) siyosati bor, **SELECT** (o'qish) yo'q —
  ya'ni hamkorlik so'rovlarini faqat siz (Supabase boshqaruv paneli orqali) ko'ra olasiz, saytdan
  hech kim boshqa birovning so'rovini o'qiy olmaydi.

## Ro'yxatdan o'tish qanday ishlaydi

1. Mehmon mahsulotlarni erkin ko'rib, savatga qo'sha oladi (ro'yxatdan o'tish shart emas).
2. Yuqori panelda, savat tugmasi yonida doim **"Kirish"** tugmasi turadi — mijoz istalgan vaqt,
   savatga mahsulot qo'shmasdan ham, ro'yxatdan o'tishi yoki hisobiga kirishi mumkin.
3. "Rasmiylashtirish" tugmasini bosganda:
   - Ro'yxatdan o'tmagan bo'lsa → ism, telefon va parol so'raladi (yoki "Kirish" tugmasi orqali
     avvalgi hisobiga kiradi).
   - Ro'yxatdan o'tgach → sessiya brauzerda xavfsiz saqlanadi (Supabase avtomatik boshqaradi),
     keyingi safar qayta ro'yxatdan o'tish shart emas.
4. Buyurtma tasdiqlanganda ma'lumotlar to'g'ridan-to'g'ri Supabase'dagi `orders` jadvaliga, faqat
   shu foydalanuvchining `user_id`si bilan yoziladi.

## Tashkilot, filiallar va geolokatsiya

Sayt endi kafe/restoran/fast-food tarmoqlari uchun quyidagilarni qo'llab-quvvatlaydi:

- **Tashkilot nomi** — ro'yxatdan o'tishda yoki keyinroq profilda kiritiladi (`profiles.company_name`).
- **Bir nechta filial** — bitta hisobdan bir nechta shoxobcha (filial) qo'shish mumkin (profil
  panelidagi "Filiallar" bo'limi). Buyurtma berishda mijoz qaysi filial uchun buyurtma
  berayotganini tanlaydi, yoki yangi manzil kiritib, xohlasa uni ham filial sifatida saqlaydi.
- **Geolokatsiya** — buyurtma rasmiylashtirilayotganda yoki filial qo'shilayotganda "Joylashuvni
  ulash" tugmasi orqali brauzer geolokatsiyasi (GPS) yuboriladi (`orders.latitude/longitude` va
  `branches.latitude/longitude`) — bu kuryerga aniq manzilni topishga yordam beradi. Bu ixtiyoriy —
  foydalanuvchi ruxsat bermasa ham buyurtma berish mumkin.

## Buyurtmalarni ko'rish (sayt egasi uchun)

Supabase loyihangizda **Table Editor → orders** bo'limiga kirib, barcha tushgan buyurtmalarni
ko'rishingiz mumkin (siz — loyiha egasi — barcha ma'lumotlarni Supabase paneli orqali to'liq
ko'ra olasiz, RLS faqat saytdagi oddiy foydalanuvchilarni cheklaydi). `latitude`/`longitude`
ustunlaridagi koordinatalarni Google Maps'da `https://maps.google.com/?q=LAT,LNG` ko'rinishida
ochib, aniq joylashuvni ko'rishingiz mumkin.

## Lokal ishga tushirish

```bash
npm install
npm run dev
```

So'ng brauzerda **http://localhost:3000** manzilini oching.

## GitHub + Vercel orqali joylash (deploy)

1. Ushbu papkani (barcha fayllari bilan) yangi GitHub repositoriyasiga yuklang:
   ```bash
   git init
   git add .
   git commit -m "FOOD BOX sayti"
   git branch -M main
   git remote add origin https://github.com/<username>/<repo-nomi>.git
   git push -u origin main
   ```
2. [vercel.com](https://vercel.com) ga GitHub hisobingiz orqali kiring.
3. **Add New → Project** tugmasini bosing va yuqoridagi repositoriyani tanlang.
4. **Environment Variables** bo'limida `NEXT_PUBLIC_SUPABASE_URL` va `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   ni kiriting (yuqoridagi "Vercel'da muhit o'zgaruvchilarini sozlash" bo'limiga qarang).
5. **Deploy** tugmasini bosing — bir necha soniyada sayt jonli (`https://<loyiha>.vercel.app`) bo'ladi.
6. Keyingi har bir `git push` avtomatik ravishda yangi versiyani deploy qiladi.

## Admin panel — mahsulotlar va buyurtmalarni boshqarish

`https://<saytingiz>/admin` manzilida (yoki header'dagi "Admin" havolasi orqali) admin panel mavjud.
Faqat `profiles.is_admin = true` bo'lgan hisoblar kira oladi (qarang: 2.2-qadam).

**"Mahsulotlar" bo'limi:**
- Yangi mahsulot qo'shish, mavjudini tahrirlash yoki butunlay o'chirish
- **Haqiqiy fotosurat yuklash** — har bir mahsulotga o'zining rasmi (JPG/PNG/WEBP, 5 MB gacha)
  qo'yish mumkin; rasm yuklanmasa, avvalgidek chizilgan SVG belgi ko'rsatiladi
- Narx, chegirma narxi, "Yangi" belgisi, material, o'lchamlar, tavsifni istalgan vaqt o'zgartirish
- Mahsulotni butunlay o'chirmasdan "yashirish" (faol/nofaol) — masalan, vaqtincha tugab qolganda
- O'zgarishlar **darhol** saytda ko'rinadi, qayta deploy qilish shart emas

**"Bo'limlar" bo'limi:**
- Yangi mahsulot bo'limi (kategoriya) qo'shish, nomini o'zgartirish yoki butunlay o'chirish
- Bo'limni vaqtincha yashirish (mahsulotlarni o'chirmasdan, katalog filtridan olib tashlash)
- Har bir bo'limga **haqiqiy fotosurat** yuklash mumkin — bu rasm bosh sahifadagi tezkor
  kategoriyalar qatorida va katalog mega-menyusida ko'rinadi (rasm yuklanmasa, zaxira belgi
  ishlatiladi)
- **Bir mahsulot bir nechta bo'limga tegishli bo'lishi mumkin** — masalan, "Pitsa qutisi" mahsulotini
  ham "Pitsa qutilari"ga, ham "Gofro qutilar"ga qo'shsangiz, u ikkala bo'limda ham ko'rinadi
  (mahsulot qo'shish/tahrirlash oynasida bir nechta bo'limni belgilash orqali)

**"Bannerlar" bo'limi:**
- Bosh sahifadagi aylanib turuvchi bannerga **haqiqiy mahsulot fotosuratini** qo'yish
- Sarlavha, tavsif, tugma matni/havolasi va tartib raqamini boshqarish
- Rasm yuklanmagan bannerlar uchun rang gradienti va SVG belgi zaxira sifatida ishlatiladi
- Bannerni vaqtincha yashirish yoki butunlay o'chirish mumkin

**"Buyurtmalar" bo'limi:**
- Barcha tushgan buyurtmalar ro'yxati (mijoz ismi, tashkiloti, telefon raqami bilan)
- Holatni o'zgartirish: Yangi → Jarayonda → Yetkazildi (yoki Bekor qilindi)
- Mijoz buyurtma berilganidan 1 soatdan keyin bekor qilishga urinsa, buyurtma **"Bekor so'ralgan"**
  holatiga o'tadi va ro'yxatda "E'tibor talab qiladi" belgisi bilan ajralib turadi — sababini o'qib,
  holatni "Bekor qilindi" (tasdiqlash) yoki "Jarayonda" (rad etish) ga o'zgartirib qaror qabul qilasiz
- Har bir buyurtmani kengaytirib, mahsulotlar ro'yxati va izohni ko'rish
- Agar mijoz geolokatsiya yuborgan bo'lsa, **"Kuryer uchun nusxalash"** tugmasi orqali mijoz ismi,
  telefoni, manzili, xarita havolasi va mahsulotlar ro'yxati bitta tayyor xabar sifatida nusxalanadi
  — shuni to'g'ridan-to'g'ri Telegram yoki WhatsApp orqali kuryerga yuborishingiz mumkin. Alohida
  "Google Maps'da ochish" havolasi ham mavjud.

## Mijoz tomonidan buyurtmani kuzatish va bekor qilish

- Mijoz profilidagi **"Buyurtmalarim"** bo'limida har bir buyurtmaning joriy holati (Yangi,
  Jarayonda, Yetkazildi, Bekor qilindi) rangli belgi bilan ko'rinadi.
- Mijoz "Bekor qilishni so'rash" tugmasini bosganda, **DARHOL** (hech qanday kutish muddatisiz)
  bekor qilish sababini yozishi so'raladi — bu majburiy. Buyurtma "Bekor so'ralgan" holatiga o'tadi
  va admin panelda ko'rib chiqilishini kutadi.
- Bularning barchasi ma'lumotlar bazasi darajasida (RLS + trigger) himoyalangan — mijoz faqat o'z
  buyurtmasini, faqat shu qoidalarga mos holatga o'zgartira oladi (sababsiz "bekor" holatiga
  o'zgartira olmaydi), boshqa hech qanday maydonni (narx, mahsulotlar va h.k.) o'zgartira olmaydi.

## Savatga qo'shish tajribasi

Mahsulotni savatga qo'shganda savat paneli **avtomatik ochilmaydi** — ekranning pastki o'ng
burchagida qisqa animatsiyali bildirishnoma ("✓ [Mahsulot] savatga qo'shildi") chiqadi, shunda mijoz
xarid qilishda davom etishi mumkin. Xaridni yakunlash uchun u istalgan vaqt yuqoridagi **"Savat"**
tugmasini (yoki bildirishnomadagi "Savat" tugmasini) bosib, buyurtmani rasmiylashtirishga o'tadi.

Savat endi ro'yxatdan o'tgan mijozlar uchun Supabase'da ham saqlanadi — mijoz boshqa qurilmadan
kirsa ham, savati o'zi bilan birga keladi.

Header'dagi "Savat" tugmasi endi mahsulot sonini emas, savatdagi **umumiy summani** ko'rsatadi
(masalan "156 000 so'm") — mijoz savatni ochmasdan turib ham qancha xarid qilganini bir qarashda
ko'radi.

## Sevimlilar (layk) va mahsulot sharhlari

- Har bir mahsulot kartochkasida yurakcha (❤️) belgisi bor — bosilganda mahsulot "sevimlilar"ga
  qo'shiladi (ro'yxatdan o'tish talab qilinadi).
- Header'dagi yurakcha tugmasi mijozning shaxsiy sevimlilar ro'yxatini ochadi, u yerdan to'g'ridan-
  to'g'ri savatga qo'shish mumkin.
- Mahsulot nomi yoki rasmiga bosilganda **tafsilotlar oynasi** ochiladi — u yerda to'liq tavsif,
  material, o'lchamlar va **mijozlar sharhlari** bo'limi bor. Har bir ro'yxatdan o'tgan mijoz sharh
  yozishi va o'z sharhini o'chirishi mumkin; admin esa istalgan nomaqbul sharhni o'chira oladi.

## Mahsulotga ijodiy ma'lumot belgisi

Admin panelda mahsulot qo'shish/tahrirlash oynasida 4 turdagi maxsus belgidan birini tanlab, uning
matnini o'zi yozishi mumkin:
- ⚠️ **Tugab qolyapti** (masalan: "Faqat 5 dona qoldi!")
- 🚚 **Yetkazish muddati** (masalan: "3-5 kun ichida yetkaziladi")
- ✈️ **Chet eldan** (masalan: "Xitoydan olib kelinadi, 2 hafta")
- 🛠️ **Ishlab chiqarilmoqda** (masalan: "Buyurtma asosida tayyorlanadi")

Bu belgi mahsulot kartochkasida va tafsilotlar oynasida rangli, ikonkali qilib ko'rsatiladi.

## Admin uchun real-vaqt bildirishnomalar (ovozli + vizual)

Admin panelda yangi buyurtma tushganda yoki mijoz bekor qilishni so'raganda:
- Qisqa **ovozli signal** eshitiladi (brauzerning o'zida generatsiya qilinadi, alohida audio fayl
  kerak emas)
- Ekranning pastki o'ng burchagida **suzuvchi bildirishnoma** chiqadi
- Yuqoridagi qo'ng'iroq (🔔) belgisida o'qilmagan bildirishnomalar soni ko'rsatiladi

**Muhim eslatma:** brauzerlar odatda foydalanuvchi sahifa bilan birinchi marta o'zaro ta'sir
qilmaguncha (masalan, biror joyni bosmaguncha) ovoz chiqarishga ruxsat bermaydi — bu barcha
saytlar uchun umumiy xavfsizlik qoidasi. Shuning uchun admin panelni ochgach, birinchi bildirishnoma
kelishidan oldin sahifada biror joyni (masalan, biror tabni) bir marta bosib qo'yish tavsiya etiladi.

## Savatni tashlab ketganlarga eslatma

Agar ro'yxatdan o'tgan mijoz savatga mahsulot qo'shib, uni rasmiylashtirmasa, saytga **qaytganda**
(faqat soat **9:00–20:00** oralig'ida) do'stona, hazilomuz eslatma banneri chiqadi — bosqichlar:
2 soat, 24 soat, 7 kun, 30 kun. Har bir bosqich kuniga faqat bir marta ko'rsatiladi.

**Muhim:** bu — saytga qaytganda ko'rinadigan banner, haqiqiy SMS yoki push-bildirishnoma emas
(bular alohida, pullik/murakkabroq infratuzilma talab qiladi). Agar kelajakda chinakam push-
bildirishnoma yoki SMS qo'shish kerak bo'lsa, buni alohida so'rab qoling.

## Pachka (ulgurji) hisob-kitobi

Mahsulotlar asosan ulgurji sotilgani uchun katalogda narx **yans.kz uslubida** ko'rsatiladi: katta
va qalin shriftda **pachka narxi** (masalan "34 000 so'm / pachka (100 dona)"), uning tagida kichik
shriftda qavs ichida **dona narxi** ("(340 so'm/dona)"). Savatga qo'shish paytidagi +/- tugmalari
**pachka** birligida hisoblaydi.

Mahsulot allaqachon savatda bo'lsa, kartaning atrofida yashil chegara paydo bo'ladi va rasm ostida
**"Savatda: N pachka"** degan doimiy (yo'qolib ketmaydigan) panel chiqadi — bu belgi mahsulot
buyurtma rasmiylashtirilmaguncha, savatda turgan ekan, doim ko'rinib turadi.

### Ikki bosqichli qadoq: pachka va karobka

Agar admin panelda mahsulotga **karobka hajmi** ham kiritilgan bo'lsa (masalan, pachka — 50 dona,
karobka — 1000 dona), katalog kartochkasida mijoz **"Pachka"** yoki **"Karobka"** birligini tanlashi
mumkin — narx va savatga qo'shiladigan miqdor shunga mos ravishda o'zgaradi. Bu katta hajmda xarid
qiluvchi (masalan, tarmoq restoranlari) uchun qulaylik yaratadi.

### Saralash va sahifalash

Katalog yuqorisida **saralash** tugmasi bor: "Avval mashhurlari" (standart, admin belgilagan tartib),
"Narx: arzondan qimmatga", "Narx: qimmatdan arzonga". Shu yonida **har sahifada nechta mahsulot
ko'rsatish** (12 / 24 / 48) tanlovi bor — katalog kattalashgani sari sahifa tezroq yuklanadi.

## Mahsulotlarni boshlang'ich to'ldirish

Saytdagi 12 ta boshlang'ich mahsulot `supabase/migrations/0003_admin_and_products.sql` orqali
avtomatik qo'shiladi. Eski `lib/products.ts` fayli (mahsulotlar kodga "qattiq yozilgan" davrdan
qolgan) endi butunlay olib tashlangan — barcha yangi mahsulotlarni endi **Admin panel** orqali
qo'shing.

## To'lov tizimini ulash (keyingi qadam)

Hozirda buyurtma "qabul qilindi" holatida saqlanadi, to'lov onlayn olinmaydi (kuryerga naqd/karta
orqali to'lash nazarda tutilgan). Onlayn to'lovni qo'shish uchun Click yoki Payme integratsiyasini
`app/api/order/route.ts` ga yoki alohida API route sifatida qo'shishingiz mumkin.

## Dizayn tokenlari

| Nom | Hex | Vazifasi |
|---|---|---|
| `surface` | `#F5F7FB` | Fon rangi |
| `card` | `#FFFFFF` | Kartochkalar foni |
| `brand-500` | `#16A34A` | Asosiy CTA va urg'u rangi (yashil) |
| `ink` | `#0F1B33` | Matn, sarlavhalar |
| `danger` | `#E6394A` | Xatolik/chegirma belgilari |
| `success` | `#0D9488` | Muvaffaqiyat belgilari |
| `amber` | `#F5A524` | Yulduzcha reyting |

Shriftlar: **Sora** (sarlavhalar), **Manrope** (matn), **Space Mono** (artikul kodlari).
