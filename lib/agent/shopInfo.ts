import { translations, type Locale } from "@/lib/i18n/translations";
import { MCP_URL, OPENAPI_URL, SHOP, SITE_URL } from "@/lib/site";
import { AGENT_LIMITS } from "./orders";

export type ShopLang = Locale;

export function parseShopLang(value: unknown): ShopLang {
  return value === "ru" ? "ru" : "uz";
}

const ORDER_NOTE: Record<ShopLang, string> = {
  uz: "Buyurtmani foodbox.uz saytida yoki telefon orqali berish mumkin. AI agent orqali: mijoz saytda ro'yxatdan o'tib, profilidan shaxsiy AI kalit oladi; agent buyurtma so'rovi yaratadi, buyurtma esa faqat mijoz saytda «Tasdiqlash» tugmasini bosgandan keyin qabul qilinadi. To'lov — kuryerga naqd.",
  ru: "Заказ можно оформить на сайте foodbox.uz или по телефону. Через AI-агента: клиент регистрируется на сайте и получает в профиле личный AI-ключ; агент создаёт запрос на заказ, а заказ принимается только после того, как клиент нажмёт «Подтвердить» на сайте. Оплата — наличными курьеру."
};

/** Do'kon haqida AI agentga kerak bo'ladigan ma'lumotlar. Matnlar saytning o'z tarjimalaridan
 *  (Footer, ishonch belgilari, hamkorlik bo'limi, "Ko'p beriladigan savollar") olinadi. */
export function getShopInfo(lang: ShopLang) {
  const t = (key: string) => translations[lang][key] ?? translations.uz[key] ?? "";

  const faq = [1, 2, 3, 4, 5]
    .map((n) => ({ question: t(`faq.q${n}`), answer: t(`faq.a${n}`) }))
    .filter((f) => f.question && f.answer);

  return {
    name: SHOP.name,
    legal_name: SHOP.legalName,
    description: t("footer.about"),
    tagline: t("footer.tagline"),
    website: SITE_URL,
    languages: [...SHOP.languages],
    currency: SHOP.currency,
    response_language: lang,
    working_hours: `${SHOP.workingDays} ${SHOP.workingHours}`,
    contacts: {
      email: SHOP.email,
      telegram: SHOP.telegram,
      instagram: SHOP.instagram
    },
    branches: SHOP.branches.map((b) => ({
      city: b.city,
      address: b.address,
      phone: b.phone,
      working_hours: `${SHOP.workingDays} ${SHOP.workingHours}`
    })),
    delivery: {
      cities: SHOP.delivery.cities,
      minimum_order_for_delivery: SHOP.delivery.minOrderForDeliveryUzs,
      minimum_order_for_pickup: SHOP.delivery.minOrderForPickupUzs,
      currency: SHOP.currency,
      free_delivery: t("trust.free_delivery_text")
    },
    payment: t("trust.payment_text"),
    vat: t("trust.vat_text"),
    packaging_note: t("faq.a2"),
    wholesale: {
      description: t("bulk.description"),
      perks: [t("bulk.perk_discount"), t("bulk.perk_branding"), t("bulk.perk_delivery")],
      how_to_request: `${SITE_URL}/#hamkorlik`
    },
    faq,
    ordering: {
      via_ai_agent: true,
      requires_customer_api_key: true,
      owner_confirmation_required: true,
      payment_via_ai_agent: "cash_on_delivery",
      max_order_total_via_ai_agent: AGENT_LIMITS.maxOrderTotal,
      website: SITE_URL,
      phones: SHOP.branches.map((b) => ({ city: b.city, phone: b.phone })),
      note: ORDER_NOTE[lang]
    },
    machine_interfaces: {
      mcp_server: MCP_URL,
      rest_api: `${SITE_URL}/api/v1`,
      openapi: OPENAPI_URL
    }
  };
}
