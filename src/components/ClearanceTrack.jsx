import React from "react";
import { STAGES, sIdx, stageOf } from "../constants/stages.js";
import { T, tone } from "../constants/theme.js";
import { days, custodyBand, custodyTone } from "../utils/helpers.js";
import { Note } from "./Utilities.jsx";

export default function Track({ mou }) {
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
