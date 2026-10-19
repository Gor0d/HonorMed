import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { checkStartup, ChromeAuthStorage, clearExtensionStorage, INACTIVITY_REMEMBER_MS, INACTIVITY_SESSION_MS, type Startup, type StorageMode } from "./auth-storage";
import { allowed, loadCatalog, save, today, undo, validate, type Catalog, type Draft, type Last, type Module } from "./register";

declare const __HONORMED_SUPABASE_URL__: string;
declare const __HONORMED_SUPABASE_ANON_KEY__: string;
declare const __HONORMED_APP_URL__: string;

const element = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;
const status = element<HTMLDivElement>("status");
const login = element<HTMLElement>("login");
const connected = element<HTMLElement>("connected");
const errorBox = element<HTMLParagraphElement>("error");
element<HTMLButtonElement>("feedback").addEventListener("click", () => {
  void chrome.tabs.create({ url: new URL("/suporte", __HONORMED_APP_URL__).href });
});
const loginForm = element<HTMLFormElement>("login-form");
let client: SupabaseClient | null = null;
let storage: ChromeAuthStorage | null = null;
let inactivityTimer: ReturnType<typeof setTimeout> | null = null;
let catalog: Catalog | null = null;
let selectedModule: Module = "consultas";
let activeUserId: string | null = null;
let saved: { id: string; module: Module } | null = null;
let busy = false;
const field = <T extends HTMLElement>(id: string) => element<T>(id);
const money = (value: number | string) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(value));
const lastKey = (userId: string) => `honormed.last.${userId}`;

function fillOptions(select: HTMLSelectElement, options: { id: string; nome: string }[]) {
  const previous = select.value;
  select.replaceChildren();
  for (const option of options) {
    const item = document.createElement("option");
    item.value = option.id;
    item.textContent = option.nome;
    select.append(item);
  }
  if (options.some((option) => option.id === previous)) select.value = previous;
}
function renderRegister() {
  if (!catalog) return;
  field<HTMLElement>("profile-required").hidden = !!catalog.profile;
  field<HTMLElement>("register").hidden = !catalog.profile;
  if (!catalog.profile) return;
  if (!allowed(catalog.profile, selectedModule)) selectedModule = catalog.profile === "laudos" ? "laudos" : "consultas";
  field<HTMLElement>("module-tabs").hidden = catalog.profile !== "ambos";
  for (const module of ["consultas", "laudos"] as const) field<HTMLButtonElement>(`tab-${module}`).setAttribute("aria-pressed", String(selectedModule === module));
  field<HTMLElement>("location-label").firstChild!.textContent = selectedModule === "consultas" ? "Local de atendimento " : "Instituição ";
  field<HTMLElement>("detail-label").firstChild!.textContent = selectedModule === "consultas" ? "Convênio " : "Tipo de exame ";
  fillOptions(field<HTMLSelectElement>("location"), catalog.locations);
  fillOptions(field<HTMLSelectElement>("detail"), selectedModule === "consultas" ? catalog.convenios : catalog.types);
  field<HTMLInputElement>("quantity").max = selectedModule === "consultas" ? "1000" : "10000";
  const missing = !catalog.locations.length || !(selectedModule === "consultas" ? catalog.convenios.length : catalog.types.length);
  field<HTMLElement>("missing").hidden = !missing;
  field<HTMLButtonElement>("save").disabled = missing || busy;
  field<HTMLElement>("repeat-confirm").hidden = true;
  field<HTMLButtonElement>("save").textContent = "Salvar registro";
}
async function showRegister(userId: string, mode: StorageMode) {
  if (!client) return;
  const loaded = await loadCatalog(client, userId);
  const current = await checkStartup();
  if (current.status !== "active" || current.userId !== userId) { await expireSession(current); return; }
  catalog = loaded;
  activeUserId = userId;
  if (!field<HTMLInputElement>("date").value) field<HTMLInputElement>("date").value = today();
  renderRegister();
  const last = (await chrome.storage[mode].get(lastKey(userId)))[lastKey(userId)];
  field<HTMLButtonElement>("repeat").hidden = !last || !catalog.profile;
  if (catalog.profile) field<HTMLInputElement>("quantity").focus();
}
async function ensureActive(): Promise<{ userId: string; mode: StorageMode }> {
  const current = await checkStartup();
  if (current.status !== "active" || !client || !activeUserId || current.userId !== activeUserId) {
    await expireSession(current);
    throw new Error("Sua sessão terminou. Entre novamente.");
  }
  const response = await client.auth.getUser();
  if (response.error || response.data.user?.id !== current.userId) throw new Error("Não foi possível validar sua sessão. Confira a conexão.");
  const again = await checkStartup();
  if (again.status !== "active" || again.userId !== current.userId) { await expireSession(again); throw new Error("Sua sessão terminou. Entre novamente."); }
  return { userId: current.userId, mode: current.mode };
}

