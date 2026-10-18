"use client";
import { useState, type FormEvent } from "react";
import {
  Activity,
  Home,
  List,
  Wallet,
  Settings,
  Plus,
  Moon,
  Sun,
  LogOut,
  Pencil,
  Trash2,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";
import { Dialog } from "@/components/personal-control";
import { Button } from "@/components/ui/button";
import { PRODUCT_NAME } from "@/lib/brand";
import { Brand } from "@/components/brand";
import { money } from "@/lib/utils";
import { today } from "@/lib/date";
import {
  mutate,
  supabase,
  type Dataset,
  type RadiologyProduction,
} from "@/lib/data";
const n = (v: unknown) => Number(v ?? 0);
const dateLabel = (s: string) => s.slice(0, 10).split("-").reverse().join("/");
const nav = [
  ["Dashboard", Home],
  ["Produção", List],
  ["Recebimentos", Wallet],
  ["Ajustes", Settings],
] as const;
type Receipt = Dataset["radiologyReceipts"][number];
type Editor =
  | { kind: "production"; record?: RadiologyProduction }
  | { kind: "receipt"; record?: Receipt };
type Deletion = {
  table: "laudos_producao" | "laudos_recebimentos";
  id: string;
};
export default function RadiologyControl({
  data,
  onRefresh,
  dark,
  onTheme,
  onLogout,
  startInSettings = false,
}: {
  data: Dataset;
  onRefresh: () => Promise<void>;
  dark: boolean;
  onTheme: () => void;
  onLogout: () => Promise<void>;
  startInSettings?: boolean;
}) {
  const [page, setPage] = useState(startInSettings ? "Ajustes" : "Dashboard"),
    [month, setMonth] = useState(supabase ? today().slice(0, 7) : "2026-10"),
    [editor, setEditor] = useState<Editor | null>(null),
    [deletion, setDeletion] = useState<Deletion | null>(null),
    [undo, setUndo] = useState<Deletion | null>(null),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [notice, setNotice] = useState("");
  const [localFilter, setLocalFilter] = useState(""),
    [typeFilter, setTypeFilter] = useState(""),
    [day, setDay] = useState(""),
    [feeLocal, setFeeLocal] = useState(data.locations[0]?.id || ""),
    [feeType, setFeeType] = useState(data.radiologyTypes[0]?.id || "");
  const summary = data.radiologySummaries.find((s) => s.competencia === month),
    rows = data.radiologyProduction
      .filter((p) => p.competencia === month)
      .sort((a, b) => b.data_producao.localeCompare(a.data_producao)),
    receipts = data.radiologyReceipts
      .filter((r) => r.competencia === month)
      .sort((a, b) => b.data_recebimento.localeCompare(a.data_recebimento)),
    locations = data.radiologyLocations.filter((l) => l.competencia === month),
    types = data.radiologyTypeSummaries.filter((t) => t.competencia === month),
    fee = data.radiologyFees.find(
      (f) => f.local_id === feeLocal && f.tipo_id === feeType,
    );
  async function run(work: () => Promise<void>, success: string) {
    setBusy(true);
    setError("");
    setNotice("");
    setUndo(null);
    try {
      await work();
      await onRefresh();
      setNotice(success);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Não foi possível salvar.");
    } finally {
      setBusy(false);
    }
  }
  function open(kind: Editor["kind"]) {
    setError("");
    setNotice("");
    if (
      !data.locations.length ||
      (kind === "production" && !data.radiologyTypes.length)
    ) {
      setPage("Ajustes");
      setNotice("Cadastre sua instituição e os tipos de exame para começar.");
      return;
    }
    setEditor({ kind });
  }
  function shift(offset: number) {
    const [y, m] = month.split("-").map(Number),
      d = new Date(y, m - 1 + offset, 1);
    setMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
    setDay("");
  }
  const feedback = (
    <>
      {error && (
        <div role="alert" className="message error">
          <AlertCircle size={18} />
          {error}
        </div>
      )}
      {notice && (
        <div role="status" className="message">
          <span>{notice}</span>
          {undo && (
            <button
              className="text-button"
              disabled={busy}
              onClick={() =>
                run(async () => {
                  await mutate(undo.table, "delete", {}, undo.id);
                }, "Lançamento desfeito.")
              }
            >
              Desfazer lançamento
            </button>
          )}
        </div>
      )}
    </>
  );
  const entry = (p: RadiologyProduction) => (
    <article className="personal-entry" key={p.id}>
      <div className="entry-number">
        {p.quantidade}
        <small>laudos</small>
      </div>
      <div className="entry-info">
        <strong>{p.tipo_nome}</strong>
        <span>
          {p.local_nome} · {dateLabel(p.data_producao)}
        </span>
        <small>
          Informado por você ·{" "}
          {p.valor_unitario === null
            ? "Honorário pendente"
            : money(n(p.valor_unitario)) + "/laudo"}
        </small>
      </div>
      <div className="entry-value">
        <strong>
          {p.valor_previsto === null
            ? "Valor pendente"
            : money(n(p.valor_previsto))}
        </strong>
        <div>
          <button
            aria-label={`Editar produção de laudos ${p.tipo_nome} ${dateLabel(p.data_producao)}`}
            onClick={() => {
              setError("");
              setEditor({ kind: "production", record: p });
            }}
          >
            <Pencil size={15} />
          </button>
          <button
            aria-label={`Excluir produção de laudos ${p.tipo_nome} ${dateLabel(p.data_producao)}`}
            onClick={() => setDeletion({ table: "laudos_producao", id: p.id })}
          >
            <Trash2 size={15} />
          </button>
        </div>
      </div>
    </article>
  );
  return (
    <div className="app-shell personal-shell radiology-shell">
      <aside className="sidebar">
        <div className="brand">
          <Brand />
        </div>
        <p className="nav-caption">LAUDOS RADIOLÓGICOS</p>
        <nav aria-label="Menu de laudos">
          {nav.map(([name, Icon]) => (
            <button
              key={name}
              aria-current={page === name ? "page" : undefined}
              onClick={() => setPage(name)}
            >
              <Icon size={19} />
              {name}
            </button>
          ))}
        </nav>
        <div className="sidebar-tip">
          <Activity size={20} />
          <strong>Seu trabalho, seu controle.</strong>
          <p>
            Valores por instituição e exame, sem depender do administrativo.
          </p>
        </div>
        <div className="profile">
          <span className="avatar">
            {data.profile[0]?.nome.slice(0, 1) || "M"}
          </span>
          <div>
            <strong>{data.profile[0]?.nome}</strong>
            <small>{data.profile[0]?.crm}</small>
          </div>
        </div>
      </aside>
      <main className="main">
        <header className="topbar">
          <div>
            <span className="eyebrow">MEUS LAUDOS RADIOLÓGICOS</span>
            <h1>
              {page === "Dashboard"
                ? "Minha produção de laudos"
                : page === "Produção"
                  ? "Laudos realizados"
                  : page === "Recebimentos"
                    ? "Recebimentos de laudos"
                    : "Instituições e honorários"}
            </h1>
            <p className="muted">
              Seu controle financeiro. Sem imagens, texto de laudo ou
              identificação de pacientes.
            </p>
          </div>
          <div className="header-actions">
            <button
              className="icon-button"
              aria-label={dark ? "Ativar tema claro" : "Ativar tema escuro"}
              onClick={onTheme}
            >
              {dark ? <Sun size={19} /> : <Moon size={19} />}
            </button>
            <button
              className="icon-button"
              aria-label="Sair"
              onClick={onLogout}
            >
              <LogOut size={19} />
            </button>
          </div>
        </header>
        <div className="personal-context">
          <span className="period-title">
            <span className="live-dot" />
            {supabase
              ? "Informado por você · sem confirmação hospitalar"
              : "Demonstração local · dados fictícios"}
          </span>
          <div className="month-picker">
            <button
              className="icon-button"
              aria-label="Mês anterior"
              onClick={() => shift(-1)}
            >
              <ChevronLeft size={18} />
            </button>
            <label>
              Mês da produção
              <input
                aria-label="Mês da produção"
                type="month"
                value={month}
                onChange={(e) => {
                  if (e.target.value) {
                    setMonth(e.target.value);
                    setDay("");
                  }
                }}
              />
            </label>
            <button
              className="icon-button"
              aria-label="Mês seguinte"
              onClick={() => shift(1)}
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
        {feedback}
        {page === "Dashboard" && (
          <>
            <div className="personal-actions">
              <Button onClick={() => open("production")}>
                <Plus size={18} />
                Registrar laudos
              </Button>
              <Button variant="outline" onClick={() => open("receipt")}>
                <Wallet size={18} />
                Registrar recebimento
              </Button>
            </div>
            <section className="hero personal-hero">
              <div className="hero-top">
                <span className="eyebrow">PREVISTO A RECEBER EM LAUDOS</span>
                <span className="hero-badge">Controle pessoal</span>
              </div>
              <div className="hero-value" data-testid="radiology-balance">
                {money(n(summary?.a_receber))}
              </div>
              <p>
                Produção conhecida menos recebimentos informados, separados por
                instituição.
              </p>
              <div className="hero-details">
                <span>{n(summary?.quantidade)} laudos registrados no mês</span>
                <span>Estimativa baseada nos seus registros.</span>
              </div>
            </section>
            <section className="personal-kpis">
              <article className="card">
                <span>Produção estimada</span>
                <strong data-testid="radiology-produced">
                  {money(n(summary?.produzido))}
                </strong>
                <small>Honorário por exame × quantidade</small>
              </article>
              <article className="card">
                <span>Recebido</span>
                <strong className="positive" data-testid="radiology-received">
                  {money(n(summary?.recebido))}
                </strong>
                <small>Referente ao mês da produção</small>
              </article>
              <article className="card">
                <span>Aguardando valor</span>
                <strong>
                  {n(summary?.sem_valor)} <small>laudos</small>
                </strong>
                <small>Salvos e fora da previsão</small>
              </article>
            </section>
            {n(summary?.sem_valor) > 0 && (
              <button
                className="personal-alert"
                onClick={() => setPage("Ajustes")}
              >
                <AlertCircle size={20} />
                <span>
                  <strong>
                    {n(summary?.sem_valor)} laudos aguardam honorário
                  </strong>
                  <small>
                    Cadastre o valor da instituição e tipo de exame para
                    completar a previsão.
                  </small>
                </span>
              </button>
            )}
            {n(summary?.acima_previsto) > 0 && (
              <div className="message">
                <AlertCircle size={18} />
                Recebimentos acima da produção conhecida em uma ou mais
                instituições. Confira a referência; isso não é divergência
                confirmada do hospital.
              </div>
            )}
            <div className="personal-columns">
              <article className="card">
                <h2>Produção por tipo de exame</h2>
                <p className="muted caption">
                  Honorários estimados; valores conhecidos
                </p>
                {types.length ? (
                  <>
                    <div
                      role="img"
                      aria-label="Gráfico da produção financeira por tipo de exame"
                    >
                      <ResponsiveContainer width="100%" height={220}>
                        <BarChart
                          data={types.map((t) => ({
                            ...t,
                            total: n(t.produzido),
                          }))}
                          margin={{ left: 0, right: 8, bottom: 8 }}
                        >
                          <XAxis
                            dataKey="tipo_nome"
                            tick={{ fontSize: 10, fill: "var(--muted)" }}
                          />
                          <YAxis
                            width={44}
                            tick={{ fontSize: 10, fill: "var(--muted)" }}
                          />
                          <Tooltip formatter={(v) => money(n(v))} />
                          <Bar
                            name="Produção"
                            dataKey="total"
                            fill="var(--accent)"
                            radius={[6, 6, 0, 0]}
                            isAnimationActive={false}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                    {types.map((t) => (
                      <div className="radiology-breakdown" key={t.tipo_id}>
                        <span>
                          <strong>{t.tipo_nome}</strong>
                          <small>{n(t.quantidade)} laudos</small>
                        </span>
                        <b>{money(n(t.produzido))}</b>
                      </div>
                    ))}
                  </>
                ) : (
                  <p className="empty">
                    Registre seus laudos para acompanhar a produção.
                  </p>
                )}
              </article>
              <article className="card">
                <h2>Por instituição</h2>
                {locations.map((l) => (
                  <div key={l.local_id} className="personal-location">
                    <h3>
                      {data.locations.find((x) => x.id === l.local_id)?.nome}
                    </h3>
                    <span>
                      {n(l.quantidade)} laudos · {n(l.sem_valor)} sem valor
                    </span>
                    <dl>
                      <div>
                        <dt>Produção estimada</dt>
                        <dd>{money(n(l.produzido))}</dd>
                      </div>
                      <div>
                        <dt>Recebido</dt>
                        <dd>{money(n(l.recebido))}</dd>
                      </div>
                      <div>
                        <dt>Previsto a receber</dt>
                        <dd>{money(n(l.a_receber))}</dd>
                      </div>
                    </dl>
                  </div>
                ))}
                {!locations.length && (
                  <p className="empty">Nenhum registro para este mês.</p>
                )}
              </article>
            </div>
            <section className="card">
              <div className="section-head">
                <h2>Últimos laudos registrados</h2>
                <button
                  className="text-button"
                  onClick={() => setPage("Produção")}
                >
                  Ver produção
                </button>
              </div>
              {rows.slice(0, 4).map(entry)}
              {!rows.length && (
                <p className="empty">
                  Você pode registrar uma unidade ou o total do dia.
                </p>
              )}
            </section>
          </>
        )}
        {page === "Produção" && (
          <section className="card">
            <div className="section-head">
              <h2>Minha produção radiológica</h2>
              <Button onClick={() => open("production")}>
                <Plus size={18} />
                Registrar laudos
              </Button>
            </div>
            <div className="filters">
              <label>
                Instituição
                <select
                  aria-label="Filtrar instituição"
                  value={localFilter}
                  onChange={(e) => setLocalFilter(e.target.value)}
                >
                  <option value="">Todas</option>
                  {data.locations.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.nome}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Tipo de exame
                <select
                  aria-label="Filtrar tipo de exame"
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                >
                  <option value="">Todos</option>
                  {data.radiologyTypes.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.nome}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Dia
                <input
                  aria-label="Filtrar dia"
                  type="date"
                  value={day}
                  onChange={(e) => setDay(e.target.value)}
                />
              </label>
              <Button
                variant="ghost"
                onClick={() => {
                  setDay("");
                  setLocalFilter("");
                  setTypeFilter("");
                }}
              >
                Limpar
              </Button>
            </div>
            {rows
              .filter(
                (p) =>
                  (!localFilter || p.local_id === localFilter) &&
                  (!typeFilter || p.tipo_id === typeFilter) &&
                  (!day || p.data_producao === day),
              )
              .map(entry)}
            <p className="footnote">
              Cada lançamento preserva o valor conhecido ao registrar. Sem dados
              de pacientes.
            </p>
          </section>
        )}
        {page === "Recebimentos" && (
          <section className="card">
            <div className="section-head">
              <h2>Meus recebimentos de laudos</h2>
              <Button onClick={() => open("receipt")}>
                <Plus size={18} />
                Registrar recebimento
              </Button>
            </div>
            <p className="muted">
              A instituição pode pagar vários tipos de exame juntos. Informe o
              mês da produção separadamente da data do pagamento. Esses
              pagamentos não quitam consultas.
            </p>
            {receipts.map((r) => (
              <article className="personal-entry" key={r.id}>
                <div className="entry-info">
                  <strong>
                    {data.locations.find((l) => l.id === r.local_id)?.nome}
                  </strong>
                  <span>Recebido em {dateLabel(r.data_recebimento)}</span>
                  <small>
                    Produção de {r.competencia.split("-").reverse().join("/")} ·
                    Informado por você
                  </small>
                </div>
                <div className="entry-value">
                  <strong>{money(n(r.valor))}</strong>
                  <div>
                    <button
                      aria-label={`Editar recebimento de laudos ${dateLabel(r.data_recebimento)}`}
                      onClick={() => {
                        setError("");
                        setEditor({ kind: "receipt", record: r });
                      }}
                    >
                      <Pencil size={15} />
                    </button>
                    <button
                      aria-label={`Excluir recebimento de laudos ${dateLabel(r.data_recebimento)}`}
                      onClick={() =>
                        setDeletion({ table: "laudos_recebimentos", id: r.id })
                      }
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              </article>
            ))}
            {!receipts.length && (
              <p className="empty">Nenhum recebimento informado.</p>
            )}
          </section>
        )}
        {page === "Ajustes" && (
          <>
            <section className="card personal-setup">
              <h2>1. Instituições onde você lauda</h2>
              <p className="muted">
                Cadastre a clínica, hospital ou empresa de telerradiologia.
              </p>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const form = e.currentTarget,
                    nome = String(new FormData(form).get("nome")).trim();
                  run(async () => {
                    if (!nome)
                      throw new Error("Informe o nome da instituição.");
                    await mutate("locais_atendimento", "insert", { nome });
                    form.reset();
                  }, "Instituição adicionada.");
                }}
              >
                <label>
                  Nome da instituição
                  <input
                    name="nome"
                    required
                    maxLength={100}
                    placeholder="Ex.: Clínica de Imagem Centro"
                  />
                </label>
                <Button disabled={busy}>Adicionar instituição</Button>
              </form>
              <div className="setup-chips">
                {data.locations.map((l) => (
                  <span key={l.id}>{l.nome}</span>
                ))}
              </div>
            </section>
            <section className="card personal-setup">
              <h2>2. Tipos de exame</h2>
              <p className="muted">
                Use o nível de detalhe que muda seu honorário: modalidade,
                região, urgência ou revisão, se necessário.
              </p>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const form = e.currentTarget,
                    nome = String(new FormData(form).get("nome")).trim();
                  run(async () => {
                    if (!nome) throw new Error("Informe o tipo de exame.");
                    await mutate("laudos_tipos", "insert", { nome });
                    form.reset();
                  }, "Tipo de exame adicionado.");
                }}
              >
                <label>
                  Nome do tipo de exame
                  <input
                    name="nome"
                    required
                    maxLength={100}
                    placeholder="Ex.: Tomografia de crânio"
                  />
                </label>
                <Button disabled={busy}>Adicionar tipo de exame</Button>
              </form>
              <div className="setup-chips">
                {data.radiologyTypes.map((t) => (
                  <span key={t.id}>{t.nome}</span>
                ))}
              </div>
            </section>
            <section className="card">
              <h2>3. Honorário por laudo</h2>
              <p className="muted caption">
                Cadastre o valor líquido que espera receber por unidade em cada
                instituição.
              </p>
              <form
                className="fee-form"
                onSubmit={(e) => {
                  e.preventDefault();
                  const valor = Number(
                    new FormData(e.currentTarget).get("valor"),
                  );
                  run(async () => {
                    await mutate(
                      "laudos_valores",
                      fee ? "update" : "insert",
                      {
                        local_id: feeLocal,
                        tipo_id: feeType,
                        valor_unitario: valor,
                      },
                      fee?.id,
                    );
                  }, "Honorário de laudo salvo. Registros pendentes atualizados.");
                }}
              >
                <div className="form-grid">
                  <label>
                    Instituição
                    <select
                      aria-label="Instituição do honorário"
                      required
                      value={feeLocal}
                      onChange={(e) => setFeeLocal(e.target.value)}
                    >
                      <option value="">Selecione</option>
                      {data.locations.map((l) => (
                        <option key={l.id} value={l.id}>
                          {l.nome}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Tipo de exame
                    <select
                      aria-label="Tipo de exame do honorário"
                      required
                      value={feeType}
                      onChange={(e) => setFeeType(e.target.value)}
                    >
                      <option value="">Selecione</option>
                      {data.radiologyTypes.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.nome}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Valor por laudo (R$)
                    <input
                      key={feeLocal + feeType + fee?.valor_unitario}
                      aria-label="Valor por laudo (R$)"
                      type="number"
                      name="valor"
                      min="0"
                      max="9999999999.99"
                      step="0.01"
                      required
                      defaultValue={fee ? String(fee.valor_unitario) : ""}
                    />
                  </label>
                </div>
                <p className="footnote">
                  Este valor será aplicado aos novos lançamentos e aos antigos
                  sem valor. Os que já tinham honorário preservam o valor
                  anterior.
                </p>
                <Button disabled={busy || !feeLocal || !feeType}>
                  Salvar honorário de laudo
                </Button>
              </form>
              <div className="fee-list">
                {data.radiologyFees.map((f) => (
                  <div key={f.id}>
                    <span>
                      {data.locations.find((l) => l.id === f.local_id)?.nome}
                      <small>
                        {
                          data.radiologyTypes.find((t) => t.id === f.tipo_id)
                            ?.nome
                        }
                      </small>
                    </span>
                    <strong>{money(n(f.valor_unitario))}</strong>
                    <button
                      className="text-button"
                      aria-label={`Editar honorário de laudo ${data.radiologyTypes.find((t) => t.id === f.tipo_id)?.nome} ${data.locations.find((l) => l.id === f.local_id)?.nome}`}
                      onClick={() => {
                        setFeeLocal(f.local_id);
                        setFeeType(f.tipo_id);
                      }}
                    >
                      Editar
                    </button>
                  </div>
                ))}
              </div>
            </section>
          </>
        )}
        <footer className="footer">
          <span>{PRODUCT_NAME} · Laudos</span>
          <span>
            Controle financeiro pessoal. Não é emissão de laudos ou PACS.
          </span>
        </footer>
      </main>
      <nav
        className="bottom-nav personal-bottom"
        aria-label="Navegação de laudos"
      >
        {nav.map(([name, Icon]) => (
          <button
            key={name}
            aria-current={page === name ? "page" : undefined}
            onClick={() => setPage(name)}
          >
            <Icon size={21} />
            <span>{name}</span>
          </button>
        ))}
      </nav>
      {editor && (
        <RadiologyEditor
          key={editor.kind + (editor.record?.id || "new")}
          data={data}
          editor={editor}
          month={month}
          busy={busy}
          error={error}
          onClose={() => setEditor(null)}
          onSave={(values) =>
            run(
              async () => {
                const table =
                  editor.kind === "production"
                    ? "laudos_producao"
                    : "laudos_recebimentos";
                await mutate(
                  table,
                  editor.record ? "update" : "insert",
                  values,
                  editor.record?.id,
                );
                if (!editor.record) setUndo({ table, id: String(values.id) });
                setMonth(
                  editor.kind === "production"
                    ? String(values.data_producao).slice(0, 7)
                    : String(values.competencia),
                );
                setEditor(null);
              },
              editor.kind === "production"
                ? "Laudos registrados."
                : "Recebimento de laudos registrado.",
            )
          }
        />
      )}
      {deletion && (
        <Dialog
          title="Excluir este registro?"
          busy={busy}
          onClose={() => setDeletion(null)}
        >
          <p className="muted">
            O registro será removido e os totais recalculados.
          </p>
          <div className="personal-actions">
            <Button
              variant="outline"
              disabled={busy}
              onClick={() => setDeletion(null)}
            >
              Cancelar
            </Button>
            <Button
              disabled={busy}
              onClick={() =>
                run(async () => {
                  await mutate(deletion.table, "delete", {}, deletion.id);
                  setDeletion(null);
                }, "Registro excluído.")
              }
            >
              Excluir registro
            </Button>
          </div>
          {error && (
            <p className="error" role="alert">
              {error}
            </p>
          )}
        </Dialog>
      )}
    </div>
  );
}

