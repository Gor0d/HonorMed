# HonorMed — plano vigente (19/10/2026)

Esta revisão substitui as propostas antigas, preservadas no [histórico](historico/PLANO-ATE-20261018.md). Resumo comercial e de publicação: [ESTADO-ATUAL](ESTADO-ATUAL.md).

## Produto e fluxo

Controle pessoal individual, com perfil Consultas, Laudos ou Ambos. Registrar quantidade → estimar produção → informar recebimento → conferir saldo. Código MV opcional. Honorário desconhecido permite registrar quantidade, sinalizando valor pendente. Registro pessoal não confirma faturamento ou pagamento hospitalar.

- Consultas: local, convênio, data e quantidade; honorário esperado, recebimento por local/convênio/mês de produção e saldo.
- Laudos: instituição, tipo de exame, data e quantidade; tarifa por instituição/tipo, produção e recebimentos independentes. Não exige consultas/convênios. Não emite laudos nem armazena texto, imagem ou DICOM.
- Registro manual sem identificação de paciente; nenhum nome, CPF ou iniciais. `cd_atendimento` somente em importação. `/importados` é visão avançada separada, nunca somada automaticamente à produção pessoal.
- Oferta individual proposta: R$ 79,90/mês por médico, um ou ambos os módulos; fonte `web/src/lib/plans.ts`. Sem cobrança, trial ou bloqueio por plano. Equipes/instituições não são oferta atual.

## Arquitetura e dados

`/web`: Next.js App Router/TypeScript, Tailwind/shadcn/Recharts, pt-BR, tokens claro/escuro, PWA; navegação mobile e desktop. `/extension`: popup Chromium para registro quantitativo com a mesma conta, sem leitura de prontuários/sites. `/supabase`: migrations e cálculo SQL auditável; `/connector`: reservado, não implementado; `/docs`: contexto, regras e evidências.

Identidade em `web/src/lib/brand.ts` e `web/public/brand`. Auth Supabase e RLS individual em todas as tabelas, views com privilégios do chamador. Não usar service role no app/extensão. Migrations sempre novas e compatíveis; nunca reset/seed remoto. Segredos fora do Git e do ambiente de build web.

As 14 tabelas base são `medicos`, `locais`, `convenios`, `regras_repasse`, `atendimentos`, `recebimentos`, `honorarios_pessoais`, `metas`, `sync_log`, `preferencias_produto`, `laudos_tipos`, `laudos_valores`, `laudos_producao` e `laudos_recebimentos`. Migrations B4 acrescentam `piloto_preferencias` e `piloto_contadores`, com RLS e sem campos financeiros. Schema completo nas migrations, não neste resumo.

Cálculo importado: fixo ou percentual, vigência, dedução e glosa em SQL. Cálculo pessoal: quantidade × honorário conhecido preservado no registro e recebimentos informados; pendências não viram zero silenciosamente. Consultas/Laudos e importado/pessoal não se compensam automaticamente. Ver `REGRAS.md` e `FASE-4-REGISTRO-PESSOAL.md`.

## Estado das entregas

Fundação/Núcleo e controle pessoal/Laudos implementados. Registro `/registrar` e extensão implementados; extensão testada manualmente pelo titular, ainda sem distribuição em loja. Páginas legais e novos e-mails preparados, não publicados conforme último registro.

| Seção B | Preparado em PR, sem deploy | Referência |
|---|---|---|
| 1 | Exportar JSON/CSV e excluir a própria conta | `CONTA-E-DADOS.md` |
| 2 | Checklist por módulo e atalho Registrar | `PRIMEIRO-USO.md` |
| 3 | Feedback sem anexos financeiros | `FEEDBACK.md` |
| 4 | Contadores opt-in sem valores/locais/texto | `METRICAS-PILOTO.md` |
| 5 | Procedimentos operacionais, não executados | `runbooks/README.md` |
| 6 | Oferta/documentação/deck alinhados | `ESTADO-ATUAL.md` |

B7 depende de decisão comercial; B8 depende de validação de regras reais. Não implementar automaticamente. Cirurgias, internações, plantões, organizações/equipes e cobrança automática ficam futuros.

## Verificação e limites

Para esta seção B, usar `npm.cmd test -- tests/b` e `npm.cmd run test:e2e -- 'b[1-6]-'` em `/web`: fixtures mínimas com migrations, sem carregar seed, E2E em 390px/1280px e build isolado. Não executar suíte demo legada sob restrição de seed. Homologação de Auth real, revogação de sessões, retenção, restauração e PWA físico são verificações separadas ainda pendentes.

Conector MV continua opcional e futuro: Fase 0 bloqueia somente o conector. Nenhum acesso Oracle nesta entrega. Qualquer descoberta futura exige autorização institucional, HML validada e somente leitura. Valor de repasse no MV e definição hospitalar de competência continuam perguntas abertas, sem presumir uma resposta.
