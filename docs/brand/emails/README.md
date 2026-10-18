# E-mails de acesso HonorMed

Artes prontas para os dois fluxos usados pelo site: confirmação do cadastro e recuperação de senha. Os modelos usam o logo aprovado em `web/public/brand/logo-inverse.png`, cores de `web/src/lib/brand.ts` e CSS inline para clientes de e-mail. O texto permanece legível quando o cliente bloqueia imagens. As prévias PNG usam links fictícios; **não são os e-mails enviados**.

| Fluxo no Supabase Auth | Assunto | HTML | Prévia |
|---|---|---|---|
| Confirm sign up | `HonorMed · confirme seu e-mail` | [confirmacao.html](confirmacao.html) | [390 px](previa-confirmacao-390.png) · [680 px](previa-confirmacao-680.png) |
| Reset password | `HonorMed · redefina sua senha` | [recuperacao.html](recuperacao.html) | [390 px](previa-recuperacao-390.png) · [680 px](previa-recuperacao-680.png) |

A página `/recuperar-senha` também foi alinhada ao visual do login: [prévia 390 px](previa-pagina-recuperacao-390.png), [prévia 1280 px](previa-pagina-recuperacao-1280.png) e versões [escura 390 px](previa-pagina-recuperacao-escuro-390.png) e [escura 1280 px](previa-pagina-recuperacao-escuro-1280.png). As capturas usam Auth/API simulados e nenhum dado real.

A página pública de entrada também tem prévias de [390 px](previa-pagina-publica-390.png), [1280 px](previa-pagina-publica-1280.png), [390 px em tema escuro](previa-pagina-publica-escuro-390.png) e [1280 px em tema escuro](previa-pagina-publica-escuro-1280.png). Elas mostram a hero do controle pessoal, cadastro, recuperação de senha e a chamada da extensão. O download da extensão permanece indisponível até sua publicação na loja. Para regenerar essas quatro prévias, execute `node scripts/preview-public-entry.mjs` em `/web`; o script compila e abre o site apenas com uma URL de Auth simulada e inválida. As capturas registram o estado final das animações. Essas imagens são propostas locais e não indicam publicação da mudança no site.

## Aplicação no projeto hospedado

No projeto Supabase correto, abra **Authentication → Email Templates** e cole o HTML e assunto correspondentes. O projeto hospedado usa o editor de templates do Dashboard; os arquivos deste diretório não são aplicados automaticamente por `config.toml` ou pelo deploy do site. Preserve `{{ .ConfirmationURL }}` no botão e `{{ .SiteURL }}` na imagem: o primeiro mantém o link de confirmação/recuperação do Auth, e o segundo aponta o logo para a origem configurada. A configuração atual de Site URL é `https://honormed.emersongsguimaraes.workers.dev` e o remetente configurado é `HonorMed <acesso@cforod.com>`; confira ambos antes de aplicar. Se mudar o domínio, confirme que `/brand/logo-inverse.png` continua público na nova origem.

Depois de aplicar, faça cadastro e recuperação **com um e-mail seu de teste**, verificando chegada, botão, retorno ao aplicativo e troca de senha. Não use contas de terceiros nem dados de pacientes. Mantenha confirmação de e-mail ativa e não carregue seed no banco publicado. Links de e-mail devem ficar fora de sistemas de rastreamento que os reescrevam.

Referência técnica: [templates do Supabase Auth](https://supabase.com/docs/guides/auth/auth-email-templates) e [configuração para projeto hospedado](https://supabase.com/docs/guides/local-development/customizing-email-templates). Os dois modelos foram preparados no repositório; aplicação no Auth hospedado e envio real ainda dependem de revisão e autorização operacional.
