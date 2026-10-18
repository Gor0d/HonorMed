# Registro rápido no computador do consultório — especificação

Status: **Etapas 1 e 2 implementadas na branch, sem deploy** (17/10/2026). A Etapa 0 foi aprovada e a D1 incorporada. A extensão tem apenas estrutura, login, sessão e links; **ainda não registra produção**. Nenhuma migration ou publicação foi criada. A Etapa 2 para para revisão antes das escritas da Etapa 3.

Verificação da Etapa 1: `npm test` passou com 27 testes SQL/RLS; `npm run build` passou; `npm run test:e2e` passou com 20 fluxos (12 anteriores e 8 novos, em 390 × 844 e 1280 × 900). A rota usa a demo isolada ou a sessão Supabase do app, o manifesto oferece dois atalhos com ícones da marca e o service worker continua sem cache financeiro. Testes de navegador desta etapa usaram apenas dados fictícios/PGlite; não houve acesso ao Supabase real.

Verificação da Etapa 2: `extension/` contém o popup Manifest V3, adaptador de sessão para `chrome.storage`, build e verificador do pacote. O build com URLs e chave anon **fictícias** produz `dist/` e `release/HonorMed_Registro_Rapido.zip`; os dois diretórios são ignorados pelo Git. `npm.cmd run typecheck` e o build/verificador passaram; o build sem as três variáveis falha. O pacote ainda precisa de teste manual em Chrome/Cent Browser e de testes automatizados de login/expiração na Etapa 3.

Para reproduzir o build em PowerShell, dentro de `extension/`, use `npm.cmd ci`, defina `HONORMED_SUPABASE_URL`, `HONORMED_SUPABASE_ANON_KEY` (chave pública anon, **nunca** service role) e `HONORMED_APP_URL` como variáveis de ambiente, e execute `npm.cmd run typecheck` e `npm.cmd run build`. As URLs devem ser origens HTTPS, sem caminho. O build gera apenas artefatos locais e verifica manifesto, ZIP e credenciais conhecidas. Para abrir o popup pelo teclado, o atalho sugerido é **Alt+Shift+R**; o usuário pode alterá-lo em `chrome://extensions/shortcuts`.

## Objetivo e limites

Permitir que o médico registre, em poucos segundos, a quantidade produzida no computador do consultório (Chrome e Cent Browser), com a mesma conta HonorMed. Haverá dois pontos de entrada: `/registrar`, uma rota enxuta da PWA, e um popup Manifest V3 com login próprio. Os dois usam as interfaces existentes do Supabase sob a sessão do médico e o RLS atual. O modo demo da rota usa PGlite; a extensão exige Supabase configurado.

O registro é **Informado por você**, nunca confirmação do hospital. Consultas e Laudos continuam separados; `/importados` não entra no fluxo. Não há recebimentos, saldos, totais, cadastro de locais/convênios/tipos ou cálculo financeiro no popup. Nenhum campo de nome, iniciais, CPF, código de atendimento, imagem, DICOM ou texto clínico de paciente.

Não se prevê migration. Se o contrato existente se mostrar insuficiente, parar antes de alterá-lo: migration somente aditiva, com RLS, teste PGlite, justificativa no commit e revisão antes da próxima etapa.

## Fluxos

### Entrada e escolha do módulo

- **Rota `/registrar`:** usa a autenticação já usada em `/` e `fetchData`/`mutate` de `web/src/lib/data.ts`; não cria outro cliente Supabase. Sem sessão real, mostra o login existente ou leva a ele. No modo demo, a entrada usa o mesmo seed fictício da aplicação. Sem perfil escolhido no primeiro acesso, encaminha ao fluxo existente de escolha de perfil; não presume Consultas para um novo radiologista.
- **Popup:** login com e-mail e senha via Supabase Auth usando chave anon pública. “Criar conta” abre o app; “Esqueci a senha” abre `/recuperar-senha`. Perfil `preferencias_produto.perfil_uso` determina o módulo visível: `consultas`, `laudos` ou abas para `ambos`. Sem preferência, abrir a escolha de perfil no app, sem criar uma preferência oculta.
- O parâmetro `/registrar?modulo=consultas|laudos` e os atalhos da PWA escolhem apenas uma aba **permitida pelo perfil**. Parâmetro desconhecido é ignorado. O perfil é preferência de experiência, não substitui RLS nem autorização clínica.

### Registrar Consultas

