import { test, expect } from "@playwright/test";
import type { Dataset } from "../src/lib/data";

test("radiologista entra somente em laudos, perfil persiste e módulos não se misturam", async ({
  page,
  request,
}, info) => {
  const origin =
    "http://127.0.0.1:" + (process.env.PLAYWRIGHT_TEST_PORT || "3100");
  const d: Dataset = await (await request.get("/api/demo")).json();
  try {
    await page.goto("/");
    await page.getByRole("button", { name: "Entrar", exact: true }).click();
    await page
      .getByRole("button", { name: "Meu perfil de uso", exact: true })
      .click();
    await page
      .getByRole("dialog")
      .getByLabel("Meu perfil de uso", { exact: true })
      .selectOption("laudos");
    await page.getByRole("button", { name: "Salvar perfil de uso" }).click();
    await expect(page.getByTestId("radiology-balance")).toHaveText(
      /1\.220,00/,
      { timeout: 60000 },
    );
    await expect(
      page.getByRole("button", { name: "Registrar consultas", exact: true }),
    ).toHaveCount(0);
    await expect(page.getByText("75 laudos registrados no mês")).toBeVisible();
    await expect(page.getByText("5 laudos aguardam honorário")).toBeVisible();
    await page.reload();
    await expect(page.getByTestId("radiology-balance")).toHaveText(/1\.220,00/);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await page.screenshot({
      path: `test-results/radiology-dashboard-${info.project.name}.png`,
      fullPage: true,
    });
    await page.getByLabel("Mês da produção", { exact: true }).fill("2026-11");
    await expect(page.getByTestId("radiology-balance")).toHaveText(/350,00/);
    await expect(page.getByTestId("radiology-received")).toHaveText(/0,00/);
    await page.getByRole("button", { name: "Planos", exact: true }).click();
    await expect(page.getByText("R$ 79,90/mês", { exact: true })).toBeVisible();
    await expect(page.getByText(/Sem cobrança ativa no MVP/)).toBeVisible();
    await page.getByRole("button", { name: "Voltar ao meu controle" }).click();
    await page
      .getByRole("button", { name: "Meu perfil de uso", exact: true })
      .click();
    await page
      .getByRole("dialog")
      .getByLabel("Meu perfil de uso", { exact: true })
      .selectOption("ambos");
    await page.getByRole("button", { name: "Salvar perfil de uso" }).click();
    await page.getByRole("button", { name: "Consultas", exact: true }).click();
    await expect(page.getByTestId("personal-balance")).toHaveText(/1\.745,00/);
    await page.getByRole("button", { name: "Laudos", exact: true }).click();
    await expect(page.getByTestId("radiology-balance")).toHaveText(/1\.220,00/);
  } finally {
    await request.post("/api/demo", {
      headers: { origin },
      data: {
        table: "preferencias_produto",
        action: "update",
        id: d.preferences[0].id,
        values: { perfil_uso: "consultas" },
      },
    });
  }
});

