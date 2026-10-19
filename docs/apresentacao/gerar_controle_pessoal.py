"""Current product deck: physician-owned production and receipts."""
from slides_base import *

def three(kicker,title,subtitle,cards,footnote,note,highlight=None):
    s=base(kicker,title,subtitle)
    for i,(x,(tag,heading,body)) in enumerate(zip([.55,4.68,8.81],cards)):card(s,x,2.6,3.95,heading,body,tag,dark=highlight==i)
    text(s,footnote,LEFT,5.95,12.2,.6,15,MUTED)
    notes(s,note)
    return s

def main():
    s=base('Autonomia para quem cuida','',dark=True)
    logo(s,True,LEFT,1.25,5.2)
    text(s,'Sua produção. Seus honorários.\nSeu controle.',LEFT,2.85,8.6,1.4,30,LIGHT_ON_DARK,False,DISPLAY,spacing=1.05,after=4)
    text(s,'Registre a produção do dia e acompanhe os honorários\nsem depender de acesso ao administrativo.',LEFT,4.6,8.4,1.0,18,LIGHT_ON_DARK,after=4)
    box(s,LEFT,5.73,.82,.04,GOLD,radius=False)
    pill(s,LEFT,6.0,4.7,.46,'PILOTO PUBLICADO  ·  DEMO COM DADOS FICTÍCIOS',GREEN,WHITE,11)
    for i,label in enumerate(['REGISTRAR','PREVER','CONFERIR']):
        y=2.35+i*1.15
        box(s,9.3,y,3.5,.95,GREEN if i==1 else ui_color('surface-2'),line=None if i==1 else GREEN,round_=.5)
        text(s,f'{i+1}',9.6,y+.24,.5,.5,24,LIGHT_ON_DARK if i==1 else INK,False,DISPLAY,after=0)
        text(s,label,10.15,y+.3,2.5,.4,17,WHITE if i==1 else INK,True,after=0)
    notes(s,'HonorMed com Consultas e Laudos independentes. Controle pessoal, não extrato oficial. Capturas e demonstração usam dados fictícios. O piloto público já está no Cloudflare; Auth/API reais foram validados tecnicamente. Disponibilidade comercial da marca ainda não foi validada. Slides 1–16 para médicos; 17–19 como apêndices.')

    three('O valor para o médico','Seu controle começa com o que você já sabe.','Uma ferramenta simples para registrar a rotina e acompanhar seus próprios números.',[
        ('01 / REGISTRAR','Sem planilha','Anote uma consulta ou a quantidade do dia, por local e convênio.'),
        ('02 / PREVER','Sem depender de relatório','Use os honorários conhecidos para estimar sua produção e seu saldo.'),
        ('03 / CONFERIR','Sem perder o histórico','Informe os recebimentos e acompanhe o que ainda está previsto.')],
        'O benefício esperado é autonomia na conferência. Utilidade e tempo de uso serão avaliados no piloto.',
        'Não prometer renda maior, recuperação automática de glosas ou economia já comprovada. Sem dados pessoais de pacientes e sem acesso ao Oracle.')

    s=base('Como funciona','Configure uma vez. Registre em poucos passos.','O médico mantém o próprio controle, sem precisar de código do administrativo.')
    steps=[('1','Entre na conta','E-mail, senha, nome e CRM. Código MV é opcional.'),('2','Cadastre seus locais','Onde atende e quais convênios ou consultas particulares realiza.'),('3','Informe o honorário','Valor esperado por consulta. Pode preencher quando souber.'),('4','Registre as consultas','Data, local, convênio e quantidade. Uma consulta ou total do dia.'),('5','Registre recebimentos','Valor, local, mês da produção e data em que recebeu.'),('6','Acompanhe o saldo','Veja a previsão, consultas sem valor e os detalhes dos registros.')]
    for i,(num,title,body) in enumerate(steps):
        x=.55+(i%3)*4.15;y=2.5+(i//3)*2.15
        box(s,x,y,3.95,1.9,WHITE,line=LINE)
        box(s,x+.25,y+.25,.5,.5,GREEN,round_=.5);text(s,num,x+.25,y+.34,.5,.4,16,WHITE,True,after=0,align=2)
        text(s,title,x+.92,y+.31,2.85,.4,18,INK,False,DISPLAY,after=0)
        text(s,body,x+.28,y+.98,3.45,.8,14,MUTED,after=0)
    notes(s,'Na demo local o botão Entrar não autentica, apenas abre seed fictício. No site publicado, Auth e API Supabase reais foram validados tecnicamente com contas temporárias, removidas depois. A entrega de e-mails de confirmação e recuperação ainda depende de teste do usuário. Onboarding não exige vínculo ao MV.')

    s=base('Como acessar','Demonstração local e cadastro no piloto.','Na reunião: demo fictícia · piloto: honormed.emersongsguimaraes.workers.dev')
    box(s,.55,2.48,5.25,4.39,WHITE,line=LINE)
    screenshot(s,ROOT/'docs/brand/login-390.png',2.25,2.59,1.72,3.97)
    box(s,6.05,2.48,6.72,4.39,WHITE,line=LINE)
    screenshot(s,ROOT/'docs/brand/login-1280.png',6.22,2.55,6.38,4.30)
    notes(s,'As capturas do login mostram a identidade aprovada, com dados fictícios ou campos vazios. Abrir a demonstração local com npm.cmd run dev em web, sem web/.env.local. O site publicado é para cadastro no piloto somente após verificar e-mails, termos/privacidade e os demais requisitos operacionais. Nunca carregar seed na produção.')

    s=base('Painel pessoal','Duas ações. Seus números em primeiro lugar.','Captura real do MVP · outubro de 2026 · dados fictícios.')
    box(s,LEFT-.06,2.24,7.72,4.62,WHITE,line=LINE,round_=.03)
    screenshot(s,ROOT/'web/test-results/personal-dashboard-desktop.png',LEFT,2.3,7.6,4.5)
    for i,(title,body) in enumerate([('Registrar consultas','Quantidade do dia, local e convênio.'),('Registrar recebimento','Valor recebido e mês da produção.'),('Acompanhar o saldo','Produção conhecida menos recebimentos, por local.')]):
        y=2.55+i*1.45
        text(s,f'{i+1}',8.65,y,.5,.5,24,GREEN,False,DISPLAY,after=0)
        text(s,title,9.2,y+.05,3.6,.4,19,INK,False,DISPLAY,after=0);text(s,body,9.2,y+.55,3.6,.75,15,MUTED,after=0)
    notes(s,'Outubro: 24 consultas, 4 sem honorário, produção conhecida R$ 2.245,00, recebido R$ 500,00 e saldo R$ 1.745,00. Todos fictícios. Alterações no seed durante a demo mudam os valores.')

    three('Entenda o resumo','Produção e recebimento são coisas diferentes.','O saldo representa o seu controle pessoal, sem confirmação do hospital.',[
        ('PRODUÇÃO ESTIMADA','R$ 2.245,00','Quantidade registrada × honorários conhecidos. Consultas sem valor ficam fora da soma.'),
        ('RECEBIDO INFORMADO','R$ 500,00','Pagamentos registrados por local, convênio e mês de produção.'),
        ('PREVISTO A RECEBER','R$ 1.745,00','Saldo estimado por local e convênio, considerando os valores conhecidos.')],
        'Exemplo fictício de outubro. Há 4 consultas registradas aguardando honorário.',
        'Não prometer depósito, conciliação bancária ou exatidão contra o extrato oficial. O excesso recebido em um local não compensa saldo de outro.')

    three('Registro rápido','Não sabe o valor? Registre as consultas assim mesmo.','O lançamento pode ser individual ou consolidado ao final do dia.',[
        ('DATA E LOCAL','Onde e quando','Selecione a data das consultas e o local de atendimento.'),
        ('CONVÊNIO E QUANTIDADE','Quanto você atendeu','Exemplo: 8 consultas Unimed na Clínica Central.'),
        ('HONORÁRIO OPCIONAL','Valor pode esperar','Sem honorário cadastrado, a quantidade fica salva e o valor fica pendente.')],
        'Sem nome, CPF ou identificação de pacientes. Você pode editar ou excluir lançamentos para corrigir.',
        'Um registro representa quantidade, não prontuário nem atendimento hospitalar confirmado. Para evitar duplicidade, corrija a quantidade já lançada em vez de repetir o total do dia.')

    s=base('Exemplo didático','Da produção ao saldo, com clareza.','O cálculo do seu controle pessoal usa o honorário esperado por consulta.')
    box(s,.55,2.6,7.7,3.95,GREEN)
    text(s,'8 CONSULTAS × R$ 85,00 DE HONORÁRIO',.9,2.95,7,.4,14,SOFT,True,after=0)
    text(s,'PRODUZIDO',.9,3.55,3,.3,11,SOFT,True,after=0)
    text(s,'R$ 680,00',.9,3.85,6.5,.9,46,WHITE,False,DISPLAY,spacing=1.0,after=0)
    box(s,.9,5.0,6.95,.02,SOFT,radius=False)
    for x,label,value in [(.9,'RECEBIMENTO INFORMADO','R$ 200,00'),(4.5,'SALDO PREVISTO','R$ 480,00')]:
        text(s,label,x,5.25,3.3,.3,11,SOFT,True,after=0);text(s,value,x,5.58,3.3,.6,28,WHITE,False,DISPLAY,spacing=1.0,after=0)
    text(s,'Honorário líquido esperado',8.75,2.75,4,.4,21,GREEN,False,DISPLAY,after=0)
    text(s,'Informe o valor por consulta já considerando os descontos que conhece.',8.75,3.3,3.9,1.2,16,MUTED,after=0)
    text(s,'Valores preservados',8.75,4.85,4,.4,21,GREEN,False,DISPLAY,after=0)
    text(s,'Registros com honorário mantêm o valor usado no lançamento.',8.75,5.4,3.9,1.0,16,MUTED,after=0)
    notes(s,'Exemplo hipotético. O banco copia o honorário conhecido ao salvar. Configurar honorário preenche os registros ainda sem valor. Alterar a configuração não muda os registros já valorizados; mudar local/convênio de um registro usa o honorário do novo par. A visão importada separada continua oferecendo regra fixa/percentual com vigência.')

    three('Recebimentos','O mês da produção pode ser diferente do pagamento.','Você informa a que período o dinheiro recebido se refere.',[
        ('PERÍODO DE REFERÊNCIA','Produção de outubro','Escolha o mês das consultas às quais o pagamento se refere.'),
        ('ENTRADA DO DINHEIRO','Recebido em novembro','Informe convênio, local, data real e valor, mesmo que parcial.'),
        ('ACOMPANHAMENTO','Saldo de outubro','O valor reduz o saldo daquele local e período, sem alterar novembro.')],
        'O lançamento abate o saldo daquele local e convênio; não marca consultas individuais como pagas.',
        'Se um depósito abrange vários locais ou meses, registre as parcelas conforme a composição conhecida. Se não souber, confirme a referência antes de atribuir. Não inventar conciliação por consulta.')

    three('Ajustes simples','Uma configuração para cada rotina.','Locais e convênios podem ter honorários diferentes.',[
        ('ONDE ATENDE','Seus locais','Cadastre consultórios, clínicas ou hospitais pelos nomes que usa.'),
        ('O QUE ATENDE','Seus convênios','Inclua Particular quando fizer consultas particulares.'),
        ('QUANTO ESPERA','Seus honorários','Preencha por local e convênio. Novos registros usam o valor configurado.')],
        'Salvar honorário também preenche registros ainda sem valor. A tela avisa esse efeito.',
        'Não pedir dados de pacientes para configurar. Não afirmar vínculo verificado com hospital por ter cadastrado um local. Sem honorário o registro pessoal já funciona.')

    s=base('No celular e no computador','O seu controle acompanha a sua rotina.','Quatro áreas: Início, Produção, Recebimentos e Ajustes.')
    box(s,.9,2.45,3,4.45,DEEP,round_=.1);screenshot(s,ROOT/'web/test-results/personal-dashboard-mobile.png',1.42,2.57,1.96,4.22)
    text(s,'No celular',4.7,2.75,7.6,.6,28,GREEN,False,DISPLAY,after=0)
    text(s,'Registre a produção ao final do dia\ne consulte seus números em poucos toques.',4.7,3.4,7.6,1.0,20,INK,after=4)
    text(s,'No computador',4.7,5.05,7.6,.6,28,GREEN,False,DISPLAY,after=0)
    text(s,'Filtre registros e confira os valores\npor local, convênio e data.',4.7,5.7,7.6,1,20,INK,after=4)
    notes(s,'PWA e temas implementados. Instalação no dispositivo físico ainda não foi validada. Para consultar dados é necessária conexão. Não há controle financeiro offline. Existe deploy público no endereço honormed.emersongsguimaraes.workers.dev; a demonstração desta reunião roda localmente com dados fictícios.')

    three('Perfil de uso','Seu trabalho define o que aparece.','O médico escolhe os módulos que fazem sentido para sua rotina.',[
        ('CONSULTAS','Atendimento clínico','Produção por local e convênio, honorários e recebimentos de consultas.'),
        ('LAUDOS','Produção radiológica','Dashboard, quantidade por tipo de exame e tarifa por instituição. Não exige consultas.'),
        ('AMBOS','Um perfil, dois módulos','Alterne Consultas e Laudos. Cada módulo mantém produção e pagamentos separados.')],
        'A escolha fica salva. Pode mudar depois sem apagar dados. Nenhum radiologista precisa cadastrar convênios.',
        'Mostrar Meu perfil de uso e selecionar Somente laudos. Recarregar a página para demonstrar persistência. A preferência é de experiência, não autorização clínica ou assinatura.',highlight=1)

    s=base('Laudos radiológicos','Da instituição ao dashboard, sem planilhas.','Captura real do módulo de Laudos · dados fictícios de outubro de 2026.')
    box(s,LEFT-.06,2.24,7.72,4.62,WHITE,line=LINE,round_=.03)
    screenshot(s,ROOT/'web/test-results/radiology-dashboard-desktop.png',LEFT,2.3,7.6,4.5)
    for i,(title,body) in enumerate([('Tarifa por instituição','O mesmo exame pode ter valores diferentes em cada clínica.'),('Registro por quantidade','Data, instituição, tipo de exame e total de laudos.'),('Recebimento próprio','Pagamento de laudos não reduz saldo de Consultas.')]):
        y=2.55+i*1.45;text(s,f'{i+1}',8.65,y,.5,.5,24,GREEN,False,DISPLAY,after=0)
        text(s,title,9.2,y+.05,3.6,.45,19,INK,False,DISPLAY,after=0);text(s,body,9.2,y+.55,3.6,.8,15,MUTED,after=0)
    notes(s,'Seed: 75 laudos, 5 sem tarifa, R$ 1.520,00 conhecidos, R$ 300,00 recebidos, R$ 1.220,00 previstos. Tipos de exame personalizáveis. Valores conhecidos são preservados no registro. Apenas controle financeiro: não armazena pacientes, imagens/DICOM ou texto de laudo; não emite laudos e não é PACS/RIS.')

    s=base('Proposta comercial · a validar','Consultas, Laudos ou ambos. Você escolhe.','No MVP todos os recursos estão liberados. Cobrança e limites por plano não foram implementados.')
    card(s,.55,2.6,5.98,'Free · R$ 0','Proposta: um local, mês atual e controle básico no módulo escolhido.','PARA CONHECER')
    card(s,6.75,2.6,5.98,f'Pro · {brl(PRO_PRICE)}/mês','Por médico: Consultas, Laudos ou ambos. Múltiplos locais, tipos de exame e histórico com dados registrados.','PARA ACOMPANHAR A ROTINA',dark=True)
    text(s,'Preços sugeridos para discussão, sem oferta ativa. Integração hospitalar não está automaticamente incluída.',LEFT,5.95,12.2,.55,15,MUTED)
    notes(s,'Não fixar preço com o primeiro contato antes de validar utilidade. Valores são hipóteses próprias, não pesquisa de mercado ou contrato aprovado. Recursos avançados de importação são separados da produção pessoal.')

    three('Conversa com o médico','Vamos testar com a rotina de quem vai usar.','Primeiro, entender o dia a dia. Depois, demonstrar com um exemplo simples.',[
        ('01 / ENTENDER','Como você atende?','Um local ou vários? Faz sentido registrar o total ao final do dia?'),
        ('02 / DEMONSTRAR','Uma rotina completa','Registrar consultas → acompanhar produção → informar recebimento.'),
        ('03 / VALIDAR','O que faltou?','Foi simples? O saldo ajudou? O que faria você continuar usando?')],
        'Piloto assistido proposto: 5–10 médicos, 30 dias, após concluir as pendências operacionais.',
        'Demonstre com dados fictícios agora. Auth, API e RLS reais já foram validados tecnicamente. Uso pessoal real aguarda homologação de e-mails, termos/privacidade, backup/restauração, suporte, contratação e PWA físico. Integração hospitalar exige autorização própria e descoberta HML.')

    s=base('Piloto · convite condicionado','30 dias para aprender com a rotina real.','Endereço publicado: honormed.emersongsguimaraes.workers.dev')
    card(s,.55,2.55,3.95,'5–10 médicos','Acompanhamento assistido, com Consultas, Laudos ou ambos.','PARTICIPANTES')
    card(s,4.68,2.55,3.95,'30 dias','Observar uso recorrente e dificuldade para registrar a produção.','PERÍODO')
    card(s,8.81,2.55,3.95,'Medir e ajustar','Tempo de suporte, falhas, entendimento do saldo e intenção de pagar.','APRENDIZADO')
    text(s,'Convite ao uso real após testar e-mails e concluir termos, privacidade e preparação operacional.',LEFT,5.93,12.2,.7,15,MUTED)
    notes(s,'O endereço público já funciona e Auth/API reais foram validados com contas técnicas removidas. Antes de convidar médicos, testar entrega de confirmação e recuperação/troca de senha com a conta do usuário; preparar termos, privacidade, suporte, backup/restauração e contratação/cobrança externa. Domínio próprio e PWA em dispositivo físico continuam pendentes; o endereço workers.dev serve ao piloto. Não anunciar trial ou cobrança ativa. Medir semanalmente uso recorrente, tempo de suporte, falhas, entendimento do saldo e intenção de pagar.')

    s=base('Apêndice · situação atual','Demonstrável hoje. Validações antes de operar.','A atualização prioriza autonomia do médico e mantém integração como possibilidade futura.')
    card(s,.55,2.6,5.98,'Disponível no MVP','Quantidade por local/convênio; honorário pendente; produção; recebimento parcial; correções; filtros; cálculo SQL.','CONTROLE PESSOAL')
    card(s,6.75,2.6,5.98,'Antes do uso real','E-mails; termos/privacidade; backup e restauração; contratação/cobrança; PWA físico. Domínio próprio a definir.','PENDÊNCIAS DO PILOTO')
    text(s,'Piloto publicado · Auth/API reais testados · 27 testes SQL/RLS · 12 fluxos E2E.',LEFT,5.95,12.2,.5,15,GREEN,False,DISPLAY)
    notes(s,'Resultado em 16/10/2026. Auth/API reais e isolamento A/B foram validados no endereço publicado; contas técnicas removidas. Os testes locais usam PGlite. O SMTP está configurado, mas a entrega de confirmação e recuperação depende de teste do usuário. Faltam termos/privacidade, domínio próprio, backup/restauração, contratação/cobrança e PWA em dispositivo físico. Não há homologação hospitalar ou confirmação bancária.')

    three('Apêndice · viabilidade','Validar utilidade antes de fixar preços.','O valor está em autonomia, organização e clareza do próprio controle.',[
        ('USO REAL','Vale registrar?','Medir frequência, dificuldade e tempo para lançar o total do dia.'),
        ('PREÇO','Faz sentido pagar?',f'Testar a hipótese de {brl(PRO_PRICE)}/mês sem prometer benefícios comprovados.'),
        ('SUSTENTAÇÃO','Quanto custa servir?','Estimar hospedagem, suporte, aquisição, tributos e manutenção.')],
        f'100 assinantes × {brl(PRO_PRICE)} = {brl(PRO_PRICE*100)}/mês de receita bruta. Exemplo, não projeção ou lucro.',
        'Não há base suficiente para valorar venda integral do software. A autonomia pessoal é distinta da integração hospitalar, que tem custos e requisitos próprios.')

    s=base('Apêndice · limites da informação','Seu registro é uma referência pessoal.','As fontes devem continuar separadas e identificadas.')
    card(s,.55,2.6,5.98,'Informado por você','Produção e recebimentos registrados pelo médico. Sem nome/CPF de paciente. Pode corrigir os próprios lançamentos.','FLUXO PRINCIPAL')
    card(s,6.75,2.6,5.98,'Visão importada separada','CSV/XLSX e regras avançadas em outra área. Os totais não são somados automaticamente ao controle pessoal.','SEM DUPLICAR PRODUÇÃO')
    text(s,'Base: plano, regras e registro de validação do projeto · versão de 16/10/2026.',LEFT,5.95,12.2,.5,15,MUTED)
    notes(s,'Nenhuma integração MV foi implementada ou consultada. Registros pessoais não confirmam faturamento, glosa ou pagamento oficial. A futura integração precisa de reconciliação explícita para evitar duplicidades. Consulte docs/REGRAS.md e GUIA-APRESENTADOR.md.')

    target=OUT/f'{BRAND}_Apresentacao_Medicos.pptx'
    prs.core_properties.title=f'{BRAND} — controle pessoal do médico'
    prs.core_properties.subject='Produção por quantidade e recebimentos informados pelo médico'
    prs.core_properties.author=BRAND
    prs.save(target)
    print(f'PPTX atualizado: {target} ({len(prs.slides)} slides)')

if __name__=='__main__':main()
