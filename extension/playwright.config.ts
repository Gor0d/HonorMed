import { defineConfig } from "@playwright/test";
export default defineConfig({ testDir: "e2e", workers: 1, use: { viewport: { width: 380, height: 720 }, timezoneId: "America/Sao_Paulo" } });