Data **local** de hoje por padrão; local, convênio e quantidade inteira de 1 a 1.000. Extrair `today()` dos controles existentes para `web/src/lib/` e reutilizar em `/registrar`; não usar `toISOString().slice(0,10)`, que pode adiantar a data em Brasília à noite. O médico pode ajustar com `+`/`−` ou digitar. Ao salvar, inserir em `producoes_pessoais` com `medico_id` da sessão e `origem` determinada pelo trigger como `informado_medico`. Honorário ausente não impede o registro. Buscar a linha calculada por `id` e mostrar apenas “Consultas registradas: N · Valor previsto: R$ …” ou “Valor pendente”, sempre com a ressalva “Informado por você”.

### Registrar Laudos

Data local de hoje por padrão; instituição (local), tipo de exame e quantidade inteira de 1 a 10.000. Inserir em `laudos_producao` com `medico_id` da sessão. Buscar `laudos_calculados` pelo `id` e exibir quantidade e valor retornado pelo SQL, ou “Valor pendente”. Sem texto de laudo, imagens ou identificação de paciente. Consultas e Laudos não se compensam.

### Repetir último e desfazer

“Repetir último” **preenche** módulo, local, convênio/tipo e quantidade do último lançamento bem-sucedido do usuário; usa a data selecionada (hoje por padrão). Antes de gravar, exige confirmação explícita com os campos visíveis. Nunca salva só por clicar em “Repetir último”. Na rota, pode recuperar a última produção do dataset autenticado; no popup, usa apenas a chave local de metadados do usuário. Se o perfil atual não permite o módulo ou alguma opção foi removida, orientar a selecionar outra, sem gravar.

Após salvar, tanto `/registrar` quanto o popup oferecem “Desfazer lançamento” somente para o `id` recém-criado, mediante confirmação, como no app atual. Excluir da mesma interface de escrita. O `id` de desfazer fica em memória enquanto a tela está aberta; não é persistido como histórico financeiro.

### Sair e expirar

Botão **Sair** sempre visível no popup autenticado. `signOut` revoga a sessão no Supabase quando houver rede e limpa todas as chaves da extensão para aquele usuário, em `chrome.storage.session` e `chrome.storage.local`, inclusive “repetir último”. Mesmo se a rede falhar, o acesso local é bloqueado e o storage é limpo; a falha de revogação remota é informada. A rota usa a saída já existente no app.

**D1 — sessão por turno de trabalho:** padrão desmarcado em `chrome.storage.session`, encerrado ao fechar o navegador **ou após 30 min sem uso** (`INACTIVITY_SESSION_MS = 30 * 60 * 1000`). Com “Manter conectado neste computador”, a sessão fica em `chrome.storage.local`, sobrevive ao fechamento e expira após **12 h sem uso** (`INACTIVITY_REMEMBER_MS = 12 * 60 * 60 * 1000`). São duas constantes únicas e nomeadas. Interações reais no popup atualizam `lastActivity`; refresh de token e leituras automáticas não renovam o prazo. Com o popup aberto, um temporizador encerra a sessão no prazo.

Na abertura do popup, verificar o prazo **sincronamente antes de criar o cliente Supabase com a sessão guardada, renderizar opções ou permitir escrita**. Se venceu, limpar primeiro o storage e bloquear a UI; tentar `signOut` em seguida, de forma best effort, sem restaurar o acesso se a rede falhar. Sem permissão `alarms` e com o popup fechado, não há revogação cronometrada confiável no servidor. O refresh token pode continuar válido no servidor até ser usado ou expirar conforme a configuração de sessões do Supabase. Configurar limites de sessão no Supabase poderia mitigar isso no futuro, mas afetaria também o app web; **não alterar configuração remota nesta feature**. O limite lógico é aplicado ao próximo acesso ao popup.

## Telas em texto

**`/registrar` (desktop primeiro; útil em 390 px):** logo HonorMed · módulo (abas só em “Ambos”) · data · local/instituição · convênio ou tipo de exame · quantidade `[−] [n] [+]` · **Salvar** · **Repetir último** · confirmação após salvar · “Abrir HonorMed” · link “Configurar em Ajustes” quando faltar catálogo. Foco inicial na quantidade; `Enter` salva se válido; `Esc` limpa o formulário. Deve preservar acessibilidade, contraste e marca em `brand.ts`/componentes existentes.

**Popup, desconectado:** logo · e-mail · senha · opção desmarcada “Manter conectado neste computador”, acompanhada de “Use apenas em computador de uso exclusivo seu. Sai após 12 h sem uso.” · **Entrar** · “Esqueci a senha” · “Criar conta”.

