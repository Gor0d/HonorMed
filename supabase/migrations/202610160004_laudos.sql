-- Radiology is a standalone financial module, with no clinical report or patient data.
create table public.preferencias_produto (
 id uuid primary key default gen_random_uuid(), medico_id uuid not null unique references public.medicos,
 perfil_uso text not null check(perfil_uso in('consultas','laudos','ambos'))
);
create table public.laudos_tipos (
 id uuid primary key default gen_random_uuid(),medico_id uuid not null references public.medicos,
 nome text not null check(length(trim(nome)) between 1 and 100),
 unique(medico_id,id),unique(medico_id,nome)
);
create table public.laudos_valores (
 id uuid primary key default gen_random_uuid(),medico_id uuid not null references public.medicos,
 local_id uuid not null,tipo_id uuid not null,valor_unitario numeric(12,2) not null check(valor_unitario>=0),
 unique(medico_id,local_id,tipo_id),
 foreign key(medico_id,local_id) references public.locais(medico_id,id),
 foreign key(medico_id,tipo_id) references public.laudos_tipos(medico_id,id)
);
create table public.laudos_producao (
 id uuid primary key default gen_random_uuid(),medico_id uuid not null references public.medicos,
 local_id uuid not null,tipo_id uuid not null,data_producao date not null,
 quantidade integer not null check(quantidade between 1 and 10000),
 valor_unitario numeric(12,2) check(valor_unitario>=0),created_at timestamptz not null default now(),
 foreign key(medico_id,local_id) references public.locais(medico_id,id),
 foreign key(medico_id,tipo_id) references public.laudos_tipos(medico_id,id)
);
create table public.laudos_recebimentos (
 id uuid primary key default gen_random_uuid(),medico_id uuid not null references public.medicos,
 local_id uuid not null,competencia text not null check(competencia ~ '^[0-9]{4}-(0[1-9]|1[0-2])$'),
 data_recebimento date not null,valor numeric(12,2) not null check(valor>0),
 created_at timestamptz not null default now(),
 foreign key(medico_id,local_id) references public.locais(medico_id,id)
);
do $$ declare t text; begin
 foreach t in array array['preferencias_produto','laudos_tipos','laudos_valores','laudos_producao','laudos_recebimentos'] loop
 execute format('alter table public.%I enable row level security',t);
 execute format('create policy isolamento_medico on public.%I for all to authenticated using(medico_id=(select auth.uid())) with check(medico_id=(select auth.uid()))',t);
 execute format('grant select,insert,update,delete on public.%I to authenticated',t);
 end loop;
end $$;
create index on public.laudos_producao(medico_id,data_producao);
create index on public.laudos_recebimentos(medico_id,competencia);
create function public.preencher_valor_laudo() returns trigger language plpgsql set search_path=public as $$
begin
 perform 1 from medicos where medico_id=new.medico_id for update;
 if TG_OP='UPDATE' and(new.local_id<>old.local_id or new.tipo_id<>old.tipo_id) then new.valor_unitario=null; end if;
 if new.valor_unitario is null then select v.valor_unitario into new.valor_unitario from laudos_valores v
 where v.medico_id=new.medico_id and v.local_id=new.local_id and v.tipo_id=new.tipo_id; end if;
 return new;
end $$;
create trigger laudo_valor before insert or update on public.laudos_producao for each row execute function public.preencher_valor_laudo();
create trigger laudo_tarifa_lock before insert or update on public.laudos_valores for each row execute function public.lock_honorario_pessoal();
create function public.preencher_laudos_pendentes() returns trigger language plpgsql set search_path=public as $$
begin update laudos_producao set valor_unitario=new.valor_unitario where medico_id=new.medico_id
and local_id=new.local_id and tipo_id=new.tipo_id and valor_unitario is null; return new; end $$;
create trigger laudo_pendencias after insert or update on public.laudos_valores for each row execute function public.preencher_laudos_pendentes();
create view public.laudos_calculados with(security_invoker=true) as
select p.*,l.nome local_nome,t.nome tipo_nome,to_char(p.data_producao,'YYYY-MM') competencia,
round(p.quantidade*p.valor_unitario,2) valor_previsto,'Informado por você'::text fonte
from public.laudos_producao p join public.locais l on l.id=p.local_id and l.medico_id=p.medico_id
join public.laudos_tipos t on t.id=p.tipo_id and t.medico_id=p.medico_id;
create view public.laudos_resumo_locais with(security_invoker=true) as
with p as(select medico_id,local_id,competencia,sum(quantidade) quantidade,coalesce(sum(valor_previsto),0) produzido,
coalesce(sum(quantidade)filter(where valor_unitario is null),0) sem_valor from public.laudos_calculados group by medico_id,local_id,competencia),
r as(select medico_id,local_id,competencia,sum(valor) recebido from public.laudos_recebimentos group by medico_id,local_id,competencia)
select coalesce(p.medico_id,r.medico_id) medico_id,coalesce(p.local_id,r.local_id) local_id,coalesce(p.competencia,r.competencia) competencia,
coalesce(p.quantidade,0) quantidade,coalesce(p.produzido,0) produzido,coalesce(p.sem_valor,0) sem_valor,coalesce(r.recebido,0) recebido,
greatest(coalesce(p.produzido,0)-coalesce(r.recebido,0),0) a_receber,
greatest(coalesce(r.recebido,0)-coalesce(p.produzido,0),0) acima_previsto,
coalesce(p.produzido,0)-coalesce(r.recebido,0) diferenca
from p full outer join r on p.medico_id=r.medico_id and p.local_id=r.local_id and p.competencia=r.competencia;
create view public.laudos_resumo_competencia with(security_invoker=true) as
select medico_id,competencia,sum(quantidade) quantidade,sum(produzido) produzido,sum(sem_valor) sem_valor,
sum(recebido) recebido,sum(a_receber) a_receber,sum(acima_previsto) acima_previsto
from public.laudos_resumo_locais group by medico_id,competencia;
create view public.laudos_resumo_tipos with(security_invoker=true) as
select medico_id,competencia,tipo_id,tipo_nome,sum(quantidade) quantidade,coalesce(sum(valor_previsto),0) produzido
from public.laudos_calculados group by medico_id,competencia,tipo_id,tipo_nome;
grant select on public.laudos_calculados,public.laudos_resumo_locais,public.laudos_resumo_competencia,public.laudos_resumo_tipos to authenticated;
