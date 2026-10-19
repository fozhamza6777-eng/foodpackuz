// Saytning umumiy ma'lumotlari: manzillar, aloqa va yetkazib berish shartlari.
// AI agentlar uchun API/MCP, llms.txt va JSON-LD shu yerdan oladi.
//
// MUHIM: bu qiymatlar sayt matnlaridan (Footer, Filiallar, "Ko'p beriladigan
// savollar") ko'chirilgan. Ularni o'zgartirsangiz, saytdagi matnlarni ham
// yangilang — aks holda AI agentlar eski ma'lumotni aytib turadi.

export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://foodbox.uz").replace(/\/+$/, "");
export const API_BASE_URL = `${SITE_URL}/api/v1`;
export const MCP_URL = `${SITE_URL}/api/mcp`;
export const OPENAPI_URL = `${API_BASE_URL}/openapi.json`;

export const SHOP = {
  name: "FOOD BOX",
  legalName: "FOOD BOX MCHJ",
  email: "sales@foodbox.uz",
  telegram: "https://t.me/fastfood_box",
  instagram: "https://www.instagram.com/foodbox_uz",
  currency: "UZS",
  workingHours: "09:00-18:00",
  workingDays: "har kuni",
  languages: ["uz", "ru"] as const,
  branches: [
    {
      city: "Toshkent",
      address: "Uchtepa tumani, O'rikzor mahallasi, Bositxon ko'chasi 85-uy",
      phone: "+998 95 872 83 83"
    },
    { city: "Qo'qon", address: "Rais mahallasi, 2-uy", phone: "+998 91 382 83 83" }
  ],
  delivery: {
    cities: ["Toshkent", "Qo'qon"],
    // "Ko'p beriladigan savollar" (1-savol): yetkazib berish uchun buyurtma kamida 300 000 so'm.
    minOrderForDeliveryUzs: 300000,
    // Olib ketish uchun minimal summa yo'q (shu savolning javobi).
    minOrderForPickupUzs: 0
  }
};

/** Mahsulot ma'lumot belgisi (admin paneldagi "Ijodiy ma'lumot belgisi") uchun standart matnlar. */
export const INFO_BADGE_TEXT: Record<string, string> = {
  low_stock: "Tugab qolyapti",
  ships_in: "Bir necha kunda yetkaziladi",
  imported: "Chet eldan olib kelinadi",
  manufacturing: "Ishlab chiqarilmoqda"
};
