# HonorMed — identidade visual proposta

Conceito: **o valor do seu trabalho, à vista**. Um monograma H com duas colunas e uma ligação ascendente faz referência à produção e ao acompanhamento dos honorários. O topo em ouro marca o valor desse trabalho. A palavra HonorMed recebe pesos distintos e um ponto de assinatura. É uma direção visual original para avaliação; não representa pesquisa de disponibilidade ou registro de marca.

## Arquivos

Pacote para download: `HonorMed_Marca.zip`, com logos SVG/PNG, ícones e guia PDF. Capturas `login-390.png`, `login-1280.png`, `dashboard-390.png` e `dashboard-1280.png` mostram a aplicação local com dados fictícios. Prévia local em http://127.0.0.1:3200; o build dessa prévia usa a configuração Supabase existente para login real.

- `identidade.html`, `identidade.png` e `HonorMed_Identidade_Visual.pdf`: prancha com conceito, paleta, tipografia e aplicações.
- `web/public/brand/logo-primary.svg`: assinatura principal com letras em curvas e fundo transparente.
- `web/public/brand/logo-inverse.svg`: assinatura para fundos escuros, também em curvas.
- `web/public/brand/logo-primary.png` e `logo-inverse.png`: versões transparentes em alta resolução para apresentações e divulgação.
- `web/public/brand/symbol.svg`: símbolo isolado; `symbol-mono.svg`: símbolo em uma cor, via currentColor.
- `web/public/icon-192.png` e `icon-512.png`: ícones instaláveis, com geometria dentro da área segura maskable.

## Paleta e leitura

| Papel | Cor | Uso |
|---|---|---|
| Petróleo | #123C3A | Logo, títulos e painéis de marca |
| Marfim | #F8F5ED | Fundo principal e logo invertida |
| Ouro | #DFB86C | Assinatura e pequenos detalhes; não usar para texto pequeno sobre branco |
| Sálvia | #B8D6C6 | Destaques em fundos escuros |
| Verde funcional | #1C6860 | Ações e foco no tema claro |

Tema escuro usa superfícies próprias e verde claro para ações. Status financeiros mantêm suas cores semânticas; não confundir ouro decorativo com alerta. Os botões principais são verificados por contraste mínimo de 4,5:1 nos testes de navegador.

Títulos e assinatura: Bricolage Grotesque. Textos, controles e números: Manrope. Wordmarks SVG são vetorizados e não exigem instalação de fonte. A interface mantém fontes web e fallback sans-serif. A fonte Bricolage foi obtida do repositório oficial Google Fonts; licença SIL OFL em `OFL-Bricolage.txt`.

## Aplicação

Manter uma margem livre equivalente a pelo menos metade da largura da coluna do H. Preferir símbolo em 24px ou mais e assinatura completa em 140px ou mais. Não distorcer, adicionar sombras no símbolo, mudar a inclinação da ligação ou recolorir suas partes isoladamente. Usar logo invertida sobre petróleo e principal sobre marfim/branco. Símbolo monocromático para aplicações em uma tinta.

No produto: componente `web/src/components/brand.tsx`, tokens em globals.css, cores institucionais em brand.ts, login editorial, sidebar, marca compacta no celular, favicon SVG, manifest, ícones e documento offline. O service worker usa nova versão de cache público, sem dados financeiros.

Para regenerar ativos, em `/web`, com Chromium instalado e PLAYWRIGHT_BROWSERS_PATH configurado se necessário: `node scripts/generate-brand.mjs`. O JSON de curvas já é versionado; não é necessário baixar a fonte para cada build. Para mudar as letras: instalar fonttools num ambiente de ferramentas, executar `python docs/brand/vetorizar_wordmark.py caminho/bricolage.ttf` na raiz e regenerar. O build normal do app não executa geração nem baixa fontes para a logo.

Escopo desta entrega: proposta e aplicação local. O site publicado e os slides comerciais anteriores ainda usam a identidade anterior até a próxima atualização autorizada. O PDF deste diretório apresenta a nova identidade, não substitui a apresentação comercial.
