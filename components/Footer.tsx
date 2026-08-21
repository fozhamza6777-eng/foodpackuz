import { Package, Phone, Mail, MapPin, Instagram, Send } from "lucide-react";

export default function Footer() {
  return (
    <footer id="aloqa" className="bg-paper border-t-2 border-ink pt-16 pb-8">
      <div className="mx-auto max-w-7xl px-5 md:px-8">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-10 mb-14">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <span className="w-9 h-9 bg-ink rounded-md flex items-center justify-center rotate-[-4deg]">
                <Package className="w-5 h-5 text-paper" />
              </span>
              <span className="font-display text-2xl tracking-wide">
                FOOD<span className="text-signal">PACK</span>
              </span>
            </div>
            <p className="text-sm text-ink/60 font-medium max-w-xs">
              Fast-food va dostavka biznesi uchun bir martalik qadoqlash yechimlari. 2019 yildan beri O'zbekiston
              bozorida.
            </p>
          </div>

          <div>
            <h4 className="font-display uppercase tracking-wide mb-4 text-sm">Katalog</h4>
            <ul className="space-y-2.5 text-sm text-ink/65 font-medium">
              <li><a href="#katalog" className="hover:text-signal">Klamshell qutilar</a></li>
              <li><a href="#katalog" className="hover:text-signal">Stakanlar</a></li>
              <li><a href="#katalog" className="hover:text-signal">Pitsa qutilari</a></li>
              <li><a href="#katalog" className="hover:text-signal">Termo konteynerlar</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-display uppercase tracking-wide mb-4 text-sm">Kompaniya</h4>
            <ul className="space-y-2.5 text-sm text-ink/65 font-medium">
              <li><a href="#nega-biz" className="hover:text-signal">Nega FoodPack</a></li>
              <li><a href="#mijozlar" className="hover:text-signal">Mijozlar fikri</a></li>
              <li><a href="#ulgurji" className="hover:text-signal">Ulgurji shartlar</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-display uppercase tracking-wide mb-4 text-sm">Aloqa</h4>
            <ul className="space-y-3 text-sm text-ink/65 font-medium">
              <li className="flex items-center gap-2.5"><Phone className="w-4 h-4 text-signal" /> +998 71 200 30 40</li>
              <li className="flex items-center gap-2.5"><Mail className="w-4 h-4 text-signal" /> sales@foodpack.uz</li>
              <li className="flex items-center gap-2.5"><MapPin className="w-4 h-4 text-signal" /> Toshkent, Sergeli tumani</li>
            </ul>
            <div className="flex gap-3 mt-4">
              <a href="#" aria-label="Telegram" className="p-2 border-2 border-ink rounded-full hover:bg-ink hover:text-paper transition-colors">
                <Send className="w-4 h-4" />
              </a>
              <a href="#" aria-label="Instagram" className="p-2 border-2 border-ink rounded-full hover:bg-ink hover:text-paper transition-colors">
                <Instagram className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>

        <div className="border-t-2 border-ink/10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-ink/50 font-mono">
          <span>© {new Date().getFullYear()} FoodPack MCHJ. Barcha huquqlar himoyalangan.</span>
          <span>Ishlab chiqildi Toshkentda ·  Kraft. Karton. G'amxo'rlik.</span>
        </div>
      </div>
    </footer>
  );
}
