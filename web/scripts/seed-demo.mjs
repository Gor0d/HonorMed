import { database } from "./database.mjs";
import { writeFile } from "node:fs/promises";
const db = await database();
const result = {};
for (const [key, table] of Object.entries({
  profile: "medicos",
  convenios: "convenios",
  rules: "regras_repasse",
  rows: "atendimentos_calculados",
  summaries: "repasses_competencia",
  goals: "metas",
}))
  result[key] = (await db.query(`select * from ${table}`)).rows;
await writeFile(
  new URL("../src/lib/demo.json", import.meta.url),
  JSON.stringify(result, null, 2),
);
await db.close();
console.log("Demo gerada pelas views PostgreSQL: 210 atendimentos.");
