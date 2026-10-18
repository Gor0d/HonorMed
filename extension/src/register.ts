import type { SupabaseClient } from "@supabase/supabase-js";

export type Module = "consultas" | "laudos";
export type Profile = Module | "ambos";
export type Option = { id: string; nome: string };
export type Catalog = { profile: Profile | null; locations: Option[]; convenios: Option[]; types: Option[] };
export type Draft = { module: Module; local_id: string; convenio_id?: string; tipo_id?: string; quantidade: number; data_producao: string };
export type Last = Pick<Draft, "module" | "local_id" | "quantidade"> & { convenio_id?: string; tipo_id?: string };
export type Result = { id: string; medico_id: string; quantidade: number; valor_previsto: number | string | null; fonte: string };

export function today(date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}
export function allowed(profile: Profile | null, module: Module): boolean {
  return profile === "ambos" || profile === module;
}
export function payload(draft: Draft, userId: string, id: string) {
  const shared = { id, medico_id: userId, local_id: draft.local_id, data_producao: draft.data_producao, quantidade: draft.quantidade };
  return draft.module === "consultas" ? { ...shared, convenio_id: draft.convenio_id } : { ...shared, tipo_id: draft.tipo_id };
}
export function validate(draft: Draft, catalog: Catalog): string | null {
  if (!allowed(catalog.profile, draft.module)) return "Escolha seu perfil de uso no HonorMed antes de registrar.";
  const max = draft.module === "consultas" ? 1000 : 10000;
  if (!Number.isInteger(draft.quantidade) || draft.quantidade < 1 || draft.quantidade > max) return `Informe uma quantidade inteira de 1 a ${max.toLocaleString("pt-BR")}.`;
  const parsed = new Date(`${draft.data_producao}T12:00:00`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(draft.data_producao) || Number.isNaN(parsed.getTime()) || today(parsed) !== draft.data_producao) return "Informe uma data válida.";
  if (!catalog.locations.some((item) => item.id === draft.local_id) || !(draft.module === "consultas" ? catalog.convenios.some((item) => item.id === draft.convenio_id) : catalog.types.some((item) => item.id === draft.tipo_id))) return "Esta opção não está mais disponível. Atualize a lista e selecione outra.";
  return null;
}
export async function loadCatalog(client: SupabaseClient, userId: string): Promise<Catalog> {
  const [profile, locations, convenios, types] = await Promise.all([
    client.from("preferencias_produto").select("perfil_uso").eq("medico_id", userId).maybeSingle(),
    client.from("locais_atendimento").select("id,nome").eq("medico_id", userId).order("nome"),
    client.from("convenios").select("id,nome").eq("medico_id", userId).order("nome"),
    client.from("laudos_tipos").select("id,nome").eq("medico_id", userId).order("nome"),
  ]);
  for (const response of [profile, locations, convenios, types]) if (response.error) throw response.error;
  const choice = profile.data?.perfil_uso;
  return { profile: choice === "consultas" || choice === "laudos" || choice === "ambos" ? choice : null,
    locations: locations.data ?? [], convenios: convenios.data ?? [], types: types.data ?? [] };
}
export async function save(client: SupabaseClient, userId: string, draft: Draft, id = crypto.randomUUID()): Promise<{ id: string; result: Result | null }> {
  const table = draft.module === "consultas" ? "producoes_pessoais" : "laudos_producao";
  const view = draft.module === "consultas" ? "producao_pessoal_calculada" : "laudos_calculados";
  const inserted = await client.from(table).insert(payload(draft, userId, id) as Record<string, string | number | undefined>);
  if (inserted.error) throw inserted.error;
  const calculated = await client.from(view).select("id,medico_id,quantidade,valor_previsto,fonte").eq("id", id).eq("medico_id", userId).maybeSingle();
  if (calculated.error || !calculated.data) return { id, result: null };
  return { id, result: calculated.data as Result };
}
export async function undo(client: SupabaseClient, userId: string, module: Module, id: string): Promise<void> {
  const table = module === "consultas" ? "producoes_pessoais" : "laudos_producao";
  const deleted = await client.from(table).delete().eq("id", id).eq("medico_id", userId).select("id").single();
  if (deleted.error || deleted.data?.id !== id) throw deleted.error ?? new Error("Registro não removido.");
}
