import { beforeAll, afterAll, it, expect } from "vitest";
import { database, physician } from "../scripts/database.mjs";
let db: Awaited<ReturnType<typeof database>>;
const local = "44444444-4444-4444-8444-000000000001",
  otherLocal = "44444444-4444-4444-8444-000000000002",
  convenio = "22222222-2222-4222-8222-000000000001";
beforeAll(async () => {
  db = await database();
}, 30000);
afterAll(async () => {
  await db.close();
});
async function summary() {
  return (
    await db.query<Record<string, unknown>>(
      `select * from controle_pessoal_competencia where competencia='2026-10'`,
    )
  ).rows[0];
}
async function rollback(work: () => Promise<void>) {
  await db.exec("begin");
  try {
    await work();
  } finally {
    await db.exec("rollback");
  }
}
it("separa quantidade, previsão, recebimento e consultas ainda sem valor", async () => {
  const s = await summary();
  expect(Number(s.quantidade)).toBe(24);
  expect(Number(s.produzido)).toBe(2245);
  expect(Number(s.sem_valor)).toBe(4);
  expect(Number(s.recebido)).toBe(500);
  expect(Number(s.a_receber)).toBe(1745);
});
it("considera o mês da produção, mesmo quando o recebimento ocorre em outro mês", async () => {
  const s = (
    await db.query<Record<string, unknown>>(
      `select * from controle_pessoal_competencia where competencia='2026-11'`,
    )
  ).rows[0];
  expect(Number(s.recebido)).toBe(0);
  expect(Number(s.a_receber)).toBe(510);
});
it("registra quantidade e preserva honorários históricos ao alterar os ajustes", async () =>
  rollback(async () => {
    const { rows } = await db.query<{ id: string }>(
      `insert into producoes_pessoais(medico_id,local_id,convenio_id,data_producao,quantidade) values($1,$2,$3,'2026-10-16',8) returning id`,
      [physician, local, convenio],
    );
    await db.query(
      `update honorarios_pessoais set valor_unitario=100 where local_id=$1 and convenio_id=$2`,
      [local, convenio],
    );
    await db.query(`update producoes_pessoais set quantidade=9 where id=$1`, [
      rows[0].id,
    ]);
    const p = (
      await db.query<{ valor_previsto: string; valor_unitario: string }>(
        `select * from producao_pessoal_calculada where id=$1`,
        [rows[0].id],
      )
    ).rows[0];
    expect(Number(p.valor_unitario)).toBe(85);
    expect(Number(p.valor_previsto)).toBe(765);
    const fresh = (
      await db.query<{ valor_unitario: string }>(
        `insert into producoes_pessoais(medico_id,local_id,convenio_id,data_producao,quantidade) values($1,$2,$3,'2026-10-16',1) returning valor_unitario`,
        [physician, local, convenio],
      )
    ).rows[0];
    expect(Number(fresh.valor_unitario)).toBe(100);
  }));
it("preenche valores pendentes quando o médico informa honorário e não os altera depois", async () =>
  rollback(async () => {
    const vida = "22222222-2222-4222-8222-000000000005";
    await db.query(
      `insert into honorarios_pessoais(medico_id,local_id,convenio_id,valor_unitario) values($1,$2,$3,70)`,
      [physician, local, vida],
    );
    let s = await summary();
    expect(Number(s.sem_valor)).toBe(0);
    expect(Number(s.produzido)).toBe(2525);
    await db.query(
      `update honorarios_pessoais set valor_unitario=80 where local_id=$1 and convenio_id=$2`,
      [local, vida],
    );
    s = await summary();
    expect(Number(s.produzido)).toBe(2525);
  }));
it("não compensa saldo de um local com recebimento acima do previsto em outro", async () =>
  rollback(async () => {
    await db.query(
      `insert into recebimentos_pessoais(medico_id,local_id,convenio_id,competencia,data_recebimento,valor) values($1,$2,$3,'2026-10','2026-11-10',1000)`,
      [physician, otherLocal, convenio],
    );
    const s = await summary();
    expect(Number(s.acima_previsto)).toBe(550);
    expect(Number(s.a_receber)).toBe(1295);
  }));
it("trocar o local de uma produção aplica o honorário daquele local", async () =>
  rollback(async () => {
    const id = (
      await db.query<{ id: string }>(
        `insert into producoes_pessoais(medico_id,local_id,convenio_id,data_producao,quantidade) values($1,$2,$3,'2026-10-16',2) returning id`,
        [physician, local, convenio],
      )
    ).rows[0].id;
    await db.query("update producoes_pessoais set local_id=$1 where id=$2", [
      otherLocal,
      id,
    ]);
    const p = (
      await db.query<{ valor_previsto: string }>(
        `select valor_previsto from producao_pessoal_calculada where id=$1`,
        [id],
      )
    ).rows[0];
    expect(Number(p.valor_previsto)).toBe(180);
  }));
