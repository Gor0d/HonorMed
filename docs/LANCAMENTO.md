# HonorMed — preparação para lançamento

Revisão: 16/10/2026. Oferta inicial: controle financeiro individual, Consultas e Laudos pelo mesmo preço proposto de R$ 79,90/mês. O médico informa produção e recebimentos; não há confirmação hospitalar automática. Não há cobrança automática, limites de plano ou período de teste implementados.

Preparação executada: Vercel CLI 64.3.1 autenticada; projeto `gor0ds-tavern/honormed` criado e vinculado à pasta `web`. Nenhum deploy publicado nesta etapa. A equipe está em Hobby, cujo uso é pessoal/não comercial; lançamento comercial depende de plano compatível ou outra hospedagem. Supabase e domínio ainda precisam ser identificados/configurados. Não usar a existência do projeto como evidência de produção disponível.

Verificação desta revisão: build passou; 27 testes Vitest SQL/RLS passaram; 12 fluxos Playwright passaram nos dois tamanhos; `npm audit --omit=dev --audit-level=high` encontrou zero vulnerabilidades reportadas. Build com `HONORMED_REQUIRE_SUPABASE=true` e sem configuração falhou como esperado. Novo workflow `.github/workflows/verify.yml` prepara as mesmas verificações para GitHub Actions, ainda não executado remotamente. Recuperação real de senha e infraestrutura gerenciada continuam pendentes.

## Resultado da revisão

A arquitetura Next.js + Supabase é adequada ao piloto individual. Migrations versionadas, cálculo SQL, RLS por médico, módulos separados, importação secundária e service worker sem cache financeiro já existem. O banco PGlite e o seed são exclusivamente demonstrativos. Testes PGlite não substituem homologar o Supabase Auth e a API reais.

Bloqueios para receber clientes reais:

- Criar ou identificar Supabase exclusivo de produção e aplicar as quatro migrations, sem seed. Nenhum `db reset` remoto.
- Configurar as duas variáveis públicas do Supabase antes de construir o frontend. Nunca usar service_role/secret no app ou na Vercel.
- Configurar Site URL/redirects exatos, confirmação de e-mail, SMTP de produção e limites de autenticação no Supabase. O config.toml atual atende apenas ao desenvolvimento local.
- Recuperação e troca de senha adicionadas em `/recuperar-senha`; autorizar esse endereço nos redirects do Supabase. Validar cadastro, confirmação, entrada, saída e recuperação com contas reais de teste. A implementação local ainda não comprova a entrega do SMTP.
- Validar isolamento com dois usuários autenticados no Supabase real, inclusive mutations e views. Validar onboarding vazio, registros, recebimentos e recarga nos dois módulos.
- Disponibilizar termos, privacidade, identificação do fornecedor e canal de suporte; definir procedimento de exportação, exclusão e retenção. Revisar os textos antes de apresentá-los como compromissos contratuais.
- Definir contratação/cancelamento e cobrança: um piloto assistido pode usar contratação e pagamento externos, sem afirmar que o app faz gestão de assinatura ou trial. Controle de acesso comercial ainda precisa ser implementado para autosserviço.
- Configurar alertas de falhas e disponibilidade sem registrar conteúdo financeiro ou tokens. Definir backup, retenção e executar um teste de restauração separado.

Equipe/Clínica/Institucional são roadmap: faltam organizações, membros, convites, papéis, autorização por organização, consentimento/escopo do compartilhamento e RLS correspondente. Não reutilizar login compartilhado nem remover RLS individual para simular equipes. A tabela comercial atual do app e a apresentação ainda refletem a proposta anterior e precisam ser alinhadas antes de divulgar ofertas de equipe.

## Hospedagem recomendada

### Avaliação Cloudflare solicitada após a primeira revisão

O usuário preferiu avaliar Workers antes de contratar Vercel Pro. Instalados OpenNext Cloudflare 1.20.12 e Wrangler 4.151.1, com `open-next.config.ts`, `wrangler.jsonc` e scripts `build:cloudflare`/`preview:cloudflare`. Configuração é candidata, não homologada. Sem R2, D1, imagens ou serviço adicional provisionado. Sem deploy automático: falta validar o bundle e as dependências da rota local de demonstração.

O primeiro teste local compilou Next.js 16.4.2, mas falhou no empacotamento OpenNext com EPERM ao criar symlink de PGlite no Windows. Repetir em Linux/WSL; não afirmar que Workers já foi validado. O script final exige Supabase configurado para construir artefato publicável, e a configuração de runtime desabilita a demo. O artefato parcial do teste inicial não deve ser publicado. Antes de um deploy, confirmar que PGlite/seed não são necessários ao worker e que a rota demo retorna 403.

A cadeia de ferramentas introduziu alerta de glob transitivo; override restrito a `@node-minify/core` usa glob ^10.5.0 e nova instalação retornou zero vulnerabilidades no npm audit. Revisar esse override ao atualizar OpenNext.

Supabase CLI 2.121.0 autenticou, mas a criação `honormed` em São Paulo foi recusada pelo limite de dois projetos gratuitos ativos dos membros da organização. Usuário autorizou pausar exclusivamente `cforod` (`azcdwgebslqulvgkkufu`). Esta CLI não oferece comando de pausa; solicitado ao usuário pausar no painel. Pausa ainda não confirmada, nenhum banco criado ou modificado. Senha aleatória para a tentativa está em arquivo local ignorado; não é credencial de banco provisionado. Wrangler autenticado na conta do usuário, sem recursos publicados.

Workers Paid parte de US$ 5/mês conforme tabela oficial; Supabase Pro parte de US$ 25/mês. US$ 30/mês é apenas referência de assinaturas básicas combinadas, sem câmbio, impostos, excedentes, SMTP, suporte e extras. Homologação técnica e custos reais decidem a hospedagem.

Primeiro deploy: Vercel para Next.js, Supabase gerenciado para Postgres/Auth, Cloudflare opcional para DNS. Escolher região do banco e da aplicação conscientemente e testar latência. Não é necessário migrar o aplicativo para Cloudflare para lançar.

Cloudflare Workers é uma alternativa com adaptador OpenNext; exige adaptação e homologação próprias. A rota local de demonstração depende de PGlite, filesystem e migrations fora de /web; não é backend de produção e não deve ser disponibilizada externamente. Na Vercel ela fica bloqueada mesmo que o Host seja manipulado. Build Vercel sem Supabase HTTPS falha explicitamente.

## Roteiro de publicação pela CLI

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
