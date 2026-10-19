import { test, expect } from "@playwright/test";

test("oferta individual não promete planos ou contratação indisponíveis", async ({
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
  data.preferences = [{ id: "p", perfil_uso: "ambos" }];
  await page.route("**/api/demo", (route) => route.fulfill({ json: data }));
  await page.route("**/*.supabase.co/**", (route) => route.abort());
  await page.goto("/");
  await page.getByRole("button", { name: "Entrar", exact: true }).click();
  await page.getByRole("button", { name: "Planos", exact: true }).click();
  const offer = page.getByRole("region", { name: "Proposta individual" });
  await expect(offer).toContainText(/R\$\s*79,90\/mês por médico/);
  await expect(
    offer.getByText("Consultas e Laudos pelo mesmo preço"),
  ).toBeVisible();
  await expect(
    offer.getByRole("button", { name: /sem cobrança ativa/ }),
  ).toBeDisabled();
  await expect(offer).toContainText("sem oferta disponível");
  await expect(offer).not.toContainText(/Free|1\.990|4\.900|49,90/);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});
