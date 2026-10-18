---
name: honormed-publicacao
description: Preparar e verificar releases do HonorMed no Cloudflare Workers com Supabase, seguindo os scripts e cuidados específicos do projeto. Usar quando o usuário pedir publicação ou revisão de prontidão operacional.
---

# Publicação HonorMed

Leia [AGENTS.md](../../../AGENTS.md), [PLANO.md](../../../docs/PLANO.md), [LANCAMENTO.md](../../../docs/LANCAMENTO.md) e [VALIDACAO.md](../../../docs/VALIDACAO.md). Confira estado atual e destino, pois IDs de versão históricos não comprovam qual release está no ar hoje. A publicação do frontend não requer Oracle nem reset de banco.

Antes de qualquer publicação autorizada, revise o diff e os checks pertinentes. O repositório é `Gor0d/HonorMed`; o destino vigente está em LANCAMENTO.md. Uma skill ou README não autoriza alterar DNS, cobrar planos, pausar serviços de outro produto ou implantar um projeto diferente. Não repita perguntas de autorização se a tarefa atual já autoriza a ação.

Cuidados específicos que mudam a execução:

- OpenNext serializa variáveis do ambiente em `cloudflare/next-env.mjs`. Somente URL/chave pública Supabase e configuração não secreta podem estar no ambiente de build. SMTP, senha de banco, tokens Vercel e service role ficam fora de `/web`. Credenciais não entram no Git nem na saída de ferramentas.
- `npm run test:e2e` prepara build e servidor demonstrativos isolados. Não trocar esse isolamento por testes automáticos contra a produção. Depois dos E2E, reconstrua com a configuração do destino antes de publicar.
- `npm.cmd run deploy:cloudflare` em `/web` reconstrói, verifica artefatos e publica. O verificador cobre credenciais locais conhecidas, não todos os segredos possíveis. Se reprovar o pacote, não contornar a verificação; retirar o segredo do ambiente e reconstruir.
- Sem R2/cache incremental remoto, o script usa Wrangler diretamente com OPEN_NEXT_DEPLOY, evitando Miniflare local que falhou neste Windows. Se adicionar cache remoto/ISR, revisar essa etapa; não assumir que a mesma exceção continua correta.
- Backend de produção exige Supabase HTTPS; a demo recebe stub e deve retornar 403. Não habilitar PGlite/seed para contornar erro de autenticação real.
- Para a extensão Chromium, confira `extension/README.md`: build com URL Supabase, chave anon e URL do app, verificador de artefatos e instalação descompactada de uma cópia fora do repositório. `test:e2e` gera `dist/` fictício; reconstruir o pacote de uso depois. Não publicar na loja sem pedido específico.

Após publicar, conferir a URL real em celular/desktop, login vazio, recursos PWA e demo bloqueada. Não fazer lançamentos financeiros nem criar contas de terceiros para uma checagem visual. Testes remotos com fixtures exigem escopo autorizado, identificação exclusiva e cleanup verificado. Relate separadamente build, CI, publicação e testes realizados; não chamar SMTP de homologado apenas porque sua configuração foi aceita.

Registre versão/resultado em LANCAMENTO.md e VALIDACAO.md sem segredos. Rollback do frontend não reverte migrations; preservar compatibilidade e backups. Definição de contratação, privacidade, suporte e restauração testada continua parte da prontidão comercial, não efeito automático do deploy.
