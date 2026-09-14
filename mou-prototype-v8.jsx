import React, { useState, useMemo } from "react";
import {
  BarChart, Bar as RBar, XAxis, YAxis, CartesianGrid, Tooltip as RTooltip,
  ResponsiveContainer, PieChart, Pie, Cell, LabelList
} from "recharts";
/* Bar and Tooltip are aliased: the prototype already has its own progress
   Bar component, and Recharts exports the same names. */

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
const SEED_PARTNERS = [
  { id: 1, name: "The Hague Academy & VNG International", country: "Netherlands", type: "International", person: "M. de Vries", contact: "mdevries@thehagueacademy.com" },
  { id: 2, name: "China National Academy of Governance", country: "China", type: "International", person: "Prof. L. Wei", contact: "int@cnag.gov.cn" },
  { id: 3, name: "Council of Governors", country: "Kenya", type: "Local", person: "E. Kiplagat", contact: "linkages@cog.go.ke" },
  { id: 4, name: "Uganda Management Institute", country: "Uganda", type: "Regional", person: "Prof. R. Ssemwanga", contact: "partnerships@umi.ac.ug" },
  { id: 5, name: "GIZ", country: "Germany", type: "International", person: "K. Hoffmann", contact: "k.hoffmann@giz.de" },
  { id: 6, name: "Kenya Revenue Authority", country: "Kenya", type: "Local", person: "L. Wambui", contact: "lwambui@kra.go.ke" },
  { id: 7, name: "Commonwealth Secretariat", country: "United Kingdom", type: "International", person: "T. Adeyemi", contact: "t.adeyemi@commonwealth.int" },
  { id: 8, name: "Ghana Institute of Management and Public Administration", country: "Ghana", type: "Regional", person: "Dr. K. Mensah", contact: "partnerships@gimpa.edu.gh" },
  { id: 9, name: "National School of Government", country: "South Africa", type: "Regional", person: "N. Dlamini", contact: "intl@thensg.gov.za" },
  { id: 10, name: "Public Service Commission", country: "Kenya", type: "Local", person: "G. Mwangi", contact: "gmwangi@publicservice.go.ke" },
  { id: 11, name: "Institut National du Service Public (INSP)", country: "France", type: "International", person: "C. Laurent", contact: "international@insp.gouv.fr" },
  { id: 12, name: "AAPAM", country: "Tanzania", type: "Regional", person: "N. Mushi", contact: "sec@aapam.org" },
];

const SEED_MOUS = [
  { id: 1, ref: "MOU-26-001", partnerId: 1, title: "Migration management training of trainers", stage: "implementation", stageSince: "2025-01-10", implSince: "2025-01-10", start: "2024-11-01", end: "2025-12-31", cats: ["Training & Capacity Building"], officer: "A. Wanjiru", contract: null, prev: null, isCompleted: false },
  { id: 2, ref: "MOU-26-002", partnerId: 2, title: "Knowledge exchange in public administration and policy", stage: "implementation", stageSince: "2025-09-02", implSince: "2025-09-02", start: "2025-04-24", end: "2028-04-24", cats: ["Training & Capacity Building", "Research"], officer: "P. Otieno", contract: null, prev: null, isCompleted: false },
  { id: 3, ref: "MOU-26-003", partnerId: 3, title: "County executive induction and devolution research", stage: "implementation", stageSince: "2024-11-20", implSince: "2024-11-20", start: "2024-10-01", end: "2027-09-30", cats: ["Training & Capacity Building"], officer: "S. Kimani", contract: 15000000, prev: null, isCompleted: false },
  { id: 4, ref: "MOU-26-004", partnerId: 4, title: "Faculty exchange and joint curriculum development", stage: "legal_external", stageSince: "2026-03-12", implSince: null, start: "2026-07-01", end: "2029-06-30", cats: ["Training & Capacity Building", "Research"], officer: "J. Mutiso", contract: 9500000, prev: null, isCompleted: false, holder: "National Treasury" },
  { id: 5, ref: "MOU-26-005", partnerId: 5, title: "Governance and anti-corruption capacity programme", stage: "implementation", stageSince: "2025-02-18", implSince: "2025-02-18", start: "2025-01-10", end: "2027-01-09", cats: ["Training & Capacity Building", "Research"], officer: "A. Wanjiru", contract: 33500000, prev: null, isCompleted: false },
  { id: 6, ref: "MOU-26-006", partnerId: 6, title: "Revenue administration training and consultancy", stage: "implementation", stageSince: "2025-06-30", implSince: "2025-06-30", start: "2025-06-01", end: "2026-11-30", cats: ["Consultancy", "Training & Capacity Building"], officer: "F. Achieng", contract: 22000000, prev: null, isCompleted: false },
  { id: 7, ref: "MOU-26-007", partnerId: 7, title: "Public service reform peer learning", stage: "legal_internal", stageSince: "2026-05-06", implSince: null, start: "2026-09-01", end: "2029-08-31", cats: ["Research", "Conferencing"], officer: "P. Otieno", contract: 12800000, prev: null, isCompleted: false },
  { id: 8, ref: "MOU-26-008", partnerId: 8, title: "Joint programme on economic governance", stage: "implementation", stageSince: "2024-06-01", implSince: "2024-06-01", start: "2024-04-03", end: "2027-04-03", cats: ["Training & Capacity Building", "Research"], officer: "S. Kimani", contract: null, prev: null, isCompleted: false },
  { id: 9, ref: "MOU-26-009", partnerId: 9, title: "Economic governance modules and faculty exchange", stage: "workplan", stageSince: "2026-07-21", implSince: null, start: "2025-10-30", end: "2028-10-30", cats: ["Training & Capacity Building"], officer: "J. Mutiso", contract: 7400000, prev: null, isCompleted: false },
  { id: 10, ref: "MOU-26-010", partnerId: 10, title: "Induction of newly appointed public officers", stage: "concurrence", stageSince: "2026-06-02", implSince: null, start: "2026-10-01", end: "2029-09-30", cats: ["Training & Capacity Building"], officer: "F. Achieng", contract: 28000000, prev: null, isCompleted: false },
  { id: 11, ref: "MOU-26-011", partnerId: 11, title: "LPNT curriculum development and study programmes", stage: "implementation", stageSince: "2025-08-14", implSince: "2025-08-14", start: "2025-07-10", end: "2028-07-10", cats: ["Training & Capacity Building", "Research"], officer: "A. Wanjiru", contract: 18000000, prev: null, isCompleted: false },
  { id: 12, ref: "MOU-26-012", partnerId: 12, title: "Annual roundtable hosting and secretariat support", stage: "implementation", stageSince: "2025-11-11", implSince: "2025-11-11", start: "2025-11-01", end: "2027-10-31", cats: ["Conferencing"], officer: "S. Kimani", contract: 5600000, prev: null, isCompleted: false },
];

/* activities carry basis + several implementing units */
const SEED_ACTS = [
  { id: 1, mou: 1, name: "Migration programmes for Garissa and Turkana", cat: "Training & Capacity Building", units: ["DLC", "Nairobi Campus"], basis: "indicator", status: "Completed", planned: 6400000, start: "2025-02-10", end: "2025-11-18" },
  { id: 2, mou: 2, name: "Study visit by KSG to CNAG", cat: "Training & Capacity Building", units: ["School of Management & Innovation (SMI)", "Institute of Development Studies (IDS)"], basis: "indicator", status: "Ongoing", planned: 3200000, start: "2026-03-01", end: "2026-12-31" },
  { id: 3, mou: 2, name: "Host LPNT Cohort 4", cat: "Training & Capacity Building", units: ["Nairobi Campus"], basis: "milestone", status: "Not started", planned: 4000000, start: "2026-09-01", end: "2027-02-28" },
  { id: 4, mou: 3, name: "County executive induction — cohort 1", cat: "Training & Capacity Building", units: ["Centre for Devolution Studies"], basis: "indicator", status: "Not started", planned: 8000000, start: "2026-03-01", end: "2026-06-30" },
  { id: 5, mou: 5, name: "Integrity champions training", cat: "Training & Capacity Building", units: ["Baringo Campus"], basis: "indicator", status: "Ongoing", planned: 18000000, start: "2025-04-01", end: "2026-12-15" },
  { id: 6, mou: 5, name: "Anti-corruption research symposium", cat: "Research", units: ["Baringo Campus", "DLC"], basis: "indicator", status: "Ongoing", planned: 4500000, start: "2026-04-01", end: "2026-10-31" },
  { id: 7, mou: 6, name: "Tax administration certificate", cat: "Training & Capacity Building", units: ["Mombasa Campus"], basis: "indicator", status: "Completed", planned: 12000000, start: "2025-08-01", end: "2026-06-30" },
  { id: 8, mou: 6, name: "KRA advisory on revenue systems", cat: "Consultancy", units: ["Mombasa Campus"], basis: "indicator", status: "Ongoing", planned: 10000000, start: "2026-01-10", end: "2026-11-30" },
  { id: 9, mou: 8, name: "Economic governance modules I–III", cat: "Training & Capacity Building", units: ["School of Management & Innovation (SMI)", "Institute of Development Studies (IDS)"], basis: "indicator", status: "Ongoing", planned: 9000000, start: "2025-04-01", end: "2026-12-31" },
  { id: 10, mou: 8, name: "Ongoing correspondence on curriculum alignment", cat: "Research", units: ["DLC"], basis: "narrative", status: "Ongoing", planned: null, start: "2025-06-01", end: "2027-04-03" },
  { id: 11, mou: 11, name: "LPNT curriculum development", cat: "Training & Capacity Building", units: ["Learning & Development (L&D)"], basis: "milestone", status: "Completed", planned: 5000000, start: "2025-09-01", end: "2026-03-31" },
  { id: 12, mou: 11, name: "Hosted Cohort 2 LPNT", cat: "Training & Capacity Building", units: ["Nairobi Campus"], basis: "indicator", status: "Completed", planned: 8000000, start: "2026-01-15", end: "2026-06-20" },
  { id: 13, mou: 12, name: "AAPAM roundtable 2026", cat: "Conferencing", units: ["Nairobi Campus"], basis: "indicator", status: "Dormant", planned: 5600000, start: "2026-02-01", end: "2026-05-31" },
];

