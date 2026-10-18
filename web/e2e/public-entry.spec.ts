import { test, expect } from "@playwright/test";

test("entrada pública apresenta a extensão sem oferecer download antes da loja", async ({ page }, info) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Vamos cuidar dos seus números?" })).toBeVisible();
  const note = page.getByRole("complementary", { name: "Extensão de registro rápido" });
  await expect(note).toContainText("Lançamentos manuais por quantidade");
  await expect(note).toContainText("Download pela loja em breve.");
  await expect(note.getByRole("link")).toHaveCount(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: `test-results/public-entry-${info.project.name}.png`, fullPage: true });
});
