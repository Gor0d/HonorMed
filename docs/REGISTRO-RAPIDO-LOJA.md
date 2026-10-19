# Rascunho da página da extensão na Chrome Web Store

**Status: preparação interna, sem submissão ou publicação na loja.** Em 18/10/2026, o titular informou que instalou a extensão descompactada com a conta dele e conseguiu entrar, registrar uma Consulta e um Laudo de teste, desfazer e sair. Esse resultado é relato do titular; os testes automatizados permanecem isolados e não acessam a conta real. A entrega dos e-mails de cadastro/recuperação já havia sido confirmada em 17/10. A política de privacidade e os termos estão em rascunho para revisão do responsável; não publicar essas páginas como compromisso vigente antes da revisão. As URLs da política e do suporte só poderão ser usadas na loja depois do deploy e da verificação pública.

## URLs e contato para a listagem

- Página do produto: `https://honormed.emersongsguimaraes.workers.dev/` (a página inicial apresenta o controle pessoal do HonorMed; a nova hero desta branch ainda não foi publicada).
- Política de privacidade: `https://honormed.emersongsguimaraes.workers.dev/privacidade` (**aguardando deploy e teste HTTP**).
- Suporte: `https://honormed.emersongsguimaraes.workers.dev/suporte` (**aguardando deploy e teste HTTP**).
- E-mail de suporte e privacidade autorizado pelo titular: `acesso@cforod.com`.

O responsável identificado pelo titular para a política é **Emerson Gabriel da Silva Guimarães**. Conferir os dados e a política publicados antes da submissão. A página da loja deve declarar, de modo consistente com a política, e-mail/identificador da conta, informações de autenticação e registros financeiros apresentados; a extensão não lê histórico, páginas ou dados de pacientes. Consulte os [campos de privacidade da loja](https://developer.chrome.com/docs/webstore/cws-dashboard-privacy) e a [política de listagem](https://developer.chrome.com/docs/webstore/program-policies/listing-requirements).

## Artes da loja

As [capturas de Consultas e Laudos e a peça promocional](brand/extension/README.md) estão prontas com dados fictícios. As imagens de listagem têm 1280 × 800 px, a peça pequena tem 440 × 280 px e o ícone de 128 px já vem no ZIP. Foram geradas do popup compilado com Auth/API simulados, sem usar a conta do titular. Revisar as imagens no painel da loja após o upload, inclusive a legibilidade reduzida.

## Pacote candidato para envio

Em 18/10/2026, o build de produção gerou `extension/release/HonorMed_Registro_Rapido.zip` (versão `1.0.0`, 95.374 bytes, SHA-256 `BE3C98576FF0F282C53DD04AB6C2594D4134E17EB70646573CEBAF4DD4F146F6`). O pacote usa a origem pública do Supabase HonorMed e abre o site publicado. `typecheck`, testes unitários, seis testes E2E com Auth/API simulados e `check:artifacts` passaram. O ZIP é ignorado pelo Git; este hash identifica o candidato local e deve ser conferido de novo antes do upload. Não enviar o ZIP de teste gerado por `test:e2e`.

## Configuração proposta no painel

- **Conta:** o titular cria a conta de desenvolvedor, conclui o pagamento e a verificação em duas etapas, confirma o e-mail de contato e declara sua condição de comerciante ou não comerciante. A classificação é uma decisão do titular; a loja exige a declaração e pode exibir dados verificados do comerciante. Ver [registro de desenvolvedor](https://developer.chrome.com/docs/webstore/register/) e [FAQ de comerciante](https://developer.chrome.com/docs/webstore/program-policies/trader-verification-faq).
- **Store listing:** categoria Produtividade, idioma português (Brasil), textos abaixo, duas capturas e peça promocional em `docs/brand/extension/`.
- **Privacy:** finalidade única, justificativa de `storage` e da origem Supabase, dados de autenticação e produção declarados conforme abaixo, certificações do painel e URL da política revisada e publicada.
- **Distribution:** **Não listada** para o piloto; qualquer pessoa que receber o link poderá instalar. As mesmas políticas e revisão valem para essa visibilidade. Ver [distribuição](https://developer.chrome.com/docs/webstore/cws-dashboard-distribution).
- **Revisão:** depois do upload e do preenchimento, conferir cada campo e escolher publicação manual após aprovação, para que o link possa ser testado antes de divulgá-lo aos médicos.

## Textos propostos

**Nome:** HonorMed · Registro rápido

**Descrição curta:** Registre Consultas e Laudos por quantidade no seu controle pessoal HonorMed.

**Descrição:** Registre a produção pessoal no computador do consultório em poucos passos. Entre com sua conta HonorMed, escolha o módulo permitido pelo seu perfil, informe data, local, convênio ou tipo de exame e quantidade. O valor previsto, quando disponível, é calculado no HonorMed. Você pode repetir os campos do último registro após confirmação e desfazer o lançamento recém-criado. Os registros são **informados por você** e não representam confirmação do hospital. Não informe dados de pacientes.

Para funcionar, a extensão envia e-mail e senha ao Supabase Auth e os registros que você confirmar ao banco HonorMed. Ela guarda tokens de sessão, o prazo de inatividade e os dados mínimos do último registro no armazenamento do navegador. Não lê páginas visitadas, histórico, abas ou dados de pacientes. Consulte a [política de privacidade](https://honormed.emersongsguimaraes.workers.dev/privacidade) antes de instalar; **só usar esse link na loja depois de verificar a publicação**.

**Finalidade única para declaração de privacidade:** permitir ao médico autenticado registrar e corrigir sua própria produção pessoal por quantidade no HonorMed.

**Permissões:** `storage` guarda a sessão autenticada, o prazo de inatividade e os identificadores mínimos usados em “Repetir último”. A permissão de host é limitada à origem HTTPS do Supabase HonorMed para autenticação e dados do próprio médico sob RLS. A extensão não lê páginas, abas, histórico, cookies ou conteúdo clínico.

**Dados e uso a declarar:** e-mail e senha são enviados ao Supabase Auth para login; access/refresh tokens, `user.id`, horário da última interação e os IDs/quantidade do último registro ficam no armazenamento da extensão. Data, quantidade e IDs de local/convênio/tipo são enviados ao Supabase para o controle pessoal. Nenhum nome, CPF, imagem ou texto de paciente é solicitado. Não há anúncios nem venda de dados. A opção “Manter conectado neste computador” usa armazenamento local por até 12 h sem uso; o padrão usa armazenamento de sessão por até 30 min sem uso ou até fechar o navegador.

## Materiais e decisões pendentes

- Publicar e verificar `/privacidade` e `/suporte`; revisar os textos jurídicos e as declarações de dados/permissões com o [programa da Chrome Web Store](https://developer.chrome.com/docs/webstore/program-policies) e o [fluxo de publicação](https://developer.chrome.com/docs/webstore/publish/). Termos de uso e procedimento operacional de exclusão/retenção ainda não estão definidos para o piloto comercial.
- Confirmar em qual navegador físico ocorreu o teste informado pelo titular e completar o outro (Chrome/Cent Browser), se for alvo da distribuição. Conferir política de TI e comportamento de fechamento/expiração no pacote final.
- Domínio próprio, backup/restauração, contratação/cobrança e PWA em dispositivo físico permanecem pendentes conforme `docs/LANCAMENTO.md`; não anunciar esses recursos como prontos.
- Decidir distribuição, suporte e instruções de teste para revisão da loja. A chave anon pública e o host de produção só entram no pacote final após revisão operacional. Nenhum ZIP foi enviado à loja.
