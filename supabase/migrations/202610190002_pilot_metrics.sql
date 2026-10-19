-- No financial fields, locations, procedures, quantities or free text.
create table public.piloto_preferencias (
 medico_id uuid primary key references public.medicos on delete cascade,
 ativo boolean not null default false
);
create table public.piloto_contadores (
 medico_id uuid not null references public.medicos on delete cascade,
 dia date not null default current_date,
 registros integer not null default 0 check(registros>=0),
 erros integer not null default 0 check(erros>=0),
 primary key(medico_id,dia)
);
alter table public.piloto_preferencias enable row level security;
alter table public.piloto_contadores enable row level security;
create policy isolamento_medico on public.piloto_preferencias for select to authenticated using(medico_id=(select auth.uid()));
create policy isolamento_medico on public.piloto_contadores for select to authenticated using(medico_id=(select auth.uid()));
revoke all on public.piloto_preferencias,public.piloto_contadores from public,authenticated;
grant select on public.piloto_preferencias,public.piloto_contadores to authenticated;

create function public.definir_metricas_piloto(ativar boolean) returns void
language plpgsql security definer set search_path='' as $$
declare titular uuid:=auth.uid();
begin
 if titular is null or ativar is null then raise exception 'Autenticação e escolha explícita necessárias' using errcode='42501'; end if;
 perform 1 from public.medicos where medico_id=titular for update;
 if not found then raise exception 'Perfil necessário' using errcode='42501'; end if;
 insert into public.piloto_preferencias(medico_id,ativo)values(titular,ativar)
 on conflict(medico_id)do update set ativo=excluded.ativo;
 if not ativar then delete from public.piloto_contadores where medico_id=titular; end if;
end $$;

create function public.contar_registro_piloto() returns trigger
language plpgsql security definer set search_path='' as $$
begin
 perform 1 from public.piloto_preferencias where medico_id=new.medico_id and ativo for update;
 if found then
  insert into public.piloto_contadores(medico_id,dia,registros)values(new.medico_id,current_date,1)
  on conflict(medico_id,dia)do update set registros=public.piloto_contadores.registros+1;
 end if;
 return new;
end $$;
create trigger contar_consulta_piloto after insert on public.atendimentos for each row execute function public.contar_registro_piloto();
create trigger contar_laudo_piloto after insert on public.laudos_producao for each row execute function public.contar_registro_piloto();

create function public.registrar_erro_piloto() returns void
language plpgsql security definer set search_path='' as $$
declare titular uuid:=auth.uid();
begin
 if titular is null then raise exception 'Autenticação necessária' using errcode='42501'; end if;
 perform 1 from public.piloto_preferencias where medico_id=titular and ativo for update;
 if found then
  insert into public.piloto_contadores(medico_id,dia,erros)values(titular,current_date,1)
  on conflict(medico_id,dia)do update set erros=public.piloto_contadores.erros+1;
 end if;
end $$;

create function public.estado_metricas_piloto() returns jsonb
language plpgsql stable security invoker set search_path='' as $$
declare titular uuid:=auth.uid(); resumo jsonb;
begin
 if titular is null then raise exception 'Autenticação necessária' using errcode='42501'; end if;
 select coalesce(jsonb_agg(to_jsonb(t)),'[]'::jsonb) into resumo from (
  select date_trunc('week',dia::timestamp)::date semana,count(*)filter(where registros>0) dias_com_registro,sum(registros) registros,sum(erros) erros
  from public.piloto_contadores where medico_id=titular group by 1 order by 1 desc
 ) t;
 return jsonb_build_object('ativo',coalesce((select ativo from public.piloto_preferencias where medico_id=titular),false),'semanas',resumo);
end $$;
revoke all on function public.definir_metricas_piloto(boolean),public.contar_registro_piloto(),public.registrar_erro_piloto(),public.estado_metricas_piloto() from public;
grant execute on function public.definir_metricas_piloto(boolean),public.registrar_erro_piloto(),public.estado_metricas_piloto() to authenticated;

-- Include the new self-service data in portability. Deletion cascades from medicos.
create or replace function public.exportar_meus_dados() returns jsonb
language plpgsql stable security invoker set search_path='' as $$
declare titular uuid:=auth.uid(); tabela text; registros jsonb; dados jsonb:='{}'::jsonb;
begin
 if titular is null then raise exception 'Autenticação necessária' using errcode='42501'; end if;
 foreach tabela in array array['medicos','locais','convenios','regras_repasse','atendimentos','recebimentos','honorarios_pessoais','metas','sync_log','preferencias_produto','laudos_tipos','laudos_valores','laudos_producao','laudos_recebimentos','piloto_preferencias','piloto_contadores'] loop
  execute format('select coalesce(jsonb_agg(to_jsonb(t)),''[]''::jsonb) from public.%I t where medico_id=$1',tabela)into registros using titular;
  dados:=dados||jsonb_build_object(tabela,registros);
 end loop;
 return jsonb_build_object('versao',1,'exportado_em',now(),'dados',dados);
end $$;
