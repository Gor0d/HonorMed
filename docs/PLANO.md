# Repasse_MED — MVP de repasse médico (consultas ambulatoriais)

## Context
Médicos que atendem em um hospital não sabem, durante o mês, quanto vão receber. O MVP mostra,
por competência (atual e seguinte), o repasse previsto de consultas ambulatoriais, consolidado
e quebrado por convênio (qtd × valor da consulta × honorário do médico) e por status
(realizado / a faturar / glosado / pago). Uso em celular (PWA) e desktop. Planejamos aqui (Claude);
o desenvolvimento será feito no Codex a partir deste plano.

Descoberta no ambiente (somente leitura, nada executado no banco):
- Hospital usa **Soul MV (Oracle, schema DBAMV)**. Já existe o MCP `soul-mv-erp`
  (`../KIT-Sobrevivencia-Hospitalar-GorodMV/mcp-server`) com `agenda_do_dia`, `faturamento_por_convenio`,
  `buscar_paciente`, `listar_tabelas`, `descrever_tabela`, `executar_sql_livre` (só SELECT, 500 linhas, timeout 30s).
- Config local em `../MV-local` (`.env.hml`/`.env.prd`); servidores `soul-mv-erp-hml/prd` estão
  **`enabled = false`** no `~/.codex/config.toml` até as credenciais serem preenchidas. Nesta sessão o MCP não está
  disponível, então o mapeamento do schema fica como **Fase 0** (descoberta com o MCP habilitado, em HML).

## Decisões já tomadas
- Dados: do **Oracle MV via MCP/conector read-only** (substitui "importar planilha"); import CSV/XLSX fica como
  fallback e para valores de repasse que não existam no MV.
- Stack: **Next.js (App Router) PWA + Supabase** (Auth, Postgres, RLS). Multi-médico desde o início.
- Regra de repasse: **configurável por convênio** — valor fixo OU percentual, com vigência, dedução opcional
  e tratamento de glosa.
- Dashboard: previsão competência atual/seguinte, quebra por convênio, status do ciclo, alertas e metas.

## Arquitetura
```
Oracle MV (hospital) --read-only--> Conector de sincronização (Python, rede do hospital)
        reutiliza queries/pool do mcp-server           |  HTTPS, service key só no conector
                                                       v
                                         Supabase Postgres (RLS por médico)
                                                       ^
                                  Next.js PWA (celular + desktop), login do médico
```
- **Conector** (`/connector`): job agendado (ex. a cada 1–4h) que lê atendimentos ambulatoriais do médico
  (agenda/atendimento + convênio + procedimento + status de faturamento) e faz upsert idempotente no Supabase.
  Reaproveita conexão/validação SELECT do `mcp-server`; usuário Oracle só-SELECT.
- **LGPD**: não enviar nome/CPF do paciente à nuvem. Guardar apenas `cd_atendimento` (ID externo),
  hash/iniciais e dados financeiros. Detalhe do paciente, se necessário, só por ID.
- Não escrever no Oracle em nenhuma hipótese. Produção só após validar em HML (`SYS_CONTEXT` antes de consultar).

## Modelo de dados (Supabase)
- `medicos` (user_id, crm, nome, cd_prestador_mv)
- `convenios` (id, cd_convenio_mv, nome)
- `regras_repasse` (medico_id, convenio_id, tipo_procedimento, modo `fixo|percentual`, valor_consulta,
  valor_honorario, percentual, deducao_pct, vigencia_ini, vigencia_fim)
- `atendimentos` (id, medico_id, cd_atendimento_mv UNIQUE, data_atendimento, convenio_id, procedimento,
  status `realizado|a_faturar|faturado|glosado|pago`, competencia `YYYY-MM`, valor_consulta_calc,
  valor_repasse_calc, regra_id, origem `mv|import|manual`)
