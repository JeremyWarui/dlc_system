import React, { useState } from "react";
import { Head, Btn, Metric, Empty, Card, Th, Td, Badge, Note } from "../Utilities.jsx";
import { ROLES } from "../../constants/roles.js";
import { T, R } from "../../constants/theme.js";
import { NON_CASH, streamOf } from "../../constants/types.js";
import { fyOf, qOf, dt, fmt, fmtFull } from "../../utils/helpers.js";
import { valueSummary } from "../../utils/calculations.js";

export default function Ledger({ db, role, openForm }) {
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
