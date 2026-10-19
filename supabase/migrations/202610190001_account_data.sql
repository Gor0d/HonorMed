-- Self-service portability runs with caller privileges and existing tenant RLS.
create function public.exportar_meus_dados() returns jsonb
language plpgsql stable security invoker set search_path = '' as $$
declare
 titular uuid := auth.uid();
 tabela text;
 registros jsonb;
 dados jsonb := '{}'::jsonb;
begin
 if titular is null then raise exception 'Autenticação necessária' using errcode='42501'; end if;
 foreach tabela in array array['medicos','locais','convenios','regras_repasse','atendimentos','recebimentos','honorarios_pessoais','metas','sync_log','preferencias_produto','laudos_tipos','laudos_valores','laudos_producao','laudos_recebimentos'] loop
   execute format('select coalesce(jsonb_agg(to_jsonb(t)), ''[]''::jsonb) from public.%I t where medico_id=$1', tabela)
     into registros using titular;
   dados := dados || jsonb_build_object(tabela,registros);
 end loop;
 return jsonb_build_object('versao',1,'exportado_em',now(),'dados',dados);
end $$;
revoke all on function public.exportar_meus_dados() from public;
grant execute on function public.exportar_meus_dados() to authenticated;

-- No arbitrary physician parameter. The only elevated operation is deleting
-- the caller's Auth identity, after removing dependent application rows atomically.
create function public.excluir_minha_conta(confirmacao text) returns void
language plpgsql security definer set search_path = '' as $$
declare titular uuid := auth.uid();
begin
 if titular is null then raise exception 'Autenticação necessária' using errcode='42501'; end if;
 if confirmacao is distinct from 'EXCLUIR MINHA CONTA' then
   raise exception 'Confirmação inválida' using errcode='22023';
 end if;
 -- Lock identity/profile against concurrent inserts and ensure the JWT still
 -- belongs to an existing identity. A deleted identity cannot be recreated here.
 perform 1 from auth.users where id=titular for update;
 if not found then raise exception 'Conta inexistente' using errcode='42501'; end if;
 perform 1 from public.medicos where medico_id=titular for update;
 delete from public.laudos_producao where medico_id=titular;
 delete from public.laudos_recebimentos where medico_id=titular;
 delete from public.laudos_valores where medico_id=titular;
 delete from public.laudos_tipos where medico_id=titular;
 delete from public.honorarios_pessoais where medico_id=titular;
 delete from public.atendimentos where medico_id=titular;
 delete from public.recebimentos where medico_id=titular;
 delete from public.regras_repasse where medico_id=titular;
 delete from public.metas where medico_id=titular;
 delete from public.sync_log where medico_id=titular;
 delete from public.preferencias_produto where medico_id=titular;
 delete from public.locais where medico_id=titular;
 delete from public.convenios where medico_id=titular;
 delete from public.medicos where medico_id=titular;
 delete from auth.users where id=titular;
end $$;
revoke all on function public.excluir_minha_conta(text) from public;
grant execute on function public.excluir_minha_conta(text) to authenticated;
