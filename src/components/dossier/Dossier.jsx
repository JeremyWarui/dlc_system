import React, { useState } from "react";
import { Head, Metric, Card, Btn, Badge, Bar, Th, Td, Empty, inputCss } from "../Utilities.jsx";
import Track from "../ClearanceTrack.jsx";
import StatusPanel from "../StatusPanel.jsx";
import IssueTable from "../shared/IssueTable.jsx";
import { ROLES } from "../../constants/roles.js";
import { T, R } from "../../constants/theme.js";
import { STAGES, sIdx, stageOf, SEQ_IMPL } from "../../constants/stages.js";
import { streamOf } from "../../constants/types.js";
import { fmt, fmtFull, dt, days, fyOf, qOf } from "../../utils/helpers.js";
import { valueSummary, mouImplementation, activityScore } from "../../utils/calculations.js";

export default function Dossier({ db, selected, setSelected, role, openForm, act }) {
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
