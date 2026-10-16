# HonorMed (pasta Repasse_MED) — instruções para o Codex

Leia `docs/PLANO.md` antes de qualquer tarefa: contexto, arquitetura, modelo de dados, telas e fases.

## Regras
- Leia a REVISÃO v2 no topo de `docs/PLANO.md`: produto = controle pessoal do médico (registro manual + recebimentos). Próxima tarefa: `docs/FASE-4-REGISTRO-PESSOAL.md`. Conector MV é opcional/futuro; a Fase 0 só bloqueia o conector.
- Oracle MV é **somente leitura**: nunca INSERT/UPDATE/DELETE, nunca produção sem validar em HML (SYS_CONTEXT).
- LGPD: nunca guardar nome/CPF/iniciais de paciente. Registro manual é por quantidade (sem paciente); `cd_atendimento` só quando vier de importação.
- Nunca commitar `.env*`, credenciais ou chaves (service role só no conector).
- Cálculo de repasse em SQL (Supabase), auditável; RLS por médico em todas as tabelas.
- UI: mobile-first, pt-BR (R$, datas), Tailwind + shadcn/ui + Recharts, PWA instalável.
- Fluxo principal: controle pessoal por quantidade/local/convênio e recebimentos informados pelo médico; código MV opcional. Não apresentar autodeclarações como confirmação hospitalar.
- `/importados` mantém visão avançada independente; nunca somar automaticamente produção importada e pessoal.
- Marca central em `web/src/lib/brand.ts`. Migrations novas consolidam locais, quantidade em atendimentos e recebimentos por convênio/local; as views pessoais respeitam RLS das tabelas base.

## Estrutura
/web (Next.js) · /supabase (migrations, seed) · /connector (Python) · /docs

## Comandos
- web (dentro de `/web`): `npm install`, `npm run dev`, `npm run build`, `npm start`
- SQL/cálculo/RLS (dentro de `/web`): `npm test` (Vitest + PostgreSQL PGlite, sem Oracle)
- navegador (dentro de `/web`): `npx playwright install chromium`, `npm run test:e2e`
- Supabase (raiz, Docker ativo): `supabase start`, `supabase db reset`, `supabase status`
- conector: não implementado; Fase 0 bloqueia Fase 3. Não acessar Oracle nas Fases 1/2.
- seed: demonstração local com 140 atendimentos Out/2026 e 70 Nov/2026; veja `README.md`.
- não commitar `.npm-cache`, `.next`, `node_modules`, relatórios de teste ou `.env*`.