/* several indicators per activity, different units of measure */
const SEED_INDICATORS = [
  { id: 1, act: 1, name: "Trainers certified", unit: "trainers", target: 40 },
  { id: 2, act: 1, name: "Counties covered", unit: "counties", target: 2 },
  { id: 3, act: 2, name: "Study visits conducted", unit: "visits", target: 1 },
  { id: 4, act: 2, name: "Faculty participating", unit: "participants", target: 20 },
  { id: 5, act: 4, name: "Executives inducted", unit: "executives", target: 200 },
  { id: 6, act: 5, name: "Officers trained", unit: "participants", target: 400 },
  { id: 7, act: 6, name: "Papers presented", unit: "papers", target: 12 },
  { id: 8, act: 7, name: "Officers certified", unit: "participants", target: 250 },
  { id: 9, act: 8, name: "Advisory notes issued", unit: "notes", target: 10 },
  { id: 10, act: 9, name: "Modules delivered", unit: "modules", target: 3 },
  { id: 11, act: 9, name: "Participants across modules", unit: "participants", target: 90 },
  { id: 12, act: 12, name: "Cohort participants hosted", unit: "participants", target: 35 },
  { id: 13, act: 13, name: "Delegates hosted", unit: "delegates", target: 300 },
];

const SEED_ACH = [
  { id: 1, ind: 1, date: "2025-09-22", value: 40, note: "Two cohorts certified" },
  { id: 2, ind: 2, date: "2025-09-22", value: 2, note: "Garissa and Turkana" },
  { id: 3, ind: 3, date: "2026-06-18", value: 1, note: "Study visit completed June 2026" },
  { id: 4, ind: 4, date: "2026-06-18", value: 5, note: "Five faculty travelled" },
  { id: 5, ind: 6, date: "2025-11-20", value: 150, note: "Cohorts 1-2" },
  { id: 6, ind: 6, date: "2026-04-15", value: 120, note: "Cohort 3" },
  { id: 7, ind: 6, date: "2026-08-10", value: 91, note: "Cohort 4" },
  { id: 8, ind: 7, date: "2026-08-02", value: 9, note: "Symposium papers" },
  { id: 9, ind: 8, date: "2026-06-30", value: 244, note: "Certification issued" },
  { id: 10, ind: 9, date: "2026-08-19", value: 7, note: "Notes 1-7" },
  { id: 11, ind: 10, date: "2025-08-20", value: 1, note: "Module II, South Africa" },
  { id: 12, ind: 10, date: "2025-11-14", value: 1, note: "Module III, Kenya" },
  { id: 13, ind: 11, date: "2025-11-14", value: 62, note: "Across modules II and III" },
  { id: 14, ind: 12, date: "2026-06-20", value: 33, note: "Cohort 2 hosted" },
];

const SEED_VALUES = [
  { id: 1, mou: 1, act: 1, type: "Revenue", desc: "Programme fees — Garissa and Turkana", amount: 1470800, date: "2025-09-30", evidence: "Receipt batch 3312" },
  { id: 2, mou: 5, act: 5, type: "Grant", desc: "GIZ programme support", amount: 22000000, date: "2026-01-20", evidence: "" },
  { id: 3, mou: 5, act: 5, type: "Revenue", desc: "Course fees from participants", amount: 4500000, date: "2026-03-14", evidence: "" },
  { id: 4, mou: 5, act: 5, type: "In-kind asset", desc: "Library books and training furniture donated", amount: 1800000, date: "2026-05-02", evidence: "Supplier valuation + delivery note DN/4471" },
  { id: 5, mou: 5, act: 6, type: "In-kind service", desc: "Two GIZ facilitators seconded for six weeks", amount: 900000, date: "2026-06-10", evidence: "Secondment letter; consultant day-rate comparison" },
  { id: 6, mou: 5, act: 5, type: "Cost saving", desc: "Partner-sponsored venue and catering", amount: 3100000, date: "2026-07-11", evidence: "3 quotations; KSG would have paid 3.1M" },
  { id: 7, mou: 6, act: 8, type: "Revenue", desc: "Consultancy fees — KRA advisory", amount: 8950000, date: "2026-08-04", evidence: "" },
  { id: 8, mou: 6, act: 7, type: "In-kind service", desc: "Secondment of two KRA facilitators", amount: 1800000, date: "2026-08-12", evidence: "Secondment letter; day-rate basis" },
  { id: 9, mou: 11, act: 12, type: "Revenue", desc: "LPNT cohort 2 hosting fees", amount: 14356000, date: "2026-06-25", evidence: "" },
  { id: 10, mou: 12, act: 13, type: "Cost saving", desc: "Secretariat support absorbed by partner", amount: 400000, date: "2026-01-29", evidence: "Memo DLC/12/26; comparative quote" },
];

const SEED_ISSUES = [
  { id: 1, mou: 3, type: "Operational", desc: "Implementing unit not designated after signing", sev: "High", status: "Ongoing", unit: "DLC", target: "2026-09-15", origTarget: "2026-09-15", revisions: [], raised: "2026-04-02", resolvedOn: null, resolution: "" },
  { id: 2, mou: 4, type: "Legal", desc: "Awaiting National Treasury concurrence on financial clauses", sev: "High", status: "Ongoing", unit: "Legal Services", target: "2026-07-30", origTarget: "2026-05-30", revisions: [{ from: "2026-05-30", to: "2026-07-30", on: "2026-05-25", why: "Treasury requested further documentation" }], raised: "2026-05-18", resolvedOn: null, resolution: "" },
  { id: 3, mou: 12, type: "Operational", desc: "Roundtable postponed; no revised workplan submitted", sev: "Medium", status: "Pending", unit: "Nairobi Campus", target: "2026-09-05", origTarget: "2026-09-05", revisions: [], raised: "2026-03-11", resolvedOn: null, resolution: "" },
  { id: 4, mou: 2, type: "Financial", desc: "Cohort 4 hosting budget not yet confirmed", sev: "Medium", status: "Ongoing", unit: "Finance", target: "2026-09-20", origTarget: "2026-09-20", revisions: [], raised: "2026-07-30", resolvedOn: null, resolution: "" },
  { id: 5, mou: 7, type: "Legal", desc: "Partner requested amendment to IP clause", sev: "Low", status: "Ongoing", unit: "Legal Services", target: "2026-10-10", origTarget: "2026-10-10", revisions: [], raised: "2026-06-21", resolvedOn: null, resolution: "" },
  { id: 6, mou: 5, type: "Financial", desc: "In-kind furniture donation lacked a valuation basis at receipt", sev: "Medium", status: "Resolved", unit: "Finance", target: "2026-06-15", origTarget: "2026-06-15", revisions: [], raised: "2026-05-06", resolvedOn: "2026-06-09", resolution: "Supplier valuation obtained and delivery note DN/4471 attached. Entry now carries a defensible basis and has been passed to the asset register." },
  { id: 7, mou: 11, type: "Operational", desc: "Cohort 2 attendance register not submitted by campus", sev: "Low", status: "Resolved", unit: "Nairobi Campus", target: "2026-07-10", origTarget: "2026-07-10", revisions: [], raised: "2026-06-22", resolvedOn: "2026-07-02", resolution: "Register received from campus registrar and achievement logged against the cohort indicator." },
];

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
const Badge = ({ children, t = "zinc", subtle }) => {
  const c = tone(t);
  return <span className="tnum" style={{
    background: subtle ? "transparent" : c.bg, color: c.fg,
    border: `1px solid ${subtle ? "transparent" : c.border}`,
    fontSize: 11.5, fontWeight: 500, padding: "2px 7px", borderRadius: R.md,
    whiteSpace: "nowrap", display: "inline-block", lineHeight: 1.45,
  }}>{children}</span>;
};
const StatusBadge = ({ s, atRisk }) => (
  <span style={{ display: "inline-flex", gap: 5, alignItems: "center" }}>
    <Badge t={TONE[s] || "zinc"}>{s}</Badge>
    {atRisk && <Badge t="amber">at risk</Badge>}
  </span>
);
const Card = ({ children, style, pad }) => (
  <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: R.lg,
    padding: pad, ...style }}>{children}</div>
);
const Head = ({ eyebrow, title, sub, right }) => (
  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between",
    gap: 16, marginBottom: 20, flexWrap: "wrap" }}>
    <div>
      {eyebrow && <div className="eyebrow" style={{ color: T.amber, marginBottom: 6 }}>{eyebrow}</div>}
      <h2 className="serif" style={{ fontSize: 25, fontWeight: 500, color: T.fg, margin: 0,
        letterSpacing: "-0.01em" }}>{title}</h2>
      {sub && <div style={{ fontSize: 13, color: T.fgMuted, marginTop: 5 }}>{sub}</div>}
    </div>
    {right}
  </div>
);
const Metric = ({ label, value, sub, t }) => (
  <Card pad={18} style={{ flex: "1 1 170px", minWidth: 155 }}>
    <div className="eyebrow" style={{ color: T.fgMuted }}>{label}</div>
    <div className="serif" style={{ fontSize: 28, fontWeight: 500, marginTop: 7,
      color: t ? T[t] : T.fg, lineHeight: 1.1 }}>{value}</div>
    {sub && <div style={{ fontSize: 12.5, color: T.fgSubtle, marginTop: 3 }}>{sub}</div>}
  </Card>
);
const Bar = ({ pct, t }) => (
  <div style={{ background: T.zincBg, height: 6, borderRadius: 999, overflow: "hidden", flex: 1, minWidth: 44 }}>
    <div style={{ width: `${Math.min(pct, 100)}%`, height: "100%", borderRadius: 999,
      background: t ? T[t] : pct >= TH.IMPL_STRONG ? T.emerald : pct >= TH.IMPL_PARTIAL ? T.amber : T.rose }} />
  </div>
);
const Th = ({ children, w, right }) => (
  <th style={{ textAlign: right ? "right" : "left", fontSize: 12, color: T.fgMuted, fontWeight: 500,
    padding: "0 14px 10px", borderBottom: `1px solid ${T.border}`, width: w, whiteSpace: "nowrap" }}>{children}</th>
);
const Td = ({ children, style, right, num }) => (
  <td className={num ? "tnum" : ""} style={{ padding: "12px 14px", fontSize: 13.5, color: T.fg,
    borderBottom: `1px solid ${T.borderSubtle}`, verticalAlign: "middle",
    textAlign: right ? "right" : "left", ...style }}>{children}</td>
);
const Empty = ({ title, hint, action }) => (
  <Card pad={44} style={{ textAlign: "center" }}>
    <div className="serif" style={{ fontSize: 17, color: T.fg }}>{title}</div>
    <div style={{ fontSize: 13.5, color: T.fgMuted, marginTop: 6, maxWidth: 460, margin: "6px auto 0" }}>{hint}</div>
    {action && <div style={{ marginTop: 18 }}>{action}</div>}
  </Card>
);
const Btn = ({ children, onClick, kind = "primary", sm }) => {
  const m = {
    primary: { bg: T.primary, fg: "#fff", bd: T.primary },
    outline: { bg: T.card, fg: T.fg, bd: T.border },
    ghost: { bg: "transparent", fg: T.fgMuted, bd: "transparent" },
    danger: { bg: T.card, fg: T.rose, bd: T.roseBorder },
  }[kind];
  return <button onClick={onClick} className="ksg-btn" style={{
    padding: sm ? "5px 10px" : "8px 14px", fontSize: sm ? 12.5 : 13.5, fontWeight: 500,
    borderRadius: R.md, cursor: "pointer", fontFamily: "inherit",
    border: `1px solid ${m.bd}`, background: m.bg, color: m.fg, whiteSpace: "nowrap",
  }}>{children}</button>;
};

