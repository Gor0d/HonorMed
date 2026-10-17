---
name: honormed-produto
description: Desenvolver fluxos de produção e recebimentos do HonorMed, incluindo Consultas, Laudos e escolha de perfil. Usar para mudanças de experiência, funcionalidades e avaliação de escopo do produto.
---

# Produto HonorMed

Trabalhe na raiz do checkout que contém AGENTS.md e docs/PLANO.md. Leia primeiro [AGENTS.md](../../../AGENTS.md) e a revisão mais recente de [PLANO.md](../../../docs/PLANO.md); o planejamento antigo de integração não substitui as revisões do controle pessoal.

O produto entrega autonomia ao médico para registrar quantidades e conferir honorários, sem depender do administrativo do hospital. Somente consultas, Somente laudos ou Ambos são preferências de experiência; mudar de perfil não apaga produção nem muda o preço por módulo. Radiologistas não precisam cadastrar convênios ou consultas.

Fluxo principal: registrar produção → acompanhar previsão → registrar recebimento → conferir diferença. O mês da produção é diferente da data em que o dinheiro chegou. Registros pessoais são autodeclarações, não confirmação hospitalar. Honorário desconhecido não impede o registro; deve continuar visível como pendência.

Antes de propor funcionalidades:

- Leia [ROADMAP.md](../../../docs/ROADMAP.md) para distinguir recursos entregues de futuros. Equipes/organizações, cobrança, limites de plano e conector MV não devem ser anunciados como prontos.
- Confira preços em `web/src/lib/plans.ts` e a oferta operacional em [LANCAMENTO.md](../../../docs/LANCAMENTO.md). São propostas; a página Planos não implementa assinatura. Não confundir tarifa por exame com preço da assinatura.
- Preserve a separação de Consultas, Laudos e `/importados`. Nunca somar produção importada e pessoal automaticamente nem compensar recebimentos entre módulos/instituições.

Implementação: `product-modules.tsx` escolhe perfil; `personal-control.tsx` cuida de Consultas; `radiology-control.tsx` cuida de Laudos; `data.ts` faz acesso Supabase. Os arquivos ficam em `web/src`. Preserve navegação simples, pt-BR, valores legíveis e ações de poucos toques. Não introduza dados de paciente nem emissão clínica de laudos.

Ao mudar regras financeiras, leia [REGRAS.md](../../../docs/REGRAS.md) e trate SQL como fonte do cálculo; o frontend apresenta os resultados. Para UI, leia também `web/AGENTS.md` e a documentação local pertinente do Next antes de editar. Use os testes existentes que cubram o comportamento alterado; `npm run test:e2e` já isola a demo do banco real.
