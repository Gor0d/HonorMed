import { defineConfig } from "@playwright/test";
const port = process.env.PLAYWRIGHT_TEST_PORT || "3100";
export default defineConfig({
  testDir: "e2e",
  fullyParallel: false,
  workers: 1,
  use: { baseURL: `http://127.0.0.1:${port}`, trace: "retain-on-failure" },
  webServer: {
    env: {
      NEXT_PUBLIC_SUPABASE_URL: "",
      NEXT_PUBLIC_SUPABASE_ANON_KEY: "",
      HONORMED_REQUIRE_SUPABASE: "false",
      VERCEL: "",
    },
    command: `node node_modules/next/dist/bin/next start --hostname 127.0.0.1 --port ${port}`,
    url: `http://127.0.0.1:${port}`,
    reuseExistingServer: false,
    timeout: 120000,
  },
  projects: [
    { name: "mobile", use: { viewport: { width: 390, height: 844 }, timezoneId: "America/Sao_Paulo" } },
    { name: "desktop", use: { viewport: { width: 1280, height: 900 }, timezoneId: "America/Sao_Paulo" } },
  ],
});
