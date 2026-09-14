import React, { useState } from "react";
import { Head, Btn, Card, Th, Td, Empty, Badge, StatusBadge, Bar, inputCss } from "../Utilities.jsx";
import { ROLES } from "../../constants/roles.js";
import { T, R } from "../../constants/theme.js";
import { TH } from "../../constants/thresholds.js";
import { stageOf } from "../../constants/stages.js";
import { custodyBand, custodyTone, days, fmt } from "../../utils/helpers.js";
import { valueSummary, mouImplementation } from "../../utils/calculations.js";

export default function Register({ role, db, go, openForm }) {
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
