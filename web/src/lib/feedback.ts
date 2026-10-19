import { SUPPORT_EMAIL } from "./legal";
export const feedbackKinds = [
  "Dificuldade de uso",
  "Sugestão",
  "Erro no aplicativo",
] as const;
export function feedbackHref(kind: string) {
  if (!feedbackKinds.some((value) => value === kind))
    throw new Error("Tipo de feedback inválido");
  const url = new URL(`mailto:${SUPPORT_EMAIL}`);
  url.searchParams.set("subject", "HonorMed · Feedback");
  url.searchParams.set(
    "body",
    `Tipo: ${kind}\n\nDescreva sua experiência sem incluir valores, nomes de locais, pacientes, documentos, senha ou tokens.`,
  );
  return url.toString();
}
