import { NextRequest, NextResponse } from "next/server";
import { database, physician } from "../../../../scripts/database.mjs";
export const runtime = "nodejs";
let pending: ReturnType<typeof database> | undefined;
const allowed = (r: NextRequest) =>
  !process.env.NEXT_PUBLIC_SUPABASE_URL &&
  ["localhost", "127.0.0.1"].includes(
    (r.headers.get("host") || "").split(":")[0],
  );
async function db() {
  pending ??= database();
  return pending;
}
export async function GET(request: NextRequest) {
  if (!allowed(request))
    return NextResponse.json(
      {
        error: "Demo disponível apenas localmente e sem Supabase configurado.",
      },
      { status: 403 },
    );
  const conn = await db();
  const result: Record<string, unknown> = {};
  for (const [k, t] of Object.entries({
    profile: "medicos",
    convenios: "convenios",
    rules: "regras_repasse",
    rows: "atendimentos_calculados",
    summaries: "repasses_competencia",
    goals: "metas",
  }))
    result[k] = (
      await conn.query<Record<string, unknown>>(`select * from ${t}`)
    ).rows.map((row) =>
      Object.fromEntries(
        Object.entries(row).map(([column, value]) => [
          column,
          ["data_atendimento", "vigencia_ini", "vigencia_fim"].includes(
            column,
          ) && value instanceof Date
            ? value.toISOString().slice(0, 10)
            : value,
        ]),
      ),
    );
  return NextResponse.json(result, {
    headers: { "Cache-Control": "no-store" },
  });
}
export async function POST(request: NextRequest) {
  if (!allowed(request))
    return NextResponse.json({ error: "Demo desabilitada." }, { status: 403 });
  if (
    request.headers.get("origin") !==
    `${request.nextUrl.protocol}//${request.headers.get("host")}`
  )
    return NextResponse.json({ error: "Origem inválida." }, { status: 403 });
  try {
    const { table, action, values, id } = await request.json();
    const columns: Record<string, string[]> = {
      regras_repasse: [
        "convenio_id",
        "tipo_procedimento",
        "modo",
        "valor_consulta",
        "valor_honorario",
        "percentual",
        "deducao_pct",
        "vigencia_ini",
        "vigencia_fim",
      ],
      atendimentos: [
        "cd_atendimento",
        "convenio_id",
        "data_atendimento",
        "status",
        "competencia",
        "procedimento",
        "origem",
        "valor_consulta",
        "glosa_pct",
      ],
      metas: ["competencia", "valor"],
    };
    if (
      !columns[table] ||
      !["insert", "update", "delete", "upsert"].includes(action)
    )
      throw new Error("Operação inválida");
    const list = Array.isArray(values) ? values : [values];
    if (list.length > 1000)
      throw new Error("Limite de 1.000 linhas por importação.");
    const conn = await db();
    // Entire import is atomic. No patient field is accepted by this allowlist.
    await conn.transaction(async (tx) => {
      if (action === "delete") {
        await tx.query(`delete from ${table} where id=$1 and medico_id=$2`, [
          id,
          physician,
        ]);
        return;
      }
      for (const value of list) {
        const keys = Object.keys(value).filter((k) =>
          columns[table].includes(k),
        );
        if (!keys.length) throw new Error("Dados vazios");
        const params = keys.map((k) => value[k]);
        if (action === "update")
          await tx.query(
            `update ${table} set ${keys.map((k, i) => `${k}=$${i + 1}`).join(",")} where id=$${keys.length + 1} and medico_id=$${keys.length + 2}`,
            [...params, id, physician],
          );
        else
          await tx.query(
            `insert into ${table}(medico_id,${keys.join(",")}) values($1,${keys.map((_, i) => `$${i + 2}`).join(",")}) ${action === "upsert" ? `on conflict(medico_id,${table === "metas" ? "competencia" : "cd_atendimento"}) do update set ${keys.map((k) => `${k}=excluded.${k}`).join(",")}` : ""}`,
            [physician, ...params],
          );
      }
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Falha ao salvar" },
      { status: 400 },
    );
  }
}