const inputCss = {
  width: "100%", padding: "8px 11px", border: `1px solid ${T.border}`, borderRadius: R.md,
  fontSize: 13.5, fontFamily: "inherit", background: T.card, color: T.fg,
};
const Field = ({ label, hint, children, span }) => (
  <div style={{ marginBottom: 16, gridColumn: span ? "1 / -1" : undefined }}>
    <div style={{ marginBottom: 6, display: "flex", gap: 8, alignItems: "baseline", flexWrap: "wrap" }}>
      <label style={{ fontSize: 13, fontWeight: 500, color: T.fg }}>{label}</label>
      {hint && <span style={{ fontSize: 12, color: T.fgSubtle }}>{hint}</span>}
    </div>{children}
  </div>
);
const Txt = p => <input {...p} style={inputCss} />;
const Sel = ({ options, ...p }) => (
  <select {...p} style={inputCss}><option value="">Select…</option>
    {options.map(o => typeof o === "string"
      ? <option key={o} value={o}>{o}</option>
      : <option key={o.v} value={o.v}>{o.l}</option>)}</select>
);
const Area = p => <textarea rows={3} {...p} style={{ ...inputCss, resize: "vertical" }} />;
const Chips = ({ options, value, onChange }) => (
  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
    {options.map(o => { const on = value.includes(o);
      return <button key={o} onClick={() => onChange(on ? value.filter(v => v !== o) : [...value, o])}
        className="ksg-btn" style={{ padding: "5px 10px", fontSize: 12.5, borderRadius: R.md,
          cursor: "pointer", fontFamily: "inherit", fontWeight: 500,
          border: `1px solid ${on ? T.primary : T.border}`,
          background: on ? T.primary : T.card, color: on ? "#fff" : T.fgMuted }}>{o}</button>; })}
  </div>
);

function Drawer({ open, title, sub, onClose, onSave, saveLabel = "Save", children, wide }) {
  if (!open) return null;
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(9,9,11,.42)",
      zIndex: 50, display: "flex", justifyContent: "flex-end" }}>
      <div className="drawer" onClick={e => e.stopPropagation()} style={{ width: wide ? 620 : 470,
        maxWidth: "100%", background: T.card, height: "100%", overflowY: "auto",
        display: "flex", flexDirection: "column" }}>
        <div style={{ padding: "20px 24px 16px", borderBottom: `1px solid ${T.border}`,
          position: "sticky", top: 0, background: T.card, zIndex: 2 }}>
          <div className="serif" style={{ fontSize: 20, color: T.fg }}>{title}</div>
          {sub && <div style={{ fontSize: 13, color: T.fgMuted, marginTop: 4 }}>{sub}</div>}
        </div>
        <div style={{ padding: "20px 24px", flex: 1 }}>{children}</div>
        <div style={{ padding: "14px 24px", borderTop: `1px solid ${T.border}`, background: T.card,
          display: "flex", gap: 8, justifyContent: "flex-end", position: "sticky", bottom: 0 }}>
          <Btn kind="outline" onClick={onClose}>Cancel</Btn>
          {onSave && <Btn onClick={onSave}>{saveLabel}</Btn>}
        </div>
      </div>
    </div>
  );
}

const Note = ({ children, t = "zinc" }) => {
  const c = tone(t);
  return <div style={{ background: c.bg, border: `1px solid ${c.border}`, borderRadius: R.md,
    padding: "11px 13px", fontSize: 13, color: T.fg, lineHeight: 1.55 }}>{children}</div>;
};

/* ================= clearance track ================= */
function Track({ mou }) {
  const cur = sIdx(mou.stage), held = days(mou.stageSince);
  const band = custodyBand(mou), tk = custodyTone(band);
  const shown = STAGES.filter(s => s.phase !== "Closure");
  const closed = mou.stage === "closed";
  return (
    <div>
      <div style={{ display: "flex", overflowX: "auto", paddingBottom: 2 }}>
        {shown.map((s, i) => {
          const done = closed || i < cur, here = !closed && i === cur;
          const col = here ? T[tk] : done ? T.emerald : T.border;
          return (
            <div key={s.code} style={{ flex: "1 0 auto", minWidth: 86 }}>
              <div style={{ display: "flex", alignItems: "center" }}>
                <div style={{ flex: 1, height: 2, background: i === 0 ? "transparent" : (done || here ? T.emerald : T.border) }} />
                <div style={{ width: here ? 14 : 9, height: here ? 14 : 9, borderRadius: 999, flexShrink: 0,
                  background: done ? T.emerald : T.card, border: `2px solid ${col}`,
                  boxShadow: here ? `0 0 0 3px ${tone(tk).bg}` : "none" }} />
                <div style={{ flex: 1, height: 2, background: i === shown.length - 1 ? "transparent" : (done ? T.emerald : T.border) }} />
              </div>
              <div style={{ textAlign: "center", marginTop: 9, padding: "0 4px" }}>
                <div style={{ fontSize: 11.5, lineHeight: 1.35, fontWeight: here ? 600 : 400,
                  color: here ? T.fg : done ? T.fgMuted : T.fgSubtle }}>{s.label}</div>
              </div>
            </div>
          );
        })}
      </div>
      <div style={{ marginTop: 16 }}>
        <Note t={closed ? "zinc" : tk}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
            <div>
              <span style={{ color: T.fgMuted }}>{closed ? "Closed" : "Held by"} </span>
              <strong>{closed ? "no further action" : (mou.holder || stageOf(mou.stage).holder)}</strong>
              <span style={{ color: T.fgMuted }}> at {stageOf(mou.stage).label.toLowerCase()}</span>
            </div>
            <span className="tnum" style={{ fontWeight: 600, color: T[tk] }}>
              {held} days
              {band === "not_applicable" && <span style={{ color: T.fgMuted, fontWeight: 400 }}> · normal for implementation</span>}
            </span>
          </div>
        </Note>
      </div>
    </div>
  );
}

/* ================= status panel ================= */
function StatusPanel({ mou, db }) {
  const d = deriveStatus(mou, db);
  const inImpl = stageOf(mou.stage).seq >= SEQ_IMPL && stageOf(mou.stage).seq < SEQ_CLOSED;
  const pct = d.since == null ? 0 : Math.min(100, (d.since / TH.DORMANCY) * 100);
  return (
    <Card pad={16}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "flex-start",
        flexWrap: "wrap", marginBottom: inImpl ? 14 : 0 }}>
        <div style={{ flex: "1 1 260px" }}>
          <div style={{ fontSize: 13, color: T.fgMuted, marginBottom: 4 }}>Status · derived, never set by hand</div>
          <div style={{ fontSize: 13.5, color: T.fg }}>{d.why}</div>
        </div>
        <StatusBadge s={d.status} atRisk={d.atRisk} />
      </div>
      {inImpl && (
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5,
            color: T.fgMuted, marginBottom: 6 }}>
            <span>{d.lastActivity ? `Last logged ${dt(d.lastActivity)}` : "Nothing logged yet"}</span>
            <span className="tnum">{d.since}d of {TH.DORMANCY}d</span>
          </div>
          <div style={{ position: "relative", background: T.zincBg, height: 6, borderRadius: 999, overflow: "hidden" }}>
            <div style={{ width: `${pct}%`, height: "100%", borderRadius: 999,
              background: d.status === "Dormant" || d.atRisk ? T.amber : T.emerald }} />
          </div>
          <div style={{ position: "relative", height: 12 }}>
            <div style={{ position: "absolute", left: `${(TH.AT_RISK / TH.DORMANCY) * 100}%`,
              top: -6, width: 1, height: 12, background: T.fgSubtle }} />
          </div>
          <div style={{ fontSize: 12, color: T.fgSubtle }}>
            {TH.AT_RISK}d marks at-risk · {TH.DORMANCY}d sets Dormant · logging activity or value resets it
          </div>
        </div>
      )}
    </Card>
  );
}

