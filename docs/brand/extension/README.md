# Artes da extensão Registro rápido

Materiais preparados para a listagem da Chrome Web Store, com a marca aprovada e **somente dados fictícios**. Nenhuma imagem contém e-mail real, senha, token, dado de paciente ou produção de um médico. Os arquivos de popup vêm do mesmo HTML/CSS/JavaScript compilado pelos testes locais, com respostas Auth/API simuladas; não representam uma captura da conta publicada.

| Uso | Arquivo | Tamanho |
|---|---|---|
| Captura da listagem · Consultas | [loja-consultas-1280x800.png](loja-consultas-1280x800.png) | 1280 × 800 |
| Captura da listagem · Laudos | [loja-laudos-1280x800.png](loja-laudos-1280x800.png) | 1280 × 800 |
| Peça promocional pequena | [loja-promocional-440x280.png](loja-promocional-440x280.png) | 440 × 280 |
| Popup sem composição · Consultas | [popup-consultas-original.png](popup-consultas-original.png) | 380 px de largura |
| Popup sem composição · Laudos | [popup-laudos-original.png](popup-laudos-original.png) | 380 px de largura |

As imagens 1280 × 800 combinam a captura verdadeira da interface local do popup com texto explicativo e fundo da marca. A legenda identifica os dados como fictícios. As capturas originais permitem conferir cada campo. O ícone 128 × 128 já é gerado no pacote da extensão a partir do ícone aprovado do app.

Para regenerar, em `/extension`, execute `npm.cmd run test:e2e` e depois `node scripts/generate-store-assets.mjs`. O primeiro comando compila com origens `.invalid`, intercepta todas as chamadas de Auth/API e salva as capturas em `test-results/`; o segundo copia as capturas e cria os arquivos desta pasta. **Nunca** substitua essas imagens por capturas da conta real sem revisar todo o conteúdo visível.

As dimensões da captura e da peça promocional seguem a [orientação oficial de imagens da Chrome Web Store](https://developer.chrome.com/docs/webstore/images). Textos da listagem e situação de publicação: [REGISTRO-RAPIDO-LOJA.md](../../REGISTRO-RAPIDO-LOJA.md).
