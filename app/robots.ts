import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

// Qidiruv tizimlari va AI agentlarga saytni ko'rishga ruxsat beramiz; faqat admin panel va
// ichki (SMS, ro'yxatdan o'tish, CRM va h.k.) API'larni yopamiz. Ommaviy API (/api/v1) va MCP ochiq.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/admin",
          "/api/crm",
          "/api/cron",
          "/api/otp",
          "/api/register",
          "/api/password-reset",
          "/api/order",
          "/api/log-error"
        ]
      }
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL
  };
}
