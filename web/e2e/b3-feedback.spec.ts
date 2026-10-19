import { test, expect } from "@playwright/test";
test("feedback não dispara envio nem anexa dados da conta", async ({
  page,
}) => {
  const unexpected: string[] = [];
  page.on("request", (request) => {
    if (request.method() === "POST") unexpected.push(request.url());
  });
  await page.goto("/suporte");
  await page.getByLabel("Tipo de feedback").selectOption("Sugestão");
  const href = await page
    .getByRole("link", { name: "Preparar e-mail de feedback" })
    .getAttribute("href");
  const url = new URL(href!);
  expect(url.protocol).toBe("mailto:");
  expect(url.searchParams.get("body")).toContain("Tipo: Sugestão");
  expect(unexpected).toEqual([]);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});
