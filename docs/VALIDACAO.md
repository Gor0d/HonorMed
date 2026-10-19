# Validação

## Extensão Registro rápido — relato do titular em 18/10/2026

O titular informou que instalou a extensão descompactada com sua conta real e conseguiu entrar, registrar uma Consulta e um Laudo de teste, desfazer e sair. O navegador usado e o teste de fechamento/expiração ainda precisam ser registrados. Este é um relato de validação manual; não executei operações na conta real. As capturas para a loja em `docs/brand/extension/` foram produzidas separadamente, com Auth/API simulados e dados fictícios.

As páginas `/privacidade`, `/termos` e `/suporte` passaram no build/E2E local em 390 px e 1280 px; os rascunhos jurídicos foram conferidos visualmente em ambos os tamanhos. Política e termos aguardam revisão do responsável; publicação e checagem HTTP permanecem pendentes nesta revisão.

## Cadastro e recuperação pelo titular — 17/10/2026

O titular confirmou no site publicado o recebimento do e-mail de cadastro e do link de recuperação, definiu a própria senha, concluiu o perfil e abriu Consultas e Laudos. Nenhum dado fictício foi carregado na conta publicada. Os [novos modelos visuais dos e-mails](brand/emails/README.md) foram apenas preparados no checkout; a entrega e o fluxo acima ocorreram com os modelos que já estavam configurados no Supabase.

## Identidade visual publicada — 16/10/2026

- Aprovação do usuário e integração fast-forward de `design/honormed-identity` na main, código 7819384. GitHub Actions da proposta concluído com sucesso: https://github.com/Gor0d/HonorMed/actions/runs/38955176388 (inclui SQL/RLS, build e 12 testes de navegador).
- Build OpenNext e verificação de credenciais aprovados; Cloudflare versão a0f5bc2b-e51c-4e71-87e4-65f9afdb9a11. Sem migrations ou acesso a dados financeiros nesta publicação.
- Verificação pública do novo login em 390px/1280px e claro/escuro: HTTP 200, sem erro JavaScript, sem overflow e sem credenciais demonstrativas. Ícones 192/512 e símbolo SVG idênticos aos arquivos aprovados; cores do manifest e versão pública do service worker conferidas. Demo API 403.

## Piloto publicado — 16/10/2026

- Cloudflare: https://honormed.emersongsguimaraes.workers.dev, versão inicial 773cc958-c0af-4a93-a9da-7fe5bc0fc067. Build Next/OpenNext passou após excluir PGlite da produção. Pacote 1,35 MiB gzip. Runtime publicado validado; Miniflare local falha neste Windows.
- Supabase exclusivo tsommjqsqtktijiutovj em São Paulo; cinco migrations sem seed, 14 tabelas com RLS. Security Advisors sem avisos/erros após fixar search_path. `supabase/tests/launch-rls.sql` validou cálculo e RLS no PostgreSQL real com rollback.
- Auth/API reais com dois usuários temporários: login, onboarding, perfil Laudos, produção/recebimento, saldo R$ 60, troca de competência e persistência em 390px e 1280px. Consultas também testadas pela API, saldo R$ 130, alternância Ambos no navegador sem compensar módulos. Acesso A/B bloqueado em SELECT/INSERT/UPDATE/DELETE; sem service role. Usuários, sessões e registros técnicos removidos ao final.
- Login público 200 com campos vazios, sem demo, sem erro JS/overflow; demo API 403; manifest/recuperação/offline 200; headers de segurança presentes.
- 27 testes SQL/RLS locais e 12 Playwright passaram novamente. Build E2E e servidor agora forçam configuração demo vazia, evitando acesso ao Supabase real. GitHub Actions configurado, ainda sem execução remota.
- SMTP Resend aplicado, domínio cforod.com verificado, confirmação habilitada, remetente acesso@cforod.com, redirects exatos. Entrega de confirmação e recuperação e conclusão da troca de senha ainda precisam de teste com a conta do usuário; não foi enviado e-mail a terceiros.
- Rejeição automática de primeiro upload evitou expor token Vercel incluído pelo OpenNext em next-env.mjs. Credencial removida do ambiente web, artefato reconstruído e verificado antes do upload autorizado. Build/deploy agora verificam credenciais locais conhecidas. Credenciais operacionais nunca entram no frontend.

