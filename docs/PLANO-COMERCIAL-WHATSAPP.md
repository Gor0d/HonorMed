# HonorMed — venda assistida por WhatsApp

**Decisão de planejamento (19/10/2026):** toda conversa comercial começa no WhatsApp do responsável, **+55 91 98283-7769** (`https://wa.me/5591982837769`). A proposta e a cobrança serão feitas fora do app. A regra desejada é liberar o acesso **após confirmação do pagamento**, conforme as condições aceitas pelo cliente; esse bloqueio ainda precisa ser implementado. O app continua sendo um controle pessoal de Consultas e Laudos, não um extrato hospitalar.

## Oferta e público

| Canal | Comprador | Oferta que o produto atual comporta | Regra comercial |
|---|---|---|---|
| B2C | Médico individual | Uma conta individual com escolha de Consultas, Laudos ou ambos; produção e recebimentos próprios. | Negociação direta no WhatsApp. R$ 79,90/mês é a referência de proposta atual; confirmar preço, período, pagamento e suporte antes de cobrar. |
| B2B | Clínica, hospital ou grupo pagando acessos de médicos | Conjunto de **contas individuais** custeadas pela instituição. Cada médico continua vendo apenas os seus dados. | Levantar número de médicos, responsáveis e suporte; enviar proposta com escopo, preço e período definidos. R$ 1.990/mês para até 50 médicos e implantação de R$ 4.900 são referências anteriores, não oferta pronta. |

Na proposta B2B, a instituição custeia acessos, mas **não recebe painel de equipe, acesso aos dados dos médicos, integração MV, relatórios institucionais nem gestão de usuários no app**. Tudo isso exige produto, autorização e contrato específicos. Um mesmo médico não deve pagar B2C se a instituição já custeia seu acesso no mesmo período.

## Jornada comercial

1. **Criativo → WhatsApp.** A peça diz “Converse sobre o HonorMed” e abre o número acima. Diferenciar a mensagem inicial: “Sou médico e quero conhecer o HonorMed” ou “Represento uma instituição e quero discutir acessos para médicos”.
2. **Qualificação breve.** Perguntar se o interesse é individual ou institucional, se o uso é para Consultas, Laudos ou ambos e, no B2B, quantos médicos participariam. Não pedir dados de pacientes nem demonstrativos hospitalares pelo WhatsApp.
3. **Demonstração.** Mostrar o fluxo registrar → prever → receber → conferir com dados fictícios. Explicar que a previsão usa valores cadastrados pelo médico e que o recebimento também é informado por ele.
4. **Proposta escrita.** Registrar quem paga, quantidade de contas, valor, período, início de vigência, forma de pagamento, suporte, renovação, cancelamento e o que está fora do escopo. B2B precisa identificar os médicos cobertos e o responsável por pagar; não presumir compartilhamento de dados com a instituição.
5. **Pagamento e confirmação.** Enviar instruções de pagamento pelo canal combinado; conferir a liquidação no meio de pagamento utilizado. Comprovante enviado em conversa, isoladamente, não deve mudar o estado do acesso.
6. **Liberação.** Vincular a autorização comercial à identidade da conta do médico e ao período contratado; comunicar a liberação individualmente. No B2B, registrar quais contas são custeadas pela instituição. O período contratado deve começar na data acordada de ativação, registrada na proposta.
7. **Acompanhamento.** Registrar vencimento, renovação, pagamentos, cancelamento e suporte em controle administrativo restrito. Antes de vencer, informar condições de continuidade. Em cancelamento ou inadimplência, aplicar a regra aceita na proposta e preservar procedimento de acesso, exportação/exclusão e retenção de dados.

## Regra de acesso necessária antes de vender com “liberação após pagamento”

**Estado atual:** o site publicado permite cadastro e, depois da autenticação/onboarding, acesso às funções. A página Planos é apenas prévia; pagamento, aprovação comercial, expiração e bloqueio de acesso **não estão implementados**. Trocar apenas o CTA dos criativos não cria essa regra.

**Implementação mínima proposta:**

- Criar controle comercial separado dos dados financeiros: `pendente`, `ativo`, `suspenso`, `encerrado`; `user_id`, pagador (`individual` ou instituição identificada administrativamente), início e fim da autorização, referência da proposta e histórico de alterações. Guardar somente os dados comerciais necessários; não guardar comprovantes ou dados de cartão no banco do app.
- Impedir cadastro aberto ou mantê-lo apenas para solicitação de acesso, sem permitir lançamento/leitura de produção antes da ativação. A autorização deve ser verificada **no banco e nas políticas de acesso**, não só escondendo telas no frontend. Um link de cadastro não equivale a licença ativa.
- Permitir que somente um administrador operacional ative, suspenda ou encerre autorizações após conferência do pagamento. Usar operação administrativa protegida; nunca colocar chave `service_role` no navegador ou em build público.
- Manter RLS por médico nas tabelas de produção. O pagador institucional não ganha acesso aos registros clínicos/financeiros dos médicos; qualquer futuro compartilhamento exige autorização, modelo de dados e RLS específicos.
- Definir como o médico recebe convite, como vincular com segurança o e-mail da proposta à conta e como recuperar acesso. Testar cadastro pendente, ativação, vencimento, suspensão, reativação e isolamento A/B antes da primeira venda.

**Ordem prática:** fechar texto de proposta e termos comerciais → implementar e testar o bloqueio real → revisar/publicar termos, privacidade e suporte → só então anunciar “acesso liberado após pagamento” em campanha ampla. Enquanto isso, a mensagem pública segura é “Converse pelo WhatsApp para conhecer as condições de acesso”.

## Mensagens prontas para atendimento

**Resposta B2C:** “Olá! O HonorMed ajuda você a registrar Consultas e/ou Laudos por quantidade, acompanhar o valor previsto com os honorários que cadastrou e conferir os recebimentos que informar. Posso entender sua rotina e mostrar uma demonstração? Depois envio as condições de acesso por escrito.”

**Resposta B2B:** “Olá! Podemos conversar sobre acessos individuais do HonorMed custeados pela sua instituição. Quantos médicos participariam e quais módulos interessam: Consultas, Laudos ou ambos? Com isso preparo uma proposta de escopo e valores. O produto atual mantém os dados de cada médico separados e não inclui painel institucional ou integração hospitalar.”

**Após pagamento confirmado:** “Pagamento confirmado para a proposta [referência]. Vamos liberar o acesso da conta [e-mail do médico] para o período [início–fim] e enviar as instruções de entrada. Se precisar de suporte, responda por este canal.” Enviar apenas depois de a regra técnica de liberação estar operante.

## Ajustes nos materiais existentes

- Os criativos levam para `https://wa.me/5591982837769`, com chamadas distintas para médico e instituição.
- A página Planos, a apresentação e o guia do apresentador ainda falam em Free/Pro e em cobrança futura. Devem ser alinhados ao modelo de venda assistida antes de uma campanha de aquisição.
- Termos e privacidade atuais são rascunhos e ainda dizem que não há contratação ativa. Revisar e publicar as condições reais antes de cobrar ou ampliar a divulgação.
