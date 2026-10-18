import { spawn, spawnSync } from "node:child_process";
import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";
import { chromium } from "@playwright/test";

// Build and preview the hosted login layout with a deliberately invalid Auth URL.
// No real account, API or production project is contacted.
const env = {
  ...process.env,
  NEXT_PUBLIC_SUPABASE_URL: "https://preview.invalid",
  NEXT_PUBLIC_SUPABASE_ANON_KEY: "preview-anon-key",
  HONORMED_REQUIRE_SUPABASE: "false",
  VERCEL: "",
};
const built = spawnSync(process.execPath, ["node_modules/next/dist/bin/next", "build"], {
  cwd: process.cwd(), env, stdio: "inherit",
});
if (built.error) throw built.error;
if (built.status !== 0) process.exit(built.status ?? 1);

const port = 3200;
const origin = `http://127.0.0.1:${port}`;
const server = spawn(process.execPath, ["node_modules/next/dist/bin/next", "start", "--hostname", "127.0.0.1", "--port", String(port)], {
  cwd: process.cwd(), env, stdio: "ignore",
});
let browser;
try {
  let ready = false;
  for (let attempt = 0; attempt < 60; attempt++) {
    if (server.exitCode !== null) throw new Error("Preview server exited before startup");
    try {
      const response = await fetch(origin);
      if (response.ok) { ready = true; break; }
    } catch { /* Next is starting. */ }
    await new Promise((done) => setTimeout(done, 500));
  }
  if (!ready) throw new Error("Preview server did not start");

  browser = await chromium.launch();
  const output = resolve(process.cwd(), "../docs/brand/emails");
  await mkdir(output, { recursive: true });
  for (const [name, width, height] of [["390", 390, 844], ["1280", 1280, 900]]) {
    for (const theme of ["light", "dark"]) {
      const page = await browser.newPage({ viewport: { width, height }, colorScheme: theme });
      await page.goto(origin);
      await page.getByRole("button", { name: "Criar conta" }).waitFor();
      await page.getByRole("link", { name: "Esqueci minha senha" }).waitFor();
      const suffix = theme === "dark" ? `escuro-${name}` : name;
      await page.screenshot({ path: resolve(output, `previa-pagina-publica-${suffix}.png`), fullPage: true });
      await page.close();
    }
  }
} finally {
  await browser?.close();
  server.kill();
}
