create table public.medicos (
 medico_id uuid primary key references auth.users(id) on delete cascade,
 nome text not null default '', crm text not null, cd_prestador_mv text not null,
 created_at timestamptz not null default now()
);
create table public.convenios (
 id uuid primary key default gen_random_uuid(), medico_id uuid not null references public.medicos,
 nome text not null, cd_convenio_mv text, unique(medico_id,id), unique(medico_id,nome)
);
create table public.regras_repasse (
 id uuid primary key default gen_random_uuid(), medico_id uuid not null references public.medicos,
 convenio_id uuid not null, tipo_procedimento text not null default 'Consulta',
 modo text not null check(modo in ('fixo','percentual')),
 valor_consulta numeric(12,2) not null check(valor_consulta >= 0),
 valor_honorario numeric(12,2) not null default 0 check(valor_honorario >= 0),
 percentual numeric(6,3) not null default 0 check(percentual between 0 and 100),
 deducao_pct numeric(6,3) not null default 0 check(deducao_pct between 0 and 100),
 vigencia_ini date not null, vigencia_fim date,
 created_at timestamptz not null default now(),
 check(vigencia_fim is null or vigencia_fim >= vigencia_ini),
 foreign key(medico_id,convenio_id) references public.convenios(medico_id,id)
);
-- Serialize edits per physician. Reject overlapping rules rather than silently picking one.
create function public.validar_vigencia() returns trigger language plpgsql set search_path = public as $$
begin
 perform 1 from medicos where medico_id = new.medico_id for update;
 if exists(select 1 from regras_repasse r where r.medico_id=new.medico_id and r.convenio_id=new.convenio_id
 and r.tipo_procedimento=new.tipo_procedimento and r.id<>new.id
 and daterange(r.vigencia_ini,r.vigencia_fim,'[]') && daterange(new.vigencia_ini,new.vigencia_fim,'[]')) then
 raise exception 'Vigência sobreposta para este convênio e procedimento'; end if;
 return new;
end $$;
create trigger regras_vigencia before insert or update on public.regras_repasse for each row execute function public.validar_vigencia();
create table public.atendimentos (
 id uuid primary key default gen_random_uuid(), medico_id uuid not null references public.medicos,
 cd_atendimento text not null, convenio_id uuid not null,
 data_atendimento date not null, procedimento text not null default 'Consulta',
 status text not null check(status in ('realizado','a_faturar','faturado','glosado','pago','agendado')),
 competencia text not null check(competencia ~ '^[0-9]{4}-(0[1-9]|1[0-2])$'),
 valor_consulta numeric(12,2) check(valor_consulta >= 0),
 glosa_pct numeric(6,3) not null default 0 check(glosa_pct between 0 and 100),
 origem text not null default 'manual' check(origem in ('mv','import','manual')),
 unique(medico_id,cd_atendimento),
 foreign key(medico_id,convenio_id) references public.convenios(medico_id,id)
);
create table public.metas (
 id uuid primary key default gen_random_uuid(), medico_id uuid not null references public.medicos,
 competencia text not null check(competencia ~ '^[0-9]{4}-(0[1-9]|1[0-2])$'), valor numeric(12,2) not null check(valor>0),
 unique(medico_id,competencia)
);
create table public.sync_log (
 id uuid primary key default gen_random_uuid(), medico_id uuid not null references public.medicos,
 execucao timestamptz not null default now(), linhas integer not null default 0 check(linhas>=0), erros text
);
do $$ declare t text; begin
 foreach t in array array['medicos','convenios','regras_repasse','atendimentos','metas','sync_log'] loop
 execute format('alter table public.%I enable row level security',t);
 execute format('create policy isolamento_medico on public.%I for all to authenticated using (medico_id = (select auth.uid())) with check (medico_id = (select auth.uid()))',t);
 execute format('grant select,insert,update,delete on public.%I to authenticated',t);
 end loop;
end $$;
create index on public.atendimentos(medico_id,competencia);
create index on public.regras_repasse(medico_id,convenio_id,vigencia_ini);
-- Single auditable calculation used by both production views and demo fixtures.
create function public.calcular_repasse(modo text, consulta numeric, honorario numeric, percentual numeric, deducao numeric, glosa numeric)
returns numeric language sql immutable strict as $$
 select round(greatest(0,case when modo='fixo' then honorario when modo='percentual' then consulta*percentual/100 else 0 end)*(1-deducao/100)*(1-glosa/100),2)
$$;
create view public.atendimentos_calculados with (security_invoker=true) as
select a.*, c.nome convenio_nome, r.id regra_id, r.modo, r.valor_honorario, r.percentual, r.deducao_pct,
 coalesce(a.valor_consulta,r.valor_consulta,0) valor_consulta_calc,
 case when r.id is null then null else public.calcular_repasse(r.modo,coalesce(a.valor_consulta,r.valor_consulta),r.valor_honorario,r.percentual,r.deducao_pct,0) end valor_bruto,
 case when r.id is null then null else public.calcular_repasse(r.modo,coalesce(a.valor_consulta,r.valor_consulta),r.valor_honorario,r.percentual,r.deducao_pct,case when a.status='glosado' and a.glosa_pct=0 then 100 else a.glosa_pct end) end valor_repasse_calc
from public.atendimentos a join public.convenios c on c.id=a.convenio_id and c.medico_id=a.medico_id
left join public.regras_repasse r on r.medico_id=a.medico_id and r.convenio_id=a.convenio_id
 and r.tipo_procedimento=a.procedimento and a.data_atendimento between r.vigencia_ini and coalesce(r.vigencia_fim,'infinity'::date);
create view public.repasses_competencia with (security_invoker=true) as
select medico_id,competencia,count(*) quantidade,
 coalesce(sum(valor_repasse_calc) filter(where status<>'pago'),0) previsto,
 coalesce(sum(valor_repasse_calc) filter(where status='pago'),0) pago,
 coalesce(sum(valor_bruto-valor_repasse_calc),0) glosado,
 coalesce(sum(valor_repasse_calc) filter(where status not in ('agendado','glosado')),0) realizado,
 count(*) filter(where regra_id is null) sem_regra
from public.atendimentos_calculados group by medico_id,competencia;
grant select on public.atendimentos_calculados,public.repasses_competencia to authenticated;
