import { beforeAll, afterAll, describe, it, expect } from "vitest";
import { database, physician } from "../scripts/database.mjs";
let db: Awaited<ReturnType<typeof database>>;
beforeAll(async () => {
  db = await database();
}, 30000);
afterAll(async () => {
  await db.close();
});
describe("Cálculo SQL auditável", () => {
  it.each([
    ["fixo", 200, 80, 0, 0, 0, "80.00"],
    ["percentual", 200, 0, 60, 10, 0, "108.00"],
    ["fixo", 200, 80, 0, 10, 50, "36.00"],
    ["fixo", 200, 80, 0, 0, 100, "0.00"],
    ["percentual", 123.45, 0, 33.333, 0, 0, "41.15"],
  ])("calcula %s", async (m, c, h, p, d, g, want) => {
    const { rows } = await db.query<Record<string, unknown>>(
      "select calcular_repasse($1,$2,$3,$4,$5,$6)::text valor",
      [m, c, h, p, d, g],
    );
    expect(rows[0].valor).toBe(want);
  });
  it("seed tem duas competências e casos sem regra e glosa", async () => {
    const { rows } = await db.query<Record<string, unknown>>(
      "select competencia,quantidade,sem_regra,glosado from repasses_competencia order by competencia",
    );
    expect(rows.map((r: any) => r.quantidade)).toEqual([140, 70]);
    expect(Number(rows[0].sem_regra)).toBe(28);
    expect(Number(rows[0].glosado)).toBeGreaterThan(0);
  });
  it("recusa sobreposição de vigência", async () => {
    await expect(
      db.exec(
        `insert into regras_repasse(medico_id,convenio_id,modo,valor_consulta,vigencia_ini) select medico_id,convenio_id,modo,valor_consulta,'2026-10-02' from regras_repasse limit 1`,
      ),
    ).rejects.toThrow("Vigência sobreposta");
  });
  it("respeita fim da vigência e glosa total implícita", async () => {
    await db.exec("begin");
    try {
      await db.exec(
        `update regras_repasse set vigencia_fim='2026-10-01'; update atendimentos set status='glosado',glosa_pct=0 where data_atendimento='2026-10-01'`,
      );
      const { rows } = await db.query<Record<string, unknown>>(
        `select regra_id,valor_repasse_calc from atendimentos_calculados where data_atendimento='2026-10-01' and convenio_nome='Unimed'`,
      );
      expect(rows[0].regra_id).toBeTruthy();
      expect(Number(rows[0].valor_repasse_calc)).toBe(0);
      const absent = await db.query<Record<string, unknown>>(
        `select count(*)::int n from atendimentos_calculados where data_atendimento>'2026-10-01' and regra_id is not null`,
      );
      expect(absent.rows[0].n).toBe(0);
    } finally {
      await db.exec("rollback");
    }
  });
});
describe("RLS real em PostgreSQL", () => {
  it("médico B não lê nem altera A em nenhuma tabela ou view", async () => {
    const other = "33333333-3333-4333-8333-333333333333";
    await db.exec(
      `insert into auth.users values('${other}'); insert into medicos values('${other}','B fictício','CRM 2','2',now()); set role authenticated; select set_config('request.jwt.claim.sub','${other}',false);`,
    );
    try {
      for (const table of [
        "convenios",
        "regras_repasse",
        "atendimentos",
        "metas",
        "sync_log",
        "atendimentos_calculados",
        "repasses_competencia",
      ]) {
        const r = await db.query<Record<string, unknown>>(
          `select * from ${table}`,
        );
        expect(r.rows).toHaveLength(0);
      }
      expect(
        (await db.query<Record<string, unknown>>("select * from medicos")).rows,
      ).toHaveLength(1);
      await expect(
        db.exec(
          `insert into metas(medico_id,competencia,valor) values('${physician}','2026-12',100)`,
        ),
      ).rejects.toThrow(/row-level security/);
      const update = await db.query<Record<string, unknown>>(
        `update medicos set nome='invasão' where medico_id='${physician}' returning *`,
      );
      expect(update.rows).toHaveLength(0);
      for (const table of [
        "convenios",
        "regras_repasse",
        "atendimentos",
        "metas",
        "sync_log",
      ]) {
        const removed = await db.query(
          `delete from ${table} where medico_id='${physician}' returning id`,
        );
        expect(removed.rows).toHaveLength(0);
      }
      await expect(
        db.exec(
          `insert into atendimentos(medico_id,cd_atendimento,convenio_id,data_atendimento,status,competencia) values('${other}','cross-tenant','22222222-2222-4222-8222-000000000001','2026-10-10','realizado','2026-10')`,
        ),
      ).rejects.toThrow(/foreign key/);
      await db.exec(
        `select set_config('request.jwt.claim.sub','${physician}',false)`,
      );
      expect(
        (
          await db.query<Record<string, unknown>>(
            "select * from atendimentos_calculados",
          )
        ).rows,
      ).toHaveLength(210);
    } finally {
      await db.exec("reset role");
    }
  });
});
