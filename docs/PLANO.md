# REVISÃO v4 (17/10/2026) — registro rápido no computador

Proposta em especificação: rota enxuta `/registrar` e extensão Manifest V3 para Chrome/Cent Browser, com a mesma conta do médico e os perfis Consultas, Laudos ou Ambos. Registro apenas por quantidade, sem dados de paciente; consultas pela view `producoes_pessoais` e laudos pela tabela `laudos_producao`, com cálculo no SQL e RLS existente. A extensão terá login próprio, sessão temporária por padrão e permissão somente de storage mais a origem Supabase do build. Detalhes e critérios em `docs/REGISTRO-RAPIDO.md`. Esta entrega não altera as fases existentes nem implica publicação da extensão.

---

# REVISÃO v3 (16/10/2026) — módulos independentes por perfil

Pedido posterior do usuário: acrescentar Laudos Radiológicos e aumentar o valor comercial. Disponibilizar os perfis Somente consultas, Somente laudos ou Ambos, salvos por médico. Radiologistas não precisam cadastrar consultas/convênios.

- Laudos: produção quantitativa por data/instituição/tipo de exame; tarifa por instituição/tipo, valores conhecidos preservados e preços pendentes permitidos. Tipos personalizáveis para modalidade/região/urgência quando houver diferença financeira.
- Dashboard radiológico e recebimentos por instituição/mês da produção, completamente separados de Consultas. Mesmo fluxo registrar → prever → receber → conferir, sem identificar pacientes, guardar imagens ou texto de laudo.
- Cálculos em SQL, RLS em todas as tabelas e views security_invoker. `202610160004_laudos.sql` é uma migration aditiva; sem Oracle.
- Proposta Pro R$ 79,90/médico/mês (módulos à escolha) e institucional de referência R$ 1.990/mês, centralizadas em `web/src/lib/plans.ts`; implantação de referência mantida em R$ 4.900. Sem cobrança ou limites ativos. Preços sujeitos à validação comercial.
- Cirurgias, internações, plantões e demais itens de `ROADMAP.md` continuam futuros; somente Laudos foi antecipado por autorização expressa.

---

# REVISÃO v2 (16/10/2026) — controle pessoal do médico

O produto passa a ser uma **ferramenta de controle pessoal**: o médico registra a própria produção e os
recebimentos, sem depender do sistema administrativo do hospital. A integração com o Soul MV vira
**opcional e futura** (a Fase 0 só é necessária se formos fazer o conector).

- **Entrada principal**: registro rápido manual ("hoje, 8 consultas Unimed no Hospital X"), sem paciente.
  Import CSV/XLSX continua como entrada secundária.
- **Tela inicial**: botão grande **Registrar consultas** + três números: **Produzido · Previsto a receber · Recebido**.
- **Recebimentos**: o médico registra valor e data quando o hospital paga; a diferença entre previsto e recebido
  fica sinalizada para conferência.
- **Locais de atendimento**: um médico pode atender em vários hospitais/clínicas.
- **Origem do dado**: cada lançamento tem `origem` (`informado_medico` | `importado` | futuro `confirmado_hospital`)
  e a UI deixa isso visível. O registro pessoal estima e confere; não prova que o hospital faturou ou pagou.
- **Nome do produto**: **HonorMed** (decidido em 16/10/2026; "Repasse MED" era provisório e conflita com o RepasseMed existente). Centralizar em `web/src/lib/brand.ts`. Pendente: checar INPI (classes 9, 36, 42) e domínio honormed.com.br.
- Mantém: Next.js + Supabase, RLS por médico, cálculo em SQL, sem dados de paciente, mobile-first.
- Próxima tarefa do Codex: `docs/FASE-4-REGISTRO-PESSOAL.md`. Futuro (cirurgias, internações, plantões, etc.): `docs/ROADMAP.md`.

---

# Repasse_MED — MVP de repasse médico (consultas ambulatoriais)

## Atualização de produto — controle pessoal do médico (16/10/2026)

Decisão posterior do usuário: priorizar a autonomia do médico, mesmo sem acesso ao administrativo do hospital. Esta decisão substitui a dependência de integração como entrada principal do produto; a Fase 0 continua bloqueando exclusivamente o conector MV.

- Tela inicial simples, com duas ações: Registrar consultas e Registrar recebimento.
- Registrar quantidade por data, local e convênio, sem identificação de pacientes. Honorário desconhecido não bloqueia o registro.
- Cadastrar locais, convênios e honorário líquido esperado por consulta. Código de prestador MV opcional no onboarding.
- Recebimento pessoal vinculado a local e mês de produção, separado da data do pagamento. Sem atribuição automática a consultas específicas.
- Honorário conhecido fica preservado no lançamento; configurar honorário preenche os registros ainda sem valor. Cálculos e saldo em SQL, RLS por médico em todas as novas tabelas.
- Dados pessoais informados pelo médico não significam confirmação do hospital. Visão importada mantida em `/importados`, com totais separados para evitar duplicidade.
- Marca HonorMed centralizada em `web/src/lib/brand.ts`, conforme revisão v2. Sem cobrança e sem implementação/acesso Oracle.

O restante deste documento registra o planejamento original e a visão de integração futura.

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