As seções abaixo são o histórico anterior ao piloto; pendências de infraestrutura já atendidas são substituídas pelo resultado acima. Dispositivo físico/PWA instalado, carga, restauração de backup e contratação comercial continuam pendentes. Detalhes em `LANCAMENTO.md`.

## Laudos e perfis — 16/10/2026

- Build de produção aprovado. **27 testes SQL/RLS** e **12 testes Playwright** passaram (390 × 844 e 1280 × 900), incluindo os fluxos anteriores.
- Testes de Laudos: preço diferente do mesmo exame por instituição; snapshots; troca de instituição; honorário pendente; recebimento parcial em outro mês; separação de Consultas; RLS das tabelas/views e perfil próprio de outro médico.
- Navegador: escolher Somente laudos; recarregar e permanecer no módulo; dashboard e mês seguinte; Planos com R$ 79,90; alternar Ambos sem misturar saldos; cadastrar instituição/tipo; registrar sem tarifa; configurar valor; lançar/corrigir/excluir produção e recebimentos.
- Capturas: `web/test-results/radiology-dashboard-mobile.png` e `radiology-dashboard-desktop.png`, conferidas visualmente.
- Para validar localmente no stack Supabase, aplique a migration 004 e repita esses passos com duas contas reais do Auth, incluindo um novo médico sem nenhum convênio/consulta. O stack Supabase completo e o dispositivo físico continuam pendentes; os testes atuais usam PostgreSQL PGlite e entrada demonstrativa local.

## Controle pessoal — atualização de 16/10/2026

- Migrations `202610160002_controle_pessoal.sql` e `202610160003_unificar_producao.sql` aplicadas pelos testes PostgreSQL junto à fundação. A terceira consolida produção no núcleo de atendimentos e recebimentos por local/convênio. Nenhuma conexão com Oracle.
- SQL/RLS: 19 testes passaram, incluindo quantidade, honorário pendente, preservação de valores históricos, troca de local, recebimento em outro mês, excesso por local/convênio, regras específicas com dedução/glosa/vigência e proteção das novas tabelas/views. Usuário não pode se autodeclarar confirmado pelo hospital.
- Navegador: 8 testes passaram em 390 × 844 e 1280 × 900 no build de produção. Incluem cadastros pessoais, lançamento sem valor, repetição, stepper, desfazer, configuração de honorário, recebimento parcial por convênio, edição/exclusão, troca de mês, contraste dos temas e visão importada anterior.
- `npm run test:e2e` executa o build e usa servidor de produção exclusivo em 3100; não reutiliza nem interrompe o dev em 3000. Variável opcional `PLAYWRIGHT_TEST_PORT` permite trocar a porta.
- Capturas pessoais: `web/test-results/personal-dashboard-mobile.png`, `personal-dashboard-desktop.png` e variantes escuras. Os arquivos são ignorados pelo Git e regenerados pelos testes.
- As pendências de Auth/Supabase completo, implantação e dispositivo físico continuam válidas. Não foi homologado uso real com dados hospitalares.

### Conferência manual do fluxo pessoal

