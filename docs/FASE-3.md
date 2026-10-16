# Pendências para Fase 3 — sem implementação ou acesso Oracle nesta entrega

A Fase 0 bloqueia qualquer conector. As Fases 1/2 usam exclusivamente seed fictício por instrução explícita do usuário.

O fluxo principal agora é o controle pessoal independente, com produção por quantidade e recebimentos informados pelo médico. Esse fluxo não depende da Fase 0; só a integração MV continua bloqueada. Antes de conectar dados hospitalares, definir reconciliação explícita com registros pessoais para não duplicar produção. Não converter registro pessoal em confirmação hospitalar automaticamente.

1. Obter autorização do hospital/TI e validar política de dados na nuvem, retenção e perfis de acesso.
2. Habilitar HML e conferir `SYS_CONTEXT` antes de mapear tabelas; nunca escrever no Oracle. Entregar `docs/mapeamento-mv.md` e SELECTs validados. Nenhuma consulta foi executada agora.
3. Mapear prestador, agenda, atendimento, convênio, procedimento, faturamento, glosa e pagamento. Validar vínculo médico/usuário fora da autodeclaração do onboarding.
4. Implementar conector Python somente leitura com service role apenas no servidor, seleção explícita de campos permitidos, upsert idempotente, paginação, retries, checkpoints, observabilidade e `sync_log` sem dados pessoais.
5. Testar duas sincronizações sem duplicar e reconciliar valores/quantidades com a produção hospitalar. Definir chaves estáveis para vários itens/procedimentos por atendimento antes de expandir além de consultas.
6. Definir fechamento/snapshot e trilha de alteração das regras para auditoria histórica, recuperação e política de correções.

## Perguntas ao hospital

- Onde está o valor de repasse no MV: produção médica, honorários, contas ou tabelas customizadas? Existe valor líquido já calculado e identificador da regra aplicada?
- Competência significa mês do atendimento, faturamento, apresentação, liquidação ou pagamento? Há corte, prazo por convênio e deslocamento para o mês seguinte?
- Glosa parcial permanece a receber? Como representar recurso, recuperação, estorno e glosa definitiva? Dedução é percentual por consulta ou também valor fixo/tributação?
- Qual a fonte oficial dos status faturado/pago/agendado? Como tratar cancelamento, falta e reapresentação?
- Quem aprova as regras e as alterações retroativas? Como conciliar com extrato oficial?
- O hospital autoriza o envio de código de atendimento pseudonimizado? Qual retenção, exclusão e segregação multiempresa?
