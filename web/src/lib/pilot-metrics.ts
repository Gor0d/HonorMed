import { supabase } from "./data";
export type PilotMetrics = {
  ativo: boolean;
  semanas: {
    semana: string;
    dias_com_registro: number;
    registros: number;
    erros: number;
  }[];
};
export async function pilotRpc(
  action: "estado_metricas_piloto" | "definir_metricas_piloto",
  ativar?: boolean,
): Promise<PilotMetrics | void> {
  if (supabase) {
    const { data, error } = await supabase.rpc(
      action,
      action === "definir_metricas_piloto" ? { ativar } : {},
    );
    if (error) throw new Error(error.message);
    return data;
  }
  const response = await fetch("/api/demo", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ table: "__metricas", action, values: { ativar } }),
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || "Métricas indisponíveis");
  return result;
}
