-- Local-only fictional account. Never use this password outside the local seed.
set search_path = public, extensions;
insert into auth.users(instance_id,id,aud,role,email,encrypted_password,email_confirmed_at,raw_app_meta_data,raw_user_meta_data,created_at,updated_at,confirmation_token,recovery_token,email_change_token_new,email_change)
values('00000000-0000-0000-0000-000000000000','11111111-1111-4111-8111-111111111111','authenticated','authenticated','demo@repasse.test',crypt('DemoRepasse2026!',gen_salt('bf')),now(),'{"provider":"email","providers":["email"]}','{}',now(),now(),'','','','');
insert into auth.identities(id,user_id,provider_id,identity_data,provider,last_sign_in_at,created_at,updated_at)
values('11111111-1111-4111-8111-111111111111','11111111-1111-4111-8111-111111111111','11111111-1111-4111-8111-111111111111','{"sub":"11111111-1111-4111-8111-111111111111","email":"demo@repasse.test"}','email',now(),now(),now());
insert into medicos(medico_id,nome,crm,cd_prestador_mv) values('11111111-1111-4111-8111-111111111111','Marina Costa (fictício)','CRM-SP 000000','900001');
insert into convenios(id,medico_id,nome,cd_convenio_mv)
select ('22222222-2222-4222-8222-'||lpad(i::text,12,'0'))::uuid,'11111111-1111-4111-8111-111111111111',n,i::text
from unnest(array['Unimed','Bradesco Saúde','SulAmérica','Particular','Vida Saúde']) with ordinality as t(n,i);
insert into regras_repasse(medico_id,convenio_id,modo,valor_consulta,valor_honorario,percentual,deducao_pct,vigencia_ini)
select medico_id,id,case when nome='Particular' then 'percentual' else 'fixo' end,
case when nome='Particular' then 350 else 180 end,
case nome when 'Unimed' then 85 when 'Bradesco Saúde' then 95 else 110 end,
70,case when nome='SulAmérica' then 5 else 0 end,'2026-10-01'
from convenios where nome<>'Vida Saúde';
insert into atendimentos(medico_id,cd_atendimento,convenio_id,data_atendimento,status,competencia,glosa_pct,origem)
select '11111111-1111-4111-8111-111111111111','FICT-'||m||'-'||i,
 ('22222222-2222-4222-8222-'||lpad(((i-1)%5+1)::text,12,'0'))::uuid,
 make_date(2026,m,(i-1)%28+1),
 case when m=11 then 'agendado' else (array['pago','faturado','a_faturar','realizado','glosado','agendado'])[((i-1)%6)+1] end,
 '2026-'||m,case when m=10 and i%12=5 then 50 else 0 end,'manual'
from (values(10,140),(11,70)) months(m,n) cross join lateral generate_series(1,n) i;
insert into metas(medico_id,competencia,valor) values
('11111111-1111-4111-8111-111111111111','2026-10',15000),
('11111111-1111-4111-8111-111111111111','2026-11',10000);
insert into sync_log(medico_id,linhas,erros) values('11111111-1111-4111-8111-111111111111',210,null);
