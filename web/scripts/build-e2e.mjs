import { spawnSync } from "node:child_process";

// Seeded browser tests always target the isolated local demo, even on a machine
// configured for production. Never let the test suite write to the real backend.
const result = spawnSync(
  process.execPath,
  ["node_modules/next/dist/bin/next", "build"],
  {
    stdio: "inherit",
    env: {
      ...process.env,
      NEXT_PUBLIC_SUPABASE_URL: "",
      NEXT_PUBLIC_SUPABASE_ANON_KEY: "",
      HONORMED_REQUIRE_SUPABASE: "false",
      VERCEL: "",
    },
  },
);
if (result.error) throw result.error;
process.exit(result.status ?? 1);
