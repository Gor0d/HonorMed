import { build } from "esbuild";
import { zipSync } from "fflate";
import pngjs from "pngjs";
import { copyFile, mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const repo = path.resolve(root, "..");
const { version } = JSON.parse(await readFile(path.join(root, "package.json"), "utf8"));
const dist = path.join(root, "dist");
const release = path.join(root, "release");
const url = process.env.HONORMED_SUPABASE_URL;
const anon = process.env.HONORMED_SUPABASE_ANON_KEY;
const app = process.env.HONORMED_APP_URL;
if (!url || !anon || !app) {
  throw new Error("Defina HONORMED_SUPABASE_URL, HONORMED_SUPABASE_ANON_KEY e HONORMED_APP_URL para o build.");
}
const supabaseUrl = new URL(url);
const appUrl = new URL(app);
if (supabaseUrl.protocol !== "https:" || appUrl.protocol !== "https:" || supabaseUrl.pathname !== "/" || appUrl.pathname !== "/" || supabaseUrl.username || supabaseUrl.password || appUrl.username || appUrl.password || supabaseUrl.search || appUrl.search || supabaseUrl.hash || appUrl.hash) {
  throw new Error("Use origens HTTPS sem caminho, credenciais ou parâmetros nas URLs do build.");
}
if (/service[_-]?role/i.test(anon) || anon.startsWith("sb_secret_")) throw new Error("A chave fornecida não pode ser service role ou secret.");
if (anon.split(".").length === 3) {
  let claims;
  try { claims = JSON.parse(Buffer.from(anon.split(".")[1], "base64url").toString("utf8")); }
  catch { throw new Error("Chave JWT pública inválida."); }
  if (claims.role !== "anon") throw new Error("O JWT do build deve ter role anon.");
}

const brand = await readFile(path.join(repo, "web/src/lib/brand.ts"), "utf8");
const css = await readFile(path.join(repo, "web/src/app/globals.css"), "utf8");
const brandBlock = brand.match(/BRAND_COLORS\s*=\s*\{([^}]+)\}/)?.[1];
const lightBlock = css.match(/:root\s*\{([^}]+)\}/)?.[1];
if (!brandBlock || !lightBlock) throw new Error("Tokens de marca não encontrados.");
const brandToken = (name) => brandBlock.match(new RegExp(`\\b${name}:\\s*"(#[a-fA-F0-9]{6})"`))?.[1];
const uiToken = (name) => lightBlock.match(new RegExp(`--${name}:\\s*(#[a-fA-F0-9]{3,6})`))?.[1];
const tokens = {
  paper: brandToken("paper"), ink: uiToken("ink"), muted: uiToken("muted"),
  line: uiToken("line"), accent: uiToken("accent"), "accent-ink": uiToken("accent-ink"),
  surface: uiToken("surface"), "surface-2": uiToken("surface-2"),
};
if (Object.values(tokens).some((value) => !value)) throw new Error("Token de interface ausente.");

if (!dist.startsWith(root + path.sep) || !release.startsWith(root + path.sep)) throw new Error("Destino fora da extensão.");
await rm(dist, { recursive: true, force: true });
await mkdir(dist, { recursive: true });
await mkdir(release, { recursive: true });
const manifest = {
  manifest_version: 3,
  name: "HonorMed · Registro rápido",
  version,
  description: "Registre sua produção pessoal por quantidade, sem dados de pacientes.",
  action: { default_popup: "popup.html", default_title: "Registro rápido HonorMed" },
  icons: { 16: "icon-16.png", 48: "icon-48.png", 128: "icon-128.png" },
  permissions: ["storage"],
  host_permissions: [`${supabaseUrl.origin}/*`],
  commands: { _execute_action: { suggested_key: { default: "Alt+Shift+R" }, description: "Abrir registro rápido HonorMed" } },
};
await writeFile(path.join(dist, "manifest.json"), JSON.stringify(manifest, null, 2) + "\n");
await copyFile(path.join(root, "src/popup.html"), path.join(dist, "popup.html"));
const popupCss = await readFile(path.join(root, "src/popup.css"), "utf8");
const variables = `:root { ${Object.entries(tokens).map(([name, value]) => `--${name}: ${value};`).join(" ")} }\n`;
await writeFile(path.join(dist, "popup.css"), variables + popupCss);
await copyFile(path.join(repo, "web/public/brand/logo-primary.png"), path.join(dist, "logo-primary.png"));
const { PNG } = pngjs;
const sourceIcon = PNG.sync.read(await readFile(path.join(repo, "web/public/icon-192.png")));
for (const size of [16, 48, 128]) {
  const icon = new PNG({ width: size, height: size });
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    const left = x * sourceIcon.width / size, top = y * sourceIcon.height / size;
    const right = (x + 1) * sourceIcon.width / size, bottom = (y + 1) * sourceIcon.height / size;
    const totals = [0, 0, 0, 0];
    for (let sy = Math.floor(top); sy < Math.ceil(bottom); sy++) {
      for (let sx = Math.floor(left); sx < Math.ceil(right); sx++) {
        const weight = (Math.min(sx + 1, right) - Math.max(sx, left)) * (Math.min(sy + 1, bottom) - Math.max(sy, top));
        for (let channel = 0; channel < 4; channel++) totals[channel] += sourceIcon.data[(sy * sourceIcon.width + sx) * 4 + channel] * weight;
      }
    }
    const area = (right - left) * (bottom - top);
    for (let channel = 0; channel < 4; channel++) icon.data[(y * size + x) * 4 + channel] = Math.round(totals[channel] / area);
  }
  await writeFile(path.join(dist, `icon-${size}.png`), PNG.sync.write(icon));
}
await build({
  entryPoints: [path.join(root, "src/popup.ts")],
  outfile: path.join(dist, "popup.js"),
  bundle: true,
  minify: true,
  format: "iife",
  platform: "browser",
  target: "chrome120",
  define: {
    __HONORMED_SUPABASE_URL__: JSON.stringify(supabaseUrl.origin),
    __HONORMED_SUPABASE_ANON_KEY__: JSON.stringify(anon),
    __HONORMED_APP_URL__: JSON.stringify(appUrl.origin),
  },
});
const files = Object.fromEntries(await Promise.all((await readdir(dist)).map(async (name) => [name, new Uint8Array(await readFile(path.join(dist, name)))])));
await writeFile(path.join(release, "HonorMed_Registro_Rapido.zip"), zipSync(files, { level: 6 }));
await import("./check-artifacts.mjs");
console.log("Extensão gerada em dist/ e release/; somente variáveis públicas incorporadas.");
