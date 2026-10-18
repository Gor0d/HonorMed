import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { checkStartup, ChromeAuthStorage, clearExtensionStorage, INACTIVITY_REMEMBER_MS, INACTIVITY_SESSION_MS, type Startup, type StorageMode } from "./auth-storage";

declare const __HONORMED_SUPABASE_URL__: string;
declare const __HONORMED_SUPABASE_ANON_KEY__: string;
declare const __HONORMED_APP_URL__: string;

const element = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;
const status = element<HTMLDivElement>("status");
const login = element<HTMLElement>("login");
const connected = element<HTMLElement>("connected");
const errorBox = element<HTMLParagraphElement>("error");
const loginForm = element<HTMLFormElement>("login-form");
let client: SupabaseClient | null = null;
let storage: ChromeAuthStorage | null = null;
let inactivityTimer: ReturnType<typeof setTimeout> | null = null;

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
    if (!result.error) await temporary.auth.signOut();
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
  try { remoteError = Boolean((await client?.auth.signOut())?.error); }
  catch { remoteError = true; }
  finally {
    stopTimer();
    await clearExtensionStorage();
    client = null;
    storage = null;
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

void bootstrap();
