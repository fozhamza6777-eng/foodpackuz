import Link from "next/link";
import { ArrowLeft, Bot, Code2, MessageSquareText, Search, Wrench } from "lucide-react";
import CopyBox from "@/components/CopyBox";
import { API_BASE_URL, MCP_URL, OPENAPI_URL, SITE_URL } from "@/lib/site";

export const metadata = {
  title: "AI agentlar uchun — FOOD BOX",
  description:
    "FOOD BOX katalogini o'zingizning AI yordamchingiz (MCP) yoki API orqali ko'ring: mahsulotlarni qidirish, narx hisoblash, filial va yetkazib berish shartlari.",
  alternates: { canonical: "/ai" }
};

const tools: { name: string; text: string }[] = [
  { name: "search_products", text: "Katalogdan mahsulot qidirish: nom, kod yoki o'lcham bo'yicha (masalan, «pitsa qutisi», «30x30»)." },
  { name: "get_product", text: "Bitta mahsulotning to'liq ma'lumoti: narx (dona/pachka/karobka), qadoq hajmi, o'lchamlar, material, rasmlar." },
  { name: "list_categories", text: "Barcha bo'limlar ro'yxati." },
  { name: "get_shop_info", text: "Filiallar, aloqa, ish vaqti, yetkazib berish shartlari, to'lov usullari va ko'p beriladigan savollar." },
  { name: "calculate_quote", text: "Savat narxini hisoblash va yetkazib berish uchun minimal summaga yetishini tekshirish (buyurtma bermaydi)." }
];

const examples = [
  "FOOD BOX da 30x30 pitsa qutisi narxi qancha va bir pachkada nechta dona bor?",
  "FOOD BOX'dan 500 dona burger qutisi va 200 dona stakan uchun narxni hisoblab ber. Toshkentga yetkazib berish minimal summasiga yetadimi?",
  "FOOD BOX qaysi shaharlarga yetkazib beradi va to'lov qanday amalga oshiriladi?"
];

const mcpJson = `{
  "mcpServers": {
    "foodbox": {
      "url": "${MCP_URL}"
    }
  }
}`;

