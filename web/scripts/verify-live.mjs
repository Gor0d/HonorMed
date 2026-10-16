// Temporary users must be provisioned and removed by the deployment operator.
// This check uses ordinary public Supabase clients, never a service role key.
import { readFile } from "node:fs/promises";
import { createClient } from "@supabase/supabase-js";
import { chromium, expect } from "@playwright/test";
const fixture = JSON.parse(
  await readFile("../.supabase/auth-smoke.json", "utf8"),
);
const env = Object.fromEntries(
  (await readFile(".env.local", "utf8"))
    .split(/\r?\n/)
    .filter((line) => /^[A-Z_]+=/.test(line))
    .map((line) => {
      const index = line.indexOf("=");
      return [line.slice(0, index), line.slice(index + 1)];
    }),
);
const clients = fixture.users.map(() =>
  createClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    { auth: { persistSession: false, autoRefreshToken: false } },
  ),
);
function ok(result) {
  if (result.error) throw new Error(result.error.message);
  return result.data;
}
const browser = await chromium.launch();
try {
  for (let index = 0; index < clients.length; index++)
    ok(
      await clients[index].auth.signInWithPassword({
        email: fixture.users[index].email,
        password: fixture.password,
      }),
    );
  const [a, b] = clients;
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await page.goto(fixture.url);
  await page.getByLabel("E-mail", { exact: true }).fill(fixture.users[0].email);
  await page.getByLabel("Senha", { exact: true }).fill(fixture.password);
  await page.getByRole("button", { name: "Entrar", exact: true }).click();
  await page
    .getByLabel("Nome do médico", { exact: true })
    .fill("Verificação temporária A");
  await page.getByLabel("CRM / UF", { exact: true }).fill("TESTE-A");
  await page.getByRole("button", { name: "Concluir cadastro" }).click();
  await page
    .getByRole("dialog")
    .getByLabel("Meu perfil de uso", { exact: true })
    .selectOption("laudos");
  await page.getByRole("button", { name: "Salvar perfil de uso" }).click();
  await expect(page.getByTestId("radiology-balance")).toHaveText(/0,00/);
  const physician = fixture.users[0].id;
  const local = ok(
    await a
      .from("locais")
      .insert({ medico_id: physician, nome: "Local temporário" })
      .select()
      .single(),
  );
  const type = ok(
    await a
      .from("laudos_tipos")
      .insert({ medico_id: physician, nome: "Exame temporário" })
      .select()
      .single(),
  );
  ok(
    await a
      .from("laudos_valores")
      .insert({
        medico_id: physician,
        local_id: local.id,
        tipo_id: type.id,
        valor_unitario: 12.5,
      }),
  );
  const production = ok(
    await a
      .from("laudos_producao")
      .insert({
        medico_id: physician,
        local_id: local.id,
        tipo_id: type.id,
        data_producao: "2026-10-16",
        quantidade: 8,
      })
      .select()
      .single(),
  );
  ok(
    await a
      .from("laudos_recebimentos")
      .insert({
        medico_id: physician,
        local_id: local.id,
        competencia: "2026-10",
        data_recebimento: "2026-11-05",
        valor: 40,
      }),
  );
  const summary = ok(
    await a
      .from("laudos_resumo_competencia")
      .select()
      .eq("competencia", "2026-10")
      .single(),
  );
  if (Number(summary.a_receber) !== 60) throw Error("Saldo real incorreto");
  const convenio = ok(
    await a
      .from("convenios")
      .insert({ medico_id: physician, nome: "Convênio temporário" })
      .select()
      .single(),
  );
  ok(
    await a
      .from("honorarios_pessoais")
      .insert({
        medico_id: physician,
        local_id: local.id,
        convenio_id: convenio.id,
        valor_unitario: 50,
      }),
  );
  ok(
    await a
      .from("producoes_pessoais")
      .insert({
        id: crypto.randomUUID(),
        medico_id: physician,
        local_id: local.id,
        convenio_id: convenio.id,
        data_producao: "2026-10-16",
        quantidade: 3,
      }),
  );
  ok(
    await a
      .from("recebimentos_pessoais")
      .insert({
        medico_id: physician,
        local_id: local.id,
        convenio_id: convenio.id,
        competencia: "2026-10",
        data_recebimento: "2026-11-05",
        valor: 20,
      }),
  );
  const personal = ok(
    await a
      .from("controle_pessoal_competencia")
      .select()
      .eq("competencia", "2026-10")
      .single(),
  );
  if (Number(personal.a_receber) !== 130)
    throw Error("Saldo pessoal real incorreto");
  ok(
    await b
      .from("medicos")
      .insert({
        medico_id: fixture.users[1].id,
        nome: "Verificação temporária B",
        crm: "TESTE-B",
      }),
  );
  for (const table of [
    "medicos",
    "locais",
    "convenios",
    "honorarios_pessoais",
    "atendimentos",
    "recebimentos",
    "producoes_pessoais",
    "recebimentos_pessoais",
    "controle_pessoal_competencia",
    "laudos_tipos",
    "laudos_valores",
    "laudos_producao",
    "laudos_recebimentos",
    "laudos_calculados",
    "laudos_resumo_competencia",
  ]) {
    if (ok(await b.from(table).select().eq("medico_id", physician)).length)
      throw Error("RLS violado em " + table);
  }
  if (
    ok(
      await b
        .from("laudos_producao")
        .update({ quantidade: 99 })
        .eq("id", production.id)
        .select(),
    ).length
  )
    throw Error("UPDATE cruzado permitido");
  if (
    ok(
      await b.from("laudos_producao").delete().eq("id", production.id).select(),
    ).length
  )
    throw Error("DELETE cruzado permitido");
  const forbidden = await b
    .from("locais")
    .insert({ medico_id: physician, nome: "Proibido" });
  if (!forbidden.error) throw Error("INSERT cruzado permitido");
  for (const width of [390, 1280]) {
    await page.setViewportSize({ width, height: 900 });
    await page.reload();
    await page.getByLabel("Mês da produção", { exact: true }).fill("2026-10");
    await expect(page.getByTestId("radiology-balance")).toHaveText(/60,00/);
    await page.getByLabel("Mês da produção", { exact: true }).fill("2026-11");
    await expect(page.getByTestId("radiology-balance")).toHaveText(/0,00/);
    if (
      await page.evaluate(
        () => document.documentElement.scrollWidth > innerWidth,
      )
    )
      throw Error("Overflow horizontal");
    console.log(
      `Login real → onboarding → laudos → trocar competência aprovado em ${width}px`,
    );
  }
  ok(
    await a
      .from("preferencias_produto")
      .update({ perfil_uso: "ambos" })
      .eq("medico_id", physician),
  );
  await page.reload();
  await page.getByLabel("Mês da produção", { exact: true }).fill("2026-10");
  await expect(page.getByTestId("personal-balance")).toHaveText(/130,00/);
  await page.getByRole("button", { name: "Laudos", exact: true }).click();
  await page.getByLabel("Mês da produção", { exact: true }).fill("2026-10");
  await expect(page.getByTestId("radiology-balance")).toHaveText(/60,00/);
  console.log("Consultas e Laudos reais persistem com saldos independentes.");
  console.log("Supabase Auth/API reais: cálculo e isolamento A/B aprovados.");
} finally {
  await browser.close();
  for (const client of clients) await client.auth.signOut();
}
