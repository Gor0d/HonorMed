import { NextRequest, NextResponse } from "next/server";
import { database, physician } from "@/lib/demo-database";
export const runtime = "nodejs";
let pending: ReturnType<typeof database> | undefined;
const allowed = (r: NextRequest) =>
  !process.env.VERCEL &&
  process.env.HONORMED_REQUIRE_SUPABASE !== "true" &&
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
    result[k] = (
      await conn.query<Record<string, unknown>>(`select * from ${t}`)
    ).rows.map((row) =>
      Object.fromEntries(
        Object.entries(row).map(([column, value]) => [
          column,
          [
            "data_atendimento",
            "vigencia_ini",
            "vigencia_fim",
            "data_producao",
            "data_recebimento",
          ].includes(column) && value instanceof Date
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
    if (table === "__conta") {
      if (
        id ||
        !["exportar_meus_dados", "excluir_minha_conta"].includes(action)
      )
        throw new Error("Operação de conta inválida.");
      const conn = await db();
      const result = await conn.transaction(async (tx) => {
        await tx.exec("set local role authenticated");
        await tx.query("select set_config('request.jwt.claim.sub',$1,true)", [
          physician,
        ]);
        return action === "exportar_meus_dados"
          ? (
              await tx.query<{ dados: unknown }>(
                "select public.exportar_meus_dados() as dados",
              )
            ).rows[0].dados
          : (await tx.query("select public.excluir_minha_conta($1)", [
              values?.confirmacao,
            ]),
            { ok: true });
      });
      return NextResponse.json(result, {
        headers: { "Cache-Control": "no-store" },
      });
    }
    const columns: Record<string, string[]> = {
      preferencias_produto: ["perfil_uso"],
      laudos_tipos: ["id", "nome"],
      laudos_valores: ["local_id", "tipo_id", "valor_unitario"],
      laudos_producao: [
        "id",
        "local_id",
        "tipo_id",
        "data_producao",
        "quantidade",
      ],
      laudos_recebimentos: [
        "id",
        "local_id",
        "competencia",
        "data_recebimento",
        "valor",
      ],
      locais_atendimento: ["id", "nome"],
      convenios: ["id", "nome"],
      honorarios_pessoais: ["local_id", "convenio_id", "valor_unitario"],
      producoes_pessoais: [
        "id",
        "local_id",
        "convenio_id",
        "data_producao",
        "quantidade",
      ],
      recebimentos_pessoais: [
        "id",
        "local_id",
        "convenio_id",
        "competencia",
        "data_recebimento",
        "valor",
      ],
      regras_repasse: [
        "convenio_id",
        "local_id",
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
        if (value.origem === "confirmado_hospital")
          throw new Error(
            "Uma informação pessoal não pode ser confirmada pelo hospital por este formulário.",
          );
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