**Popup, conectado:** módulo permitido · data · local/instituição · convênio/tipo · quantidade · **Salvar** · **Repetir último** · confirmação do último registro e “Desfazer” · **Abrir HonorMed** · **Sair** sempre visível. Sem totais, saldos ou recebimentos. Em erro de rede, formulário permanece preenchido e não há fila offline.

## Permissões, build e sessão da extensão

Manifest V3: `permissions: ["storage"]`; `host_permissions` contém **somente a origem HTTPS do Supabase configurado no build**. `storage` guarda sessão, prazo de inatividade e metadados mínimos para repetir; a origem Supabase permite Auth e PostgREST sob RLS. A URL do app é aberta por `chrome.tabs.create` e não requer permissão `tabs` nem host permission própria. Sem content scripts, leitura de abas/páginas ou permissões `<all_urls>`, `tabs`, `cookies`, `history`, `scripting`, `webRequest`, `alarms`. `commands._execute_action` abre o popup com um atalho documentado, editável em `chrome://extensions/shortcuts`.

O build exige `HONORMED_SUPABASE_URL`, `HONORMED_SUPABASE_ANON_KEY` e `HONORMED_APP_URL`; valida formato HTTPS/origens e gera o host exato. Apenas URL e chave **anon pública** do Supabase e URL do app entram no pacote. O verificador de artefatos reprova `.env`, service role, credenciais conhecidas e permissões fora da lista. `extension/dist` e `extension/release` (zip) são ignorados pelo Git. Nada é publicado nesta feature.

Supabase JS terá `detectSessionInUrl: false` e adaptador de storage da extensão. Padrão: `chrome.storage.session`, apagado ao fechar o navegador ou após 30 min sem uso. A opção explícita “Manter conectado neste computador”, desmarcada, usa `chrome.storage.local` e 12 h sem uso. Ao mudar a opção, selecionar um único storage ativo e apagar a cópia antiga antes de permitir novo uso; não manter refresh token em dois storages. Chaves de sessão e de “repetir último” são associadas ao `user.id`; não usar e-mail como identificador de chave. “Repetir último” guarda **somente** módulo, `local_id`, `convenio_id` ou `tipo_id`, e quantidade; `lastActivity` guarda apenas o horário da última interação. Nunca persistir valores financeiros, saldos ou dados de paciente. Ao trocar de médico **no mesmo perfil do navegador**, limpar as chaves do anterior, inclusive preferência de storage, antes de mostrar dados de B.

## Contrato de dados existente

Fonte conferida nas migrations `202610160003_unificar_producao.sql`, `202610160004_laudos.sql` e em `web/src/lib/data.ts`. Todas as leituras/escritas autenticadas usam a chave anon e a sessão do médico; `medico_id` deve ser igual a `auth.uid()`. Views usam `security_invoker`; tabelas base têm RLS e referências compostas. A extensão não usa service role nem calcula honorários.

| Operação | Interface e colunas necessárias |
|---|---|
| Perfil | `preferencias_produto`: ler `id`, `medico_id`, `perfil_uso` (`consultas`, `laudos`, `ambos`). |
| Opções | `locais_atendimento`: `id`, `nome`; `convenios`: `id`, `nome`; `laudos_tipos`: `id`, `nome`. Exibir apenas linhas do usuário. |
| Inserir Consulta | `producoes_pessoais`: enviar `medico_id`, `local_id`, `convenio_id`, `data_producao`, `quantidade`; não enviar `valor_unitario`, `origem`, `status`, `cd_atendimento` ou dados clínicos. O trigger `escrever_producao_pessoal` cria o registro em `atendimentos` com `origem='informado_medico'`. Obter o `id` criado. |
| Resultado Consulta | `producao_pessoal_calculada`: consultar por `id` e ler `id`, `quantidade`, `valor_previsto`, `fonte` (e `medico_id` para conferir a sessão). `NULL` significa valor pendente. |
| Inserir Laudo | `laudos_producao`: enviar `medico_id`, `local_id`, `tipo_id`, `data_producao`, `quantidade`; não enviar `valor_unitario` nem conteúdo clínico. Obter o `id` criado. |
| Resultado Laudo | `laudos_calculados`: consultar por `id` e ler `id`, `quantidade`, `valor_previsto`, `fonte` (e `medico_id`). `NULL` significa valor pendente. |
| Desfazer | `DELETE` por `id` na mesma view/tabela de inserção, restrito à sessão e somente ao recém-criado. |

