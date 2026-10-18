import { afterAll, beforeAll, expect, it } from "vitest";
import { database, physician } from "../scripts/database.mjs";

let db: Awaited<ReturnType<typeof database>>;
beforeAll(async () => { db = await database(); }, 30000);
afterAll(async () => { await db?.close(); });

it("contrato rápido grava por id e lê valor apenas das views SQL sob RLS", async () => {
  const other = "33333333-3333-4333-8333-333333333333";
  const local = "44444444-4444-4444-8444-000000000001";
  const convenio = "22222222-2222-4222-8222-000000000001";
  const tipo = "66666666-6666-4666-8666-000000000001";
  const consultId = "88888888-8888-4888-8888-000000000001";
  const reportId = "88888888-8888-4888-8888-000000000002";
  await db.exec("begin");
  try {
    await db.exec(`insert into auth.users values('${other}'); insert into medicos(medico_id,nome,crm) values('${other}','Médico B fictício','CRM B'); set role authenticated; select set_config('request.jwt.claim.sub','${physician}',false);`);
    const consult = await db.query<{ id: string }>(
      "insert into producoes_pessoais(id,medico_id,local_id,convenio_id,data_producao,quantidade) values($1,$2,$3,$4,'2026-10-18',2) returning id",
      [consultId, physician, local, convenio],
    );
    expect(consult.rows[0].id).toBe(consultId);
    const report = await db.query<{ id: string }>(
      "insert into laudos_producao(id,medico_id,local_id,tipo_id,data_producao,quantidade) values($1,$2,$3,$4,'2026-10-18',3) returning id",
      [reportId, physician, local, tipo],
    );
    expect(report.rows[0].id).toBe(reportId);
    const consultation = (await db.query<{ quantidade: number; valor_previsto: string; fonte: string; origem: string }>(
      "select quantidade,valor_previsto,fonte,origem from producao_pessoal_calculada where id=$1", [consultId],
    )).rows[0];
    expect(consultation.quantidade).toBe(2);
    expect(Number(consultation.valor_previsto)).toBeGreaterThan(0);
    expect(consultation.fonte).toBe("Informado por você");
    expect(consultation.origem).toBe("informado_medico");
    const reportValue = (await db.query<{ quantidade: number; valor_previsto: string; fonte: string }>(
      "select quantidade,valor_previsto,fonte from laudos_calculados where id=$1", [reportId],
    )).rows[0];
    expect(reportValue.quantidade).toBe(3);
    expect(Number(reportValue.valor_previsto)).toBeGreaterThan(0);
    expect(reportValue.fonte).toBe("Informado por você");
    await db.query("select set_config('request.jwt.claim.sub',$1,false)", [other]);
    expect((await db.query("select id from producao_pessoal_calculada where id=$1", [consultId])).rows).toEqual([]);
    expect((await db.query("select id from laudos_calculados where id=$1", [reportId])).rows).toEqual([]);
    expect((await db.query("delete from producoes_pessoais where id=$1 returning id", [consultId])).rows).toEqual([]);
    await db.query("select set_config('request.jwt.claim.sub',$1,false)", [physician]);
    const undone = await db.query<{ id: string }>("delete from producoes_pessoais where id=$1 returning id", [consultId]);
    expect(undone.rows).toEqual([{ id: consultId }]);
    expect((await db.query("select id from producao_pessoal_calculada where id=$1", [consultId])).rows).toEqual([]);
    expect((await db.query("select id from atendimentos where id=$1", [consultId])).rows).toEqual([]);
    await db.query("select set_config('request.jwt.claim.sub',$1,false)", [other]);
    await expect(db.query("insert into laudos_producao(medico_id,local_id,tipo_id,data_producao,quantidade) values($1,$2,$3,'2026-10-18',1)", [other, local, tipo])).rejects.toThrow();
  } finally { await db.exec("rollback"); }
});
