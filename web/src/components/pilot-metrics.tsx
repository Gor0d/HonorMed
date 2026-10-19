"use client";
import { useEffect, useState } from "react";
import { pilotRpc, type PilotMetrics } from "@/lib/pilot-metrics";
import { Button } from "@/components/ui/button";
export default function PilotMetricsControls() {
  const [state, setState] = useState<PilotMetrics | null>(null),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  async function load() {
    try {
      setState((await pilotRpc("estado_metricas_piloto")) as PilotMetrics);
    } catch {
      setError("Não foi possível consultar as métricas do piloto.");
    }
  }
  useEffect(() => {
    void load();
  }, []);
  return (
    <section className="card pilot-metrics" aria-label="Métricas do piloto">
      <h2>Ajude a melhorar o piloto</h2>
      <p>
        Opcional: contar dias com registros, lançamentos por semana e erros de
        gravação. Sem valores, quantidades atendidas, locais, exames ou texto
        livre. Não afeta seus recursos.
      </p>
      <label className="account-ack">
        <input
          type="checkbox"
          checked={!!state?.ativo}
          disabled={!state || busy}
          onChange={async (event) => {
            const ativo = event.target.checked;
            setBusy(true);
            setError("");
            try {
              await pilotRpc("definir_metricas_piloto", ativo);
              await load();
            } catch {
              setError(
                "Não foi possível salvar sua escolha. Nenhuma alteração foi confirmada.",
              );
            } finally {
              setBusy(false);
            }
          }}
        />
        Quero contribuir com métricas de uso
      </label>
      <p className="muted">
        Desativado por padrão. Ao desativar, os contadores coletados da sua
        conta são apagados.
      </p>
      {error && <p role="alert">{error}</p>}
      {state?.ativo && (
        <>
          <Button variant="outline" onClick={() => void load()}>
            Atualizar meus contadores
          </Button>
          <ul>
            {state.semanas.map((week) => (
              <li key={week.semana}>
                Semana {week.semana}: {week.dias_com_registro} dias com registro
                · {week.registros} lançamentos · {week.erros} erros
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}
