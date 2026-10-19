# HonorMed — estado atual

Revisão de 19/10/2026. Este resumo prevalece sobre propostas históricas. Operação e evidências: [LANCAMENTO](LANCAMENTO.md). Arquitetura: [PLANO](PLANO.md).

- **Produto:** controle pessoal individual de Consultas e Laudos, juntos ou separados. Registro por quantidade/local, honorários conhecidos ou pendentes, recebimentos informados pelo médico e saldo estimado. Nenhum dado de paciente, imagem ou texto de laudo. Não é confirmação hospitalar/bancária.
- **Oferta proposta:** R$ 79,90/mês por médico, um ou ambos os módulos pelo mesmo preço. Fonte: `web/src/lib/plans.ts`. Sem cobrança, trial, contratação ou limites automáticos. Free e Institucional são propostas históricas retiradas dos materiais atuais; equipes não estão disponíveis.
- **Publicado, conforme registro anterior:** piloto no Cloudflare Workers com Supabase exclusivo, RLS individual e cálculo SQL. Titular relatou confirmação/recuperação de e-mail em 17/10 e uso da extensão em 18/10. Não houve nova inspeção remota nesta revisão.
- **Preparado, ainda não publicado:** páginas legais/novos e-mails; B1 exportação/exclusão da própria conta, B2 primeiro uso guiado, B3 feedback, B4 métricas opt-in, B5 runbooks e B6 alinhamento de materiais. B1–B6 estão em branches/PRs separados e encadeados, aguardando revisão; não são recursos já disponíveis no piloto hospedado.
- **Antes de ampliar:** revisar/mesclar PRs em ordem; aprovar termos/privacidade e retenção; substituir credencial Resend por canal seguro; autorizar migrations/deploy e homologar Auth, conta, métricas e e-mails; testar restauração e PWA físico; definir domínio, suporte e contratação. Nenhuma dessas operações foi executada nesta entrega.
- **Condicionais:** B7 só após decisão de cobrar no piloto; B8 só após validar regras reais de cirurgias. Oracle/MV, organizações/equipes e cobrança automática continuam fora do escopo atual. Ver [ROADMAP](ROADMAP.md).

Preços não comprovam rentabilidade. Medir custos de infraestrutura/envio, suporte, aquisição, tributos e disposição a pagar antes de fixar oferta. Histórico de propostas separado em [historico](historico/README.md).