function RadiologyEditor({
  data,
  editor,
  month,
  busy,
  error,
  onClose,
  onSave,
}: {
  data: Dataset;
  editor: Editor;
  month: string;
  busy: boolean;
  error: string;
  onClose: () => void;
  onSave: (values: Record<string, unknown>) => Promise<void>;
}) {
  const last = [...data.radiologyProduction].sort((a, b) =>
    b.created_at.localeCompare(a.created_at),
  )[0];
  const [id] = useState(() => crypto.randomUUID()),
    [local, setLocal] = useState(
      editor.record?.local_id || last?.local_id || data.locations[0]?.id || "",
    ),
    [tipo, setTipo] = useState(
      editor.kind === "production"
        ? editor.record?.tipo_id ||
            last?.tipo_id ||
            data.radiologyTypes[0]?.id ||
            ""
        : "",
    ),
    [quantity, setQuantity] = useState(
      editor.kind === "production"
        ? String(editor.record?.quantidade || 1)
        : "1",
    );
  const fee = data.radiologyFees.find(
      (f) => f.local_id === local && f.tipo_id === tipo,
    ),
    original = editor.kind === "production" ? editor.record : undefined,
    unit =
      original && original.local_id === local && original.tipo_id === tipo
        ? original.valor_unitario
        : fee?.valor_unitario;
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget),
      values: Record<string, unknown> = { local_id: local };
    if (!editor.record) values.id = id;
    if (editor.kind === "production")
      Object.assign(values, {
        tipo_id: tipo,
        data_producao: f.get("data"),
        quantidade: Number(quantity),
      });
    else
      Object.assign(values, {
        competencia: f.get("competencia"),
        data_recebimento: f.get("data"),
        valor: Number(f.get("valor")),
      });
    await onSave(values);
  }
  return (
    <Dialog
      title={
        editor.kind === "production"
          ? editor.record
            ? "Editar laudos"
            : "Registrar laudos"
          : editor.record
            ? "Editar recebimento de laudos"
            : "Registrar recebimento de laudos"
      }
      busy={busy}
      onClose={() => {
        if (!busy) onClose();
      }}
    >
      <form onSubmit={submit}>
        <p className="muted">
          {editor.kind === "production"
            ? "Registre uma unidade ou o total do dia, sem identificar pacientes."
            : "Informe um pagamento parcial ou total referente à produção radiológica."}
        </p>
        <label>
          Instituição
          <select
            aria-label="Instituição"
            required
            value={local}
            onChange={(e) => setLocal(e.target.value)}
          >
            {data.locations.map((l) => (
              <option key={l.id} value={l.id}>
                {l.nome}
              </option>
            ))}
          </select>
        </label>
        {editor.kind === "production" ? (
          <>
            <label>
              Tipo de exame
              <select
                aria-label="Tipo de exame"
                required
                value={tipo}
                onChange={(e) => setTipo(e.target.value)}
              >
                {data.radiologyTypes.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.nome}
                  </option>
                ))}
              </select>
            </label>
            <div className="form-grid">
              <label>
                Data dos laudos
                <input
                  aria-label="Data dos laudos"
                  type="date"
                  name="data"
                  required
                  defaultValue={original?.data_producao || today()}
                />
              </label>
              <label>
                Quantidade de laudos
                <div className="quantity-stepper">
                  <button
                    type="button"
                    aria-label="Diminuir quantidade"
                    onClick={() =>
                      setQuantity(String(Math.max(1, n(quantity) - 1)))
                    }
                  >
                    −
                  </button>
                  <input
                    aria-label="Quantidade de laudos"
                    type="number"
                    min={1}
                    max={10000}
                    step={1}
                    required
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    inputMode="numeric"
                  />
                  <button
                    type="button"
                    aria-label="Aumentar quantidade"
                    onClick={() =>
                      setQuantity(String(Math.min(10000, n(quantity) + 1)))
                    }
                  >
                    +
                  </button>
                </div>
              </label>
            </div>
            <p className="personal-hint">
              {unit !== null && unit !== undefined
                ? `${money(n(unit))} por laudo nesta instituição. O total será calculado ao salvar.`
                : "Sem honorário cadastrado: a quantidade ficará salva com valor pendente."}
            </p>
          </>
        ) : (
          <>
            <label>
              Mês da produção a que se refere
              <input
                aria-label="Mês da produção a que se refere"
                name="competencia"
                type="month"
                required
                defaultValue={editor.record?.competencia || month}
              />
            </label>
            <div className="form-grid">
              <label>
                Data em que recebeu
                <input
                  aria-label="Data em que recebeu"
                  name="data"
                  type="date"
                  required
                  defaultValue={editor.record?.data_recebimento || today()}
                />
              </label>
              <label>
                Valor recebido (R$)
                <input
                  aria-label="Valor recebido (R$)"
                  name="valor"
                  type="number"
                  min="0.01"
                  max="9999999999.99"
                  step="0.01"
                  required
                  defaultValue={
                    editor.record ? String(editor.record.valor) : ""
                  }
                />
              </label>
            </div>
            <p className="footnote">
              Pode abranger vários tipos de exame da mesma instituição. Não
              reduz saldo de consultas nem de outras instituições.
            </p>
          </>
        )}
        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}
        <Button type="submit" disabled={busy}>
          {busy
            ? "Salvando…"
            : editor.kind === "production"
              ? "Salvar laudos"
              : "Salvar recebimento de laudos"}
        </Button>
      </form>
    </Dialog>
  );
}
