# Validação

## Automatizada

`cd web`, `npm test`: PostgreSQL real embarcado executa as migrations. Casos fixo/percentual/dedução/arredondamento/glosa, contagens 140/70, sem regra, datas de vigência e sobreposição. RLS com dois UUIDs, papel não superusuário, views `security_invoker`, bloqueio de leitura, escrita indevida e atualização do outro médico.

`npm run test:e2e`: Chromium em 390 × 844 e 1280 × 900. Testa entrada na demo, dashboard, troca outubro → novembro, filtros e tema; grava screenshots nos resultados ignorados pelo Git. O teste demonstra a interface, não substitui a validação de Auth do Supabase abaixo.

Também valida criar/editar/excluir regras, remoção dos casos sem regra, importação CSV e recálculo do valor por SQL. A execução é serial para isolar as alterações no banco demonstrativo compartilhado.

## Resultado em 16/10/2026

- `npm run build`: passou (Next.js 16.4.2, TypeScript).
- `npm test`: 9 testes passaram, incluindo cálculo e isolamento real por papel PostgreSQL.
- `npm run test:e2e`: 4 testes passaram em Chromium, nas duas larguras.
- Capturas de tela de dashboard conferidas visualmente em claro; alternância para escuro validada pelo navegador.
- Auditoria npm após atualização do Vitest: zero vulnerabilidades reportadas.
- Oracle: nenhum acesso, credencial ou conector implementado.
- Stack Supabase completo / `supabase db reset`: não executado porque o daemon Docker não está ativo neste ambiente. Login/cadastro com Auth nativo e confirmação de e-mail precisam da conferência abaixo com Supabase configurado.
- Instalação da PWA pelo usuário e comportamento em dispositivo físico não foram verificados; assets e fluxo offline estão implementados.

## Supabase completo

Com Docker e CLI instalados, execute na raiz `supabase start` e `supabase db reset`. Configure as duas variáveis públicas do README e reinicie o web.

1. Faça login como `demo@repasse.test` / `DemoRepasse2026!`, veja 140 registros em outubro e 70 em novembro.
2. Crie outro usuário e complete CRM/código fictícios. Confirme que a produção é vazia. Cadastre convênio, regra e importe uma consulta. Volte ao médico demo e confirme que esses dados não aparecem.
3. Pelo cliente Supabase autenticado como B, tente inserir linha com `medico_id` de A; deve falhar por RLS. Atualizar/excluir A não deve afetar linhas. Uma referência a convênio de A com médico B deve falhar por FK composta.
4. Edite vigência/valor/dedução e confira o detalhamento SQL; crie sobreposição e espere rejeição. Importe CSV/XLSX com código repetido em arquivos sucessivos, confirme atualização sem duplicação. Arquivo inválido deve rejeitar todas as linhas.
5. Faça logout; confirme remoção da tela financeira. Confirme que `/api/demo` retorna 403 com Supabase configurado.

## PWA / visual

Manifest e ícones em DevTools → Application. Instale via navegador compatível em HTTPS/localhost; abra em modo standalone. Desligue rede: deve aparecer aviso offline, sem valores financeiros em cache. Confira tema claro/escuro, foco por teclado, zoom e rolagem de tabelas no celular. O botão instalar só aparece quando o navegador disponibiliza o evento nativo.
