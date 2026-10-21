# HonorMed — piloto publicado e operação

Publicação de 20/10/2026: main `d6dfae7` no Worker `honormed`, versão Cloudflare `535f27e3-c655-4fea-afab-65ad84c5c2aa`. Inclui `/registrar` e atalhos da PWA, banner da extensão (loja "em breve"), CRM por UF, página pública de acesso e `/privacidade`, `/termos` e `/suporte` **com aviso visível de rascunho** e `noindex`. Build OpenNext com somente URL e chave anon, verificador de artefatos aprovado, sem tokens no ambiente. Conferido no ar: rotas 200, `/api/demo` 403, DENY/nosniff, manifest com `shortcuts`; navegador em 390/1280 px sem erro JavaScript, overflow ou texto de demonstração. Sem migration, seed ou alteração de configuração do Supabase; modelos visuais de e-mail continuam não aplicados. Monitoramento ativo pelo workflow `Monitor HonorMed`.

Preparação de 18/10/2026: páginas `/privacidade`, `/termos` e `/suporte`, contato `acesso@cforod.com` e artes fictícias da extensão foram implementados nesta branch; **ainda não há confirmação de deploy dessas páginas**. Política e termos são rascunhos para revisão do responsável e não devem ser publicados como compromissos vigentes antes da aprovação. O titular identificou Emerson Gabriel da Silva Guimarães como responsável pela política e relatou teste manual da extensão com sua conta real (login, Consulta, Laudo, desfazer e sair). O navegador físico e o comportamento de fechamento/expiração ainda precisam de registro. O texto da política deve ser conferido na URL publicada antes de usá-la na Chrome Web Store.

Atualização de 17/10/2026: o titular informou que recebeu e confirmou o e-mail de cadastro, recebeu o link de recuperação, definiu uma nova senha, concluiu o perfil e abriu Consultas e Laudos no site publicado. Esta validação cobre a entrega dos e-mails e o fluxo da conta dele; não testa os novos [modelos visuais de e-mail](brand/emails/README.md), ainda não aplicados ao Supabase hospedado.

Revisão: 16/10/2026. Oferta inicial: controle financeiro individual, Consultas e Laudos pelo mesmo preço proposto de R$ 79,90/mês. O médico informa produção e recebimentos; não há confirmação hospitalar automática. Não há cobrança automática, limites de plano ou período de teste implementados.

Identidade visual aprovada e publicada em 16/10/2026: versão Cloudflare `a0f5bc2b-e51c-4e71-87e4-65f9afdb9a11`, código `7819384` integrado à main. Logo H, paleta petróleo/marfim/ouro, login, navegação e PWA atualizados. GitHub Actions da branch aprovado (run 38955176388). Build OpenNext e verificação de credenciais aprovados. Login publicado conferido em 390px/1280px, claro/escuro, sem erros JavaScript ou overflow; símbolos/ícones correspondem aos arquivos aprovados; manifest e service worker atualizados; demo permanece 403. Nenhuma mudança no banco nesta publicação. Kit em `docs/brand`.

Publicado em **https://honormed.emersongsguimaraes.workers.dev**, Cloudflare Worker `honormed`, versão inicial `773cc958-c0af-4a93-a9da-7fe5bc0fc067`. Backend exclusivo Supabase `tsommjqsqtktijiutovj`, São Paulo. Cinco migrations aplicadas, incluindo fixação do search_path do cálculo. Nenhum seed foi carregado. Usuário confirmou a pausa do cforod no painel para liberar a vaga. O projeto Vercel existe, mas não foi publicado nem teve plano alterado.

Verificação desta revisão: build Next/OpenNext passou; 27 testes Vitest SQL/RLS passaram; 12 fluxos Playwright locais passaram nos dois tamanhos. Teste adicional com Auth/API reais e navegador no endereço publicado passou em 390px e 1280px: login, onboarding, preferência Laudos, cálculo 8 × R$ 12,50 − R$ 40 = R$ 60, persistência, troca de competência e isolamento A/B de SELECT/INSERT/UPDATE/DELETE. Contas técnicas e todos os seus dados foram removidos. O banco voltou a zero médicos/produção. Security Advisors: nenhum aviso ou erro após a migration 005. Os testes técnicos não substituem a homologação da chegada dos e-mails.

HTTP publicado: login 200 sem dados demo, sem overflow/erro JavaScript em ambas larguras; `/api/demo` 403; manifest, recuperação e offline 200; headers DENY/nosniff presentes. Chave Resend somente na configuração SMTP do Supabase e arquivo local ignorado; nenhuma service role no app. Configuração aplicada via `deploy/production/supabase/config.toml`: confirmação habilitada, senha mínima 8, Site URL e redirect de recuperação exatos, SMTP Resend SSL 465, remetente **HonorMed <acesso@cforod.com>**, domínio verificado. A entrega real estava pendente nesta revisão de 16/10 e foi confirmada pelo titular em 17/10, conforme atualização acima.

## Resultado da revisão

