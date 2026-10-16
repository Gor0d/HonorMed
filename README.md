# HonorMed

Controle pessoal de produção e recebimentos do médico. Registre as consultas por quantidade, mesmo sem saber o honorário, e acompanhe sua própria previsão. Next.js App Router, Supabase, cálculo em PostgreSQL e dados fictícios. **Sem conector e sem acesso ao Oracle.** Marca central em `web/src/lib/brand.ts`, usada na interface, metadata, manifest, página offline e gerador da apresentação. Não existem templates de e-mail customizados no repositório; configure o nome/remetente no projeto Supabase ao preparar o Auth hospedado.

## Fluxo principal

- `/`: Início, Produção, Recebimentos e Ajustes. As ações principais são **Registrar consultas** e **Registrar recebimento**.
- Em Ajustes, cadastre locais e convênios e, quando souber, o honorário líquido esperado por consulta/local. Honorários podem diferir entre locais.
- Lance uma consulta ou o total do dia. Sem honorário, a quantidade fica registrada e o valor fica pendente.
- Informe pagamentos parciais ou totais por local, convênio, mês da produção e data efetiva do recebimento. Um pagamento de novembro pode se referir à produção de outubro.
- Produção estimada, recebido e saldo são calculados em SQL, separadamente por local. Os valores são **informados pelo médico**, sem confirmação do hospital.
- `/importados`: visão avançada anterior (CSV/XLSX, regras contratuais e atendimentos individuais). Os totais são independentes do controle pessoal, evitando somar a mesma consulta duas vezes. Não há conciliação automática entre as duas visões.

O seed pessoal tem dois locais, seis lançamentos de produção e um recebimento parcial. Outubro tem 24 consultas, 4 ainda sem honorário, R$ 2.245,00 de produção conhecida, R$ 500,00 recebidos e R$ 1.745,00 previstos a receber. Novembro tem 6 consultas e R$ 510,00 de produção. A visão importada mantém os 140/70 atendimentos originais.

Para uma instalação Supabase existente, aplique as migrations novas `202610160002_controle_pessoal.sql` e `202610160003_unificar_producao.sql` pelo seu fluxo de migrations, preservando os dados. A segunda consolida produção em `atendimentos` (quantidade, local e código externo opcional), locais em `locais` e pagamentos em `recebimentos`; as views pessoais adaptam esses objetos ao fluxo simplificado. Recebimentos anteriores sem convênio ficam sem atribuição, sem compensar automaticamente um convênio. **Não use reset em banco com dados reais.** O `supabase db reset` abaixo é apenas para a base local fictícia. Auth hospedado e operação real continuam pendentes de validação.

No formulário móvel, use o controle +/− para a quantidade. Após um lançamento novo, **Desfazer lançamento** remove somente o registro recém-criado, até a próxima operação. **Repetir último lançamento** preenche local, convênio e quantidade do último registro, com data de hoje, e sempre exige confirmação antes de salvar.

## Executar a demonstração local

Requer Node.js 22.12+ e npm. No PowerShell:

```powershell
cd web
npm install
npm run dev
```

Abra http://127.0.0.1:3000 e clique **Entrar**. Sem configuração Supabase, o login é uma entrada explícita na demonstração, sem autenticação. PostgreSQL embarcado (PGlite) executa as mesmas migrations e seed do Supabase. Os dados são compartilhados apenas pelo processo local e reiniciam ao reiniciar o servidor. Datas de referência da demo: outubro e novembro de 2026. Não use o modo demo para dados reais.

## Supabase local e autenticação real

Instale Docker e a CLI Supabase. Com Docker ativo, na raiz:

```powershell
supabase start
supabase db reset
supabase status
```

Crie `web/.env.local` localmente (arquivo ignorado pelo Git):

```text
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon key exibida por supabase status>
NEXT_PUBLIC_PLANS_PREVIEW=true
```

Nunca coloque service role no navegador. Reinicie Next após configurar. A conta local fictícia é `demo@repasse.test` / `DemoRepasse2026!`. Novos cadastros usam e-mail/senha e onboarding de nome/CRM; código de prestador é opcional e o vínculo MV não é validado. O seed é exclusivamente local. Para Supabase hospedado aplique apenas migrations; configure confirmação de e-mail, URLs e SMTP no projeto. O endpoint demo responde 403 quando há Supabase configurado ou fora do localhost.

Cada médico pode cadastrar convênios e regras próprios; não há catálogo global com dados compartilhados. A mesma coluna `medico_id` identifica o usuário Auth, inclusive na tabela `medicos`.

## Validação

Dentro de `web`:

```powershell
npm run build
npm test
npx playwright install chromium
npm run test:e2e
```

Vitest executa o SQL real com PostgreSQL/PGlite, incluindo RLS com `SET ROLE authenticated` e dois médicos, cálculos, vigência, glosa e controle pessoal. O schema `auth` é simulado somente nesse ambiente de testes; Supabase usa Auth nativo. Playwright cobre o fluxo pessoal completo e a visão importada em 390px e 1280px. `npm run test:e2e` compila e inicia automaticamente um servidor de produção na porta 3100, sem reutilizar o dev da porta 3000. Para validar Auth nativo/RLS também no stack completo, use o roteiro em `docs/VALIDACAO.md`.

`npm run seed:demo` exporta uma fotografia opcional do seed SQL para inspeção em `src/lib/demo.json`; a aplicação consulta PostgreSQL diretamente, não essa fotografia.

PWA: manifest, ícones PNG 192/512 e service worker com página offline pública. Dados financeiros e sessões não entram no Cache Storage. Sem internet, a PWA mostra aviso e requer reconexão. Instalação depende de HTTPS (ou localhost) e suporte do navegador. Bricolage Grotesque e Manrope carregam via Google Fonts, com fallback local.

## Importação

CSV/XLSX, até 2 MB/1.000 linhas; primeira linha é cabeçalho. Colunas: `cd_atendimento`, `convenio` (nome cadastrado), `data_atendimento`, `status` e `valor_consulta` opcional. Datas ISO ou DD/MM/AAAA. Competência deriva da data do atendimento. Apenas campos permitidos são enviados, em um único upsert atômico; o mesmo código atualiza a linha existente do médico. Remova toda identificação pessoal antes do upload. Fórmulas XLSX não são executadas. Arquivos originais não são enviados nem armazenados.

Consulte `docs/REGRAS.md`, `docs/VALIDACAO.md` e `docs/FASE-3.md` para semântica financeira, limites de validação e próximos passos.
