import Link from "next/link";
import type { Dataset } from "@/lib/data";
import { firstUseSteps } from "@/lib/first-use";
export default function FirstUse({
  data,
  module,
}: {
  data: Dataset;
  module: "consultas" | "laudos";
}) {
  const steps = firstUseSteps(data, module);
  if (steps[4].done) return null;
  return (
    <section className="first-use" aria-label="Primeiros passos">
      <div>
        <strong>Comece com poucos toques</strong>
        <p className="muted">
          Configure o básico e registre sua produção. Se ainda não souber o
          honorário, pode informar depois.
        </p>
      </div>
      <ol>
        {steps.map((step, index) => (
          <li key={step.label}>
            <span aria-label={step.done ? "Concluído" : "Pendente"}>
              {step.done ? "✓" : index + 1}
            </span>{" "}
            {step.label}
          </li>
        ))}
      </ol>
      <div className="header-actions">
        <Link className="text-button" href={`/?area=ajustes&modulo=${module}`}>
          Configurar meu início
        </Link>
        <Link className="text-button" href={`/registrar?modulo=${module}`}>
          Fazer primeiro registro
        </Link>
      </div>
    </section>
  );
}
