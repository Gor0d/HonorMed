# HonorMed — guia para apresentar aos médicos

## Está apresentável?

**Sim, para demonstração guiada, descoberta comercial e recrutamento de um piloto.** A interface, o fluxo financeiro e os cálculos podem ser demonstrados com dados fictícios. Ainda não está validado para uso operacional com dados reais ou como documento oficial de pagamento.

O registro atualizado contém build aprovado, 19 testes SQL/RLS e 8 testes Playwright em celular e desktop. São evidências do MVP, não homologação hospitalar. Auth/Supabase completo, implantação e instalação em dispositivo físico ainda precisam ser validados. Integração MV e conciliação hospitalar são futuras e não bloqueiam a utilidade do registro pessoal.

**Posicionamento atual:** autonomia do médico. Ele informa quantidade de consultas, por local/data/convênio, e os recebimentos. Código de prestador é opcional; honorário desconhecido não bloqueia registro. Tudo é identificado como informação pessoal, sem confirmação do hospital. HonorMed vem da revisão v2 e está centralizado em `brand.ts`; disponibilidade de marca/domínio não foi validada.

## Material

- `HonorMed_Apresentacao_Medicos.pptx`: 16 slides editáveis e notas de fala. Slides 1–12 para médicos; 13–16 como apêndices para gestão/TI e negociação.
- `HonorMed_Apresentacao_Medicos.pdf`: versão para compartilhar sem depender de fontes/PowerPoint.
- As fontes visuais são Bricolage Grotesque e Manrope. Se o computador da apresentação não as tiver, o PowerPoint poderá substituí-las. Prefira o PDF para preservar a aparência.
- Preços são hipóteses propostas, sem aprovação, contrato ativo ou cobrança implementada. A apresentação não altera os planos na aplicação.

## Roteiro de 10 minutos

1. **Contexto (1 min):** “A ideia é o senhor ter o próprio controle, sem depender de pedir relatório ao administrativo. Hoje vamos usar dados fictícios.”
2. **Configuração (1 min):** conta/perfil → local e convênio → honorário quando souber. Código MV não é obrigatório.
3. **Registrar consultas (2 min):** informar data, local, convênio e quantidade, como “8 consultas Unimed hoje”. Mostrar que consultas sem honorário também ficam salvas.
4. **Acompanhar (2 min):** mostrar produção estimada, recebido e previsto a receber. Abrir Produção e filtrar por local, convênio e dia. Consultas sem valor contam na quantidade, mas ficam fora da soma financeira.
5. **Recebimento (1 min):** lançar pagamento parcial por local/convênio/mês da produção. Explicar que o dinheiro recebido em novembro pode quitar produção de outubro. Nenhuma consulta é marcada automaticamente como paga.
6. **Planos (1 min):** apresentar Free/Pro como proposta de lançamento. O MVP atual libera todos os recursos, sem cobrança ou bloqueios por plano.
7. **Piloto e perguntas (2 min):** entender se ele prefere lançar uma por vez ou o total do dia; convidar interessados e combinar validação controlada após preparar login e operação. Integração com dados hospitalares exige autorização e validações próprias.

Para demonstrar, dentro de `web`, execute `npm.cmd run dev` e abra `http://127.0.0.1:3000`. Sem Supabase configurado, o botão Entrar abre a demonstração sem autenticação real. O endereço localhost só funciona no computador onde o servidor roda; use projeção ou compartilhamento de tela. Não prometer acesso remoto aos médicos antes do deploy.

O banco demonstrativo reinicia ao encerrar e reiniciar o servidor. Mudanças durante a demonstração alteram os números. No controle pessoal, outubro tem 24 consultas, 4 sem valor, R$ 2.245,00 produzidos, R$ 500,00 recebidos e R$ 1.745,00 de saldo previsto. Novembro tem 6 consultas/R$ 510,00. Todos os números são fictícios. A visão anterior permanece separada em `/importados`, com os 140/70 atendimentos originais.

## Proposta comercial sugerida — para aprovar

