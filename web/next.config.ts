import type { NextConfig } from "next";
// Public deployments must never silently fall back to the local demonstration.
if (process.env.VERCEL || process.env.HONORMED_REQUIRE_SUPABASE === "true") {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key || !url.startsWith("https://")) {
    throw new Error(
      "Produção exige NEXT_PUBLIC_SUPABASE_URL HTTPS e NEXT_PUBLIC_SUPABASE_ANON_KEY antes do build.",
    );
  }
  if (key.startsWith("sb_secret_"))
    throw new Error("Use somente a chave pública do Supabase no frontend.");
  if (key.split(".").length === 3) {
    let role: unknown;
    try {
      role = JSON.parse(
        Buffer.from(key.split(".")[1], "base64url").toString(),
      ).role;
    } catch {
      throw new Error("Chave pública Supabase inválida.");
    }
    if (role !== "anon")
      throw new Error("O frontend exige chave anon, nunca service_role.");
  }
}
const config: NextConfig = {
  poweredByHeader: false,
  serverExternalPackages: ["@electric-sql/pglite"],
  devIndicators: false,
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
    ];
  },
};
export default config;
