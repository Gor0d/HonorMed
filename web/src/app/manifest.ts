import type { MetadataRoute } from "next";
import { PRODUCT_NAME, PRODUCT_TAGLINE, BRAND_COLORS } from "@/lib/brand";
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: PRODUCT_NAME,
    short_name: PRODUCT_NAME,
    description: PRODUCT_TAGLINE,
    lang: "pt-BR",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: BRAND_COLORS.paper,
    theme_color: BRAND_COLORS.deep,
    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
