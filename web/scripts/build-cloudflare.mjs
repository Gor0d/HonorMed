import { spawnSync } from "node:child_process";

// The Next.js build loads .env files itself. Require real backend configuration
// for every deployable Cloudflare build, just as Vercel does.
const result = spawnSync(
  process.execPath,
  ["node_modules/@opennextjs/cloudflare/dist/cli/index.js", "build"],
  {
    stdio: "inherit",
    env: { ...process.env, HONORMED_REQUIRE_SUPABASE: "true" },
  },
);
if (result.error) throw result.error;
if (result.status !== 0) process.exit(result.status ?? 1);
const check = spawnSync(
  process.execPath,
  ["scripts/check-cloudflare-artifacts.mjs"],
  { stdio: "inherit" },
);
if (check.error) throw check.error;
process.exit(check.status ?? 1);
