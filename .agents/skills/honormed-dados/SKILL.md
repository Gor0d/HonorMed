---
name: honormed-dados
description: Alterar migrations, cálculo financeiro e isolamento de dados do HonorMed em Supabase/PostgreSQL. Usar para regras de honorários, produção, recebimentos e testes de RLS; não é uma skill de consulta ao Oracle.
---

# Dados e cálculos do HonorMed

Na raiz do checkout, leia [AGENTS.md](../../../AGENTS.md), [PLANO.md](../../../docs/PLANO.md) e [REGRAS.md](../../../docs/REGRAS.md). Inspecione as migrations existentes antes de desenhar tabelas novas: nomes usados pela UI podem ser views de compatibilidade.

Estrutura relevante:

- `medicos.medico_id = auth.uid()` é o limite de isolamento. RLS nas tabelas, views com `security_invoker` e FKs compostas entre médico e entidades impedem referências cruzadas. Não substitua RLS por filtros de frontend.
- Consultas pessoais usam `atendimentos` e `recebimentos`, com views `producoes_pessoais`, `recebimentos_pessoais` e resumos SQL. `locais_atendimento` é uma view de `locais`. `/importados` usa uma visão separada.
- Laudos usam `laudos_tipos`, `laudos_valores`, `laudos_producao`, `laudos_recebimentos` e views de cálculo/resumo. `preferencias_produto` guarda somente o perfil de uso.

Preserve snapshots: valores conhecidos de produções anteriores não mudam ao editar uma tarifa; cadastrar uma tarifa preenche os valores ainda pendentes. Trocar local/tipo deve respeitar os triggers e as regras documentadas. Recebimentos pertencem ao mês de produção e ao grupo financeiro correto; excedente de um local não quita outro. Dedução, vigência, glosa, percentual e valor fixo são calculados em SQL, sem fórmula financeira paralela no frontend.

Crie migrations aditivas. Não reescreva migrations já aplicadas para mudar produção. Mantenha search_path explícito nas funções e revise privilégios. Não usar service role no frontend. Não guardar nome, CPF, iniciais, texto de laudo, imagens ou DICOM de paciente. Oracle está fora desta skill e não é necessário para trabalhar com seed local.

Validação local, em `/web`: `npm test` executa PostgreSQL PGlite com cálculo e RLS. Inclua cenários financeiros significativos e tentativa de acesso A/B quando pertinente; diferencie PGlite de Auth/API reais. `supabase/tests/launch-rls.sql` é teste remoto transacional com rollback; só executar quando o trabalho remoto estiver autorizado e o projeto tiver sido conferido. Não executar automaticamente só porque o arquivo existe.

Para aplicar em banco remoto, confirme o destino em [LANCAMENTO.md](../../../docs/LANCAMENTO.md), leia o dry-run e respeite o escopo da tarefa. Nunca carregar seed ou executar db reset remoto. A skill não concede autorização de migração, provisionamento ou acesso a produção.
