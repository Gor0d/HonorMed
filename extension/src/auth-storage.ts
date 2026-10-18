export type StorageMode = "session" | "local";
export const INACTIVITY_SESSION_MS = 30 * 60 * 1000;
export const INACTIVITY_REMEMBER_MS = 12 * 60 * 60 * 1000;

const ACTIVE_USER = "honormed.activeUserId";
const LAST_ACTIVITY = "honormed.lastActivity";
const authKey = (userId: string) => `honormed.auth.${userId}`;
const area = (mode: StorageMode) => chrome.storage[mode];

export type Startup =
  | { status: "none" }
  | { status: "active"; mode: StorageMode; userId: string; expiresAt: number }
  | { status: "expired"; session: string | null };

export async function clearExtensionStorage(): Promise<void> {
  await Promise.all([chrome.storage.session.clear(), chrome.storage.local.clear()]);
}

/** This check blocks startup before Supabase reads any persisted session. */
export async function checkStartup(now = Date.now()): Promise<Startup> {
  const [temporary, remembered] = await Promise.all([
    area("session").get([ACTIVE_USER, LAST_ACTIVITY]),
    area("local").get([ACTIVE_USER, LAST_ACTIVITY]),
  ]);
  if (temporary[ACTIVE_USER] && remembered[ACTIVE_USER]) {
    await clearExtensionStorage();
    return { status: "none" };
  }
  const mode: StorageMode = remembered[ACTIVE_USER] ? "local" : "session";
  const metadata = mode === "local" ? remembered : temporary;
  const userId = metadata[ACTIVE_USER];
  if (typeof userId !== "string" || !userId) return { status: "none" };
  const lastActivity = metadata[LAST_ACTIVITY];
  const session = (await area(mode).get(authKey(userId)))[authKey(userId)];
  const limit = mode === "local" ? INACTIVITY_REMEMBER_MS : INACTIVITY_SESSION_MS;
  if (typeof lastActivity !== "number" || !Number.isFinite(lastActivity) || lastActivity > now || now - lastActivity >= limit || typeof session !== "string") {
    await clearExtensionStorage();
    return { status: "expired", session: typeof session === "string" ? session : null };
  }
  return { status: "active", mode, userId, expiresAt: lastActivity + limit };
}

/** Supabase writes are scoped to the authenticated user's ID, not their email. */
export class ChromeAuthStorage {
  private userId: string | null;
  constructor(private readonly mode: StorageMode, userId: string | null = null) {
    this.userId = userId;
  }
  async getItem(_key: string): Promise<string | null> {
    if (!this.userId) return null;
    const value = (await area(this.mode).get(authKey(this.userId)))[authKey(this.userId)];
    return typeof value === "string" ? value : null;
  }
  async setItem(_key: string, value: string): Promise<void> {
    const session = JSON.parse(value) as { user?: { id?: string } };
    const userId = session.user?.id;
    if (!userId) throw new Error("Sessão sem identificação do usuário.");
    if (this.userId && this.userId !== userId) await clearExtensionStorage();
    this.userId = userId;
    await area(this.mode).set({ [authKey(userId)]: value, [ACTIVE_USER]: userId });
  }
  async removeItem(_key: string): Promise<void> {
    if (this.userId) await area(this.mode).remove(authKey(this.userId));
  }
  async touch(now = Date.now()): Promise<void> {
    if (this.userId) await area(this.mode).set({ [LAST_ACTIVITY]: now });
  }
}
