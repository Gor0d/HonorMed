import App from "@/components/app";
import Link from "next/link";
export default function Page() {
  return (
    <>
      <div className="message" style={{ borderRadius: 0 }}>
        <Link href="/">← Voltar ao meu controle pessoal</Link>
        <span>Visão importada · valores separados do controle pessoal</span>
      </div>
      <App mode="imported" />
    </>
  );
}
