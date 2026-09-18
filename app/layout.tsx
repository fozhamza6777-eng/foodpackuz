import type { Metadata, Viewport } from "next";
import { Sora, Manrope, Space_Mono } from "next/font/google";
import "./globals.css";
import { CartProvider } from "@/components/CartProvider";
import { AuthProvider } from "@/components/AuthProvider";
import { LikesProvider } from "@/components/LikesProvider";
import { LanguageProvider } from "@/components/LanguageProvider";
import { CategoryLabelsProvider } from "@/components/CategoryLabelsProvider";
import ServiceWorkerRegister from "@/components/ServiceWorkerRegister";

const display = Sora({
  subsets: ["latin"],
  weight: ["600", "700", "800"],
  variable: "--font-display"
});

const body = Manrope({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-body"
});

const mono = Space_Mono({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-mono"
});

export const metadata: Metadata = {
  title: "FOOD BOX — HoReCa uchun qadoqlash va bir martalik idishlar ulgurji",
  description:
    "Restoran, kafe va dostavka biznesi uchun bir martalik idishlar, qadoqlash materiallari. Bepul yetkazib berish, QQS bilan ishlaymiz, onlayn buyurtma.",
  metadataBase: new URL("https://foodbox.example.uz"),
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/icons/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" }
    ],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" }]
  },
  appleWebApp: {
    capable: true,
    title: "FOOD BOX",
    statusBarStyle: "default"
  },
  openGraph: {
    title: "FOOD BOX — HoReCa uchun qadoqlash ulgurji",
    description: "Bir martalik idishlar va qadoqlash materiallari — onlayn buyurtma, tez yetkazib berish.",
    type: "website"
  }
};

export const viewport: Viewport = {
  themeColor: "#009846"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="uz">
      <body
        className={`${display.variable} ${body.variable} ${mono.variable} font-body bg-surface text-ink antialiased`}
      >
        <ServiceWorkerRegister />
        <LanguageProvider>
          <CategoryLabelsProvider>
            <AuthProvider>
              <LikesProvider>
                <CartProvider>{children}</CartProvider>
              </LikesProvider>
            </AuthProvider>
          </CategoryLabelsProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
