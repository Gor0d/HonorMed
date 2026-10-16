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
 '2026-'||m,case when m=10 and i%12=5 then 50 else 0 end,'importado'
from (values(10,140),(11,70)) months(m,n) cross join lateral generate_series(1,n) i;
insert into metas(medico_id,competencia,valor) values
('11111111-1111-4111-8111-111111111111','2026-10',15000),
('11111111-1111-4111-8111-111111111111','2026-11',10000);
insert into sync_log(medico_id,linhas,erros) values('11111111-1111-4111-8111-111111111111',210,null);

-- Separate personal ledger: never summed with imported encounter data.
insert into locais_atendimento(id,medico_id,nome) values
('44444444-4444-4444-8444-000000000001','11111111-1111-4111-8111-111111111111','Clínica Central (fictícia)'),
('44444444-4444-4444-8444-000000000002','11111111-1111-4111-8111-111111111111','Consultório Norte (fictício)');
insert into honorarios_pessoais(medico_id,local_id,convenio_id,valor_unitario)
select '11111111-1111-4111-8111-111111111111',l.id,c.id,
case c.nome when 'Unimed' then case when l.nome like 'Clínica%' then 85 else 90 end when 'Particular' then 245 else 95 end
from locais_atendimento l cross join convenios c where c.nome in('Unimed','Particular','Bradesco Saúde');
insert into producoes_pessoais(medico_id,local_id,convenio_id,data_producao,quantidade)
select '11111111-1111-4111-8111-111111111111',('44444444-4444-4444-8444-'||lpad(local::text,12,'0'))::uuid,
('22222222-2222-4222-8222-'||lpad(conv::text,12,'0'))::uuid,d::date,q
from (values(1,1,'2026-10-15',8),(1,4,'2026-10-15',3),(1,5,'2026-10-15',4),
(2,1,'2026-10-16',5),(1,2,'2026-10-14',4),(1,1,'2026-11-02',6)) v(local,conv,d,q);
insert into recebimentos_pessoais(medico_id,local_id,convenio_id,competencia,data_recebimento,valor) values
('11111111-1111-4111-8111-111111111111','44444444-4444-4444-8444-000000000001','22222222-2222-4222-8222-000000000001','2026-10','2026-11-05',500);

insert into preferencias_produto(medico_id,perfil_uso) values('11111111-1111-4111-8111-111111111111','consultas');
insert into laudos_tipos(id,medico_id,nome) values
('66666666-6666-4666-8666-000000000001','11111111-1111-4111-8111-111111111111','Radiografia'),
('66666666-6666-4666-8666-000000000002','11111111-1111-4111-8111-111111111111','Tomografia'),
('66666666-6666-4666-8666-000000000003','11111111-1111-4111-8111-111111111111','Ressonância'),
('66666666-6666-4666-8666-000000000004','11111111-1111-4111-8111-111111111111','Ultrassonografia');
insert into laudos_valores(medico_id,local_id,tipo_id,valor_unitario)
select '11111111-1111-4111-8111-111111111111',l.id,t.id,
case t.nome when 'Radiografia' then case when l.nome like 'Clínica%' then 12 else 15 end when 'Tomografia' then 35 else 55 end
from locais l cross join laudos_tipos t where t.nome<>'Ultrassonografia';
insert into laudos_producao(medico_id,local_id,tipo_id,data_producao,quantidade)
select '11111111-1111-4111-8111-111111111111',('44444444-4444-4444-8444-'||lpad(l::text,12,'0'))::uuid,
('66666666-6666-4666-8666-'||lpad(t::text,12,'0'))::uuid,d::date,q
from(values(1,1,'2026-10-15',30),(1,2,'2026-10-15',12),(2,1,'2026-10-16',20),(2,3,'2026-10-16',8),(1,4,'2026-10-16',5),(1,2,'2026-11-02',10))v(l,t,d,q);
insert into laudos_recebimentos(medico_id,local_id,competencia,data_recebimento,valor)
values('11111111-1111-4111-8111-111111111111','44444444-4444-4444-8444-000000000001','2026-10','2026-11-05',300);
