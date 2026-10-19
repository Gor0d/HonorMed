import { afterEach, beforeEach, it, expect } from "vitest";
import {
  accountFixture,
  accountA,
  accountB,
  asAccount,
} from "./helpers/account-fixture";
let db: Awaited<ReturnType<typeof accountFixture>>;
beforeEach(async () => {
  db = await accountFixture();
}, 30000);
afterEach(async () => {
  await db?.close();
});
async function insert() {
  await db.query(
    "insert into laudos_producao(medico_id,local_id,tipo_id,data_producao,quantidade)select medico_id,local_id,tipo_id,current_date,2 from laudos_valores where medico_id=$1",
    [accountA],
  );
}
it("não coleta antes do opt-in; agrega eventos sem quantidades ou valores e apaga ao revogar", async () => {
  expect((await db.query("select * from piloto_contadores")).rows).toHaveLength(
    0,
  );
  await asAccount(db, accountA, async () => {
    await db.query("select registrar_erro_piloto()");
  });
  expect((await db.query("select * from piloto_contadores")).rows).toHaveLength(
    0,
  );
  await asAccount(db, accountA, async () => {
    await db.query("select definir_metricas_piloto(true)");
  });
  await insert();
  await asAccount(db, accountA, async () => {
    await db.query("select registrar_erro_piloto()");
    const state = (
      await db.query<{
        state: {
          ativo: boolean;
          semanas: {
            registros: number;
            erros: number;
            dias_com_registro: number;
          }[];
        };
      }>("select estado_metricas_piloto() state")
    ).rows[0].state;
    expect(state.ativo).toBe(true);
    expect(state.semanas[0]).toMatchObject({
      registros: 1,
      erros: 1,
      dias_com_registro: 1,
    });
    await db.query("select definir_metricas_piloto(false)");
  });
  await insert();
  expect((await db.query("select * from piloto_contadores")).rows).toHaveLength(
    0,
  );
  expect(
    (
      await db.query("select * from laudos_producao where medico_id=$1", [
        accountA,
      ])
    ).rows,
  ).toHaveLength(3);
  const fields = (
    await db.query<{ column_name: string }>(
      "select column_name from information_schema.columns where table_name='piloto_contadores' order by ordinal_position",
    )
  ).rows.map((r) => r.column_name);
  expect(fields).toEqual(["medico_id", "dia", "registros", "erros"]);
});
it("RLS impede dados B, escrita direta e confirmação sem identidade", async () => {
  await asAccount(db, accountA, async () => {
    await db.query("select definir_metricas_piloto(true)");
  });
  await insert();
  await asAccount(db, accountB, async () => {
    expect(
      (await db.query("select * from piloto_contadores")).rows,
    ).toHaveLength(0);
    expect(
      (await db.query("select * from piloto_preferencias")).rows,
    ).toHaveLength(0);
    await expect(
      db.query(
        "insert into piloto_contadores(medico_id,dia,registros)values($1,current_date,9)",
        [accountB],
      ),
    ).rejects.toThrow(/permission denied/);
    await expect(
      db.query("select definir_metricas_piloto(true,$1)", [accountA]),
    ).rejects.toThrow();
  });
  await asAccount(db, null, async () => {
    await expect(
      db.query("select definir_metricas_piloto(true)"),
    ).rejects.toThrow(/Autenticação/);
  });
});
it("exporta métricas próprias e apaga por cascata com a conta sem afetar outra", async () => {
  await asAccount(db, accountA, async () => {
    await db.query("select definir_metricas_piloto(true)");
  });
  await insert();
  await asAccount(db, accountA, async () => {
    const exported = (
      await db.query<{ data: { dados: Record<string, unknown[]> } }>(
        "select exportar_meus_dados() data",
      )
    ).rows[0].data;
    expect(exported.dados.piloto_contadores).toHaveLength(1);
    await db.query("select excluir_minha_conta('EXCLUIR MINHA CONTA')");
  });
  expect((await db.query("select * from piloto_contadores")).rows).toHaveLength(
    0,
  );
  expect(
    (await db.query("select * from piloto_preferencias")).rows,
  ).toHaveLength(0);
  expect(
    (await db.query("select * from medicos where medico_id=$1", [accountB]))
      .rows,
  ).toHaveLength(1);
});