/* ================= charts =================
   Recharts, which is what Tremor is built on — gridlines, real axes, hover
   tooltips and animation, themed from our tokens rather than its defaults.
   ========================================================================= */

const AXIS = { fontSize: 11.5, fill: T.fgMuted, fontFamily: "'IBM Plex Sans', sans-serif" };
const GRID = { stroke: T.borderSubtle, strokeDasharray: "3 3" };

function ChartTip({ active, payload, label, format = fmt }) {
  if (!active || !payload || !payload.length) return null;
  return (
    <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: R.md,
      padding: "9px 11px", boxShadow: "0 4px 14px rgba(20,26,23,.10)", fontSize: 12.5 }}>
      {label != null && <div style={{ fontWeight: 600, marginBottom: 5 }}>{label}</div>}
      {payload.filter(p => p.value > 0).map((p, i) => (
        <div key={i} style={{ display: "flex", alignItems: "center", gap: 7, marginTop: 2 }}>
          <span style={{ width: 8, height: 8, borderRadius: 2,
            background: p.color || p.payload.fill }} />
          <span style={{ color: T.fgMuted }}>{p.name}</span>
          <span className="tnum" style={{ marginLeft: "auto", fontWeight: 500 }}>
            {format(p.value)}</span>
        </div>))}
    </div>
  );
}

const Legend = ({ items }) => (
  <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginTop: 12, paddingTop: 11,
    borderTop: `1px solid ${T.borderSubtle}`, fontSize: 12, color: T.fgMuted }}>
    {items.map(it => (
      <span key={it.label} style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
        <span style={{ width: 9, height: 9, borderRadius: 2, background: it.colour }} />{it.label}</span>))}
  </div>
);

/* Horizontal bars — the default. Long labels fit. */
function HChart({ data, height = 200, format = fmt, colour, sorted = true, unit,
                 compact, limit }) {
  let rows = sorted ? [...data].sort((a, b) => b.value - a.value) : data;
  if (limit && rows.length > limit) {
    const rest = rows.slice(limit);
    rows = [...rows.slice(0, limit),
      { label: `${rest.length} others`, value: rest.reduce((a, b) => a + b.value, 0),
        colour: T.zinc }];
  }
  const labelW = compact ? 104 : 150;
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={rows} layout="vertical"
        margin={{ top: 4, right: compact ? 34 : 40, left: 0, bottom: 0 }}>
        <CartesianGrid {...GRID} horizontal={false} />
        <XAxis type="number" tick={AXIS} axisLine={false} tickLine={false}
          tickFormatter={v => unit === "days" ? v + "d" : format(v)} />
        <YAxis type="category" dataKey="label" axisLine={false} tickLine={false}
          width={labelW}
          tick={{ ...AXIS, fontSize: compact ? 11 : 11.5 }}
          tickFormatter={v => compact && v.length > 17 ? v.slice(0, 16) + "…" : v} />
        <RTooltip cursor={{ fill: T.zincBg }}
          content={<ChartTip format={v => unit === "days" ? v + " days" : format(v)} />} />
        <RBar dataKey="value" name="Value" radius={[0, 3, 3, 0]} maxBarSize={22}
          animationDuration={420}>
          {rows.map((r, i) => <Cell key={i} fill={r.colour || colour || T.emerald} />)}
          <LabelList dataKey="value" position="right"
            formatter={v => unit === "days" ? v + "d" : format(v)}
            style={{ fontSize: 11.5, fill: T.fg, fontWeight: 500,
              fontFamily: "'IBM Plex Mono', monospace" }} />
        </RBar>
      </BarChart>
    </ResponsiveContainer>
  );
}

/* Vertical stacked columns — quarters. */
function StackChart({ data, series, height = 230 }) {
  return (
    <div>
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid {...GRID} vertical={false} />
          <XAxis dataKey="label" tick={AXIS} axisLine={false} tickLine={false} />
          <YAxis tick={AXIS} axisLine={false} tickLine={false} tickFormatter={fmt} width={64} />
          <RTooltip cursor={{ fill: T.zincBg }} content={<ChartTip />} />
          {series.map((sr, i) => (
            <RBar key={sr.key} dataKey={sr.key} name={sr.label} stackId="a" fill={sr.colour}
              maxBarSize={56} animationDuration={420}
              radius={i === series.length - 1 ? [3, 3, 0, 0] : [0, 0, 0, 0]} />))}
        </BarChart>
      </ResponsiveContainer>
      <Legend items={series} />
    </div>
  );
}

/* Donut — ONLY where the parts form a genuine whole and there are 3-4. */
function DonutChart({ data, height = 210, centreValue, centreLabel, format = fmt }) {
  const total = data.reduce((a, b) => a + b.value, 0);
  return (
    <div>
      <div style={{ position: "relative" }}>
        <ResponsiveContainer width="100%" height={height}>
          <PieChart>
            <Pie data={data} dataKey="value" nameKey="label" cx="50%" cy="50%"
              innerRadius={62} outerRadius={92} paddingAngle={2} strokeWidth={0}
              animationDuration={420}>
              {data.map((d, i) => <Cell key={i} fill={d.colour} />)}
            </Pie>
            <RTooltip content={<ChartTip format={format} />} />
          </PieChart>
        </ResponsiveContainer>
        <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center", pointerEvents: "none" }}>
          <div className="serif" style={{ fontSize: 22, color: T.fg }}>{centreValue}</div>
          <div className="eyebrow" style={{ color: T.fgMuted, marginTop: 2 }}>{centreLabel}</div>
        </div>
      </div>
      <div style={{ marginTop: 4 }}>
        {data.map((d, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 9, padding: "6px 0",
            borderBottom: i === data.length - 1 ? "none" : `1px solid ${T.borderSubtle}` }}>
            <span style={{ width: 9, height: 9, borderRadius: 2, background: d.colour, flexShrink: 0 }} />
            <span style={{ fontSize: 13, flex: 1 }}>{d.label}</span>
            <span className="tnum" style={{ fontSize: 12.5, fontWeight: 500 }}>{format(d.value)}</span>
            <span className="tnum" style={{ fontSize: 11.5, color: T.fgSubtle, minWidth: 36,
              textAlign: "right" }}>{total ? Math.round(d.value / total * 100) : 0}%</span>
          </div>))}
      </div>
    </div>
  );
}

/* Section wrapper — gives the dashboard its narrative spine. */
function Section({ n, title, sub, children }) {
  return (
    <section style={{ marginBottom: 32 }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 12, marginBottom: 4 }}>
        <span className="tnum" style={{ fontSize: 12, color: T.amber }}>{String(n).padStart(2, "0")}</span>
        <h3 className="serif" style={{ fontSize: 19, margin: 0, color: T.fg }}>{title}</h3>
      </div>
      {sub && <div style={{ fontSize: 13, color: T.fgMuted, marginBottom: 16, paddingLeft: 30 }}>{sub}</div>}
      <div style={{ paddingLeft: 30, borderLeft: `1px solid ${T.borderSubtle}` }}>{children}</div>
    </section>
  );
}

function Panel({ title, sub, children, note, style }) {
  return (
    <Card pad={20} style={style}>
      <div className="eyebrow" style={{ color: T.fgMuted, marginBottom: 4 }}>{title}</div>
      {sub && <div style={{ fontSize: 12.5, color: T.fgSubtle, marginBottom: 16 }}>{sub}</div>}
      {children}
      {note && <div style={{ fontSize: 12, color: T.fgSubtle, marginTop: 13, paddingTop: 11,
        borderTop: `1px solid ${T.borderSubtle}`, lineHeight: 1.5 }}>{note}</div>}
    </Card>
  );
}

/* Register summary — exact counts. A table, not a chart. */
function SummaryTable({ groups }) {
  return (
    <table style={{ width: "100%", borderCollapse: "collapse" }}>
      <tbody>
        {groups.map((g, gi) => (
          <React.Fragment key={gi}>
            <tr><td colSpan={2} className="eyebrow" style={{ color: T.amber,
              padding: gi === 0 ? "0 0 9px" : "18px 0 9px" }}>{g.title}</td></tr>
            {g.rows.map((r, i) => (
              <tr key={i}>
                <td style={{ padding: "7px 0", fontSize: 13,
                  borderBottom: `1px solid ${T.borderSubtle}`,
                  color: r.emphasis ? T.fg : T.fgMuted,
                  fontWeight: r.emphasis ? 500 : 400 }}>{r.label}</td>
                <td className="tnum" style={{ padding: "7px 0", fontSize: 13.5, textAlign: "right",
                  borderBottom: `1px solid ${T.borderSubtle}`, fontWeight: 500,
                  color: r.flag && r.value > 0 ? T[r.flag] : T.fg }}>{r.value}</td>
              </tr>))}
          </React.Fragment>))}
      </tbody>
    </table>
  );
}

