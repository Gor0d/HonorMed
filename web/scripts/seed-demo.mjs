import { database } from "./database.mjs";
import { writeFile } from "node:fs/promises";
const db = await database();
const result = {};
for (const [key, table] of Object.entries({
  preferences: "preferencias_produto",
  radiologyTypes: "laudos_tipos",
  radiologyFees: "laudos_valores",
  radiologyProduction: "laudos_calculados",
  radiologyReceipts: "laudos_recebimentos",
  radiologySummaries: "laudos_resumo_competencia",
  radiologyLocations: "laudos_resumo_locais",
  radiologyTypeSummaries: "laudos_resumo_tipos",
  profile: "medicos",
  convenios: "convenios",
  rules: "regras_repasse",
  rows: "atendimentos_importados_calculados",
  summaries: "repasses_competencia",
  goals: "metas",
  locations: "locais_atendimento",
  fees: "honorarios_pessoais",
  production: "producao_pessoal_calculada",
  receipts: "recebimentos_pessoais",
  personalSummaries: "controle_pessoal_competencia",
  locationSummaries: "controle_pessoal_locais",
  reconciliation: "resumo_competencia",
}))
  result[key] = (await db.query(`select * from ${table}`)).rows;
await writeFile(
  new URL("../src/lib/demo.json", import.meta.url),
  JSON.stringify(result, null, 2),
);
await db.close();
console.log("Demo gerada pelas views PostgreSQL: 210 atendimentos.");
