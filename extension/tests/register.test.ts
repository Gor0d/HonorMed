import { beforeEach, describe, expect, it, vi } from "vitest";
import { checkStartup, ChromeAuthStorage, INACTIVITY_REMEMBER_MS, INACTIVITY_SESSION_MS, SESSION_STORAGE_KEY } from "../src/auth-storage";
import { payload, validate, type Catalog } from "../src/register";

function mockArea() {
  const values = new Map<string, unknown>();
  return {
    values,
    get: vi.fn(async (keys: string | string[]) => Object.fromEntries((Array.isArray(keys) ? keys : [keys]).filter((key) => values.has(key)).map((key) => [key, values.get(key)]))),
    set: vi.fn(async (items: Record<string, unknown>) => { for (const [key, value] of Object.entries(items)) values.set(key, value); }),
    remove: vi.fn(async (key: string) => { values.delete(key); }),
    clear: vi.fn(async () => { values.clear(); }),
  };
}
const session = mockArea(), local = mockArea();
beforeEach(() => {
  session.values.clear(); local.values.clear(); vi.clearAllMocks();
  vi.stubGlobal("chrome", { storage: { session, local } });
});
const token = (userId: string) => JSON.stringify({ user: { id: userId }, access_token: "fictitious", refresh_token: "fictitious" });
describe("sessão da extensão", () => {
  it("guarda a sessão só na chave principal e isola chaves auxiliares em memória", async () => {
    const adapter = new ChromeAuthStorage("session");
    await adapter.setItem("honormed-auth-code-verifier", "plain-text");
    expect(await adapter.getItem("honormed-auth-code-verifier")).toBe("plain-text");
    expect(await adapter.getItem(SESSION_STORAGE_KEY)).toBeNull();
    await adapter.setItem(SESSION_STORAGE_KEY, token("A"));
    expect(await adapter.getItem(SESSION_STORAGE_KEY)).toBe(token("A"));
    expect(session.values.has("honormed-auth-code-verifier")).toBe(false);
  });
  it.each([["session", INACTIVITY_SESSION_MS], ["local", INACTIVITY_REMEMBER_MS]] as const)("respeita ambos os limites de %s sem renovar com refresh", async (mode, limit) => {
    const adapter = new ChromeAuthStorage(mode);
    await adapter.setItem(SESSION_STORAGE_KEY, token("A"));
    await adapter.touch(1000);
    await adapter.setItem(SESSION_STORAGE_KEY, token("A"));
    expect((await checkStartup(1000 + limit - 1000)).status).toBe("active");
    expect((await checkStartup(1000 + limit + 1000)).status).toBe("expired");
    expect(session.values.size).toBe(0); expect(local.values.size).toBe(0);
  });
  it("limpa A antes de abrir B no mesmo perfil", async () => {
    const first = new ChromeAuthStorage("local");
    await first.setItem(SESSION_STORAGE_KEY, token("A"));
    await first.touch(1000);
    local.values.set("honormed.last.A", { module: "consultas" });
    const second = new ChromeAuthStorage("local", "A");
    await second.setItem(SESSION_STORAGE_KEY, token("B"));
    await second.touch(2000);
    expect(local.values.has("honormed.last.A")).toBe(false);
    expect(await second.getItem(SESSION_STORAGE_KEY)).toBe(token("B"));
  });
});
const catalog: Catalog = { profile: "ambos", locations: [{ id: "L", nome: "Local" }], convenios: [{ id: "C", nome: "Convênio" }], types: [{ id: "T", nome: "Tipo" }] };
describe("contrato de registro", () => {
  it("envia apenas as colunas permitidas para consultas e laudos", () => {
    expect(payload({ module: "consultas", local_id: "L", convenio_id: "C", quantidade: 2, data_producao: "2026-10-18" }, "A", "I")).toEqual({ id: "I", medico_id: "A", local_id: "L", convenio_id: "C", quantidade: 2, data_producao: "2026-10-18" });
    expect(payload({ module: "laudos", local_id: "L", tipo_id: "T", quantidade: 3, data_producao: "2026-10-18" }, "A", "I")).toEqual({ id: "I", medico_id: "A", local_id: "L", tipo_id: "T", quantidade: 3, data_producao: "2026-10-18" });
  });
  it("rejeita módulo oculto, referências removidas e quantidade fora do limite", () => {
    expect(validate({ module: "consultas", local_id: "L", convenio_id: "C", quantidade: 1, data_producao: "2026-10-18" }, { ...catalog, profile: "laudos" })).toMatch(/perfil/);
    expect(validate({ module: "laudos", local_id: "L", tipo_id: "X", quantidade: 1, data_producao: "2026-10-18" }, catalog)).toMatch(/opção/);
    expect(validate({ module: "consultas", local_id: "L", convenio_id: "C", quantidade: 1001, data_producao: "2026-10-18" }, catalog)).toMatch(/1 a 1\.000/);
  });
});
