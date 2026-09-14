import { stageOf, SEQ_CLOSED, SEQ_SIGNED, SEQ_IMPL } from "../constants/stages.js";
import { TH } from "../constants/thresholds.js";
import { INCOME } from "../constants/types.js";
import { TODAY, days, dt, maxDate } from "./helpers.js";

/* ---------- scoring: per-indicator ratio, then average ----------
   A study visit carries "visits: 1" and "participants: 20". Summing
   targets would add visits to people: 6/21 = 29% instead of 62%.   */
export function activityScore(act, db) {
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

export function mouImplementation(mou, db) {
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
export function valueSummary(entries) {
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
export function deriveStatus(mou, db) {
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
    why = seq >= SEQ_IMPL ? "Implementing; last logged " + since + " days ago." : "Activated, implementation not yet begun.";
  }
  const atRisk = seq >= SEQ_IMPL && status === "Active" && since !== null && since > TH.AT_RISK;
  return { status, why, atRisk, since, lastActivity };
}