A arquitetura Next.js + Supabase é adequada ao piloto individual. Migrations versionadas, cálculo SQL, RLS por médico, módulos separados, importação secundária e service worker sem cache financeiro já existem. O banco PGlite e o seed são exclusivamente demonstrativos. Testes PGlite não substituem homologar o Supabase Auth e a API reais.

Pendências antes de ampliar para clientes pagantes:

- Acompanhar entregabilidade, limites de envio e antiabuso conforme as métricas do piloto. Confirmar novamente cadastro, recuperação e retorno ao aplicativo depois de aplicar novos modelos de e-mail ou trocar o domínio. Manter a confirmação de e-mail habilitada.
- Consultas também homologadas pela API real: 3 × R$ 50 − R$ 20 = R$ 130; navegador alternou Ambos preservando R$ 130 em Consultas e R$ 60 em Laudos. Complementar com uso assistido pelo médico e PWA em dispositivo físico.
- Definir domínio próprio e atualizar Site URL/redirects antes de trocar os links enviados por e-mail. O endereço workers.dev serve ao piloto.
- Disponibilizar termos, privacidade, identificação do fornecedor e canal de suporte; definir procedimento de exportação, exclusão e retenção. Revisar os textos antes de apresentá-los como compromissos contratuais.
- Definir contratação/cancelamento e cobrança: um piloto assistido pode usar contratação e pagamento externos, sem afirmar que o app faz gestão de assinatura ou trial. Controle de acesso comercial ainda precisa ser implementado para autosserviço.
- Configurar alertas de falhas e disponibilidade sem registrar conteúdo financeiro ou tokens. Definir backup, retenção e executar um teste de restauração separado.
- Monitoramento (20/10/2026): `.github/workflows/monitor.yml` confere a cada 2 h as rotas públicas (200), `/api/demo` 403, ausência do aviso de demonstração, cabeçalhos DENY/nosniff e o Auth do Supabase; às segundas roda testes e `npm audit` de web e extensão. Falha abre ou comenta uma issue por verificação, fechada automaticamente na recuperação. Somente leitura, sem deploy ou escrita no banco. Variável opcional do repositório `SUPABASE_ANON_KEY` (chave pública) torna a checagem do Auth completa. Agendamentos rodam só na branch padrão e são desativados pelo GitHub após 60 dias sem atividade no repositório. Backup/restauração continuam pendentes.

Equipe/Clínica/Institucional são roadmap: faltam organizações, membros, convites, papéis, autorização por organização, consentimento/escopo do compartilhamento e RLS correspondente. Não reutilizar login compartilhado nem remover RLS individual para simular equipes. A tabela comercial atual do app e a apresentação ainda refletem a proposta anterior e precisam ser alinhadas antes de divulgar ofertas de equipe.

## Cloudflare: configuração usada

O usuário escolheu avaliar Workers antes de contratar Vercel Pro; a publicação foi concluída nele. Não houve contratação automática de plano pago em qualquer provedor. Verificar cotas do plano atual e ativar plano adequado antes de ampliar uso; os testes não foram testes de carga.

OpenNext Cloudflare 1.20.12 e Wrangler 4.151.1, `open-next.config.ts` e `wrangler.jsonc`. Sem R2, D1, imagens ou cache incremental remoto. Pacote inicial 1,35 MiB gzip, startup informado pelo provedor de 21 ms. A rota demo recebe stub sem PGlite quando há Supabase configurado, resolvendo o erro de symlink do primeiro teste e evitando levar banco fictício ao Worker.

Miniflare/workerd local falha neste Windows com access violation. O deploy usa Wrangler diretamente com `OPEN_NEXT_DEPLOY=true`, evitando a etapa de população de cache local do OpenNext, pois não há cache remoto configurado. Isso não elimina testes: o runtime publicado foi validado pelo navegador. Se adicionar R2/ISR ou outro cache, revisar o script de deploy e a etapa de população.

O primeiro upload foi rejeitado pela revisão automática por risco de levar Vercel OIDC ao Cloudflare. A inspeção confirmou que OpenNext serializava o token em `cloudflare/next-env.mjs`. O token foi preservado fora de `/web`, o pacote reconstruído e inspecionado antes do upload autorizado. `check-cloudflare-artifacts.mjs` agora interrompe build/deploy se encontrar arquivos .env ou valores de credenciais locais conhecidas. É uma verificação adicional, não um detector universal de segredos: manter somente variáveis públicas no ambiente de build, nunca SMTP, senha de banco, tokens Vercel ou service role.

A cadeia de ferramentas introduziu alerta de glob transitivo; override restrito a `@node-minify/core` usa glob ^10.5.0 e nova instalação retornou zero vulnerabilidades no npm audit. Revisar esse override ao atualizar OpenNext.

Na pasta `web`, `npm.cmd run build:cloudflare` constrói e verifica; `npm.cmd run deploy:cloudflare` reconstrói, verifica e publica. `npm.cmd run preview:cloudflare` continua dependente do runtime local, atualmente indisponível neste Windows. O deploy por CLI é manual; não há publicação automática pelo Git.

