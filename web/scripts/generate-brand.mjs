import { mkdir, writeFile, readFile } from "node:fs/promises";
import { chromium } from "@playwright/test";

const directory = "public/brand";
await mkdir(directory, { recursive: true });
const geometry = `<path d="M17 16H26V29L38 24V16H47V48H38V34L26 39V48H17V16Z" fill="#f8f5ed"/><path d="M38 16H47V25L38 29V16Z" fill="#dfb86c"/>`;
const svg = (body, width, height) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">${body}</svg>`;
const symbol = svg(
  `<rect width="64" height="64" rx="19" fill="#123c3a"/>${geometry}`,
  64,
  64,
);
const wordmark = JSON.parse(
  await readFile("../docs/brand/wordmark-paths.json", "utf8"),
);
await writeFile(`${directory}/symbol.svg`, symbol);
await writeFile(
  `${directory}/symbol-mono.svg`,
  svg(
    `<path fill="currentColor" d="M17 16H26V29L38 24V16H47V48H38V34L26 39V48H17V16Z"/>`,
    64,
    64,
  ),
);
for (const [variant, color] of [
  ["primary", "#123c3a"],
  ["inverse", "#f8f5ed"],
]) {
  const logo = svg(
    `<rect width="64" height="64" rx="19" fill="#123c3a"/>${geometry}<path fill="${color}" d="${wordmark.path}"/><path fill="#dfb86c" d="${wordmark.dot}"/>`,
    wordmark.width,
    64,
  );
  await writeFile(`${directory}/logo-${variant}.svg`, logo);
}
// Render code-native SVG assets at their final PWA sizes; no image model needed.
const browser = await chromium.launch();
try {
  for (const size of [192, 512]) {
    const page = await browser.newPage({
      viewport: { width: size, height: size },
      deviceScaleFactor: 1,
    });
    // A full-bleed icon background and centered mark keep all detail within the maskable safe zone.
    const icon = svg(
      `<rect width="64" height="64" fill="#123c3a"/><g transform="translate(4 4) scale(.875)">${geometry}</g>`,
      64,
      64,
    );
    await page.setContent(
      `<style>html,body{margin:0;width:100%;height:100%;background:#123c3a}svg{width:100%;height:100%;display:block}</style>${icon}`,
    );
    await page.screenshot({ path: `public/icon-${size}.png` });
    await page.close();
  }
  for (const variant of ["primary", "inverse"]) {
    const page = await browser.newPage({
      viewport: { width: wordmark.width * 4, height: 256 },
      deviceScaleFactor: 1,
    });
    const content = await readFile(`${directory}/logo-${variant}.svg`, "utf8");
    await page.setContent(
      `<style>html,body{margin:0;background:transparent}svg{width:100%;height:256px;display:block}</style>${content}`,
    );
    await page.screenshot({
      path: `${directory}/logo-${variant}.png`,
      omitBackground: true,
    });
    await page.close();
  }
  const page = await browser.newPage({
    viewport: { width: 1280, height: 900 },
    deviceScaleFactor: 1,
  });
  const { pathToFileURL } = await import("node:url");
  const path = await import("node:path");
  await page.goto(
    pathToFileURL(path.resolve("../docs/brand/identidade.html")).href,
  );
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({
    path: "../docs/brand/identidade.png",
    fullPage: true,
  });
  await page.emulateMedia({ media: "screen" });
  const height = await page.evaluate(
    () => document.documentElement.scrollHeight,
  );
  await page.pdf({
    path: "../docs/brand/HonorMed_Identidade_Visual.pdf",
    width: "1280px",
    height: `${height}px`,
    printBackground: true,
  });
} finally {
  await browser.close();
}
console.log("Marca SVG, ícones PWA e prancha de identidade gerados.");
