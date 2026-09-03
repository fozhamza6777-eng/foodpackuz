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
2. "Rasmiylashtirish" tugmasini bosganda:
   - Ro'yxatdan o'tmagan bo'lsa → ism, telefon va parol so'raladi (yoki "Kirish" tugmasi orqali
     avvalgi hisobiga kiradi).
   - Ro'yxatdan o'tgach → sessiya brauzerda xavfsiz saqlanadi (Supabase avtomatik boshqaradi),
     keyingi safar qayta ro'yxatdan o'tish shart emas.
3. Buyurtma tasdiqlanganda ma'lumotlar to'g'ridan-to'g'ri Supabase'dagi `orders` jadvaliga, faqat
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
- Narx, chegirma narxi, "Yangi" belgisi, material, o'lchamlar, tavsifni istalgan vaqt o'zgartirish
- Mahsulotni butunlay o'chirmasdan "yashirish" (faol/nofaol) — masalan, vaqtincha tugab qolganda
- O'zgarishlar **darhol** saytda ko'rinadi, qayta deploy qilish shart emas

**"Buyurtmalar" bo'limi:**
- Barcha tushgan buyurtmalar ro'yxati (mijoz ismi, tashkiloti, telefon raqami bilan)
- Holatni o'zgartirish: Yangi → Jarayonda → Yetkazildi (yoki Bekor qilindi)
- Har bir buyurtmani kengaytirib, mahsulotlar ro'yxati va izohni ko'rish
- Agar mijoz geolokatsiya yuborgan bo'lsa, **"Kuryer uchun nusxalash"** tugmasi orqali mijoz ismi,
  telefoni, manzili, xarita havolasi va mahsulotlar ro'yxati bitta tayyor xabar sifatida nusxalanadi
  — shuni to'g'ridan-to'g'ri Telegram yoki WhatsApp orqali kuryerga yuborishingiz mumkin. Alohida
  "Google Maps'da ochish" havolasi ham mavjud.

## Mahsulotlarni boshlang'ich to'ldirish

Saytdagi 12 ta boshlang'ich mahsulot `supabase/migrations/0003_admin_and_products.sql` orqali
avtomatik qo'shiladi. `lib/products.ts` fayli endi saytda ishlatilmaydi (faqat tarixiy ma'lumot
sifatida qoladi) — barcha yangi mahsulotlarni endi **Admin panel** orqali qo'shing.

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
