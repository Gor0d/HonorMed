# Regras do MVP

## Controle pessoal (fluxo principal)

- Dados consolidados em `locais`, `atendimentos` (com quantidade e local) e `recebimentos`. `honorarios_pessoais` é o cadastro simplificado de valor líquido. Todas as tabelas têm RLS `medico_id = auth.uid()` e referências compostas. `locais_atendimento`, `producoes_pessoais` e `recebimentos_pessoais` são views de compatibilidade com `security_invoker`; suas escritas respeitam RLS das tabelas base.
- Produção = data + local + convênio + quantidade inteira de 1 a 1.000, sem paciente. Honorário líquido por consulta, informado pelo médico, pode estar ausente (NULL). Zero explícito é honorário conhecido, não pendência.
- Ao salvar uma produção, o banco copia o honorário configurado para aquele local/convênio. Alterar um honorário não recalcula os registros que já tinham valor; novos registros usam o novo valor. Editar apenas data/quantidade preserva o honorário; trocar local/convênio aplica o honorário do novo par.
- Salvar honorário preenche todos os registros ainda sem valor do mesmo local/convênio. A interface avisa esse efeito antes de salvar. Não há vigência histórica contratual nesse fluxo: o médico está informando o valor esperado para os registros pendentes. A visão importada mantém suas regras por vigência.
- Produção estimada em SQL = soma de quantidade × honorário registrado. Consultas sem honorário contam na quantidade e no alerta, mas ficam fora da previsão.
- Recebimentos são valores reais informados pelo médico por local, convênio e mês de produção. Data de pagamento pode ser de outro mês; o resumo usa sempre o mês da produção. Não se presume qual consulta individual foi paga. Recebimentos migrados sem convênio ficam sem atribuição até o médico identificar a referência.
- Saldo por local/convênio = máximo(produção conhecida − recebimentos, 0). O saldo do mês soma os saldos de cada par; receber a mais em um convênio/local não quita outro.
- `resumo_competencia` mostra produzido, previsto_a_receber, recebido, diferença assinada (produção − recebido) e indicadores para conferência por local/convênio. Saldo positivo sem pagamento não é apresentado como erro; após recebimento parcial/diferente, a interface sugere conferir a referência. Nada constitui divergência hospitalar confirmada.
- As regras contratuais aceitam local opcional; a regra específica do local prevalece sobre a global, respeitando vigência. Sem honorário pessoal, a produção pode usar a regra SQL aplicável e preservar seu resultado unitário. Cálculo total = resultado unitário × quantidade, com dedução/glosa/vigência centralizados em SQL.
- `origem`: `informado_medico`, `importado`, ou futuro `confirmado_hospital`. Usuários autenticados não podem criar/alterar registros para se autodeclararem confirmados pelo hospital. Não há nenhum registro ou integração hospitalar confirmada nesta entrega.
- Recebimento acima da produção conhecida no par local/convênio gera informação para conferir, não glosa ou erro confirmado. Pode haver honorário pendente, produção ainda não registrada ou atribuição a outro período.
- Os recebimentos são parciais ou totais sem mudar status de consultas. Editar/excluir produção e recebimentos atualiza os totais imediatamente em SQL.
- Fonte: **Informado por você**. Sem confirmação hospitalar, comparação automática com MV ou promessa de conciliação bancária. Sem fechamento contábil/trilha histórica completa; não usar como extrato oficial.
- Visão importada separada em `/importados`; nunca somada automaticamente à produção pessoal, inclusive se representar a mesma consulta.

## Visão importada e regras contratuais

- Competência: mês explícito `YYYY-MM`. Importação usa data do atendimento. A demo fixa outubro/novembro de 2026. A decisão do hospital sobre atendimento versus faturamento continua aberta.
- Vigência inclusiva pela data do atendimento e procedimento exato. Regras sobrepostas do mesmo médico/convênio/procedimento são rejeitadas pelo banco. Sem regra, repasse é NULL (não zero) e aparece em alerta.
- Base fixa: honorário em reais. Base percentual: valor da consulta × percentual / 100. Valor de consulta do atendimento prevalece sobre o valor da regra.
- Repasse líquido: base × (1 − dedução/100) × (1 − glosa/100), arredondado por atendimento a dois decimais. Dedução/glosa entre 0 e 100. Glosa marcada sem percentual é total (100%). Percentual explícito permite glosa parcial.
- `previsto` / “A receber”: soma líquida de tudo que não está pago, incluindo agendados. `pago` é mostrado separadamente. Total de produção = previsto + pago. Uma glosa parcial preserva o saldo recuperável na previsão; essa hipótese precisa de validação hospitalar.
- Glosado: diferença entre base após dedução e líquido; dedução contratual não é glosa. `realizado` na view soma líquidos de status diferentes de agendado/glosado.
- O donut mede quantidades por status; a legenda também mostra repasse líquido. `realizado` é preservado como estado próprio do modelo além dos cinco estados do protótipo.
- Quantidade × honorário só coincide diretamente com subtotal quando não há dedução, glosa ou mudança de valor. A tela informa valores variáveis e ticket médio. Sem regra não entra na soma mas conta no denominador do ticket (estimativa conservadora).
- Meta usa produção prevista + recebida; pode ultrapassar 100%, mas a barra limita visualmente a 100%.
- Regras são recalculadas ao consultar as views. Não há fechamento contábil nem snapshot imutável neste MVP; implementar congelamento/versionamento antes de usar para pagamento oficial.
- Planos são apenas prévia de produto, sem cobrança e sem restringir dados. `NEXT_PUBLIC_PLANS_PREVIEW=false` oculta essa navegação.
- Não há nome/CPF/iniciais/hash de paciente em nenhuma tabela. `nome` existe apenas no perfil do médico e no convênio. Código de atendimento continua dado pseudonimizado e exige controle de acesso.
