# HonorMed — guia para apresentar aos médicos

## Situação em 19/10/2026

O piloto está publicado em https://honormed.emersongsguimaraes.workers.dev. Auth/API Supabase reais, persistência e isolamento entre médicos foram validados tecnicamente no endereço publicado; contas e dados técnicos foram removidos. Há 27 testes SQL/RLS e 12 fluxos Playwright locais aprovados. Essas evidências não são homologação hospitalar nem confirmação de pagamentos.

A reunião usa **demonstração local com dados fictícios**. O médico informa a própria produção e os recebimentos; o saldo é uma estimativa pessoal. Consultas e Laudos são módulos independentes. Integração MV é futura e opcional. Nenhum dado de paciente, imagem, DICOM ou texto de laudo entra no fluxo pessoal.

Antes de convidar para uso real: conferir entrega dos e-mails de cadastro e recuperação/troca de senha com a conta do usuário; disponibilizar termos, privacidade, identificação do fornecedor e suporte; preparar backup e testar restauração; definir contratação/cobrança externa. Domínio próprio e instalação da PWA em dispositivo físico continuam pendentes; o endereço workers.dev serve ao piloto. Não apresentar trial, cobrança, exportação, SLA ou plano institucional como ativos.

## Material e sequência

- `HonorMed_Apresentacao_Medicos.pptx`: **19 slides** editáveis com notas. Slides **1–16** para médicos; **17–19** são apêndices de situação, viabilidade e limites.
- `HonorMed_Apresentacao_Medicos.pdf`: versão para compartilhar sem depender de PowerPoint.
- Slides novos: **4, Como acessar**, e **16, Piloto**. O antigo apêndice institucional saiu porque não há oferta institucional implementada.
- Bricolage Grotesque e Manrope não estavam instaladas neste Windows. O PPTX usa **Segoe UI/Segoe UI Semibold**, fontes disponíveis no Windows com Office. O PDF exportado incorpora as fontes usadas. Em outros sistemas, prefira o PDF.
- Preços são propostas de `web/src/lib/plans.ts`, sem contrato, cobrança, trial ou limites de plano ativos.

## Roteiro de 10 minutos

1. **Autonomia (slides 1–2):** perguntar como o médico confere os próprios honorários. Explicar que ele registra produção e recebimentos, sem confirmação automática do hospital.
2. **Acesso (slides 3–4):** mostrar o login com a identidade aprovada. Nesta reunião, abrir a demo local. O endereço publicado é para o cadastro no piloto depois das pendências acima.
3. **Consultas (slides 5–11):** registrar data, local, convênio e quantidade; mostrar honorário pendente, valores conhecidos, recebimento parcial e mês da produção. Na demo, outubro começa com 24 consultas, 4 sem valor, R$ 2.245,00 produzidos, R$ 500,00 informados como recebidos e R$ 1.745,00 previstos. Mudanças no seed alteram esses valores.
4. **Perfil e Laudos (slides 12–13):** escolher Somente laudos ou Ambos em Meu perfil de uso. Radiologistas não precisam cadastrar consultas/convênios. Laudos usam instituição e tipo de exame, com tarifas e recebimentos separados de Consultas. O seed de outubro tem 75 laudos, 5 sem tarifa, R$ 1.520,00 conhecidos, R$ 300,00 recebidos e R$ 1.220,00 previstos.
5. **Preço (slide 14):** Free e Pro são propostas a validar. Pro sugerido em R$ 79,90/médico/mês, Consultas, Laudos ou ambos. Todos os recursos atuais estão liberados; não há cobrança nem bloqueio por plano.
6. **Aprendizado e piloto (slides 15–16):** perguntar se prefere registrar cada atendimento ou o total do dia. Propor 5–10 médicos por 30 dias de uso assistido, condicionado à preparação operacional. Medir semanalmente uso recorrente, tempo de suporte, falhas, entendimento do saldo e intenção de pagar.

### Preparar a demo