Configuração Auth de produção fica separada da local em `deploy/production/supabase/config.toml`. Executar `supabase config diff/push --workdir deploy/production --project-ref tsommjqsqtktijiutovj` com RESEND_API_KEY fornecida por ambiente seguro; nunca commitar seu valor. O usuário compartilhou uma chave na conversa: substituir por outra chave operacional antes de ampliar a divulgação e atualizar o SMTP. A chave não foi enviada no pacote Cloudflare. O domínio remetente cforod.com foi consultado no Resend, sem alteração de DNS do site cforod.

Workers Paid parte de US$ 5/mês conforme tabela oficial; Supabase Pro parte de US$ 25/mês. US$ 30/mês é apenas referência de assinaturas básicas combinadas, sem câmbio, impostos, excedentes, SMTP, suporte e extras. Homologação técnica e custos reais decidem a hospedagem.

## Alternativa Vercel (não utilizada)

Na pasta `web`, com Node no PATH. No PowerShell use `npm.cmd`/`npx.cmd` se a política local bloquear arquivos .ps1; não precisa alterar a política do Windows.

```powershell
npm.cmd exec --yes --package=vercel -- vercel login
npm.cmd exec --yes --package=vercel -- vercel link
npm.cmd exec --yes --package=vercel -- vercel env add NEXT_PUBLIC_SUPABASE_URL preview
npm.cmd exec --yes --package=vercel -- vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY preview
npm.cmd exec --yes --package=vercel -- vercel env add NEXT_PUBLIC_SUPABASE_URL production
npm.cmd exec --yes --package=vercel -- vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production
npm.cmd exec --yes --package=vercel -- vercel deploy
```

Usar projeto de homologação para Preview; não compartilhar dados reais com previews indiscriminados. A CLI vincula `web` como raiz; pela integração Git configurar Root Directory `web`. `web/vercel.json` define Next.js, npm ci e build. `.vercel` é ignorado pelo Git. Valores NEXT_PUBLIC ficam no bundle: use somente URL e chave pública, protegidas por RLS.

Aplicar schema com Supabase CLI já autenticado e projeto explicitamente conferido:

```powershell
supabase link --project-ref <referencia-do-projeto-correto>
supabase db push --dry-run
supabase db push
```

Revisar o dry-run e backups antes de alterações no banco existente. Não usar `--include-seed`. Senhas devem ser inseridas diretamente na CLI ou gerenciador seguro, nunca em documentação/conversa/commits.

Homologar o preview em 390px e 1280px e no PWA instalado. Conferir `/api/demo` retornando 403, ausência de credenciais demo e dados fictícios, confirmação SMTP e recuperação de conta, persistência e isolamento. Só então publicar:

```powershell
npm.cmd exec --yes --package=vercel -- vercel deploy --prod
```

Associar domínio na Vercel e copiar os registros DNS exatos fornecidos para o provedor. Configurar URLs finais no Supabase e retestar e-mails. Não inventar registros nem alterar DNS existente sem conferir serviços já utilizados. Cada mudança de variável pública exige novo build/deploy. Rollback do frontend pela Vercel não reverte migrations; privilegiar migrations aditivas e restauração testada.

## Viabilidade e venda inicial

Começar com 5–10 médicos em piloto assistido. Medir semanalmente registros recorrentes, tempo de suporte, falhas e intenção de pagar. Vender autonomia de controle e previsão, sem prometer integração MV ou garantir recebimento.

Modelo: contribuição por cliente = mensalidade × (1 − tributos − taxas proporcionais) − custo variável − suporte variável. Ponto de equilíbrio = custos fixos mensais / contribuição por cliente, arredondado para cima. Incluir infraestrutura, ferramentas, e-mail, backups, manutenção, suporte, pró-labore e aquisição; implantação não é receita recorrente.

Exemplo meramente ilustrativo: R$ 79,90 e 15% de tributos/taxas deixam R$ 67,915 antes dos demais custos; R$ 2.100 fixos exigem 31 clientes se não houver outros custos variáveis. Com R$ 10 adicionais por cliente, exigem 37. Essas premissas não foram medidas. Meta proposta: reservar ao menos 20% da receita líquida para operação/evolução, ajustando preço quando suporte e consumo reais forem conhecidos. Não há garantia de lucro.

Preços públicos dos provedores não representam custo total do HonorMed. Confirmar cotação, impostos, consumo e plano comercial no momento da contratação. Não criar um projeto Supabase por médico: o isolamento atual é por RLS no banco compartilhado.

## Fontes técnicas

- https://vercel.com/docs/git
- https://vercel.com/legal/terms (Hobby: uso pessoal/não comercial)
- https://vercel.com/docs/environment-variables/framework-environment-variables
- https://supabase.com/docs/guides/deployment/going-into-prod
- https://supabase.com/docs/guides/auth/auth-smtp
- https://supabase.com/pricing
- https://opennext.js.org/cloudflare
- https://developers.cloudflare.com/workers/platform/pricing/

Nenhum Oracle é necessário para esta publicação. Conector continua fora do escopo e bloqueado pelo mapeamento em HML.