- `repasses_competencia` (medico_id, competencia, previsto, realizado, glosado, pago) — view/materialized
- `metas` (medico_id, competencia, valor)
- `sync_log` (execução, linhas, erros)
- RLS: cada médico só lê/escreve linhas com `medico_id = auth.uid()`; conector usa service role.
- Regra de competência: configurável (data do atendimento vs. data de faturamento) — validar com o hospital.
- Cálculo em SQL (função/view), não no front, para ser auditável.

## Telas (MVP)
1. **Login / onboarding** (vincular CRM ↔ prestador MV).
2. **Dashboard**: card grande "A receber em {competência}" + atual/seguinte (tabs), barra de status
   (realizado/a faturar/glosado/pago), meta com progresso, alertas.
3. **Por convênio**: lista/gráfico com qtd, valor consulta, honorário, subtotal, ticket médio.
4. **Atendimentos**: lista filtrável (convênio, status, dia) com detalhe e origem do valor.
5. **Regras de repasse**: CRUD por convênio com vigência; alerta "consultas sem regra/valor".
6. **Importar**: upload CSV/XLSX com mapeamento de colunas (fallback).
7. **Configurações/Planos**: perfil, competência, notificações.

Alertas: consultas sem regra, convênio novo, glosa detectada, queda vs. mês anterior, meta em risco.

## Design
Mobile-first, moderno, escuro/claro, tipografia grande para valores (R$), cards com cantos arredondados,
gráficos limpos (barras empilhadas por convênio, donut de status), skeleton loading, PWA instalável
(manifest + service worker), navegação por bottom-tab no celular e sidebar no desktop.
Stack UI: Tailwind + shadcn/ui + Recharts; formatos pt-BR (moeda, data). "Valores e planos" para
os médicos: página de planos (Free: 1 convênio/competência atual; Pro: ilimitado, histórico, metas,
export) — apenas UI/feature-flag no MVP, sem cobrança.

## Fases
- **Fase 0 – Descoberta MV (bloqueante)**: habilitar `soul-mv-erp-hml`; com `listar_tabelas`/`descrever_tabela`
  mapear agenda ambulatorial, atendimento, convênio, procedimento, prestador, faturamento/glosa. Entregar
  `docs/mapeamento-mv.md` + SQL validados. Perguntar ao hospital se o valor de repasse existe no MV (tabelas de
  repasse/produção médica) — se sim, usar como fonte; senão, `regras_repasse` manual.
- **Fase 1 – Fundação**: repo Next.js + Supabase (migrations, RLS), auth, layout/PWA, seed fictício.
- **Fase 2 – Núcleo**: regras de repasse, cálculo, dashboard, por convênio, atendimentos.
- **Fase 3 – Conector**: sync MV→Supabase idempotente + `sync_log`; fallback de importação.
- **Fase 4 – Polimento**: alertas, metas, planos, testes, deploy (Vercel + Supabase).
- **Depois**: exames, cirurgias, internações (novos `tipo_atendimento` e regras).

## Estrutura do repo
`/web` (Next.js), `/supabase` (migrations, seed), `/connector` (Python), `/docs` (mapeamento, regras),
`AGENTS.md` (instruções para o Codex: convenções, comandos, regras de segurança/LGPD).

## Riscos / pontos abertos
- Schema MV pode ser customizado; valor de repasse pode não estar no MV (Fase 0 decide).
- Autorização formal do hospital/TI para o conector e política de dados na nuvem (LGPD).
- Definição exata de competência e tratamento de glosa por convênio.

## Verificação
- Fase 0: `validar_mcp.py` + consultas HML retornando agenda de um médico conhecido; conferir SYS_CONTEXT.
- Banco: testes de RLS (médico A não vê B) e de cálculo (casos fixo/percentual/vigência/glosa) com seed.
- Conector: rodar duas vezes → sem duplicar (idempotência); comparar contagem/valores com `faturamento_por_convenio`.
- Web: `npm run build`, testes (Vitest/Playwright) e conferência manual no celular (PWA instalado) e desktop.
