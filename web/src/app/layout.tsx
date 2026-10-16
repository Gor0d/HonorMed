import type { Metadata, Viewport } from "next";
import "./globals.css";
import { PRODUCT_NAME, PRODUCT_TAGLINE, BRAND_COLORS } from "@/lib/brand";
export const metadata: Metadata = {
  title: `${PRODUCT_NAME} · Seu controle pessoal`,
  description: PRODUCT_TAGLINE,
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, title: PRODUCT_NAME },
  icons: {
    icon: [
      { url: "/brand/symbol.svg", type: "image/svg+xml" },
      { url: "/icon-192.png", type: "image/png" },
    ],
    apple: "/icon-192.png",
  },
};
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: BRAND_COLORS.deep,
};
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
