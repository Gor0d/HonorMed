# Procedimentos operacionais — B5

Preparados em 19/10/2026. **Nenhuma operação de infraestrutura foi executada nesta entrega.** Estes procedimentos não concedem autorização para acessar produção, ler segredos, alterar DNS, restaurar banco ou trocar chaves.

- [Backup e restauração](BACKUP-RESTAURACAO.md)
- [Domínio próprio](DOMINIO.md)
- [Incidente e rotação de chaves](INCIDENTES-E-CHAVES.md)

Antes de executar, registrar responsável, autorização, origem/destino exatos, janela, impacto, critérios de sucesso e retorno. Usar versões de CLI compatíveis e consultar a ajuda/documentação do fornecedor antes de preparar os comandos finais. Não copiar comandos históricos com IDs de projetos sem conferir o destino.

Evidências compartilháveis: horário, versão de código/migrations, resultado e identificadores técnicos mínimos. Nunca anexar exports financeiros, dumps, tokens, mensagens de pacientes ou credenciais a issues/PRs. Registros sensíveis ficam em armazenamento restrito, separado do Git. Nenhum procedimento depende de Oracle/MV.

## Registro de ensaio

| Campo | Preencher na execução autorizada |
|---|---|
| Responsável e autorização | Pendente |
| Origem e destino conferidos | Pendente |
| Backup / versão / horário de referência | Pendente |
| Início / fim / perda de dados observada | Pendente |
| RLS, cálculo, Auth, web e extensão | Pendente |
| Resultado / retorno / pendências | Pendente |

RPO (perda máxima aceitável) e RTO (tempo aceitável de recuperação) ainda precisam ser definidos pelo titular e medidos em ensaio. Testes locais não comprovam restauração hospedada, disponibilidade contratada ou capacidade de carga.
