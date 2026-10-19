import { PLANS } from "@/lib/plans";
import { money } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export default function PlansPreview() {
  return (
    <section aria-label="Proposta individual">
      <div className="plans-intro">
        <span className="eyebrow">SEU PERFIL, SEU CONTROLE</span>
        <h2>Consultas, Laudos ou ambos.</h2>
        <p className="muted">
          Uma proposta para o médico acompanhar sua própria produção e seus
          recebimentos.
        </p>
      </div>
      <article className="card plan featured">
        <span className="eyebrow">Individual · preço proposto</span>
        <h2>Seu controle pessoal</h2>
        <strong>{money(PLANS.individual)}/mês por médico</strong>
        <ul>
          <li>Consultas e Laudos pelo mesmo preço</li>
          <li>Múltiplos locais, honorários e tipos de exame</li>
          <li>Produção, recebimentos informados e histórico</li>
        </ul>
        <Button disabled>Proposta em validação · sem cobrança ativa</Button>
      </article>
      <p className="footnote">
        Não há contratação, trial ou limites por plano no aplicativo. Equipes,
        clínicas e instituições estão no roadmap, sem oferta disponível.
        Integração hospitalar não está incluída.
      </p>
    </section>
  );
}
