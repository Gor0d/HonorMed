-- Run only against the explicitly linked HonorMed database. Everything rolls back.
begin;
insert into auth.users(id) values
 ('aaaaaaaa-1111-4111-8111-111111111111'),('bbbbbbbb-2222-4222-8222-222222222222');
insert into public.medicos(medico_id,nome,crm) values
 ('aaaaaaaa-1111-4111-8111-111111111111','Teste técnico A','TESTE-A'),
 ('bbbbbbbb-2222-4222-8222-222222222222','Teste técnico B','TESTE-B');
insert into public.locais(id,medico_id,nome) values
 ('aaaaaaaa-3333-4333-8333-333333333333','aaaaaaaa-1111-4111-8111-111111111111','Local temporário A');
insert into public.convenios(id,medico_id,nome) values
 ('aaaaaaaa-4444-4444-8444-444444444444','aaaaaaaa-1111-4111-8111-111111111111','Convênio temporário A');
insert into public.laudos_tipos(id,medico_id,nome) values
 ('aaaaaaaa-5555-4555-8555-555555555555','aaaaaaaa-1111-4111-8111-111111111111','Exame temporário A');
insert into public.laudos_valores(medico_id,local_id,tipo_id,valor_unitario) values
 ('aaaaaaaa-1111-4111-8111-111111111111','aaaaaaaa-3333-4333-8333-333333333333','aaaaaaaa-5555-4555-8555-555555555555',12.50);
insert into public.laudos_producao(medico_id,local_id,tipo_id,data_producao,quantidade) values
 ('aaaaaaaa-1111-4111-8111-111111111111','aaaaaaaa-3333-4333-8333-333333333333','aaaaaaaa-5555-4555-8555-555555555555','2026-10-16',8);
insert into public.laudos_recebimentos(medico_id,local_id,competencia,data_recebimento,valor) values
 ('aaaaaaaa-1111-4111-8111-111111111111','aaaaaaaa-3333-4333-8333-333333333333','2026-10','2026-11-05',40);
set local role authenticated;
select set_config('request.jwt.claim.sub','aaaaaaaa-1111-4111-8111-111111111111',true);
do $$ begin
 if (select a_receber from public.laudos_resumo_competencia where competencia='2026-10') is distinct from 60::numeric then
   raise exception 'Cálculo real de laudos incorreto';
 end if;
end $$;
select set_config('request.jwt.claim.sub','bbbbbbbb-2222-4222-8222-222222222222',true);
do $$ declare t text; n bigint; begin
 foreach t in array array['medicos','locais','convenios','laudos_tipos','laudos_valores','laudos_producao','laudos_recebimentos','laudos_calculados','laudos_resumo_competencia','laudos_resumo_locais','laudos_resumo_tipos'] loop
   execute format('select count(*) from public.%I where medico_id=$1',t)
     into n using 'aaaaaaaa-1111-4111-8111-111111111111'::uuid;
   if n<>0 then raise exception 'RLS vazou dados na relação %',t; end if;
 end loop;
 update public.laudos_producao set quantidade=9 where medico_id='aaaaaaaa-1111-4111-8111-111111111111';
 get diagnostics n = row_count;
 if n<>0 then raise exception 'RLS permitiu alteração de outro médico'; end if;
 begin
   insert into public.locais(medico_id,nome) values('aaaaaaaa-1111-4111-8111-111111111111','Acesso proibido');
   raise exception 'RLS permitiu INSERT de outro médico';
 exception when insufficient_privilege then null; end;
end $$;
reset role;
rollback;
