# Repasse MED — guia para apresentar aos médicos

## Está apresentável?

**Sim, para demonstração guiada, descoberta comercial e recrutamento de um piloto.** A interface, o fluxo financeiro e os cálculos podem ser demonstrados com dados fictícios. Ainda não está validado para uso operacional com dados reais ou como documento oficial de pagamento.

O registro de entrega contém build aprovado, 9 testes SQL/RLS e 4 testes Playwright em celular e desktop. São evidências do MVP, não homologação hospitalar. Auth/Supabase completo, implantação, integração MV, competência contratual, conciliação e instalação em dispositivo físico ainda precisam ser validados.

## Material

- `Repasse_MED_Apresentacao_Medicos.pptx`: 16 slides editáveis e notas de fala. Slides 1–12 para médicos; 13–16 como apêndices para gestão/TI e negociação.
- `Repasse_MED_Apresentacao_Medicos.pdf`: versão para compartilhar sem depender de fontes/PowerPoint, quando disponível.
- As fontes visuais são Bricolage Grotesque e Manrope. Se o computador da apresentação não as tiver, o PowerPoint poderá substituí-las. Prefira o PDF para preservar a aparência.
- Preços são hipóteses propostas, sem aprovação, contrato ativo ou cobrança implementada. A apresentação não altera os planos na aplicação.

## Roteiro de 10 minutos

1. **Contexto (1 min):** “O Repasse MED organiza a previsão do repasse e mostra como cada valor foi formado. Hoje vamos usar dados fictícios.”
2. **Fluxo (1 min):** conta → perfil → entrada de produção → regras → competência → conferência.
3. **Dashboard (2 min):** mostrar previsão ainda não paga, valor já recebido, meta e alertas. Trocar outubro/novembro. Explicar que a previsão inclui agendamentos e não garante depósito.
4. **Conferência (2 min):** abrir Por convênio, depois Atendimentos; filtrar um convênio e um status; abrir o detalhe com código, regra e origem.
5. **Regras e importação (1 min):** explicar valor fixo/percentual e vigência. Mostrar a tela de importação sem enviar arquivo com identificação pessoal. Não editar regras reais durante a reunião.
6. **Planos (1 min):** apresentar Free/Pro como proposta de lançamento. O MVP atual libera todos os recursos, sem cobrança ou bloqueios por plano.
7. **Piloto e perguntas (2 min):** convidar interessados, colher dúvidas e combinar uma validação controlada, condicionada à aprovação do hospital.

Para demonstrar, dentro de `web`, execute `npm.cmd run dev` e abra `http://127.0.0.1:3000`. Sem Supabase configurado, o botão Entrar abre a demonstração sem autenticação real. O endereço localhost só funciona no computador onde o servidor roda; use projeção ou compartilhamento de tela. Não prometer acesso remoto aos médicos antes do deploy.

O banco demonstrativo reinicia ao encerrar e reiniciar o servidor. Evite importar ou alterar regras antes de apresentar: os valores podem mudar. Outubro tem 140 atendimentos; novembro, 70. A previsão de novembro no seed original é R$ 7.413,00, com 14 consultas sem regra. Todos os números são fictícios.

## Proposta comercial sugerida — para aprovar

| Opção | Preço sugerido | Proposta de escopo | Condição |
|---|---:|---|---|
| Free | R$ 0 | 1 convênio, competência atual e visão básica | Limites ainda não implementados |
| Pro individual | R$ 49,90/médico/mês | Múltiplos convênios, competências com dados disponíveis, metas, regras e importação | Sem integração MV automaticamente incluída; cobrança futura |
| Institucional | Referência de R$ 1.490/mês | Até 50 médicos de uma instituição | Licenciamento institucional, suporte e integrações sujeitos à descoberta e contrato |
| Implantação institucional | Referência inicial de R$ 4.900 | Configuração, capacitação e escopo inicial acordado | Estimar esforço antes de fechar; customizações e integração fora do escopo devem ser orçadas |

Escolher quem paga: médico **ou** hospital para os acessos cobertos, evitando cobrança duplicada. Não prometer painel administrativo institucional, SLA, múltiplos hospitais, fechamento contábil, exportação ou recuperação automática de glosas: esses recursos não foram entregues neste MVP.

Sugestão de piloto: 5–10 médicos, 30 dias gratuitos de uso controlado após os requisitos de implantação e segurança. Demonstrar agora com seed; dados reais somente após autorização, validação de Auth e conferência das regras pelo hospital. Medir tempo de conferência, entendimento dos valores, divergências e disposição a pagar. Não anunciar prazo garantido para integração.

## Por que esse preço?

R$ 49,90 é uma hipótese inicial para um produto focado na visibilidade do repasse; não resulta de pesquisa comprovada de disposição a pagar. É necessário testar com médicos e levantar custo de operação/suporte. A oferta pública de [gestão financeira do iClinic](https://site.iclinic.com.br/funcionalidades/gestao-financeira/) confirma que repasses são uma funcionalidade de sistemas médicos mais amplos; isso é apenas contexto de categoria, não comparação equivalente nem prova de preço para o Repasse MED. Referência consultada em 16/10/2026.

Exemplo aritmético: 100 assinantes Pro geram R$ 4.990/mês de receita **bruta**, antes de hospedagem, suporte, aquisição, tributos e manutenção. Não é previsão de vendas, margem ou lucro. Os valores institucionais também são sugestões próprias e dependem de escopo e custos.

Se “valor comercial” significar **preço de venda integral do software**, não há base para um valuation defensável nesta fase. Levantar propriedade intelectual, custo de reposição, esforço restante, contratos, receita recorrente, custos e passivos antes de negociar cessão do produto. Não confundir preço de assinatura com valor do ativo.

## Perguntas para os médicos

- O que você usa hoje para conferir o repasse? Qual parte dá mais trabalho?
- Você consegue distinguir previsto, faturado e recebido? Que informação falta?
- A competência mostrada corresponde à que você espera? Como funciona o prazo de cada convênio?
- Você pagaria R$ 49,90/mês por esse acompanhamento? Preferiria acesso custeado pelo hospital?
- Que resultado faria você continuar usando depois do piloto?

## Antes de oferecer operação real

Validar a fonte oficial do valor de repasse e o critério de competência no MV com o hospital. Autorizar formalmente o tratamento de dados; validar identificação do médico, login real, permissões, infraestrutura, recuperação e suporte. Implementar e homologar o conector somente após a Fase 0. Conferir resultados contra o extrato oficial e definir tratamento de glosa/fechamento. Consulte `docs/FASE-3.md`.

## Regenerar a apresentação

Na raiz do projeto, com Python e as bibliotecas disponíveis:

```powershell
python -m pip install --target .tools/presentation python-pptx Pillow
$env:PYTHONPATH = Join-Path $PWD '.tools/presentation'
python docs/apresentacao/gerar_apresentacao.py
```

O gerador usa as capturas `web/test-results/dashboard-desktop.png` e `dashboard-mobile.png`, produzidas por `npm run test:e2e`. As notas do apresentador fazem parte do PPTX. Revise os preços antes de distribuir o material como oferta definitiva.
