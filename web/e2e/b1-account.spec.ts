import { test, expect } from "@playwright/test";
import {
  accountFixture,
  accountA,
  accountB,
  asAccount,
  accountTables,
} from "../tests/helpers/account-fixture";
import type { AccountExport } from "../src/lib/account-data";

const tables = {
  preferences: "preferencias_produto",
  radiologyTypes: "laudos_tipos",
  radiologyFees: "laudos_valores",
  radiologyProduction: "laudos_calculados",
  radiologyReceipts: "laudos_recebimentos",
  radiologySummaries: "laudos_resumo_competencia",
  radiologyLocations: "laudos_resumo_locais",
  radiologyTypeSummaries: "laudos_resumo_tipos",
  profile: "medicos",
  convenios: "convenios",
  rules: "regras_repasse",
  rows: "atendimentos_importados_calculados",
  summaries: "repasses_competencia",
  goals: "metas",
  locations: "locais_atendimento",
  fees: "honorarios_pessoais",
  production: "producao_pessoal_calculada",
  receipts: "recebimentos_pessoais",
  personalSummaries: "controle_pessoal_competencia",
  locationSummaries: "controle_pessoal_locais",
  reconciliation: "resumo_competencia",
};
test("exportar os dois módulos, cancelar e excluir somente a própria conta", async ({
  page,
}) => {
  const db = await accountFixture();
  let failExport = false,
    failDelete = false;
  try {
    await page
      .context()
      .route("https://*.supabase.co/**", (route) => route.abort());
    await page.route("**/api/demo", async (route) => {
      try {
        const result = await asAccount(db, accountA, async () => {
          if (route.request().method() === "GET") {
            const data: Record<string, unknown> = {};
            for (const [key, table] of Object.entries(tables))
              data[key] = (await db.query(`select * from ${table}`)).rows;
            return data;
          }
          const body = route.request().postDataJSON();
          if(body.table === "__metricas") return (await db.query<{data:unknown}>("select estado_metricas_piloto() data")).rows[0].data;
          if (body.table !== "__conta")
            throw new Error("Operação não prevista no teste");
          if (body.action === "exportar_meus_dados") {
            if (failExport) throw new Error("Exportação indisponível no teste");
            return (
              await db.query<{ data: unknown }>(
                "select exportar_meus_dados() as data",
              )
            ).rows[0].data;
          }
          if (failDelete) throw new Error("Exclusão indisponível no teste");
          await db.query("select excluir_minha_conta($1)", [
            body.values.confirmacao,
          ]);
          return { ok: true };
        });
        await route.fulfill({ json: result });
      } catch (error) {
        await route.fulfill({
          status: 400,
          json: { error: (error as Error).message },
        });
      }
    });
    await page.goto("/?area=ajustes");
    await page.getByRole("button", { name: "Entrar", exact: true }).click();
    await expect(
      page.getByRole("heading", { name: "Seus dados e sua conta" }),
    ).toBeVisible();
    const jsonDownload = page.waitForEvent("download");
    await page.getByRole("button", { name: "Exportar JSON" }).click();
    const download = await jsonDownload;
    const stream = await download.createReadStream();
    const chunks = [];
    for await (const chunk of stream!) chunks.push(chunk);
    const exported = JSON.parse(
      Buffer.concat(chunks).toString(),
    ) as AccountExport;
    expect(Object.keys(exported.dados).sort()).toEqual(
      [...accountTables,"piloto_preferencias","piloto_contadores"].sort(),
    );
    for (const records of Object.values(exported.dados))
      expect(records.every((record) => record.medico_id === accountA)).toBe(
        true,
      );
    const csvDownload = page.waitForEvent("download");
    await page.getByRole("button", { name: "Exportar CSV" }).click();
    const csv = await csvDownload;
    const csvStream = await csv.createReadStream();
    const csvChunks = [];
    for await (const chunk of csvStream!) csvChunks.push(chunk);
    expect(Buffer.concat(csvChunks).toString()).toContain("'=SOMA(1;2)");
    failExport = true;
    await page.getByRole("button", { name: "Exportar JSON" }).click();
    await expect(
      page.locator(".account-controls").getByRole("alert"),
    ).toHaveText("Exportação indisponível no teste");
    await page
      .getByRole("button", { name: "Excluir minha conta", exact: true })
      .click();
    const dialog = page.getByRole("dialog", { name: "Excluir minha conta" });
    await expect(
      dialog.getByRole("button", { name: "Excluir definitivamente" }),
    ).toBeDisabled();
    await dialog
      .getByLabel("Digite EXCLUIR MINHA CONTA", { exact: true })
      .fill("EXCLUIR MINHA CONTA");
    await expect(
      dialog.getByRole("button", { name: "Excluir definitivamente" }),
    ).toBeDisabled();
    await dialog.getByRole("button", { name: "Cancelar" }).click();
    expect((await db.query("select * from auth.users")).rows).toHaveLength(2);
    // The same controls are available to radiologists through their Settings.
    await page.getByRole("button", { name: "Laudos", exact: true }).click();
    await page.getByRole("button", { name: "Ajustes", exact: true }).click();
    await expect(
      page.getByRole("button", { name: "Exportar JSON" }),
    ).toBeVisible();
    await page
      .getByRole("button", { name: "Excluir minha conta", exact: true })
      .click();
    await dialog
      .getByLabel("Digite EXCLUIR MINHA CONTA", { exact: true })
      .fill("EXCLUIR MINHA CONTA");
    await dialog.getByRole("checkbox").check();
    failDelete = true;
    await dialog
      .getByRole("button", { name: "Excluir definitivamente" })
      .click();
    await expect(dialog.getByRole("alert")).toHaveText(
      "Exclusão indisponível no teste",
    );
    expect((await db.query("select * from auth.users")).rows).toHaveLength(2);
    failDelete = false;
    await dialog
      .getByRole("button", { name: "Excluir definitivamente" })
      .click();
    await expect(
      page.getByRole("button", { name: "Entrar", exact: true }),
    ).toBeVisible();
    expect(
      await page.evaluate(() => sessionStorage.getItem("repasse-demo")),
    ).toBeNull();
    expect(
      (await db.query("select * from auth.users where id=$1", [accountA])).rows,
    ).toHaveLength(0);
    expect(
      (await db.query("select * from auth.users where id=$1", [accountB])).rows,
    ).toHaveLength(1);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  } finally {
    await db.close();
  }
});
