import { PRODUCT_NAME } from "@/lib/brand";
export function GET() {
  return new Response(
    `<!doctype html><html lang="pt-BR"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>${PRODUCT_NAME} · Sem conexão</title><body style="background:#eff4f2;color:#0e1f1b;font-family:system-ui;padding:40px"><h1>Você está sem conexão</h1><p>Conecte-se à internet para consultar seu controle pessoal com segurança.</p><a href="/">Tentar novamente</a></body></html>`,
    { headers: { "Content-Type": "text/html; charset=utf-8" } },
  );
}
