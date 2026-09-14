import React from "react";
import { Head, Badge, Empty, Card } from "../Utilities.jsx";
import { stageOf } from "../../constants/stages.js";
import { TH } from "../../constants/thresholds.js";
import { T } from "../../constants/theme.js";
import { custodyBand, days, TODAY } from "../../utils/helpers.js";

export default function Alerts({ role, db, go }) {
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
