import { test, expect } from "@playwright/test";
import path from "node:path";

const supabase = "https://honormed-test.supabase.invalid";
const userA = "11111111-1111-4111-8111-111111111111";
const userB = "22222222-2222-4222-8222-222222222222";
const jwt = (id: string) => `${Buffer.from('{"alg":"HS256","typ":"JWT"}').toString("base64url")}.${Buffer.from(JSON.stringify({ sub: id, role: "authenticated", exp: 2000000000 })).toString("base64url")}.${Buffer.from("fictitious-signature").toString("base64url")}`;
type Mock = { profile?: "consultas" | "laudos" | "ambos" | null; user?: string; failInsert?: boolean; calls: { method: string; url: string; body: unknown }[] };

async function setup(page: import("@playwright/test").Page, mock: Mock) {
  await page.addInitScript(() => {
    const createArea = (storage: Storage) => ({
      get: async (keys: string | string[]) => Object.fromEntries((Array.isArray(keys) ? keys : [keys]).filter((key) => storage.getItem(key) !== null).map((key) => [key, JSON.parse(storage.getItem(key)!)])),
      set: async (items: Record<string, unknown>) => { for (const [key, value] of Object.entries(items)) storage.setItem(key, JSON.stringify(value)); },
      remove: async (key: string) => { storage.removeItem(key); },
      clear: async () => { storage.clear(); },
    });
    (window as any).chrome = { storage: { session: createArea(sessionStorage), local: createArea(localStorage) }, tabs: { create: async ({ url }: { url: string }) => { (window as any).__lastTab = url; } } };
  });
  await page.route("http://127.0.0.1:3791/**", async (route) => {
    const name = new URL(route.request().url()).pathname.slice(1);
    if (!/^(popup\.html|popup\.css|popup\.js|logo-primary\.png)$/.test(name)) return route.fulfill({ status: 404 });
    await route.fulfill({ path: path.resolve("dist", name), contentType: name.endsWith(".js") ? "text/javascript" : undefined });
  });
  await page.route(`${supabase}/**`, async (route) => {
    const req = route.request(), url = new URL(req.url());
    const body = req.postDataJSON?.() ?? null;
    mock.calls.push({ method: req.method(), url: `${url.pathname}${url.search}`, body });
    const user = mock.user ?? userA;
    const userObject = { id: user, aud: "authenticated", role: "authenticated", email: "teste@example.invalid", created_at: "2026-10-17T00:00:00Z" };
    const json = (data: unknown, status = 200) => route.fulfill({ status, contentType: "application/json", headers: { "access-control-allow-origin": "*", "access-control-allow-headers": "*", "access-control-allow-methods": "GET,POST,DELETE,OPTIONS" }, body: JSON.stringify(data) });
    if (req.method() === "OPTIONS") return json({});
    if (url.pathname === "/auth/v1/token") return json({ access_token: jwt(user), refresh_token: "fake-refresh-token", token_type: "bearer", expires_in: 3600, user: userObject });
    if (url.pathname === "/auth/v1/user") return json(userObject);
    if (url.pathname === "/auth/v1/logout") return route.fulfill({ status: 204, headers: { "access-control-allow-origin": "*" } });
    if (url.pathname === "/rest/v1/preferencias_produto") return json(mock.profile === null ? null : { perfil_uso: mock.profile ?? "ambos" });
    if (url.pathname === "/rest/v1/locais_atendimento") return json([{ id: "L", nome: "Local fictício" }]);
    if (url.pathname === "/rest/v1/convenios") return json([{ id: "C", nome: "Convênio fictício" }]);
    if (url.pathname === "/rest/v1/laudos_tipos") return json([{ id: "T", nome: "Tipo fictício" }]);
    if (url.pathname === "/rest/v1/producoes_pessoais" || url.pathname === "/rest/v1/laudos_producao") {
      if (req.method() === "POST") return mock.failInsert ? json({ code: "PGRST", message: "offline" }, 503) : route.fulfill({ status: 201, headers: { "access-control-allow-origin": "*" } });
      if (req.method() === "DELETE") return json({ id: url.searchParams.get("id")?.slice(3) });
    }
    if (url.pathname === "/rest/v1/producao_pessoal_calculada" || url.pathname === "/rest/v1/laudos_calculados") return json({ id: url.searchParams.get("id")?.slice(3), medico_id: user, quantidade: 2, valor_previsto: url.pathname.includes("laudos") ? null : 170, fonte: "Informado por você" });
    return json({ error: "Unexpected request" }, 404);
  });
  await page.goto("http://127.0.0.1:3791/popup.html");
}
async function login(page: import("@playwright/test").Page, remember = false) {
  await expect(page.getByText("E-mail", { exact: true })).toBeVisible();
  await page.getByLabel("E-mail").fill("teste@example.invalid");
  await page.getByLabel("Senha").fill("fictitious");
  if (remember) await page.getByLabel("Manter conectado neste computador").check();
  await page.getByRole("button", { name: "Entrar" }).click();
  await expect(page.getByRole("button", { name: "Salvar registro" })).toBeVisible();
}
test("login, consultas, repetição, desfazer e logout local", async ({ page }) => {
  const mock: Mock = { calls: [] };
  await setup(page, mock);
  await page.getByRole("button", { name: "Esqueci a senha" }).click();
  expect(await page.evaluate(() => (window as any).__lastTab)).toBe("https://honormed-test.invalid/recuperar-senha");
  await page.getByRole("button", { name: "Criar conta" }).click();
  expect(await page.evaluate(() => (window as any).__lastTab)).toBe("https://honormed-test.invalid");
  await login(page);
  await page.screenshot({ path: "test-results/popup-register.png", fullPage: true });
  await page.getByLabel("Quantidade").fill("2");
  await page.getByRole("button", { name: "Salvar registro" }).click();
  await expect(page.getByText(/Valor previsto: R\$\s*170,00/)).toBeVisible();
  await expect(page.getByLabel("Quantidade")).toHaveValue("");
  await page.getByLabel("Quantidade").press("Enter");
  expect(mock.calls.filter((call) => call.method === "POST" && call.url.startsWith("/rest/v1/producoes_pessoais"))).toHaveLength(1);
  const insertion = mock.calls.find((call) => call.method === "POST" && call.url.startsWith("/rest/v1/producoes_pessoais"))!.body as Record<string, unknown>;
  expect(Object.keys(insertion).sort()).toEqual(["convenio_id", "data_producao", "id", "local_id", "medico_id", "quantidade"]);
  await page.getByRole("button", { name: "Repetir último" }).click();
  await expect(page.getByText(/Confira módulo, local, data e quantidade/)).toBeVisible();
  expect(mock.calls.filter((call) => call.method === "POST" && call.url.startsWith("/rest/v1/producoes_pessoais"))).toHaveLength(1);
  await page.getByRole("button", { name: "Confirmar repetição e salvar" }).click();
  await page.getByRole("button", { name: "Desfazer lançamento" }).click();
  await page.getByRole("button", { name: "Confirmar desfazer" }).click();
  await expect(page.getByText("Último lançamento desfeito.")).toBeVisible();
  await page.getByRole("button", { name: "Sair" }).click();
  await expect(page.getByLabel("E-mail")).toBeVisible();
  await expect.poll(() => mock.calls.some((call) => call.method === "POST" && call.url === "/auth/v1/logout?scope=local")).toBe(true);
  expect(await page.evaluate(() => sessionStorage.length + localStorage.length)).toBe(0);
  mock.user = userB;
  await login(page);
  await expect(page.getByRole("button", { name: "Repetir último" })).toBeHidden();
  expect(await page.evaluate(() => sessionStorage.getItem("honormed.last.11111111-1111-4111-8111-111111111111"))).toBeNull();
});
test("perfil ausente pede escolha no app sem registrar", async ({ page }) => {
  const mock: Mock = { calls: [], profile: null };
  await setup(page, mock);
  await page.getByLabel("E-mail").fill("teste@example.invalid");
  await page.getByLabel("Senha").fill("fictitious");
  await page.getByRole("button", { name: "Entrar" }).click();
  await expect(page.getByText(/Escolha seu perfil de uso/)).toBeVisible();
  await expect(page.getByRole("button", { name: "Salvar registro" })).toBeHidden();
  expect(mock.calls.some((call) => call.method === "POST" && call.url.startsWith("/rest/v1/"))).toBe(false);
});
test("somente laudos, valor pendente e falha de rede preserva formulário", async ({ page }) => {
  const mock: Mock = { calls: [], profile: "laudos", failInsert: true };
  await setup(page, mock);
  await login(page);
  await expect(page.getByRole("button", { name: "Consultas" })).toBeHidden();
  await page.getByLabel("Quantidade").fill("2");
  await page.getByRole("button", { name: "Salvar registro" }).click();
  await expect(page.getByText(/Não foi possível salvar/)).toBeVisible();
  await expect(page.getByLabel("Quantidade")).toHaveValue("2");
  mock.failInsert = false;
  await page.getByRole("button", { name: "Salvar registro" }).click();
  await expect(page.getByText(/Valor pendente/)).toBeVisible();
  const insertion = mock.calls.find((call) => call.method === "POST" && call.url.startsWith("/rest/v1/laudos_producao") && !mock.failInsert)!.body as Record<string, unknown>;
  expect(Object.keys(insertion).sort()).toEqual(["data_producao", "id", "local_id", "medico_id", "quantidade", "tipo_id"]);
});
for (const [remember, limit] of [[false, 30 * 60 * 1000], [true, 12 * 60 * 60 * 1000]] as const) test(`expiração ${remember ? "12 h" : "30 min"} bloqueia no limite`, async ({ page }) => {
  const mock: Mock = { calls: [] };
  await setup(page, mock);
  await login(page, remember);
  const area = remember ? "localStorage" : "sessionStorage";
  await page.evaluate(({ area, limit }) => { (window as any)[area].setItem("honormed.lastActivity", JSON.stringify(Date.now() - limit + 1000)); }, { area, limit });
  await page.reload();
  await expect(page.getByRole("button", { name: "Salvar registro" })).toBeVisible();
  await page.evaluate(({ area, limit }) => { (window as any)[area].setItem("honormed.lastActivity", JSON.stringify(Date.now() - limit - 1000)); }, { area, limit });
  await page.reload();
  await expect(page.getByText(/terminou por inatividade/)).toBeVisible();
  expect(await page.evaluate(() => sessionStorage.length + localStorage.length)).toBe(0);
  await expect.poll(() => mock.calls.some((call) => call.method === "POST" && call.url === "/auth/v1/logout?scope=local")).toBe(true);
});
