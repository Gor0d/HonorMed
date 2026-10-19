import type { Metadata } from "next";
import { PublicInfoShell } from "@/components/public-info-shell";
import { CONTROLLER_NAME, PRIVACY_UPDATED_AT, SUPPORT_EMAIL } from "@/lib/legal";

export const metadata: Metadata = {
  title: "Política de privacidade · HonorMed",
  description: "Como o HonorMed e a extensão Registro rápido tratam os dados do médico.",
  robots: { index: false, follow: false },
};

export default function PrivacyPage() {
  return (
    <PublicInfoShell>
      <div className="public-info-heading">
        <span className="eyebrow">SEUS DADOS, COM CLAREZA</span>
        <h1>Política de privacidade</h1>
        <p>Esta política explica o tratamento de dados no site HonorMed e na extensão Registro rápido para Chrome e navegadores Chromium.</p>
        <small>Atualizada em {PRIVACY_UPDATED_AT}</small>
      </div>
      <article className="public-info-card privacy-copy">
        <p className="legal-draft-note"><strong>Rascunho para revisão do responsável.</strong> Esta versão ainda não foi aprovada nem publicada como política vigente.</p>
        <section>
          <h2>1. Responsável e contato</h2>
          <p>O responsável pelo HonorMed é {CONTROLLER_NAME}. Para suporte, dúvidas sobre privacidade ou pedidos relativos aos seus dados, escreva para <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>.</p>
        </section>
        <section>
          <h2>2. Dados tratados</h2>
          <p>O site trata e-mail, nome, CRM e UF, preferência de módulos, dados de autenticação e os registros que você informa para controlar sua produção e seus recebimentos. Esses registros podem incluir data, quantidade, local, convênio ou tipo de exame, honorário configurado, valor previsto e pagamento informado. Na importação de planilhas, também pode haver código de atendimento. O controle pessoal não pede nome, CPF, iniciais, imagem ou texto clínico de pacientes.</p>
          <p>A extensão recebe o e-mail e a senha digitados para autenticar sua conta pelo Supabase Auth. Ela consulta seu perfil e as opções de registro, envia os lançamentos que você confirma e exibe o resultado calculado pelo HonorMed. Tokens de sessão, identificador da conta, horário da última interação e identificadores e quantidade do último registro ficam no armazenamento do navegador para manter a sessão e permitir “Repetir último”. A senha não é guardada como campo próprio da extensão.</p>
          <p>Os fornecedores de hospedagem, autenticação e e-mail podem tratar dados técnicos necessários à operação e segurança, como endereço IP, horário e informações do navegador. O site também guarda preferências locais de interface no navegador.</p>
        </section>
        <section>
          <h2>3. Para que usamos os dados</h2>
          <p>As métricas opcionais do piloto começam desativadas. Se você concordar em Ajustes, contamos por dia e resumimos por semana os dias com registro, o número de lançamentos e erros de gravação. Não coletamos valores, quantidades atendidas, instituições, convênios, tipos de exame ou texto livre nessas métricas. Elas ficam vinculadas à sua conta para permitir isolamento, exportação e exclusão. Ao desativar, os contadores ativos são apagados; isso não afeta sua produção ou os recursos disponíveis. A funcionalidade ainda depende de publicação da migration correspondente.</p>
          <p>Usamos esses dados para criar e proteger sua conta, registrar Consultas e Laudos por quantidade, apresentar previsões com os valores que você configurou, permitir a conferência dos recebimentos e responder a pedidos de suporte. Os registros pessoais são informações fornecidas por você; não representam confirmação de faturamento ou pagamento pelo hospital.</p>
        </section>
        <section>
          <h2>4. Extensão e permissões</h2>
          <p>A extensão usa a permissão <code>storage</code> para sua sessão e os metadados mínimos do último registro. O acesso de rede é limitado à origem HTTPS do Supabase configurada no pacote, para autenticação e leitura ou gravação dos seus próprios dados. Ela não lê páginas visitadas, histórico, abas, cookies nem conteúdo de sites de hospitais. Não há anúncios nem venda de dados.</p>
          <p>Sem “Manter conectado”, a sessão da extensão fica no armazenamento de sessão do navegador e é encerrada ao fechar o navegador ou após 30 minutos sem uso. Com a opção marcada, ela usa armazenamento local e bloqueia o acesso após 12 horas sem uso. O limite de inatividade é verificado ao abrir o popup; o fechamento do popup, por si só, não revoga imediatamente o token no servidor.</p>
        </section>
        <section>
          <h2>5. Fornecedores e compartilhamento</h2>
          <p>O HonorMed usa Supabase para autenticação e banco de dados, Cloudflare para servir o site, Resend para envio de e-mails de conta e Google Fonts para carregar fontes da interface. Esses fornecedores tratam dados na medida necessária para prestar esses serviços. O banco de dados principal do piloto está na região de São Paulo; etapas técnicas de outros fornecedores podem ocorrer fora do Brasil. Não compartilhamos registros para publicidade personalizada ou corretores de dados.</p>
          <p>O uso de informações recebidas das APIs do navegador observa a <a href="https://developer.chrome.com/docs/webstore/program-policies/limited-use" target="_blank" rel="noreferrer">Política de Dados do Usuário da Chrome Web Store, inclusive os requisitos de Uso Limitado</a>.</p>
        </section>
        <section>
          <h2>6. Conservação e segurança</h2>
          <p>Os dados da conta e os registros são mantidos enquanto a conta estiver ativa. Em Ajustes, a funcionalidade de exportação e exclusão permite baixar os registros de aplicação e solicitar a remoção da própria conta mediante confirmação explícita. Essa funcionalidade está em preparação e depende de publicação e aplicação da migration correspondente. A exclusão remove os dados ativos e o acesso na mesma operação; cópias exportadas, backups e registros técnicos dos fornecedores não são apagados imediatamente. Os prazos de retenção operacional e o procedimento de restauração ainda precisam ser definidos e testados antes da ampliação comercial.</p>
          <p>As comunicações com o serviço usam HTTPS. O banco aplica políticas de acesso por médico, e a extensão não contém chave administrativa. Nenhum sistema elimina todos os riscos; informe ao contato acima qualquer suspeita de acesso indevido.</p>
        </section>
        <section>
          <h2>7. Seus direitos</h2>
          <p>Você pode solicitar confirmação e acesso aos seus dados, correção, informações sobre compartilhamento, portabilidade quando aplicável, oposição ou eliminação nas hipóteses previstas na LGPD. Envie o pedido para <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>; poderemos confirmar sua identidade antes de tratar a solicitação. Também é possível apresentar uma reclamação à <a href="https://www.gov.br/anpd/pt-br/assuntos/titular-de-dados/direito-dos-titulares" target="_blank" rel="noreferrer">Autoridade Nacional de Proteção de Dados</a>.</p>
        </section>
        <section>
          <h2>8. Mudanças nesta política</h2>
          <p>Se o funcionamento do HonorMed ou da extensão mudar de forma relevante para o tratamento de dados, atualizaremos esta página e a data acima. Alterações nas práticas da extensão também serão informadas no contexto da Chrome Web Store.</p>
        </section>
      </article>
    </PublicInfoShell>
  );
}
