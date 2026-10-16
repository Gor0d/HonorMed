import { PRODUCT_NAME, BRAND_COLORS } from "@/lib/brand";
export function GET() {
  return new Response(
    `<!doctype html><html lang="pt-BR"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>${PRODUCT_NAME} · Sem conexão</title><body style="background:${BRAND_COLORS.paper};color:${BRAND_COLORS.deep};font-family:system-ui;padding:40px;max-width:520px;margin:40px auto"><svg width="64" height="64" viewBox="0 0 64 64" aria-label="${PRODUCT_NAME}" role="img"><rect width="64" height="64" rx="19" fill="${BRAND_COLORS.deep}"/><path d="M17 16H26V29L38 24V16H47V48H38V34L26 39V48H17V16Z" fill="${BRAND_COLORS.paper}"/><path d="M38 16H47V25L38 29V16H38Z" fill="${BRAND_COLORS.gold}"/></svg><h1>Você está sem conexão</h1><p>Conecte-se à internet para consultar seu controle pessoal com segurança.</p><a href="/">Tentar novamente →</a></body></html>`,
    { headers: { "Content-Type": "text/html; charset=utf-8" } },
  );
}
