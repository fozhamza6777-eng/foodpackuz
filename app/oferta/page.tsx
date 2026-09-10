import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { PUBLIC_OFFER_TEXT } from "@/lib/publicOfferText";

export const metadata = {
  title: "Ommaviy oferta — FOOD BOX"
};

export default function OfferPage() {
  return (
    <div className="min-h-screen bg-surface">
      <header className="bg-white border-b border-ink/8">
        <div className="mx-auto max-w-3xl px-5 py-4 flex items-center gap-3">
          <Link href="/" className="p-2 -ml-2 rounded-lg hover:bg-surface transition-colors" title="Bosh sahifa">
            <ArrowLeft className="w-5 h-5 text-ink/60" />
          </Link>
          <span className="font-display font-extrabold text-lg text-ink">
            Food<span className="text-brand-500">Box</span> · Ommaviy oferta
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-5 py-10">
        <div className="bg-white rounded-2xl shadow-card p-6 sm:p-10">
          <pre className="whitespace-pre-wrap font-body text-sm text-ink/75 leading-relaxed">
            {PUBLIC_OFFER_TEXT}
          </pre>
        </div>
      </main>
    </div>
  );
}