/* ================= dashboard ================= */
function Dashboard({ role, db, go }) {
  const { mous, values, issues, partnerOf, statusOf, acts, events } = db;
  const S = mous.map(m => ({ m, ...statusOf(m), seq: stageOf(m.stage).seq }));
  const nStatus = k => S.filter(x => x.status === k).length;
  const atRisk = S.filter(x => x.atRisk);
  const dormant = S.filter(x => x.status === "Dormant");
  const G3 = { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(340px,1fr))", gap: 16 };
  const G2 = { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(460px,1fr))", gap: 16 };

  /* ---------- implementation buckets (signed MOUs only) ---------- */
  const impl = useMemo(() => {
    const b = { Ongoing: 0, Completed: 0, Stalled: 0, "Not started": 0 };
    S.filter(x => x.seq >= SEQ_SIGNED && x.seq < SEQ_CLOSED).forEach(({ m, status }) => {
      const a = acts.filter(x => x.mou === m.id);
      if (status === "Dormant") b.Stalled++;
      else if (m.isCompleted || (a.length && a.every(x => ["Completed","Cancelled"].includes(x.status)))) b.Completed++;
      else if (!a.length || a.every(x => x.status === "Not started")) b["Not started"]++;
      else b.Ongoing++;
    });
    return b;
  }, [S, acts]);

  /* ---------- value ---------- */
  const vs = valueSummary(values);
  const streams = [
    { label: "Realised income", value: vs.realisedIncome, colour: T.emerald },
    { label: "In-kind received", value: vs.inKindTotal, colour: T.amber },
    { label: "Cost avoided", value: vs.costAvoided, colour: T.sky },
  ];
  const valueByArea = useMemo(() => {
    const acc = {}; CATS.forEach(c => acc[c] = 0); acc["Unattributed"] = 0;
    values.forEach(v => { const a = acts.find(x => x.id === v.act);
      acc[a ? a.cat : "Unattributed"] += v.amount; });
    return Object.entries(acc).filter(([, v]) => v > 0).map(([label, value]) => ({ label, value }));
  }, [values, acts]);
  const countByArea = CATS.map(c => ({ label: c,
    value: mous.filter(m => m.cats.includes(c)).length, colour: T.sky }));
  const quarters = useMemo(() => ["Q1","Q2","Q3","Q4"].map(q => {
    const v = values.filter(x => fyOf(x.date) === "2025/26" && qOf(x.date) === q);
    const t2 = valueSummary(v);
    return { label: q, income: t2.realisedIncome, inkind: t2.inKindTotal, avoided: t2.costAvoided };
  }), [values]);

  /* ---------- reach ---------- */
  const byCountry = useMemo(() => {
    const acc = {};
    mous.forEach(m => { const c = partnerOf(m).country; acc[c] = (acc[c] || 0) + 1; });
    return Object.entries(acc).map(([label, value]) => ({ label, value, colour: T.emerald }));
  }, [mous]);
  const byType = TYPES.map((t2, i) => ({ label: t2,
    value: mous.filter(m => partnerOf(m).type === t2).length,
    colour: [T.emerald, T.sky, T.violet][i] }));

  /* ---------- pre-signature pipeline ---------- */
  const preSigning = useMemo(() => STAGES.filter(st => st.seq < SEQ_SIGNED).map(st => ({
    label: st.label, value: mous.filter(m => m.stage === st.code).length,
    colour: T.sky })), [mous]);

  const turnaround = useMemo(() => {
    const acc = {};
    events.filter(e => e.exited).forEach(e => {
      const st = stageOf(e.stage);
      if (!["Inception","Activation"].includes(st.phase)) return;
      const who = e.holder || st.holder;
      (acc[who] = acc[who] || []).push(Math.round((new Date(e.exited) - new Date(e.entered)) / 864e5));
    });
    return Object.entries(acc).map(([label, ds]) => {
      const avg = Math.round(ds.reduce((a, b) => a + b, 0) / ds.length);
      return { label, value: avg, colour: avg > TH.CUSTODY_AGEING ? T.rose : T.emerald };
    });
  }, [events]);

  const stuck = mous.filter(m => ["overdue","ageing"].includes(custodyBand(m)))
    .map(m => ({ m, held: days(m.stageSince), band: custodyBand(m) }))
    .sort((a, b) => b.held - a.held);

  const coverage = useMemo(() => {
    const scored = acts.filter(a => activityScore(a, db) !== null).length;
    return acts.length ? Math.round(100 * scored / acts.length) : null;
  }, [acts, db]);
  const concentration = useMemo(() => {
    const per = mous.map(m => valueSummary(values.filter(v => v.mou === m.id)).totalBenefit)
      .sort((a, b) => b - a);
    const tot = per.reduce((a, b) => a + b, 0);
    return tot ? Math.round(100 * per.slice(0, 3).reduce((a, b) => a + b, 0) / tot) : 0;
  }, [mous, values]);

  const dueRenewal = mous.filter(m => { const d = Math.round((new Date(m.end) - TODAY) / 864e5);
    return d > 0 && d <= 180; }).length;

  const summary = [
    { title: "Register", rows: [
      { label: "Total MOUs in register", value: mous.length, emphasis: true },
      { label: "Active", value: nStatus("Active") },
      { label: "Under negotiation", value: nStatus("Pending") },
      { label: "Expired", value: nStatus("Expired"), flag: "rose" },
      { label: "Closed / terminated", value: nStatus("Closed") },
    ]},
    { title: "Implementation", rows: [
      { label: "Workplan developed", value: S.filter(x => x.seq >= 100).length, emphasis: true },
      { label: "Ongoing", value: impl.Ongoing },
      { label: "Completed", value: impl.Completed },
      { label: "Stalled", value: impl.Stalled, flag: "amber" },
      { label: "Not started", value: impl["Not started"], flag: "amber" },
    ]},
    { title: "Requires decision", rows: [
      { label: "Due for renewal within 6 months", value: dueRenewal, flag: "amber", emphasis: true },
      { label: "Past expiry needing review", value: nStatus("Expired"), flag: "rose" },
      { label: "At risk of dormancy", value: atRisk.length, flag: "amber" },
      { label: "Unassigned to an officer", value: mous.filter(m => !m.officer).length, flag: "rose" },
    ]},
  ];

  return (
    <div>
      <Head eyebrow={`${ROLES[role].name} · FY 2026/27 Q1`} title="Portfolio overview"
        sub="Every figure derived from the registers. Status is computed, never typed." />

      {/* ============ 1. OVERVIEW ============ */}
      <Section n={1} title="Overview">
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 16 }}>
          <Metric label="Partnerships" value={mous.length} sub={`${nStatus("Active")} active`} />
          <Metric label="Realised income" value={fmt(vs.realisedIncome)} sub="cash" t="emerald" />
          <Metric label="Economic benefit" value={fmt(vs.totalBenefit)} sub="all three streams" t="amber" />
          <Metric label="Stalled" value={impl.Stalled + atRisk.length}
            sub={`${impl.Stalled} dormant, ${atRisk.length} at risk`}
            t={impl.Stalled ? "rose" : "emerald"} />
          <Metric label="Measured" value={coverage == null ? "—" : coverage + "%"}
            sub="activities with an indicator" t={coverage >= 70 ? "emerald" : "amber"} />
          <Metric label="Top 3 concentration" value={concentration + "%"} sub="of total benefit"
            t={concentration > 70 ? "amber" : undefined} />
        </div>

        {stuck.length > 0 && (
          <Card pad={16} style={{ borderLeft: `3px solid ${T.rose}` }}>
            <div className="eyebrow" style={{ color: T.rose, marginBottom: 10 }}>Requires attention now</div>
            {stuck.map(({ m, held, band }) => (
              <div key={m.id} className="ksg-row" tabIndex={0} onClick={() => go("track", m.id)}
                style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center",
                  padding: "8px 10px", margin: "0 -10px", borderRadius: R.md }}>
                <span style={{ fontSize: 13.5 }}>{partnerOf(m).name}</span>
                <span style={{ display: "flex", gap: 10, alignItems: "center" }}>
                  <span style={{ fontSize: 12.5, color: T.fgMuted }}>
                    {m.holder || stageOf(m.stage).holder}</span>
                  <Badge t={band === "overdue" ? "overdue" : "dormant"}>{held}d</Badge>
                </span>
              </div>))}
          </Card>)}
      </Section>

      {/* ============ 2. REACH — one row of three ============ */}
      <Section n={2} title="Partnership reach"
        sub="Who KSG partners with, where they are, and what the partnerships cover">
        <div style={G3}>
          <Panel title="By country" sub="Ranked, most partnerships first"
            note="A ranked bar rather than a world map: a dozen countries at one or two partnerships each shade a choropleth identically and say less than this.">
            <HChart data={byCountry} height={230} format={v => v} compact limit={8} />
          </Panel>
          <Panel title="By type of partnership"
            sub="Local within Kenya · Regional within Africa · International beyond">
            <DonutChart data={byType} height={190} centreValue={mous.length}
              centreLabel="PARTNERSHIPS" format={v => v} />
          </Panel>
          <Panel title="By area of collaboration" sub="Counts — an MOU may span several"
            note="Counts exceed the register total by design. Read this against value by area in the next row: most partnerships name the same area, but the value sits elsewhere.">
            <HChart data={countByArea} height={230} format={v => v} compact colour={T.sky} />
          </Panel>
        </div>
      </Section>

      {/* ============ 3. VALUE — one row of three ============ */}
      <Section n={3} title="Partnership value"
        sub="What the portfolio has returned, through which activities, and when">
        <div style={G3}>
          <Panel title="By accounting stream" sub="Only the green slice is revenue"
            note="Not additive for accounting. Income enters the financial statements; in-kind becomes an asset or expense; avoided cost enters no ledger at all.">
            <DonutChart data={streams} height={190} centreValue={fmt(vs.totalBenefit)}
              centreLabel="TOTAL BENEFIT" />
          </Panel>
          <Panel title="By area of collaboration" sub="Attributed through the earning activity"
            note="Runs through the activity that earned it, so an MOU spanning several areas is never double-counted.">
            <HChart data={valueByArea} height={230} compact colour={T.emerald} />
          </Panel>
          <Panel title="By quarter · FY 2025/26"
            sub="Stacked columns, not a line — four points is too few for a trend">
            <StackChart data={quarters} height={200} series={[
              { key: "income", label: "Income", colour: T.emerald },
              { key: "inkind", label: "In-kind", colour: T.amber },
              { key: "avoided", label: "Avoided", colour: T.sky }]} />
          </Panel>
        </div>
      </Section>

      {/* ============ 4. STATUS — one row of two ============ */}
      <Section n={4} title="Status of MOUs"
        sub="Two different questions, deliberately not combined">
        <div style={G2}>
          <Panel title="By implementation" sub="Signed partnerships only — what is being delivered"
            note="A partnership can be Active and Stalled at the same time. Merging this with the lifecycle chart beside it would hide exactly that case.">
            <HChart data={[
              { label: "Ongoing", value: impl.Ongoing, colour: T.emerald },
              { label: "Completed", value: impl.Completed, colour: T.violet },
              { label: "Stalled", value: impl.Stalled, colour: T.amber },
              { label: "Not started", value: impl["Not started"], colour: T.rose }]}
              height={200} format={v => v} />
          </Panel>
          <Panel title="By lifecycle" sub="Where each instrument sits, inception to closure"
            note="A bar, not a pie: six categories of very uneven size are unreadable as slices.">
            <HChart data={[
              { label: "Active", value: nStatus("Active"), colour: T.emerald },
              { label: "Dormant", value: nStatus("Dormant"), colour: T.amber },
              { label: "Under negotiation", value: nStatus("Pending"), colour: T.sky },
              { label: "Expired", value: nStatus("Expired"), colour: T.rose },
              { label: "Completed", value: nStatus("Completed"), colour: T.violet },
              { label: "Closed", value: nStatus("Closed"), colour: T.zinc }]}
              height={200} format={v => v} />
          </Panel>
        </div>
      </Section>

      {/* ============ 5. PIPELINE AND WATCHLIST ============ */}
      <Section n={5} title="Pipeline and watchlist"
        sub="Files awaiting clearance, and signed partnerships that have gone quiet">
        <div style={G3}>
          <Panel title="Pipeline by stage" sub="Partnerships not yet signed"
            note="Records open at expression of interest, not after the inception meeting — otherwise approaches that are declined never appear in any report.">
            <HChart data={preSigning} height={230} format={v => v} sorted={false} compact colour={T.sky} />
          </Panel>
          <Panel title="Clearance turnaround" sub="Average days each body holds a file"
            note="Derived entirely from stage transitions. The longest bar is the bottleneck, named.">
            {turnaround.length
              ? <HChart data={turnaround} height={230} unit="days" compact />
              : <div style={{ fontSize: 13, color: T.fgSubtle, padding: "24px 0" }}>
                  No completed transitions yet.</div>}
          </Panel>
          <Panel title="Dormancy watch"
            sub={`Nothing logged for ${TH.AT_RISK}+ days`}
            note="Recording achievement or value against any of these returns it to Active immediately — status is derived, never set by hand.">
            {(dormant.length + atRisk.length) === 0
              ? <div style={{ fontSize: 13, color: T.fgSubtle, padding: "24px 0" }}>
                  Every implementing partnership has logged activity recently.</div>
              : [...dormant, ...atRisk].map(({ m, status, since, lastActivity }) => (
                <div key={m.id} className="ksg-row" tabIndex={0} onClick={() => go("track", m.id)}
                  style={{ padding: "9px 10px", margin: "0 -10px", borderRadius: R.md }}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 8,
                    marginBottom: 6 }}>
                    <span style={{ fontSize: 13, overflow: "hidden", textOverflow: "ellipsis",
                      whiteSpace: "nowrap" }}>{partnerOf(m).name}</span>
                    <Badge t={status === "Dormant" ? "dormant" : "closed"}>{since}d</Badge>
                  </div>
                  <Bar pct={(since / TH.DORMANCY) * 100} t={status === "Dormant" ? "amber" : "emerald"} />
                </div>))}
          </Panel>
        </div>
      </Section>

      {/* ============ 6. REGISTER SUMMARY ============ */}
      <Section n={6} title="Register summary"
        sub="Exact counts for the quarterly return">
        <Card pad={22}>
          <div style={{ columns: "3 260px", columnGap: 40 }}>
            <SummaryTable groups={summary} />
          </div>
        </Card>
      </Section>
    </div>
  );
}

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
function IssueTable({ rows, db, role, act }) {
  const [open, setOpen] = useState(null);
  return (
    <Card style={{ overflowX: "auto", padding: "16px 4px 4px" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 940 }}>
        <thead><tr><Th>Raised</Th><Th w="16%">Partnership</Th><Th>Type</Th><Th w="24%">Description</Th>
          <Th>Severity</Th><Th>Status</Th><Th>Accountable</Th><Th>Target</Th><Th /></tr></thead>
        <tbody>{rows.map(i => {
          const m = db.mous.find(x => x.id === i.mou);
          const over = i.status !== "Resolved" && new Date(i.target) < TODAY;
          const revised = i.revisions.length > 0;
          const mine = canResolve(role, i);
          const expanded = open === i.id;
          return (
            <React.Fragment key={i.id}>
              <tr className="ksg-row" onClick={() => setOpen(expanded ? null : i.id)}>
                <Td num style={{ color: T.fgMuted, fontSize: 13 }}>{dt(i.raised)}</Td>
                <Td style={{ fontSize: 13 }}>{m ? db.partnerOf(m).name : "—"}</Td>
                <Td style={{ fontSize: 13 }}>{i.type}</Td>
                <Td>{i.desc}</Td>
                <Td><Badge t={i.sev === "High" ? "rose" : i.sev === "Medium" ? "amber" : "zinc"}>{i.sev}</Badge></Td>
                <Td><Badge t={i.status === "Resolved" ? "emerald" : i.status === "Ongoing" ? "sky" : "zinc"}>
                  {i.status}</Badge></Td>
                <Td style={{ fontSize: 13 }}>{i.unit}</Td>
                <Td>
                  <div className="tnum" style={{ fontSize: 13, color: over ? T.rose : T.fgMuted,
                    fontWeight: over ? 500 : 400 }}>
                    {i.status === "Resolved" ? dt(i.resolvedOn) : dt(i.target)}
                  </div>
                  {revised && i.status !== "Resolved" &&
                    <div className="tnum" style={{ fontSize: 11, color: T.amber, marginTop: 2 }}>
                      revised from {dt(i.origTarget)}</div>}
                </Td>
                <Td style={{ whiteSpace: "nowrap" }}>
                  {mine && i.status === "Pending" &&
                    <Btn sm kind="outline" onClick={e => { e.stopPropagation(); act.startIssue(i); }}>Start</Btn>}
                  {mine && i.status === "Ongoing" && (
                    <span style={{ display: "inline-flex", gap: 6 }}>
                      <Btn sm onClick={e => { e.stopPropagation(); act.resolveIssue(i); }}>Resolve</Btn>
                      <Btn sm kind="ghost" onClick={e => { e.stopPropagation(); act.reviseTarget(i); }}>Move date</Btn>
                    </span>)}
                  {mine && i.status === "Resolved" &&
                    <Btn sm kind="outline" onClick={e => { e.stopPropagation(); act.reopenIssue(i); }}>Reopen</Btn>}
                  {!mine && <span style={{ fontSize: 12, color: T.fgSubtle }}>
                    {i.type} issues only</span>}
                </Td>
              </tr>
              {expanded && (
                <tr><td colSpan={9} style={{ padding: "0 14px 14px", borderBottom: `1px solid ${T.borderSubtle}` }}>
                  <div style={{ background: T.bg, borderRadius: R.md, padding: "12px 14px" }}>
                    {i.status === "Resolved" ? (
                      <div>
                        <div className="eyebrow" style={{ color: T.emerald, marginBottom: 5 }}>
                          Resolved {dt(i.resolvedOn)} · {Math.round((new Date(i.resolvedOn) - new Date(i.raised)) / 864e5)} days open
                        </div>
                        <div style={{ fontSize: 13, lineHeight: 1.6 }}>{i.resolution}</div>
                      </div>
                    ) : (
                      <div style={{ fontSize: 13, color: T.fgMuted }}>
                        Open {days(i.raised)} days.{" "}
                        {over ? <span style={{ color: T.rose }}>Past its target date.</span>
                              : `Target ${dt(i.target)}.`}
                      </div>
                    )}
                    {i.revisions.length > 0 && (
                      <div style={{ marginTop: 12, paddingTop: 10, borderTop: `1px solid ${T.border}` }}>
                        <div className="eyebrow" style={{ color: T.amber, marginBottom: 6 }}>
                          Target moved {i.revisions.length}×</div>
                        {i.revisions.map((r, n) => (
                          <div key={n} style={{ fontSize: 12.5, color: T.fgMuted, marginBottom: 3 }}>
                            <span className="tnum">{dt(r.from)} → {dt(r.to)}</span> on{" "}
                            <span className="tnum">{dt(r.on)}</span> — {r.why}
                          </div>))}
                      </div>)}
                  </div>
                </td></tr>)}
            </React.Fragment>);
        })}</tbody>
      </table>
    </Card>
  );
}

