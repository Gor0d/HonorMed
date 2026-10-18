# HonorMed (pasta Repasse_MED) — instruções para o Codex

Leia `docs/PLANO.md` antes de qualquer tarefa: contexto, arquitetura, modelo de dados, telas e fases.

## Regras
- Leia a revisão mais recente no topo de `docs/PLANO.md`: controle pessoal por perfil (Consultas, Laudos ou ambos). A Fase 4 está implementada; `docs/FASE-4-REGISTRO-PESSOAL.md` registra seu escopo. Conector MV é opcional/futuro; a Fase 0 só bloqueia o conector.
- Oracle MV é **somente leitura**: nunca INSERT/UPDATE/DELETE, nunca produção sem validar em HML (SYS_CONTEXT).
- LGPD: nunca guardar nome/CPF/iniciais de paciente. Registro manual é por quantidade (sem paciente); `cd_atendimento` só quando vier de importação.
- Nunca commitar `.env*`, credenciais ou chaves (service role só no conector).
- Cálculo de repasse em SQL (Supabase), auditável; RLS por médico em todas as tabelas.
- UI: mobile-first, pt-BR (R$, datas), Tailwind + shadcn/ui + Recharts, PWA instalável.
- Fluxo principal: controle pessoal por quantidade/local/convênio e recebimentos informados pelo médico; código MV opcional. Não apresentar autodeclarações como confirmação hospitalar.
- `/importados` mantém visão avançada independente; nunca somar automaticamente produção importada e pessoal.
- Marca central em `web/src/lib/brand.ts`. Migrations novas consolidam locais, quantidade em atendimentos e recebimentos por convênio/local; as views pessoais respeitam RLS das tabelas base.

## Estrutura
/web (Next.js) · /extension (popup Chromium) · /supabase (migrations, seed) · /connector (Python) · /docs

## Comandos
- web (dentro de `/web`): `npm install`, `npm run dev`, `npm run build`, `npm start`
- SQL/cálculo/RLS (dentro de `/web`): `npm test` (Vitest + PostgreSQL PGlite, sem Oracle)
- navegador (dentro de `/web`): `npx playwright install chromium`, `npm run test:e2e`
- extensão (dentro de `/extension`): `npm.cmd ci`, `npm.cmd run typecheck`, `npm.cmd test`, `npm.cmd run test:e2e` e `npm.cmd run check:artifacts`.
- build de uso da extensão: defina `HONORMED_SUPABASE_URL` (origem HTTPS), `HONORMED_SUPABASE_ANON_KEY` (chave pública anon) e `HONORMED_APP_URL` (origem HTTPS); execute `npm.cmd run build` e `npm.cmd run check:artifacts`. Somente essas URLs e a chave anon entram no pacote; nunca use service role ou qualquer secret. `test:e2e` regrava `dist/` com valores fictícios; reconstrua o pacote de uso depois.
- Supabase (raiz, Docker ativo): `supabase start`, `supabase db reset`, `supabase status`
- conector: não implementado; Fase 0 bloqueia Fase 3. Não acessar Oracle nas Fases 1/2.
- seed: demonstração local com 140 atendimentos Out/2026 e 70 Nov/2026; veja `README.md`.
- não commitar `.npm-cache`, `.next`, `node_modules`, relatórios de teste ou `.env*`.
- não versionar `extension/dist/` nem `extension/release/` (ZIP gerado).

## Roadmap
Laudos radiológicos foram antecipados por pedido explícito: leia revisão v3. Perfil Somente laudos não exige consultas/convênios. Produção e recebimentos dos módulos não se compensam. Nenhuma imagem, DICOM, texto de laudo ou dado de paciente. Preços propostos em `web/src/lib/plans.ts`, sem cobrança ativa.

Features futuras e plano para cirurgias, internações e demais produções do médico: `docs/ROADMAP.md`.

## Contexto para outras IAs
Skills próprias do projeto em `.agents/skills/`: `honormed-produto`, `honormed-dados`, `honormed-identidade` e `honormed-publicacao`. Leia `docs/IA.md` e somente o SKILL.md pertinente à tarefa; use os documentos canônicos para decisões atuais. Esses arquivos não concedem autorização de operações externas nem incluem credenciais pessoais.

## Publicação
Leia `docs/LANCAMENTO.md`: piloto publicado em https://honormed.emersongsguimaraes.workers.dev, Supabase exclusivo `tsommjqsqtktijiutovj` em São Paulo. Cinco migrations aplicadas sem seed; 14 tabelas com RLS. Auth/API reais e navegador validados com contas técnicas removidas depois. SMTP Resend configurado; entrega de confirmação/recuperação ainda depende de teste do usuário. Não carregar seed nem executar db reset em banco remoto. Em PowerShell use `npm.cmd`/`npx.cmd` quando scripts .ps1 estiverem bloqueados.

Cloudflare: `npm.cmd run build:cloudflare` exige Supabase e verifica credenciais nos artefatos; `npm.cmd run deploy:cloudflare` reconstrói/verifica/publica pelo Wrangler. Sem R2/cache remoto: deploy evita Miniflare local, que falha neste Windows; preview local continua indisponível, runtime publicado testado. Demo substituída por stub em build com Supabase. `.open-next/`, `.wrangler/`, `.dev.vars*`, `.vercel/` e `.env*` ignorados. NUNCA deixar tokens Vercel, SMTP, senhas ou service role no ambiente de build: OpenNext serializa env; somente variáveis públicas devem estar em `web/.env.local`. Credenciais operacionais ficam fora de `/web`. Os testes E2E têm build/env próprios para nunca acessar o Supabase real. Configuração Auth de produção em `deploy/production/supabase/config.toml` usa referência env para SMTP. Vercel permanece sem deploy e Hobby não é opção comercial.
