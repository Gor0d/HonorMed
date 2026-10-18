# HonorMed — roadmap de features e ideias futuras

Princípio: **tudo que o médico produz numa instituição entra no HonorMed**, com o mesmo fluxo
já validado nas consultas: **registrar → prever → receber → conferir**. Cada novo tipo de produção
reaproveita locais, convênios, recebimentos, origem do dado (informado / importado / confirmado) e a regra
"sem dados de paciente".

Registro rápido no computador (rota `/registrar` e extensão Chromium) está especificado em `REGISTRO-RAPIDO.md` como melhoria transversal; não cria nova fase nem antecipa integração hospitalar.

## Ordem sugerida

Atualização de 16/10/2026: **Laudos Radiológicos foi antecipado e implementado por pedido explícito**, com perfil exclusivo opcional e controle financeiro próprio. A ordem abaixo permanece como visão das demais evoluções; cirurgias, internações e plantões não foram implementados nesta entrega.

| Fase | Entrega | Por quê nessa ordem |
|---|---|---|
| Atual | Consultas ambulatoriais (quantidade × honorário, recebimentos, conferência) | MVP em validação com o primeiro cliente |
| 5 | **Cirurgias e procedimentos** | Maior valor por lançamento; regras mais ricas (papel, porte) |
| 6 | **Internações** (visitas, pareceres, evolução, alta) | Produção recorrente e fácil de esquecer de cobrar |
| 7 | **Plantões, exames/laudos e outros honorários** | Reaproveita o mesmo modelo de produção |
| 8 | Integração opcional com o sistema do hospital (confirmação) | Só depois do valor pessoal provado |

## Modelo de dados — generalizar sem quebrar o que existe

Hoje: `atendimentos` (consulta). Evolução proposta, em migrations novas e compatíveis:

- `producao` (ou `atendimentos` com coluna `tipo`): `tipo` ∈ `consulta | cirurgia | procedimento | visita_internacao | parecer | plantao | exame_laudo | outro`.
- Campos comuns: `medico_id`, `local_id`, `convenio_id`, `data`, `quantidade`, `valor_unitario`, `origem`, `competencia`.
- Campos por tipo em `detalhes jsonb` validado por tipo (ou tabelas filhas), por exemplo:
  - **cirurgia/procedimento**: `papel` (cirurgião, 1º/2º auxiliar, anestesista, instrumentador), `porte`/`codigo_tabela` (CBHPM/TUSS, opcional), `via_acesso` (múltiplas vias), `percentual_papel`.
  - **internação**: `data_inicio`, `data_fim`, `dias_acompanhados`, tipo (visita, parecer, evolução).
  - **plantão**: `inicio`, `fim`, `horas`, valor por hora ou fixo.
- `regras_repasse`: passa a casar por `tipo` + (convênio, local, procedimento/papel) com vigência.
- Recebimentos continuam **por convênio/local/competência**, abatendo o saldo de qualquer tipo; sem marcar item a item como pago.
- Sem nome, CPF ou iniciais de paciente em nenhum tipo. Identificador de caso apenas se o médico quiser (código opaco, opcional).

## Cirurgias e procedimentos (Fase 5)

- Registro rápido: data, local, convênio, **procedimento** (lista própria do médico, com atalhos) e **papel**.
- Honorário por procedimento e por papel, com percentual padrão por papel (ex.: auxiliar como % do cirurgião), editável.
- Regras de múltiplos procedimentos na mesma cirurgia (redução por via de acesso), configuráveis.
- Previsto × recebido por cirurgia agrupado por convênio/local, destacando atrasos.
- Fora do MVP da fase: glosa detalhada por item e conciliação de guia.

## Internações (Fase 6)

- Lançar **visitas/acompanhamentos por dia** (quantidade) e **pareceres**, por local e convênio.
- Opcional: "caso em acompanhamento" com data de início/fim para somar diárias; sem identificar paciente.
- Lembrete de fechamento: "você acompanhou internações nesta semana sem lançar?".

## Outras ideias (sem prioridade definida)

- **Plantões**: horas, valor por hora/fixo, vínculo com local, calendário de escalas.
- **Exames e laudos**: quantidade por modalidade, valor por laudo.
- **Metas e comparativos**: meta mensal por tipo, comparação com meses anteriores, sazonalidade.
- **Lembretes**: fechar o mês, cobrar recebimento atrasado, vencimento de vigência de honorário.
- **Importação**: planilha/CSV de produção e de recebimentos para os tipos novos, mantendo origem "importado".
- **Exportação**: planilha/PDF do mês para contador ou para contestar diferenças com o hospital.
- **Impostos e líquido**: estimativa do líquido por retenções, como informação do próprio médico.
- **Multi-instituição**: visão consolidada de todos os locais e filtro por local.
- **Confirmação do hospital** (futuro): selo "confirmado pelo hospital" via integração ou conferência; requer
  autorização formal da instituição e é opcional para o produto continuar útil.
- **Planos**: Free (poucos convênios, mês atual) e Pro (todos os tipos de produção, histórico, exportação).
- **Notificações push e app instalável** com lançamento por atalho ("mais uma consulta").

## Riscos a tratar antes de crescer

- Cada tipo tem regra de pagamento própria: validar com médicos reais antes de modelar (cirurgia e internação variam muito entre hospitais e convênios).
- Registro pessoal não prova faturamento nem pagamento: manter selo de origem em toda linha.
- LGPD: qualquer campo de caso/paciente é opcional, opaco e fora de relatórios exportados.
- Disponibilidade do nome HonorMed (INPI, domínio) pendente.
