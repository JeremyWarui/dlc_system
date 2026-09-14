import React, { useState, useMemo } from "react";
import { Head, Metric, Card, Bar, Badge } from "./Utilities.jsx";
import { ROLES } from "../constants/roles.js";
import { T, R } from "../constants/theme.js";
import { TH } from "../constants/thresholds.js";
import { CATS, TYPES, NON_CASH } from "../constants/types.js";
import { TODAY, fyOf, custodyBand, fmt, days, dt } from "../utils/helpers.js";
import { valueSummary } from "../utils/calculations.js";

export default function Dashboard({ role, db, go }) {
  const { mous, values, issues, partnerOf, statusOf } = db;
  const S = mous.map(m => ({ m, ...statusOf(m) }));
  const n = s => S.filter(x => x.status === s).length;
  const atRisk = S.filter(x => x.atRisk), dormant = S.filter(x => x.status === "Dormant");
  const fyVals = values.filter(v => fyOf(v.date) === "2025/26");
  const vs = valueSummary(fyVals);
  const allVs = valueSummary(values);
  const stuck = mous.filter(m => ["overdue", "ageing"].includes(custodyBand(m)));
  const open = issues.filter(i => i.status !== "Resolved");

  const byType = TYPES.map(t => ({ t, n: mous.filter(m => partnerOf(m).type === t).length }));
  const totalT = byType.reduce((a, b) => a + b.n, 0) || 1;

  const catValue = useMemo(() => {
    const acc = {}; CATS.forEach(c => acc[c] = 0); acc["Unattributed"] = 0;
    values.forEach(v => { const a = db.acts.find(x => x.id === v.act);
      acc[a ? a.cat : "Unattributed"] += v.amount; });
    return acc;
  }, [values, db.acts]);
  const catRows = CATS.map(c => ({ c, n: mous.filter(m => m.cats.includes(c)).length, v: catValue[c] || 0 }));
  const maxV = Math.max(...catRows.map(x => x.v), 1), maxN = Math.max(...catRows.map(x => x.n), 1);
  const [catMode, setCatMode] = useState("value");

  const top = useMemo(() => mous.map(m => ({ m,
    s: valueSummary(values.filter(v => v.mou === m.id)) }))
    .sort((a, b) => b.s.totalBenefit - a.s.totalBenefit).slice(0, 6), [mous, values]);
  const maxBen = Math.max(...top.map(x => x.s.totalBenefit), 1);

  return (
    <div>
      <Head eyebrow={`${ROLES[role].name} · FY 2026/27 Q1`}
        title={role === "dg" ? "Institutional overview" : role === "finance" ? "Financial position"
          : role === "legal" ? "Clearance workload" : role === "officer" ? "My work queue" : "Portfolio overview"} />

      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 20 }}>
        {role === "finance" ? (<>
          <Metric label="Realised income" value={fmt(vs.realisedIncome)} sub="FY 25/26 · enters the accounts" t="emerald" />
          <Metric label="In-kind received" value={fmt(allVs.inKindTotal)} sub="Assets and services" t="amber" />
          <Metric label="Cost avoided" value={fmt(allVs.costAvoided)} sub="Never enters a ledger" t="zinc" />
          <Metric label="Awaiting valuation" value={values.filter(v => NON_CASH.includes(v.type)).length} sub="Non-cash entries" t="violet" />
        </>) : role === "legal" ? (<>
          <Metric label="In clearance" value={mous.filter(m => ["legal_internal", "legal_external"].includes(m.stage)).length} t="amber" />
          <Metric label="Longest held" value={`${Math.max(...stuck.map(m => days(m.stageSince)), 0)}d`} t="rose" />
          <Metric label="Open legal issues" value={issues.filter(i => i.type === "Legal" && i.status !== "Resolved").length} />
          <Metric label="Overdue issues" value={issues.filter(i => i.type === "Legal" && i.status !== "Resolved" && new Date(i.target) < TODAY).length} t="rose" />
        </>) : (<>
          <Metric label="Active" value={n("Active")} sub={`of ${mous.length} partnerships`} t="emerald" />
          <Metric label="At risk" value={atRisk.length} sub={`${TH.AT_RISK}+ days quiet`} t="amber" />
          <Metric label="Dormant" value={dormant.length} sub={`${TH.DORMANCY}+ days quiet`} t="amber" />
          <Metric label="In inception" value={n("Pending")} sub="Not yet signed" t="sky" />
          <Metric label="Realised income" value={fmt(vs.realisedIncome)} sub="FY 25/26" t="emerald" />
          <Metric label="Open issues" value={open.length} t="rose" />
        </>)}
      </div>

      {(dormant.length || atRisk.length) > 0 && role !== "legal" && role !== "finance" && (
        <Card pad={18} style={{ marginBottom: 16 }}>
          <div className="eyebrow" style={{ color: T.fgMuted, marginBottom: 3 }}>Dormancy watch</div>
          <div style={{ fontSize: 13, color: T.fgMuted, marginBottom: 14 }}>
            In implementation with nothing logged. Recording achievement or value returns them to Active.
          </div>
          {[...dormant, ...atRisk].map(({ m, status, since, lastActivity }) => (
            <div key={m.id} className="ksg-row" tabIndex={0} onClick={() => go("track", m.id)}
              style={{ padding: "10px 10px", margin: "0 -10px", borderRadius: R.md }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 10, marginBottom: 7 }}>
                <span style={{ fontSize: 13.5 }}>{partnerOf(m).name}</span>
                <span style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <span className="tnum" style={{ fontSize: 12.5, color: T.fgSubtle }}>
                    {lastActivity ? dt(lastActivity) : "never"}</span>
                  <Badge t={status === "Dormant" ? "amber" : "zinc"}>{since}d</Badge>
                </span>
              </div>
              <Bar pct={(since / TH.DORMANCY) * 100} t={status === "Dormant" ? "amber" : "emerald"} />
            </div>
          ))}
        </Card>
      )}

      <Card pad={18} style={{ marginBottom: 16 }}>
        <div className="eyebrow" style={{ color: T.fgMuted, marginBottom: 14 }}>Partnership reach</div>
        <div style={{ display: "flex", height: 8, borderRadius: 999, overflow: "hidden", marginBottom: 16, gap: 2 }}>
          {byType.map(({ t, n }, i) => <div key={t} style={{ width: `${(n / totalT) * 100}%`,
            background: [T.emerald, T.sky, T.violet][i], borderRadius: 999 }} />)}
        </div>
        <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
          {byType.map(({ t, n }, i) => (
            <div key={t} style={{ flex: "1 1 140px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 4 }}>
                <span style={{ width: 8, height: 8, borderRadius: 999, background: [T.emerald, T.sky, T.violet][i] }} />
                <span style={{ fontSize: 13, color: T.fgMuted }}>{t}</span>
              </div>
              <div className="tnum" style={{ fontSize: 22, fontWeight: 600 }}>{n}</div>
              <div className="tnum" style={{ fontSize: 12.5, color: T.fgSubtle }}>
                {Math.round((n / totalT) * 100)}% of portfolio</div>
            </div>
          ))}
        </div>
      </Card>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(340px,1fr))", gap: 16 }}>
        <Card pad={18}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <div className="eyebrow" style={{ color: T.fgMuted }}>Area of collaboration</div>
            <div style={{ display: "flex", gap: 2, background: T.zincBg, padding: 2, borderRadius: R.md }}>
              {[["value", "Value"], ["count", "Count"]].map(([k, l]) => (
                <button key={k} onClick={() => setCatMode(k)} className="ksg-btn"
                  style={{ padding: "3px 10px", fontSize: 12.5, borderRadius: R.sm, cursor: "pointer",
                    fontFamily: "inherit", border: "none", fontWeight: 500,
                    background: catMode === k ? T.card : "transparent",
                    color: catMode === k ? T.fg : T.fgMuted,
                    boxShadow: catMode === k ? "0 1px 2px rgba(0,0,0,.06)" : "none" }}>{l}</button>))}
            </div>
          </div>
          {catRows.map(({ c, n, v }) => (
            <div key={c} style={{ marginBottom: 13 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 6 }}>
                <span style={{ color: T.fgMuted }}>{c}</span>
                <span className="tnum" style={{ fontWeight: 500 }}>
                  {catMode === "value" ? (v ? fmt(v) : "—") : n}</span>
              </div>
              <Bar pct={catMode === "value" ? (v / maxV) * 100 : (n / maxN) * 100}
                t={catMode === "value" ? "sky" : "emerald"} />
            </div>
          ))}
          <div style={{ fontSize: 12.5, color: T.fgSubtle, marginTop: 14, paddingTop: 12,
            borderTop: `1px solid ${T.borderSubtle}` }}>
            {catMode === "value" ? "Attributed through the earning activity — no double counting."
              : "A partnership may span several areas, so counts exceed the register total."}
          </div>
        </Card>

        <Card pad={18}>
          <div className="eyebrow" style={{ color: T.fgMuted, marginBottom: 3 }}>Highest economic benefit</div>
          <div style={{ fontSize: 12.5, color: T.fgMuted, marginBottom: 14 }}>
            Income, in-kind and avoided cost combined. A management figure, not revenue.
          </div>
          {top.map(({ m, s }) => (
            <div key={m.id} className="ksg-row" tabIndex={0} onClick={() => go("track", m.id)}
              style={{ padding: "9px 10px", margin: "0 -10px", borderRadius: R.md }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 10, marginBottom: 6 }}>
                <span style={{ fontSize: 13, overflow: "hidden", textOverflow: "ellipsis",
                  whiteSpace: "nowrap" }}>{partnerOf(m).name}</span>
                <span className="tnum" style={{ fontSize: 13, fontWeight: 600 }}>
                  {s.totalBenefit ? fmt(s.totalBenefit) : "—"}</span>
              </div>
              <div style={{ display: "flex", height: 6, borderRadius: 999, overflow: "hidden", gap: 1,
                background: T.zincBg }}>
                {[[s.realisedIncome, T.emerald], [s.inKindTotal, T.amber], [s.costAvoided, T.sky]]
                  .map(([val, col], i) => val > 0 &&
                    <div key={i} style={{ width: `${(val / maxBen) * 100}%`, background: col }} />)}
              </div>
            </div>
          ))}
          <div style={{ display: "flex", gap: 14, fontSize: 12, color: T.fgSubtle, marginTop: 14,
            paddingTop: 12, borderTop: `1px solid ${T.borderSubtle}`, flexWrap: "wrap" }}>
            {[["Income", T.emerald], ["In-kind", T.amber], ["Avoided", T.sky]].map(([l, c]) => (
              <span key={l} style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
                <span style={{ width: 8, height: 8, borderRadius: 2, background: c }} />{l}</span>))}
          </div>
        </Card>
      </div>
    </div>
  );
}
