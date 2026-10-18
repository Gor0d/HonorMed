import { chromium } from "@playwright/test";
import { mkdir, readFile, copyFile } from "node:fs/promises";
import { resolve } from "node:path";
import pngjs from "pngjs";

// Run after npm.cmd run test:e2e. The test screenshots use only intercepted,
// fictitious Auth/API responses; this script never opens the live service.
const repo = resolve(process.cwd(), "..");
const output = resolve(repo, "docs/brand/extension");
await mkdir(output, { recursive: true });
const brand = await readFile(resolve(repo, "web/src/lib/brand.ts"), "utf8");
const color = (name) => brand.match(new RegExp(`\\b${name}:\\s*"(#[a-fA-F0-9]{6})"`))?.[1];
const [deep, paper, gold] = [color("deep"), color("paper"), color("gold")];
if (!deep || !paper || !gold) throw new Error("Tokens da marca ausentes em brand.ts");
const logo = (await readFile(resolve(repo, "web/public/brand/logo-inverse.png"))).toString("base64");
const { PNG } = pngjs;
const browser = await chromium.launch();
try {
  for (const [module, title, explanation] of [
    ["consultas", "Consultas, registradas na hora.", "Data, local, convênio e quantidade no seu controle pessoal."],
    ["laudos", "Laudos, no mesmo ritmo.", "Instituição, tipo de exame e quantidade em poucos passos."],
  ]) {
    const source = resolve(process.cwd(), `test-results/popup-${module}.png`);
    const screenshot = await readFile(source);
    const { width, height } = PNG.sync.read(screenshot);
    if (width !== 380 || height < 600 || height > 760) throw new Error(`Captura inesperada: ${source} (${width}x${height})`);
    await copyFile(source, resolve(output, `popup-${module}-original.png`));
    const page = await browser.newPage({ viewport: { width: 1280, height: 800 }, deviceScaleFactor: 1 });
    await page.setContent(`<!doctype html><html lang="pt-BR"><meta charset="utf-8"><style>
      *{box-sizing:border-box}body{margin:0;font-family:Arial,sans-serif;background:${paper};color:${deep}}
      .layout{display:grid;grid-template-columns:1fr 550px;width:1280px;height:800px}
      .story{background:${deep};color:${paper};padding:76px 74px;display:flex;flex-direction:column}
      .logo{width:244px;height:auto;object-fit:contain;object-position:left}
      .eyebrow{font-size:14px;font-weight:700;letter-spacing:2px;margin-top:98px;color:${paper}}
      h1{font-size:56px;line-height:1.08;letter-spacing:-2px;margin:20px 0 26px;max-width:590px}
      .copy{font-size:23px;line-height:1.5;max-width:520px;margin:0;color:${paper}}
      .foot{margin-top:auto;border-top:3px solid ${gold};padding-top:22px;font-size:16px;color:${paper}}
      .preview{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px;padding:18px}
      .caption{font-size:13px;font-weight:700;letter-spacing:1px;text-transform:uppercase}
      .popup{display:block;width:380px;height:${height}px;border:1px solid #dedfd5;border-radius:4px;box-shadow:0 20px 48px #123c3a26}
    </style><main class="layout"><section class="story"><img class="logo" src="data:image/png;base64,${logo}" alt="HonorMed"><span class="eyebrow">REGISTRO RÁPIDO NO COMPUTADOR</span><h1>${title}</h1><p class="copy">${explanation}</p><p class="foot">Informado por você. Sem dados de pacientes.</p></section><section class="preview"><div class="caption">Interface do popup · dados fictícios</div><img class="popup" src="data:image/png;base64,${screenshot.toString("base64")}" alt="Popup de ${module}"></section></main></html>`);
    await page.screenshot({ path: resolve(output, `loja-${module}-1280x800.png`) });
    await page.close();
  }
  const page = await browser.newPage({ viewport: { width: 440, height: 280 }, deviceScaleFactor: 1 });
  await page.setContent(`<!doctype html><html lang="pt-BR"><meta charset="utf-8"><style>
    *{box-sizing:border-box}body{margin:0;background:${deep};color:${paper};font-family:Arial,sans-serif}
    main{height:280px;padding:29px 33px;position:relative;overflow:hidden}
    .logo{width:192px;height:auto}.rule{width:42px;height:4px;background:${gold};margin:35px 0 18px}
    h1{font-size:31px;line-height:1.08;letter-spacing:-.8px;margin:0;max-width:300px}
    p{font-size:14px;margin:9px 0 0}.circle{position:absolute;width:230px;height:230px;border:1px solid #ffffff33;border-radius:50%;right:-100px;bottom:-110px}
  </style><main><img class="logo" src="data:image/png;base64,${logo}" alt="HonorMed"><div class="rule"></div><h1>Registro rápido</h1><p>Consultas e Laudos por quantidade</p><div class="circle" aria-hidden="true"></div></main></html>`);
  await page.screenshot({ path: resolve(output, "loja-promocional-440x280.png") });
  await page.close();
} finally {
  await browser.close();
}
console.log(`Materiais fictícios da loja gerados em ${output}`);
