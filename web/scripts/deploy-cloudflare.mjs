import { spawnSync } from "node:child_process";
const check = spawnSync(
  process.execPath,
  ["scripts/check-cloudflare-artifacts.mjs"],
  { stdio: "inherit" },
);
if (check.error) throw check.error;
if (check.status !== 0) process.exit(check.status ?? 1);
// No R2/remote incremental cache is configured. Avoid OpenNext's local Miniflare
// cache-population step, which crashes on this Windows machine.
const deploy = spawnSync(
  process.execPath,
  ["node_modules/wrangler/bin/wrangler.js", "deploy"],
  {
    stdio: "inherit",
    env: { ...process.env, OPEN_NEXT_DEPLOY: "true" },
  },
);
if (deploy.error) throw deploy.error;
process.exit(deploy.status ?? 1);
