"use client";
import { useEffect, useState, type FormEvent } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import {
  Activity,
  LayoutDashboard,
  Building2,
  List,
  SlidersHorizontal,
  Upload,
  Sparkles,
  Moon,
  Sun,
  LogOut,
  ArrowUpRight,
  AlertCircle,
  CheckCircle2,
  Target,
  Plus,
  X,
  Download,
} from "lucide-react";
import Papa from "papaparse";
import readXlsxFile from "read-excel-file";
import { Button } from "@/components/ui/button";
import ProductModules from "@/components/product-modules";
import PlansPreview from "@/components/plans-preview";
import { PRODUCT_NAME } from "@/lib/brand";
import { money } from "@/lib/utils";
import {
  fetchData,
  mutate,
  supabase,
  type Dataset,
  type Rule,
} from "@/lib/data";

const nav = [
  ["Dashboard", LayoutDashboard],
  ["Por convênio", Building2],
  ["Atendimentos", List],
  ["Regras de repasse", SlidersHorizontal],
  ["Importar", Upload],
  ["Planos", Sparkles],
] as const;
const visibleNav = nav.filter(
  ([name]) =>
    name !== "Planos" || process.env.NEXT_PUBLIC_PLANS_PREVIEW !== "false",
);
const statuses = [
  "pago",
  "faturado",
  "a_faturar",
  "glosado",
  "agendado",
  "realizado",
];
const labels: Record<string, string> = {
  pago: "Pago",
  faturado: "Faturado",
  a_faturar: "A faturar",
  glosado: "Glosado",
  agendado: "Agendado",
  realizado: "Realizado",
};
const colors = [
  "#0b7a66",
  "#2f6fb5",
  "#c98512",
  "#c6423a",
  "#9aaba6",
  "#7863a3",
];
const months = ["2026-10", "2026-11"];
const monthName = (m: string) =>
  new Intl.DateTimeFormat("pt-BR", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(m + "-01T12:00:00Z"));
const number = (v: unknown) => Number(v ?? 0);
const now = new Date();
const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
const nextDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);
const nextMonth = `${nextDate.getFullYear()}-${String(nextDate.getMonth() + 1).padStart(2, "0")}`;
const date = (s: string) => s.split("-").reverse().join("/");

