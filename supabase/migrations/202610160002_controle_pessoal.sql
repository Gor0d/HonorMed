-- Controle independente: nenhum status aqui representa confirmação do hospital.
alter table public.medicos alter column cd_prestador_mv drop not null;
create table public.locais_atendimento (
 id uuid primary key default gen_random_uuid(), medico_id uuid not null references public.medicos,
 nome text not null check(length(trim(nome)) between 1 and 100),
 unique(medico_id,id), unique(medico_id,nome)
);
create table public.honorarios_pessoais (
 id uuid primary key default gen_random_uuid(), medico_id uuid not null references public.medicos,
 local_id uuid not null, convenio_id uuid not null,
 valor_unitario numeric(12,2) not null check(valor_unitario>=0),
 unique(medico_id,local_id,convenio_id),
 foreign key(medico_id,local_id) references public.locais_atendimento(medico_id,id),
 foreign key(medico_id,convenio_id) references public.convenios(medico_id,id)
);
create table public.producoes_pessoais (
 id uuid primary key default gen_random_uuid(), medico_id uuid not null references public.medicos,
 local_id uuid not null, convenio_id uuid not null, data_producao date not null,
 quantidade integer not null check(quantidade between 1 and 1000),
 valor_unitario numeric(12,2) check(valor_unitario>=0),
 created_at timestamptz not null default now(),
 foreign key(medico_id,local_id) references public.locais_atendimento(medico_id,id),
 foreign key(medico_id,convenio_id) references public.convenios(medico_id,id)
);
create table public.recebimentos_pessoais (
 id uuid primary key default gen_random_uuid(), medico_id uuid not null references public.medicos,
 local_id uuid not null, competencia text not null check(competencia ~ '^[0-9]{4}-(0[1-9]|1[0-2])$'),
 data_recebimento date not null, valor numeric(12,2) not null check(valor>0),
 created_at timestamptz not null default now(),
 foreign key(medico_id,local_id) references public.locais_atendimento(medico_id,id)
);
do $$ declare t text; begin
 foreach t in array array['locais_atendimento','honorarios_pessoais','producoes_pessoais','recebimentos_pessoais'] loop
 execute format('alter table public.%I enable row level security',t);
 execute format('create policy isolamento_medico on public.%I for all to authenticated using (medico_id=(select auth.uid())) with check (medico_id=(select auth.uid()))',t);
 execute format('grant select,insert,update,delete on public.%I to authenticated',t);
 end loop;
end $$;
create index on public.producoes_pessoais(medico_id,data_producao);
create index on public.recebimentos_pessoais(medico_id,competencia);

-- Freeze a known honorarium when the physician records production.
create function public.preencher_honorario_pessoal() returns trigger language plpgsql set search_path=public as $$
begin
 -- Same physician lock also serializes production against settings changes.
 perform 1 from medicos where medico_id=new.medico_id for update;
 if TG_OP='UPDATE' and (new.local_id<>old.local_id or new.convenio_id<>old.convenio_id) then
   new.valor_unitario=null;
 end if;
 if new.valor_unitario is null then
 select h.valor_unitario into new.valor_unitario from honorarios_pessoais h
 where h.medico_id=new.medico_id and h.local_id=new.local_id and h.convenio_id=new.convenio_id;
 end if;
 return new;
end $$;
create trigger producao_honorario before insert or update on public.producoes_pessoais
 for each row execute function public.preencher_honorario_pessoal();
create function public.lock_honorario_pessoal() returns trigger language plpgsql set search_path=public as $$
begin perform 1 from medicos where medico_id=new.medico_id for update; return new; end $$;
create trigger honorario_lock before insert or update on public.honorarios_pessoais
 for each row execute function public.lock_honorario_pessoal();
create function public.preencher_pendencias_pessoais() returns trigger language plpgsql set search_path=public as $$
begin
 update producoes_pessoais set valor_unitario=new.valor_unitario
 where medico_id=new.medico_id and local_id=new.local_id and convenio_id=new.convenio_id and valor_unitario is null;
 return new;
end $$;
create trigger honorario_pendencias after insert or update on public.honorarios_pessoais
 for each row execute function public.preencher_pendencias_pessoais();

create view public.producao_pessoal_calculada with(security_invoker=true) as
select p.*,l.nome local_nome,c.nome convenio_nome,to_char(p.data_producao,'YYYY-MM') competencia,
 case when p.valor_unitario is null then null else round(p.quantidade*p.valor_unitario,2) end valor_previsto,
 'Informado por você'::text fonte
from public.producoes_pessoais p
join public.locais_atendimento l on l.medico_id=p.medico_id and l.id=p.local_id
join public.convenios c on c.medico_id=p.medico_id and c.id=p.convenio_id;

create view public.controle_pessoal_locais with(security_invoker=true) as
with p as (
 select medico_id,local_id,competencia,sum(quantidade) quantidade,
 coalesce(sum(valor_previsto),0) produzido,
 coalesce(sum(quantidade) filter(where valor_unitario is null),0) sem_valor
 from public.producao_pessoal_calculada group by medico_id,local_id,competencia
), r as (
 select medico_id,local_id,competencia,sum(valor) recebido from public.recebimentos_pessoais
 group by medico_id,local_id,competencia
)
select coalesce(p.medico_id,r.medico_id) medico_id,coalesce(p.local_id,r.local_id) local_id,
 coalesce(p.competencia,r.competencia) competencia,
 coalesce(p.quantidade,0) quantidade,coalesce(p.produzido,0) produzido,
 coalesce(p.sem_valor,0) sem_valor,coalesce(r.recebido,0) recebido,
 greatest(coalesce(p.produzido,0)-coalesce(r.recebido,0),0) a_receber,
 greatest(coalesce(r.recebido,0)-coalesce(p.produzido,0),0) acima_previsto
from p full outer join r on p.medico_id=r.medico_id and p.local_id=r.local_id and p.competencia=r.competencia;
create view public.controle_pessoal_competencia with(security_invoker=true) as
select medico_id,competencia,sum(quantidade) quantidade,sum(produzido) produzido,
sum(sem_valor) sem_valor,sum(recebido) recebido,sum(a_receber) a_receber,sum(acima_previsto) acima_previsto
from public.controle_pessoal_locais group by medico_id,competencia;
grant select on public.producao_pessoal_calculada,public.controle_pessoal_locais,public.controle_pessoal_competencia to authenticated;
