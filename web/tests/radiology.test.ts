import { beforeAll, afterAll, it, expect } from "vitest";
import { database, physician } from "../scripts/database.mjs";
let db: Awaited<ReturnType<typeof database>>;
const a = "44444444-4444-4444-8444-000000000001",
  b = "44444444-4444-4444-8444-000000000002",
  rx = "66666666-6666-4666-8666-000000000001",
  us = "66666666-6666-4666-8666-000000000004";
beforeAll(async () => {
  db = await database();
}, 30000);
afterAll(async () => {
  await db?.close();
});
async function transaction(work: () => Promise<void>) {
  await db.exec("begin");
  try {
    await work();
  } finally {
    await db.exec("rollback");
  }
}
async function month(m = "2026-10") {
  return (
    await db.query<Record<string, unknown>>(
      "select * from laudos_resumo_competencia where competencia=$1",
      [m],
    )
  ).rows[0];
}
it("seed radiológico tem produção, pendência e recebimento próprio", async () => {
  const s = await month();
  expect(Number(s.quantidade)).toBe(75);
  expect(Number(s.produzido)).toBe(1520);
  expect(Number(s.sem_valor)).toBe(5);
  expect(Number(s.recebido)).toBe(300);
  expect(Number(s.a_receber)).toBe(1220);
  expect(Number((await month("2026-11")).produzido)).toBe(350);
  expect(Number((await month("2026-11")).recebido)).toBe(0);
});
it("o mesmo exame pode ter valores diferentes por instituição", async () => {
  const rows = (
    await db.query<{ local_id: string; valor_unitario: string }>(
      `select local_id,valor_unitario from laudos_calculados where tipo_id=$1 order by local_id`,
      [rx],
    )
  ).rows;
  expect(rows.map((r) => Number(r.valor_unitario))).toEqual([12, 15]);
});
it("preserva honorários anteriores, usa o novo em registros novos e recalcula ao trocar instituição", async () =>
  transaction(async () => {
    await db.query(
      "update laudos_valores set valor_unitario=20 where local_id=$1 and tipo_id=$2",
      [a, rx],
    );
    const original = (
      await db.query<{ id: string; valor_previsto: string }>(
        "select id,valor_previsto from laudos_calculados where local_id=$1 and tipo_id=$2",
        [a, rx],
      )
    ).rows[0];
    expect(Number(original.valor_previsto)).toBe(360);
    const fresh = (
      await db.query<{ id: string; valor_unitario: string }>(
        `insert into laudos_producao(medico_id,local_id,tipo_id,data_producao,quantidade) values($1,$2,$3,'2026-10-16',10) returning id,valor_unitario`,
        [physician, a, rx],
      )
    ).rows[0];
    expect(Number(fresh.valor_unitario)).toBe(20);
    await db.query("update laudos_producao set quantidade=31 where id=$1", [
      original.id,
    ]);
    expect(
      Number(
        (
          await db.query<{ valor_previsto: string }>(
            "select valor_previsto from laudos_calculados where id=$1",
            [original.id],
          )
        ).rows[0].valor_previsto,
      ),
    ).toBe(372);
    await db.query("update laudos_producao set local_id=$1 where id=$2", [
      b,
      fresh.id,
    ]);
    expect(
      Number(
        (
          await db.query<{ valor_previsto: string }>(
            "select valor_previsto from laudos_calculados where id=$1",
            [fresh.id],
          )
        ).rows[0].valor_previsto,
      ),
    ).toBe(150);
  }));
it("configurar preço preenche pendências sem alterar os conhecidos", async () =>
  transaction(async () => {
    await db.query(
      "insert into laudos_valores(medico_id,local_id,tipo_id,valor_unitario) values($1,$2,$3,50)",
      [physician, a, us],
    );
    expect(Number((await month()).sem_valor)).toBe(0);
    expect(Number((await month()).produzido)).toBe(1770);
    await db.query(
      "update laudos_valores set valor_unitario=60 where local_id=$1 and tipo_id=$2",
      [a, us],
    );
    expect(Number((await month()).produzido)).toBe(1770);
  }));
it("recebimentos parciais não quitam outra instituição, outro módulo ou outro período", async () =>
  transaction(async () => {
    await db.query(
      `insert into laudos_recebimentos(medico_id,local_id,competencia,data_recebimento,valor) values($1,$2,'2026-10','2026-11-10',1000)`,
      [physician, a],
    );
    const s = await month();
    expect(Number(s.a_receber)).toBe(740);
    expect(Number(s.acima_previsto)).toBe(520);
    expect(Number((await month("2026-11")).recebido)).toBe(0);
    expect(
      Number(
        (
          await db.query<{ a_receber: string }>(
            `select a_receber from controle_pessoal_competencia where competencia='2026-10'`,
          )
        ).rows[0].a_receber,
      ),
    ).toBe(1745);
  }));
