# Exportação e exclusão da própria conta — B1

Implementação local em `feat/b1-account-data`; não publicada nem aplicada ao Supabase hospedado.

## Uso e alcance

Em Ajustes de Consultas e de Laudos, o titular encontra **Seus dados e sua conta**. JSON exporta um snapshot das 14 tabelas base de aplicação filtradas por `auth.uid()`: perfil, locais, convênios, regras, produção pessoal/importada, recebimentos, honorários, metas, preferências, tipos/tarifas/produção/recebimentos de laudos e histórico de sincronização. B4 acrescenta as duas tabelas de consentimento/contadores do piloto ao export (16 tabelas no conjunto atual). Nenhum parâmetro permite escolher outro médico. Exportações não incluem senhas, tokens, sessões Auth, credenciais de fornecedores ou dados de outros titulares. Views calculadas não são duplicadas: a exportação preserva as tabelas fonte.

CSV usa UTF-8 com BOM, separador ponto e vírgula e colunas tabela/registro/campo/valor, uma linha por campo. Aspas e quebras são escapadas; textos interpretáveis como fórmulas são prefixados por apóstrofo. JSON é a opção para preservar tipos e estrutura sem essa adaptação de planilha. Os arquivos são baixados no dispositivo, não enviados ao suporte nem armazenados num bucket. O médico é responsável pelas cópias que baixar.

## Exclusão

É necessário digitar **EXCLUIR MINHA CONTA**, marcar ciência da irreversibilidade e confirmar. Cancelar ou receber erro do servidor não limpa a sessão nem apresenta sucesso. O RPC não recebe medico_id: deriva o titular da sessão. Remove dependências financeiras, perfil e identidade Auth na mesma transação. Uma falha impede a operação inteira, sem exclusão parcial. O fluxo também atende identidade autenticada ainda sem perfil de aplicação.

A função de exportação é security invoker, respeita RLS e filtro explícito por titular. A exclusão é security definer somente para remover a própria identidade no schema Auth, com search_path vazio, referências qualificadas, verificação de identidade existente e confirmação no SQL. Execução pública é revogada; somente authenticated recebe acesso. Não há service role no cliente. Locks e FKs preservam integridade; um token da identidade removida não consegue recriar perfil ligado a um usuário inexistente.

Após sucesso, o app encerra a sessão e navega para a entrada. A remoção do usuário Auth deve invalidar suas sessões conforme o serviço hospedado; o ciclo real de revogação/expiração em outros dispositivos e extensão ainda exige homologação específica. Não há promessa de revogação instantânea de um JWT já emitido: RLS/FKs impedem acesso aos registros removidos e sua recriação pela mesma identidade.

## Retenção

Não mantemos cópia ou trilha financeira adicional por causa da exclusão. Os dados ativos são removidos na transação; exportações já baixadas e cópias de navegador em outros dispositivos não são apagadas remotamente. Backups, logs de infraestrutura e mensagens já entregues pelos fornecedores seguem retenção operacional própria. O piloto ainda precisa definir/documentar prazos e testar restauração; não há promessa de expurgo imediato ou de prazo já configurado nesses fornecedores. Uma restauração futura deve tratar contas excluídas antes de reabrir acesso; não restaurar backups diretamente sobre produção como teste.

A política de privacidade continua rascunho e precisa da revisão do responsável. A migration aditiva `202610190001_account_data.sql` ainda não foi aplicada remotamente. A UI só funcionará contra Supabase depois dessa etapa, a ser autorizada fora desta tarefa.

## Verificação local sem seed

- `npm.cmd test -- tests/b1-account.test.ts`: 5 testes aprovados com migrations em memória, fixtures mínimas A/B, todas as tabelas no export, isolamento, permissões de RPC, confirmação, exclusão completa, rollback por FK, preservação do outro titular e proteção de CSV.
- `npm.cmd run test:e2e -- b1-account.spec.ts`: 2 cenários aprovados (390px/1280px), build e servidor isolados; GET/RPC interceptados e executados em PGlite com auth.uid do teste. Não lê `supabase/seed.sql`, não cria usuário remoto, não lê/edita credenciais. Testa downloads, erro de export, disponibilidade nos dois módulos, confirmação obrigatória, cancelamento, falha, sucesso e saída.

Nas branches `feat/b*`, a CI usa somente testes `tests/b*` e E2E `b[1-6]-`, sem executar a suíte demonstrativa legada que carrega seed. Os testes da extensão permanecem fora desta tarefa. Não há migration ou deploy automático no workflow.

Esses testes não equivalem a homologar Supabase Auth hospedado, e-mail, restauração de backup ou concorrência de serviços reais. Nenhuma fórmula financeira foi alterada; os testes também conferem os saldos SQL antes da exclusão.
