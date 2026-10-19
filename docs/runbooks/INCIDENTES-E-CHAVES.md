# Incidentes e rotação de chaves

Status: roteiro preparado, sem acesso a credenciais ou execução de rotação. Uma chave compartilhada fora do canal seguro deve ser tratada como exposta, mesmo que tenha sido removida da mensagem. A substituição operacional do Resend continua pendente do titular.

## Resposta a incidente

1. Registrar horário, serviço afetado, sintoma, versão e responsável pelo atendimento. Acionar o responsável identificado na política de privacidade e o suporte operacional. Não coletar dados de paciente, valores financeiros ou tokens para reproduzir o problema.
2. Classificar indisponibilidade, acesso indevido, vazamento ou perda de dados. Preservar evidências mínimas em local restrito; não publicar dumps/headers de autorização em issues. Anotar ações e horários sem copiar segredos.
3. Definir contenção proporcional e autorizada: suspender a funcionalidade afetada, restringir acesso ou revogar a credencial comprometida. Priorizar contenção quando houver exposição ativa. Não apagar dados nem restaurar banco para esconder a ocorrência. Não pausar projetos de outros produtos.
4. Investigar escopo por identificadores técnicos mínimos, revisar RLS/grants, logs sem conteúdo e mudanças recentes. O responsável deve avaliar obrigações e comunicações aplicáveis com apoio competente; este roteiro não presume um prazo legal nem envia mensagens automaticamente.
5. Corrigir a causa, validar isolamento A/B e cálculo, testar login/registro nas duas larguras e verificar ausência de segredos nos artefatos. Recuperação de dados segue [backup/restauração](BACKUP-RESTAURACAO.md), incluindo exclusões posteriores ao backup.
6. Reabrir acesso com aprovação do responsável, monitorar recorrência e registrar causa, impacto, medidas e pendências. Atualizar os procedimentos sem tornar públicas identidades afetadas. Não declarar resolução apenas porque o frontend voltou a responder.

## Rotação de chaves

Preparar no gerenciador/ambiente seguro, nunca no chat, PR, Git ou build web. Não ler ou imprimir chaves para provar que existem. Identificar consumidores antes de revogar; em comprometimento ativo, contenção pode exigir revogação imediata mesmo com indisponibilidade.

| Classe | Consumidor e cuidado |
|---|---|
| Resend/SMTP | Configuração SMTP hospedada e ambiente operacional restrito. Criar substituta de escopo mínimo, atualizar o consumidor, testar envio autorizado e revogar a anterior. Nunca `web/.env.local`. |
| Token Cloudflare/CLI | Operação de publicação fora do build. Rever escopo/expiração, substituir no canal seguro e revogar o anterior. Não publicar um build para testar a rotação sem autorização de deploy. |
| Senha de banco | Consumidores de conexão autorizados; revisar poolers, automações e sessões. Não colocar connection string no frontend nem nos relatórios. |
| Chave privilegiada Supabase | Nenhuma no web/extensão. Inventariar consumidores; conector futuro continua fora de escopo. Rotacionar pelo procedimento suportado e rever acesso indevido. |
| Chave pública / assinatura JWT | URL e chave pública não substituem RLS. Mudanças de chave/assinatura dependem da modalidade usada pelo projeto e podem afetar sessões do app/extensão. Planejar compatibilidade e reconstrução de clientes quando necessária; nunca substituir por service role. |

Sequência em rotação planejada: inventário → nova credencial → atualização segura dos consumidores → teste mínimo autorizado → revogação anterior → confirmação de falha da credencial antiga pelo mecanismo do fornecedor → registro sem valores. Na suspeita de exposição, não manter a chave comprometida ativa apenas por conveniência. Se o teste falhar, corrigir ou emitir outra chave; não reativar a comprometida como retorno.

Auth e entrega de e-mail precisam de homologação no serviço real e em dispositivo autorizado. Não enviar mensagens para médicos/terceiros como teste. Nenhuma validação local desta entrega comprova revogação de tokens remotos.