it("rejeita quantidade zero e recebimento negativo", async () => {
  await expect(
    db.query(
      `insert into laudos_producao(medico_id,local_id,tipo_id,data_producao,quantidade) values($1,$2,$3,'2026-10-16',0)`,
      [physician, a, rx],
    ),
  ).rejects.toThrow(/check constraint/);
  await expect(
    db.query(
      `insert into laudos_recebimentos(medico_id,local_id,competencia,data_recebimento,valor) values($1,$2,'2026-10','2026-10-16',-1)`,
      [physician, a],
    ),
  ).rejects.toThrow(/check constraint/);
});
it("perfil somente laudos é persistido sem depender de consultas", async () =>
  transaction(async () => {
    await db.query(
      "update preferencias_produto set perfil_uso='laudos' where medico_id=$1",
      [physician],
    );
    expect(
      (
        await db.query<{ perfil_uso: string }>(
          "select perfil_uso from preferencias_produto",
        )
      ).rows[0].perfil_uso,
    ).toBe("laudos");
    expect(
      (await db.query("select * from laudos_calculados")).rows,
    ).toHaveLength(6);
  }));
it("RLS isola preferências, tipos, preços, produção, pagamentos e views radiológicas", async () => {
  const other = "77777777-7777-4777-8777-777777777777";
  await db.exec(
    `insert into auth.users values('${other}');insert into medicos(medico_id,nome,crm)values('${other}','Radiologista fictício','CRM B');set role authenticated;select set_config('request.jwt.claim.sub','${other}',false);`,
  );
  try {
    for (const t of [
      "preferencias_produto",
      "laudos_tipos",
      "laudos_valores",
      "laudos_producao",
      "laudos_recebimentos",
      "laudos_calculados",
      "laudos_resumo_locais",
      "laudos_resumo_competencia",
      "laudos_resumo_tipos",
    ])
      expect((await db.query(`select * from ${t}`)).rows).toHaveLength(0);
    for (const t of [
      "preferencias_produto",
      "laudos_tipos",
      "laudos_valores",
      "laudos_producao",
      "laudos_recebimentos",
    ]) {
      expect(
        (
          await db.query(
            `update ${t} set medico_id=medico_id where medico_id=$1 returning id`,
            [physician],
          )
        ).rows,
      ).toHaveLength(0);
      expect(
        (
          await db.query(`delete from ${t} where medico_id=$1 returning id`, [
            physician,
          ])
        ).rows,
      ).toHaveLength(0);
    }
    await expect(
      db.query(
        `insert into laudos_recebimentos(medico_id,local_id,competencia,data_recebimento,valor)values($1,$2,'2026-10','2026-10-16',10)`,
        [physician, a],
      ),
    ).rejects.toThrow(/row-level security/);
    await expect(
      db.query(
        `insert into laudos_producao(medico_id,local_id,tipo_id,data_producao,quantidade) values($1,$2,$3,'2026-10-16',1)`,
        [other, a, rx],
      ),
    ).rejects.toThrow(/foreign key/);
    await db.query(
      "insert into preferencias_produto(medico_id,perfil_uso)values($1,'laudos')",
      [other],
    );
    expect(
      (await db.query("select * from preferencias_produto")).rows,
    ).toHaveLength(1);
    // A new radiologist can complete the whole ledger with zero consultations/convenios.
    const ownLocal = (
      await db.query<{ id: string }>(
        "insert into locais(medico_id,nome)values($1,$2)returning id",
        [other, "Clínica B fictícia"],
      )
    ).rows[0].id;
    const ownType = (
      await db.query<{ id: string }>(
        "insert into laudos_tipos(medico_id,nome)values($1,$2)returning id",
        [other, "Exame B fictício"],
      )
    ).rows[0].id;
    await db.query(
      "insert into laudos_valores(medico_id,local_id,tipo_id,valor_unitario)values($1,$2,$3,12.50)",
      [other, ownLocal, ownType],
    );
    await db.query(
      "insert into laudos_producao(medico_id,local_id,tipo_id,data_producao,quantidade)values($1,$2,$3,'2026-10-16',8)",
      [other, ownLocal, ownType],
    );
    await db.query(
      "insert into laudos_recebimentos(medico_id,local_id,competencia,data_recebimento,valor)values($1,$2,'2026-10','2026-11-05',40)",
      [other, ownLocal],
    );
    expect(Number((await month()).a_receber)).toBe(60);
    expect((await db.query("select * from convenios")).rows).toHaveLength(0);
    expect((await db.query("select * from atendimentos")).rows).toHaveLength(0);
  } finally {
    await db.exec("reset role");
  }
});