test("produção radiológica por instituição, honorário pendente, recebimento parcial e correções", async ({
  page,
  request,
}, info) => {
  const load = async (): Promise<Dataset> =>
      (await request.get("/api/demo")).json(),
    initial = await load(),
    origin = "http://127.0.0.1:" + (process.env.PLAYWRIGHT_TEST_PORT || "3100");
  const localName = `Imagem E2E ${info.project.name}`,
    typeName = `Exame E2E ${info.project.name}`;
  const remove = async (table: string, id: string) => {
    const r = await request.post("/api/demo", {
      headers: { origin },
      data: { table, action: "delete", id, values: {} },
    });
    expect(r.ok()).toBe(true);
  };
  try {
    await request.post("/api/demo", {
      headers: { origin },
      data: {
        table: "preferencias_produto",
        action: "update",
        id: initial.preferences[0].id,
        values: { perfil_uso: "laudos" },
      },
    });
    await page.goto("/");
    await page.getByRole("button", { name: "Entrar", exact: true }).click();
    await expect(page.getByTestId("radiology-balance")).toHaveText(
      /1\.220,00/,
      { timeout: 60000 },
    );
    const nav =
      info.project.name === "mobile"
        ? page.getByRole("navigation", { name: "Navegação de laudos" })
        : page.getByRole("navigation", { name: "Menu de laudos" });
    await nav.getByRole("button", { name: "Ajustes", exact: true }).click();
    await page
      .getByLabel("Nome da instituição", { exact: true })
      .fill(localName);
    await page
      .getByRole("button", { name: "Adicionar instituição", exact: true })
      .click();
    await expect(page.getByRole("status")).toContainText(
      "Instituição adicionada.",
    );
    await page
      .getByLabel("Nome do tipo de exame", { exact: true })
      .fill(typeName);
    await page
      .getByRole("button", { name: "Adicionar tipo de exame", exact: true })
      .click();
    await expect(page.getByRole("status")).toContainText(
      "Tipo de exame adicionado.",
    );
    await nav.getByRole("button", { name: "Dashboard", exact: true }).click();
    await page
      .getByRole("button", { name: "Registrar laudos", exact: true })
      .click();
    let dialog = page.getByRole("dialog");
    await dialog
      .getByLabel("Instituição", { exact: true })
      .selectOption({ label: localName });
    await dialog
      .getByLabel("Tipo de exame", { exact: true })
      .selectOption({ label: typeName });
    await dialog.getByLabel("Data dos laudos").fill("2026-10-16");
    await dialog.getByLabel("Quantidade de laudos").fill("8");
    await dialog.getByRole("button", { name: "Salvar laudos" }).click();
    await expect(dialog).toHaveCount(0);
    await expect(page.getByText("13 laudos aguardam honorário")).toBeVisible();
    await nav.getByRole("button", { name: "Ajustes", exact: true }).click();
    await page
      .getByLabel("Instituição do honorário")
      .selectOption({ label: localName });
    await page
      .getByLabel("Tipo de exame do honorário")
      .selectOption({ label: typeName });
    await page
      .getByLabel("Valor por laudo (R$)", { exact: true })
      .fill("18.50");
    await page
      .getByRole("button", { name: "Salvar honorário de laudo" })
      .click();
    await expect(page.getByRole("status")).toContainText(
      "Honorário de laudo salvo.",
    );
    await nav.getByRole("button", { name: "Dashboard", exact: true }).click();
    await expect(page.getByTestId("radiology-balance")).toHaveText(/1\.368,00/);
    await page
      .getByRole("button", { name: "Registrar recebimento", exact: true })
      .click();
    dialog = page.getByRole("dialog");
    await dialog
      .getByLabel("Instituição", { exact: true })
      .selectOption({ label: localName });
    await dialog.getByLabel("Mês da produção a que se refere").fill("2026-10");
    await dialog.getByLabel("Data em que recebeu").fill("2026-11-10");
    await dialog.getByLabel("Valor recebido (R$)", { exact: true }).fill("100");
    await dialog
      .getByRole("button", { name: "Salvar recebimento de laudos" })
      .click();
    await expect(dialog).toHaveCount(0);
    await expect(page.getByTestId("radiology-balance")).toHaveText(/1\.268,00/);
    await nav.getByRole("button", { name: "Produção", exact: true }).click();
    await page
      .getByLabel("Filtrar instituição")
      .selectOption({ label: localName });
    await expect(page.locator(".personal-entry")).toHaveCount(1);
    await page
      .getByRole("button", { name: /Editar produção de laudos/ })
      .click();
    dialog = page.getByRole("dialog");
    await dialog.getByLabel("Quantidade de laudos").fill("10");
    await dialog.getByRole("button", { name: "Salvar laudos" }).click();
    await expect(dialog).toHaveCount(0);
    await nav.getByRole("button", { name: "Dashboard", exact: true }).click();
    await expect(page.getByTestId("radiology-balance")).toHaveText(/1\.305,00/);
    await nav
      .getByRole("button", { name: "Recebimentos", exact: true })
      .click();
    const receipt = page
      .locator(".personal-entry")
      .filter({ hasText: localName });
    await expect(receipt).toContainText("10/11/2026");
    await receipt
      .getByRole("button", { name: /Editar recebimento de laudos/ })
      .click();
    dialog = page.getByRole("dialog");
    await dialog.getByLabel("Valor recebido (R$)", { exact: true }).fill("120");
    await dialog
      .getByRole("button", { name: "Salvar recebimento de laudos" })
      .click();
    await expect(dialog).toHaveCount(0);
    await expect(receipt).toContainText("120,00");
    await receipt
      .getByRole("button", { name: /Excluir recebimento de laudos/ })
      .click();
    await page
      .getByRole("dialog")
      .getByRole("button", { name: "Excluir registro" })
      .click();
    await expect(page.getByRole("dialog")).toHaveCount(0);
    await expect(receipt).toHaveCount(0);
    await nav.getByRole("button", { name: "Produção", exact: true }).click();
    await page
      .getByRole("button", { name: /Excluir produção de laudos/ })
      .click();
    await page
      .getByRole("dialog")
      .getByRole("button", { name: "Excluir registro" })
      .click();
    await expect(page.getByRole("dialog")).toHaveCount(0);
    await expect(page.locator(".personal-entry")).toHaveCount(0);
  } finally {
    const d = await load(),
      local = d.locations.find((l) => l.nome === localName),
      tipo = d.radiologyTypes.find((t) => t.nome === typeName);
    if (local) {
      for (const p of d.radiologyProduction.filter(
        (p) => p.local_id === local.id,
      ))
        await remove("laudos_producao", p.id);
      for (const r of d.radiologyReceipts.filter(
        (r) => r.local_id === local.id,
      ))
        await remove("laudos_recebimentos", r.id);
      for (const f of d.radiologyFees.filter((f) => f.local_id === local.id))
        await remove("laudos_valores", f.id);
    }
    if (tipo) await remove("laudos_tipos", tipo.id);
    if (local) await remove("locais_atendimento", local.id);
    await request.post("/api/demo", {
      headers: { origin },
      data: {
        table: "preferencias_produto",
        action: "update",
        id: initial.preferences[0].id,
        values: { perfil_uso: "consultas" },
      },
    });
  }
});