export default function AiAgentsPage() {
  return (
    <div className="min-h-screen bg-surface">
      <header className="bg-white border-b border-ink/8">
        <div className="mx-auto max-w-3xl px-5 py-4 flex items-center gap-3">
          <Link href="/" className="p-2 -ml-2 rounded-lg hover:bg-surface transition-colors" title="Bosh sahifa">
            <ArrowLeft className="w-5 h-5 text-ink/60" />
          </Link>
          <span className="font-display font-extrabold text-lg text-ink">
            Food<span className="text-brand-500">Box</span> · AI agentlar uchun
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-5 py-10 flex flex-col gap-6">
        <section className="bg-white rounded-2xl shadow-card p-6 sm:p-8">
          <div className="flex items-center gap-3 mb-3">
            <span className="w-10 h-10 rounded-lg bg-brand-50 flex items-center justify-center">
              <Bot className="w-5 h-5 text-brand-500" />
            </span>
            <h1 className="font-display font-extrabold text-2xl text-ink">FOOD BOX — AI yordamchingiz uchun</h1>
          </div>
          <p className="text-sm text-ink/65 leading-relaxed">
            Katalogimizni o&apos;zingiz ishlatadigan AI yordamchi (Claude, ChatGPT, Cursor va boshqalar) orqali ko&apos;rishingiz
            mumkin: mahsulotlarni qidirish, narxlarni solishtirish, savatingiz narxini hisoblash va filial hamda yetkazib berish
            shartlarini so&apos;rash. Buning uchun kalit yoki parol kerak emas — ma&apos;lumotlar ochiq.
          </p>
          <div className="mt-4 rounded-xl bg-brand-50 border border-brand-100 p-4 text-sm text-brand-700 font-medium leading-relaxed">
            Buyurtmani hozircha{" "}
            <a href={SITE_URL} className="underline font-bold">
              foodbox.uz
            </a>{" "}
            saytida yoki telefon orqali bering. AI orqali to&apos;g&apos;ridan-to&apos;g&apos;ri buyurtma berish hozircha mavjud emas
            — AI faqat qidirish va narx hisoblash uchun.
          </div>
        </section>

        <section className="bg-white rounded-2xl shadow-card p-6 sm:p-8 flex flex-col gap-4">
          <h2 className="font-display font-extrabold text-lg text-ink flex items-center gap-2">
            <Wrench className="w-5 h-5 text-brand-500" /> 1. AI ilovangizga ulash (MCP)
          </h2>
          <p className="text-sm text-ink/65 leading-relaxed">
            MCP — AI ilovalarni tashqi xizmatlarga ulaydigan ochiq standart. AI ilovangizning MCP / konnektorlar sozlamalarida{" "}
            <b>uzoq (remote) MCP server</b> qo&apos;shing va quyidagi manzilni kiriting:
          </p>
          <CopyBox label="MCP server manzili" value={MCP_URL} />
          <p className="text-sm text-ink/65 leading-relaxed">Sozlamalar faylida (JSON) ishlatiladigan ilovalar uchun:</p>
          <CopyBox value={mcpJson} />
          <p className="text-sm text-ink/65 leading-relaxed">Claude Code uchun buyruq:</p>
          <CopyBox value={`claude mcp add --transport http foodbox ${MCP_URL}`} />
        </section>

        <section className="bg-white rounded-2xl shadow-card p-6 sm:p-8 flex flex-col gap-3">
          <h2 className="font-display font-extrabold text-lg text-ink flex items-center gap-2">
            <Search className="w-5 h-5 text-brand-500" /> AI nimalarni qila oladi
          </h2>
          <ul className="flex flex-col gap-2.5">
            {tools.map((t) => (
              <li key={t.name} className="text-sm text-ink/70 leading-relaxed">
                <code className="font-mono text-[13px] font-bold text-brand-600 bg-brand-50 px-1.5 py-0.5 rounded">
                  {t.name}
                </code>{" "}
                — {t.text}
              </li>
            ))}
          </ul>
        </section>

        <section className="bg-white rounded-2xl shadow-card p-6 sm:p-8 flex flex-col gap-3">
          <h2 className="font-display font-extrabold text-lg text-ink flex items-center gap-2">
            <MessageSquareText className="w-5 h-5 text-brand-500" /> Ulagandan keyin so&apos;rab ko&apos;ring
          </h2>
          <ul className="flex flex-col gap-2">
            {examples.map((e) => (
              <li key={e} className="text-sm text-ink/70 bg-surface rounded-lg px-4 py-3 leading-relaxed">
                «{e}»
              </li>
            ))}
          </ul>
        </section>

        <section className="bg-white rounded-2xl shadow-card p-6 sm:p-8 flex flex-col gap-4">
          <h2 className="font-display font-extrabold text-lg text-ink flex items-center gap-2">
            <Code2 className="w-5 h-5 text-brand-500" /> 2. Dasturchilar uchun (REST API)
          </h2>
          <p className="text-sm text-ink/65 leading-relaxed">
            Xuddi shu ma&apos;lumotlar oddiy JSON API orqali ham ochiq. Autentifikatsiya kerak emas.
          </p>
          <CopyBox label="Namuna so'rov" value={`curl "${API_BASE_URL}/products?q=pitsa&limit=5"`} />
          <ul className="text-sm text-ink/70 leading-relaxed flex flex-col gap-1.5 font-mono text-[13px]">
            <li>GET {API_BASE_URL.replace(SITE_URL, "")}/products</li>
            <li>GET {API_BASE_URL.replace(SITE_URL, "")}/products/&#123;id&#125;</li>
            <li>GET {API_BASE_URL.replace(SITE_URL, "")}/categories</li>
            <li>GET {API_BASE_URL.replace(SITE_URL, "")}/shop</li>
            <li>POST {API_BASE_URL.replace(SITE_URL, "")}/quote</li>
          </ul>
          <p className="text-sm text-ink/65 leading-relaxed">
            To&apos;liq tavsif:{" "}
            <a href={OPENAPI_URL} className="text-brand-600 font-bold underline">
              OpenAPI
            </a>
            , AI uchun qisqa tavsif:{" "}
            <a href={`${SITE_URL}/llms.txt`} className="text-brand-600 font-bold underline">
              llms.txt
            </a>
            .
          </p>
        </section>
      </main>
    </div>
  );
}
