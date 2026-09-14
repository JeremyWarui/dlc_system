import React, { useState, useMemo } from "react";

/* ============================================================
   KSG — Partnerships & MOU Management System
   Prototype v5  ·  matches schema v3.5

   v5 changes:
     · Typography and palette returned to IBM Plex / Newsreader over
       an ink-and-paper ground. All v4 logic retained.
     · ISSUE RESOLUTION: start, resolve, reopen, and revise target
       date. Resolving requires a date AND a statement of what was
       done — the same rule the database enforces.
     · Revising a target date requires a reason and keeps the
       original visible, so nothing quietly stops being overdue.

   Carried from v4:
     · Five value types across THREE accounting streams. Income,
       in-kind and avoided cost are never summed into "revenue".
     · measurement_basis: indicator | milestone | narrative.
     · Several indicators per activity, each scored on its own ratio.
     · Several implementing units per activity.
     · Status derived on every render, never stored.
   ============================================================ */

/* ---------- tokens: ink, paper, brass ---------- */
const T = {
  bg: "#F6F5F1",
  card: "#FFFFFF",
  border: "#DCDAD2",
  borderSubtle: "#EAE8E1",
  fg: "#141A17",
  fgMuted: "#6E736C",
  fgSubtle: "#9A9E97",
  primary: "#1E4D3B",
  rail: "#141A17",

  emerald: "#1E4D3B", emeraldBg: "#E7EFEA", emeraldBorder: "#C6DCD0",
  amber: "#9A6F26",   amberBg: "#F4EBD6",   amberBorder: "#E5D2A8",
  rose: "#8A2B23",    roseBg: "#F6E5E2",    roseBorder: "#E8C6C0",
  sky: "#3C4E5C",     skyBg: "#E6EBEF",     skyBorder: "#C8D4DD",
  violet: "#2F5E52",  violetBg: "#E4EEEA",  violetBorder: "#BFD8CE",
  zinc: "#6E736C",    zincBg: "#EFEEE9",    zincBorder: "#DCDAD2",
};

const R = { sm: 2, md: 3, lg: 4 };

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Newsreader:opsz,wght@6..72,400;6..72,500&family=IBM+Plex+Sans:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap');
.ksg, .ksg * { box-sizing: border-box; }
.ksg { font-family: 'IBM Plex Sans', ui-sans-serif, system-ui, sans-serif; -webkit-font-smoothing: antialiased; }
.serif { font-family: 'Newsreader', Georgia, serif; }
.tnum { font-family: 'IBM Plex Mono', ui-monospace, monospace; font-variant-numeric: tabular-nums; }
.eyebrow { font-family: 'IBM Plex Mono', ui-monospace, monospace; font-size: 10px;
  letter-spacing: 1.3px; text-transform: uppercase; font-weight: 500; }
