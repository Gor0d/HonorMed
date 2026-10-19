import type { Dataset } from "./data";
export function firstUseSteps(data: Dataset, module: "consultas" | "laudos") {
  const radiology = module === "laudos";
  return [
    { label: "Perfil", done: data.profile.length > 0 },
    { label: "Local de atendimento", done: data.locations.length > 0 },
    {
      label: radiology ? "Tipo de exame" : "Convênio ou Particular",
      done: (radiology ? data.radiologyTypes : data.convenios).length > 0,
    },
    {
      label: "Honorário (pode informar depois)",
      done: (radiology ? data.radiologyFees : data.fees).length > 0,
    },
    {
      label: "Primeiro registro",
      done: (radiology ? data.radiologyProduction : data.production).length > 0,
    },
  ];
}
