import { PGlite } from "@electric-sql/pglite";
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";

export const accountA = "11111111-1111-4111-8111-111111111111";
export const accountB = "99999999-9999-4999-8999-999999999999";
export const accountTables = [
  "medicos",
  "locais",
  "convenios",
  "regras_repasse",
  "atendimentos",
  "recebimentos",
  "honorarios_pessoais",
  "metas",
  "sync_log",
  "preferencias_produto",
  "laudos_tipos",
  "laudos_valores",
  "laudos_producao",
  "laudos_recebimentos",
];

// Isolated test fixtures: does not import or read supabase/seed.sql.
export async function accountFixture() {
  const db = new PGlite();
  await db.exec(`create role authenticated nologin; create role anon nologin;
    create schema auth; create table auth.users(id uuid primary key);
    create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
    grant usage on schema auth,public to authenticated,anon;
    grant execute on function auth.uid() to authenticated,anon;`);
  const migrations = path.resolve(process.cwd(), "../supabase/migrations");
  for (const file of (await readdir(migrations))
    .filter((f) => f.endsWith(".sql"))
    .sort())
    await db.exec(await readFile(path.join(migrations, file), "utf8"));
  for (const [index, physician] of [accountA, accountB].entries()) {
    await db.query("insert into auth.users values($1)", [physician]);
    await db.query(
      "insert into public.medicos(medico_id,nome,crm)values($1,$2,$3)",
      [physician, index ? "Conta teste B" : "=SOMA(1;2)", `TESTE-${index}`],
    );
    const local = (
      await db.query<{ id: string }>(
        "insert into locais(medico_id,nome)values($1,'Local de teste')returning id",
        [physician],
      )
    ).rows[0].id;
    const convenio = (
      await db.query<{ id: string }>(
        "insert into convenios(medico_id,nome)values($1,'Particular de teste')returning id",
        [physician],
      )
    ).rows[0].id;
    const tipo = (
      await db.query<{ id: string }>(
        "insert into laudos_tipos(medico_id,nome)values($1,'Exame de teste')returning id",
        [physician],
      )
    ).rows[0].id;
    await db.query(
      "insert into preferencias_produto(medico_id,perfil_uso)values($1,'ambos')",
      [physician],
    );
    await db.query(
      "insert into honorarios_pessoais(medico_id,local_id,convenio_id,valor_unitario)values($1,$2,$3,10)",
      [physician, local, convenio],
    );
    await db.query(
      "insert into producoes_pessoais(id,medico_id,local_id,convenio_id,data_producao,quantidade)values(gen_random_uuid(),$1,$2,$3,'2026-10-19',5)",
      [physician, local, convenio],
    );
    await db.query(
      "insert into recebimentos_pessoais(medico_id,local_id,convenio_id,competencia,data_recebimento,valor)values($1,$2,$3,'2026-10','2026-11-05',5)",
      [physician, local, convenio],
    );
    await db.query(
      "insert into laudos_valores(medico_id,local_id,tipo_id,valor_unitario)values($1,$2,$3,20)",
      [physician, local, tipo],
    );
    await db.query(
      "insert into laudos_producao(medico_id,local_id,tipo_id,data_producao,quantidade)values($1,$2,$3,'2026-10-19',2)",
      [physician, local, tipo],
    );
    await db.query(
      "insert into laudos_recebimentos(medico_id,local_id,competencia,data_recebimento,valor)values($1,$2,'2026-10','2026-11-05',10)",
      [physician, local],
    );
    await db.query(
      "insert into regras_repasse(medico_id,convenio_id,modo,valor_consulta,valor_honorario,vigencia_ini)values($1,$2,'fixo',100,10,'2026-01-01')",
      [physician, convenio],
    );
    await db.query(
      "insert into metas(medico_id,competencia,valor)values($1,'2026-10',100)",
      [physician],
    );
    await db.query("insert into sync_log(medico_id,linhas)values($1,0)", [
      physician,
    ]);
  }
  return db;
}
export async function asAccount(
  db: PGlite,
  physician: string | null,
  work: () => Promise<unknown>,
) {
  await db.exec("set role authenticated");
  await db.query("select set_config('request.jwt.claim.sub',$1,false)", [
    physician || "",
  ]);
  try {
    return await work();
  } finally {
    await db.exec("reset role");
  }
}
