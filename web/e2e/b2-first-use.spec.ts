import { test, expect } from "@playwright/test";
test("primeiro uso mantém registro acessível sem obrigar honorário", async ({
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
    const data: Record<string, unknown[]> = Object.fromEntries(keys.map((key) => [key, []]));
  data.profile = [{ medico_id: "teste", nome: "Conta de teste", crm: "TESTE" }];
  data.preferences = [{ id: "p", perfil_uso: "laudos" }];
  await page.route("**/api/demo", (route) => route.fulfill({ json: data }));
  await page.goto("/");
  await page.getByRole("button", { name: "Entrar", exact: true }).click();
  const checklist = page.getByRole("region", { name: "Primeiros passos" });
  await expect(checklist).toBeVisible();
  await expect(
    checklist.getByRole("listitem").filter({hasText:"Tipo de exame"}),
  ).toBeVisible();
  await expect(
    checklist.getByText("Convênio ou Particular", { exact: true }),
  ).toHaveCount(0);
  const link = page.getByRole("link", { name: "Registrar", exact: true });
  await expect(link).toHaveAttribute("href", "/registrar?modulo=laudos");
  await page.getByRole("button", { name: "Ajustes", exact: true }).click();
  await expect(link).toBeVisible();
  await expect(
    checklist.getByRole("listitem").filter({hasText:"Honorário (pode informar depois)"}),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});
