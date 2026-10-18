"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, Keyboard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EXTENSION_STORE_URL } from "@/lib/brand";

const DISMISSED_KEY = "honormed-extension-banner-dismissed";

// Desktop-only invitation (hidden by CSS below 768px). The dismissal is a
// per-browser convenience; storage failures simply keep the banner visible.
export function ExtensionBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      setVisible(localStorage.getItem(DISMISSED_KEY) !== "yes");
    } catch {
      setVisible(true);
    }
  }, []);

  function dismiss() {
    setVisible(false);
    try {
      localStorage.setItem(DISMISSED_KEY, "yes");
    } catch {
      // Hidden for this visit only.
    }
  }

  if (!visible) return null;
  return (
    <section className="extension-banner" aria-labelledby="extension-banner-title">
      <span className="extension-banner-icon" aria-hidden="true">
        <Keyboard size={24} />
      </span>
      <div className="extension-banner-copy">
        <span className="eyebrow">REGISTRO RÁPIDO NO COMPUTADOR</span>
        <h2 id="extension-banner-title">Registre na hora, enquanto atende</h2>
        <p>
          {EXTENSION_STORE_URL
            ? "Instale a extensão para Chrome e Cent Browser e lance Consultas ou Laudos por quantidade sem sair da tela de trabalho."
            : "A extensão para Chrome e Cent Browser vai permitir lançar Consultas ou Laudos por quantidade sem sair da tela de trabalho. Download pela loja em breve. Por enquanto, use o registro rápido no site."}
        </p>
      </div>
      <div className="extension-banner-actions">
        <Button asChild className="extension-banner-action">
          {EXTENSION_STORE_URL ? (
            <a href={EXTENSION_STORE_URL} target="_blank" rel="noopener noreferrer">
              Instalar extensão <ArrowUpRight size={17} aria-hidden="true" />
            </a>
          ) : (
            <Link href="/registrar">
              Abrir registro rápido <ArrowUpRight size={17} aria-hidden="true" />
            </Link>
          )}
        </Button>
        <Button type="button" variant="ghost" onClick={dismiss}>
          Agora não
        </Button>
      </div>
    </section>
  );
}
