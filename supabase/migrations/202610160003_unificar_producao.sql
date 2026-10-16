-- Revision v2: reuse encounters and contractual SQL. Compatibility views keep
-- the simple personal workflow independent from the imported totals.
alter table public.locais_atendimento rename to locais;
create view public.locais_atendimento with(security_invoker=true) as select * from public.locais;
grant select,insert,update,delete on public.locais,public.locais_atendimento to authenticated;

alter table public.regras_repasse add column local_id uuid;
alter table public.regras_repasse add foreign key(medico_id,local_id) references public.locais(medico_id,id);
create or replace function public.validar_vigencia() returns trigger language plpgsql set search_path=public as $$
begin
 perform 1 from medicos where medico_id=new.medico_id for update;
 if exists(select 1 from regras_repasse r where r.medico_id=new.medico_id and r.convenio_id=new.convenio_id
 and r.local_id is not distinct from new.local_id and r.tipo_procedimento=new.tipo_procedimento and r.id<>new.id
 and daterange(r.vigencia_ini,r.vigencia_fim,'[]') && daterange(new.vigencia_ini,new.vigencia_fim,'[]')) then
 raise exception 'Vigência sobreposta para este convênio, local e procedimento'; end if;
 return new;
end $$;
alter table public.atendimentos add column local_id uuid;
alter table public.atendimentos add column created_at timestamptz not null default now();
alter table public.atendimentos add column quantidade integer not null default 1 check(quantidade between 1 and 1000);
alter table public.atendimentos add column valor_unitario numeric(12,2) check(valor_unitario>=0);
alter table public.atendimentos alter column cd_atendimento drop not null;
alter table public.atendimentos add foreign key(medico_id,local_id) references public.locais(medico_id,id);
alter table public.atendimentos drop constraint atendimentos_origem_check;
update public.atendimentos set origem=case origem when 'manual' then 'informado_medico' when 'import' then 'importado' else 'confirmado_hospital' end;
alter table public.atendimentos alter column origem set default 'informado_medico';
alter table public.atendimentos add check(origem in('informado_medico','importado','confirmado_hospital'));
drop policy isolamento_medico on public.atendimentos;
create policy isolamento_medico on public.atendimentos for all to authenticated
using(medico_id=(select auth.uid()))
with check(medico_id=(select auth.uid()) and origem in('informado_medico','importado'));

-- Migrate any data already recorded by the previous additive migration.
insert into public.atendimentos(id,medico_id,local_id,convenio_id,data_atendimento,quantidade,valor_unitario,status,competencia,origem,created_at)
select id,medico_id,local_id,convenio_id,data_producao,quantidade,valor_unitario,'realizado',to_char(data_producao,'YYYY-MM'),'informado_medico',created_at
from public.producoes_pessoais;
drop view public.controle_pessoal_competencia;
drop view public.controle_pessoal_locais;
drop view public.producao_pessoal_calculada;
drop table public.producoes_pessoais;

create or replace function public.preencher_honorario_pessoal() returns trigger language plpgsql set search_path=public as $$
declare r regras_repasse%rowtype;
begin
 perform 1 from medicos where medico_id=new.medico_id for update;
 if TG_OP='UPDATE' and (new.local_id is distinct from old.local_id or new.convenio_id<>old.convenio_id) then new.valor_unitario=null; end if;
 if new.valor_unitario is null then
 select h.valor_unitario into new.valor_unitario from honorarios_pessoais h
 where h.medico_id=new.medico_id and h.local_id=new.local_id and h.convenio_id=new.convenio_id;
 end if;
 if new.valor_unitario is null then
 select * into r from regras_repasse where medico_id=new.medico_id and convenio_id=new.convenio_id
 and tipo_procedimento=new.procedimento and (local_id is null or local_id=new.local_id)
 and new.data_atendimento between vigencia_ini and coalesce(vigencia_fim,'infinity'::date)
 order by (local_id is not null) desc limit 1;
 if found then new.valor_unitario=calcular_repasse(r.modo,coalesce(new.valor_consulta,r.valor_consulta),r.valor_honorario,r.percentual,r.deducao_pct,0); end if;
 end if;
 return new;
