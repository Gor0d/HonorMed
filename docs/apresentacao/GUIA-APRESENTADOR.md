# HonorMed — guia de apresentação

Versão B6, 19/10/2026. Fonte de verdade: [estado atual](../ESTADO-ATUAL.md). Deck atual com **10 slides**, sem capturas ou dependência de seed. Logo e paleta aprovadas preservadas; tipografia Segoe UI/Segoe UI Semibold para compatibilidade local com Office. O app mantém Bricolage Grotesque/Manrope.

## Roteiro de 8 minutos

1. Slides 1–2: autonomia para registrar produção e conferir os próprios recebimentos, sem confirmação hospitalar.
2. Slides 3–4: local, convênio/tipo de exame, quantidade e honorário opcional. Radiologista pode usar somente Laudos.
3. Slide 5: exemplo fictício 8 × R$ 85 − R$ 200 = R$ 480. Não confundir saldo pessoal com depósito confirmado.
4. Slide 6: web/extensão/PWA; sem armazenamento financeiro offline, loja ou PWA físico homologados.
5. Slide 7: sem dados de pacientes. Exportação/exclusão e métricas opcionais estão preparadas em PRs, não publicadas. Retenção e restauração continuam pendentes.
6. Slide 8: **R$ 79,90/mês por médico proposto**, Consultas e Laudos pelo mesmo preço. Sem cobrança/trial/limites ativos. Não oferecer Free ou Institucional; equipes são futuras.
7. Slides 9–10: proposta de piloto assistido, condicionada à preparação operacional. Separar o que está publicado das mudanças sem deploy. Não prometer renda, SLA, integração ou rentabilidade.

## Perguntas para validar

- Você prefere registrar por unidade ou total do dia?
- Conhece o honorário esperado por local/convênio/tipo de exame?
- O mês de produção corresponde ao período usado nos seus recebimentos?
- O saldo ajuda a conferir? O que dificulta o uso?
- A hipótese de R$ 79,90/mês faz sentido? Quanto suporte seria necessário?

Não citar participantes ou usar contas reais em material compartilhável. Não solicitar nomes, documentos ou dados de pacientes. Nesta entrega não preparar demo com seed nem mover arquivos de credenciais: o deck tem exemplos didáticos suficientes.

## Regeneração local

Dependências locais em `.tools/presentation`: `python-pptx` e `Pillow`. Na raiz, com Python disponível:

```powershell
$env:PYTHONPATH = Join-Path $PWD '.tools/presentation'
python docs/apresentacao/gerar_apresentacao.py
```

`slides_base.py` lê a marca/tokens e o preço individual de `plans.ts`; não lê credenciais nem banco. Para PDF, exportar **o PPTX regenerado** pelo PowerPoint/LibreOffice disponível. Conferir as 10 páginas, texto, preço, logo e notas antes de distribuir. Os arquivos atuais são `HonorMed_Apresentacao_Medicos.pptx` e `.pdf`. Histórico anterior permanece no Git.
