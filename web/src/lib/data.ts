import { createClient } from "@supabase/supabase-js";
export const supabase =
  process.env.NEXT_PUBLIC_SUPABASE_URL &&
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    ? createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      )
    : null;
export type Row = {
  id: string;
  cd_atendimento: string;
  convenio_id: string;
  convenio_nome: string;
  data_atendimento: string;
  competencia: string;
  procedimento: string;
  status: string;
  origem: string;
  regra_id: string | null;
  valor_consulta_calc: number | string;
  valor_repasse_calc: number | string | null;
  valor_bruto: number | string | null;
  modo: string | null;
  percentual: number | string;
  valor_honorario: number | string;
  deducao_pct: number | string;
};
export type Rule = {
  id: string;
  convenio_id: string;
  tipo_procedimento: string;
  modo: string;
  valor_consulta: number | string;
  valor_honorario: number | string;
  percentual: number | string;
  deducao_pct: number | string;
  vigencia_ini: string;
  vigencia_fim: string | null;
};
export type Dataset = {
  profile: {
    medico_id: string;
    nome: string;
    crm: string;
    cd_prestador_mv: string;
  }[];
  convenios: { id: string; nome: string }[];
  rules: Rule[];
  rows: Row[];
  summaries: {
    competencia: string;
    previsto: number | string;
    pago: number | string;
    glosado: number | string;
    realizado: number | string;
    sem_regra: number | string;
    quantidade: number | string;
  }[];
  goals: { competencia: string; valor: number | string }[];
};
export async function fetchData(): Promise<Dataset> {
  if (!supabase) {
    const response = await fetch("/api/demo");
    if (!response.ok)
      throw new Error("Não foi possível carregar a demonstração.");
    return response.json();
  }
  const tables = {
    profile: "medicos",
    convenios: "convenios",
    rules: "regras_repasse",
    rows: "atendimentos_calculados",
    summaries: "repasses_competencia",
    goals: "metas",
  };
  const results = await Promise.all(
    Object.entries(tables).map(async ([k, t]) => {
      const { data, error } = await supabase.from(t).select("*");
      if (error) throw error;
      return [k, data];
    }),
  );
  return Object.fromEntries(results) as Dataset;
}
export async function mutate(
  table: "regras_repasse" | "atendimentos" | "metas",
  action: "insert" | "update" | "delete" | "upsert",
  values: Record<string, unknown> | Record<string, unknown>[],
  id?: string,
) {
  if (!supabase) {
    const r = await fetch("/api/demo", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ table, action, values, id }),
    });
    const body = await r.json();
    if (!r.ok) throw new Error(body.error);
    return;
  }
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Sessão expirada. Entre novamente.");
  const stamped = (Array.isArray(values) ? values : [values]).map((v) => ({
    ...v,
    medico_id: user.id,
  }));
  const q = supabase.from(table);
  const query =
    action === "delete"
      ? q.delete().eq("id", id)
      : action === "update"
        ? q.update(stamped[0]).eq("id", id)
        : action === "upsert"
          ? q.upsert(stamped, {
              onConflict:
                table === "metas"
                  ? "medico_id,competencia"
                  : "medico_id,cd_atendimento",
            })
          : q.insert(stamped);
  const { error } = await query;
  if (error) throw error;
}