1. Entre em `/`, confira 24 consultas, 4 sem valor e saldo previsto R$ 1.745,00 em outubro. Novembro tem R$ 510,00 sem recebimento informado.
2. Em Ajustes, adicione local/convênio. Registre 5 consultas sem honorário: quantidade aumenta e valor fica pendente.
3. Configure R$ 100 por consulta para esse par: registros pendentes passam a R$ 500. Altere a configuração para R$ 110: os registros conhecidos permanecem R$ 500 e os novos usam R$ 110.
4. Registre R$ 200 recebidos em novembro, referentes à produção de outubro nesse local. Outubro reduz o saldo desse local para R$ 300; novembro não muda.
5. Edite a quantidade/recebimento e exclua registros para conferir recálculo. Teste filtros por local/convênio/dia. Não informe pacientes.
6. Em `/importados`, confira que os totais são independentes, sem somar os lançamentos pessoais.
7. Com Supabase configurado, faça onboarding sem código MV e repita com dois médicos; nenhum deve ver ou referenciar locais, honorários ou valores do outro.

O registro abaixo preserva os resultados da entrega inicial.

## Automatizada

`cd web`, `npm test`: PostgreSQL real embarcado executa as migrations. Casos fixo/percentual/dedução/arredondamento/glosa, contagens 140/70, sem regra, datas de vigência e sobreposição. RLS com dois UUIDs, papel não superusuário, views `security_invoker`, bloqueio de leitura, escrita indevida e atualização do outro médico.

`npm run test:e2e`: Chromium em 390 × 844 e 1280 × 900. Testa entrada na demo, dashboard, troca outubro → novembro, filtros e tema; grava screenshots nos resultados ignorados pelo Git. O teste demonstra a interface, não substitui a validação de Auth do Supabase abaixo.

Também valida criar/editar/excluir regras, remoção dos casos sem regra, importação CSV e recálculo do valor por SQL. A execução é serial para isolar as alterações no banco demonstrativo compartilhado.

## Resultado em 16/10/2026

- `npm run build`: passou (Next.js 16.4.2, TypeScript).
- `npm test`: 9 testes passaram, incluindo cálculo e isolamento real por papel PostgreSQL.
- `npm run test:e2e`: 4 testes passaram em Chromium, nas duas larguras.
- Capturas de tela de dashboard conferidas visualmente em claro; alternância para escuro validada pelo navegador.
- Auditoria npm após atualização do Vitest: zero vulnerabilidades reportadas.
- Oracle: nenhum acesso, credencial ou conector implementado.
- Stack Supabase completo / `supabase db reset`: não executado porque o daemon Docker não está ativo neste ambiente. Login/cadastro com Auth nativo e confirmação de e-mail precisam da conferência abaixo com Supabase configurado.
- Instalação da PWA pelo usuário e comportamento em dispositivo físico não foram verificados; assets e fluxo offline estão implementados.

## Supabase completo

Com Docker e CLI instalados, execute na raiz `supabase start` e `supabase db reset`. Configure as duas variáveis públicas do README e reinicie o web.

1. Faça login como `demo@repasse.test` / `DemoRepasse2026!`, veja 140 registros em outubro e 70 em novembro.
2. Crie outro usuário e complete CRM/código fictícios. Confirme que a produção é vazia. Cadastre convênio, regra e importe uma consulta. Volte ao médico demo e confirme que esses dados não aparecem.
3. Pelo cliente Supabase autenticado como B, tente inserir linha com `medico_id` de A; deve falhar por RLS. Atualizar/excluir A não deve afetar linhas. Uma referência a convênio de A com médico B deve falhar por FK composta.
4. Edite vigência/valor/dedução e confira o detalhamento SQL; crie sobreposição e espere rejeição. Importe CSV/XLSX com código repetido em arquivos sucessivos, confirme atualização sem duplicação. Arquivo inválido deve rejeitar todas as linhas.
5. Faça logout; confirme remoção da tela financeira. Confirme que `/api/demo` retorna 403 com Supabase configurado.

## PWA / visual

Manifest e ícones em DevTools → Application. Instale via navegador compatível em HTTPS/localhost; abra em modo standalone. Desligue rede: deve aparecer aviso offline, sem valores financeiros em cache. Confira tema claro/escuro, foco por teclado, zoom e rolagem de tabelas no celular. O botão instalar só aparece quando o navegador disponibiliza o evento nativo.
