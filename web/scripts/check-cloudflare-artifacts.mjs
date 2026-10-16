import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

// OpenNext serializes build environment into cloudflare/next-env.mjs.
// Fail closed if local server credentials were included in the generated bundle.
const credentials = [];
for (const directory of [process.cwd(), path.resolve("..")]) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (!entry.isFile() || !entry.name.startsWith(".env")) continue;
    const source = await readFile(path.join(directory, entry.name), "utf8");
    for (const line of source.split(/\r?\n/)) {
      const match = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
      if (!match || match[1].startsWith("NEXT_PUBLIC_")) continue;
      const value = match[2].trim().replace(/^['"]|['"]$/g, "");
      if (value.length >= 16) credentials.push(value);
    }
  }
}
async function check(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const file = path.join(directory, entry.name);
    if (entry.isDirectory()) await check(file);
    else if (entry.isFile()) {
      if (entry.name.startsWith(".env"))
        throw new Error(`Arquivo de ambiente no artefato: ${file}`);
      const content = await readFile(file, "utf8");
      if (credentials.some((value) => content.includes(value))) {
        throw new Error(
          `Credencial local detectada no artefato: ${file}. Não publicar.`,
        );
      }
    }
  }
}
await check(".open-next");
console.log(
  "Artefatos Cloudflare verificados: nenhuma credencial local conhecida ou arquivo .env.",
);
