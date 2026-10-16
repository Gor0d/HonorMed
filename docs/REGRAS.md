# Regras do MVP

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
