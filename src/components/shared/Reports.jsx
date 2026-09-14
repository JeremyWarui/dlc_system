import React from "react";
import { Head, Card, Th, Td } from "../Utilities.jsx";
import { STAGES } from "../../constants/stages.js";
import { TH } from "../../constants/thresholds.js";
import { T } from "../../constants/theme.js";
import { fyOf, qOf, fmt } from "../../utils/helpers.js";
import { valueSummary } from "../../utils/calculations.js";


export default function Reports({ db }) {
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
