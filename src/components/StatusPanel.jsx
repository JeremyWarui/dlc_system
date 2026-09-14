import React from "react";
import { Card, StatusBadge } from "./Utilities.jsx";
import { deriveStatus } from "../utils/calculations.js";
import { stageOf, SEQ_IMPL, SEQ_CLOSED } from "../constants/stages.js";
import { TH } from "../constants/thresholds.js";
import { dt } from "../utils/helpers.js";
import { T } from "../constants/theme.js";

export default function StatusPanel({ mou, db }) {
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
