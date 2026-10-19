import { test, expect } from "@playwright/test";
test("métricas exigem opt-in e respeitam revogação e falha sem anexar conteúdo", async ({
  page,
}) => {
  const keys = [
    "preferences",
    "radiologyTypes",
    "radiologyFees",
    "radiologyProduction",
    "radiologyReceipts",
    "radiologySummaries",
    "radiologyLocations",
    "radiologyTypeSummaries",
    "profile",
    "convenios",
    "rules",
    "rows",
    "summaries",
    "goals",
    "locations",
    "fees",
    "production",
    "receipts",
    "personalSummaries",
    "locationSummaries",
    "reconciliation",
  ];
  const data: Record<string, unknown[]> = Object.fromEntries(
    keys.map((key) => [key, []]),
  );
  data.profile = [{ medico_id: "teste", nome: "Conta de teste", crm: "TESTE" }];
  data.preferences = [{ id: "p", perfil_uso: "consultas" }];
  let active = false,
    fail = false;
  const sent: unknown[] = [];
  await page.route("**/api/demo", async (route) => {
    if (route.request().method() === "GET")
      return route.fulfill({ json: data });
    const body = route.request().postDataJSON();
    sent.push(body);
    if (body.table !== "__metricas")
      return route.fulfill({ status: 400, json: { error: "Não previsto" } });
    if (body.action === "definir_metricas_piloto") {
      if (fail)
        return route.fulfill({
          status: 503,
          json: { error: "Falha simulada" },
        });
      active = body.values.ativar;
      return route.fulfill({ json: { ok: true } });
    }
    return route.fulfill({
      json: {
        ativo: active,
        semanas: active
          ? [
              {
                semana: "2026-10-19",
                dias_com_registro: 1,
                registros: 2,
                erros: 0,
              },
            ]
          : [],
      },
    });
  });
  await page.goto("/?area=ajustes");
  await page.getByRole("button", { name: "Entrar", exact: true }).click();
  const region = page.getByRole("region", { name: "Métricas do piloto" }),
    choice = region.getByRole("checkbox");
  await expect(choice).toBeEnabled();
  await expect(choice).not.toBeChecked();
  fail = true;
  await choice.click();
  await expect(region.getByRole("alert")).toContainText(
    "Nenhuma alteração foi confirmada",
  );
  await expect(choice).not.toBeChecked();
  fail = false;
  await choice.click();
  await expect(choice).toBeChecked();
  await expect(region.getByText(/2 lançamentos/)).toBeVisible();
  await choice.click();
  await expect(choice).not.toBeChecked();
  await expect(region.getByText(/2 lançamentos/)).toHaveCount(0);
  for (const raw of sent) {
    const body = raw as {
      table: string;
      action: string;
      values: Record<string, unknown>;
    };
    expect(body.table).toBe("__metricas");
    expect(Object.keys(body.values)).toEqual(
      body.action === "definir_metricas_piloto" ? ["ativar"] : [],
    );
  }
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});
