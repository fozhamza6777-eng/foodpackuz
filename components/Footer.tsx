import { Package, Phone, Mail, MapPin, Instagram, Send, Smartphone } from "lucide-react";

export default function Footer() {
  return (
    <footer id="aloqa" className="bg-white border-t border-ink/8">
      {/* ilova banneri */}
      <div className="mx-auto max-w-7xl px-5 lg:px-8 py-10">
        <div className="bg-ink rounded-2xl px-6 md:px-10 py-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4 text-white">
            <span className="w-12 h-12 rounded-xl bg-brand-gradient flex items-center justify-center shrink-0">
              <Smartphone className="w-6 h-6" />
            </span>
            <div>
              <h3 className="font-display font-extrabold text-lg">FOOD BOX UZ ilovasi doim yoningizda</h3>
              <p className="text-white/60 text-sm font-medium mt-0.5">
                Buyurtmalarni telefoningizdan kuzating va tezroq qayta buyurtma bering.
              </p>
            </div>
          </div>
          <div className="flex gap-3 shrink-0">
            <a href="#" className="bg-white/10 hover:bg-white/20 text-white text-xs font-bold px-4 py-2.5 rounded-lg transition-colors">
              App Store
            </a>
            <a href="#" className="bg-white/10 hover:bg-white/20 text-white text-xs font-bold px-4 py-2.5 rounded-lg transition-colors">
              Google Play
            </a>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-5 lg:px-8 pb-14">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <span className="w-9 h-9 rounded-lg bg-brand-gradient flex items-center justify-center">
                <Package className="w-5 h-5 text-white" />
              </span>
              <span className="font-display font-extrabold text-lg text-ink leading-none">
                FOOD BOX<span className="text-brand-500"> UZ</span>
              </span>
            </div>
            <p className="text-sm text-ink/50 font-medium max-w-xs">
              Restoran, kafe va dostavka biznesi uchun bir martalik qadoqlash yechimlari. 2019 yildan beri
              O'zbekiston bozorida.
            </p>
          </div>

          <div>
            <h4 className="font-bold text-ink text-sm mb-4">Katalog</h4>
            <ul className="space-y-2.5 text-sm text-ink/55 font-medium">
              <li><a href="#katalog" className="hover:text-brand-500 transition-colors">Klamshell qutilar</a></li>
              <li><a href="#katalog" className="hover:text-brand-500 transition-colors">Stakanlar</a></li>
              <li><a href="#katalog" className="hover:text-brand-500 transition-colors">Pitsa qutilari</a></li>
              <li><a href="#katalog" className="hover:text-brand-500 transition-colors">Termo konteynerlar</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-ink text-sm mb-4">Kompaniya</h4>
            <ul className="space-y-2.5 text-sm text-ink/55 font-medium">
              <li><a href="#nega-biz" className="hover:text-brand-500 transition-colors">Nega FOOD BOX UZ</a></li>
              <li><a href="#mijozlar" className="hover:text-brand-500 transition-colors">Mijozlar fikri</a></li>
              <li><a href="#hamkorlik" className="hover:text-brand-500 transition-colors">Hamkorlik shartlari</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-ink text-sm mb-4">Aloqa</h4>
            <ul className="space-y-3 text-sm text-ink/55 font-medium">
              <li className="flex items-center gap-2.5"><Phone className="w-4 h-4 text-brand-500" /> +998 71 200 03 04</li>
              <li className="flex items-center gap-2.5"><Mail className="w-4 h-4 text-brand-500" /> sales@foodboxuz.uz</li>
              <li className="flex items-center gap-2.5"><MapPin className="w-4 h-4 text-brand-500" /> Toshkent, Sergeli tumani</li>
            </ul>
            <div className="flex gap-3 mt-4">
              <a href="#" aria-label="Telegram" className="p-2 border border-ink/10 rounded-full hover:bg-brand-500 hover:text-white hover:border-brand-500 transition-colors">
                <Send className="w-4 h-4" />
              </a>
              <a href="#" aria-label="Instagram" className="p-2 border border-ink/10 rounded-full hover:bg-brand-500 hover:text-white hover:border-brand-500 transition-colors">
                <Instagram className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>

        <div className="border-t border-ink/8 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-ink/40 font-medium">
          <span>© {new Date().getFullYear()} FOOD BOX UZ MCHJ. Barcha huquqlar himoyalangan.</span>
          <span className="font-mono">HoReCa uchun qadoqlash yechimlari</span>
        </div>
      </div>
    </footer>
  );
}
