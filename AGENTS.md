# Repasse_MED — instruções para o Codex

Leia `docs/PLANO.md` antes de qualquer tarefa: contexto, arquitetura, modelo de dados, telas e fases.

## Regras
- Siga as fases na ordem. A Fase 0 (mapeamento do Soul MV via MCP `soul-mv-erp-hml`) bloqueia o conector.
- Oracle MV é **somente leitura**: nunca INSERT/UPDATE/DELETE, nunca produção sem validar em HML (SYS_CONTEXT).
- LGPD: nunca enviar nome/CPF de paciente ao Supabase; usar `cd_atendimento` e dados financeiros.
- Nunca commitar `.env*`, credenciais ou chaves (service role só no conector).
- Cálculo de repasse em SQL (Supabase), auditável; RLS por médico em todas as tabelas.
- UI: mobile-first, pt-BR (R$, datas), Tailwind + shadcn/ui + Recharts, PWA instalável.

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
