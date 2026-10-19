import { it, expect } from "vitest";
import { firstUseSteps } from "../src/lib/first-use";
import type { Dataset } from "../src/lib/data";
const empty = () =>
  ({
    profile: [],
    locations: [],
    convenios: [],
    fees: [],
    production: [],
    radiologyTypes: [],
    radiologyFees: [],
    radiologyProduction: [],
  }) as unknown as Dataset;
it("deriva etapas sem persistir estado financeiro ou exigir consulta de radiologista", () => {
  const data = empty();
  data.profile = [
    { medico_id: "a", nome: "Teste", crm: "TESTE", cd_prestador_mv: "" },
  ];
  data.locations = [{ id: "l", nome: "Local de teste" }];
  data.radiologyTypes = [{ id: "t", nome: "Exame de teste" }];
  expect(firstUseSteps(data, "laudos").map((s) => s.done)).toEqual([
    true,
    true,
    true,
    false,
    false,
  ]);
  expect(firstUseSteps(data, "consultas")[2].done).toBe(false);
});
it("honorário é opcional para registrar, e checklist termina com produção do módulo escolhido", () => {
  const data = empty();
  data.production = [{ id: "r" }] as Dataset["production"];
  expect(firstUseSteps(data, "consultas")[4].done).toBe(true);
  expect(firstUseSteps(data, "laudos")[4].done).toBe(false);
  expect(firstUseSteps(data, "consultas")[3].done).toBe(false);
});