end $$;
create trigger producao_honorario before insert or update on public.atendimentos
 for each row when(new.local_id is not null and new.origem='informado_medico') execute function public.preencher_honorario_pessoal();
create or replace function public.preencher_pendencias_pessoais() returns trigger language plpgsql set search_path=public as $$
begin update atendimentos set valor_unitario=new.valor_unitario where medico_id=new.medico_id and local_id=new.local_id
 and convenio_id=new.convenio_id and origem='informado_medico' and valor_unitario is null; return new; end $$;

create view public.producoes_pessoais with(security_invoker=true) as
select id,medico_id,local_id,convenio_id,data_atendimento data_producao,quantidade,valor_unitario,created_at
from public.atendimentos where local_id is not null and origem='informado_medico';
create function public.escrever_producao_pessoal() returns trigger language plpgsql set search_path=public as $$
begin
 if TG_OP='DELETE' then delete from atendimentos where id=old.id and medico_id=old.medico_id; if not found then return null; end if; return old; end if;
 if TG_OP='INSERT' then
 insert into atendimentos(id,medico_id,local_id,convenio_id,data_atendimento,quantidade,valor_unitario,status,competencia,origem)
 values(coalesce(new.id,gen_random_uuid()),new.medico_id,new.local_id,new.convenio_id,new.data_producao,new.quantidade,new.valor_unitario,'realizado',to_char(new.data_producao,'YYYY-MM'),'informado_medico')
 returning id,valor_unitario,created_at into new.id,new.valor_unitario,new.created_at;
 else update atendimentos set local_id=new.local_id,convenio_id=new.convenio_id,data_atendimento=new.data_producao,
 competencia=to_char(new.data_producao,'YYYY-MM'),quantidade=new.quantidade,valor_unitario=new.valor_unitario
 where id=old.id and medico_id=old.medico_id returning valor_unitario into new.valor_unitario;
 if not found then return null; end if;
 end if; return new;
end $$;
create trigger producoes_pessoais_escrita instead of insert or update or delete on public.producoes_pessoais
for each row execute function public.escrever_producao_pessoal();

drop view public.repasses_competencia;
drop view public.atendimentos_calculados;
create view public.atendimentos_calculados with(security_invoker=true) as
select a.*,c.nome convenio_nome,r.id regra_id,r.modo,r.valor_honorario,r.percentual,r.deducao_pct,
coalesce(a.valor_consulta,r.valor_consulta,0) valor_consulta_calc,
case when a.valor_unitario is not null then round(a.quantidade*a.valor_unitario,2)
when r.id is null then null else round(a.quantidade*calcular_repasse(r.modo,coalesce(a.valor_consulta,r.valor_consulta),r.valor_honorario,r.percentual,r.deducao_pct,0),2) end valor_bruto,
case when a.valor_unitario is not null then round(a.quantidade*calcular_repasse('fixo',0,a.valor_unitario,0,0,case when a.status='glosado' and a.glosa_pct=0 then 100 else a.glosa_pct end),2)
when r.id is null then null else round(a.quantidade*calcular_repasse(r.modo,coalesce(a.valor_consulta,r.valor_consulta),r.valor_honorario,r.percentual,r.deducao_pct,case when a.status='glosado' and a.glosa_pct=0 then 100 else a.glosa_pct end),2) end valor_repasse_calc
from public.atendimentos a join public.convenios c on c.medico_id=a.medico_id and c.id=a.convenio_id
left join lateral(select r.* from public.regras_repasse r where r.medico_id=a.medico_id and r.convenio_id=a.convenio_id
and r.tipo_procedimento=a.procedimento and (r.local_id is null or r.local_id=a.local_id)
and a.data_atendimento between r.vigencia_ini and coalesce(r.vigencia_fim,'infinity'::date)
order by(r.local_id is not null) desc limit 1) r on true;
create view public.atendimentos_importados_calculados with(security_invoker=true) as
select * from public.atendimentos_calculados where local_id is null or origem<>'informado_medico';
create view public.repasses_competencia with(security_invoker=true) as
select medico_id,competencia,count(*) quantidade,
coalesce(sum(valor_repasse_calc) filter(where status<>'pago'),0) previsto,
coalesce(sum(valor_repasse_calc) filter(where status='pago'),0) pago,
coalesce(sum(valor_bruto-valor_repasse_calc),0) glosado,
coalesce(sum(valor_repasse_calc) filter(where status not in('agendado','glosado')),0) realizado,
count(*) filter(where regra_id is null and valor_unitario is null) sem_regra
from public.atendimentos_importados_calculados group by medico_id,competencia;
create view public.producao_pessoal_calculada with(security_invoker=true) as
select a.id,a.medico_id,a.local_id,a.convenio_id,a.data_atendimento data_producao,a.quantidade,a.valor_unitario,a.created_at,
l.nome local_nome,a.convenio_nome,a.competencia,a.valor_repasse_calc valor_previsto,'Informado por você'::text fonte,a.origem
from public.atendimentos_calculados a join public.locais l on l.medico_id=a.medico_id and l.id=a.local_id where a.origem='informado_medico';

