# HonorMed — operação e lançamento

Revisão B6 de 19/10/2026. Estado resumido em [ESTADO-ATUAL](ESTADO-ATUAL.md). Registro detalhado anterior preservado em [histórico](historico/LANCAMENTO-ATE-B5.md); ele contém resultados datados, não uma verificação remota atual.

## Último estado publicado registrado

Piloto em https://honormed.emersongsguimaraes.workers.dev, Worker `honormed`; backend exclusivo Supabase `tsommjqsqtktijiutovj`, São Paulo. Cinco migrations aplicadas sem seed e 14 tabelas com RLS. Identidade publicada em 16/10/2026, versão Cloudflare `a0f5bc2b-e51c-4e71-87e4-65f9afdb9a11`. O registro anterior documenta testes reais Auth/API, cálculo e isolamento A/B com contas técnicas removidas.

Em 17/10, o titular relatou confirmação e recuperação de e-mail, troca de senha e acesso aos módulos. Em 18/10, relatou login, registro de Consulta/Laudo, desfazer e sair na extensão. Novos modelos visuais de e-mail e páginas legais não têm publicação confirmada. Dispositivo/navegador físico e expiração de sessão da extensão ainda precisam de registro.

**Nesta revisão não houve deploy, acesso ao Supabase remoto, carregamento de seed ou leitura/alteração de credenciais.** O estado hospedado não foi reinspecionado. PR não significa publicação.

## Preparado nesta sequência, aguardando revisão

| Tarefa | PR | Validação local / pendente |
|---|---|---|
| B1 — conta e dados | [#1](https://github.com/Gor0d/HonorMed/pull/1) | SQL/RLS, export, exclusão e rollback; Auth hospedado e retenção pendentes |
| B2 — primeiro uso | [#2](https://github.com/Gor0d/HonorMed/pull/2) | Checklist por módulo; tempo real inferior a 2 minutos ainda não medido |
| B3 — feedback | [#3](https://github.com/Gor0d/HonorMed/pull/3) | App/extensão sem envio automático ou anexos; cliente de e-mail/suporte a homologar |
| B4 — métricas opt-in | [#4](https://github.com/Gor0d/HonorMed/pull/4) | Consentimento, RLS, export e exclusão; migration/política/homologação hospedada pendentes |
| B5 — runbooks | [#5](https://github.com/Gor0d/HonorMed/pull/5) | Procedimentos revisados; operações não executadas |
| B6 — materiais | Branch `feat/b6-current-state` | Oferta individual, estado atual e deck; sem alteração financeira |

PRs encadeados: revisar/mesclar na ordem B1 → B6 e ajustar as bases à medida que os anteriores forem integrados. Não houve merge na main. Duas migrations novas (conta e métricas) são aditivas; não há migration vazia para UI/documentação. Cálculos existentes continuam em SQL. Testes da seção B usam apenas fixtures mínimas, nunca o seed. Resultados e limites de execução em [VALIDACAO](VALIDACAO.md).

## Antes de ampliar o piloto

- Revisar textos legais, responsável e suporte; definir retenção de backups/logs e tratamento de contas excluídas após restauração. [Conta](CONTA-E-DADOS.md), [métricas](METRICAS-PILOTO.md), [runbooks](runbooks/README.md).
- Titular substituir a credencial Resend compartilhada anteriormente, usando canal seguro. Não enviar chaves em chat, logs, Git ou build. Nenhuma credencial foi tocada nesta entrega.
- Autorizar separadamente migrations e deploy; homologar export/exclusão no Auth real, sessões em outros dispositivos, opt-in e e-mails. Nunca seed nem reset remoto.
- Executar ensaio isolado de backup/restauração, definir RPO/RTO, testar PWA físico e extensão no navegador alvo; acompanhar disponibilidade/antiabuso sem conteúdo financeiro nos logs.
- Definir domínio e disponibilidade da marca; aprovar suporte, contratação e cancelamento. Preço proposto individual R$ 79,90/mês, Consultas/Laudos juntos ou separados. Sem cobrança/trial/limites ativos. B7 aguarda decisão; equipes não estão disponíveis.
- Medir infraestrutura, envio, suporte, aquisição, tributos e retenção antes de assumir rentabilidade. Não há teste de carga nem garantia de margem. Valores históricos de provedores não são orçamento vigente.

## Cuidados para uma futura publicação autorizada

Cloudflare Workers + OpenNext, sem R2/cache remoto. Miniflare local falhou neste Windows; runtime hospedado foi testado na publicação anterior. `npm.cmd run build:cloudflare` constrói/verifica e `npm.cmd run deploy:cloudflare` reconstrói/verifica/publica; **não foram executados nesta entrega**. Sem deploy automático pelo Git. Vercel não utilizado; Hobby não serve à oferta comercial.

OpenNext serializa ambiente: somente configurações públicas no build. Segredos SMTP, banco, Vercel, Cloudflare e service role ficam fora de `/web`. O scanner de artefatos é adicional, não detector universal. Demo é stub/403 em produção. Builds E2E e extensão de teste usam configuração fictícia e não podem ser distribuídos como release.

Configuração Auth de produção em `deploy/production/supabase/config.toml`, SMTP por referência de ambiente. Não executar push/configuração só por seguir este documento. Domínio, redirects e e-mails seguem [runbook de domínio](runbooks/DOMINIO.md); incidentes e chaves seguem [procedimento próprio](runbooks/INCIDENTES-E-CHAVES.md). Rollback de frontend não reverte migrations.
