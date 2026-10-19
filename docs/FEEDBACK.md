# Feedback — B3

App: link Feedback na barra superior leva à página pública Suporte. O formulário aceita apenas categoria predefinida e prepara um e-mail para o contato de suporte, sem anexar conta, sessão, valores, locais, registros ou capturas. Não envia automaticamente nem grava texto num banco. O usuário revisa a mensagem no seu cliente de e-mail; a interface pede que não acrescente dados financeiros, pacientes ou credenciais.

Extensão: botão Feedback e suporte abre somente a URL pública `/suporte` do app configurado no build. Não depende de estar autenticado e não inclui query, fragmento ou dados do catálogo. Não foram adicionadas permissões.

Sem alteração de cálculo, tabelas ou RLS; não se cria migration vazia para um link/formulário sem persistência. Validação: Vitest do conteúdo permitido, Playwright web em 390px/1280px e popup com APIs de navegador simuladas, sem envio real de mensagem. Dependência de cliente de e-mail e atendimento humano continua pendente de validação operacional. Nenhum deploy, credencial ou Supabase remoto nesta tarefa.

O teste da extensão gera `dist/` e `release/` ignorados com configuração fictícia. Esses artefatos não são pacote de uso ou distribuição; a futura release precisa de reconstrução autorizada conforme AGENTS.md, fora desta tarefa.