alter table public.recebimentos_pessoais rename to recebimentos;
alter table public.recebimentos rename column data_recebimento to data_pagamento;
alter table public.recebimentos add column convenio_id uuid;
alter table public.recebimentos add column observacao text check(length(observacao)<=500);
alter table public.recebimentos add foreign key(medico_id,convenio_id) references public.convenios(medico_id,id);
create view public.recebimentos_pessoais with(security_invoker=true) as
select id,medico_id,local_id,convenio_id,competencia,data_pagamento data_recebimento,valor,created_at from public.recebimentos;
create view public.controle_pessoal_convenios with(security_invoker=true) as
with p as(select medico_id,local_id,convenio_id,competencia,sum(quantidade) quantidade,coalesce(sum(valor_previsto),0) produzido,
coalesce(sum(quantidade) filter(where valor_previsto is null),0) sem_valor from public.producao_pessoal_calculada group by medico_id,local_id,convenio_id,competencia),
r as(select medico_id,local_id,convenio_id,competencia,sum(valor) recebido from public.recebimentos group by medico_id,local_id,convenio_id,competencia)
select coalesce(p.medico_id,r.medico_id) medico_id,coalesce(p.local_id,r.local_id) local_id,coalesce(p.convenio_id,r.convenio_id) convenio_id,
coalesce(p.competencia,r.competencia) competencia,coalesce(p.quantidade,0) quantidade,coalesce(p.produzido,0) produzido,
coalesce(p.sem_valor,0) sem_valor,coalesce(r.recebido,0) recebido,
greatest(coalesce(p.produzido,0)-coalesce(r.recebido,0),0) a_receber,
greatest(coalesce(r.recebido,0)-coalesce(p.produzido,0),0) acima_previsto,
coalesce(p.produzido,0)-coalesce(r.recebido,0) diferenca,
(coalesce(r.recebido,0)>coalesce(p.produzido,0)) divergencia
from p full outer join r on p.medico_id=r.medico_id and p.local_id=r.local_id and p.convenio_id is not distinct from r.convenio_id and p.competencia=r.competencia;
create view public.resumo_competencia with(security_invoker=true) as select *,a_receber previsto_a_receber,recebido>0 and diferenca<>0 conferir_diferenca from public.controle_pessoal_convenios;
create view public.controle_pessoal_locais with(security_invoker=true) as
select medico_id,local_id,competencia,sum(quantidade) quantidade,sum(produzido) produzido,sum(sem_valor) sem_valor,sum(recebido) recebido,sum(a_receber) a_receber,sum(acima_previsto) acima_previsto
from public.controle_pessoal_convenios group by medico_id,local_id,competencia;
create view public.controle_pessoal_competencia with(security_invoker=true) as
select medico_id,competencia,sum(quantidade) quantidade,sum(produzido) produzido,sum(sem_valor) sem_valor,sum(recebido) recebido,sum(a_receber) a_receber,sum(acima_previsto) acima_previsto
from public.controle_pessoal_locais group by medico_id,competencia;
grant select,insert,update,delete on public.producoes_pessoais,public.recebimentos_pessoais,public.recebimentos to authenticated;
grant select on public.atendimentos_calculados,public.atendimentos_importados_calculados,public.repasses_competencia,public.producao_pessoal_calculada,
public.controle_pessoal_convenios,public.resumo_competencia,public.controle_pessoal_locais,public.controle_pessoal_competencia to authenticated;