function stopTimer() {
  if (inactivityTimer) clearTimeout(inactivityTimer);
  inactivityTimer = null;
}
function scheduleExpiry(expiresAt: number) {
  stopTimer();
  inactivityTimer = setTimeout(() => { void expireSession(); }, Math.max(0, expiresAt - Date.now()));
}
async function expireSession(startup?: Startup) {
  stopTimer();
  const current = startup ?? await checkStartup();
  if (current.status === "active") { scheduleExpiry(current.expiresAt); return; }
  client = null;
  storage = null;
  catalog = null;
  activeUserId = null;
  saved = null;
  show("login");
  showError("Sua sessão terminou por inatividade. Entre novamente.");
  if (current.status === "expired") void revokeExpired(current.session);
}
async function touchActivity(mode: StorageMode) {
  await storage?.touch();
  scheduleExpiry(Date.now() + (mode === "local" ? INACTIVITY_REMEMBER_MS : INACTIVITY_SESSION_MS));
}

function show(view: "login" | "connected") {
  status.hidden = true;
  login.hidden = view !== "login";
  connected.hidden = view !== "connected";
}
function showError(message: string) {
  errorBox.textContent = message;
  errorBox.hidden = !message;
}
function makeClient(mode: StorageMode, userId: string | null = null) {
  storage = new ChromeAuthStorage(mode, userId);
  client = createClient(__HONORMED_SUPABASE_URL__, __HONORMED_SUPABASE_ANON_KEY__, {
    auth: { storage, storageKey: "honormed-auth", persistSession: true, autoRefreshToken: true, detectSessionInUrl: false },
  });
  return client;
}
async function revokeExpired(raw: string | null) {
  if (!raw) return;
  try {
    const session = JSON.parse(raw) as { access_token?: string; refresh_token?: string };
    if (!session.access_token || !session.refresh_token) return;
    const memory = new Map<string, string>();
    const temporary = createClient(__HONORMED_SUPABASE_URL__, __HONORMED_SUPABASE_ANON_KEY__, {
      auth: {
        storage: {
          getItem: async (key: string) => memory.get(key) ?? null,
          setItem: async (key: string, value: string) => { memory.set(key, value); },
          removeItem: async (key: string) => { memory.delete(key); },
        },
        persistSession: true, autoRefreshToken: false, detectSessionInUrl: false,
      },
    });
    const result = await temporary.auth.setSession({ access_token: session.access_token, refresh_token: session.refresh_token });
    if (!result.error) await temporary.auth.signOut({ scope: "local" });
  } catch { /* Local access is already blocked; remote revocation is best effort. */ }
}

async function bootstrap() {
  try {
    const startup = await checkStartup();
    if (startup.status === "expired") {
      show("login");
      showError("Sua sessão terminou por inatividade. Entre novamente.");
      void revokeExpired(startup.session);
      return;
    }
    if (startup.status === "none") { show("login"); return; }
    const auth = makeClient(startup.mode, startup.userId);
    const result = await auth.auth.getUser();
    if (Date.now() >= startup.expiresAt) { await expireSession(); return; }
    if (result.error || !result.data.user) {
      if (result.error?.status === 401 || result.error?.status === 403) {
        await clearExtensionStorage();
        show("login");
        showError("Sua sessão terminou. Entre novamente.");
      } else {
        show("login");
        showError("Não foi possível validar a conta agora. Confira sua conexão.");
      }
      return;
    }
    show("connected");
    scheduleExpiry(startup.expiresAt);
    await showRegister(startup.userId, startup.mode);
  } catch {
    show("login");
    showError("Não foi possível abrir a extensão. Tente novamente.");
  }
}

loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  showError("");
  const email = element<HTMLInputElement>("email").value.trim();
  const password = element<HTMLInputElement>("password").value;
  const mode: StorageMode = element<HTMLInputElement>("remember").checked ? "local" : "session";
  const enter = element<HTMLButtonElement>("enter");
  enter.disabled = true;
  try {
    await clearExtensionStorage();
    const auth = makeClient(mode);
    const result = await auth.auth.signInWithPassword({ email, password });
    if (result.error || !result.data.user) throw new Error("E-mail ou senha inválidos, ou conexão indisponível.");
    await touchActivity(mode);
    element<HTMLInputElement>("password").value = "";
    show("connected");
    await showRegister(result.data.user.id, mode);
  } catch {
    showError("Não foi possível entrar. Confira e-mail, senha e conexão.");
  } finally {
    enter.disabled = false;
  }
});

element<HTMLButtonElement>("logout").addEventListener("click", async () => {
  const logout = element<HTMLButtonElement>("logout");
  logout.disabled = true;
  showError("");
  let remoteError = false;
  try { remoteError = Boolean((await client?.auth.signOut({ scope: "local" }))?.error); }
  catch { remoteError = true; }
  finally {
    stopTimer();
    await clearExtensionStorage();
    client = null;
    storage = null;
    catalog = null;
    activeUserId = null;
    saved = null;
    show("login");
    if (remoteError) showError("Sessão local encerrada; não foi possível confirmar a saída no servidor.");
    logout.disabled = false;
  }
});
element<HTMLButtonElement>("open-app").addEventListener("click", async () => {
  const startup = await checkStartup();
  if (startup.status !== "active") { await expireSession(startup); return; }
  await touchActivity(startup.mode);
  await chrome.tabs.create({ url: __HONORMED_APP_URL__ });
});
element<HTMLButtonElement>("forgot").addEventListener("click", () => {
  void chrome.tabs.create({ url: `${__HONORMED_APP_URL__}/recuperar-senha` });
});
element<HTMLButtonElement>("signup").addEventListener("click", () => {
  void chrome.tabs.create({ url: __HONORMED_APP_URL__ });
});
for (const eventName of ["pointerdown", "keydown", "input", "change"]) connected.addEventListener(eventName, (event) => {
  if (!event.isTrusted || !activeUserId) return;
  void checkStartup().then(async (current) => {
    if (current.status === "active" && current.userId === activeUserId) await touchActivity(current.mode);
    else await expireSession(current);
  });
});

