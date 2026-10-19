import { afterEach, beforeEach, expect, it } from "vitest";
import {
  accountA,
  accountB,
  accountFixture,
  accountTables,
  asAccount,
} from "./helpers/account-fixture";
import { accountCsv, type AccountExport } from "../src/lib/account-data";
let db: Awaited<ReturnType<typeof accountFixture>>;
beforeEach(async () => {
  db = await accountFixture();
}, 30000);
afterEach(async () => {
  await db?.close();
});
it("exporta todas as tabelas próprias e preserva cálculo e isolamento do outro médico", async () => {
  await asAccount(db, accountA, async () => {
    const data = (
      await db.query<{ data: AccountExport }>(
        "select exportar_meus_dados() data",
      )
    ).rows[0].data;
    expect(Object.keys(data.dados).sort()).toEqual([...accountTables].sort());
    for (const rows of Object.values(data.dados)) {
      expect(rows.length).toBeGreaterThan(0);
      expect(rows.every((row) => row.medico_id === accountA)).toBe(true);
    }
    expect(
      Number(
        (
          await db.query<{ a_receber: number }>(
            "select a_receber from controle_pessoal_competencia",
          )
        ).rows[0].a_receber,
      ),
    ).toBe(45);
    expect(
      Number(
        (
          await db.query<{ a_receber: number }>(
            "select a_receber from laudos_resumo_competencia",
          )
        ).rows[0].a_receber,
      ),
    ).toBe(30);
  });
  await asAccount(db, accountB, async () => {
    expect(
      (
        await db.query<{ data: AccountExport }>(
          "select exportar_meus_dados() data",
        )
      ).rows[0].data.dados.medicos[0].medico_id,
    ).toBe(accountB);
  });
});
it("recusa falta de autenticação, confirmação inválida e parâmetro de terceiro", async () => {
  await asAccount(db, null, async () => {
    await expect(db.query("select exportar_meus_dados()")).rejects.toThrow(
      /Autenticação/,
    );
    await expect(
      db.query("select excluir_minha_conta('EXCLUIR MINHA CONTA')"),
    ).rejects.toThrow(/Autenticação/);
  });
  await asAccount(db, accountA, async () => {
    await expect(db.query("select excluir_minha_conta('sim')")).rejects.toThrow(
      /Confirmação/,
    );
    await expect(
      db.query("select excluir_minha_conta('EXCLUIR MINHA CONTA',$1)", [
        accountB,
      ]),
    ).rejects.toThrow();
  });
  expect((await db.query("select * from auth.users")).rows).toHaveLength(2);
  await db.exec("set role anon");
  await expect(db.query("select exportar_meus_dados()")).rejects.toThrow(
    /permission denied/,
  );
  await expect(
    db.query("select excluir_minha_conta('EXCLUIR MINHA CONTA')"),
  ).rejects.toThrow(/permission denied/);
  await db.exec("reset role");
});
it("exclui todas as dependências e a identidade A sem alterar nenhum dado B", async () => {
  const before = (
    await db.query<{ data: unknown }>(
      "select jsonb_agg(to_jsonb(t)) data from medicos t where medico_id=$1",
      [accountB],
    )
  ).rows[0].data;
  await asAccount(db, accountA, () =>
    db.query("select excluir_minha_conta('EXCLUIR MINHA CONTA')"),
  );
  for (const table of accountTables) {
    expect(
      (await db.query(`select * from ${table} where medico_id=$1`, [accountA]))
        .rows,
    ).toHaveLength(0);
    expect(
      (await db.query(`select * from ${table} where medico_id=$1`, [accountB]))
        .rows.length,
    ).toBeGreaterThan(0);
  }
  expect(
    (await db.query("select * from auth.users where id=$1", [accountA])).rows,
  ).toHaveLength(0);
  expect(
    (
      await db.query<{ data: unknown }>(
        "select jsonb_agg(to_jsonb(t)) data from medicos t where medico_id=$1",
        [accountB],
      )
    ).rows[0].data,
  ).toEqual(before);
  await asAccount(db, accountA, async () => {
    await expect(
      db.query("insert into medicos(medico_id,crm)values($1,'TESTE')", [
        accountA,
      ]),
    ).rejects.toThrow(/foreign key/);
    await expect(
      db.query("select excluir_minha_conta('EXCLUIR MINHA CONTA')"),
    ).rejects.toThrow(/inexistente/);
  });
});
it("faz rollback integral se uma dependência impedir a exclusão", async () => {
  await db.exec(
    "create table public.restricao_teste(medico_id uuid references public.medicos); insert into restricao_teste values('" +
      accountA +
      "')",
  );
  await asAccount(db, accountA, async () => {
    await expect(
      db.query("select excluir_minha_conta('EXCLUIR MINHA CONTA')"),
    ).rejects.toThrow(/foreign key/);
  });
  for (const table of accountTables)
    expect(
      (await db.query(`select * from ${table} where medico_id=$1`, [accountA]))
        .rows.length,
    ).toBeGreaterThan(0);
});
it("gera CSV com delimitadores escapados e impede fórmulas em planilhas", () => {
  const csv = accountCsv({
    versao: 1,
    exportado_em: "2026-10-19",
    dados: {
      medicos: [{ medico_id: accountA, nome: "=SOMA(1;2)", crm: 'a"b\nc' }],
    },
  });
  expect(csv.startsWith("\uFEFF")).toBe(true);
  expect(csv).toContain("'=SOMA(1;2)");
  expect(csv).toContain('"a""b\nc"');
});