export default function App({
  mode = "personal",
}: {
  mode?: "personal" | "imported";
}) {
  const [signed, setSigned] = useState(false),
    [ready, setReady] = useState(false),
    [data, setData] = useState<Dataset | null>(null),
    [page, setPage] = useState("Dashboard"),
    [month, setMonth] = useState(supabase ? currentMonth : months[0]),
    [error, setError] = useState(""),
    [notice, setNotice] = useState(""),
    [dark, setDark] = useState(false),
    [busy, setBusy] = useState(false),
    [onboarding, setOnboarding] = useState(false);
  const [filterC, setFilterC] = useState(""),
    [filterS, setFilterS] = useState(""),
    [filterD, setFilterD] = useState(""),
    [editing, setEditing] = useState<Rule | "new" | null>(null),
    [goalEdit, setGoalEdit] = useState(false);
  const [sheet, setSheet] = useState<string[][]>([]),
    [mapping, setMapping] = useState<Record<string, string>>({}),
    [importErrors, setImportErrors] = useState<string[]>([]);
  const [install, setInstall] = useState<
    (Event & { prompt: () => Promise<void> }) | null
  >(null);
  async function refresh() {
    const d = await fetchData();
    setData(d);
    setOnboarding(!!supabase && !d.profile.length);
  }
  useEffect(() => {
    const theme =
      localStorage.getItem("repasse-theme") ||
      (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
    setDark(theme === "dark");
    document.documentElement.dataset.theme = theme;
    if ("serviceWorker" in navigator)
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    const handler = (e: Event) => {
      e.preventDefault();
      setInstall(e as Event & { prompt: () => Promise<void> });
    };
    window.addEventListener("beforeinstallprompt", handler);
    if (supabase) {
      supabase.auth.getSession().then(({ data }) => {
        setSigned(!!data.session);
        setReady(true);
      });
      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange((_e, session) =>
        setSigned(!!session),
      );
      return () => {
        subscription.unsubscribe();
        window.removeEventListener("beforeinstallprompt", handler);
      };
    }
    setSigned(sessionStorage.getItem("repasse-demo") === "yes");
    setReady(true);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);
  useEffect(() => {
    if (signed) refresh().catch((e) => setError(e.message));
  }, [signed]);
  useEffect(() => {
    if (!editing && !goalEdit) return;
    const previous = document.activeElement as HTMLElement | null;
    const oldOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const dialog = document.querySelector<HTMLElement>('[role="dialog"]');
    const focusable = () =>
      Array.from(
        dialog?.querySelectorAll<HTMLElement>(
          'button:not(:disabled),input,select,[tabindex="0"]',
        ) || [],
      );
    focusable()[0]?.focus();
    const handler = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setEditing(null);
        setGoalEdit(false);
      }
      if (event.key === "Tab") {
        const items = focusable(),
          first = items[0],
          last = items[items.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last?.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first?.focus();
        }
      }
    };
    document.addEventListener("keydown", handler);
    return () => {
      document.removeEventListener("keydown", handler);
      document.body.style.overflow = oldOverflow;
      previous?.focus();
    };
  }, [editing, goalEdit]);
  async function run(
    work: () => Promise<void>,
    success = "Salvo com sucesso.",
  ) {
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await work();
      await refresh();
      setNotice(success);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Não foi possível concluir.");
    } finally {
      setBusy(false);
    }
  }
  async function login(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(
      e.currentTarget,
      (e.nativeEvent as SubmitEvent).submitter as HTMLButtonElement,
    );
    setBusy(true);
    setError("");
    try {
      if (supabase) {
        const action = f.get("action");
        const credentials = {
          email: String(f.get("email")),
          password: String(f.get("password")),
        };
        const result =
          action === "signup"
            ? await supabase.auth.signUp(credentials)
            : await supabase.auth.signInWithPassword(credentials);
        if (result.error) throw result.error;
        if (!result.data.session) {
          setNotice("Confira seu e-mail para confirmar o cadastro.");
          return;
        }
        setSigned(true);
      } else {
        sessionStorage.setItem("repasse-demo", "yes");
        setSigned(true);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Falha ao entrar.");
    } finally {
      setBusy(false);
    }
  }
  function theme() {
    const d = !dark;
    setDark(d);
    document.documentElement.dataset.theme = d ? "dark" : "light";
    localStorage.setItem("repasse-theme", d ? "dark" : "light");
  }
  const message = (
    <>
      {error && (
        <div className="message error" role="alert">
          <AlertCircle size={18} />
          {error}
          <button aria-label="Fechar erro" onClick={() => setError("")}>
            <X size={16} />
          </button>
        </div>
      )}
      {notice && (
        <div className="message" role="status">
          <CheckCircle2 size={18} />
          {notice}
        </div>
      )}
    </>
  );
  if (!ready)
    return (
      <main className="loading" aria-busy="true">
        Carregando {PRODUCT_NAME}…
      </main>
    );
  if (!signed)
    return (
      <main className="login">
        <div className="login-story">
          <div className="brand">
            <Activity /> {PRODUCT_NAME}
          </div>
          <span className="eyebrow">MAIS CLAREZA. MAIS TRANQUILIDADE.</span>
          <h1>
            Seu cuidado faz a diferença.
            <br />
            <em>Seu repasse também.</em>
          </h1>
          <p>
            Acompanhe sua produção, entenda seus números e planeje o próximo
            mês.
          </p>
          <div className="login-stat">
            Sua produção, em um só lugar.
            <ArrowUpRight />
          </div>
        </div>
        <section className="card login-form">
          <span className="eyebrow">BEM-VINDO AO {PRODUCT_NAME}</span>
          <h2>Vamos cuidar dos seus números?</h2>
          <p className="muted">
            Entre para registrar sua produção e acompanhar seus recebimentos.
          </p>
          {message}
          <form onSubmit={login}>
            <label>
              E-mail
              <input
                name="email"
                type="email"
                required
                defaultValue={!supabase ? "demo@repasse.test" : ""}
                autoComplete="email"
              />
            </label>
            <label>
              Senha
              <input
                name="password"
                type="password"
                required
                minLength={8}
                defaultValue={!supabase ? "DemoRepasse2026!" : ""}
                autoComplete="current-password"
              />
            </label>
            <Button name="action" value="login" disabled={busy} type="submit">
              {busy ? "Entrando…" : "Entrar"}
              <ArrowUpRight size={18} />
            </Button>
            {supabase && (
              <Button
                name="action"
                value="signup"
                type="submit"
                variant="outline"
                disabled={busy}
              >
                Criar conta
              </Button>
            )}
          </form>
          {supabase && (
            <p>
              <a href="/recuperar-senha">Esqueci minha senha</a>
            </p>
          )}
          {!supabase && (
            <p className="demo-note">
              Ambiente demonstrativo local · dados fictícios de outubro e
              novembro de 2026. Nenhuma conexão com o MV. O botão Entrar abre a
              demonstração, sem autenticação real.
            </p>
          )}
        </section>
      </main>
    );
  if (onboarding)
    return (
      <main className="onboarding card">
        <h1>Complete seu perfil</h1>
        <p>
          Seu controle é pessoal. Para começar, basta informar seu nome e CRM.
        </p>
        {message}
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            const f = new FormData(e.currentTarget);
            await run(async () => {
              const {
                data: { user },
              } = await supabase!.auth.getUser();
              if (!user) throw new Error("Entre novamente.");
              const { error } = await supabase!.from("medicos").insert({
                medico_id: user.id,
                nome: f.get("nome"),
                crm: f.get("crm"),
                cd_prestador_mv: f.get("codigo") || null,
              });
              if (error) throw error;
            });
          }}
        >
          <label>
            Nome do médico
            <input name="nome" required />
          </label>
          <label>
            CRM / UF
            <input name="crm" required placeholder="CRM-SP 123456" />
          </label>
          <label>
            Código de prestador MV (opcional)
            <input name="codigo" pattern="[0-9]+" />
          </label>
          <Button disabled={busy}>Concluir cadastro</Button>
        </form>
      </main>
    );
  if (!data)
    return (
      <main className="loading">
        {message}
        <p>Carregando seus números…</p>
        <Button onClick={() => refresh().catch((e) => setError(e.message))}>
          Tentar novamente
        </Button>
      </main>
    );
  if (mode === "personal")
    return (
      <ProductModules
        data={data}
        onRefresh={refresh}
        dark={dark}
        onTheme={theme}
        onLogout={async () => {
          if (supabase) await supabase.auth.signOut();
          sessionStorage.removeItem("repasse-demo");
          setSigned(false);
          setData(null);
        }}
      />
    );
  const rows = data.rows.filter((r) => r.competencia === month),
    summary = data.summaries.find((s) => s.competencia === month),
    goal = number(data.goals.find((g) => g.competencia === month)?.valor),
    predicted = number(summary?.previsto),
    paid = number(summary?.pago),
    total = predicted + paid,
    gloss = number(summary?.glosado),
    missing = number(summary?.sem_regra);
  const statusData = statuses.map((s, i) => ({
    name: labels[s],
    value: rows.filter((r) => r.status === s).length,
    color: colors[i],
    amount: rows
      .filter((r) => r.status === s)
      .reduce((v, r) => v + number(r.valor_repasse_calc), 0),
  }));
  const groups = data.convenios.map((c) => {
    const records = rows.filter((r) => r.convenio_id === c.id);
    return {
      ...c,
      records,
      qtd: records.length,
      subtotal: records.reduce((v, r) => v + number(r.valor_repasse_calc), 0),
    };
  });
  const currentMonths = supabase
    ? [
        ...new Set([
          currentMonth,
          nextMonth,
          ...data.summaries.map((s) => s.competencia),
        ]),
      ].sort()
    : months;
  const filtered = rows.filter(
    (r) =>
      (!filterC || r.convenio_id === filterC) &&
      (!filterS || r.status === filterS) &&
      (!filterD || r.data_atendimento === filterD),
  );
  const table = (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Convênio</th>
            <th>Qtd.</th>
            <th>Consulta¹</th>
            <th>Honorário¹</th>
            <th>Subtotal</th>
          </tr>
        </thead>
        <tbody>
          {groups.map((c) => {
            const rates = [
              ...new Set(
                c.records
                  .filter((r) => r.regra_id)
                  .map((r) =>
                    r.modo === "fixo"
                      ? money(number(r.valor_honorario))
                      : `${number(r.percentual)}%`,
                  ),
              ),
            ];
            const consults = [
              ...new Set(c.records.map((r) => number(r.valor_consulta_calc))),
            ];
            return (
              <tr key={c.id}>
                <td>
                  <span className="convenio-dot" />
                  {c.nome}
                  <small className="muted">
                    Ticket: {money(c.qtd ? c.subtotal / c.qtd : 0)}
                  </small>
                </td>
                <td>{c.qtd}</td>
                <td>
                  {consults.length === 1
                    ? money(consults[0])
                    : consults.length
                      ? "Variável"
                      : "—"}
                </td>
                <td>
                  {rates.join(" / ") || (
                    <span className="warning">Sem regra</span>
                  )}
                </td>
                <td>
                  <strong>{money(c.subtotal)}</strong>
                  <span
                    className="share"
                    style={{
                      width: `${total ? (c.subtotal / total) * 100 : 0}%`,
                    }}
                  />
                </td>
              </tr>
            );
          })}
        </tbody>
        <tfoot>
          <tr>
            <td>Total</td>
            <td>{rows.length}</td>
            <td />
            <td />
            <td>{money(total)}</td>
          </tr>
        </tfoot>
      </table>
      <p className="footnote">
        ¹ Valores antes de dedução e glosa. Subtotal calculado por atendimento,
        conforme vigência; inclui pagos e agendados. Consultas sem regra não
        compõem os valores.
      </p>
    </div>
  );
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <a className="brand" href="/" aria-label={`${PRODUCT_NAME} início`}>
          <span className="brand-icon">
            <Activity size={22} />
          </span>
          <span>{PRODUCT_NAME}</span>
        </a>
        <p className="nav-caption">SEU CONSULTÓRIO, EM NÚMEROS</p>
        <nav>
          {visibleNav.map(([name, Icon]) => (
            <button
              key={name}
              onClick={() => setPage(name)}
              aria-current={page === name ? "page" : undefined}
            >
              <Icon size={19} />
              {name}
              {name === "Planos" && <small>PRO</small>}
            </button>
          ))}
        </nav>
        <div className="sidebar-tip">
          <Sparkles size={20} />
          <strong>Clareza para planejar.</strong>
          <p>Transforme sua produção em boas decisões.</p>
        </div>
        <div className="profile">
          <span className="avatar">MC</span>
          <div>
            <strong>{data.profile[0]?.nome || "Meu perfil"}</strong>
            <small>{data.profile[0]?.crm}</small>
          </div>
        </div>
      </aside>
      <main className="main">
        <header className="topbar">
          <div>
            <span className="eyebrow">VISÃO DO SEU CONSULTÓRIO</span>
            <h1>
              {page === "Dashboard"
                ? "Olá, " +
                  (data.profile[0]?.nome.split(" ")[0] || "doutor") +
                  " 👋"
                : page}
            </h1>
            <p className="muted">
              {page === "Dashboard"
                ? "Seu trabalho em números. Seu próximo passo com clareza."
                : "Acompanhe os detalhes da sua produção."}
            </p>
          </div>
          <div className="header-actions">
            {install && (
              <Button variant="outline" onClick={() => install.prompt()}>
                <Download size={16} />
                Instalar
              </Button>
            )}
            <button
              className="icon-button"
              onClick={theme}
              aria-label={dark ? "Ativar tema claro" : "Ativar tema escuro"}
            >
              {dark ? <Sun size={19} /> : <Moon size={19} />}
            </button>
            <button
              className="icon-button"
              aria-label="Sair"
              onClick={async () => {
                if (supabase) await supabase.auth.signOut();
                sessionStorage.removeItem("repasse-demo");
                setSigned(false);
                setData(null);
              }}
            >
              <LogOut size={19} />
            </button>
          </div>
        </header>
        <div className="period-row">
          <div className="period-title">
            <span className="live-dot" />
            {supabase
              ? "Seus dados, com segurança"
              : "Demonstração · dados fictícios"}
          </div>
          <div className="seg" aria-label="Competência">
            {currentMonths.map((m, i) => (
              <button
                aria-pressed={month === m}
                key={m}
                onClick={() => setMonth(m)}
              >
                {!supabase
                  ? i === 0
                    ? "Outubro 2026"
                    : "Novembro 2026"
                  : monthName(m)}
                <small>
                  {!supabase ? (i === 0 ? "Atual" : "Seguinte") : ""}
                </small>
              </button>
            ))}
          </div>
        </div>
        {message}
        {page === "Dashboard" && (
          <>
            <section className="hero">
              <div className="hero-top">
                <span className="eyebrow">A receber em {monthName(month)}</span>
                <span className="hero-badge">
                  Previsão de repasse <ArrowUpRight size={14} />
                </span>
              </div>
              <div className="hero-value">{money(predicted)}</div>
              <p>Seu próximo repasse, com mais previsibilidade.</p>
              <div className="hero-details">
                <span>
                  <CheckCircle2 size={16} />
                  Já recebido <b>{money(paid)}</b>
                </span>
                <span>{rows.length} consultas na competência</span>
              </div>
              <div className="goal">
                <div>
                  <span>
                    <Target size={15} /> Meta da competência
                  </span>
                  <button onClick={() => setGoalEdit(true)}>
                    {goal ? money(goal) : "Definir meta"} ↗
                  </button>
                </div>
                <div className="progress">
                  <i
                    style={{
                      width: `${goal ? Math.min(100, (total / goal) * 100) : 0}%`,
                    }}
                  />
                </div>
                <small>
                  {goal
                    ? `${Math.round((total / goal) * 100)}% da meta · produção prevista + recebida`
                    : "Defina uma meta para acompanhar seu progresso."}
                </small>
              </div>
            </section>
            <section className="kpis">
              <article className="card">
                <span>Consultas na competência</span>
                <strong>{rows.length}</strong>
                <small>Realizadas e agendadas</small>
              </article>
              <article className="card">
                <span>Ticket médio de repasse</span>
                <strong>{money(rows.length ? total / rows.length : 0)}</strong>
                <small>Por consulta registrada</small>
              </article>
              <article className="card">
                <span>Já recebido</span>
                <strong className="positive">{money(paid)}</strong>
                <small>Repasses com status pago</small>
              </article>
              <article className="card">
                <span>Glosas identificadas</span>
                <strong className="warning">{money(gloss)}</strong>
                <small>Valor descontado da previsão</small>
              </article>
            </section>
            <section className="dashboard-grid">
              <article className="card">
                <div className="section-head">
                  <h2>Produção por convênio</h2>
                  <button
                    className="text-button"
                    onClick={() => setPage("Por convênio")}
                  >
                    Ver detalhes <ArrowUpRight size={15} />
                  </button>
                </div>
                {table}
              </article>
              <article className="card">
                <h2>Seu ciclo de recebimento</h2>
                <p className="muted caption">
                  Distribuição das {rows.length} consultas
                </p>
                <div className="donut">
                  <ResponsiveContainer width="100%" height={190}>
                    <PieChart>
                      <Pie
                        isAnimationActive={false}
                        data={statusData}
                        dataKey="value"
                        nameKey="name"
                        innerRadius={59}
                        outerRadius={80}
                        paddingAngle={3}
                        stroke="none"
                      >
                        {statusData.map((s) => (
                          <Cell key={s.name} fill={s.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="donut-center">
                    <strong>{rows.length}</strong>
                    <small>consultas</small>
                  </div>
                </div>
                <div className="legend">
                  {statusData
                    .filter((s) => s.value > 0)
                    .map((s) => (
                      <div key={s.name}>
                        <i style={{ background: s.color }} />
                        <span>{s.name}</span>
                        <b>{s.value}</b>
                        <small>{money(s.amount)}</small>
                      </div>
                    ))}
                </div>
              </article>
            </section>
            <section className="card">
              <h2>Um olhar atento aos seus números</h2>
              <div className="alerts">
                {missing > 0 && (
                  <button onClick={() => setPage("Regras de repasse")}>
                    <span className="alert-icon">
                      <AlertCircle size={19} />
                    </span>
                    <span>
                      <strong>{missing} consultas sem regra de repasse</strong>
                      <small>
                        Complete as regras para uma previsão mais precisa.
                      </small>
                    </span>
                    <ArrowUpRight size={18} />
                  </button>
                )}
                {gloss > 0 && (
                  <button
                    onClick={() => {
                      setFilterS("glosado");
                      setPage("Atendimentos");
                    }}
                  >
                    <span className="alert-icon red">
                      <AlertCircle size={19} />
                    </span>
                    <span>
                      <strong>Há glosas nesta competência</strong>
                      <small>
                        {money(gloss)} em descontos. Confira os atendimentos.
                      </small>
                    </span>
                    <ArrowUpRight size={18} />
                  </button>
                )}
                {goal > total && (
                  <div className="alert-info">
                    <Target size={19} />
                    <span>
                      Faltam {money(goal - total)} para sua meta. Acompanhe a
                      agenda e os valores sem regra.
                    </span>
                  </div>
                )}
              </div>
            </section>
          </>
        )}
        {page === "Por convênio" && (
          <section className="card">
            <h2>De onde vem seu repasse</h2>
            <p className="muted">
              Quantidade × honorário, com deduções e glosas por atendimento.
            </p>
            {table}
          </section>
        )}
        {page === "Atendimentos" && (
          <section className="card">
            <div className="section-head">
              <h2>Seus atendimentos</h2>
              <span className="muted">{filtered.length} registros</span>
            </div>
            <div className="filters">
              <label>
                Convênio
                <select
                  aria-label="Convênio"
                  value={filterC}
                  onChange={(e) => setFilterC(e.target.value)}
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
                Status
                <select
                  aria-label="Status"
                  value={filterS}
                  onChange={(e) => setFilterS(e.target.value)}
                >
                  <option value="">Todos os status</option>
                  {statuses.map((s) => (
                    <option key={s} value={s}>
                      {labels[s]}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Dia
                <input
                  aria-label="Dia do atendimento"
                  type="date"
                  value={filterD}
                  onChange={(e) => setFilterD(e.target.value)}
                />
              </label>
              <Button
                variant="ghost"
                onClick={() => {
                  setFilterC("");
                  setFilterS("");
                  setFilterD("");
                }}
              >
                Limpar
              </Button>
            </div>
            <div className="appointments">
              {filtered.map((r) => (
                <details key={r.id}>
                  <summary>
                    <div>
                      <strong>{r.cd_atendimento}</strong>
                      <small>
                        {r.convenio_nome} · {date(r.data_atendimento)}
                      </small>
                      <small>
                        {r.origem === "importado"
                          ? "Importado"
                          : r.origem === "confirmado_hospital"
                            ? "Confirmado pelo hospital"
                            : "Informado por você"}
                      </small>
                    </div>
                    <span className={"badge " + r.status}>
                      {labels[r.status]}
                    </span>
                    <strong>
                      {r.regra_id
                        ? money(number(r.valor_repasse_calc))
                        : "Sem regra"}
                    </strong>
                  </summary>
                  <div className="detail">
                    <p>
                      Procedimento: {r.procedimento} · Origem: {r.origem}
                    </p>
                    <p>
                      Consulta: {money(number(r.valor_consulta_calc))} ·
                      Honorário:{" "}
                      {r.modo === "percentual"
                        ? number(r.percentual) + "%"
                        : money(number(r.valor_honorario))}{" "}
                      · Dedução: {number(r.deducao_pct)}%
                    </p>
                    <p>
                      Regra:{" "}
                      {r.regra_id || "Não encontrada na data do atendimento"}
                    </p>
                    <p>
                      Antes da glosa: {money(number(r.valor_bruto))} · Repasse
                      líquido:{" "}
                      {r.regra_id
                        ? money(number(r.valor_repasse_calc))
                        : "Pendente de regra"}
                    </p>
                  </div>
                </details>
              ))}
              {!filtered.length && (
                <p className="empty">
                  Nenhum atendimento encontrado para os filtros selecionados.
                </p>
              )}
            </div>
          </section>
        )}
        {page === "Regras de repasse" && (
          <section className="card">
            <div className="section-head">
              <div>
                <h2>Regras que dão clareza</h2>
                <p className="muted">
                  Vigência pela data do atendimento. Alterações recalculam a
                  previsão.
                </p>
              </div>
              <Button onClick={() => setEditing("new")}>
                <Plus size={16} />
                Nova regra
              </Button>
            </div>
            <div className="rule-grid">
              {data.rules.map((r) => (
                <article className="rule" key={r.id}>
                  <div className="section-head">
                    <h3>
                      {data.convenios.find((c) => c.id === r.convenio_id)?.nome}
                    </h3>
                    <span className="badge">
                      {r.modo === "fixo" ? "Valor fixo" : "Percentual"}
                    </span>
                  </div>
                  <strong className="rule-value">
                    {r.modo === "fixo"
                      ? money(number(r.valor_honorario))
                      : number(r.percentual) + "%"}
                  </strong>
                  <p>
                    Consulta {money(number(r.valor_consulta))} · Dedução{" "}
                    {number(r.deducao_pct)}%
                  </p>
                  <small>
                    {date(r.vigencia_ini)} →{" "}
                    {r.vigencia_fim ? date(r.vigencia_fim) : "Sem data final"}
                  </small>
                  <div className="rule-actions">
                    <Button variant="outline" onClick={() => setEditing(r)}>
                      Editar
                    </Button>
                    <Button
                      variant="ghost"
                      disabled={busy}
                      onClick={() => {
                        if (
                          confirm(
                            "Excluir esta regra? Atendimentos podem ficar sem valor calculado.",
                          )
                        )
                          run(
                            () => mutate("regras_repasse", "delete", {}, r.id),
                            "Regra excluída.",
                          );
                      }}
                    >
                      Excluir
                    </Button>
                  </div>
                </article>
              ))}
            </div>
            {!!supabase && (
              <form
                className="filters"
                onSubmit={async (e) => {
                  e.preventDefault();
                  const f = new FormData(e.currentTarget);
                  await run(async () => {
                    const {
                      data: { user },
                    } = await supabase!.auth.getUser();
                    const { error } = await supabase!
                      .from("convenios")
                      .insert({ medico_id: user!.id, nome: f.get("nome") });
                    if (error) throw error;
                  });
                }}
              >
                <label>
                  Adicionar convênio
                  <input name="nome" required />
                </label>
                <Button>Adicionar convênio</Button>
              </form>
            )}
          </section>
        )}
        {page === "Importar" && (
          <section className="card">
            <span className="eyebrow">SEUS DADOS, DO SEU JEITO</span>
            <h2>Importar produção</h2>
            <p className="muted">
              CSV ou XLSX, até 1.000 linhas e 2 MB. Somente identificador do
              atendimento e dados financeiros são enviados. Não inclua nomes,
              CPF ou outras informações de pacientes.
            </p>
            <label className="upload-zone">
              <Upload size={32} />
              <strong>Escolha sua planilha</strong>
              <span>CSV ou XLSX · primeira linha com cabeçalhos</span>
              <input
                type="file"
                accept=".csv,.xlsx"
                onChange={async (e) => {
                  setError("");
                  setImportErrors([]);
                  setSheet([]);
                  const file = e.target.files?.[0];
                  if (!file) return;
                  try {
                    if (file.size > 2 * 1024 * 1024)
                      throw new Error("Arquivo acima de 2 MB.");
                    let cells: string[][];
                    if (file.name.toLowerCase().endsWith(".xlsx")) {
                      cells = (await readXlsxFile(file)).map((row) =>
                        row.map((c) =>
                          c instanceof Date
                            ? c.toISOString().slice(0, 10)
                            : String(c ?? ""),
                        ),
                      );
                    } else {
                      const result = Papa.parse<string[]>(await file.text(), {
                        skipEmptyLines: "greedy",
                      });
                      if (result.errors.length)
                        throw new Error(
                          "CSV inválido: " + result.errors[0].message,
                        );
                      cells = result.data;
                    }
                    if (cells.length < 2 || cells.length > 1001)
                      throw new Error(
                        "A planilha deve ter entre 1 e 1.000 linhas.",
                      );
                    if (
                      cells[0].some((h) =>
                        /paciente|cpf|nome|nascimento|telefone|email/i.test(h),
                      )
                    )
                      throw new Error(
                        "Remova colunas de identificação pessoal antes de importar.",
                      );
                    setSheet(cells);
                    setMapping(
                      Object.fromEntries(
                        [
                          "cd_atendimento",
                          "convenio",
                          "data_atendimento",
                          "status",
                          "valor_consulta",
                        ].map((k) => [k, String(cells[0].indexOf(k))]),
                      ),
                    );
                  } catch (e) {
                    setError(
                      e instanceof Error ? e.message : "Arquivo inválido.",
                    );
                  }
                }}
              />
            </label>
            {sheet.length > 0 && (
              <>
                <h3>Mapeie as colunas</h3>
                <p className="muted">
                  Convênio deve corresponder ao nome cadastrado; data AAAA-MM-DD
                  ou DD/MM/AAAA. Competência será o mês do atendimento. Status:{" "}
                  {statuses.join(", ")}. Valor opcional, numérico em reais.
                </p>
                <div className="filters">
                  {[
                    "cd_atendimento",
                    "convenio",
                    "data_atendimento",
                    "status",
                    "valor_consulta",
                  ].map((k) => (
                    <label key={k}>
                      {k}
                      <select
                        value={mapping[k] ?? "-1"}
                        onChange={(e) =>
                          setMapping({ ...mapping, [k]: e.target.value })
                        }
                      >
                        <option value="-1">
                          {k === "valor_consulta"
                            ? "Usar valor da regra"
                            : "Selecione"}
                        </option>
                        {sheet[0].map((h, i) => (
                          <option value={i} key={i}>
                            {h}
                          </option>
                        ))}
                      </select>
                    </label>
                  ))}
                </div>
                <p>
                  {sheet.length - 1} linhas lidas. A importação é atômica e
                  substitui registros com o mesmo código de atendimento.
                </p>
                <Button
                  disabled={busy}
                  onClick={async () => {
                    const errors: string[] = [],
                      seen = new Set<string>();
                    const payload = sheet.slice(1).map((row, i) => {
                      const get = (key: string) =>
                        (row[number(mapping[key])] || "").trim();
                      const convenio = data.convenios.find(
                        (c) =>
                          c.nome.toLocaleLowerCase("pt-BR") ===
                          get("convenio").toLocaleLowerCase("pt-BR"),
                      );
                      let d = get("data_atendimento");
                      if (/^\d{2}\/\d{2}\/\d{4}$/.test(d))
                        d = d.split("/").reverse().join("-");
                      const id = get("cd_atendimento"),
                        status = get("status"),
                        value = get("valor_consulta");
                      const amount = value
                        ? Number(
                            value
                              .replace(/\.(?=\d{3}(?:\D|$))/g, "")
                              .replace(",", "."),
                          )
                        : null;
                      if (
                        !id ||
                        !convenio ||
                        !/^\d{4}-\d{2}-\d{2}$/.test(d) ||
                        isNaN(Date.parse(d)) ||
                        new Date(d).toISOString().slice(0, 10) !== d ||
                        !statuses.includes(status) ||
                        seen.has(id) ||
                        (value && (!Number.isFinite(amount) || amount! < 0))
                      )
                        errors.push(
                          `Linha ${i + 2}: verifique código único, convênio, data, status e valor.`,
                        );
                      seen.add(id);
                      return {
                        cd_atendimento: id,
                        convenio_id: convenio?.id,
                        data_atendimento: d,
                        competencia: d.slice(0, 7),
                        status,
                        origem: "importado",
                        procedimento: "Consulta",
                        valor_consulta: amount,
                      };
                    });
                    setImportErrors(errors);
                    if (errors.length) return;
                    await run(async () => {
                      await mutate("atendimentos", "upsert", payload);
                      setSheet([]);
                    }, "Importação concluída. Valores recalculados em SQL.");
                  }}
                >
                  <Upload size={16} />
                  Validar e importar {sheet.length - 1} atendimentos
                </Button>
                {importErrors.length > 0 && (
                  <div role="alert" className="error">
                    {importErrors.slice(0, 10).map((e) => (
                      <p key={e}>{e}</p>
                    ))}
                  </div>
                )}
              </>
            )}
          </section>
        )}
        {page === "Planos" && <PlansPreview />}
        <footer className="footer">
          <span>
            <Activity size={14} /> {PRODUCT_NAME}
          </span>
          <span>Previsão sujeita à conferência financeira do hospital.</span>
        </footer>
      </main>
      <nav className="bottom-nav" aria-label="Navegação principal">
        {visibleNav.map(([name, Icon]) => (
          <button
            key={name}
            aria-current={page === name ? "page" : undefined}
            onClick={() => setPage(name)}
          >
            <Icon size={20} />
            <span>
              {name === "Regras de repasse"
                ? "Regras"
                : name === "Por convênio"
                  ? "Convênios"
                  : name}
            </span>
          </button>
        ))}
      </nav>
      {editing && (
        <div className="modal-backdrop">
          <section
            className="modal card"
            role="dialog"
            aria-modal="true"
            aria-labelledby="rule-title"
          >
            <div className="section-head">
              <h2 id="rule-title">
                {editing === "new" ? "Nova regra" : "Editar regra"}
              </h2>
              <button
                className="icon-button"
                aria-label="Fechar"
                onClick={() => setEditing(null)}
              >
                <X />
              </button>
            </div>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                const f = new FormData(e.currentTarget);
                const values = Object.fromEntries(f);
                for (const k of [
                  "valor_consulta",
                  "valor_honorario",
                  "percentual",
                  "deducao_pct",
                ])
                  values[k] = String(Number(values[k]));
                await run(async () => {
                  await mutate(
                    "regras_repasse",
                    editing === "new" ? "insert" : "update",
                    {
                      ...values,
                      local_id: values.local_id || null,
                      vigencia_fim: values.vigencia_fim || null,
                    },
                    editing === "new" ? undefined : editing.id,
                  );
                  setEditing(null);
                });
              }}
            >
              <div className="form-grid">
                <label>
                  Local (opcional)
                  <select
                    name="local_id"
                    defaultValue={
                      editing === "new" ? "" : editing.local_id || ""
                    }
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
                    name="convenio_id"
                    required
                    defaultValue={editing === "new" ? "" : editing.convenio_id}
                  >
                    <option value="" disabled>
                      Selecione
                    </option>
                    {data.convenios.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.nome}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Procedimento
                  <input
                    name="tipo_procedimento"
                    required
                    defaultValue={
                      editing === "new" ? "Consulta" : editing.tipo_procedimento
                    }
                  />
                </label>
                <label>
                  Modo
                  <select
                    name="modo"
                    defaultValue={editing === "new" ? "fixo" : editing.modo}
                  >
                    <option value="fixo">Valor fixo</option>
                    <option value="percentual">Percentual</option>
                  </select>
                </label>
                {[
                  ["valor_consulta", "Valor da consulta (R$)"],
                  ["valor_honorario", "Honorário fixo (R$)"],
                  ["percentual", "Percentual (%)"],
                  ["deducao_pct", "Dedução (%)"],
                ].map(([k, label]) => (
                  <label key={k}>
                    {label}
                    <input
                      required
                      name={k}
                      type="number"
                      min="0"
                      max={
                        k.includes("pct") || k === "percentual"
                          ? 100
                          : 9999999999
                      }
                      step="0.01"
                      defaultValue={
                        editing === "new" ? 0 : String(editing[k as keyof Rule])
                      }
                    />
                  </label>
                ))}
                <label>
                  Início da vigência
                  <input
                    name="vigencia_ini"
                    type="date"
                    required
                    defaultValue={
                      editing === "new" ? month + "-01" : editing.vigencia_ini
                    }
                  />
                </label>
                <label>
                  Fim da vigência
                  <input
                    name="vigencia_fim"
                    type="date"
                    defaultValue={
                      editing === "new" ? "" : editing.vigencia_fim || ""
                    }
                  />
                </label>
              </div>
              <p className="footnote">
                No modo fixo, use honorário fixo; no percentual, use percentual
                sobre a consulta. Dedução aplicada antes da glosa.
              </p>
              <Button disabled={busy}>Salvar regra</Button>
              {message}
            </form>
          </section>
        </div>
      )}
      {goalEdit && (
        <div className="modal-backdrop">
          <section
            className="modal card"
            role="dialog"
            aria-modal="true"
            aria-labelledby="goal-title"
          >
            <div className="section-head">
              <h2 id="goal-title">Meta de {monthName(month)}</h2>
              <button
                className="icon-button"
                aria-label="Fechar"
                onClick={() => setGoalEdit(false)}
              >
                <X />
              </button>
            </div>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                const f = new FormData(e.currentTarget);
                await run(async () => {
                  await mutate("metas", "upsert", {
                    competencia: month,
                    valor: Number(f.get("valor")),
                  });
                  setGoalEdit(false);
                });
              }}
            >
              <label>
                Valor da meta (R$)
                <input
                  type="number"
                  name="valor"
                  min="0.01"
                  step="0.01"
                  defaultValue={goal || 10000}
                  required
                />
              </label>
              <Button disabled={busy}>Salvar meta</Button>
              {message}
            </form>
          </section>
        </div>
      )}
    </div>
  );
}
