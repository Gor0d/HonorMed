# HonorMed · Registro rápido (extensão)

Extensão Manifest V3 para Chrome e navegadores Chromium. O popup registra a quantidade de Consultas ou Laudos no controle pessoal do médico, usando a conta HonorMed e as políticas RLS do Supabase. Não há dados de paciente, integração hospitalar, cobrança ou uso offline.

## Preparar o pacote

Em PowerShell, dentro de `extension/`:

```powershell
npm.cmd ci
$env:HONORMED_SUPABASE_URL = 'https://<projeto>.supabase.co'
$env:HONORMED_SUPABASE_ANON_KEY = '<chave anon publica>'
$env:HONORMED_APP_URL = 'https://<origem do app>'
npm.cmd run typecheck
npm.cmd test
npm.cmd run build
```

Use apenas as **origens HTTPS**, sem caminhos. A chave anon é pública; não use service role, senha, token SMTP ou outro segredo. O build gera `dist/` e `release/HonorMed_Registro_Rapido.zip`, verifica permissões, conteúdo do ZIP e credenciais conhecidas. Ambos são ignorados pelo Git. `npm.cmd run test:e2e` sempre reconstrói `dist/` com valores fictícios; depois dele, gere novamente o pacote de uso com as variáveis públicas pretendidas. Nunca distribua o ZIP de teste.

## Instalação descompactada para validação

1. Gere o pacote com as origens públicas pretendidas e execute `npm.cmd run check:artifacts`.
2. Abra `chrome://extensions` no Chrome ou a página de extensões equivalente no Cent Browser, ative o modo de desenvolvedor e escolha **Carregar sem compactação** apontando para `extension/dist`.
3. Confira o nome HonorMed, o ícone e as permissões: somente `storage` e a origem Supabase configurada. O app é aberto em uma aba, sem permissão de leitura de páginas.
4. Abra o popup pelo ícone ou por **Alt+Shift+R**. O atalho pode ser alterado em `chrome://extensions/shortcuts`.
5. Entre com uma conta de teste autorizada. Escolha “Manter conectado neste computador” somente em máquina de uso exclusivo. Confira o módulo permitido pelo perfil, registre uma Consulta e um Laudo de teste quando disponíveis, compare os resultados no app e desfaça ambos. Saia pelo popup.
6. Verifique o encerramento ao fechar o navegador sem “Manter conectado” e os limites de 30 min/12 h sem uso. Repita no Cent Browser no computador do consultório, sujeito à política de TI local.

O login e o registro reais dependem de cadastro/recuperação por e-mail e das pendências do piloto descritas em `docs/LANCAMENTO.md`. Não carregue seed fictício no Supabase de produção. A instalação local, o uso real e a publicação na loja não foram executados por este repositório.

## Verificação automatizada

`npm.cmd run typecheck`, `npm.cmd test` e `npm.cmd run test:e2e` usam apenas dados fictícios. O último comando roda fluxos com Supabase simulado e também carrega o pacote de teste como **extensão descompactada real** no Chromium headless. O smoke confirma login, registro de Consulta, `chrome.storage.session` e logout com `scope=local`. O job `extension` em `.github/workflows/verify.yml` executa os mesmos passos no CI. Nenhum teste contata o Supabase de produção.
