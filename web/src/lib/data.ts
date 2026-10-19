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
  local_id: string | null;
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
  preferences: { id: string; perfil_uso: "consultas" | "laudos" | "ambos" }[];
  radiologyTypes: { id: string; nome: string }[];
  radiologyFees: {
    id: string;
    local_id: string;
    tipo_id: string;
    valor_unitario: string | number;
  }[];
  radiologyProduction: RadiologyProduction[];
  radiologyReceipts: {
    id: string;
    local_id: string;
    competencia: string;
    data_recebimento: string;
    valor: string | number;
  }[];
  radiologySummaries: PersonalSummary[];
  radiologyLocations: (PersonalSummary & {
    local_id: string;
    diferenca: string | number;
  })[];
  radiologyTypeSummaries: {
    competencia: string;
    tipo_id: string;
    tipo_nome: string;
    quantidade: string | number;
    produzido: string | number;
  }[];
  locations: { id: string; nome: string }[];
  fees: {
    id: string;
    local_id: string;
    convenio_id: string;
    valor_unitario: string | number;
  }[];
  production: PersonalProduction[];
  receipts: PersonalReceipt[];
  personalSummaries: PersonalSummary[];
  locationSummaries: (PersonalSummary & { local_id: string })[];
  reconciliation: (PersonalSummary & {
    local_id: string;
    convenio_id: string | null;
    diferenca: string | number;
    conferir_diferenca: boolean;
  })[];
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
export type RadiologyProduction = {
  id: string;
  local_id: string;
  tipo_id: string;
  local_nome: string;
  tipo_nome: string;
  data_producao: string;
  competencia: string;
  quantidade: number;
  valor_unitario: string | number | null;
  valor_previsto: string | number | null;
  fonte: string;
  created_at: string;
};
export type PersonalProduction = {
  created_at: string;
  id: string;
  local_id: string;
  convenio_id: string;
  local_nome: string;
  convenio_nome: string;
  data_producao: string;
  competencia: string;
  quantidade: number;
  valor_unitario: number | string | null;
  valor_previsto: number | string | null;
  fonte: string;
};
export type PersonalReceipt = {
  id: string;
  local_id: string;
  convenio_id: string | null;
  competencia: string;
  data_recebimento: string;
  valor: number | string;
};
export type PersonalSummary = {
  competencia: string;
  quantidade: number | string;
  produzido: number | string;
  sem_valor: number | string;
  recebido: number | string;
  a_receber: number | string;
  acima_previsto: number | string;
};
export async function fetchData(): Promise<Dataset> {
  if (!supabase) {
    const response = await fetch("/api/demo");
    if (!response.ok)
      throw new Error("Não foi possível carregar a demonstração.");
    return response.json();
  }
  const tables = {
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
  };
  const results = await Promise.all(
    Object.entries(tables).map(async ([k, t]) => {
      const collected: unknown[] = [];
      for (let offset = 0; ; offset += 1000) {
        let query = supabase!.from(t).select("*");
        if (k === "profile") query = query.order("medico_id");
        else if (
          [
            "summaries",
            "personalSummaries",
            "locationSummaries",
            "reconciliation",
            "radiologySummaries",
            "radiologyLocations",
            "radiologyTypeSummaries",
          ].includes(k)
        ) {
          query = query.order("competencia");
          if (
            k === "locationSummaries" ||
            k === "reconciliation" ||
            k === "radiologyLocations"
          )
            query = query.order("local_id");
          if (k === "radiologyTypeSummaries") query = query.order("tipo_id");
          if (k === "reconciliation") query = query.order("convenio_id");
        } else query = query.order("id");
        const { data, error } = await query.range(offset, offset + 999);
        if (error) throw error;
        collected.push(...data);
        if (data.length < 1000) break;
      }
      return [k, collected];
    }),
  );
  return Object.fromEntries(results) as Dataset;
}
export async function mutate(
  table:
    | "regras_repasse"
    | "atendimentos"
    | "metas"
    | "locais_atendimento"
    | "convenios"
    | "honorarios_pessoais"
    | "producoes_pessoais"
    | "recebimentos_pessoais"
    | "preferencias_produto"
    | "laudos_tipos"
    | "laudos_valores"
    | "laudos_producao"
    | "laudos_recebimentos",
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
  if (error) {
    // No message, financial payload or category is sent; SQL checks opt-in.
    void supabase.rpc("registrar_erro_piloto").then(() => undefined, () => undefined);
    throw error;
  }
}
