import { test, expect, type Locator } from "@playwright/test";
import type { Dataset } from "../src/lib/data";

async function expectReadableButton(button: Locator) {
  await expect
    .poll(() =>
      button.evaluate((element) => {
        const style = getComputedStyle(element);
        const luminance = (color: string) => {
          const channels = (color.match(/[\d.]+/g) || [])
            .slice(0, 3)
            .map(Number)
            .map((value) => {
              const channel = value / 255;
              return channel <= 0.04045
                ? channel / 12.92
                : ((channel + 0.055) / 1.055) ** 2.4;
            });
          return (
            channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722
          );
        };
        const a = luminance(style.color),
          b = luminance(style.backgroundColor);
        return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
      }),
    )
    .toBeGreaterThanOrEqual(4.5);
}

test("controle pessoal simples, mês de produção e tema em celular e desktop", async ({
  page,
}, info) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Entrar", exact: true }).click();
  await expect(page.getByTestId("personal-balance")).toHaveText(/1\.745,00/, {
    timeout: 60000,
  });
  await expect(page.getByText("24 consultas registradas no mês")).toBeVisible();
  await expect(page.getByText("4 consultas aguardam valor")).toBeVisible();
  await expectReadableButton(
    page.getByRole("button", { name: "Registrar consultas", exact: true }),
  );
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: `test-results/personal-dashboard-${info.project.name}.png`,
    fullPage: true,
  });
  await page.getByLabel("Mês da produção", { exact: true }).fill("2026-11");
  await expect(page.getByTestId("personal-balance")).toHaveText(/510,00/);
  await expect(page.getByTestId("personal-received")).toHaveText(/0,00/);
  await page.getByLabel("Mês da produção", { exact: true }).fill("2026-12");
  await expect(
    page.getByText("Seu controle começa com o primeiro registro."),
  ).toBeVisible();
  await page.getByLabel("Mês da produção", { exact: true }).fill("2026-10");
  await page.getByRole("button", { name: "Ativar tema escuro" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await expectReadableButton(
    page.getByRole("button", { name: "Registrar consultas", exact: true }),
  );
  await expectReadableButton(
    page.getByRole("button", { name: "Registrar recebimento", exact: true }),
  );
  await page.screenshot({
    path: `test-results/personal-dark-${info.project.name}.png`,
    fullPage: true,
  });
  await page.getByRole("button", { name: "Sair", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Entrar", exact: true }),
  ).toBeVisible();
});

test("cadastro → produção sem honorário → configuração → recebimento parcial → correção", async ({
  page,
  request,
}, info) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Entrar", exact: true }).click();
  await expect(page.getByTestId("personal-balance")).toHaveText(/1\.745,00/, {
    timeout: 60000,
  });
  const nav =
    info.project.name === "mobile"
      ? page.getByRole("navigation", { name: "Navegação pessoal" })
      : page.getByRole("navigation", { name: "Menu do controle pessoal" });
  const localName = `Local E2E ${info.project.name}`,
    convenioName = `Convênio E2E ${info.project.name}`;
  const origin = new URL(page.url()).origin;
  const load = async (): Promise<Dataset> =>
    (await request.get("/api/demo")).json();
  const remove = async (table: string, id: string) => {
    const r = await request.post("/api/demo", {
      headers: { origin },
      data: { table, action: "delete", id, values: {} },
    });
    expect(r.ok()).toBe(true);
  };
  try {
    await nav.getByRole("button", { name: "Ajustes", exact: true }).click();
    await page.getByLabel("Nome do local", { exact: true }).fill(localName);
    await page
      .getByRole("button", { name: "Adicionar local", exact: true })
      .click();
    await expect(page.getByRole("status")).toHaveText("Local adicionado.");
    await page
      .getByLabel("Nome do convênio", { exact: true })
      .fill(convenioName);
    await page
      .getByRole("button", { name: "Adicionar convênio", exact: true })
      .click();
    await expect(page.getByRole("status")).toHaveText("Convênio adicionado.");
    await nav.getByRole("button", { name: "Início", exact: true }).click();
    await page
      .getByRole("button", { name: "Registrar consultas", exact: true })
      .click();
    let dialog = page.getByRole("dialog");
    await dialog
      .getByLabel("Local de atendimento", { exact: true })
      .selectOption({ label: localName });
    await dialog
      .getByLabel("Convênio das consultas")
      .selectOption({ label: convenioName });
    await dialog.getByLabel("Data das consultas").fill("2026-10-16");
    await dialog.getByLabel("Quantidade de consultas").fill("5");
    await expect(
      dialog.getByText(/Suas consultas serão salvas com valor pendente/),
    ).toBeVisible();
    await dialog.getByRole("button", { name: "Salvar consultas" }).click();
    await expect(dialog).toHaveCount(0);
    await expect(page.getByText("9 consultas aguardam valor")).toBeVisible();
    await expect(page.getByTestId("personal-balance")).toHaveText(/1\.745,00/);
    await page
      .getByRole("button", { name: "Repetir último lançamento" })
      .click();
    await expect(
      page.getByRole("dialog").getByLabel("Quantidade de consultas"),
    ).toHaveValue("5");
    await page
      .getByRole("dialog")
      .getByRole("button", { name: "Diminuir quantidade" })
      .click();
    await expect(
      page.getByRole("dialog").getByLabel("Quantidade de consultas"),
    ).toHaveValue("4");
    await page
      .getByRole("dialog")
      .getByRole("button", { name: "Aumentar quantidade" })
      .click();
    await page
      .getByRole("dialog")
      .getByRole("button", { name: "Salvar consultas" })
      .click();
    await expect(page.getByRole("dialog")).toHaveCount(0);
    await page.getByRole("button", { name: "Desfazer lançamento" }).click();
    await expect(page.getByRole("status")).toContainText(
      "Último lançamento desfeito.",
    );
    await nav.getByRole("button", { name: "Ajustes", exact: true }).click();
    await page
      .getByLabel("Local do honorário")
      .selectOption({ label: localName });
    await page
      .getByLabel("Convênio do honorário")
      .selectOption({ label: convenioName });
    await page
      .getByLabel("Honorário por consulta (R$)", { exact: true })
      .fill("100");
    await page.getByRole("button", { name: "Salvar honorário" }).click();
    await expect(page.getByRole("status")).toContainText("Honorário salvo.");
    await nav.getByRole("button", { name: "Início", exact: true }).click();
    await expect(page.getByTestId("personal-balance")).toHaveText(/2\.245,00/);
    await expect(page.getByText("4 consultas aguardam valor")).toBeVisible();
    await page
      .getByRole("button", { name: "Registrar recebimento", exact: true })
      .click();
    dialog = page.getByRole("dialog");
    await dialog
      .getByLabel("Local de atendimento", { exact: true })
      .selectOption({ label: localName });
    await dialog
      .getByLabel("Convênio do recebimento")
      .selectOption({ label: convenioName });
    await dialog.getByLabel("Mês da produção a que se refere").fill("2026-10");
    await dialog.getByLabel("Data em que recebeu").fill("2026-11-05");
    await dialog.getByLabel("Valor recebido (R$)", { exact: true }).fill("200");
    await dialog.getByRole("button", { name: "Salvar recebimento" }).click();
    await expect(dialog).toHaveCount(0);
    await expect(page.getByTestId("personal-balance")).toHaveText(/2\.045,00/);
    await expect(page.getByTestId("personal-received")).toHaveText(/700,00/);
    await nav.getByRole("button", { name: "Produção", exact: true }).click();
    await page.getByLabel("Filtrar local").selectOption({ label: localName });
    await expect(page.locator(".personal-entry")).toHaveCount(1);
    await page.getByRole("button", { name: /Editar produção/ }).click();
    dialog = page.getByRole("dialog");
    await dialog.getByLabel("Quantidade de consultas").fill("6");
    await dialog.getByRole("button", { name: "Salvar consultas" }).click();
    await expect(dialog).toHaveCount(0);
    await nav.getByRole("button", { name: "Início", exact: true }).click();
    await expect(page.getByTestId("personal-balance")).toHaveText(/2\.145,00/);
    await nav
      .getByRole("button", { name: "Recebimentos", exact: true })
      .click();
    const receipt = page
      .locator(".personal-entry")
      .filter({ hasText: localName });
    await expect(receipt).toContainText("05/11/2026");
    await receipt.getByRole("button", { name: /Editar recebimento/ }).click();
    dialog = page.getByRole("dialog");
    await dialog.getByLabel("Valor recebido (R$)", { exact: true }).fill("250");
    await dialog.getByRole("button", { name: "Salvar recebimento" }).click();
    await expect(dialog).toHaveCount(0);
    await expect(receipt).toContainText("250,00");
    await receipt.getByRole("button", { name: /Excluir recebimento/ }).click();
    await page
      .getByRole("dialog")
      .getByRole("button", { name: "Excluir registro", exact: true })
      .click();
    await expect(page.getByRole("dialog")).toHaveCount(0);
    await expect(receipt).toHaveCount(0);
    await nav.getByRole("button", { name: "Produção", exact: true }).click();
    await page.getByRole("button", { name: /Excluir produção/ }).click();
    await page
      .getByRole("dialog")
      .getByRole("button", { name: "Excluir registro", exact: true })
      .click();
    await expect(page.getByRole("dialog")).toHaveCount(0);
    await expect(page.locator(".personal-entry")).toHaveCount(0);
  } finally {
    const d = await load(),
      local = d.locations.find((l) => l.nome === localName),
      convenio = d.convenios.find((c) => c.nome === convenioName);
    if (local) {
      for (const p of d.production.filter((p) => p.local_id === local.id))
        await remove("producoes_pessoais", p.id);
      for (const r of d.receipts.filter((r) => r.local_id === local.id))
        await remove("recebimentos_pessoais", r.id);
      for (const f of d.fees.filter((f) => f.local_id === local.id))
        await remove("honorarios_pessoais", f.id);
    }
    if (convenio) await remove("convenios", convenio.id);
    if (local) await remove("locais_atendimento", local.id);
  }
});