function Activities({ db, role, act }) {
  const [unit, setUnit] = useState("All");
  const units = ["All", ...Array.from(new Set(db.acts.flatMap(a => a.units)))].sort();
  const rows = unit === "All" ? db.acts : db.acts.filter(a => a.units.includes(unit));
  return (
    <div>
      <Head title="Activity register" sub="Every activity across the portfolio, by implementing unit"
        right={<select value={unit} onChange={e => setUnit(e.target.value)}
          style={{ ...inputCss, width: "auto" }}>
          {units.map(u => <option key={u}>{u === "All" ? "All implementing units" : u}</option>)}</select>} />
      <Card style={{ overflowX: "auto", padding: "16px 4px 4px" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 1000 }}>
          <thead><tr><Th w="22%">Activity</Th><Th w="15%">Partnership</Th><Th>Area</Th>
            <Th w="18%">Implementing units</Th><Th>Basis</Th><Th>Status</Th>
            <Th w="12%">Achievement</Th><Th right>Last logged</Th></tr></thead>
          <tbody>{rows.map(a => {
            const m = db.mous.find(x => x.id === a.mou);
            const sc = activityScore(a, db);
            const inds = db.indicators.filter(i => i.act === a.id);
            const last = inds.flatMap(i => db.achievements.filter(u => u.ind === i.id))
              .map(u => u.date).sort().pop();
            return (
              <tr key={a.id} className="ksg-row">
                <Td><div style={{ fontWeight: 500 }}>{a.name}</div>
                  <div style={{ fontSize: 12.5, color: T.fgSubtle, marginTop: 2 }}>
                    {inds.length ? `${inds.length} indicator${inds.length > 1 ? "s" : ""}` : "no indicator"}</div></Td>
                <Td style={{ fontSize: 13 }}>{m ? db.partnerOf(m).name : "—"}</Td>
                <Td style={{ fontSize: 13 }}>{a.cat}</Td>
                <Td style={{ fontSize: 13 }}>{a.units.join(", ")}</Td>
                <Td><Badge t={a.basis === "narrative" ? "zinc" : a.basis === "milestone" ? "violet" : "sky"}>
                  {a.basis}</Badge></Td>
                <Td><Badge t={a.status === "Completed" ? "emerald" : a.status === "Ongoing" ? "sky" : "zinc"}>
                  {a.status}</Badge></Td>
                <Td>{sc == null ? <span style={{ fontSize: 12.5, color: T.fgSubtle }}>not scored</span>
                  : <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <Bar pct={sc * 100} />
                      <span className="tnum" style={{ fontSize: 12.5, color: T.fgMuted, minWidth: 30 }}>
                        {Math.round(sc * 100)}%</span></div>}</Td>
                <Td num right style={{ fontSize: 13, color: last ? T.fgMuted : T.rose }}>
                  {last ? dt(last) : "never"}</Td>
              </tr>);
          })}</tbody>
        </table>
      </Card>
    </div>
  );
}

