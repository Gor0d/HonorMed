"use client";

import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import Link from "next/link";
import { Brand } from "@/components/brand";
import { Button } from "@/components/ui/button";
import { fetchData, mutate, supabase, type Dataset } from "@/lib/data";
import { today } from "@/lib/date";
import { money } from "@/lib/utils";

type Module = "consultas" | "laudos";
type Saved = { id: string; module: Module; quantity: number; value?: number | string | null };
const savedLabel = ({ quantity, module }: Saved) =>
  `${quantity} ${module === "consultas" ? quantity === 1 ? "consulta registrada" : "consultas registradas" : quantity === 1 ? "laudo registrado" : "laudos registrados"}`;

export default function QuickRegister({ requestedModule }: { requestedModule: Module }) {
  const [ready, setReady] = useState(false);
  const [signed, setSigned] = useState(false);
  const [data, setData] = useState<Dataset | null>(null);
  const [selected, setSelected] = useState<Module>(requestedModule);
  const [date, setDate] = useState("");
  const [local, setLocal] = useState("");
  const [convenio, setConvenio] = useState("");
  const [tipo, setTipo] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [repeatPending, setRepeatPending] = useState(false);
  const [undoPending, setUndoPending] = useState(false);
  const [saved, setSaved] = useState<Saved | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const quantityRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setDate(today());
    const theme = localStorage.getItem("repasse-theme");
    if (theme) document.documentElement.dataset.theme = theme;
    if (!supabase) {
      setSigned(sessionStorage.getItem("repasse-demo") === "yes");
      setReady(true);
      return;
    }
    let mounted = true;
    supabase.auth.getSession().then(({ data: auth }) => {
      if (mounted) {
        setSigned(!!auth.session);
        setReady(true);
      }
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (mounted) setSigned(!!session);
    });
    return () => { mounted = false; subscription.unsubscribe(); };
  }, []);

  useEffect(() => {
    if (!signed) return;
    let mounted = true;
    fetchData().then((fresh) => {
      if (mounted) setData(fresh);
    }).catch((cause) => {
      if (mounted) setError(cause instanceof Error ? cause.message : "Não foi possível carregar seus dados.");
    });
    return () => { mounted = false; };
  }, [signed]);

  useEffect(() => {
    if (data) quantityRef.current?.focus();
  }, [data, selected]);

  useEffect(() => {
    if (!data) return;
    setLocal((value) => value || data.locations[0]?.id || "");
    setConvenio((value) => value || data.convenios[0]?.id || "");
    setTipo((value) => value || data.radiologyTypes[0]?.id || "");
  }, [data]);

  const profile = data?.preferences[0]?.perfil_uso;
  const active: Module = profile === "ambos" ? selected : profile === "laudos" ? "laudos" : "consultas";
  const settingsHref = `/?area=ajustes&modulo=${active}`;
  const max = active === "laudos" ? 10000 : 1000;
  const missing = !data?.locations.length || (active === "consultas" ? !data.convenios.length : !data.radiologyTypes.length);
  const last = data && [
    ...data.production.map((record) => ({ module: "consultas" as const, record })),
    ...data.radiologyProduction.map((record) => ({ module: "laudos" as const, record })),
  ].filter((item) => profile === "ambos" || item.module === profile)
    .sort((a, b) => b.record.created_at.localeCompare(a.record.created_at))[0];

  function clear() {
    setDate(today());
    setLocal(data?.locations[0]?.id || "");
    setConvenio(data?.convenios[0]?.id || "");
    setTipo(data?.radiologyTypes[0]?.id || "");
    setQuantity("1");
    setRepeatPending(false);
    setError("");
    setNotice("");
    quantityRef.current?.focus();
  }

  function repeatLast() {
    if (!last || !data) return;
    const row = last.record;
    const lastConvention = "convenio_id" in row ? row.convenio_id : "";
    const lastType = "tipo_id" in row ? row.tipo_id : "";
    if (!data.locations.some((item) => item.id === row.local_id)) {
      setError("Esta opção não está mais disponível. Atualize a lista e selecione outra.");
      return;
    }
    if (last.module === "consultas" && !data.convenios.some((item) => item.id === lastConvention)) {
      setError("Este convênio não está mais disponível. Selecione outro.");
      return;
    }
    if (last.module === "laudos" && !data.radiologyTypes.some((item) => item.id === lastType)) {
      setError("Este tipo de exame não está mais disponível. Selecione outro.");
      return;
    }
    setSelected(last.module);
    setLocal(row.local_id);
    if (last.module === "consultas") setConvenio(lastConvention);
    else setTipo(lastType);
    setQuantity(String(row.quantidade));
    setRepeatPending(true);
    setNotice("");
    setError("");
    quantityRef.current?.focus();
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!data || !profile || missing || busy) return;
    const count = Number(quantity);
    if (!Number.isInteger(count) || count < 1 || count > max) {
      setError(`Informe uma quantidade inteira de 1 a ${max.toLocaleString("pt-BR")}.`);
      return;
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !local || (active === "consultas" ? !convenio : !tipo)) {
      setError("Confira a data e as opções antes de salvar.");
      return;
    }
    const id = crypto.randomUUID();
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await mutate(active === "consultas" ? "producoes_pessoais" : "laudos_producao", "insert", {
        id, local_id: local, data_producao: date, quantidade: count,
        ...(active === "consultas" ? { convenio_id: convenio } : { tipo_id: tipo }),
      });
    } catch {
      setError("Não foi possível salvar. Confira a conexão e as opções; o formulário foi mantido.");
      setBusy(false);
      return;
    }
    setRepeatPending(false);
    setSaved({ id, module: active, quantity: count });
    setQuantity("");
    quantityRef.current?.focus();
    try {
      const fresh = await fetchData();
      setData(fresh);
      const record = active === "consultas"
        ? fresh.production.find((item) => item.id === id)
        : fresh.radiologyProduction.find((item) => item.id === id);
      if (record) {
        setSaved({ id, module: active, quantity: record.quantidade, value: record.valor_previsto });
      } else {
        setNotice("Registro salvo. Abra o HonorMed para conferir o valor.");
      }
    } catch {
      setNotice("Registro salvo. Não foi possível consultar o valor agora; abra o HonorMed para conferir.");
    } finally {
      setBusy(false);
    }
  }

  async function undo() {
    if (!saved || busy) return;
    setBusy(true);
    setError("");
    try {
      await mutate(saved.module === "consultas" ? "producoes_pessoais" : "laudos_producao", "delete", {}, saved.id);
      setSaved(null);
      setUndoPending(false);
      setNotice("Último lançamento desfeito.");
    } catch {
      setError("Não foi possível desfazer o lançamento. Confira no HonorMed antes de tentar novamente.");
      setBusy(false);
      return;
    }
    try {
      setData(await fetchData());
    } catch {
      setNotice("Lançamento desfeito. Atualize o HonorMed para conferir seus registros.");
    } finally {
      setBusy(false);
    }
  }

  function onKeyDown(event: KeyboardEvent<HTMLFormElement>) {
    if (event.key === "Escape") {
      event.preventDefault();
      clear();
    }
  }

  return (
    <main className="quick-page">
      <header className="quick-header">
        <Brand />
        <Link href="/" className="quick-link">Abrir HonorMed →</Link>
      </header>
      <section className="quick-card card">
        <span className="eyebrow">SEU CONTROLE PESSOAL</span>
        <h1>Registro rápido</h1>
        <p className="muted">Anote somente a quantidade. Sem dados de pacientes.</p>
        {!ready ? <p role="status">Verificando sua sessão…</p> : !signed ? (
          <div className="quick-empty">
            <p>Entre no HonorMed para registrar sua produção.</p>
            <Link href="/" className="quick-link">Abrir login do HonorMed →</Link>
          </div>
        ) : !data ? <p role="status">Carregando suas opções…</p> : !profile ? (
          <div className="quick-empty">
            <p>Escolha seu perfil de uso no HonorMed antes do primeiro registro.</p>
            <Link href="/" className="quick-link">Escolher perfil no HonorMed →</Link>
          </div>
        ) : (
          <>
            {profile === "ambos" && (
              <div className="quick-tabs" role="group" aria-label="Módulo de registro">
                <button type="button" aria-pressed={active === "consultas"} onClick={() => { setSelected("consultas"); setRepeatPending(false); }}>Consultas</button>
                <button type="button" aria-pressed={active === "laudos"} onClick={() => { setSelected("laudos"); setRepeatPending(false); }}>Laudos</button>
              </div>
            )}
            <h2>{active === "consultas" ? "Registrar consultas" : "Registrar laudos"}</h2>
            {missing ? (
              <div className="quick-empty">
                <p>Cadastre {active === "consultas" ? "um local e um convênio" : "uma instituição e um tipo de exame"} em Ajustes antes de registrar aqui.</p>
                <Link href={settingsHref} className="quick-link">Abrir Ajustes no HonorMed →</Link>
              </div>
            ) : (
              <form onSubmit={submit} onKeyDown={onKeyDown}>
                <div className="quick-fields">
                  <label>Data<input aria-label="Data da produção" type="date" required value={date} onChange={(event) => setDate(event.target.value)} /></label>
                  <label>{active === "consultas" ? "Local de atendimento" : "Instituição"}
                    <select aria-label={active === "consultas" ? "Local de atendimento" : "Instituição"} required value={local} onChange={(event) => setLocal(event.target.value)}>
                      <option value="">Selecione</option>
                      {data.locations.map((item) => <option key={item.id} value={item.id}>{item.nome}</option>)}
                    </select>
                  </label>
                  {active === "consultas" ? (
                    <label>Convênio<select aria-label="Convênio" required value={convenio} onChange={(event) => setConvenio(event.target.value)}>
                      <option value="">Selecione</option>
                      {data.convenios.map((item) => <option key={item.id} value={item.id}>{item.nome}</option>)}
                    </select></label>
                  ) : (
                    <label>Tipo de exame<select aria-label="Tipo de exame" required value={tipo} onChange={(event) => setTipo(event.target.value)}>
                      <option value="">Selecione</option>
                      {data.radiologyTypes.map((item) => <option key={item.id} value={item.id}>{item.nome}</option>)}
                    </select></label>
                  )}
                  <label>Quantidade de {active === "consultas" ? "consultas" : "laudos"}
                    <span className="quantity-stepper">
                      <button type="button" aria-label="Diminuir quantidade" onClick={() => setQuantity(String(Math.max(1, Number(quantity || 1) - 1)))}>−</button>
                      <input ref={quantityRef} aria-label="Quantidade" type="number" inputMode="numeric" min={1} max={max} step={1} required value={quantity} onChange={(event) => setQuantity(event.target.value)} />
                      <button type="button" aria-label="Aumentar quantidade" onClick={() => setQuantity(String(Math.min(max, Number(quantity || 0) + 1)))}>+</button>
                    </span>
                  </label>
                </div>
                {repeatPending && <p className="quick-confirm" role="status">Confira módulo, local, data e quantidade. Clique em “Confirmar repetição e salvar” para criar outro registro.</p>}
                <div className="quick-actions">
                  <Button disabled={busy}>{repeatPending ? "Confirmar repetição e salvar" : "Salvar registro"}</Button>
                  <Button type="button" variant="outline" disabled={!last || busy} onClick={repeatLast}>Repetir último</Button>
                  <Button type="button" variant="ghost" disabled={busy} onClick={clear}>Limpar</Button>
                </div>
              </form>
            )}
            {saved && (
              <div className="quick-result" role="status">
                <strong>{savedLabel(saved)}</strong>
                <span>{saved.value === undefined ? "Valor ainda não consultado" : saved.value === null ? "Valor pendente" : `Valor previsto: ${money(Number(saved.value))}`}</span>
                <small>Informado por você · sem confirmação hospitalar.</small>
                {!undoPending ? <Button type="button" variant="outline" onClick={() => setUndoPending(true)}>Desfazer lançamento</Button> : (
                  <div className="quick-actions"><Button type="button" variant="outline" disabled={busy} onClick={undo}>Confirmar desfazer</Button><Button type="button" variant="ghost" onClick={() => setUndoPending(false)}>Cancelar</Button></div>
                )}
              </div>
            )}
          </>
        )}
        {error && <p className="message error" role="alert">{error}</p>}
        {notice && <p className="message" role="status">{notice}</p>}
      </section>
      <p className="quick-footer">Seu registro pessoal não confirma produção ou pagamento pelo hospital.</p>
    </main>
  );
}
