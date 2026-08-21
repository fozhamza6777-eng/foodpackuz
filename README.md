# FOOD BOX UZ — bir martalik oziq-ovqat qadoqlari sayti

Fast-food va dostavka biznesi uchun onlayn qadoqlash do'koni. Next.js 14 (App Router) + TypeScript +
Tailwind CSS + Framer Motion asosida qurilgan, kuchli motion-dizayn va "quti yig'ilish" animatsiyasi bilan.

## Texnologiyalar

- **Next.js 14** — App Router, Vercelga eng mos freymvork
- **TypeScript**
- **Tailwind CSS** — kraft/karton mavzusidagi maxsus rang va shrift tokenlari
- **Framer Motion** — sahifa animatsiyalari (hero 3D quti yig'ilishi, scroll-reveal, savat animatsiyasi va h.k.)
- **lucide-react** — ikonalar

## Loyiha tuzilishi

```
foodpack-site/
├── app/
│   ├── api/order/route.ts   # buyurtma/so'rovlarni qabul qiluvchi API (demo)
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── components/               # barcha UI bloklari (Header, Hero, ProductGrid, CartDrawer, ...)
├── lib/
│   ├── products.ts            # mahsulotlar bazasi (bu yerga o'z mahsulotlaringizni qo'shing)
│   └── types.ts
├── tailwind.config.ts
└── package.json
```

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
   git commit -m "FOOD BOX UZ sayti"
   git branch -M main
   git remote add origin https://github.com/<username>/<repo-nomi>.git
   git push -u origin main
   ```
2. [vercel.com](https://vercel.com) ga GitHub hisobingiz orqali kiring.
3. **Add New → Project** tugmasini bosing va yuqoridagi repositoriyani tanlang.
4. Vercel Next.js loyihasini avtomatik aniqlaydi — Build Command va Output Directory ni
   o'zgartirish shart emas (standart: `next build`).
5. **Deploy** tugmasini bosing — bir necha soniyada sayt jonli (`https://<loyiha>.vercel.app`) bo'ladi.
6. Keyingi har bir `git push` avtomatik ravishda yangi versiyani deploy qiladi.

## Mahsulotlarni tahrirlash

Barcha mahsulotlar (nomi, narxi, o'lchamlari, materiali, rasmi) `lib/products.ts` faylida joylashgan.
Yangi mahsulot qo'shish uchun shu faylga yangi obyekt qo'shing va `image` maydonida
`components/ProductArt.tsx` dagi mavjud illyustratsiya kalitlaridan birini tanlang
(`clamshell`, `cup`, `pizza`, `deli`, `bag`, `cutlery`, `sauce`, `thermo`).

## Haqiqiy to'lov va buyurtmalarni ulash

Hozirda `app/api/order/route.ts` faqat demo rejimida ishlaydi (buyurtmani konsolga chiqaradi).
Ishlab chiqarish (production) uchun bu yerga quyidagilarni ulashingiz mumkin:

- **Telegram bot** orqali menejerga bildirishnoma yuborish
- **Click / Payme** to'lov tizimi integratsiyasi
- Buyurtmalarni saqlash uchun ma'lumotlar bazasi (masalan, Postgres + Prisma, yoki Google Sheets API)

## Dizayn tokenlari

| Nom | Hex | Vazifasi |
|---|---|---|
| `surface` | `#F5F7FB` | Fon rangi |
| `card` | `#FFFFFF` | Kartochkalar foni |
| `brand-500` | `#2954E0` | Asosiy CTA va urg'u rangi (ko'k) |
| `ink` | `#0F1B33` | Matn, sarlavhalar |
| `danger` | `#E6394A` | Chegirma belgilari |
| `success` | `#12A579` | Ishonch/muvaffaqiyat belgilari |
| `amber` | `#F5A524` | Yulduzcha reyting |

Shriftlar: **Sora** (sarlavhalar), **Manrope** (matn), **Space Mono** (artikul kodlari).

## Dizayn ilhomi

Saytning tuzilishi (yuqori axborot paneli, katalog mega-menyu, banner-karusel, "Yangiliklar"/"Chegirmalar"
bloklari, ishonch belgilari, hamkorlar tasmasi, FAQ, filiallar bo'limi) yirik HoReCa-distributor
saytlari andozasi asosida qurilgan, ammo barcha matn, mahsulotlar va vizual uslub FOOD BOX UZ brendi uchun
originaldir va kuchli motion-animatsiyalar bilan boyitilgan.
