# Rascunho da página da extensão na Chrome Web Store

**Status: rascunho interno, sem submissão ou publicação.** Revisar os textos, capturas e declarações de privacidade antes de qualquer envio. O piloto publicado ainda tem pendências de termos/privacidade e entrega de e-mail em `docs/LANCAMENTO.md`.

## Textos propostos

**Nome:** HonorMed · Registro rápido

**Descrição curta:** Registre Consultas e Laudos por quantidade no seu controle pessoal HonorMed.

**Descrição:** Registre a produção pessoal no computador do consultório em poucos passos. Entre com sua conta HonorMed, escolha o módulo permitido pelo seu perfil, informe data, local, convênio ou tipo de exame e quantidade. O valor previsto, quando disponível, é calculado no HonorMed. Você pode repetir os campos do último registro após confirmação e desfazer o lançamento recém-criado. Os registros são **informados por você** e não representam confirmação do hospital. Não informe dados de pacientes.

**Finalidade única para declaração de privacidade:** permitir ao médico autenticado registrar e corrigir sua própria produção pessoal por quantidade no HonorMed.

**Permissões:** `storage` guarda a sessão autenticada, o prazo de inatividade e os identificadores mínimos usados em “Repetir último”. A permissão de host é limitada à origem HTTPS do Supabase HonorMed para autenticação e dados do próprio médico sob RLS. A extensão não lê páginas, abas, histórico, cookies ou conteúdo clínico.

**Dados e uso a declarar:** e-mail e senha são enviados ao Supabase Auth para login; access/refresh tokens, `user.id`, horário da última interação e os IDs/quantidade do último registro ficam no armazenamento da extensão. Data, quantidade e IDs de local/convênio/tipo são enviados ao Supabase para o controle pessoal. Nenhum nome, CPF, imagem ou texto de paciente é solicitado. Não há anúncios nem venda de dados. A opção “Manter conectado neste computador” usa armazenamento local por até 12 h sem uso; o padrão usa armazenamento de sessão por até 30 min sem uso ou até fechar o navegador.

## Materiais e decisões pendentes

- Finalizar e publicar termos e política de privacidade do HonorMed; conferir a declaração de dados e permissões com a implementação e com o [programa da Chrome Web Store](https://developer.chrome.com/docs/webstore/program-policies) e o [fluxo de publicação](https://developer.chrome.com/docs/webstore/publish/).
- Preparar capturas **fictícias** do popup conectado, Consultas e Laudos, além dos recursos gráficos exigidos pelo painel da loja. Usar o logo/ícones aprovados; não expor tokens, e-mails reais ou dados de médicos.
- Validar entrega dos e-mails de confirmação/recuperação, domínio próprio, backup/restauração, contratação/cobrança e PWA em dispositivo físico conforme `docs/LANCAMENTO.md` antes de convidar médicos para uso real.
- Instalar e testar manualmente no Chrome e no Cent Browser do computador do consultório. Confirmar políticas de TI e comportamento de fechamento/expiração.
- Decidir distribuição, suporte e instruções de teste para revisão da loja. A chave anon pública e o host de produção só entram no pacote final após revisão operacional. Nenhum ZIP foi enviado à loja.
