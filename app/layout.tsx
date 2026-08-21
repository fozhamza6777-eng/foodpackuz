import type { Metadata } from "next";
import { Anton, Manrope, Space_Mono } from "next/font/google";
import "./globals.css";
import { CartProvider } from "@/components/CartProvider";

const display = Anton({
  subsets: ["latin"],
  weight: "400",
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
  title: "FoodPack — bir martalik oziq-ovqat qadoqlari",
  description:
    "Fast-food va dostavka biznesi uchun kraft qutilar, stakanlar, konteynerlar va paketlar. Ulgurji narxlarda onlayn buyurtma.",
  metadataBase: new URL("https://foodpack.example.uz"),
  openGraph: {
    title: "FoodPack — bir martalik oziq-ovqat qadoqlari",
    description: "Fast-food biznesi uchun qadoqlash yechimlari. Onlayn buyurtma, tez yetkazib berish.",
    type: "website"
  }
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="uz">
      <body
        className={`${display.variable} ${body.variable} ${mono.variable} font-body fiber-texture text-ink antialiased`}
      >
        <CartProvider>{children}</CartProvider>
      </body>
    </html>
  );
}
