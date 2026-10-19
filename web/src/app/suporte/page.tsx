import type { Metadata } from "next";
import Link from "next/link";
import { PublicInfoShell } from "@/components/public-info-shell";
import { SUPPORT_EMAIL } from "@/lib/legal";
import Feedback from "@/components/feedback";

export const metadata: Metadata = {
  title: "Suporte · HonorMed",
  description: "Contato de suporte para o HonorMed e a extensão Registro rápido.",
};

export default function SupportPage() {
  return (
    <PublicInfoShell>
      <div className="public-info-heading">
        <span className="eyebrow">ESTAMOS AQUI PARA AJUDAR</span>
        <h1>Suporte HonorMed</h1>
        <p>Dúvidas sobre sua conta, Consultas, Laudos ou a extensão Registro rápido.</p>
      </div>
      <section className="public-info-card support-card">
        <Feedback />
        <h2>Fale com a gente</h2>
        <p>Envie sua dúvida para <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>. Descreva o que aconteceu e, se for útil, informe o navegador e a etapa em que ocorreu o problema.</p>
        <p>Não envie senha, token de acesso, dados de pacientes ou informações clínicas por e-mail.</p>
        <div className="public-info-links">
          <Link href="/">Voltar ao HonorMed</Link>
          <Link href="/privacidade">Ler a política de privacidade</Link>
        </div>
      </section>
    </PublicInfoShell>
  );
}
