import { SHOP, SITE_URL } from "@/lib/site";

// Qidiruv tizimlari va AI agentlar saytni "kim ekanligini" (tashkilot, filiallar, aloqa) aniq tushunishi
// uchun schema.org (JSON-LD) ma'lumoti. Qiymatlar lib/site.ts'dan olinadi.
export default function StructuredData() {
  const organizationId = `${SITE_URL}/#organization`;

  const data = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": organizationId,
        name: SHOP.name,
        legalName: SHOP.legalName,
        url: SITE_URL,
        logo: `${SITE_URL}/logo.svg`,
        email: SHOP.email,
        sameAs: [SHOP.telegram, SHOP.instagram],
        areaServed: SHOP.delivery.cities,
        description:
          "Restoran, kafe va dostavka biznesi uchun bir martalik idishlar va qadoqlash materiallari (HoReCa) — ulgurji va chakana savdo.",
        contactPoint: SHOP.branches.map((b) => ({
          "@type": "ContactPoint",
          contactType: "sales",
          telephone: b.phone,
          areaServed: "UZ",
          availableLanguage: [...SHOP.languages]
        }))
      },
      ...SHOP.branches.map((b) => ({
        "@type": "Store",
        name: `${SHOP.name} — ${b.city}`,
        url: SITE_URL,
        telephone: b.phone,
        parentOrganization: { "@id": organizationId },
        address: {
          "@type": "PostalAddress",
          streetAddress: b.address,
          addressLocality: b.city,
          addressCountry: "UZ"
        },
        openingHours: "Mo-Su 09:00-18:00",
        currenciesAccepted: SHOP.currency
      })),
      {
        "@type": "WebSite",
        "@id": `${SITE_URL}/#website`,
        url: SITE_URL,
        name: SHOP.name,
        inLanguage: [...SHOP.languages],
        publisher: { "@id": organizationId }
      }
    ]
  };

  return (
    <script
      type="application/ld+json"
      // "<" belgisini ekranlaymiz — JSON ichidagi matn </script> bilan skriptni yopib qo'ymasligi uchun.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
    />
  );
}
