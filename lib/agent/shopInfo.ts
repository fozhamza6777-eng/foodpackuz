import { translations, type Locale } from "@/lib/i18n/translations";
import { MCP_URL, OPENAPI_URL, SHOP, SITE_URL } from "@/lib/site";

export type ShopLang = Locale;

export function parseShopLang(value: unknown): ShopLang {
  return value === "ru" ? "ru" : "uz";
}

const ORDER_NOTE: Record<ShopLang, string> = {
  uz: "Hozircha buyurtmani foodbox.uz saytida (buyurtmani rasmiylashtirishda ism va telefon bilan tezkor ro'yxatdan o'tiladi) yoki telefon orqali bering. AI agent orqali to'g'ridan-to'g'ri buyurtma berish hozircha mavjud emas — narxni hisoblash (calculate_quote) mumkin.",
  ru: "Пока заказ можно оформить на сайте foodbox.uz (при оформлении заказа быстрая регистрация по имени и телефону) или по телефону. Оформление заказа напрямую через AI-агента пока недоступно — доступен расчёт стоимости (calculate_quote)."
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
      via_ai_agent: false,
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
