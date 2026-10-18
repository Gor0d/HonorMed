process.env.HONORMED_SUPABASE_URL = "https://honormed-test.supabase.invalid";
process.env.HONORMED_SUPABASE_ANON_KEY = "public-anon-test-value";
process.env.HONORMED_APP_URL = "https://honormed-test.invalid";
await import("./build.mjs");
