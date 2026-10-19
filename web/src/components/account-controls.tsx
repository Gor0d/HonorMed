"use client";
import { useState } from "react";
import PilotMetricsControls from "@/components/pilot-metrics";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/personal-control";
import {
  accountCsv,
  deleteOwnAccount,
  exportOwnAccount,
} from "@/lib/account-data";

export default function AccountControls({
  onDeleted,
}: {
  onDeleted: () => Promise<void>;
}) {
  const [confirm, setConfirm] = useState(false),
    [phrase, setPhrase] = useState("");
  const [ack, setAck] = useState(false),
    [busy, setBusy] = useState(false);
  const [error, setError] = useState(""),
    [notice, setNotice] = useState("");
  async function download(format: "json" | "csv") {
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const data = await exportOwnAccount();
      const content =
        format === "json" ? JSON.stringify(data, null, 2) : accountCsv(data);
      const url = URL.createObjectURL(
        new Blob([content], {
          type:
            format === "json"
              ? "application/json;charset=utf-8"
              : "text/csv;charset=utf-8",
        }),
      );
      const link = document.createElement("a");
      link.href = url;
      link.download = `HonorMed-dados-${new Date().toISOString().slice(0, 10)}.${format}`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      setNotice(
        "Arquivo preparado. Guarde-o em um local seguro: contém seus dados pessoais e financeiros.",
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Falha na exportação.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <><PilotMetricsControls /><section className="card account-controls">
      <h2>Seus dados e sua conta</h2>
      <p className="muted caption">
        Exporte os dados dos dois módulos, configurações e registros importados.
        O JSON preserva a estrutura; o CSV organiza os campos por tabela.
      </p>
      <div className="header-actions">
        <Button
          variant="outline"
          disabled={busy}
          onClick={() => download("json")}
        >
          Exportar JSON
        </Button>
        <Button
          variant="outline"
          disabled={busy}
          onClick={() => download("csv")}
        >
          Exportar CSV
        </Button>
        <Button
          variant="outline"
          disabled={busy}
          onClick={() => {
            setConfirm(true);
            setPhrase("");
            setAck(false);
            setError("");
          }}
        >
          Excluir minha conta
        </Button>
      </div>
      {notice && <p role="status">{notice}</p>}
      {error && !confirm && (
        <p role="alert" className="error">
          {error}
        </p>
      )}
      {confirm && (
        <Dialog
          title="Excluir minha conta"
          busy={busy}
          onClose={() => setConfirm(false)}
        >
          <p>
            Esta ação apaga seu perfil, acesso, Consultas, Laudos, configurações
            e recebimentos. Não é possível desfazer. Exporte uma cópia antes se
            quiser guardá-la.
          </p>
          <p className="muted">
            Backups e registros técnicos dos fornecedores não são apagados
            imediatamente por esta operação. Consulte a política de privacidade.
          </p>
          <form
            onSubmit={async (event) => {
              event.preventDefault();
              if (phrase !== "EXCLUIR MINHA CONTA" || !ack || busy) return;
              setBusy(true);
              setError("");
              try {
                await deleteOwnAccount(phrase);
                // Clear client session even if the provider rejects logout for an identity
                // that was just deleted. No token can create a new FK-backed profile.
                try {
                  await onDeleted();
                } finally {
                  sessionStorage.removeItem("repasse-demo");
                  window.location.replace("/?conta=excluida");
                }
              } catch (e) {
                setError(
                  e instanceof Error
                    ? e.message
                    : "A conta não foi excluída. Tente novamente.",
                );
                setBusy(false);
              }
            }}
          >
            <label>
              Digite EXCLUIR MINHA CONTA
              <input
                autoComplete="off"
                value={phrase}
                onChange={(e) => setPhrase(e.target.value)}
                required
              />
            </label>
            <label className="account-ack">
              <input
                type="checkbox"
                checked={ack}
                onChange={(e) => setAck(e.target.checked)}
              />
              Entendo que a exclusão é definitiva.
            </label>
            {error && (
              <p role="alert" className="error">
                {error}
              </p>
            )}
            <div className="header-actions">
              <Button
                type="button"
                variant="outline"
                disabled={busy}
                onClick={() => setConfirm(false)}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={busy || !ack || phrase !== "EXCLUIR MINHA CONTA"}
              >
                {busy ? "Excluindo…" : "Excluir definitivamente"}
              </Button>
            </div>
          </form>
        </Dialog>
      )}
    </section></>
  );
}
