# Repasse MED

MVP de previsão de repasse ambulatorial. Next.js App Router, Supabase, cálculo em PostgreSQL e dados fictícios. **Sem conector e sem acesso ao Oracle.**

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

Nunca coloque service role no navegador. Reinicie Next após configurar. A conta local fictícia é `demo@repasse.test` / `DemoRepasse2026!`. Novos cadastros usam e-mail/senha e onboarding de CRM/código de prestador; o vínculo MV é declaratório até validação pelo hospital. O seed é exclusivamente local. Para Supabase hospedado aplique apenas migrations; configure confirmação de e-mail, URLs e SMTP no projeto. O endpoint demo responde 403 quando há Supabase configurado ou fora do localhost.

Cada médico pode cadastrar convênios e regras próprios; não há catálogo global com dados compartilhados. A mesma coluna `medico_id` identifica o usuário Auth, inclusive na tabela `medicos`.

## Validação

Dentro de `web`:

```powershell
npm run build
npm test
npx playwright install chromium
npm run test:e2e
```

Vitest executa o SQL real com PostgreSQL/PGlite, incluindo RLS com `SET ROLE authenticated` e dois médicos, cálculos, vigência e glosa. O schema `auth` é simulado somente nesse ambiente de testes; Supabase usa Auth nativo. Playwright cobre login demonstrativo, dashboard, troca de competência, filtros, tema e ausência de overflow a 390px e 1280px. Para validar Auth nativo/RLS também no stack completo, use o roteiro em `docs/VALIDACAO.md`.

`npm run seed:demo` exporta uma fotografia opcional do seed SQL para inspeção em `src/lib/demo.json`; a aplicação consulta PostgreSQL diretamente, não essa fotografia.

PWA: manifest, ícones PNG 192/512 e service worker com página offline pública. Dados financeiros e sessões não entram no Cache Storage. Sem internet, a PWA mostra aviso e requer reconexão. Instalação depende de HTTPS (ou localhost) e suporte do navegador. Bricolage Grotesque e Manrope carregam via Google Fonts, com fallback local.

## Importação

CSV/XLSX, até 2 MB/1.000 linhas; primeira linha é cabeçalho. Colunas: `cd_atendimento`, `convenio` (nome cadastrado), `data_atendimento`, `status` e `valor_consulta` opcional. Datas ISO ou DD/MM/AAAA. Competência deriva da data do atendimento. Apenas campos permitidos são enviados, em um único upsert atômico; o mesmo código atualiza a linha existente do médico. Remova toda identificação pessoal antes do upload. Fórmulas XLSX não são executadas. Arquivos originais não são enviados nem armazenados.

Consulte `docs/REGRAS.md`, `docs/VALIDACAO.md` e `docs/FASE-3.md` para semântica financeira, limites de validação e próximos passos.
