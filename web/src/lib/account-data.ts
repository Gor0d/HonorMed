import { supabase } from "./data";

export type AccountExport = {
  versao: number;
  exportado_em: string;
  dados: Record<string, Record<string, unknown>[]>;
};

async function accountRpc(name: string, args: Record<string, unknown> = {}) {
  if (supabase) {
    const { data, error } = await supabase.rpc(name, args);
    if (error) throw new Error(error.message);
    return data;
  }
  const response = await fetch("/api/demo", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ table: "__conta", action: name, values: args }),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "Não foi possível concluir.");
  return data;
}
export async function exportOwnAccount(): Promise<AccountExport> {
  return accountRpc("exportar_meus_dados");
}
export async function deleteOwnAccount(confirmation: string) {
  await accountRpc("excluir_minha_conta", { confirmacao: confirmation });
}

// Long-form CSV preserves arbitrary table columns without mixing schemas.
// JSON is the lossless format; spreadsheet text is protected against formulas.
export function accountCsv(data: AccountExport): string {
  const cell = (value: unknown) => {
    let text =
      value == null
        ? ""
        : typeof value === "object"
          ? JSON.stringify(value)
          : String(value);
    if (/^[\s]*[=+\-@]|^[\t\r\n]/.test(text)) text = "'" + text;
    return '"' + text.replaceAll('"', '""') + '"';
  };
  const rows = [["tabela", "registro", "campo", "valor"]];
  for (const [table, records] of Object.entries(data.dados)) {
    for (const [index, record] of records.entries()) {
      for (const [field, value] of Object.entries(record)) {
        rows.push([
          table,
          String(record.id || record.medico_id || index),
          field,
          value as string,
        ]);
      }
    }
  }
  return "\uFEFF" + rows.map((row) => row.map(cell).join(";")).join("\r\n");
}
