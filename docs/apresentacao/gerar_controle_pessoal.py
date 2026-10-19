"""Deck vigente: não depende de seed, navegador ou credenciais."""
import slides_base as sb
from slides_base import *


def panels(kicker, title, subtitle, entries, footnote, note):
    s = base(kicker, title, subtitle)
    for x, (tag, heading, body) in zip([.55, 4.68, 8.81], entries):
        card(s, x, 2.6, 3.95, heading, body, tag)
    text(s, footnote, LEFT, 5.98, 12.2, .7, 15, MUTED)
    notes(s, note)
    return s


def main():
    sb.TOTAL = 10
    s = base('Autonomia para quem cuida', '', dark=True)
    logo(s, True, LEFT, 1.25, 6)
    text(s, 'Sua produção. Seus honorários.\nSeu controle.', LEFT, 3, 11, 1.5, 34, LIGHT_ON_DARK, font=DISPLAY)
    text(s, 'Consultas, Laudos ou ambos.\nControle pessoal, simples e independente do administrativo.', LEFT, 5, 11, 1, 21, LIGHT_ON_DARK)
    notes(s, 'Versão 19/10/2026. Apresentação do produto e da proposta individual. Não é promessa de recebimento ou confirmação hospitalar. Nenhum dado real ou de paciente neste material.')

    panels('O valor para o médico', 'Comece com o que você já sabe.', 'Um registro de quantidade, sem precisar preencher uma planilha.', [
        ('REGISTRAR', 'O que produziu', 'Data, local e quantidade. Honorário desconhecido pode ficar pendente.'),
        ('PREVER', 'O que espera', 'Honorários conhecidos ajudam a estimar a produção e o saldo.'),
        ('CONFERIR', 'O que recebeu', 'Informe os pagamentos e acompanhe diferenças no seu controle.')],
        'As informações são declaradas pelo médico. O saldo não confirma pagamento pelo hospital.',
        'Apresentar o benefício como hipótese a validar no uso, sem garantir renda, recuperação de glosa ou economia medida.')

    panels('Primeiros passos', 'Configure sua rotina. Registre o dia.', 'Escolha Consultas, Laudos ou Ambos. O código MV é opcional.', [
        ('01 / CONFIGURAR', 'Seus locais', 'Consultas: local e convênio. Laudos: instituição e tipo de exame.'),
        ('02 / REGISTRAR', 'Sua quantidade', 'Registre uma unidade ou o total do dia; informe o honorário quando souber.'),
        ('03 / ACOMPANHAR', 'Seus recebimentos', 'Selecione o mês da produção e informe o que recebeu para conferir o saldo.')],
        'Checklist guiado e atalho Registrar estão preparados nos PRs, ainda sem publicação.',
        'Meta de primeiro registro abaixo de dois minutos ainda precisa ser medida com usuários. Não anunciar como resultado comprovado.')

    panels('Dois módulos', 'Use o que faz sentido para você.', 'Radiologistas podem usar somente Laudos, sem cadastrar consultas ou convênios.', [
        ('CONSULTAS', 'Rotina clínica', 'Quantidade por local e convênio, honorários esperados e recebimentos informados.'),
        ('LAUDOS', 'Produção radiológica', 'Quantidade por instituição e tipo de exame, com tarifa própria por combinação.'),
        ('AMBOS', 'Um acesso', 'Alterne os módulos. Cada um mantém seus próprios registros e recebimentos.')],
        'Laudos é controle de produção e honorários: não emite laudos, não guarda imagens nem texto clínico.',
        'Não somar ou compensar automaticamente Consultas e Laudos. A seleção de perfil não é plano de assinatura.')

    s = base('Exemplo fictício', 'Da quantidade ao saldo.', 'Exemplo didático de um local e um mês de produção.')
    box(s, LEFT, 2.6, 7.8, 3.95, GREEN)
    text(s, '8 CONSULTAS × R$ 85,00', .9, 2.95, 7, .5, 22, WHITE, font=DISPLAY)
    text(s, 'R$ 680,00', .9, 3.65, 7, 1, 44, WHITE, font=DISPLAY)
    text(s, 'Recebimento informado: R$ 200,00\nSaldo previsto: R$ 480,00', .9, 5, 7, 1.1, 22, WHITE)
    text(s, 'Valores conhecidos', 8.8, 2.8, 3.9, .7, 24, GREEN, font=DISPLAY)
    text(s, 'Itens sem honorário ficam pendentes.\n\nO cálculo acompanha seus registros, não o extrato do hospital.', 8.8, 3.7, 3.8, 2.5, 19, MUTED)
    notes(s, 'Todos os números são fictícios. Fórmulas permanecem no SQL. Não é fluxo bancário ou comprovação de recebimento. Não usar dados de pacientes na demonstração.')

    panels('Onde usar', 'Seu controle no celular e no computador.', 'Aplicativo web com layout adaptado e registro rápido.', [
        ('WEB', 'Visão completa', 'Produção, honorários, recebimentos e dashboard por mês.'),
        ('EXTENSÃO', 'Registro rápido', 'Popup Chromium para registrar quantidade com sua própria conta.'),
        ('PWA', 'Atalho no celular', 'Instalação disponível; validação em dispositivo físico ainda pendente.')],
        'Consulta e gravação financeira exigem conexão. Extensão ainda sem distribuição em loja.',
        'O titular relatou teste manual da extensão em 18/10. Navegador e expiração ainda precisam ser registrados. Sem leitura de prontuários ou automação hospitalar.')

    panels('Privacidade e autonomia', 'Sem dados de pacientes.', 'Somente registros de produção e controle financeiro pessoal.', [
        ('ISOLAMENTO', 'Sua própria conta', 'Acesso individual com políticas de isolamento de dados por médico.'),
        ('PORTABILIDADE', 'Seus dados', 'Exportação JSON/CSV e exclusão da própria conta preparadas, ainda não publicadas.'),
        ('ESCOLHA', 'Métricas opcionais', 'Contadores de uso sem valores financeiros, desativados por padrão; ainda não publicados.')],
        'Termos, política, retenção e restauração precisam de revisão/homologação antes de ampliar o piloto.',
        'Não prometer expurgo imediato de backups. Feedback prepara e-mail sem anexar dados da conta. Novas funções de conta e métricas dependem de migrations e deploy autorizados.')

    s = base('Proposta individual · a validar', 'Um ou dois módulos. O mesmo preço.', 'Preço proposto por médico, sem cobrança ativa no aplicativo.')
    card(s, .55, 2.6, 5.98, f'{brl(PRO_PRICE)}/mês', 'Consultas, Laudos ou ambos. Múltiplos locais, honorários e histórico registrado.', 'CONTROLE INDIVIDUAL', dark=True)
    card(s, 6.75, 2.6, 5.98, 'Validar no piloto', 'Utilidade, frequência de uso, suporte necessário e disposição a pagar.', 'ANTES DE CONTRATAR')
    text(s, 'Sem trial ou limites por plano. Equipes e instituições estão no roadmap, sem oferta disponível.', LEFT, 5.98, 12.2, .7, 15, MUTED)
    notes(s, 'Fonte única: web/src/lib/plans.ts. Preço é hipótese comercial, não contrato. Propostas antigas Free e Institucional foram retiradas. Integração hospitalar e cobrança automática não estão incluídas. Não assegurar margem ou retorno financeiro.')

    panels('Piloto assistido · proposta', 'Aprender com a rotina real.', 'Convite condicionado à preparação operacional e à aprovação dos textos legais.', [
        ('PARTICIPANTES', '5–10 médicos', 'Consultas, Laudos ou ambos, com acompanhamento de uso.'),
        ('PERÍODO', '30 dias propostos', 'Observar recorrência, entendimento do saldo e dificuldade para registrar.'),
        ('APRENDIZADO', 'Medir e ajustar', 'Tempo de suporte, falhas e intenção de continuar usando.')],
        'Esse período de observação não é um trial implementado nem uma condição contratual aprovada.',
        'E-mails básicos foram confirmados pelo titular em 17/10. Novos modelos, conta/métricas, retenção e restauração precisam de homologação. Não enviar convites automaticamente.')

    panels('Apêndice · estado em 19/10/2026', 'Publicado e preparado são estados diferentes.', 'Consulte docs/ESTADO-ATUAL.md antes de apresentar ou contratar.', [
        ('REGISTRO ANTERIOR', 'Piloto publicado', 'Cloudflare + Supabase. Controle pessoal, cálculo SQL e RLS individuais.'),
        ('PRS, SEM DEPLOY', 'B1–B6 preparados', 'Conta, checklist, feedback, métricas, runbooks e materiais alinhados.'),
        ('PENDÊNCIAS', 'Antes de ampliar', 'Revisão legal, retenção, restauração, credencial de envio, PWA e contratação.')],
        'honormed.emersongsguimaraes.workers.dev · sem nova inspeção remota nesta revisão.',
        'Oracle/MV, organizações, cirurgias, internações, plantões e cobrança automática não estão implementados. B7 depende de decisão de cobrar; B8 depende de validação de regras. Nenhum deploy ou operação remota nesta entrega.')

    assert len(prs.slides) == 10
    prs.core_properties.title = f'{BRAND} — controle pessoal do médico'
    prs.core_properties.subject = 'Oferta individual proposta e estado de preparação em 19/10/2026'
    prs.core_properties.author = BRAND
    target = OUT / f'{BRAND}_Apresentacao_Medicos.pptx'
    prs.save(target)
    print(f'{target.name}: {len(prs.slides)} slides')


if __name__ == '__main__':
    main()