O SQL preenche o honorário/tarifa conhecida e calcula `valor_previsto`. A aplicação formata o número retornado em `pt-BR`, sem fórmula paralela. Quantidade sem tarifa continua registrada. A preferência de módulo controla a UI, mas não é uma política de autorização no banco; o RLS isola o **médico**, não restringe o módulo. Testes devem confirmar que a UI não oferece o módulo oculto e que o RLS não permite acesso entre médicos.

## Erros e respostas ao médico

- Sessão ausente/expirada: “Sua sessão terminou. Entre novamente.”; não tentar salvar.
- Rede indisponível: “Sem conexão. O registro não foi enviado; confira a rede e tente novamente.”; preservar o formulário, sem fila.
- Local/convênio/tipo ausente: “Cadastre em Ajustes no HonorMed antes de registrar aqui.” com link para o app.
- Quantidade/data inválida: explicar o limite (Consultas 1–1.000; Laudos 1–10.000) ou pedir data válida, sem enviar.
- Referência removida ou pertencente a outro médico: “Esta opção não está mais disponível. Atualize a lista e selecione outra.”; não preencher automaticamente com outra opção.
- Falha do banco: mensagem curta em pt-BR, sem despejar SQL, chave, token ou payload sensível. Não mostrar sucesso antes de confirmar a gravação e a leitura do resultado.
- Falha ao buscar o valor após gravar: informar que o registro foi salvo, não repetir o `INSERT` automaticamente; oferecer abrir o app para conferir.
- Falha ao desfazer: preservar a confirmação anterior e informar que não foi possível desfazer; não ocultar o registro.

## Critérios de aceite e plano de testes

1. `/registrar` funciona em demo PGlite e Supabase, 390 × 844 e 1280 × 900; teclado: foco na quantidade, `Enter` salva, `Esc` limpa. Perfil “Somente laudos” não mostra Consultas; “Ambos” mostra abas. Sem catálogos, orienta Ajustes.
2. Consultas com e sem honorário e Laudos são gravados por quantidade nas interfaces acima. “Repetir último” exige confirmação. Valor exibido coincide com a view SQL e `NULL` aparece como pendente. Sem mistura entre módulos.
3. PWA oferece atalhos “Registrar consultas” e “Registrar laudos” com ícones existentes. Service worker não armazena dados financeiros.
4. Extensão instala descompactada em Chromium de teste; manifest possui somente as permissões autorizadas e origem Supabase exata. Login e links funcionam. Build falha sem variáveis públicas e reprova artefatos inseguros.
5. Sessão usa `storage.session` por padrão (30 min sem uso, ou fim do navegador); persistência local só com consentimento (12 h sem uso). Logout limpa chaves do usuário. No mesmo perfil do navegador, A sai e B entra sem ler metadados de A, inclusive “repetir último” e preferência de storage.
6. Unitários: adaptador de storage, expiração e payloads com lista exata de campos. Playwright da extensão intercepta rotas Supabase; cobre login, dois módulos, perfil Somente laudos, falha de rede, logout e expiração, sem Supabase real. Com relógio controlado, 30 min − 1 s e 12 h − 1 s preservam acesso; 30 min + 1 s e 12 h + 1 s bloqueiam e limpam. Respostas automáticas não renovam `lastActivity`.
7. Teste PGlite fixa as colunas usadas de `producoes_pessoais`, `laudos_producao` e views de resultado; falha se o contrato mudar. Cobre precisamente `insert(...).select('id')` na view com trigger `INSTEAD OF`, seguido de leitura por `id` em `producao_pessoal_calculada`. Inclui RLS A/B significativo e confirma origem e valor vindos do SQL. Nenhuma migration remota, seed remoto, deploy ou publicação na loja.
8. Verificações por etapa: rota — `npm test`, `npm run build`, `npm run test:e2e` em `/web`, incluindo fuso `America/Sao_Paulo` às 22:30; extensão — unitários, build, verificador de artefatos e Playwright isolado; CI — job com valores fictícios. Teste manual posterior: Chrome e Cent Browser no computador real, política de TI, e-mail real, fechamento do navegador e expiração.

## Etapas e parada de revisão

Etapa 0 especifica o contrato e **para após o push**. Etapa 1 implementa rota e atalhos. Etapa 2 cria build, manifest, storage e login da extensão e **para antes de escritas**. Etapa 3 adiciona registro e testes. Etapa 4 prepara CI, documentação e rascunho para a loja, sem publicar. Antes de cada etapa, ler `docs/revisao/registro-rapido.md` na branch de revisão e tratar bloqueantes da etapa anterior em commit próprio.
