# Troca para domínio próprio

Status: não houve compra de domínio, mudança de DNS, configuração Auth ou deploy nesta entrega.

1. Titular confirma domínio e origens exatas do app, acesso à zona DNS e janela autorizada. Conferir serviços existentes, MX/TXT do e-mail e registros atuais. Registrar plano de retorno sem copiar segredos. Não assumir que registrar domínio muda a hospedagem.
2. Preparar o domínio no Cloudflare Workers pelo fluxo suportado, preservando os demais serviços. Conferir DNS, certificado TLS e redirecionamento HTTPS; não apagar a zona nem substituir registros de e-mail do remetente. Validar primeiro a nova origem sem forçar a troca dos usuários.
3. No Supabase, preparar **Site URL** com a nova origem e allowlist com os caminhos exatos usados no código (cadastro/retorno e recuperação). Conferir `deploy/production/supabase/config.toml` e as rotas em `web/src/app`; não adicionar curingas amplos. Manter a origem anterior somente na janela necessária, documentada.
4. Rever links dos modelos de e-mail, marca, suporte, privacidade e termos. Confirmar domínio/remetente verificados no Resend e autenticação DNS do envio. Domínio do site e do remetente podem ser diferentes; trocar um não exige mudar o outro. Nenhum segredo SMTP entra no ambiente de build web.
5. Rever origens/links codificados no app, manifest/PWA, recuperação e configurações públicas. Gerar build de produção isolado dos testes, verificar artefatos e publicar somente com autorização. Não distribuir a extensão de teste: reconstruir com `HONORMED_APP_URL` apontando para a nova origem e as variáveis públicas Supabase. Rever `host_permissions` se a origem Supabase também mudar.
6. Testar em 390px/1280px: login, confirmação, recuperação, retorno correto ao app, ausência de redirecionamento para hosts inesperados, PWA instalado e abertura do app pela extensão. Usar conta técnica autorizada, sem dados de terceiros. Conferir `/api/demo` bloqueado, TLS e headers. Uma sessão/PWA na origem anterior pode exigir novo login/instalação; comunicar isso.
7. Registrar versão, origens e evidências. Após a janela de compatibilidade, retirar redirects antigos e decidir o redirecionamento do endereço anterior. Não invalidar links ainda enviados sem avaliar a expiração.

Retorno: restaurar a origem e configuração Auth anteriores aprovadas, ajustar links futuros e conferir fluxos novamente. DNS/TLS podem exigir tempo de propagação. Mudanças de banco são independentes do retorno de domínio; não executar reset ou restauração de dados para desfazer DNS.