.ksg-row:hover { background: #FAF9F6; cursor: pointer; }
.ksg-nav:hover { background: rgba(255,255,255,.07); }
.ksg-btn { transition: opacity .12s, background .12s; }
.ksg-btn:hover { opacity: .86; }
.ksg input:focus-visible, .ksg select:focus-visible, .ksg textarea:focus-visible,
.ksg button:focus-visible, .ksg [tabindex]:focus-visible {
  outline: 2px solid #9A6F26; outline-offset: 1px;
}
.ksg input::placeholder, .ksg textarea::placeholder { color: #9A9E97; }
.drawer { animation: slideIn .16s cubic-bezier(.32,.72,0,1); }
@keyframes slideIn { from { transform: translateX(18px); opacity: 0 } to { transform: none; opacity: 1 } }
@media (prefers-reduced-motion: reduce) { .ksg *, .drawer { animation: none !important; transition: none !important; } }
`;

/* ---------- thresholds: single source of truth ---------- */
const TH = {
  CUSTODY_AGEING: 60, CUSTODY_OVERDUE: 120,
  AT_RISK: 90, DORMANCY: 180,
  EXPIRY_WARNING: 120,
  IMPL_STRONG: 70, IMPL_PARTIAL: 35,
};

/* ---------- reference data ---------- */
const STAGES = [
  { code: "eoi", label: "Expression of interest", phase: "Inception", seq: 10, holder: "DLC" },
  { code: "inception", label: "Inception meeting", phase: "Inception", seq: 20, holder: "DLC" },
  { code: "drafting", label: "Drafting", phase: "Inception", seq: 30, holder: "DLC" },
  { code: "legal_internal", label: "Legal clearance", phase: "Inception", seq: 40, holder: "Legal Services" },
  { code: "legal_external", label: "Treasury / OAG", phase: "Inception", seq: 50, holder: "External" },
  { code: "mfa", label: "Transmitted to MFA", phase: "Inception", seq: 60, holder: "External" },
  { code: "concurrence", label: "Concurrence received", phase: "Inception", seq: 70, holder: "Partner" },
  { code: "signed", label: "Signed", phase: "Inception", seq: 80, holder: "DLC" },
  { code: "jtc", label: "JTC established", phase: "Activation", seq: 90, holder: "DLC" },
  { code: "workplan", label: "Workplan approved", phase: "Activation", seq: 100, holder: "DLC" },
  { code: "implementation", label: "Implementation", phase: "Implementation", seq: 110, holder: "Implementing unit" },
  { code: "closed", label: "Closed", phase: "Closure", seq: 120, holder: "—" },
];
const SEQ_SIGNED = 80, SEQ_IMPL = 110, SEQ_CLOSED = 120;
const sIdx = c => STAGES.findIndex(s => s.code === c);
const stageOf = c => STAGES[sIdx(c)] || STAGES[0];

const TONE = {
  Active: "emerald", Dormant: "amber", Pending: "sky",
  Completed: "violet", Expired: "zinc", Closed: "zinc",
};
const tone = t => ({
  fg: T[t], bg: T[t + "Bg"], border: T[t + "Border"],
});

const CATS = ["Training & Capacity Building", "Research", "Consultancy", "Conferencing"];
const TYPES = ["Local", "Regional", "International"];
const UNITS = ["DLC", "Nairobi Campus", "Baringo Campus", "Embu Campus", "Mombasa Campus",
  "Matuga Campus", "School of Management & Innovation (SMI)", "Institute of Development Studies (IDS)",
  "Centre for Devolution Studies", "Learning & Development (L&D)", "Legal Services", "Finance"];
const EXTERNAL_BODIES = ["National Treasury", "Office of the Attorney General", "Ministry of Foreign Affairs"];
const OFFICERS = ["A. Wanjiru", "P. Otieno", "S. Kimani", "J. Mutiso", "F. Achieng"];
const BASES = [
  { v: "indicator", l: "Indicator — achieved against target" },
  { v: "milestone", l: "Milestone — complete or not" },
  { v: "narrative", l: "Narrative — recorded, not measured" },
];
const VALUE_TYPES = [
  { v: "Revenue", stream: "income" },
  { v: "Grant", stream: "income" },
  { v: "In-kind asset", stream: "in_kind" },
  { v: "In-kind service", stream: "in_kind" },
  { v: "Cost saving", stream: "avoided" },
];
const streamOf = t => (VALUE_TYPES.find(x => x.v === t) || {}).stream;
const INCOME = ["Revenue", "Grant"];
const NON_CASH = ["In-kind asset", "In-kind service", "Cost saving"];
const ISSUE_TYPES = ["Financial", "Operational", "Legal"];
const SEVERITIES = ["High", "Medium", "Low"];
const ACT_STATUS = ["Not started", "Ongoing", "Completed", "Dormant", "Cancelled"];

/* ---------- helpers ---------- */
const TODAY = new Date("2026-08-30");
const days = d => d ? Math.round((TODAY - new Date(d)) / 864e5) : null;
const fmt = n => !n ? "—" : n >= 1e6 ? "KES " + (n / 1e6).toFixed(1) + "M" : "KES " + Math.round(n / 1e3) + "K";
const fmtFull = n => "KES " + Number(n).toLocaleString();
const dt = d => d ? new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "—";
const today = () => "2026-08-30";
const maxDate = (...ds) => { const v = ds.filter(Boolean).map(d => new Date(d)); return v.length ? new Date(Math.max(...v)).toISOString().slice(0, 10) : null; };
const fyOf = d => { const x = new Date(d), y = x.getFullYear(); return x.getMonth() + 1 >= 7 ? `${y}/${String((y + 1) % 100).padStart(2, "0")}` : `${y - 1}/${String(y % 100).padStart(2, "0")}`; };
const qOf = d => { const m = new Date(d).getMonth() + 1; return m >= 7 && m <= 9 ? "Q1" : m >= 10 ? "Q2" : m <= 3 ? "Q3" : "Q4"; };

const custodyBand = m => {
  const st = stageOf(m.stage);
  if (!["Inception", "Activation"].includes(st.phase)) return "not_applicable";
  const d = days(m.stageSince);
  return d > TH.CUSTODY_OVERDUE ? "overdue" : d > TH.CUSTODY_AGEING ? "ageing" : "fresh";
};
const custodyTone = b => b === "overdue" ? "rose" : b === "ageing" ? "amber" : b === "fresh" ? "emerald" : "zinc";

/* ---------- scoring: per-indicator ratio, then average ----------
   A study visit carries "visits: 1" and "participants: 20". Summing
   targets would add visits to people: 6/21 = 29% instead of 62%.   */
function activityScore(act, db) {
  if (act.basis === "narrative") return null;
  if (act.basis === "milestone") {
    if (act.status === "Cancelled") return null;
    return act.status === "Completed" ? 1 : 0;
  }
  const inds = db.indicators.filter(i => i.act === act.id && i.target > 0);
  if (!inds.length) return null;
  const ratios = inds.map(i => {
    const got = db.achievements.filter(u => u.ind === i.id).reduce((s, u) => s + u.value, 0);
    return Math.min(got / i.target, 1);
  });
  return ratios.reduce((a, b) => a + b, 0) / ratios.length;
}
function mouImplementation(mou, db) {
  const acts = db.acts.filter(a => a.mou === mou.id);
  if (!acts.length) return { pct: null, coverage: null, unscored: 0, total: 0 };
  const scores = acts.map(a => activityScore(a, db));
  const scored = scores.filter(s => s !== null);
  return {
    pct: scored.length ? Math.round(scored.reduce((a, b) => a + b, 0) / scored.length * 100) : null,
    coverage: Math.round(100 * scored.length / acts.length),
    unscored: acts.length - scored.length,
    total: acts.length,
  };
}

/* ---------- value: three streams, never one total ---------- */
function valueSummary(entries) {
  const sum = f => entries.filter(f).reduce((a, b) => a + b.amount, 0);
  return {
    revenue: sum(v => v.type === "Revenue"),
    grants: sum(v => v.type === "Grant"),
    realisedIncome: sum(v => INCOME.includes(v.type)),
    inKindAssets: sum(v => v.type === "In-kind asset"),
    inKindServices: sum(v => v.type === "In-kind service"),
    inKindTotal: sum(v => ["In-kind asset", "In-kind service"].includes(v.type)),
    costAvoided: sum(v => v.type === "Cost saving"),
    totalBenefit: sum(() => true),
  };
}

/* ---------- derived status ---------- */
function deriveStatus(mou, db) {
  const seq = stageOf(mou.stage).seq;
  const lastAch = db.acts.filter(a => a.mou === mou.id)
    .flatMap(a => db.indicators.filter(i => i.act === a.id))
    .flatMap(i => db.achievements.filter(u => u.ind === i.id))
    .map(u => u.date).sort().pop() || null;
  const lastVal = db.values.filter(v => v.mou === mou.id).map(v => v.date).sort().pop() || null;
  const lastActivity = maxDate(lastAch, lastVal);
  const clockFrom = maxDate(lastAch, lastVal, mou.implSince);
  const since = clockFrom ? days(clockFrom) : null;

  let status, why;
  if (seq >= SEQ_CLOSED) { status = "Closed"; why = "Stage is Closed."; }
  else if (mou.isCompleted) { status = "Completed"; why = "Marked complete by the Director."; }
  else if (mou.end && new Date(mou.end) < TODAY) { status = "Expired"; why = `End date passed ${dt(mou.end)}.`; }
  else if (seq < SEQ_SIGNED) { status = "Pending"; why = "Still in inception — not yet signed."; }
  else if (seq >= SEQ_IMPL && since !== null && since > TH.DORMANCY) {
    status = "Dormant"; why = `In implementation, nothing logged for ${since} days (threshold ${TH.DORMANCY}).`;
  } else {
    status = "Active";
    why = seq >= SEQ_IMPL ? `Implementing; last logged ${since} days ago.` : "Activated, implementation not yet begun.";
  }
  const atRisk = seq >= SEQ_IMPL && status === "Active" && since !== null && since > TH.AT_RISK;
  return { status, why, atRisk, since, lastActivity };
}

/* ================= seed ================= */





/* Who may resolve what. An issue names an accountable UNIT, but units are not
   users — the person clicking resolve is always a system user acting on what
   that unit reported back. */
const canResolve = (role, issue) => {
  if (["director", "officer"].includes(role)) return true;
  if (role === "legal") return issue.type === "Legal";
  if (role === "finance") return issue.type === "Financial";
  return false;
};

/* ---------- roles ---------- */
const ROLES = {
  dg: { name: "Director General", short: "DG", scope: "All partnerships · read only",
        views: ["overview", "register", "track", "ledger", "reports", "partners"], write: [] },
  director: { name: "Director, Linkages & Collaborations", short: "DLC", scope: "All partnerships · full authority",
        views: ["overview", "register", "track", "activities", "issues", "ledger", "reports", "partners", "alerts"],
        write: ["partner", "mou", "activity", "indicator", "achievement", "issue", "value", "stage", "assign", "close", "renew", "complete"] },
  finance: { name: "Finance", short: "FIN", scope: "Value ledger · valuation queue",
        views: ["overview", "register", "ledger", "reports"], write: ["value", "issue"] },
  legal: { name: "Legal Services", short: "LEG", scope: "MOUs in clearance · legal issues",
        views: ["overview", "register", "track", "issues", "alerts"], write: ["stage", "issue"] },
  officer: { name: "DLC Officer", short: "OFF", scope: "Assigned partnerships · data entry",
        views: ["overview", "register", "track", "activities", "issues", "ledger", "partners", "alerts"],
        write: ["partner", "activity", "indicator", "achievement", "issue", "value", "stage"] },
};
const VIEW_LABEL = {
  overview: "Dashboard", register: "MOU register", track: "MOU dossier",
  activities: "Activities", issues: "Issues", ledger: "Value ledger",
  reports: "Reports", partners: "Partners", alerts: "Alerts",
};

/* ================= primitives ================= */
// (utilities)

/* ================= clearance track ================= */

/* ================= status panel ================= */


/* ================= dashboard ================= */


/* ================= register ================= */
function Register({ role, db, go, openForm }) {
  const { mous, partnerOf, statusOf } = db;
  const [q, setQ] = useState(""), [f, setF] = useState("All");
  const scoped = role === "legal"
    ? mous.filter(m => ["drafting", "legal_internal", "legal_external", "mfa", "concurrence"].includes(m.stage))
    : mous;
  const rows = scoped.map(m => ({ m, ...statusOf(m), impl: mouImplementation(m, db) }))
    .filter(({ m, status }) => (f === "All" || status === f) &&
      (partnerOf(m).name.toLowerCase().includes(q.toLowerCase()) || m.ref.toLowerCase().includes(q.toLowerCase())));

  return (
    <div>
      <Head title="MOU register" sub={`Shared register · scoped to ${ROLES[role].scope.toLowerCase()}`}
        right={ROLES[role].write.includes("mou") && <Btn onClick={() => openForm("mou")}>Record new MOU</Btn>} />

      <div style={{ display: "flex", gap: 8, marginBottom: 14, flexWrap: "wrap" }}>
        <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search partner or reference"
          style={{ ...inputCss, flex: "1 1 240px", width: "auto" }} />
        <div style={{ display: "flex", gap: 2, background: T.zincBg, padding: 3, borderRadius: R.md }}>
          {["All", "Active", "Dormant", "Pending", "Expired"].map(s => (
            <button key={s} onClick={() => setF(s)} className="ksg-btn"
              style={{ padding: "5px 11px", fontSize: 12.5, borderRadius: R.sm, cursor: "pointer",
                fontFamily: "inherit", border: "none", fontWeight: 500,
                background: f === s ? T.card : "transparent", color: f === s ? T.fg : T.fgMuted,
                boxShadow: f === s ? "0 1px 2px rgba(0,0,0,.06)" : "none" }}>{s}</button>))}
        </div>
      </div>

      {!rows.length ? <Empty title="No partnerships match" hint="Clear the filter or widen your search." /> : (
        <Card style={{ overflowX: "auto", padding: "16px 4px 4px" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 1040 }}>
            <thead><tr>
              <Th w="19%">Partner</Th><Th w="10%">Reference</Th><Th>Type</Th>
              <Th w="13%">Stage</Th><Th right>Held</Th><Th w="12%">Status</Th>
              <Th right>Quiet</Th><Th w="12%">Implementation</Th><Th right>Income</Th><Th>Officer</Th>
            </tr></thead>
            <tbody>{rows.map(({ m, status, atRisk, since, impl }) => {
              const p = partnerOf(m), band = custodyBand(m);
              const inc = valueSummary(db.values.filter(v => v.mou === m.id)).realisedIncome;
              return (
                <tr key={m.id} className="ksg-row" tabIndex={0} onClick={() => go("track", m.id)}>
                  <Td><div style={{ fontWeight: 500 }}>{p.name}</div>
                    <div style={{ fontSize: 12.5, color: T.fgSubtle, marginTop: 2 }}>{p.country}</div></Td>
                  <Td num style={{ color: T.fgMuted, fontSize: 13 }}>{m.ref}</Td>
                  <Td><Badge>{p.type}</Badge></Td>
                  <Td style={{ fontSize: 13 }}>{stageOf(m.stage).label}</Td>
                  <Td num right><span style={{ fontWeight: 500, color: T[custodyTone(band)] }}>
                    {days(m.stageSince)}d</span></Td>
                  <Td><StatusBadge s={status} atRisk={atRisk} /></Td>
                  <Td num right style={{ color: since > TH.AT_RISK ? T.amber : T.fgSubtle, fontSize: 13 }}>
                    {since == null ? "—" : since + "d"}</Td>
                  <Td>{impl.pct == null
                    ? <span style={{ fontSize: 12.5, color: T.fgSubtle }}>not measured</span>
                    : <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <Bar pct={impl.pct} />
                        <span className="tnum" style={{ fontSize: 12.5, color: T.fgMuted, minWidth: 30 }}>{impl.pct}%</span>
                      </div>}</Td>
                  <Td num right style={{ fontSize: 13 }}>{inc ? fmt(inc) : "—"}</Td>
                  <Td style={{ fontSize: 13 }}>{m.officer ||
                    <span style={{ color: T.rose }}>unassigned</span>}</Td>
                </tr>);
            })}</tbody>
          </table>
        </Card>
      )}
    </div>
  );
}

/* ================= dossier ================= */
function Dossier({ db, selected, setSelected, role, openForm, act }) {
  const mou = db.mous.find(m => m.id === selected) || db.mous[0];
  const p = db.partnerOf(mou);
  const acts = db.acts.filter(a => a.mou === mou.id);
  const iss = db.issues.filter(i => i.mou === mou.id);
  const vals = db.values.filter(v => v.mou === mou.id);
  const events = db.events.filter(e => e.mou === mou.id);
  const [tab, setTab] = useState("track");
  const w = ROLES[role].write;
  const vsum = valueSummary(vals);
  const impl = mouImplementation(mou, db);
  const d = db.statusOf(mou);
  const next = STAGES[sIdx(mou.stage) + 1];
  const revPct = mou.contract ? Math.round(100 * vsum.realisedIncome / mou.contract) : null;

  return (
    <div>
      <Head eyebrow={`${mou.ref} · ${p.type} · ${p.country}`} title={p.name} sub={mou.title}
        right={<select value={mou.id} onChange={e => setSelected(+e.target.value)}
          style={{ ...inputCss, width: "auto", maxWidth: 300 }}>
          {db.mous.map(m => <option key={m.id} value={m.id}>{db.partnerOf(m).name}</option>)}</select>} />

      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 16 }}>
        <Metric label="Realised income" value={fmt(vsum.realisedIncome)}
          sub={revPct == null ? "no contract target set" : `${revPct}% of ${fmt(mou.contract)}`} t="emerald" />
        <Metric label="In-kind" value={fmt(vsum.inKindTotal)} sub="assets and services" t="amber" />
        <Metric label="Cost avoided" value={fmt(vsum.costAvoided)} sub="not in the accounts" t="sky" />
        <Metric label="Implementation" value={impl.pct == null ? "—" : impl.pct + "%"}
          sub={impl.pct == null ? "nothing measurable yet"
            : `${impl.coverage}% of activities measured`} />
      </div>

      <div style={{ display: "grid", gap: 16, marginBottom: 16 }}>
        <StatusPanel mou={mou} db={db} />
        <Card pad={20}><Track mou={mou} />
          {(w.includes("stage") || w.includes("close")) && (
            <div style={{ marginTop: 18, paddingTop: 16, borderTop: `1px solid ${T.borderSubtle}`,
              display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
              {w.includes("stage") && next && next.code !== "closed" && mou.stage !== "closed" &&
                <Btn sm onClick={() => openForm("stage")}>Advance to {next.label.toLowerCase()}</Btn>}
              {w.includes("stage") && mou.stage !== "closed" &&
                <Btn sm kind="outline" onClick={() => openForm("revert")}>Return to previous</Btn>}
              {w.includes("complete") && d.status === "Active" && stageOf(mou.stage).seq >= SEQ_IMPL &&
                <Btn sm kind="outline" onClick={() => act.markComplete(mou)}>Mark complete</Btn>}
              {w.includes("close") && mou.stage !== "closed" &&
                <Btn sm kind="danger" onClick={() => openForm("close")}>Close</Btn>}
              {w.includes("renew") && ["Expired", "Completed", "Closed"].includes(d.status) &&
                <Btn sm onClick={() => openForm("renew")}>Renew</Btn>}
              {w.includes("assign") && <Btn sm kind="ghost" onClick={() => openForm("assign")}>
                {mou.officer ? "Reassign" : "Assign officer"}</Btn>}
            </div>)}
        </Card>
      </div>

      <div style={{ display: "flex", gap: 2, marginBottom: 16, background: T.zincBg,
        padding: 3, borderRadius: R.md, width: "fit-content", maxWidth: "100%", overflowX: "auto" }}>
        {[["track", "Stage history"], ["activities", `Activities · ${acts.length}`],
          ["value", `Value · ${vals.length}`], ["issues", `Issues · ${iss.length}`]].map(([t, l]) => (
          <button key={t} onClick={() => setTab(t)} className="ksg-btn"
            style={{ padding: "6px 13px", fontSize: 13, borderRadius: R.sm, cursor: "pointer",
              fontFamily: "inherit", border: "none", fontWeight: 500, whiteSpace: "nowrap",
              background: tab === t ? T.card : "transparent", color: tab === t ? T.fg : T.fgMuted,
              boxShadow: tab === t ? "0 1px 2px rgba(0,0,0,.06)" : "none" }}>{l}</button>))}
      </div>

      {tab === "track" && (
        <Card pad={18}>
          {!events.length && <div style={{ fontSize: 13, color: T.fgMuted }}>No transitions recorded.</div>}
          {[...events].reverse().map((e, i) => (
            <div key={e.id} style={{ display: "flex", gap: 12, padding: "12px 0",
              borderBottom: i === events.length - 1 ? "none" : `1px solid ${T.borderSubtle}` }}>
              <div style={{ width: 7, height: 7, borderRadius: 999, marginTop: 6, flexShrink: 0,
                background: e.exited ? T.emerald : T.amber }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13.5, fontWeight: e.exited ? 400 : 600 }}>{stageOf(e.stage).label}</div>
                <div className="tnum" style={{ fontSize: 12.5, color: T.fgMuted, marginTop: 2 }}>
                  {e.holder} · entered {dt(e.entered)}
                  {e.exited ? ` · exited ${dt(e.exited)} · ${Math.round((new Date(e.exited) - new Date(e.entered)) / 864e5)} days`
                            : ` · open, ${days(e.entered)} days`}</div>
                {e.remarks && <div style={{ fontSize: 13, color: T.fgMuted, marginTop: 5 }}>{e.remarks}</div>}
              </div>
            </div>))}
        </Card>
      )}

      {tab === "activities" && (<>
        {w.includes("activity") && <div style={{ marginBottom: 12 }}>
          <Btn onClick={() => openForm("activity")}>Add activity</Btn></div>}
        {acts.length ? acts.map(a => {
          const inds = db.indicators.filter(i => i.act === a.id);
          const sc = activityScore(a, db);
          return (
            <Card key={a.id} pad={16} style={{ marginBottom: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 12,
                flexWrap: "wrap", marginBottom: 10 }}>
                <div style={{ flex: "1 1 260px" }}>
                  <div className="eyebrow" style={{ color: T.fgMuted }}>{a.name}</div>
                  <div style={{ fontSize: 12.5, color: T.fgMuted, marginTop: 3 }}>
                    {a.cat} · {a.units.join(", ")}</div>
                </div>
                <div style={{ display: "flex", gap: 6, alignItems: "flex-start", flexWrap: "wrap" }}>
                  <Badge t={a.basis === "narrative" ? "zinc" : a.basis === "milestone" ? "violet" : "sky"}>
                    {a.basis}</Badge>
                  <Badge t={a.status === "Completed" ? "emerald" : a.status === "Ongoing" ? "sky" : "zinc"}>
                    {a.status}</Badge>
                  {sc == null ? <Badge>not scored</Badge>
                    : <Badge t={sc >= .7 ? "emerald" : sc >= .35 ? "amber" : "rose"}>
                        {Math.round(sc * 100)}%</Badge>}
                </div>
              </div>
              {a.basis === "narrative" && (
                <div style={{ fontSize: 12.5, color: T.fgMuted }}>
                  Recorded but not measured — excluded from the implementation denominator.
                </div>
              )}
              {a.basis === "indicator" && (inds.length ? (
                <div style={{ borderTop: `1px solid ${T.borderSubtle}`, paddingTop: 12 }}>
                  {inds.map(i => {
                    const got = db.achievements.filter(u => u.ind === i.id).reduce((s, u) => s + u.value, 0);
                    const pct = i.target ? Math.round(Math.min(got / i.target, 1) * 100) : 0;
                    return (
                      <div key={i.id} style={{ display: "flex", alignItems: "center", gap: 12,
                        marginBottom: 9 }}>
                        <div style={{ flex: "1 1 180px", fontSize: 13 }}>{i.name}
                          <span style={{ color: T.fgSubtle }}> · {i.unit}</span></div>
                        <div style={{ flex: "0 1 130px", display: "flex", alignItems: "center", gap: 8 }}>
                          <Bar pct={pct} />
                          <span className="tnum" style={{ fontSize: 12.5, color: T.fgMuted, minWidth: 54,
                            textAlign: "right" }}>{got}/{i.target}</span>
                        </div>
                        {w.includes("achievement") &&
                          <Btn sm kind="outline" onClick={() => act.logAchievement(a, i)}>Log</Btn>}
                      </div>);
                  })}
                  <div style={{ fontSize: 12, color: T.fgSubtle, marginTop: 8 }}>
                    Activity score is the average of these ratios — units differ, so targets are never summed.
                  </div>
                </div>
              ) : (
                <div style={{ borderTop: `1px solid ${T.borderSubtle}`, paddingTop: 12,
                  display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center",
                  flexWrap: "wrap" }}>
                  <span style={{ fontSize: 12.5, color: T.amber }}>
                    No indicator yet — this activity cannot be measured.</span>
                  {w.includes("indicator") &&
                    <Btn sm kind="outline" onClick={() => act.addIndicator(a)}>Add indicator</Btn>}
                </div>
              ))}
              {a.basis === "indicator" && inds.length > 0 && w.includes("indicator") && (
                <div style={{ marginTop: 4 }}>
                  <Btn sm kind="ghost" onClick={() => act.addIndicator(a)}>+ Add another indicator</Btn>
                </div>
              )}
            </Card>);
        }) : <Empty title="No activities recorded"
          hint="An MOU in implementation with nothing logged is what turns dormant. Add the first workplan activity."
          action={w.includes("activity") && <Btn onClick={() => openForm("activity")}>Add activity</Btn>} />}
      </>)}

      {tab === "value" && (<>
        {w.includes("value") && <div style={{ marginBottom: 12 }}>
          <Btn onClick={() => openForm("value")}>Record value</Btn></div>}
        {vals.length ? (<>
          <Card pad={16} style={{ marginBottom: 12 }}>
            <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
              {[["Realised income", vsum.realisedIncome, "emerald", "enters the accounts"],
                ["In-kind", vsum.inKindTotal, "amber", "assets and services"],
                ["Cost avoided", vsum.costAvoided, "sky", "enters no ledger"],
                ["Total economic benefit", vsum.totalBenefit, null, "management figure only"]].map(([l, v, t, s]) => (
                <div key={l} style={{ flex: "1 1 150px" }}>
                  <div style={{ fontSize: 12.5, color: T.fgMuted }}>{l}</div>
                  <div className="tnum" style={{ fontSize: 18, fontWeight: 600, marginTop: 3,
                    color: t ? T[t] : T.fg }}>{fmt(v)}</div>
                  <div style={{ fontSize: 12, color: T.fgSubtle, marginTop: 2 }}>{s}</div>
                </div>))}
            </div>
          </Card>
          <Card style={{ overflowX: "auto", padding: "16px 4px 4px" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 720 }}>
              <thead><tr><Th>Date</Th><Th>FY</Th><Th>Type</Th><Th>Stream</Th>
                <Th w="28%">Description</Th><Th>Verification</Th><Th right>Amount</Th></tr></thead>
              <tbody>{vals.map(v => {
                const st = streamOf(v.type);
                return (
                  <tr key={v.id}>
                    <Td num style={{ color: T.fgMuted, fontSize: 13 }}>{dt(v.date)}</Td>
                    <Td num style={{ fontSize: 13 }}>{fyOf(v.date)} {qOf(v.date)}</Td>
                    <Td><Badge t={st === "income" ? "emerald" : st === "in_kind" ? "amber" : "sky"}>
                      {v.type}</Badge></Td>
                    <Td style={{ fontSize: 12.5, color: T.fgMuted }}>{st}</Td>
                    <Td>{v.desc}</Td>
                    <Td style={{ fontSize: 12.5, color: v.evidence ? T.fgMuted : T.fgSubtle }}>
                      {v.evidence || "—"}</Td>
                    <Td num right style={{ fontWeight: 500 }}>{fmtFull(v.amount)}</Td>
                  </tr>);
              })}</tbody>
            </table>
          </Card>
        </>) : <Empty title="Nothing recorded against this partnership"
          hint="Record revenue, grants, in-kind receipts or cost savings as they arise."
          action={w.includes("value") && <Btn onClick={() => openForm("value")}>Record value</Btn>} />}
      </>)}

      {tab === "issues" && (<>
        {w.includes("issue") && <div style={{ marginBottom: 12 }}>
          <Btn onClick={() => openForm("issue")}>Log issue</Btn></div>}
        {iss.length ? <IssueTable rows={iss} db={db} role={role} act={act} /> :
          <Empty title="No issues logged" hint="Log an issue when a partnership stalls."
            action={w.includes("issue") && <Btn onClick={() => openForm("issue")}>Log issue</Btn>} />}
      </>)}
    </div>
  );
}

/* ================= shared registers ================= */








/* ================= app ================= */
export default function App() {
  const [role, setRole] = useState("director");
  const [view, setView] = useState("overview");
  const [selected, setSelected] = useState(8);
  const [toast, setToast] = useState(null);

  const [partners, setPartners] = useState(SEED_PARTNERS);
  const [mous, setMous] = useState(SEED_MOUS);
  const [acts, setActs] = useState(SEED_ACTS);
  const [indicators, setIndicators] = useState(SEED_INDICATORS);
  const [achievements, setAchievements] = useState(SEED_ACH);
  const [values, setValues] = useState(SEED_VALUES);
  const [issues, setIssues] = useState(SEED_ISSUES);
  const [events, setEvents] = useState(() =>
    SEED_MOUS.flatMap(m => STAGES.slice(0, sIdx(m.stage) + 1).map((s, i, arr) => ({
      id: `${m.id}-${s.code}`, mou: m.id, stage: s.code,
      entered: i === arr.length - 1 ? m.stageSince : m.start,
      exited: i === arr.length - 1 ? null : m.stageSince,
      holder: i === arr.length - 1 && m.holder ? m.holder
        : ["External", "Partner"].includes(s.holder) ? "DLC" : s.holder,
      remarks: "" }))));

  const [form, setForm] = useState(null);
  const [d, setD] = useState({});
  React.useEffect(() => { setD(form ? { ...form.data } : {}); }, [form]);
  const set = k => e => setD({ ...d, [k]: e.target.value });
  const openForm = (kind, data = {}) => setForm({ kind, data });
  const close = () => setForm(null);
  const say = m => { setToast(m); setTimeout(() => setToast(null), 4200); };

  const partnerOf = m => partners.find(p => p.id === m.partnerId) || { name: "—", type: "—", country: "—" };
  const base = { partners, mous, acts, indicators, achievements, values, issues, events, partnerOf };
  const statusOf = m => deriveStatus(m, base);
  const db = { ...base, statusOf };

  const mou = mous.find(m => m.id === selected) || mous[0];
  const nid = arr => Math.max(0, ...arr.map(x => x.id)) + 1;
  const go = (v, id) => { setView(v); if (id) setSelected(id); };
  const allowed = ROLES[role].views;
  const current = allowed.includes(view) ? view : "overview";
  const switchRole = r => { setRole(r); if (!ROLES[r].views.includes(view)) setView("overview"); };

  const moveStage = (code, remarks, holder, eff) => {
    setEvents(ev => [...ev.map(e => e.mou === mou.id && !e.exited ? { ...e, exited: eff } : e),
      { id: `${mou.id}-${code}-${Date.now()}`, mou: mou.id, stage: code, entered: eff, exited: null,
        holder: holder || (["External", "Partner"].includes(stageOf(code).holder) ? "DLC" : stageOf(code).holder),
        remarks: remarks || "" }]);
    setMous(ms => ms.map(m => m.id === mou.id
      ? { ...m, stage: code, stageSince: eff, holder: holder || null,
          implSince: code === "implementation" ? eff : m.implSince } : m));
  };

  const act = {
    logAchievement: (a, i) => openForm("achievement", { actId: a.id, indId: i.id,
      indName: i.name, indUnit: i.unit, target: i.target, actName: a.name }),
    addIndicator: a => openForm("indicator", { actId: a.id, actName: a.name }),
    markComplete: m => { setMous(ms => ms.map(x => x.id === m.id ? { ...x, isCompleted: true } : x));
      say(`${m.ref} marked complete.`); },
    startIssue: i => { setIssues(list => list.map(x => x.id === i.id ? { ...x, status: "Ongoing" } : x));
      say("Issue moved to Ongoing."); },
    resolveIssue: i => openForm("resolve", { id: i.id, desc: i.desc, type: i.type, raised: i.raised }),
    reopenIssue: i => openForm("reopen", { id: i.id, desc: i.desc, resolution: i.resolution }),
    reviseTarget: i => openForm("revise", { id: i.id, desc: i.desc, target: i.target,
      origTarget: i.origTarget, count: i.revisions.length }),
  };

  const save = () => {
    switch (form?.kind) {
      case "partner": {
        if (!d.name || !d.type) return say("Partner name and type are required.");
        setPartners([...partners, { id: nid(partners), name: d.name, country: d.country || "—",
          type: d.type, person: d.person || "", contact: d.contact || "" }]);
        say(`${d.name} added.`); break;
      }
      case "mou": {
        if (!d.partnerId || !d.title) return say("Partner and title are required.");
        const id = nid(mous), stage = d.stage || "eoi";
        const ref = d.ref || `MOU-26-${String(id).padStart(3, "0")}`;
        setMous([...mous, { id, ref, partnerId: +d.partnerId, title: d.title, stage,
          stageSince: today(), implSince: stage === "implementation" ? today() : null,
          start: d.start || today(), end: d.end || today(), cats: d.cats || [],
          officer: d.officer || "", contract: d.contract ? +d.contract : null,
          prev: null, isCompleted: false, holder: null }]);
        setEvents([...events, { id: `${id}-${stage}`, mou: id, stage, entered: today(),
          exited: null, holder: stageOf(stage).holder, remarks: "Record opened" }]);
        setSelected(id); setView("track"); say(`${ref} opened at ${stageOf(stage).label.toLowerCase()}.`); break;
      }
      case "activity": {
        if (!d.name || !d.cat || !(d.units || []).length)
          return say("Activity, area and at least one implementing unit are required.");
        setActs([...acts, { id: nid(acts), mou: mou.id, name: d.name, cat: d.cat,
          units: d.units, basis: d.basis || "indicator", status: d.status || "Not started",
          planned: d.planned ? +d.planned : null, start: d.start || today(), end: d.end || today() }]);
        say(d.basis === "narrative"
          ? "Activity added. Narrative activities are excluded from the implementation score."
          : "Activity added. Add at least one indicator so it can be measured."); break;
      }
      case "indicator": {
        if (!d.name || !d.unit) return say("Indicator name and unit of measure are required.");
        setIndicators([...indicators, { id: nid(indicators), act: d.actId, name: d.name,
          unit: d.unit, target: d.target ? +d.target : 1 }]);
        say(`Indicator added — target ${d.target || 1} ${d.unit}.`); break;
      }
      case "achievement": {
        if (!d.value) return say("Enter the amount achieved.");
        const before = statusOf(mou).status;
        const entry = { id: nid(achievements), ind: d.indId, date: d.date || today(),
          value: +d.value, note: d.note || "" };
        setAchievements([...achievements, entry]);
        const after = deriveStatus(mou, { ...base, achievements: [...achievements, entry] });
        say(before !== after.status
          ? `Logged. ${mou.ref} moved ${before} → ${after.status}. Status is derived, not set.`
          : "Achievement logged. Dormancy clock reset.");
        break;
      }
      case "value": {
        if (!d.type || !d.amount) return say("Value type and amount are required.");
        if (NON_CASH.includes(d.type) && !d.evidence)
          return say("Non-cash entries need a valuation basis. For a cost saving that means the counterfactual — what KSG would have paid.");
        const before = statusOf(mou).status;
        const entry = { id: nid(values), mou: mou.id, act: d.act ? +d.act : null, type: d.type,
          desc: d.desc || "", amount: +d.amount, date: d.date || today(), evidence: d.evidence || "" };
        setValues([...values, entry]);
        const after = deriveStatus(mou, { ...base, values: [...values, entry] });
        say(before !== after.status
          ? `${fmtFull(d.amount)} recorded. ${mou.ref} moved ${before} → ${after.status}.`
          : `${fmtFull(d.amount)} recorded as ${streamOf(d.type)}.`);
        break;
      }
      case "issue": {
        if (!d.type || !d.desc) return say("Issue type and description are required.");
        const tgt = d.target || today();
        setIssues([...issues, { id: nid(issues), mou: +(d.mou || mou.id), type: d.type, desc: d.desc,
          sev: d.sev || "Medium", status: "Pending", unit: d.unit || "DLC",
          target: tgt, origTarget: tgt, revisions: [], raised: today(),
          resolvedOn: null, resolution: "" }]);
        say("Issue logged as Pending."); break;
      }
      case "resolve": {
        // Mirrors the DB constraint issue_resolved_complete: a resolution
        // needs BOTH a date and a statement of what was actually done.
        if (!d.resolution || d.resolution.trim().length < 10)
          return say("State what was done to resolve it — the database rejects a resolution without one.");
        const on = d.resolvedOn || today();
        if (new Date(on) < new Date(d.raised))
          return say("Resolution date cannot precede the date the issue was raised.");
        setIssues(list => list.map(x => x.id === d.id
          ? { ...x, status: "Resolved", resolvedOn: on, resolution: d.resolution.trim() } : x));
        say(`Issue resolved after ${Math.round((new Date(on) - new Date(d.raised)) / 864e5)} days.`);
        break;
      }
      case "reopen": {
        if (!d.why) return say("Give a reason for reopening.");
        setIssues(list => list.map(x => x.id === d.id
          ? { ...x, status: "Ongoing", resolvedOn: null,
              resolution: `${x.resolution}\n\nReopened ${dt(today())}: ${d.why}` } : x));
        say("Issue reopened. The previous resolution is kept on the record."); break;
      }
      case "revise": {
        if (!d.newTarget) return say("Pick the new target date.");
        if (!d.why || d.why.trim().length < 5)
          return say("A reason is required. Moving a target date without one is how an issue log stops meaning anything.");
        setIssues(list => list.map(x => x.id === d.id
          ? { ...x, target: d.newTarget,
              revisions: [...x.revisions, { from: x.target, to: d.newTarget, on: today(), why: d.why.trim() }] }
          : x));
        say(`Target moved to ${dt(d.newTarget)}. The original remains visible on the record.`); break;
      }
      case "stage": {
        const nx = STAGES[sIdx(mou.stage) + 1];
        moveStage(nx.code, d.remarks, d.holder, d.effective || today());
        say(`${mou.ref} advanced to ${nx.label.toLowerCase()}.`); break;
      }
      case "revert": {
        const pv = STAGES[sIdx(mou.stage) - 1];
        if (!pv) return say("Already at the first stage.");
        moveStage(pv.code, d.remarks || "Returned for correction", null, d.effective || today());
        say(`Returned to ${pv.label.toLowerCase()}.`); break;
      }
      case "close": {
        if (!d.reason) return say("A closure reason is required.");
        moveStage("closed", d.reason, null, d.effective || today());
        say(`${mou.ref} closed.`); break;
      }
      case "renew": {
        const id = nid(mous);
        const gen = (mou.ref.match(/\/R(\d+)$/) ? +mou.ref.match(/\/R(\d+)$/)[1] + 1 : 1);
        const ref = mou.ref.replace(/\/R\d+$/, "") + `/R${gen}`;
        setMous([...mous, { ...mou, id, ref, prev: mou.id, stage: "signed",
          stageSince: d.effective || today(), implSince: null, isCompleted: false, holder: null,
          start: d.start || today(), end: d.end || today(),
          contract: d.contract ? +d.contract : mou.contract }]);
        setEvents([...events, { id: `${id}-signed`, mou: id, stage: "signed",
          entered: d.effective || today(), exited: null, holder: "DLC",
          remarks: `Renewal of ${mou.ref}` }]);
        setSelected(id); say(`${ref} created — re-enters at signing, then activation.`); break;
      }
      case "assign": {
        setMous(mous.map(m => m.id === mou.id ? { ...m, officer: d.officer || "" } : m));
        say(d.officer ? `${mou.ref} assigned to ${d.officer}.` : "Officer cleared."); break;
      }
      default: break;
    }
    close();
  };

  const G2 = { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 14px" };
  const F = form?.kind;
  const nextStage = STAGES[sIdx(mou.stage) + 1];

  return (
    <div className="ksg" style={{ background: T.bg, minHeight: "100vh", color: T.fg }}>
      <style>{CSS}</style>
      <div style={{ display: "flex", minHeight: "100vh" }}>
        <nav style={{ width: 232, background: T.rail, flexShrink: 0, padding: "20px 0",
          position: "sticky", top: 0, height: "100vh", overflowY: "auto" }}>
          <div style={{ padding: "0 18px 18px", borderBottom: "1px solid rgba(255,255,255,.09)" }}>
            <div className="serif" style={{ color: "#fff", fontSize: 17, lineHeight: 1.25 }}>
              Kenya School<br />of Government</div>
            <div className="eyebrow" style={{ color: T.amber, marginTop: 8 }}>Partnerships &amp; MOUs</div>
          </div>
          <div style={{ padding: "12px 10px" }}>
            {allowed.map(v => (
              <button key={v} onClick={() => go(v)} className="ksg-nav"
                style={{ display: "block", width: "100%", textAlign: "left", padding: "8px 12px",
                  fontSize: 13.5, border: "none", cursor: "pointer", fontFamily: "inherit",
                  borderRadius: R.md, marginBottom: 1, fontWeight: current === v ? 500 : 400,
                  borderLeft: `2px solid ${current === v ? T.amber : "transparent"}`,
                  background: current === v ? "rgba(255,255,255,.10)" : "transparent",
                  color: current === v ? "#fff" : "rgba(255,255,255,.62)" }}>{VIEW_LABEL[v]}</button>))}
          </div>
          <div style={{ padding: "14px 18px", borderTop: "1px solid rgba(255,255,255,.09)", marginTop: 4 }}>
            <div className="eyebrow" style={{ color: "rgba(255,255,255,.4)", marginBottom: 10 }}>Viewing as</div>
            {Object.entries(ROLES).map(([k, r]) => (
              <button key={k} onClick={() => switchRole(k)} className="ksg-nav"
                style={{ display: "block", width: "100%", textAlign: "left", padding: "6px 8px",
                  marginLeft: -8, fontSize: 12.5, border: "none", cursor: "pointer", borderRadius: R.md,
                  fontFamily: "inherit", fontWeight: role === k ? 500 : 400,
                  background: role === k ? "rgba(154,111,38,.25)" : "transparent",
                  color: role === k ? T.amber : "rgba(255,255,255,.55)" }}>{r.name}</button>))}
          </div>
        </nav>

        <main style={{ flex: 1, minWidth: 0 }}>
          <header style={{ background: T.card, borderBottom: `1px solid ${T.border}`,
            padding: "12px 28px", display: "flex", justifyContent: "space-between",
            alignItems: "center", gap: 16, flexWrap: "wrap", position: "sticky", top: 0, zIndex: 10 }}>
            <div style={{ fontSize: 13, color: T.fgMuted }}>
              <span style={{ color: T.fg, fontWeight: 500 }}>{ROLES[role].name}</span>
              <span style={{ margin: "0 8px", color: T.border }}>·</span>{ROLES[role].scope}</div>
            <div className="tnum" style={{ fontSize: 12.5, color: T.fgMuted }}>30 Aug 2026 · FY 2026/27 Q1</div>
          </header>

          <div style={{ padding: "26px 28px 60px", maxWidth: 1320 }}>
            {current === "overview" && <Dashboard role={role} db={db} go={go} />}
            {current === "register" && <Register role={role} db={db} go={go} openForm={openForm} />}
            {current === "track" && <Dossier db={db} selected={selected} setSelected={setSelected}
              role={role} openForm={openForm} act={act} />}
            {current === "activities" && <Activities db={db} role={role} act={act} />}
            {current === "issues" && <Issues role={role} db={db} openForm={openForm} act={act} />}
            {current === "ledger" && <Ledger db={db} role={role} openForm={openForm} />}
            {current === "reports" && <Reports db={db} />}
            {current === "partners" && <Partners db={db} role={role} openForm={openForm} go={go} />}
            {current === "alerts" && <Alerts role={role} db={db} go={go} />}

            <div style={{ marginTop: 40, paddingTop: 18, borderTop: `1px solid ${T.border}`,
              fontSize: 12.5, color: T.fgSubtle, lineHeight: 1.6 }}>
              Prototype with illustrative data · matches schema v3.5. Status is derived on every render,
              never stored. Try logging achievement against the AAPAM roundtable to watch it return to
              Active, or resolve an issue as Legal Services to see the resolution rule bite.
            </div>
          </div>
        </main>
      </div>

      {/* ---------- forms ---------- */}
      <Drawer open={F === "partner"} title="Add a partner"
        sub="Recorded once — every MOU signed with them attaches to this record"
        onClose={close} onSave={save} saveLabel="Add partner">
        <Field label="Partner name" span><Txt value={d.name || ""} onChange={set("name")} /></Field>
        <div style={G2}>
          <Field label="Country"><Txt value={d.country || ""} onChange={set("country")} /></Field>
          <Field label="Type" hint="reach"><Sel options={TYPES} value={d.type || ""} onChange={set("type")} /></Field>
          <Field label="Contact person"><Txt value={d.person || ""} onChange={set("person")} /></Field>
          <Field label="Contact details"><Txt value={d.contact || ""} onChange={set("contact")} /></Field>
        </div>
      </Drawer>

      <Drawer open={F === "mou"} title="Record a new MOU" wide
        sub="Open at expression of interest, not after the inception meeting"
        onClose={close} onSave={save} saveLabel="Open record">
        <div style={G2}>
          <Field label="Partner" span>
            <select value={d.partnerId || ""} onChange={set("partnerId")} style={inputCss}>
              <option value="">Select partner…</option>
              {partners.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select></Field>
          <Field label="Title" span><Txt value={d.title || ""} onChange={set("title")} /></Field>
          <Field label="Reference" hint="auto if blank"><Txt value={d.ref || ""} onChange={set("ref")} /></Field>
          <Field label="Opening stage">
            <select value={d.stage || "eoi"} onChange={set("stage")} style={inputCss}>
              {STAGES.filter(s => s.code !== "closed").map(s =>
                <option key={s.code} value={s.code}>{s.label}</option>)}</select></Field>
          <Field label="Start date"><Txt type="date" value={d.start || ""} onChange={set("start")} /></Field>
          <Field label="End date"><Txt type="date" value={d.end || ""} onChange={set("end")} /></Field>
          <Field label="Assigned officer"><Sel options={OFFICERS} value={d.officer || ""} onChange={set("officer")} /></Field>
          <Field label="Contract value (KES)" hint="leave blank if none">
            <Txt type="number" value={d.contract || ""} onChange={set("contract")} /></Field>
        </div>
        <Field label="Areas of collaboration" span>
          <Chips options={CATS} value={d.cats || []} onChange={v => setD({ ...d, cats: v })} /></Field>
        <Note>Leaving contract value blank is correct for academic exchange MOUs with no
          financial target. Revenue achievement then reads "no target set", never 0%.</Note>
      </Drawer>

      <Drawer open={F === "activity"} title="Add activity" wide
        sub={mou.ref} onClose={close} onSave={save} saveLabel="Add activity">
        <Field label="Activity" span><Txt value={d.name || ""} onChange={set("name")} /></Field>
        <div style={G2}>
          <Field label="Area of collaboration"><Sel options={CATS} value={d.cat || ""} onChange={set("cat")} /></Field>
          <Field label="Status"><Sel options={ACT_STATUS} value={d.status || ""} onChange={set("status")} /></Field>
          <Field label="Planned start"><Txt type="date" value={d.start || ""} onChange={set("start")} /></Field>
          <Field label="Planned end"><Txt type="date" value={d.end || ""} onChange={set("end")} /></Field>
        </div>
        <Field label="Implementing units" hint="select all that deliver this activity" span>
          <Chips options={UNITS} value={d.units || []} onChange={v => setD({ ...d, units: v })} /></Field>
        <Field label="How is this measured?" span>
          <Sel options={BASES} value={d.basis || "indicator"} onChange={set("basis")} /></Field>
        {d.basis === "narrative" && <Note t="amber">
          Narrative activities are recorded but excluded from the implementation denominator.
          They are never scored zero — an activity nobody set a target for is not a failed activity.
        </Note>}
        {(!d.basis || d.basis === "indicator") && <Note>
          Add indicators after saving. A one-off event is an indicator too — target 1,
          unit "occurrence". An activity may carry several with different units.
        </Note>}
      </Drawer>

      <Drawer open={F === "indicator"} title="Add indicator" sub={d.actName}
        onClose={close} onSave={save} saveLabel="Add indicator">
        <Field label="Indicator name" span><Txt value={d.name || ""} onChange={set("name")}
          placeholder="e.g. Faculty participating" /></Field>
        <div style={G2}>
          <Field label="Unit of measure"><Txt value={d.unit || ""} onChange={set("unit")}
            placeholder="participants" /></Field>
          <Field label="Target"><Txt type="number" value={d.target ?? 1} onChange={set("target")} /></Field>
        </div>
        <Field label="Means of verification" span><Txt value={d.mov || ""} onChange={set("mov")}
          placeholder="attendance register, travel authority" /></Field>
        <Note>A study visit carries two indicators — "visits: 1" and "participants: 20".
          Each is scored on its own ratio and the activity takes the average, because
          summing targets would add visits to people.</Note>
      </Drawer>

      <Drawer open={F === "achievement"} title="Log achievement" sub={`${d.actName} · ${d.indName}`}
        onClose={close} onSave={save} saveLabel="Log achievement">
        <Note>Target {d.target} {d.indUnit}. This writes a dated row and never overwrites a
          total, so quarterly achievement is derived rather than retyped.</Note>
        <div style={{ ...G2, marginTop: 16 }}>
          <Field label={`Achieved (${d.indUnit || "units"})`}>
            <Txt type="number" value={d.value || ""} onChange={set("value")} /></Field>
          <Field label="Date achieved"><Txt type="date" value={d.date || today()} onChange={set("date")} /></Field>
        </div>
        <Field label="Narrative" span><Area value={d.note || ""} onChange={set("note")} /></Field>
      </Drawer>

      <Drawer open={F === "value"} title="Record value" sub={mou.ref}
        onClose={close} onSave={save} saveLabel="Record value">
        <div style={G2}>
          <Field label="Value type"><Sel options={VALUE_TYPES.map(v => v.v)} value={d.type || ""}
            onChange={set("type")} /></Field>
          <Field label="Amount (KES)"><Txt type="number" value={d.amount || ""} onChange={set("amount")} /></Field>
          <Field label="Date realised"><Txt type="date" value={d.date || today()} onChange={set("date")} /></Field>
          <Field label="Attribute to activity">
            <select value={d.act || ""} onChange={set("act")} style={inputCss}>
              <option value="">Not attributed</option>
              {acts.filter(a => a.mou === mou.id).map(a =>
                <option key={a.id} value={a.id}>{a.name}</option>)}</select></Field>
        </div>
        <Field label="Description" span><Area rows={2} value={d.desc || ""} onChange={set("desc")} /></Field>
        <Field label="Valuation basis"
          hint={NON_CASH.includes(d.type) ? "required for this type" : "optional for cash"} span>
          <Txt value={d.evidence || ""} onChange={set("evidence")}
            placeholder={d.type === "Cost saving" ? "3 quotations; KSG would have paid X" : "Invoice or valuation reference"} /></Field>
        {d.type && <Note t={streamOf(d.type) === "income" ? "emerald" : streamOf(d.type) === "in_kind" ? "amber" : "sky"}>
          Stream: <strong>{streamOf(d.type)}</strong>.{" "}
          {streamOf(d.type) === "income" ? "Enters the financial statements as cash."
            : streamOf(d.type) === "in_kind" ? "Becomes an asset or an expense — never cash."
            : "An expense NOT incurred. Enters no ledger at all, and is never revenue."}
          {d.date && <> Falls in FY {fyOf(d.date)} {qOf(d.date)}.</>}
        </Note>}
      </Drawer>

      <Drawer open={F === "issue"} title="Log an issue" onClose={close} onSave={save} saveLabel="Log issue">
        <Field label="Partnership" span>
          <select value={d.mou || mou.id} onChange={set("mou")} style={inputCss}>
            {mous.map(m => <option key={m.id} value={m.id}>{partnerOf(m).name} — {m.ref}</option>)}</select></Field>
        <div style={G2}>
          <Field label="Issue type"><Sel options={ISSUE_TYPES} value={d.type || ""} onChange={set("type")} /></Field>
          <Field label="Severity"><Sel options={SEVERITIES} value={d.sev || ""} onChange={set("sev")} /></Field>
          <Field label="Accountable unit"><Sel options={UNITS} value={d.unit || ""} onChange={set("unit")} /></Field>
          <Field label="Target resolution"><Txt type="date" value={d.target || ""} onChange={set("target")} /></Field>
        </div>
        <Field label="Description" span><Area value={d.desc || ""} onChange={set("desc")} /></Field>
      </Drawer>

      <Drawer open={F === "stage" || F === "revert"}
        title={F === "stage" ? `Advance to ${nextStage?.label || ""}` : `Return to ${STAGES[sIdx(mou.stage) - 1]?.label || ""}`}
        sub={`${mou.ref} · ${days(mou.stageSince)} days at ${stageOf(mou.stage).label.toLowerCase()}`}
        onClose={close} onSave={save} saveLabel={F === "stage" ? "Advance stage" : "Return file"}>
        <Note>Saving closes the current row and opens a new one. Elapsed time is preserved for
          the turnaround report.{F === "stage" && nextStage?.code === "implementation" &&
          " This also starts the dormancy clock."}</Note>
        <div style={{ marginTop: 16 }}>
          <Field label="Effective date" span><Txt type="date" value={d.effective || today()}
            onChange={set("effective")} /></Field>
          {F === "stage" && ["legal_external", "mfa"].includes(nextStage?.code) && (
            <Field label="Which body holds it?" hint="leave blank for the stage default" span>
              <Sel options={EXTERNAL_BODIES} value={d.holder || ""} onChange={set("holder")} /></Field>)}
          <Field label="Remarks" span><Area value={d.remarks || ""} onChange={set("remarks")} /></Field>
        </div>
      </Drawer>

      <Drawer open={F === "close"} title="Close partnership" sub={mou.ref}
        onClose={close} onSave={save} saveLabel="Close partnership">
        <Note t="rose">Closure ends reporting on this instrument. Activities, value and issues
          remain on the record and continue to count towards historical totals.</Note>
        <div style={{ marginTop: 16 }}>
          <Field label="Closure reason" span><Sel options={["Completed as planned",
            "Expired without renewal", "Dormant — no implementation", "Terminated by KSG",
            "Terminated by partner", "Superseded by a new instrument"]}
            value={d.reason || ""} onChange={set("reason")} /></Field>
          <Field label="Effective date" span><Txt type="date" value={d.effective || today()}
            onChange={set("effective")} /></Field>
        </div>
      </Drawer>

      <Drawer open={F === "renew"} title="Renew partnership" sub={mou.ref}
        onClose={close} onSave={save} saveLabel="Create renewal">
        <Note>A renewal creates a new instrument linked to this one. The original is retained in
          full — its activities, value and achievement stay attached, so historical reporting
          does not shift.</Note>
        <div style={{ ...G2, marginTop: 16 }}>
          <Field label="New start date"><Txt type="date" value={d.start || ""} onChange={set("start")} /></Field>
          <Field label="New end date"><Txt type="date" value={d.end || ""} onChange={set("end")} /></Field>
          <Field label="Signing date"><Txt type="date" value={d.effective || today()} onChange={set("effective")} /></Field>
          <Field label="Contract value (KES)"><Txt type="number" value={d.contract ?? mou.contract ?? ""}
            onChange={set("contract")} /></Field>
        </div>
      </Drawer>

      <Drawer open={F === "assign"} title="Assign DLC officer" sub={mou.ref}
        onClose={close} onSave={save} saveLabel="Assign">
        <Field label="Officer" hint="single point of accountability" span>
          <Sel options={OFFICERS} value={d.officer ?? mou.officer ?? ""} onChange={set("officer")} /></Field>
        <Note>The assigned officer collects from implementing units and enters on their behalf.
          Those units do not use this system.</Note>
      </Drawer>

      <Drawer open={F === "resolve"} title="Resolve issue" sub={d.desc}
        onClose={close} onSave={save} saveLabel="Mark resolved">
        <Note t="emerald">An issue cannot be resolved without a date and a statement of what was
          done. This is enforced in the database, not just here — so it holds for imports too.</Note>
        <div style={{ marginTop: 16 }}>
          <Field label="Date resolved" hint={`raised ${dt(d.raised)}`} span>
            <Txt type="date" value={d.resolvedOn || today()} onChange={set("resolvedOn")} /></Field>
          <Field label="What was done" hint="required" span>
            <Area rows={4} value={d.resolution || ""} onChange={set("resolution")}
              placeholder="e.g. Supplier valuation obtained and delivery note attached; entry passed to the asset register." /></Field>
        </div>
        <Note>Backdating is allowed — these are usually recorded after the fact. The elapsed
          days feed the average-to-resolve figure on the issue log.</Note>
      </Drawer>

      <Drawer open={F === "revise"} title="Move target date" sub={d.desc}
        onClose={close} onSave={save} saveLabel="Move date">
        <Note t="amber">Current target {dt(d.target)}
          {d.count > 0 && ` · already moved ${d.count}×`}. The original ({dt(d.origTarget)}) stays
          on the record and the register keeps showing it. An issue log where dates move quietly
          is an issue log where nothing is ever overdue.</Note>
        <div style={{ marginTop: 16 }}>
          <Field label="New target date" span>
            <Txt type="date" value={d.newTarget || ""} onChange={set("newTarget")} /></Field>
          <Field label="Why is it moving?" hint="required" span>
            <Area rows={3} value={d.why || ""} onChange={set("why")}
              placeholder="e.g. Treasury requested further documentation" /></Field>
        </div>
      </Drawer>

      <Drawer open={F === "reopen"} title="Reopen issue" sub={d.desc}
        onClose={close} onSave={save} saveLabel="Reopen">
        <Note t="amber">Reopening returns this to Ongoing. The previous resolution is kept and
          your reason is appended, so the record shows it recurred rather than looking as though
          it was never resolved.</Note>
        <div style={{ marginTop: 16 }}>
          <Field label="Why is it being reopened?" span>
            <Area rows={3} value={d.why || ""} onChange={set("why")}
              placeholder="e.g. Clearance stalled again after Treasury raised a fresh query" /></Field>
        </div>
      </Drawer>

      {toast && (
        <div style={{ position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)",
          background: T.fg, color: "#fff", padding: "12px 18px", borderRadius: R.lg, fontSize: 13.5,
          zIndex: 60, maxWidth: "90%", textAlign: "center", lineHeight: 1.5,
          boxShadow: "0 8px 24px rgba(0,0,0,.18)" }}>{toast}</div>
      )}
    </div>
  );
}
