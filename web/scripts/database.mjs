import { PGlite } from "@electric-sql/pglite";
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
export const physician = "11111111-1111-4111-8111-111111111111";
export async function database() {
  const db = new PGlite();
  await db.exec(
    `create role authenticated nologin; create schema auth; create table auth.users(id uuid primary key); create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$; grant usage on schema auth,public to authenticated; grant execute on function auth.uid() to authenticated; insert into auth.users values ('${physician}');`,
  );
  const migrations = path.resolve(process.cwd(), "../supabase/migrations");
  for (const file of (await readdir(migrations))
    .filter((f) => f.endsWith(".sql"))
    .sort())
    await db.exec(await readFile(path.join(migrations, file), "utf8"));
  const seed = await readFile(
    path.resolve(process.cwd(), "../supabase/seed.sql"),
    "utf8",
  );
  await db.exec(seed.slice(seed.indexOf("insert into medicos")));
  return db;
}
