# Fase 4 — Registro pessoal e recebimentos (prompt para o Codex)

Contexto: Fases 1 e 2 já existem (web/, supabase/migrations/202610160001_foundation.sql, views
`atendimentos_calculados` e `repasses_competencia`, regras em docs/REGRAS.md). Leia a REVISÃO v2 em docs/PLANO.md.

## Tarefa
Evoluir o MVP para o modelo "controle pessoal do médico", reaproveitando regras, cálculo SQL, RLS e testes.

1. **Banco (nova migration, não edite a existente)**
   - `locais` (id, medico_id, nome) e coluna `local_id` em `atendimentos` e `regras_repasse` (opcional).
   - `atendimentos`: permitir lançamento agregado — nova coluna `quantidade int default 1 check (>0)`;
     `cd_atendimento` passa a ser opcional (único por médico quando presente); `origem` em
     (`informado_medico`,`importado`,`confirmado_hospital`).
   - `recebimentos` (id, medico_id, local_id, convenio_id, competencia, data_pagamento, valor, observacao).
   - Cálculo: repasse do lançamento = repasse unitário × `quantidade`, mantendo dedução/glosa/vigência.
   - View `resumo_competencia`: `produzido`, `previsto_a_receber` (produzido − recebido, mínimo 0 por convênio/local),
     `recebido`, `diferenca` e flag de divergência por convênio/local. RLS (`medico_id = auth.uid()`) e
     `security_invoker` em tudo novo.
2. **Telas**
   - Home: botão **Registrar consultas** em destaque + 3 cards (Produzido · Previsto a receber · Recebido),
     seletor de competência, lista curta de divergências.
   - **Registrar consultas** (bottom sheet no celular): data (padrão hoje), local, convênio, quantidade
     (stepper +/−), confirmar em ≤3 toques; permitir "repetir último lançamento" e desfazer.
   - **Recebimentos**: registrar valor/data por convênio e competência; mostrar previsto × recebido e a diferença.
   - Selo de origem em cada linha ("informado por você" / "importado" / futuramente "confirmado pelo hospital").
   - Cadastro de locais; regras de repasse passam a aceitar local opcional.
   - Remover "Alertas de glosa" do foco principal, mantendo glosa como campo opcional.
3. **Nome do produto**: ler de uma única constante (`web/src/lib/brand.ts`) usada no layout, manifest, e-mails e
   textos. Valor: "HonorMed" (nome decidido). Renomear também título, manifest, README e testes que citem "Repasse MED".
4. **Testes**: Vitest para quantidade × valor, recebimento parcial, divergência e RLS dos novos objetos;
   Playwright: registrar 8 consultas Unimed → ver Produzido/Previsto atualizados → registrar recebimento →
   ver Recebido e diferença; sem overflow a 390px e 1280px.
5. **Documentação**: atualizar README.md, AGENTS.md e docs/REGRAS.md (semântica de previsto/recebido/divergência).

## Fora do escopo
Conector Oracle/MV, cobrança de planos, notificações push, exames/cirurgias/plantões.

## Pronto quando
`npm run build`, `npm test` e `npm run test:e2e` passam; o fluxo registrar → receber funciona no seed e no
Supabase local; nenhuma tabela guarda dado de paciente.
