---
name: honormed-identidade
description: Criar ou adaptar telas e materiais do HonorMed mantendo a marca aprovada, logo H, paleta e tipografia. Usar em UI, PWA, apresentações e peças comerciais da marca existente.
---

# Identidade HonorMed

Leia [AGENTS.md](../../../AGENTS.md), [PLANO.md](../../../docs/PLANO.md) e o [guia da marca](../../../docs/brand/README.md). A marca já foi aprovada: adaptar aplicações não significa redesenhar a logo ou renomear o produto.

Fontes de verdade:

- Nome/tagline e cores institucionais: `web/src/lib/brand.ts`.
- Marca no React: `web/src/components/brand.tsx`.
- Logos em curvas, variantes claras/escuras e PNG: `web/public/brand/`.
- Tokens de interface e temas: `web/src/app/globals.css`.
- Prancha e PDF de identidade: `docs/brand/`; apresentação comercial é outro material em `docs/apresentacao/`.

Preserve monograma H com ligação ascendente e detalhe em ouro; não o substitua por ícone genérico de pulso ou cruz. Use petróleo #123C3A, marfim #F8F5ED e ouro #DFB86C conforme o guia. Ouro é detalhe decorativo, não texto pequeno sobre branco nem substituto das cores semânticas de status financeiro. Bricolage Grotesque nos títulos e Manrope nos controles/textos.

No app, componentes e tokens são preferíveis a duplicar logo e cores por tela. Em materiais externos use SVG vetorizado ou PNG do kit; não exige fontes instaladas para o wordmark. Mantenha a aplicação útil em 390px e 1280px, claro e escuro; botões principais devem preservar contraste de pelo menos 4,5:1. Não invente resultados financeiros ou integração hospitalar em peças comerciais.

Para regenerar ativos existentes, `node scripts/generate-brand.mjs` em `/web` usa as curvas versionadas e Chromium. Não baixa fonte ou modelo de imagem no build normal. Nova vetorização exige a ferramenta e licença descritas no guia. Se alterar PWA, confira manifest, favicon, área segura maskable e cache público do service worker; dados financeiros não entram no cache.

Para implementação web leia também `web/AGENTS.md` e documentação local do Next pertinente. Ao entregar, diferencie arquivo de proposta, aplicação local e publicação efetiva; não diga que o site foi atualizado só porque gerou imagens ou fez commit.
