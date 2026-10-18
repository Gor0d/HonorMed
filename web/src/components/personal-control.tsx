"use client";
import {
  useEffect,
  useRef,
  useState,
  type ReactNode,
  type FormEvent,
} from "react";
import Link from "next/link";
import {
  Home,
  List,
  Wallet,
  Settings,
  Plus,
  ArrowUpRight,
  Moon,
  Sun,
  LogOut,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  X,
  Pencil,
  Trash2,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { PRODUCT_NAME } from "@/lib/brand";
import { Brand, BrandMark } from "@/components/brand";
import { money } from "@/lib/utils";
import { today } from "@/lib/date";
import {
  mutate,
  supabase,
  type Dataset,
  type PersonalProduction,
  type PersonalReceipt,
} from "@/lib/data";

const n = (v: unknown) => Number(v ?? 0);
const dateLabel = (s: string) => s.slice(0, 10).split("-").reverse().join("/");
const nav = [
  ["Início", Home],
  ["Produção", List],
  ["Recebimentos", Wallet],
  ["Ajustes", Settings],
] as const;
type Props = {
  data: Dataset;
  onRefresh: () => Promise<void>;
  dark: boolean;
  onTheme: () => void;
  onLogout: () => Promise<void>;
  startInSettings?: boolean;
};
type Editor =
  | {
      kind: "production";
      record?: PersonalProduction;
      template?: PersonalProduction;
    }
  | { kind: "receipt"; record?: PersonalReceipt };

export function Dialog({
  title,
  children,
  onClose,
  busy,
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
  busy: boolean;
}) {
  const ref = useRef<HTMLElement>(null);
  const latest = useRef({ onClose, busy });
  useEffect(() => {
    latest.current = { onClose, busy };
  }, [onClose, busy]);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement,
      overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const items = () =>
      Array.from(
        ref.current?.querySelectorAll<HTMLElement>(
          "input,select,button:not(:disabled),a[href]",
        ) || [],
      );
    (
      ref.current?.querySelector<HTMLElement>("input,select") || items()[0]
    )?.focus();
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !latest.current.busy) latest.current.onClose();
      if (e.key === "Tab") {
        const list = items(),
          first = list[0],
          last = list.at(-1);
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last?.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first?.focus();
        }
      }
    };
    document.addEventListener("keydown", handler);
    return () => {
      document.body.style.overflow = overflow;
      document.removeEventListener("keydown", handler);
      previous?.focus();
    };
  }, []);
  return (
    <div className="modal-backdrop">
      <section
        ref={ref}
        className="modal card"
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <div className="section-head">
          <h2>{title}</h2>
          <button
            type="button"
            className="icon-button"
            aria-label="Fechar"
            disabled={busy}
            onClick={onClose}
          >
            <X size={20} />
          </button>
        </div>
        {children}
      </section>
    </div>
  );
}

