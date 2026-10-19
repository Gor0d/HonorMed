# Backup e teste de restauração

Status: procedimento preparado; backup remoto e restauração **não executados**. A disponibilidade de backups/PITR e sua retenção dependem do plano e da configuração efetivos, a conferir pelo titular antes de ampliar o piloto.

## Preparação e cópia

1. Autorizar a leitura do projeto de origem e provisionamento de destino isolado. Identificar ref, região, versão PostgreSQL, migrations aplicadas, responsável e custo. Nunca usar produção como destino de ensaio. Não executar `db reset` nem carregar seed.
2. Inventariar separadamente: dados e schema da aplicação; identidades/Auth e dependências; configurações Auth/SMTP/redirects; extensões, roles/grants e funções; eventuais objetos de Storage. Dump de banco não equivale a backup de arquivos nem das configurações/segredos do serviço. Hoje o produto não armazena arquivos de pacientes.
3. Escolher o método suportado pelo Supabase para o plano vigente (backup gerenciado/PITR ou export lógico autorizado), confirmar seu escopo e preparar comandos em canal privado. Não inferir que `db dump` exporta schemas gerenciados, roles ou Auth completos por padrão. Não tentar substituir serviços gerenciados manualmente sem procedimento suportado.
4. Armazenar cópia cifrada fora do checkout/Git, com acesso mínimo, identificação do ponto de recuperação e verificação de integridade. Separar a gestão da chave de cifragem. Não enviar dumps por chat/e-mail nem imprimir dados em logs. Registrar somente resultado e referência restrita da cópia.
5. Definir política de frequência, retenção, responsáveis, descarte verificável e alerta de falha. Esses prazos ainda não foram aprovados; não anunciar retenção ou recuperação garantidas.

## Ensaio isolado

1. Conferir novamente a ref de destino: diferente da produção, sem domínio público do produto, sem clientes e sem envio de e-mails reais. Desativar rotinas externas e restringir acesso. Uma cópia real continua sensível mesmo em homologação.
2. Restaurar pelo método suportado no destino autorizado. Conferir schema, versões das migrations, constraints, funções, grants e políticas RLS. Não executar seed nem aplicar migrations antigas sobre schema já restaurado. Aplicar somente migrations novas e compatíveis, com revisão prévia.
3. Antes de permitir acesso, reconciliar exclusões realizadas após o ponto do backup. Uma restauração pode ressuscitar contas e dados excluídos. Ainda falta definir um registro restrito de pedidos de exclusão, sua retenção e o processo de reaplicação; até isso estar resolvido, não reabrir acesso de uma restauração real. Não criar um arquivo público com identidades excluídas.
4. Com contas técnicas A/B criadas exclusivamente para o ensaio, verificar que A não lê/escreve dados de B em tabelas, views e RPCs; testar exportação e exclusão da própria conta. Usar produção financeira fictícia mínima, sem paciente. Conferir cálculo SQL de Consultas e Laudos, sem somar módulos/importados, e eliminar as contas técnicas ao final.
5. Homologar login, recuperação sem disparo para terceiros, sessão, registro e dashboard em 390px/1280px, além da extensão se entrar no escopo. Auth exige teste real: a fixture PGlite não reproduz todo o schema gerenciado.
6. Medir duração e ponto de recuperação, registrar falhas, aprovar resultado e descartar a cópia de ensaio de forma controlada. Atualizar o registro em [README](README.md). Não trocar o app para esse banco como consequência automática do teste.

## Recuperação real

Exige decisão explícita do responsável, avaliação do ponto de recuperação, reconciliação de exclusões e comunicação do impacto. Suspender escritas enquanto for necessário para evitar divergências. Validar antes de reabrir acesso. Retorno do frontend não reverte migrations nem recupera registros perdidos; preservar evidências e evitar restaurações repetidas sobre a única cópia íntegra.

Exportação individual JSON/CSV é portabilidade, não substitui backup restaurável de Auth/schema. Ver [retenção da conta](../CONTA-E-DADOS.md).
