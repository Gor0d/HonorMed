import type { Metadata } from "next";
import { PublicInfoShell } from "@/components/public-info-shell";
import { CONTROLLER_NAME, SUPPORT_EMAIL } from "@/lib/legal";

export const metadata: Metadata = {
  title: "Rascunho dos termos de uso · HonorMed",
  description: "Texto em revisão para o site e a extensão Registro rápido do HonorMed.",
  robots: { index: false, follow: false },
};

export default function TermsPage() {
  return (
    <PublicInfoShell>
      <div className="public-info-heading">
        <span className="eyebrow">PARA SUA REVISÃO</span>
        <h1>Termos de uso</h1>
        <p>Condições propostas para o site HonorMed e a extensão Registro rápido.</p>
      </div>
      <article className="public-info-card privacy-copy">
        <p className="legal-draft-note"><strong>Rascunho não vigente.</strong> Este texto precisa ser revisto pelo responsável antes da publicação e da definição de como será apresentado aos usuários.</p>
        <section>
          <h2>1. Responsável e contato</h2>
          <p>O HonorMed é de responsabilidade de {CONTROLLER_NAME}. Dúvidas sobre o serviço podem ser enviadas para <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>.</p>
        </section>
        <section>
          <h2>2. Finalidade do serviço</h2>
          <p>O HonorMed ajuda o médico a registrar, por quantidade, sua produção pessoal de Consultas e Laudos, configurar valores esperados e conferir recebimentos que ele próprio informa. A extensão Registro rápido oferece uma forma adicional de fazer lançamentos na mesma conta. O serviço não consulta automaticamente sistemas hospitalares nem confirma faturamento, glosa ou pagamento por terceiros.</p>
        </section>
        <section>
          <h2>3. Conta e acesso</h2>
          <p>O acesso depende de uma conta individual e de um perfil de uso. O usuário deve manter suas credenciais sob sigilo, conferir os lançamentos antes de salvá-los e sair da conta em computadores compartilhados. A opção “Manter conectado” da extensão é destinada a computadores de uso exclusivo; seus limites de sessão estão descritos na política de privacidade.</p>
        </section>
        <section>
          <h2>4. Dados inseridos pelo usuário</h2>
          <p>O usuário é responsável pela exatidão das quantidades, datas, locais, convênios, tipos de exame, honorários e recebimentos informados. Não deve inserir nome, CPF, iniciais, imagens, texto clínico ou outros dados que identifiquem pacientes. O HonorMed não substitui prontuário, sistema de faturamento, demonstrativo oficial ou orientação contábil e financeira individual.</p>
        </section>
        <section>
          <h2>5. Disponibilidade e piloto</h2>
          <p>O serviço está em piloto assistido e pode receber correções e mudanças durante a avaliação. Ainda não há contratação, cobrança, período de teste comercial ou acordo de nível de serviço ativos. Condições comerciais futuras deverão ser apresentadas separadamente antes de qualquer contratação.</p>
        </section>
        <section>
          <h2>6. Privacidade e solicitações</h2>
          <p>A <a href="/privacidade">política de privacidade</a> explica quais dados são tratados, para que são usados e como solicitar acesso, correção ou exclusão. Para pedir suporte ou encerramento da conta, escreva para <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>. A confirmação da identidade pode ser necessária antes de uma alteração ou exclusão.</p>
        </section>
        <section>
          <h2>7. Alterações</h2>
          <p>Quando estes termos forem aprovados e publicados, alterações relevantes deverão ser comunicadas aos usuários de forma adequada. A versão e a data de vigência deverão aparecer nesta página.</p>
        </section>
      </article>
    </PublicInfoShell>
  );
}