export default function PersonalControl({
  data,
  onRefresh,
  dark,
  onTheme,
  onLogout,
  startInSettings = false,
}: Props) {
  const [page, setPage] = useState<string>(startInSettings ? "Ajustes" : "Início"),
    [month, setMonth] = useState(supabase ? today().slice(0, 7) : "2026-10");
  const [editor, setEditor] = useState<Editor | null>(null),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [notice, setNotice] = useState("");
  const [undo, setUndo] = useState<{
    table: "producoes_pessoais" | "recebimentos_pessoais";
    id: string;
  } | null>(null);
  const lastProduction = [...data.production].sort((a, b) =>
    b.created_at.localeCompare(a.created_at),
  )[0];
  const [localFilter, setLocalFilter] = useState(""),
    [convenioFilter, setConvenioFilter] = useState(""),
    [dayFilter, setDayFilter] = useState("");
  const [feeLocal, setFeeLocal] = useState(data.locations[0]?.id || ""),
    [feeConvenio, setFeeConvenio] = useState(data.convenios[0]?.id || "");
  const summary = data.personalSummaries.find((s) => s.competencia === month);
  const production = data.production
    .filter((p) => p.competencia === month)
    .sort((a, b) => b.data_producao.localeCompare(a.data_producao));
  const receipts = data.receipts
    .filter((r) => r.competencia === month)
    .sort((a, b) => b.data_recebimento.localeCompare(a.data_recebimento));
  const locations = data.locationSummaries.filter(
    (s) => s.competencia === month,
  );
  const filtered = production.filter(
    (p) =>
      (!localFilter || p.local_id === localFilter) &&
      (!convenioFilter || p.convenio_id === convenioFilter) &&
      (!dayFilter || p.data_producao === dayFilter),
  );
  const [confirmDelete, setConfirmDelete] = useState<{
    table: "producoes_pessoais" | "recebimentos_pessoais";
    id: string;
  } | null>(null);
  const ready = data.locations.length > 0 && data.convenios.length > 0;
  const existingFee = data.fees.find(
    (f) => f.local_id === feeLocal && f.convenio_id === feeConvenio,
  );
  async function perform(work: () => Promise<void>, success: string) {
    setBusy(true);
    setError("");
    setNotice("");
    setUndo(null);
    try {
      await work();
      await onRefresh();
      setNotice(success);
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Não foi possível salvar. Tente novamente.",
      );
    } finally {
      setBusy(false);
    }
  }
  function open(kind: Editor["kind"]) {
    setError("");
    setNotice("");
    if (
      (kind === "production" && !ready) ||
      (kind === "receipt" && !data.locations.length)
    ) {
      setPage("Ajustes");
      setNotice("Adicione onde você atende e seus convênios para começar.");
      return;
    }
    setEditor(
      kind === "production"
        ? {
            kind,
            template: lastProduction
              ? { ...lastProduction, quantidade: 1 }
              : undefined,
          }
        : { kind },
    );
  }
  function shiftMonth(offset: number) {
    const [y, m] = month.split("-").map(Number),
      d = new Date(y, m - 1 + offset, 1);
    setMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
    setDayFilter("");
  }
  const feedback = (
    <>
      {error && (
        <div className="message error" role="alert">
          <AlertCircle size={18} />
          <span>{error}</span>
          <button aria-label="Fechar erro" onClick={() => setError("")}>
            <X size={16} />
          </button>
        </div>
      )}
      {notice && (
        <div className="message" role="status">
          <CheckCircle2 size={18} />
          {notice}
          {undo && (
            <button
              disabled={busy}
              className="text-button"
              onClick={() =>
                perform(async () => {
                  await mutate(undo.table, "delete", {}, undo.id);
                  setUndo(null);
                }, "Último lançamento desfeito.")
              }
            >
              Desfazer lançamento
            </button>
          )}
        </div>
      )}
    </>
  );
  const productionItem = (p: PersonalProduction) => (
    <article className="personal-entry" key={p.id}>
      <div className="entry-number">
        {p.quantidade}
        <small>consultas</small>
      </div>
      <div className="entry-info">
        <strong>{p.convenio_nome}</strong>
        <span>
          {p.local_nome} · {dateLabel(p.data_producao)}
        </span>
        <small>
          Informado por você
          {p.valor_unitario !== null
            ? ` · ${money(n(p.valor_unitario))}/consulta`
            : ""}
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
            aria-label={`Editar produção de ${dateLabel(p.data_producao)} ${p.convenio_nome}`}
            onClick={() => {
              setError("");
              setEditor({ kind: "production", record: p });
            }}
          >
            <Pencil size={15} />
          </button>
          <button
            aria-label={`Excluir produção de ${dateLabel(p.data_producao)} ${p.convenio_nome}`}
            onClick={() =>
              setConfirmDelete({ table: "producoes_pessoais", id: p.id })
            }
          >
            <Trash2 size={15} />
          </button>
        </div>
      </div>
    </article>
  );

  return (
    <div className="app-shell personal-shell">
      <aside className="sidebar">
        <Link className="brand" href="/">
          <Brand />
        </Link>
        <p className="nav-caption">SEU TRABALHO. SEU CONTROLE.</p>
        <nav aria-label="Menu do controle pessoal">
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
          <Wallet size={21} />
          <strong>Independente do hospital.</strong>
          <p>Registre suas consultas e acompanhe seus honorários.</p>
        </div>
        <div className="profile">
          <span className="avatar">
            {data.profile[0]?.nome.slice(0, 1) || "M"}
          </span>
          <div>
            <strong>{data.profile[0]?.nome || "Meu perfil"}</strong>
            <small>{data.profile[0]?.crm}</small>
          </div>
        </div>
      </aside>
      <main className="main">
        <header className="topbar">
          <div>
            <span className="eyebrow">MEU CONTROLE PESSOAL</span>
            <h1>
              {page === "Início"
                ? `Olá, ${data.profile[0]?.nome.split(" ")[0] || "doutor"} 👋`
                : page}
            </h1>
            <p className="muted">
              {page === "Início"
                ? "Suas consultas e seus recebimentos, sem planilhas."
                : page === "Produção"
                  ? "O que você realizou, registrado do seu jeito."
                  : page === "Recebimentos"
                    ? "Registre o dinheiro recebido e o mês ao qual ele se refere."
                    : "Configure uma vez. Use com poucos toques."}
            </p>
          </div>
          <div className="header-actions">
            <button
              className="icon-button"
              onClick={onTheme}
              aria-label={dark ? "Ativar tema claro" : "Ativar tema escuro"}
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
              onClick={() => shiftMonth(-1)}
            >
              <ChevronLeft size={18} />
            </button>
            <label>
              Mês da produção
              <input
                aria-label="Mês da produção"
                type="month"
                value={month}
                required
                onChange={(e) => {
                  if (e.target.value) {
                    setMonth(e.target.value);
                    setDayFilter("");
                  }
                }}
              />
            </label>
            <button
              className="icon-button"
              aria-label="Mês seguinte"
              onClick={() => shiftMonth(1)}
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
        {feedback}
        {page === "Início" && (
          <>
            <div className="personal-actions">
              <Button onClick={() => open("production")}>
                <Plus size={19} />
                Registrar consultas
              </Button>
              {lastProduction && (
                <Button
                  variant="ghost"
                  onClick={() => {
                    setError("");
                    setEditor({ kind: "production", template: lastProduction });
                  }}
                >
                  Repetir último lançamento
                </Button>
              )}
              <Button variant="outline" onClick={() => open("receipt")}>
                <Wallet size={18} />
                Registrar recebimento
              </Button>
            </div>
            <section className="hero personal-hero">
              <div className="hero-top">
                <span className="eyebrow">PREVISTO A RECEBER</span>
                <span className="hero-badge">Seu controle pessoal</span>
              </div>
              <div className="hero-value" data-testid="personal-balance">
                {money(n(summary?.a_receber))}
              </div>
              <p>
                Produção com valor conhecido, menos recebimentos informados por
                local.
              </p>
              <div className="hero-details">
                <span>
                  {n(summary?.quantidade)} consultas registradas no mês
                </span>
                <span>Previsão baseada no que você informou.</span>
              </div>
            </section>
            <section className="personal-kpis">
              <article className="card">
                <span>Produção estimada</span>
                <strong data-testid="personal-produced">
                  {money(n(summary?.produzido))}
                </strong>
                <small>
                  {n(summary?.quantidade)} consultas · apenas valores conhecidos
                </small>
              </article>
              <article className="card">
                <span>Recebido</span>
                <strong className="positive" data-testid="personal-received">
                  {money(n(summary?.recebido))}
                </strong>
                <small>Informado para este mês de produção</small>
              </article>
              <article className="card">
                <span>Aguardando honorário</span>
                <strong>
                  {n(summary?.sem_valor)} <small>consultas</small>
                </strong>
                <small>Registradas, mas fora da previsão</small>
              </article>
            </section>
            {n(summary?.sem_valor) > 0 && (
              <button
                className="personal-alert"
                onClick={() => setPage("Ajustes")}
              >
                <AlertCircle size={21} />
                <span>
                  <strong>
                    {n(summary?.sem_valor)} consultas aguardam valor
                  </strong>
                  <small>
                    Informe o honorário quando souber. Suas consultas já estão
                    salvas.
                  </small>
                </span>
                <ArrowUpRight size={18} />
              </button>
            )}
            {n(summary?.acima_previsto) > 0 && (
              <div className="message">
                <AlertCircle size={18} />
                <span>
                  Há {money(n(summary?.acima_previsto))} recebidos acima da
                  produção com valor conhecido em um ou mais convênios/locais.
                  Confira o mês e os honorários; isso não confirma uma
                  divergência do hospital.
                </span>
              </div>
            )}
            {data.reconciliation
              .filter((s) => s.competencia === month && s.conferir_diferenca)
              .slice(0, 3)
              .map((s) => (
                <button
                  key={s.local_id + ":" + s.convenio_id}
                  className="personal-alert"
                  onClick={() => setPage("Recebimentos")}
                >
                  <Wallet size={19} />
                  <span>
                    <strong>
                      {data.convenios.find((c) => c.id === s.convenio_id)
                        ?.nome || "Convênio não atribuído"}{" "}
                      · {data.locations.find((l) => l.id === s.local_id)?.nome}
                    </strong>
                    <small>
                      {n(s.diferenca) > 0
                        ? `${money(n(s.diferenca))} previstos após recebimento parcial.`
                        : "Recebimento acima da produção conhecida."}{" "}
                      Confira a referência do pagamento.
                    </small>
                  </span>
                  <ArrowUpRight size={17} />
                </button>
              ))}
            {!summary && (
              <section className="card empty-personal">
                <h2>Seu controle começa com o primeiro registro.</h2>
                <p className="muted">
                  Informe a quantidade de consultas do dia. Você pode preencher
                  os honorários depois.
                </p>
                <Button onClick={() => open("production")}>
                  <Plus size={17} />
                  Registrar minhas consultas
                </Button>
              </section>
            )}
            <section className="personal-columns">
              <article className="card">
                <div className="section-head">
                  <h2>Últimos registros</h2>
                  <button
                    className="text-button"
                    onClick={() => setPage("Produção")}
                  >
                    Ver todos <ArrowUpRight size={15} />
                  </button>
                </div>
                {production.slice(0, 4).map(productionItem)}
                {!production.length && (
                  <p className="muted">
                    Nenhuma consulta registrada neste mês.
                  </p>
                )}
              </article>
              <article className="card">
                <h2>Por local de atendimento</h2>
                <p className="muted caption">Valores do seu controle pessoal</p>
                {locations.map((l) => (
                  <div className="personal-location" key={l.local_id}>
                    <h3>
                      {data.locations.find((x) => x.id === l.local_id)?.nome}
                    </h3>
                    <span>
                      {n(l.quantidade)} consultas · {n(l.sem_valor)} sem valor
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
                  <p className="empty">
                    Os locais aparecem após seu primeiro registro.
                  </p>
                )}
              </article>
            </section>
          </>
        )}
        {page === "Produção" && (
          <section className="card">
            <div className="section-head">
              <h2>Minhas consultas</h2>
              <Button onClick={() => open("production")}>
                <Plus size={17} />
                Registrar consultas
              </Button>
            </div>
            <div className="filters">
              <label>
                Local
                <select
                  aria-label="Filtrar local"
                  value={localFilter}
                  onChange={(e) => setLocalFilter(e.target.value)}
                >
                  <option value="">Todos os locais</option>
                  {data.locations.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.nome}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Convênio
                <select
                  aria-label="Filtrar convênio"
                  value={convenioFilter}
                  onChange={(e) => setConvenioFilter(e.target.value)}
                >
                  <option value="">Todos os convênios</option>
                  {data.convenios.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nome}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Dia
                <input
                  aria-label="Filtrar dia"
                  type="date"
                  value={dayFilter}
                  onChange={(e) => setDayFilter(e.target.value)}
                />
              </label>
              <Button
                variant="ghost"
                onClick={() => {
                  setDayFilter("");
                  setLocalFilter("");
                  setConvenioFilter("");
                }}
              >
                Limpar
              </Button>
            </div>
            {filtered.map(productionItem)}
            {!filtered.length && (
              <p className="empty">Nenhum registro com esses filtros.</p>
            )}
            <p className="footnote">
              Valores informados por você. Cada registro guarda o honorário
              conhecido no momento do lançamento. Sem informação de pacientes.
            </p>
          </section>
        )}
        {page === "Recebimentos" && (
          <section className="card">
            <div className="section-head">
              <h2>Meus recebimentos</h2>
              <Button onClick={() => open("receipt")}>
                <Plus size={17} />
                Registrar recebimento
              </Button>
            </div>
            <div className="message">
              <Wallet size={18} />
              <span>
                Esta lista usa o <strong>mês da produção</strong>. A data do
                pagamento pode estar em outro mês. Um recebimento não marca
                consultas individuais como pagas.
              </span>
            </div>
            <div className="personal-receipts">
              {data.reconciliation
                .filter((s) => s.competencia === month)
                .map((s) => (
                  <article
                    className="personal-location"
                    key={s.local_id + ":" + s.convenio_id}
                  >
                    <h3>
                      {data.convenios.find((c) => c.id === s.convenio_id)
                        ?.nome || "Convênio não atribuído"}{" "}
                      · {data.locations.find((l) => l.id === s.local_id)?.nome}
                    </h3>
                    <dl>
                      <div>
                        <dt>Produção estimada</dt>
                        <dd>{money(n(s.produzido))}</dd>
                      </div>
                      <div>
                        <dt>Recebido</dt>
                        <dd>{money(n(s.recebido))}</dd>
                      </div>
                      <div>
                        <dt>Diferença a conferir</dt>
                        <dd>{money(n(s.diferenca))}</dd>
                      </div>
                    </dl>
                    {s.conferir_diferenca && (
                      <small>
                        Pagamento parcial ou valor diferente da produção
                        conhecida. Confira sua referência.
                      </small>
                    )}
                  </article>
                ))}
              {receipts.map((r) => (
                <article className="personal-entry" key={r.id}>
                  <div className="entry-info">
                    <strong>
                      {data.locations.find((l) => l.id === r.local_id)?.nome}
                    </strong>
                    <span>Recebido em {dateLabel(r.data_recebimento)}</span>
                    <small>
                      {data.convenios.find((c) => c.id === r.convenio_id)
                        ?.nome || "Convênio não atribuído"}{" "}
                      · Produção de{" "}
                      {r.competencia.split("-").reverse().join("/")} · Informado
                      por você
                    </small>
                  </div>
                  <div className="entry-value">
                    <strong>{money(n(r.valor))}</strong>
                    <div>
                      <button
                        aria-label={`Editar recebimento de ${dateLabel(r.data_recebimento)}`}
                        onClick={() => {
                          setError("");
                          setEditor({ kind: "receipt", record: r });
                        }}
                      >
                        <Pencil size={15} />
                      </button>
                      <button
                        aria-label={`Excluir recebimento de ${dateLabel(r.data_recebimento)}`}
                        onClick={() =>
                          setConfirmDelete({
                            table: "recebimentos_pessoais",
                            id: r.id,
                          })
                        }
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                </article>
              ))}
              {!receipts.length && (
                <p className="empty">
                  Nenhum recebimento informado para esta produção.
                </p>
              )}
            </div>
          </section>
        )}
        {page === "Ajustes" && (
          <>
            <section className="card personal-setup">
              <h2>1. Onde você atende?</h2>
              <p className="muted">
                Cadastre o nome do hospital, clínica ou consultório.
              </p>
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  const form = e.currentTarget,
                    value = new FormData(form).get("nome");
                  await perform(async () => {
                    await mutate("locais_atendimento", "insert", {
                      nome: String(value).trim(),
                    });
                    form.reset();
                  }, "Local adicionado.");
                }}
              >
                <label>
                  Nome do local
                  <input
                    name="nome"
                    maxLength={100}
                    required
                    placeholder="Ex.: Consultório Centro"
                  />
                </label>
                <Button disabled={busy}>Adicionar local</Button>
              </form>
              <div className="setup-chips">
                {data.locations.map((l) => (
                  <span key={l.id}>{l.nome}</span>
                ))}
              </div>
            </section>
            <section className="card personal-setup">
              <h2>2. Quais convênios você atende?</h2>
              <p className="muted">
                Inclua Particular se receber diretamente pelas consultas.
              </p>
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  const form = e.currentTarget,
                    value = new FormData(form).get("nome");
                  await perform(async () => {
                    await mutate("convenios", "insert", {
                      nome: String(value).trim(),
                    });
                    form.reset();
                  }, "Convênio adicionado.");
                }}
              >
                <label>
                  Nome do convênio
                  <input
                    name="nome"
                    maxLength={100}
                    required
                    placeholder="Ex.: Particular"
                  />
                </label>
                <Button disabled={busy}>Adicionar convênio</Button>
              </form>
              <div className="setup-chips">
                {data.convenios.map((c) => (
                  <span key={c.id}>{c.nome}</span>
                ))}
              </div>
            </section>
            <section className="card">
              <h2>3. Quanto você recebe por consulta?</h2>
              <p className="muted caption">
                Preencha quando souber. Sem honorário, você já pode registrar a
                quantidade de consultas.
              </p>
              <form
                className="fee-form"
                onSubmit={async (e) => {
                  e.preventDefault();
                  const form = e.currentTarget,
                    f = new FormData(form),
                    value = Number(f.get("valor"));
                  await perform(async () => {
                    await mutate(
                      "honorarios_pessoais",
                      existingFee ? "update" : "insert",
                      {
                        local_id: feeLocal,
                        convenio_id: feeConvenio,
                        valor_unitario: value,
                      },
                      existingFee?.id,
                    );
                  }, "Honorário salvo. Registros sem valor foram atualizados.");
                }}
              >
                <div className="form-grid">
                  <label>
                    Local
                    <select
                      aria-label="Local do honorário"
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
                    Convênio
                    <select
                      aria-label="Convênio do honorário"
                      required
                      value={feeConvenio}
                      onChange={(e) => setFeeConvenio(e.target.value)}
                    >
                      <option value="">Selecione</option>
                      {data.convenios.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.nome}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Honorário por consulta (R$)
                    <input
                      key={
                        existingFee?.id +
                        ":" +
                        existingFee?.valor_unitario +
                        ":" +
                        feeLocal +
                        feeConvenio
                      }
                      name="valor"
                      aria-label="Honorário por consulta (R$)"
                      type="number"
                      min="0"
                      max="9999999999.99"
                      step="0.01"
                      required
                      defaultValue={
                        existingFee ? String(existingFee.valor_unitario) : ""
                      }
                      placeholder="Ex.: 85,00"
                    />
                  </label>
                </div>
                <p className="footnote">
                  Informe o valor que espera receber por consulta, já
                  considerando descontos conhecidos. Ele será usado em novos
                  registros e nos antigos ainda sem valor. Registros que já têm
                  honorário preservam seu valor anterior.
                </p>
                <Button disabled={busy || !feeLocal || !feeConvenio}>
                  Salvar honorário
                </Button>
              </form>
              <div className="fee-list">
                {data.fees.map((f) => (
                  <div key={f.id}>
                    <span>
                      {data.locations.find((l) => l.id === f.local_id)?.nome}
                      <small>
                        {
                          data.convenios.find((c) => c.id === f.convenio_id)
                            ?.nome
                        }
                      </small>
                    </span>
                    <strong>{money(n(f.valor_unitario))}</strong>
                    <button
                      className="text-button"
                      aria-label={`Editar honorário ${data.locations.find((l) => l.id === f.local_id)?.nome} ${data.convenios.find((c) => c.id === f.convenio_id)?.nome}`}
                      onClick={() => {
                        setFeeLocal(f.local_id);
                        setFeeConvenio(f.convenio_id);
                      }}
                    >
                      Editar
                    </button>
                  </div>
                ))}
              </div>
            </section>
            <section className="card">
              <h2>Dados importados e configurações avançadas</h2>
              <p className="muted caption">
                A visão importada é separada do seu controle pessoal para evitar
                somar a mesma produção duas vezes. Ela também não confirma dados
                do hospital.
              </p>
              <Link href="/importados" className="text-button advanced-link">
                Abrir visão importada <ArrowUpRight size={16} />
              </Link>
            </section>
          </>
        )}
        <footer className="footer">
          <span>
            <BrandMark className="footer-mark" />
            {PRODUCT_NAME}
          </span>
          <span>Seu controle pessoal. Sem confirmação hospitalar.</span>
        </footer>
      </main>
      <nav
        className="bottom-nav personal-bottom"
        aria-label="Navegação pessoal"
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
        <RecordEditor
          key={
            editor.kind +
            ("record" in editor ? editor.record?.id || "new" : "new")
          }
          editor={editor}
          data={data}
          month={month}
          busy={busy}
          error={error}
          close={() => {
            if (!busy) setEditor(null);
          }}
          save={async (values) => {
            await perform(
              async () => {
                const table =
                  editor.kind === "production"
                    ? "producoes_pessoais"
                    : "recebimentos_pessoais";
                await mutate(
                  table,
                  editor.record ? "update" : "insert",
                  values,
                  editor.record?.id,
                );
                if (!editor.record) setUndo({ table, id: String(values.id) });
                setEditor(null);
              },
              editor.kind === "production"
                ? "Consultas registradas no seu controle."
                : "Recebimento registrado no seu controle.",
            );
          }}
        />
      )}
      {confirmDelete && (
        <Dialog
          title="Excluir este registro?"
          busy={busy}
          onClose={() => setConfirmDelete(null)}
        >
          <p className="muted">
            O registro será removido do seu controle e os totais serão
            atualizados.
          </p>
          <div className="personal-actions">
            <Button
              variant="outline"
              disabled={busy}
              onClick={() => setConfirmDelete(null)}
            >
              Cancelar
            </Button>
            <Button
              disabled={busy}
              onClick={() =>
                perform(async () => {
                  await mutate(
                    confirmDelete.table,
                    "delete",
                    {},
                    confirmDelete.id,
                  );
                  setConfirmDelete(null);
                }, "Registro excluído.")
              }
            >
              Excluir registro
            </Button>
          </div>
          {error && (
            <p role="alert" className="error">
              {error}
            </p>
          )}
        </Dialog>
      )}
    </div>
  );
}

