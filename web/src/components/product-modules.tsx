"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/personal-control";
import PersonalControl from "@/components/personal-control";
import RadiologyControl from "@/components/radiology-control";
import PlansPreview from "@/components/plans-preview";
import { mutate, type Dataset } from "@/lib/data";
import { Brand } from "@/components/brand";
import Link from "next/link";
import FirstUse from "@/components/first-use";
type Profile = "consultas" | "laudos" | "ambos";
export default function ProductModules(props: {
  data: Dataset;
  onRefresh: () => Promise<void>;
  dark: boolean;
  onTheme: () => void;
  onLogout: () => Promise<void>;
  startInSettings?: boolean;
  initialModule?: "consultas" | "laudos";
}) {
  const { data } = props,
    saved = data.preferences[0],
    profile = saved?.perfil_uso || "consultas";
  const [selected, setSelected] = useState<"consultas" | "laudos">(
      props.initialModule || "consultas",
    ),
    [edit, setEdit] = useState(
      !saved && !data.production.length && !data.radiologyProduction.length,
    ),
    [draft, setDraft] = useState<Profile>(profile),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [plans, setPlans] = useState(false);
  const active = profile === "ambos" ? selected : profile;
  async function save() {
    setBusy(true);
    setError("");
    try {
      await mutate(
        "preferencias_produto",
        saved ? "update" : "insert",
        { perfil_uso: draft },
        saved?.id,
      );
      await props.onRefresh();
      if (draft === "laudos") setSelected("laudos");
      setEdit(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Não foi possível salvar.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <div className="module-toolbar">
        <div className="module-identity">
          <span className="mobile-brand">
            <Brand compact />
          </span>
          {profile === "ambos" ? (
            <div className="seg" aria-label="Módulo de trabalho">
              <button
                aria-pressed={active === "consultas"}
                onClick={() => {
                  setSelected("consultas");
                  setPlans(false);
                }}
              >
                Consultas
              </button>
              <button
                aria-pressed={active === "laudos"}
                onClick={() => {
                  setSelected("laudos");
                  setPlans(false);
                }}
              >
                Laudos
              </button>
            </div>
          ) : (
            <strong>
              {profile === "laudos" ? "Laudos radiológicos" : "Consultas"}
            </strong>
          )}
        </div>
        <div className="header-actions">
          <Link className="text-button" href="/suporte">Feedback</Link>
          <Link
            className="button register-shortcut"
            href={`/registrar?modulo=${active}`}
          >
            Registrar
          </Link>
          <Button
            variant="ghost"
            onClick={() => {
              setDraft(profile);
              setError("");
              setEdit(true);
            }}
          >
            Meu perfil de uso
          </Button>
          {process.env.NEXT_PUBLIC_PLANS_PREVIEW !== "false" && (
            <Button variant="outline" onClick={() => setPlans(!plans)}>
              {plans ? "Voltar ao meu controle" : "Planos"}
            </Button>
          )}
        </div>
      </div>
      {!plans && <FirstUse data={data} module={active} />}
      {plans ? (
        <main className="main">
          <PlansPreview />
        </main>
      ) : active === "laudos" ? (
        <RadiologyControl {...props} />
      ) : (
        <PersonalControl {...props} />
      )}
      {edit && (
        <Dialog
          title="Como você trabalha?"
          busy={busy}
          onClose={() => setEdit(false)}
        >
          <form
            onSubmit={(e) => {
              e.preventDefault();
              save();
            }}
          >
            <p className="muted">
              Escolha o que quer acompanhar. Você pode mudar depois sem apagar
              registros.
            </p>
            <label>
              Meu perfil de uso
              <select
                aria-label="Meu perfil de uso"
                value={draft}
                onChange={(e) => setDraft(e.target.value as Profile)}
              >
                <option value="consultas">Somente consultas</option>
                <option value="laudos">Somente laudos radiológicos</option>
                <option value="ambos">Consultas e laudos</option>
              </select>
            </label>
            <p className="footnote">
              No perfil Laudos, você começa direto na produção radiológica, sem
              cadastrar consultas ou convênios.
            </p>
            {error && (
              <p role="alert" className="error">
                {error}
              </p>
            )}
            <Button disabled={busy}>Salvar perfil de uso</Button>
          </form>
        </Dialog>
      )}
    </>
  );
}