Na pasta `web`, execute `npm.cmd run dev` **sem `web/.env.local`** e abra `http://127.0.0.1:3000`. Se esse arquivo existir, retire-o temporariamente do caminho por procedimento seguro e restaure-o após a reunião; não copie seu conteúdo para slides ou logs. Sem Supabase configurado, o botão Entrar abre o seed fictício sem autenticação real. O localhost funciona no computador que executa o servidor; projete ou compartilhe a tela. **Nunca carregue seed ou outros dados fictícios no Supabase de produção.**

O banco demonstrativo reinicia com o servidor; alterações durante a reunião mudam os valores. A visão `/importados` contém os registros fictícios anteriores e permanece separada, sem soma automática com o controle pessoal. O site publicado é https://honormed.emersongsguimaraes.workers.dev para o cadastro do piloto, após concluir as pendências operacionais.

## Perguntas para os médicos

- Como você confere hoje o repasse? Qual parte dá mais trabalho?
- É mais prático registrar uma consulta por vez ou a quantidade ao final do dia?
- Você conhece o honorário por local/convênio ou só descobre no demonstrativo?
- O mês de produção mostrado corresponde ao período usado em seus pagamentos?
- O saldo pessoal ajudaria a conferir seus recebimentos? O que faria você continuar usando?
- A proposta de R$ 79,90/mês faria sentido após o piloto? Que suporte seria necessário?

## Limites da conversa comercial

Não prometer integração MV, confirmação hospitalar ou bancária, glosa recuperada automaticamente, exportação, SLA, plano institucional, trial ou cobrança ativa. O cadastro de múltiplos locais/instituições já existe, mas não cria vínculo verificado com elas. A importação CSV/XLSX é uma visão avançada separada e não deve ser somada automaticamente à produção pessoal. A PWA existe, porém a instalação em dispositivo físico não foi validada.

Proposta Free: R$ 0, escopo sugerido de um local e mês atual. Proposta Pro: **R$ 79,90/médico/mês**, Consultas, Laudos ou ambos; múltiplos locais e histórico registrado. Esses limites e a cobrança não estão implementados. Os valores vêm de `web/src/lib/plans.ts` e precisam de validação comercial. A hipótese de preço não resulta de pesquisa comprovada de disposição a pagar.

Integração hospitalar exigiria autorização, descoberta HML e reconciliação explícita para evitar duplicidade. Sem prazo ou preço prometido para isso. Consulte `docs/FASE-3.md` apenas para o planejamento futuro.

## Regenerar a apresentação

Na raiz, instale as dependências **apenas em `.tools/presentation`** e regenere as capturas antes do deck:

```powershell
Set-Location web
npm.cmd run test:e2e
Set-Location ..
py -3.14 -m pip install --target .tools/presentation python-pptx Pillow
$env:PYTHONPATH = Join-Path $PWD '.tools/presentation'
py -3.14 docs/apresentacao/gerar_apresentacao.py
```

As capturas usadas são `web/test-results/personal-dashboard-desktop.png`, `personal-dashboard-mobile.png` e `radiology-dashboard-desktop.png`, mais `docs/brand/login-390.png` e `login-1280.png`. `slides_base.py` lê as cores de `web/src/lib/brand.ts` e `web/src/app/globals.css`; `gerar_controle_pessoal.py` contém os textos; `gerar_apresentacao.py` é a entrada. As notas ficam no PPTX.

PDF exportado **do PPTX gerado** com LibreOffice 26.8.1 nesta máquina (saída temporária para evitar reutilizar o PDF anterior):

```powershell
New-Item -ItemType Directory -Force .tools/presentation/pdf | Out-Null
& 'C:\Program Files\LibreOffice\program\soffice.com' -env:UserInstallation=file:///C:/Projetos/HonorMed/.tools/lo-profile3 --headless --convert-to pdf --outdir .tools/presentation/pdf docs/apresentacao/HonorMed_Apresentacao_Medicos.pptx
Copy-Item -LiteralPath .tools/presentation/pdf/HonorMed_Apresentacao_Medicos.pdf -Destination docs/apresentacao/HonorMed_Apresentacao_Medicos.pdf -Force
```

Renderize cada página do PDF para revisão de texto, contraste, logo e capturas antes de distribuir. Nunca inclua credenciais, e-mails de contas técnicas ou dados reais.
