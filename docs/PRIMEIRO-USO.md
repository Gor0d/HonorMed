# Primeiro uso guiado — B2

Checklist derivado dos dados sob RLS, sem tabela ou flag extra: perfil → local → convênio/Particular ou tipo de exame → honorário opcional → primeiro registro. Cada módulo tem seu progresso; registrar uma Consulta não encerra o checklist de Laudos. Após o primeiro registro do módulo, o checklist deixa de ocupar a tela. Não é necessário preço conhecido para registrar.

Um atalho Registrar permanece na barra superior, inclusive em Ajustes, com o módulo ativo na URL. Configurar meu início abre Ajustes; Fazer primeiro registro abre a rota enxuta existente. A experiência continua sem paciente e sem dependência de sistema hospitalar.

Meta de produto: primeiro registro em menos de dois minutos. Os testes verificam o fluxo e o atalho, não comprovam esse tempo com usuários reais; medir em sessão assistida. Não há migration nova porque progresso é derivado dos registros existentes; fórmulas e RLS não foram alterados. Testes Vitest cobrem a decisão por módulo, e Playwright cobre 390px/1280px sem seed, com catálogo vazio interceptado. Execução SQL da base é coberta também pelos testes B1 do conjunto B.

PR encadeado sobre B1 para reutilizar a infraestrutura de testes sem seed. Nenhum deploy ou operação no Supabase remoto.
