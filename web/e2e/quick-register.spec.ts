import { test, expect, type APIRequestContext } from "@playwright/test";
import type { Dataset } from "../src/lib/data";

const origin = `http://127.0.0.1:${process.env.PLAYWRIGHT_TEST_PORT || "3100"}`;
const load = async (request: APIRequestContext): Promise<Dataset> =>
  (await request.get("/api/demo")).json();
async function change(request: APIRequestContext, table: string, action: string, values: Record<string, unknown>, id?: string) {
  const response = await request.post("/api/demo", { headers: { origin }, data: { table, action, values, id } });
  expect(response.ok(), `${table} ${action}: ${await response.text()}`).toBe(true);
}
const formatted = (value: number | string) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(value));

test("registro de consultas usa o valor SQL, repete com confirmação e desfaz", async ({ page, request }, info) => {
  const before = await load(request);
  const fee = before.fees[0];
  const created: string[] = [];
  try {
    await page.goto("/");
    await page.getByRole("button", { name: "Entrar", exact: true }).click();
    await page.goto("/registrar?modulo=consultas");
    await expect(page.getByRole("heading", { name: "Registrar consultas" })).toBeVisible();
    await page.getByLabel("Data da produção").fill("2026-10-20");
    await page.getByLabel("Local de atendimento").selectOption(fee.local_id);
    await page.getByLabel("Convênio").selectOption(fee.convenio_id);
    await page.getByLabel("Quantidade", { exact: true }).fill("2");
    await page.getByRole("button", { name: "Salvar registro" }).click();
    await expect(page.getByText("2 consultas registradas")).toBeVisible();
    let data = await load(request);
    const first = data.production.find((row) => !before.production.some((old) => old.id === row.id));
    expect(first).toBeDefined();
    created.push(first!.id);
    await expect(page.getByText(`Valor previsto: ${formatted(first!.valor_previsto!)}`)).toBeVisible();
    await page.screenshot({ path: `test-results/quick-register-${info.project.name}.png`, fullPage: true });
    await page.getByRole("button", { name: "Repetir último" }).click();
    await expect(page.getByText(/Confira módulo, local, data e quantidade/)).toBeVisible();
    expect((await load(request)).production.length).toBe(data.production.length);
    await page.getByRole("button", { name: "Confirmar repetição e salvar" }).click();
    data = await load(request);
    const repeated = data.production.find((row) => !before.production.some((old) => old.id === row.id) && row.id !== first!.id);
    expect(repeated).toBeDefined();
    created.push(repeated!.id);
    await page.getByRole("button", { name: "Desfazer lançamento" }).click();
    await page.getByRole("button", { name: "Confirmar desfazer" }).click();
    await expect(page.getByText("Último lançamento desfeito.")).toBeVisible();
    expect((await load(request)).production.some((row) => row.id === repeated!.id)).toBe(false);
    created.pop();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  } finally {
    for (const id of created) await change(request, "producoes_pessoais", "delete", {}, id);
  }
});

test("consulta sem honorário fica pendente e formulário mantém valores até salvar", async ({ page, request }) => {
  const local = crypto.randomUUID(), convenio = crypto.randomUUID();
  let produced: string | undefined;
  try {
    await change(request, "locais_atendimento", "insert", { id: local, nome: "Local rápido fictício" });
    await change(request, "convenios", "insert", { id: convenio, nome: "Convênio rápido fictício" });
    await page.goto("/");
    await page.getByRole("button", { name: "Entrar", exact: true }).click();
    await page.goto("/registrar");
    await page.getByLabel("Data da produção").fill("2026-10-21");
    await page.getByLabel("Local de atendimento").selectOption(local);
    await page.getByLabel("Convênio").selectOption(convenio);
    await page.getByLabel("Quantidade", { exact: true }).fill("3");
    await page.getByRole("button", { name: "Salvar registro" }).click();
    await expect(page.getByText("Valor pendente")).toBeVisible();
    const row = (await load(request)).production.find((item) => item.local_id === local && item.convenio_id === convenio);
    expect(row?.valor_previsto).toBeNull();
    produced = row?.id;
  } finally {
    if (produced) await change(request, "producoes_pessoais", "delete", {}, produced);
    await change(request, "convenios", "delete", {}, convenio);
    await change(request, "locais_atendimento", "delete", {}, local);
  }
});

test("perfil somente laudos ignora atalho de consultas e exibe cálculo SQL", async ({ page, request }) => {
  const before = await load(request);
  const preference = before.preferences[0];
  let produced: string | undefined;
  try {
    await change(request, "preferencias_produto", "update", { perfil_uso: "laudos" }, preference.id);
    await page.goto("/");
    await page.getByRole("button", { name: "Entrar", exact: true }).click();
    await page.goto("/registrar?modulo=consultas");
    await expect(page.getByRole("heading", { name: "Registrar laudos" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Consultas", exact: true })).toHaveCount(0);
    const fee = before.radiologyFees[0];
    await page.getByLabel("Data da produção").fill("2026-10-22");
    await page.getByLabel("Instituição").selectOption(fee.local_id);
    await page.getByLabel("Tipo de exame").selectOption(fee.tipo_id);
    await page.getByLabel("Quantidade", { exact: true }).fill("4");
    await page.getByRole("button", { name: "Salvar registro" }).click();
    const row = (await load(request)).radiologyProduction.find((item) => !before.radiologyProduction.some((old) => old.id === item.id));
    expect(row).toBeDefined();
    produced = row!.id;
    await expect(page.getByText(`Valor previsto: ${formatted(row!.valor_previsto!)}`)).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  } finally {
    if (produced) await change(request, "laudos_producao", "delete", {}, produced);
    await change(request, "preferencias_produto", "update", { perfil_uso: preference.perfil_uso }, preference.id);
  }
});

test("data padrão usa São Paulo às 22:30, Esc limpa e Enter salva", async ({ page, request }) => {
  const before = await load(request);
  let produced: string | undefined;
  try {
    await page.clock.install({ time: new Date("2026-10-18T01:30:00Z") });
    await page.goto("/");
    await page.getByRole("button", { name: "Entrar", exact: true }).click();
    await page.goto("/registrar");
    await expect(page.getByLabel("Data da produção")).toHaveValue("2026-10-17");
    await expect(page.getByLabel("Quantidade", { exact: true })).toBeFocused();
    await page.getByLabel("Quantidade", { exact: true }).fill("7");
    await page.getByLabel("Quantidade", { exact: true }).press("Escape");
    await expect(page.getByLabel("Quantidade", { exact: true })).toHaveValue("1");
    await expect(page.getByLabel("Data da produção")).toHaveValue("2026-10-17");
    await page.getByLabel("Quantidade", { exact: true }).press("Enter");
    await expect(page.getByText("1 consulta registrada")).toBeVisible();
    await expect(page.getByLabel("Quantidade", { exact: true })).toHaveValue("");
    await page.getByLabel("Quantidade", { exact: true }).press("Enter");
    await expect(page.getByText("1 consulta registrada")).toBeVisible();
    expect((await load(request)).production.length).toBe(before.production.length + 1);
    produced = (await load(request)).production.find((row) => !before.production.some((old) => old.id === row.id))?.id;
    expect(produced).toBeDefined();
    await page.goto("/?area=ajustes&modulo=consultas");
    await expect(page.getByRole("button", { name: "Adicionar local" })).toBeVisible();
  } finally {
    if (produced) await change(request, "producoes_pessoais", "delete", {}, produced);
  }
});
