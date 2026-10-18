import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { unzipSync } from "fflate";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const repo = path.resolve(root, "..");
const dist = path.join(root, "dist");
const zipPath = path.join(root, "release/HonorMed_Registro_Rapido.zip");
const manifest = JSON.parse(await readFile(path.join(dist, "manifest.json"), "utf8"));
const forbiddenPermissions = ["<all_urls>", "tabs", "cookies", "history", "scripting", "webRequest", "alarms"];
if (JSON.stringify(manifest).includes("content_scripts") || manifest.background || manifest.permissions?.length !== 1 || manifest.permissions[0] !== "storage" || manifest.host_permissions?.length !== 1 || forbiddenPermissions.some((permission) => JSON.stringify(manifest).includes(`"${permission}"`))) {
  throw new Error("Manifest contém permissão ou capacidade fora do escopo.");
}
const expectedHost = process.env.HONORMED_SUPABASE_URL ? `${new URL(process.env.HONORMED_SUPABASE_URL).origin}/*` : null;
if (!/^https:\/\/[^/*]+\/\*$/.test(manifest.host_permissions[0]) || (expectedHost && manifest.host_permissions[0] !== expectedHost)) {
  throw new Error("Host permission não corresponde à origem Supabase do build.");
}
const knownSecrets = [];
for (const directory of [root, repo, path.join(repo, "web")]) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (!entry.isFile() || !entry.name.startsWith(".env")) continue;
    const source = await readFile(path.join(directory, entry.name), "utf8");
    for (const line of source.split(/\r?\n/)) {
      const match = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
      if (!match || match[1].startsWith("NEXT_PUBLIC_") || match[1] === "HONORMED_SUPABASE_ANON_KEY") continue;
      const value = match[2].trim().replace(/^['"]|['"]$/g, "");
      if (value.length >= 16) knownSecrets.push(value);
    }
  }
}
for (const name of ["SUPABASE_SERVICE_ROLE_KEY", "RESEND_API_KEY", "VERCEL_TOKEN", "CLOUDFLARE_API_TOKEN", "DATABASE_URL"]) {
  if (process.env[name]?.length >= 16) knownSecrets.push(process.env[name]);
}
const files = await readdir(dist);
const zip = unzipSync(new Uint8Array(await readFile(zipPath)));
if (files.length !== Object.keys(zip).length || files.some((file) => !zip[file])) throw new Error("ZIP não corresponde à pasta dist.");
for (const file of files) {
  if (file.startsWith(".env")) throw new Error("Arquivo .env encontrado no pacote.");
  const bytes = await readFile(path.join(dist, file));
  if (!Buffer.from(zip[file]).equals(bytes)) throw new Error("ZIP contém arquivo diferente de dist.");
  if (!/\.(js|json|css|html)$/.test(file)) continue;
  const content = bytes.toString("utf8");
  if (/service[_-]?role/i.test(content) || knownSecrets.some((value) => content.includes(value))) {
    throw new Error(`Credencial proibida detectada em ${file}.`);
  }
}
console.log("Manifest, ZIP e artefatos verificados: permissões mínimas e nenhuma credencial conhecida.");