it("rejeita quantidades inválidas e recebimentos negativos no banco", async () => {
  await expect(
    db.query(
      `insert into producoes_pessoais(medico_id,local_id,convenio_id,data_producao,quantidade) values($1,$2,$3,'2026-10-16',0)`,
      [physician, local, convenio],
    ),
  ).rejects.toThrow(/check constraint/);
  await expect(
    db.query(
      `insert into recebimentos_pessoais(medico_id,local_id,competencia,data_recebimento,valor) values($1,$2,'2026-10','2026-10-16',-10)`,
      [physician, local],
    ),
  ).rejects.toThrow(/check constraint/);
});
it("usa regras SQL por vigência, com preferência do local, quantidade, dedução e glosa", async () =>
  rollback(async () => {
    const sul = "22222222-2222-4222-8222-000000000003";
    await db.query(
      `insert into regras_repasse(medico_id,local_id,convenio_id,modo,valor_consulta,valor_honorario,deducao_pct,vigencia_ini,vigencia_fim) values($1,$2,$3,'fixo',180,100,10,'2026-10-01','2026-10-31')`,
      [physician, local, sul],
    );
    const id = (
      await db.query<{ id: string }>(
        `insert into producoes_pessoais(medico_id,local_id,convenio_id,data_producao,quantidade) values($1,$2,$3,'2026-10-16',8) returning id`,
        [physician, local, sul],
      )
    ).rows[0].id;
    expect(
      Number(
        (
          await db.query<{ valor_previsto: string }>(
            "select valor_previsto from producao_pessoal_calculada where id=$1",
            [id],
          )
        ).rows[0].valor_previsto,
      ),
    ).toBe(720);
    await db.query("update atendimentos set glosa_pct=50 where id=$1", [id]);
    expect(
      Number(
        (
          await db.query<{ valor_previsto: string }>(
            "select valor_previsto from producao_pessoal_calculada where id=$1",
            [id],
          )
        ).rows[0].valor_previsto,
      ),
    ).toBe(360);
    const future = (
      await db.query<{ valor_unitario: string }>(
        `insert into producoes_pessoais(medico_id,local_id,convenio_id,data_producao,quantidade) values($1,$2,$3,'2026-11-02',1) returning valor_unitario`,
        [physician, local, sul],
      )
    ).rows[0];
    expect(Number(future.valor_unitario)).toBe(104.5);
  }));
it("não compensa convênios diferentes do mesmo local", async () =>
  rollback(async () => {
    await db.query(
      `insert into recebimentos_pessoais(medico_id,local_id,convenio_id,competencia,data_recebimento,valor) values($1,$2,$3,'2026-10','2026-11-10',1000)`,
      [physician, local, convenio],
    );
    const s = await summary();
    expect(Number(s.acima_previsto)).toBe(820);
    expect(Number(s.a_receber)).toBe(1565);
  }));
it("RLS protege todos os novos cadastros, produção, recebimentos e views", async () => {
  const other = "55555555-5555-4555-8555-555555555555";
  await db.exec(
    `insert into auth.users values('${other}'); insert into medicos(medico_id,nome,crm) values('${other}','B fictício','CRM B'); set role authenticated; select set_config('request.jwt.claim.sub','${other}',false);`,
  );
  try {
    for (const t of [
      "locais_atendimento",
      "locais",
      "recebimentos",
      "resumo_competencia",
      "controle_pessoal_convenios",
      "honorarios_pessoais",
      "producoes_pessoais",
      "recebimentos_pessoais",
      "producao_pessoal_calculada",
      "controle_pessoal_locais",
      "controle_pessoal_competencia",
    ])
      expect((await db.query(`select * from ${t}`)).rows).toHaveLength(0);
    for (const t of [
      "locais_atendimento",
      "honorarios_pessoais",
      "producoes_pessoais",
      "recebimentos_pessoais",
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
        `insert into recebimentos_pessoais(medico_id,local_id,competencia,data_recebimento,valor) values($1,$2,'2026-10','2026-10-16',10)`,
        [physician, local],
      ),
    ).rejects.toThrow(/row-level security/);
    await expect(
      db.query(
        `insert into producoes_pessoais(medico_id,local_id,convenio_id,data_producao,quantidade) values($1,$2,$3,'2026-10-16',1)`,
        [other, local, convenio],
      ),
    ).rejects.toThrow(/foreign key/);
    await db.exec(
      `select set_config('request.jwt.claim.sub','${physician}',false)`,
    );
    await expect(
      db.query(
        `insert into atendimentos(medico_id,convenio_id,data_atendimento,status,competencia,origem) values($1,$2,'2026-10-16','realizado','2026-10','confirmado_hospital')`,
        [physician, convenio],
      ),
    ).rejects.toThrow(/row-level security/);
    expect(
      (await db.query("select * from producao_pessoal_calculada")).rows,
    ).toHaveLength(6);
  } finally {
    await db.exec("reset role");
  }
});