for (const module of ["consultas", "laudos"] as const) field<HTMLButtonElement>(`tab-${module}`).addEventListener("click", () => {
  selectedModule = module;
  renderRegister();
  field<HTMLInputElement>("quantity").focus();
});
field<HTMLButtonElement>("choose-profile").addEventListener("click", () => { void chrome.tabs.create({ url: __HONORMED_APP_URL__ }); });
field<HTMLButtonElement>("settings").addEventListener("click", () => { void chrome.tabs.create({ url: `${__HONORMED_APP_URL__}/?area=ajustes&modulo=${selectedModule}` }); });
field<HTMLButtonElement>("repeat").addEventListener("click", async () => {
  try {
    const { userId, mode } = await ensureActive();
    if (!catalog) return;
    const last = (await chrome.storage[mode].get(lastKey(userId)))[lastKey(userId)] as Last | undefined;
    if (!last || !allowed(catalog.profile, last.module)) throw new Error("O último registro não está disponível para seu perfil atual.");
    if (!catalog.locations.some((item) => item.id === last.local_id) || !(last.module === "consultas" ? catalog.convenios.some((item) => item.id === last.convenio_id) : catalog.types.some((item) => item.id === last.tipo_id))) throw new Error("Esta opção não está mais disponível. Atualize a lista e selecione outra.");
    selectedModule = last.module;
    renderRegister();
    field<HTMLSelectElement>("location").value = last.local_id;
    field<HTMLSelectElement>("detail").value = last.module === "consultas" ? last.convenio_id! : last.tipo_id!;
    field<HTMLInputElement>("quantity").value = String(last.quantidade);
    field<HTMLElement>("repeat-confirm").hidden = false;
    field<HTMLButtonElement>("save").textContent = "Confirmar repetição e salvar";
    await touchActivity(mode);
    field<HTMLInputElement>("quantity").focus();
  } catch (cause) { showError(cause instanceof Error ? cause.message : "Não foi possível repetir o último registro."); }
});
field<HTMLFormElement>("register-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  if (busy || !catalog || !client) return;
  const draft: Draft = { module: selectedModule, local_id: field<HTMLSelectElement>("location").value,
    data_producao: field<HTMLInputElement>("date").value, quantidade: Number(field<HTMLInputElement>("quantity").value),
    ...(selectedModule === "consultas" ? { convenio_id: field<HTMLSelectElement>("detail").value } : { tipo_id: field<HTMLSelectElement>("detail").value }) };
  const validation = validate(draft, catalog);
  if (validation) { showError(validation); return; }
  busy = true;
  field<HTMLButtonElement>("save").disabled = true;
  showError("");
  try {
    const { userId, mode } = await ensureActive();
    await touchActivity(mode);
    const { id, result } = await save(client, userId, draft);
    saved = { id, module: draft.module };
    const last: Last = { module: draft.module, local_id: draft.local_id, quantidade: draft.quantidade,
      ...(draft.module === "consultas" ? { convenio_id: draft.convenio_id } : { tipo_id: draft.tipo_id }) };
    try { await chrome.storage[mode].set({ [lastKey(userId)]: last }); field<HTMLButtonElement>("repeat").hidden = false; }
    catch { /* The confirmed registration remains saved; repeat metadata is optional. */ }
    const label = `${draft.quantidade} ${draft.module === "consultas" ? draft.quantidade === 1 ? "consulta registrada" : "consultas registradas" : draft.quantidade === 1 ? "laudo registrado" : "laudos registrados"}.`;
    field<HTMLElement>("saved").textContent = result ? `${label} ${result.valor_previsto === null ? "Valor pendente." : `Valor previsto: ${money(result.valor_previsto)}.`} Informado por você.` : `${label} Abra o HonorMed para conferir o valor.`;
    field<HTMLElement>("saved").hidden = false;
    field<HTMLButtonElement>("undo").hidden = false;
    field<HTMLElement>("undo-confirm").hidden = true;
    field<HTMLInputElement>("quantity").value = "";
    field<HTMLInputElement>("quantity").focus();
    field<HTMLElement>("repeat-confirm").hidden = true;
    field<HTMLButtonElement>("save").textContent = "Salvar registro";
  } catch (cause) {
    showError(cause instanceof Error && cause.message.startsWith("Sua sessão") ? cause.message : "Não foi possível salvar. Confira a conexão e as opções; o formulário foi mantido.");
  } finally { busy = false; if (catalog) renderRegister(); }
});
field<HTMLButtonElement>("undo").addEventListener("click", () => { field<HTMLElement>("undo-confirm").hidden = false; });
field<HTMLButtonElement>("cancel-undo").addEventListener("click", () => { field<HTMLElement>("undo-confirm").hidden = true; });
field<HTMLButtonElement>("confirm-undo").addEventListener("click", async () => {
  if (!saved || busy || !client) return;
  busy = true;
  try {
    const { userId, mode } = await ensureActive();
    await touchActivity(mode);
    await undo(client, userId, saved.module, saved.id);
    saved = null;
    field<HTMLElement>("saved").textContent = "Último lançamento desfeito.";
    field<HTMLButtonElement>("undo").hidden = true;
    field<HTMLElement>("undo-confirm").hidden = true;
    showError("");
  } catch { showError("Não foi possível desfazer o lançamento. Confira no HonorMed antes de tentar novamente."); }
  finally { busy = false; }
});
field<HTMLFormElement>("register-form").addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    field<HTMLInputElement>("quantity").value = "";
    field<HTMLElement>("repeat-confirm").hidden = true;
    field<HTMLButtonElement>("save").textContent = "Salvar registro";
    showError("");
  }
});

void bootstrap();