function Issues({ role, db, openForm, act }) {
  const [f, setF] = useState("Open");
  const scoped = role === "legal" ? db.issues.filter(i => i.type === "Legal")
    : role === "finance" ? db.issues.filter(i => i.type === "Financial") : db.issues;
  const rows = scoped.filter(i => f === "All" ? true
    : f === "Open" ? i.status !== "Resolved"
    : f === "Overdue" ? (i.status !== "Resolved" && new Date(i.target) < TODAY)
    : i.status === "Resolved");
  const counts = {
    Open: scoped.filter(i => i.status !== "Resolved").length,
    Overdue: scoped.filter(i => i.status !== "Resolved" && new Date(i.target) < TODAY).length,
    Resolved: scoped.filter(i => i.status === "Resolved").length,
    All: scoped.length,
  };
  const resolved = scoped.filter(i => i.status === "Resolved" && i.resolvedOn);
  const avgDays = resolved.length
    ? Math.round(resolved.reduce((a, i) =>
        a + (new Date(i.resolvedOn) - new Date(i.raised)) / 864e5, 0) / resolved.length)
    : null;

  return (
    <div>
      <Head title="Issue log"
        sub={role === "legal" ? "Legal issues — you may resolve these"
          : role === "finance" ? "Financial issues — you may resolve these"
          : "All issue types"}
        right={ROLES[role].write.includes("issue") && <Btn onClick={() => openForm("issue")}>Log issue</Btn>} />

      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 16 }}>
        <Metric label="Open" value={counts.Open} t={counts.Open ? "sky" : "emerald"} />
        <Metric label="Overdue" value={counts.Overdue} sub="past target date"
          t={counts.Overdue ? "rose" : "emerald"} />
        <Metric label="Resolved" value={counts.Resolved} t="emerald" />
        <Metric label="Average to resolve" value={avgDays == null ? "—" : avgDays + "d"}
          sub={resolved.length ? `across ${resolved.length} closed` : "none closed yet"} />
      </div>

      <div style={{ display: "flex", gap: 6, marginBottom: 14, flexWrap: "wrap" }}>
        {["Open", "Overdue", "Resolved", "All"].map(k => (
          <button key={k} onClick={() => setF(k)} className="ksg-btn"
            style={{ padding: "7px 12px", fontSize: 12.5, borderRadius: R.md, cursor: "pointer",
              fontFamily: "inherit", fontWeight: 500,
              border: `1px solid ${f === k ? T.primary : T.border}`,
              background: f === k ? T.primary : T.card, color: f === k ? "#fff" : T.fg }}>
            {k} · {counts[k]}</button>))}
      </div>

      {!rows.length ? <Empty title={f === "Open" ? "Nothing open in your queue" : `No ${f.toLowerCase()} issues`}
          hint={f === "Open" ? "Every issue in your scope has been resolved."
            : "Change the filter to see other issues."} />
        : <IssueTable rows={rows} db={db} role={role} act={act} />}
    </div>
  );
}

function Ledger({ db, role, openForm }) {
  const [fy, setFy] = useState("2025/26");
  const rows = db.values.filter(v => fyOf(v.date) === fy);
  const s = valueSummary(rows);
  const queue = db.values.filter(v => NON_CASH.includes(v.type));
  const [tab, setTab] = useState("ledger");
  return (
    <div>
      <Head title="Value ledger" sub="Three accounting streams. Only realised income enters a financial statement."
        right={<div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <div style={{ display: "flex", gap: 2, background: T.zincBg, padding: 3, borderRadius: R.md }}>
            {["2025/26", "2026/27"].map(y => (
              <button key={y} onClick={() => setFy(y)} className="ksg-btn"
                style={{ padding: "5px 11px", fontSize: 12.5, borderRadius: R.sm, cursor: "pointer",
                  fontFamily: "inherit", border: "none", fontWeight: 500,
                  background: fy === y ? T.card : "transparent", color: fy === y ? T.fg : T.fgMuted,
                  boxShadow: fy === y ? "0 1px 2px rgba(0,0,0,.06)" : "none" }}>FY {y}</button>))}
          </div>
          {ROLES[role].write.includes("value") && <Btn onClick={() => openForm("value")}>Record value</Btn>}
        </div>} />

      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 16 }}>
        <Metric label="Realised income" value={fmt(s.realisedIncome)}
          sub={`Revenue ${fmt(s.revenue)} · Grants ${fmt(s.grants)}`} t="emerald" />
        <Metric label="In-kind" value={fmt(s.inKindTotal)}
          sub={`Assets ${fmt(s.inKindAssets)} · Services ${fmt(s.inKindServices)}`} t="amber" />
        <Metric label="Cost avoided" value={fmt(s.costAvoided)} sub="Enters no ledger" t="sky" />
        <Metric label="Total economic benefit" value={fmt(s.totalBenefit)} sub="Not revenue" />
      </div>

      <div style={{ display: "flex", gap: 2, marginBottom: 14, background: T.zincBg,
        padding: 3, borderRadius: R.md, width: "fit-content" }}>
        {[["ledger", `Ledger · ${rows.length}`], ["queue", `Valuation queue · ${queue.length}`]].map(([k, l]) => (
          <button key={k} onClick={() => setTab(k)} className="ksg-btn"
            style={{ padding: "6px 13px", fontSize: 13, borderRadius: R.sm, cursor: "pointer",
              fontFamily: "inherit", border: "none", fontWeight: 500,
              background: tab === k ? T.card : "transparent", color: tab === k ? T.fg : T.fgMuted,
              boxShadow: tab === k ? "0 1px 2px rgba(0,0,0,.06)" : "none" }}>{l}</button>))}
      </div>

      {tab === "ledger" && (!rows.length ? <Empty title="Nothing recorded for this financial year"
        hint="Entries appear once value is recorded against an activity." /> : (
        <Card style={{ overflowX: "auto", padding: "16px 4px 4px" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 900 }}>
            <thead><tr><Th>Date</Th><Th>Qtr</Th><Th w="17%">Partnership</Th><Th w="16%">Activity</Th>
              <Th>Type</Th><Th>Stream</Th><Th w="20%">Description</Th><Th right>Amount</Th></tr></thead>
            <tbody>{rows.map(v => {
              const m = db.mous.find(x => x.id === v.mou), a = db.acts.find(x => x.id === v.act);
              const st = streamOf(v.type);
              return (
                <tr key={v.id} className="ksg-row">
                  <Td num style={{ color: T.fgMuted, fontSize: 13 }}>{dt(v.date)}</Td>
                  <Td num style={{ fontSize: 13 }}>{qOf(v.date)}</Td>
                  <Td style={{ fontSize: 13 }}>{m ? db.partnerOf(m).name : "—"}</Td>
                  <Td style={{ fontSize: 13 }}>{a ? a.name :
                    <span style={{ color: T.amber }}>unattributed</span>}</Td>
                  <Td><Badge t={st === "income" ? "emerald" : st === "in_kind" ? "amber" : "sky"}>
                    {v.type}</Badge></Td>
                  <Td style={{ fontSize: 12.5, color: T.fgMuted }}>{st}</Td>
                  <Td>{v.desc}</Td>
                  <Td num right style={{ fontWeight: 500 }}>{fmtFull(v.amount)}</Td>
                </tr>);
            })}</tbody>
          </table>
        </Card>
      ))}

      {tab === "queue" && (
        <>
          <div style={{ marginBottom: 12 }}>
            <Note t="amber">Non-cash entries needing treatment at year end. In-kind assets are
              capitalised, in-kind services expensed, cost savings need no accounting entry at all —
              but every one needs a defensible valuation basis.</Note>
          </div>
          <Card style={{ overflowX: "auto", padding: "16px 4px 4px" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 820 }}>
              <thead><tr><Th>Date</Th><Th w="17%">Partnership</Th><Th>Type</Th>
                <Th w="24%">Description</Th><Th w="26%">Valuation basis</Th><Th right>Amount</Th></tr></thead>
              <tbody>{queue.map(v => {
                const m = db.mous.find(x => x.id === v.mou);
                return (
                  <tr key={v.id}>
                    <Td num style={{ color: T.fgMuted, fontSize: 13 }}>{dt(v.date)}</Td>
                    <Td style={{ fontSize: 13 }}>{m ? db.partnerOf(m).name : "—"}</Td>
                    <Td><Badge t={streamOf(v.type) === "in_kind" ? "amber" : "sky"}>{v.type}</Badge></Td>
                    <Td>{v.desc}</Td>
                    <Td style={{ fontSize: 12.5, color: T.fgMuted }}>{v.evidence}</Td>
                    <Td num right style={{ fontWeight: 500 }}>{fmtFull(v.amount)}</Td>
                  </tr>);
              })}</tbody>
            </table>
          </Card>
        </>
      )}
    </div>
  );
}

