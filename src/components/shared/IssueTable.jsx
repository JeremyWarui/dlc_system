import React, { useState } from "react";
import { Card, Th, Td, Badge, Btn } from "../Utilities.jsx";
import { canResolve } from "../../constants/roles.js";
import { T, R } from "../../constants/theme.js";
import { dt, days, TODAY } from "../../utils/helpers.js";

export default function IssueTable({ rows, db, role, act }) {
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
