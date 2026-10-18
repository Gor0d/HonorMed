import { test, expect, chromium } from "@playwright/test";
import path from "node:path";

const projectUrl = "https://honormed-test.supabase.invalid";
const userId = "11111111-1111-4111-8111-111111111111";
const jwt = `${Buffer.from('{"alg":"HS256","typ":"JWT"}').toString("base64url")}.${Buffer.from(JSON.stringify({ sub: userId, role: "authenticated", exp: 2000000000 })).toString("base64url")}.${Buffer.from("fictitious-signature").toString("base64url")}`;

test("S3-1: extensão descompactada real abre, registra consulta e sai só da sessão local", async ({}, testInfo) => {
  const extensionPath = path.resolve("dist");
  const context = await chromium.launchPersistentContext(testInfo.outputPath("chrome-profile"), {
    headless: true,
    channel: "chromium",
    args: [`--disable-extensions-except=${extensionPath}`, `--load-extension=${extensionPath}`],
  });
  try {
    const calls: { method: string; path: string; body: unknown }[] = [];
    await context.route(`${projectUrl}/**`, async (route) => {
      const request = route.request(), url = new URL(request.url());
      const body = request.postDataJSON() ?? null;
      calls.push({ method: request.method(), path: `${url.pathname}${url.search}`, body });
      const json = (value: unknown, status = 200) => route.fulfill({ status, contentType: "application/json", headers: { "access-control-allow-origin": "*", "access-control-allow-headers": "*", "access-control-allow-methods": "GET,POST,DELETE,OPTIONS" }, body: JSON.stringify(value) });
      if (request.method() === "OPTIONS") return json({});
      const user = { id: userId, aud: "authenticated", role: "authenticated", email: "teste@example.invalid", created_at: "2026-10-17T00:00:00Z" };
      if (url.pathname === "/auth/v1/token") return json({ access_token: jwt, refresh_token: "fake-refresh-token", token_type: "bearer", expires_in: 3600, user });
      if (url.pathname === "/auth/v1/user") return json(user);
      if (url.pathname === "/auth/v1/logout") return route.fulfill({ status: 204, headers: { "access-control-allow-origin": "*" } });
      if (url.pathname === "/rest/v1/preferencias_produto") return json({ perfil_uso: "consultas" });
      if (url.pathname === "/rest/v1/locais_atendimento") return json([{ id: "L", nome: "Local fictício" }]);
      if (url.pathname === "/rest/v1/convenios") return json([{ id: "C", nome: "Convênio fictício" }]);
      if (url.pathname === "/rest/v1/laudos_tipos") return json([]);
      if (url.pathname === "/rest/v1/producoes_pessoais" && request.method() === "POST") return route.fulfill({ status: 201, headers: { "access-control-allow-origin": "*" } });
      if (url.pathname === "/rest/v1/producao_pessoal_calculada") return json({ id: url.searchParams.get("id")?.slice(3), medico_id: userId, quantidade: 2, valor_previsto: 170, fonte: "Informado por você" });
      return json({ error: "Unexpected mock request" }, 404);
    });

    const extensions = await context.newPage();
    await extensions.goto("chrome://extensions/");
    const item = extensions.locator("extensions-item").filter({ hasText: "HonorMed" });
    await expect(item).toHaveCount(1);
    const extensionId = await item.getAttribute("id");
    expect(extensionId).toMatch(/^[a-p]{32}$/);
    const popup = await context.newPage();
    await popup.goto(`chrome-extension://${extensionId}/popup.html`);
    await expect(popup.getByLabel("E-mail")).toBeVisible();
    expect(await popup.evaluate(() => Boolean(chrome.storage.session))).toBe(true);
    await popup.getByLabel("E-mail").fill("teste@example.invalid");
    await popup.getByLabel("Senha").fill("fictitious");
    await popup.getByRole("button", { name: "Entrar" }).click();
    await expect(popup.getByRole("button", { name: "Salvar registro" })).toBeVisible();
    expect((await popup.evaluate(() => chrome.storage.session.get("honormed.activeUserId")))["honormed.activeUserId"]).toBe(userId);
    await popup.getByLabel("Quantidade").fill("2");
    await popup.getByRole("button", { name: "Salvar registro" }).click();
    await expect(popup.getByText(/Valor previsto: R\$\s*170,00/)).toBeVisible();
    const inserted = calls.find((call) => call.method === "POST" && call.path.startsWith("/rest/v1/producoes_pessoais"));
    expect(inserted).toBeDefined();
    expect(Object.keys(inserted!.body as object).sort()).toEqual(["convenio_id", "data_producao", "id", "local_id", "medico_id", "quantidade"]);
    await popup.getByRole("button", { name: "Sair" }).click();
    await expect(popup.getByLabel("E-mail")).toBeVisible();
    expect(calls.some((call) => call.method === "POST" && call.path === "/auth/v1/logout?scope=local")).toBe(true);
    expect(await popup.evaluate(async () => Object.keys(await chrome.storage.session.get(null)))).toEqual([]);
  } finally { await context.close(); }
});
