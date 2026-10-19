import Link from "next/link";
import { Brand } from "@/components/brand";
import { SUPPORT_EMAIL } from "@/lib/legal";

export function PublicInfoShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="public-info-page">
      <header className="public-info-header">
        <Link href="/" aria-label="HonorMed · página inicial"><Brand /></Link>
        <nav aria-label="Informações públicas">
          <Link href="/">Início</Link>
          <Link href="/privacidade">Privacidade</Link>
          <Link href="/suporte">Suporte</Link>
        </nav>
      </header>
      <main className="public-info-main">{children}</main>
      <footer className="public-info-footer">
        <span>HonorMed · seu controle pessoal.</span>
        <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>
      </footer>
    </div>
  );
}
