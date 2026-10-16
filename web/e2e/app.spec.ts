import { test, expect } from "@playwright/test";
import type { Dataset } from "../src/lib/data";

test("regras CRUD e importação CSV recalculam em SQL", async ({
  page,
  request,
}, info) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Entrar", exact: true }).click();
  await expect(page.getByText("140 consultas na competência")).toBeVisible({
    timeout: 60000,
  });
  const navigation =
    info.project.name === "mobile"
      ? page.getByRole("navigation", { name: "Navegação principal" })
      : page.locator("aside nav");
  await navigation
    .getByRole("button", {
      name: info.project.name === "mobile" ? "Regras" : "Regras de repasse",
      exact: true,
    })
    .click();
  await page.getByRole("button", { name: "Nova regra" }).click();
  const dialog = page.getByRole("dialog");
  await dialog
    .locator('[name="convenio_id"]')
    .selectOption({ label: "Vida Saúde" });
  await dialog.locator('[name="valor_consulta"]').fill("200");
  await dialog.locator('[name="valor_honorario"]').fill("100");
  await dialog.getByRole("button", { name: "Salvar regra" }).click();
  await expect(dialog).toHaveCount(0);
  const rule = page
    .locator("article.rule")
    .filter({
      has: page.getByRole("heading", { name: "Vida Saúde", exact: true }),
    });
  await expect(rule).toBeVisible();
  await rule.getByRole("button", { name: "Editar", exact: true }).click();
  await dialog.locator('[name="deducao_pct"]').fill("10");
  await dialog.getByRole("button", { name: "Salvar regra" }).click();
  await expect(dialog).toHaveCount(0);
  const data: Dataset = await (await request.get("/api/demo")).json();
  expect(
    Number(data.summaries.find((s) => s.competencia === "2026-11")?.previsto),
  ).toBe(8673);
  expect(
    Number(data.summaries.find((s) => s.competencia === "2026-10")?.sem_regra),
  ).toBe(0);
  await navigation
    .getByRole("button", { name: "Importar", exact: true })
    .click();
  const code = `E2E-${info.project.name}`;
  await page
    .locator('input[type="file"]')
    .setInputFiles({
      name: "producao.csv",
      mimeType: "text/csv",
      buffer: Buffer.from(
        `cd_atendimento;convenio;data_atendimento;status;valor_consulta\n${code};Unimed;2026-11-03;agendado;180`,
      ),
    });
  await page
    .getByRole("button", { name: /Validar e importar 1 atendimentos/ })
    .click();
  await expect(page.getByRole("status")).toContainText("Importação concluída");
  const imported: Dataset = await (await request.get("/api/demo")).json();
  const importedRow = imported.rows.find((r) => r.cd_atendimento === code)!;
  expect(Number(importedRow.valor_repasse_calc)).toBe(85);
  expect(importedRow.data_atendimento).toBe("2026-11-03");
  await navigation
    .getByRole("button", {
      name: info.project.name === "mobile" ? "Regras" : "Regras de repasse",
      exact: true,
    })
    .click();
  page.once("dialog", (d) => d.accept());
  await rule.getByRole("button", { name: "Excluir", exact: true }).click();
  await expect(rule).toHaveCount(0);
  const cleanup = await request.post("/api/demo", {
    headers: { origin: "http://127.0.0.1:3000" },
    data: {
      table: "atendimentos",
      action: "delete",
      id: importedRow.id,
      values: {},
    },
  });
  expect(cleanup.ok()).toBe(true);
});
test("login → dashboard → trocar competência, filtros e tema", async ({
  page,
}, info) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Entrar", exact: true }).click();
  await expect(page.getByText("A receber em outubro de 2026")).toBeVisible({
    timeout: 60000,
  });
  await expect(page.getByText("140 consultas na competência")).toBeVisible();
  await page.getByRole("button", { name: /Novembro 2026/ }).click();
  await expect(page.getByText("A receber em novembro de 2026")).toBeVisible();
  await expect(page.getByText("70 consultas na competência")).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: `test-results/dashboard-${info.project.name}.png`,
    fullPage: true,
  });
  const nav =
    info.project.name === "mobile"
      ? page.getByRole("navigation", { name: "Navegação principal" })
      : page.locator("aside nav");
  await nav.getByRole("button", { name: "Atendimentos", exact: true }).click();
  await page.getByLabel("Status", { exact: true }).selectOption("agendado");
  await expect(page.getByText("70 registros")).toBeVisible();
  await page.getByRole("button", { name: "Ativar tema escuro" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await page.getByRole("button", { name: "Sair", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Entrar", exact: true }),
  ).toBeVisible();
});