| Opção | Preço sugerido | Proposta de escopo | Condição |
|---|---:|---|---|
| Free | R$ 0 | 1 convênio, competência atual e visão básica | Limites ainda não implementados |
| Pro individual | R$ 49,90/médico/mês | Múltiplos locais/convênios e histórico pessoal com os meses registrados | Sem integração MV automaticamente incluída; cobrança futura |
| Institucional | Referência de R$ 1.490/mês | Até 50 médicos de uma instituição | Licenciamento institucional, suporte e integrações sujeitos à descoberta e contrato |
| Implantação institucional | Referência inicial de R$ 4.900 | Configuração, capacitação e escopo inicial acordado | Estimar esforço antes de fechar; customizações e integração fora do escopo devem ser orçadas |

Escolher quem paga: médico **ou** hospital para os acessos cobertos, evitando cobrança duplicada. Não prometer painel administrativo institucional, SLA, múltiplos hospitais, fechamento contábil, exportação ou recuperação automática de glosas: esses recursos não foram entregues neste MVP.

Sugestão de piloto: 5–10 médicos, 30 dias gratuitos de uso controlado após os requisitos de implantação e segurança. Demonstrar agora com seed. Validar Auth, permissões e persistência antes do uso pessoal real. Integração hospitalar exige autorização e homologação próprias. Medir esforço para registrar o dia, entendimento do saldo e disposição a pagar; não anunciar prazo garantido para integração.

## Por que esse preço?

R$ 49,90 é uma hipótese inicial para um produto focado na visibilidade do repasse; não resulta de pesquisa comprovada de disposição a pagar. É necessário testar com médicos e levantar custo de operação/suporte. A oferta pública de [gestão financeira do iClinic](https://site.iclinic.com.br/funcionalidades/gestao-financeira/) confirma que repasses são uma funcionalidade de sistemas médicos mais amplos; isso é apenas contexto de categoria, não comparação equivalente nem prova de preço para o HonorMed. Referência consultada em 16/10/2026.

Exemplo aritmético: 100 assinantes Pro geram R$ 4.990/mês de receita **bruta**, antes de hospedagem, suporte, aquisição, tributos e manutenção. Não é previsão de vendas, margem ou lucro. Os valores institucionais também são sugestões próprias e dependem de escopo e custos.

Se “valor comercial” significar **preço de venda integral do software**, não há base para um valuation defensável nesta fase. Levantar propriedade intelectual, custo de reposição, esforço restante, contratos, receita recorrente, custos e passivos antes de negociar cessão do produto. Não confundir preço de assinatura com valor do ativo.

## Perguntas para os médicos

- O que você usa hoje para conferir o repasse? Qual parte dá mais trabalho?
- É mais prático registrar uma consulta por vez ou a quantidade ao final do dia?
- Você já sabe quanto recebe por consulta/convênio ou só descobre no demonstrativo?
- A competência mostrada corresponde à que você espera? Como funciona o prazo de cada convênio?
- Você pagaria R$ 49,90/mês por esse acompanhamento? Preferiria acesso custeado pelo hospital?
- Que resultado faria você continuar usando depois do piloto?

## Antes de oferecer operação real

Para o controle pessoal, validar identificação do médico, login real, isolamento, persistência, infraestrutura, recuperação e suporte. Não prometer extrato oficial ou confirmação de pagamentos. Para integração hospitalar, validar fonte oficial do repasse, critério de competência, autorização e tratamento de dados. Implementar e homologar conector somente após a Fase 0, com reconciliação explícita para evitar duplicar consultas pessoais/importadas. Consulte `docs/FASE-3.md`.

## Regenerar a apresentação

Na raiz do projeto, com Python e as bibliotecas disponíveis:

```powershell
python -m pip install --target .tools/presentation python-pptx Pillow
$env:PYTHONPATH = Join-Path $PWD '.tools/presentation'
python docs/apresentacao/gerar_apresentacao.py
```

O gerador usa as capturas `web/test-results/personal-dashboard-desktop.png` e `personal-dashboard-mobile.png`, produzidas por `npm run test:e2e`. `slides_base.py` contém os elementos visuais e `gerar_controle_pessoal.py` o conteúdo atualizado; `gerar_apresentacao.py` é o comando de entrada. As notas do apresentador fazem parte do PPTX. Revise os preços antes de distribuir como oferta definitiva.
