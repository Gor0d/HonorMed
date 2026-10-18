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

test("privacidade e suporte são públicos e acessíveis pelo site", async ({ page }, info) => {
  await page.goto("/");
  await page.getByRole("navigation", { name: "Informações públicas" }).getByRole("link", { name: "Privacidade" }).click();
  await expect(page).toHaveURL(/\/privacidade$/);
  await expect(page.getByRole("heading", { name: "Política de privacidade" })).toBeVisible();
  await expect(page.getByText("Emerson Gabriel da Silva Guimarães")).toBeVisible();
  await expect(page.getByText(/Uso Limitado/)).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: `test-results/privacy-${info.project.name}.png`, fullPage: true, animations: "disabled" });
  await page.getByRole("navigation", { name: "Informações públicas" }).getByRole("link", { name: "Suporte" }).click();
  await expect(page).toHaveURL(/\/suporte$/);
  await expect(page.getByRole("heading", { name: "Suporte HonorMed" })).toBeVisible();
  await expect(page.getByRole("link", { name: "acesso@cforod.com" }).first()).toHaveAttribute("href", "mailto:acesso@cforod.com");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: `test-results/support-${info.project.name}.png`, fullPage: true, animations: "disabled" });
  await page.goto("/termos");
  await expect(page.getByRole("heading", { name: "Termos de uso" })).toBeVisible();
  await expect(page.getByText("Rascunho não vigente.")).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: `test-results/terms-${info.project.name}.png`, fullPage: true, animations: "disabled" });
});
