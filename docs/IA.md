# HonorMed com assistentes de IA

O projeto inclui quatro skills próprias e portáveis em `.agents/skills/`. Elas foram escritas a partir das decisões deste repositório; não são pacotes de terceiros baixados nem exportações de configurações pessoais. Servem para desenvolver, revisar e operar o produto. Não adicionam IA ao aplicativo, não contratam modelos e não conectam serviços automaticamente.

| Tarefa | Skill |
|---|---|
| Fluxos, módulos, experiência e escopo comercial | `honormed-produto` |
| SQL, migrations, regras financeiras e RLS | `honormed-dados` |
| UI, logo, cores, PWA e materiais visuais | `honormed-identidade` |
| Prontidão, build, deploy e verificação do site | `honormed-publicacao` |

As skills apontam para os documentos e arquivos canônicos do checkout. Não copiamos o plano inteiro dentro de cada skill: assim uma mudança no produto não deixa quatro versões diferentes do contexto. Leia sempre a revisão mais recente do plano; LANCAMENTO.md e VALIDACAO.md distinguem execução comprovada de pendências. Preços propostos estão em `web/src/lib/plans.ts`; funcionalidades futuras não são recursos já vendidos.

## Usar em casa

Clone ou atualize `https://github.com/Gor0d/HonorMed.git` e abra a raiz do repositório no assistente. Para ambientes que suportam skills por projeto, a pasta `.agents/skills/` contém o formato SKILL.md. A descoberta automática depende da ferramenta e versão utilizadas; é possível apontar para os arquivos explicitamente. Claude tem o ponto de entrada `CLAUDE.md`; Copilot tem `.github/copilot-instructions.md`. Esses arquivos direcionam ao mesmo contexto, sem duplicar todo o plano.

Prompt inicial para qualquer IA com acesso aos arquivos:

```text
Estamos trabalhando no HonorMed neste checkout.
Leia AGENTS.md, a revisão mais recente de docs/PLANO.md e docs/IA.md.
Para esta tarefa, leia também .agents/skills/honormed-produto/SKILL.md.
Tarefa: [descreva a mudança desejada].
Preserve as decisões vigentes e confira o código antes de assumir que algo já existe.
```

Troque o nome da skill conforme a tarefa. Em ferramentas sem leitura de arquivos, anexe AGENTS.md, o plano atual e somente os documentos pertinentes, depois de revisar seu conteúdo. Não anexe `.env`, tokens, logs operacionais ou dados reais. O ZIP `docs/ia/HonorMed_IA.zip` reúne skills e contexto textual selecionado; para programar, use o checkout completo, pois o pacote de contexto não contém todo o aplicativo.

## Ambientes e permissões

Credenciais não viajam pelo Git ou pelo kit. Em outro computador, instale dependências de `/web` e configure o ambiente separadamente. Para testes locais use os comandos documentados em AGENTS.md; E2E já isola dados fictícios. Para operar produção, autentique as CLIs na conta correta e confira o destino antes de alterações. O fato de uma IA ter lido uma skill não significa que ela recebeu autorização para publicar, migrar, enviar mensagens ou modificar outro serviço.

Não são incluídas skills pessoais de Oracle/MV, acesso a hospitais ou conectores de outros projetos. O HonorMed atual funciona sem Oracle; qualquer conector continua dependente de descoberta/autorização específica em HML. As mesmas regras financeiras e de privacidade valem para todos os assistentes.
