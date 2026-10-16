import { PLANS } from "@/lib/plans";
import { money } from "@/lib/utils";
import { Button } from "@/components/ui/button";
export default function PlansPreview() {
  return (
    <section>
      <div className="plans-intro">
        <span className="eyebrow">SEU PERFIL, SEU CONTROLE</span>
        <h2>Consultas, Laudos ou ambos.</h2>
        <p className="muted">
          Proposta comercial atualizada. Você escolhe os módulos; radiologistas
          não precisam usar Consultas. Sem cobrança ativa no MVP.
        </p>
      </div>
      <div className="plan-grid">
        {[
          {
            name: "Free",
            price: money(PLANS.free),
            items: [
              "Um local de atendimento",
              "Mês atual",
              "Controle básico no módulo escolhido",
            ],
          },
          {
            name: "Pro",
            price: money(PLANS.pro) + "/mês",
            items: [
              "Consultas, Laudos ou ambos",
              "Múltiplos locais e tipos de exame",
              "Produção, recebimentos e histórico registrado",
            ],
          },
        ].map((p) => (
          <article
            className={"card plan " + (p.name === "Pro" ? "featured" : "")}
            key={p.name}
          >
            <span className="eyebrow">{p.name}</span>
            <h2>
              {p.name === "Pro" ? "Seu controle completo" : "Para conhecer"}
            </h2>
            <strong>{p.price}</strong>
            <ul>
              {p.items.map((i) => (
                <li key={i}>✓ {i}</li>
              ))}
            </ul>
            <Button disabled>
              {p.name === "Pro"
                ? "Preço proposto · sem cobrança"
                : "MVP com recursos liberados"}
            </Button>
          </article>
        ))}
      </div>
      <p className="footnote">
        Plano institucional sugerido: {money(PLANS.institutional)}/mês para até{" "}
        {PLANS.institutionalDoctors} médicos, com implantação inicial de
        referência de {money(PLANS.setup)} sujeita a escopo. Integração
        hospitalar não está automaticamente incluída. Preços, limites e
        contratação ainda serão validados; não são tarifas de laudos ou garantia
        de retorno.
      </p>
    </section>
  );
}
