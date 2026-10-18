import { test, expect } from "@playwright/test";

test("hero explica o controle pessoal, leva ao acesso e respeita movimento reduzido", async ({ page }, info) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Sua produção. Seus honorários. Seu controle." })).toBeVisible();
  await expect(page.getByText("DO REGISTRO À CONFERÊNCIA")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Vamos cuidar dos seus números?" })).toBeVisible();
  const note = page.getByRole("complementary", { name: "Extensão de registro rápido" });
  await expect(note).toContainText("Lançamentos manuais por quantidade");
  await expect(note).toContainText("Download pela loja em breve.");
  await expect(note.getByRole("link")).toHaveCount(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: `test-results/public-entry-${info.project.name}.png`, fullPage: true, animations: "disabled" });
  await page.getByRole("link", { name: "Começar meu controle" }).click();
  await expect(page).toHaveURL(/#acesso$/);
  await expect(page.locator("#acesso")).toBeInViewport();
  await page.emulateMedia({ reducedMotion: "reduce" });
  const duration = await page.locator(".public-hero h1").evaluate((element) => getComputedStyle(element).animationDuration);
  expect(parseFloat(duration)).toBeLessThan(0.001);
});