function Reports({ db }) {
  const qs = ["Q1", "Q2", "Q3", "Q4"];
  const rows = qs.map(q => {
    const v = db.values.filter(x => fyOf(x.date) === "2025/26" && qOf(x.date) === q);
    const s = valueSummary(v);
    return { q, ...s };
  });
  const max = Math.max(...rows.map(r => r.totalBenefit), 1);

  const turn = STAGES.filter(s => s.phase !== "Closure").map(s => {
    const done = db.events.filter(e => e.stage === s.code && e.exited);
    const ds = done.map(e => Math.round((new Date(e.exited) - new Date(e.entered)) / 864e5));
    return { s, n: done.length,
      avg: ds.length ? Math.round(ds.reduce((a, b) => a + b, 0) / ds.length) : null,
      open: db.events.filter(e => e.stage === s.code && !e.exited).length };
  }).filter(r => r.n > 0 || r.open > 0);

  return (
    <div>
      <Head title="Reports & returns" sub="Financial year runs 1 July to 30 June" />
      <Card pad={20} style={{ marginBottom: 16 }}>
        <div className="eyebrow" style={{ color: T.fgMuted, marginBottom: 16 }}>Quarterly value — FY 2025/26</div>
        <div style={{ display: "flex", gap: 20, alignItems: "flex-end", height: 150, marginBottom: 14 }}>
          {rows.map(r => (
            <div key={r.q} style={{ flex: 1, textAlign: "center" }}>
              <div style={{ display: "flex", flexDirection: "column", justifyContent: "flex-end",
                height: 118, gap: 2 }}>
                {[[r.costAvoided, T.sky], [r.inKindTotal, T.amber], [r.realisedIncome, T.emerald]]
                  .map(([v, c], i) => v > 0 && <div key={i} style={{ height: `${(v / max) * 114}px`,
                    background: c, borderRadius: i === 0 ? "4px 4px 0 0" : 0 }} />)}
                {r.totalBenefit === 0 && <div style={{ height: 2, background: T.border }} />}
              </div>
              <div style={{ fontSize: 13, fontWeight: 500, marginTop: 9 }}>{r.q}</div>
              <div className="tnum" style={{ fontSize: 12, color: T.fgSubtle, marginTop: 2 }}>
                {r.totalBenefit ? fmt(r.totalBenefit) : "nil"}</div>
            </div>))}
        </div>
        <div style={{ display: "flex", gap: 16, fontSize: 12.5, color: T.fgMuted,
          borderTop: `1px solid ${T.borderSubtle}`, paddingTop: 12, flexWrap: "wrap" }}>
          {[["Realised income", T.emerald], ["In-kind", T.amber], ["Cost avoided", T.sky]].map(([l, c]) => (
            <span key={l} style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
              <span style={{ width: 9, height: 9, borderRadius: 2, background: c }} />{l}</span>))}
        </div>
      </Card>

      <Card pad={18}>
        <div className="eyebrow" style={{ color: T.fgMuted, marginBottom: 3 }}>Clearance turnaround</div>
        <div style={{ fontSize: 12.5, color: T.fgMuted, marginBottom: 14 }}>
          Derived entirely from stage transitions. A single stage column cannot produce this.
        </div>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead><tr><Th w="40%">Stage</Th><Th right>Completed</Th><Th right>Avg days</Th><Th right>Open now</Th></tr></thead>
          <tbody>{turn.map(({ s, n, avg, open }) => (
            <tr key={s.code}>
              <Td>{s.label}</Td>
              <Td num right>{n}</Td>
              <Td num right style={{ color: avg > TH.CUSTODY_AGEING ? T.amber : T.fg,
                fontWeight: avg > TH.CUSTODY_AGEING ? 500 : 400 }}>{avg ?? "—"}</Td>
              <Td num right>{open}</Td>
            </tr>))}</tbody>
        </table>
      </Card>
    </div>
  );
}

function Partners({ db, role, openForm, go }) {
  return (
    <div>
      <Head title="Partner directory" sub="A partner is recorded once; every MOU attaches to it"
        right={ROLES[role].write.includes("partner") &&
          <Btn onClick={() => openForm("partner")}>Add partner</Btn>} />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))", gap: 12 }}>
        {db.partners.map(p => {
          const ms = db.mous.filter(m => m.partnerId === p.id);
          return (
            <Card key={p.id} pad={16}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 8, marginBottom: 6 }}>
                <div className="serif" style={{ fontSize: 16, lineHeight: 1.3 }}>{p.name}</div>
                <Badge>{p.type}</Badge>
              </div>
              <div style={{ fontSize: 12.5, color: T.fgMuted, marginBottom: 12 }}>
                {p.country}{p.person ? ` · ${p.person}` : ""}</div>
              {!ms.length && <div style={{ fontSize: 12.5, color: T.amber, paddingTop: 10,
                borderTop: `1px solid ${T.borderSubtle}` }}>No MOU recorded yet</div>}
              {ms.map(m => (
                <div key={m.id} className="ksg-row" onClick={() => go("track", m.id)}
                  style={{ display: "flex", justifyContent: "space-between", gap: 8, padding: "9px 0 0",
                    borderTop: `1px solid ${T.borderSubtle}`, alignItems: "center" }}>
                  <span className="tnum" style={{ fontSize: 12.5, color: T.fgMuted }}>{m.ref}</span>
                  <StatusBadge s={db.statusOf(m).status} atRisk={db.statusOf(m).atRisk} />
                </div>))}
            </Card>);
        })}
      </div>
    </div>
  );
}

function Alerts({ role, db, go }) {
  const list = [];
  db.mous.forEach(m => {
    if (m.stage === "closed") return;
    const p = db.partnerOf(m), d = db.statusOf(m), band = custodyBand(m);
    if (band === "overdue" || band === "ageing")
      list.push({ m, p, rule: "Clearance overdue", txt: `Held ${days(m.stageSince)} days by ${m.holder || stageOf(m.stage).holder}`,
        sev: band === "overdue" ? "High" : "Medium", who: "legal" });
    if (d.status === "Dormant")
      list.push({ m, p, rule: "Dormant", txt: `Nothing logged for ${d.since} days`, sev: "High", who: "all" });
    if (d.atRisk)
      list.push({ m, p, rule: "At risk of dormancy", txt: `Nothing logged for ${d.since} days`, sev: "Medium", who: "all" });
    if (d.status === "Expired")
      list.push({ m, p, rule: "Expired", txt: "End date passed — renew or close", sev: "Medium", who: "all" });
    if (!m.officer) list.push({ m, p, rule: "No officer assigned", txt: "Assign a DLC officer", sev: "Medium", who: "all" });
    const toEnd = Math.round((new Date(m.end) - TODAY) / 864e5);
    if (toEnd > 0 && toEnd < TH.EXPIRY_WARNING)
      list.push({ m, p, rule: "Approaching expiry", txt: `Ends in ${toEnd} days`, sev: "Medium", who: "all" });
  });
  db.acts.forEach(a => {
    const inds = db.indicators.filter(i => i.act === a.id);
    if (a.basis === "indicator" && !inds.length && a.status !== "Cancelled") {
      const m = db.mous.find(x => x.id === a.mou);
      if (m) list.push({ m, p: db.partnerOf(m), rule: "Activity has no indicator",
        txt: a.name, sev: "Low", who: "all" });
    }
  });
  const rows = role === "legal" ? list.filter(a => a.who === "legal" || a.rule === "Expired") : list;
  return (
    <div>
      <Head title="Alerts" sub="Recomputed on every read from stage and activity history"
        right={<Badge t={rows.length ? "rose" : "emerald"}>{rows.length} open</Badge>} />
      {!rows.length ? <Empty title="Nothing needs attention"
        hint="Alerts appear as partnerships stall, expire or change stage." /> : (
        <Card style={{ padding: 0, overflow: "hidden" }}>{rows.map((a, i) => (
          <div key={i} className="ksg-row" tabIndex={0} onClick={() => go("track", a.m.id)}
            style={{ display: "flex", gap: 14, padding: "14px 18px", alignItems: "center",
              borderBottom: i === rows.length - 1 ? "none" : `1px solid ${T.borderSubtle}` }}>
            <div style={{ width: 3, alignSelf: "stretch", borderRadius: 999,
              background: a.sev === "High" ? T.rose : a.sev === "Medium" ? T.amber : T.sky }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                <span style={{ fontSize: 13.5, fontWeight: 600 }}>{a.rule}</span>
                <span className="tnum" style={{ fontSize: 12.5, color: T.fgSubtle }}>{a.m.ref}</span>
              </div>
              <div style={{ fontSize: 13, color: T.fgMuted, marginTop: 3 }}>{a.p.name} — {a.txt}</div>
            </div>
            <Badge t={a.sev === "High" ? "rose" : a.sev === "Medium" ? "amber" : "sky"}>{a.sev}</Badge>
          </div>))}</Card>
      )}
    </div>
  );
}

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