function RecordEditor({
  editor,
  data,
  month,
  busy,
  error,
  close,
  save,
}: {
  editor: Editor;
  data: Dataset;
  month: string;
  busy: boolean;
  error: string;
  close: () => void;
  save: (values: Record<string, unknown>) => Promise<void>;
}) {
  const [id] = useState(() => crypto.randomUUID());
  const initial =
    editor.record ||
    (editor.kind === "production" ? editor.template : undefined);
  const [local, setLocal] = useState(
    initial?.local_id || data.locations[0]?.id || "",
  );
  const [convenio, setConvenio] = useState(
    initial?.convenio_id || data.convenios[0]?.id || "",
  );
  const [quantity, setQuantity] = useState(
    String(
      editor.kind === "production"
        ? initial && "quantidade" in initial
          ? initial.quantidade
          : 1
        : 1,
    ),
  );
  const fee = data.fees.find(
    (f) => f.local_id === local && f.convenio_id === convenio,
  );
  const original = editor.kind === "production" ? editor.record : undefined;
  const unit =
    original && original.local_id === local && original.convenio_id === convenio
      ? original.valor_unitario
      : fee?.valor_unitario;
  const title =
    editor.kind === "production"
      ? editor.record
        ? "Editar consultas"
        : "Registrar consultas"
      : editor.record
        ? "Editar recebimento"
        : "Registrar recebimento";
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const values: Record<string, unknown> = { local_id: local };
    if (!editor.record) values.id = id;
    if (editor.kind === "production") {
      Object.assign(values, {
        convenio_id: convenio,
        data_producao: f.get("data"),
        quantidade: Number(f.get("quantidade")),
      });
    } else
      Object.assign(values, {
        competencia: f.get("competencia"),
        convenio_id: convenio,
        data_recebimento: f.get("data"),
        valor: Number(f.get("valor")),
      });
    await save(values);
  }
  return (
    <Dialog title={title} busy={busy} onClose={close}>
      <form onSubmit={submit}>
        <p className="muted">
          {editor.kind === "production"
            ? "Uma consulta ou o total do dia. Sem dados de pacientes."
            : "Informe o que recebeu, mesmo que seja apenas uma parte."}
        </p>
        <label>
          Local de atendimento
          <select
            aria-label="Local de atendimento"
            value={local}
            onChange={(e) => setLocal(e.target.value)}
            required
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
              Convênio
              <select
                aria-label="Convênio das consultas"
                required
                value={convenio}
                onChange={(e) => setConvenio(e.target.value)}
              >
                {data.convenios.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nome}
                  </option>
                ))}
              </select>
            </label>
            <div className="form-grid">
              <label>
                Data das consultas
                <input
                  aria-label="Data das consultas"
                  type="date"
                  name="data"
                  required
                  defaultValue={original?.data_producao || today()}
                />
              </label>
              <label>
                Quantidade de consultas
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
                    aria-label="Quantidade de consultas"
                    type="number"
                    inputMode="numeric"
                    name="quantidade"
                    required
                    min={1}
                    max={1000}
                    step={1}
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                  />
                  <button
                    type="button"
                    aria-label="Aumentar quantidade"
                    onClick={() =>
                      setQuantity(String(Math.min(1000, n(quantity) + 1)))
                    }
                  >
                    +
                  </button>
                </div>
              </label>
            </div>
            <div className="personal-hint">
              {unit !== null && unit !== undefined
                ? `Honorário: ${money(n(unit))} por consulta. O total será atualizado ao salvar.`
                : "Ainda não há honorário informado. Suas consultas serão salvas com valor pendente."}
            </div>
          </>
        ) : (
          <>
            <label>
              Convênio
              <select
                aria-label="Convênio do recebimento"
                required
                value={convenio}
                onChange={(e) => setConvenio(e.target.value)}
              >
                {data.convenios.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nome}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Mês da produção a que se refere
              <input
                aria-label="Mês da produção a que se refere"
                type="month"
                name="competencia"
                required
                defaultValue={editor.record?.competencia || month}
              />
            </label>
            <div className="form-grid">
              <label>
                Data em que recebeu
                <input
                  aria-label="Data em que recebeu"
                  type="date"
                  name="data"
                  required
                  defaultValue={editor.record?.data_recebimento || today()}
                />
              </label>
              <label>
                Valor recebido (R$)
                <input
                  aria-label="Valor recebido (R$)"
                  type="number"
                  name="valor"
                  inputMode="decimal"
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
              Exemplo: pagamento recebido em novembro pode se referir às
              consultas de outubro. O saldo será atualizado no mês da produção,
              apenas para este local.
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
              ? "Salvar consultas"
              : "Salvar recebimento"}
        </Button>
      </form>
    </Dialog>
  );
}
