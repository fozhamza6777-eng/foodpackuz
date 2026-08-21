import type { Metadata } from "next";
import { Sora, Manrope, Space_Mono } from "next/font/google";
import "./globals.css";
import { CartProvider } from "@/components/CartProvider";

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
  title: "FOOD BOX UZ — HoReCa uchun qadoqlash va bir martalik idishlar ulgurji",
  description:
    "Restoran, kafe va dostavka biznesi uchun bir martalik idishlar, qadoqlash materiallari. Bepul yetkazib berish, QQS bilan ishlaymiz, onlayn buyurtma.",
  metadataBase: new URL("https://foodboxuz.example.uz"),
  openGraph: {
    title: "FOOD BOX UZ — HoReCa uchun qadoqlash ulgurji",
    description: "Bir martalik idishlar va qadoqlash materiallari — onlayn buyurtma, tez yetkazib berish.",
    type: "website"
  }
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="uz">
      <body
        className={`${display.variable} ${body.variable} ${mono.variable} font-body bg-surface text-ink antialiased`}
      >
        <CartProvider>{children}</CartProvider>
      </body>
    </html>
  );
}
