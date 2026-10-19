# HonorMed — roadmap vigente

Revisão de 19/10/2026. Este documento lista decisões e condições, sem prometer prazo. Ideias/modelos anteriores estão no [histórico](historico/ROADMAP-ATE-20261018.md) e não são especificações aprovadas. Estado atual em [ESTADO-ATUAL](ESTADO-ATUAL.md).

## Agora

Controle pessoal individual de Consultas e Laudos, módulos independentes, registro quantitativo e recebimentos autodeclarados. Registro rápido web/extensão implementado. Seção B1–B6 preparada em PRs separados: conta, primeiro uso, feedback, métricas opt-in, runbooks e alinhamento de materiais. Publicação e verificações operacionais pendentes em [LANCAMENTO](LANCAMENTO.md).

## Próximas decisões condicionais

| Item | Condição antes de executar | Limite |
|---|---|---|
| B7 — acesso comercial mínimo | Titular decidir cobrar no piloto e aprovar contratação | Flag individual, sem cobrança automática ou limites automáticos; ainda não implementada |
| B8 / Fase 5 — cirurgias | Conversas de validação das regras reais concluídas | Somente especificação futura: papéis, percentuais, vigência, telas e testes; não criar schema agora |
| Equipes/clínicas/instituições | Validar demanda e escopo organizacional | Exige organizações, membros, convites, papéis, consentimento e RLS próprios; não compartilhar login |
| Conector hospitalar/MV | Autorização institucional e descoberta HML somente leitura | Confirmar fonte do honorário e competência; reconciliação explícita, sem duplicar produção pessoal |
| Internações/plantões/outras produções | Validar rotina e regra com usuários | Sem modelo ou data de entrega aprovados |

## Princípios para qualquer evolução

Sem nome/CPF/iniciais, identificação de caso manual, imagem ou texto de paciente. Cálculo auditável em SQL e isolamento individual; mudança organizacional requer autorização própria. Preservar valores conhecidos e mostrar pendências. Nunca compensar módulos ou somar importado e pessoal automaticamente.

Preço individual proposto em `web/src/lib/plans.ts`, atualmente R$ 79,90/mês com Consultas e Laudos pelo mesmo preço. Propostas Free e Institucional anteriores ficam históricas. Não prometer planos, exportação publicada, integração, faturamento confirmado, SLA ou cobrança que ainda não estejam operacionais e homologados.
