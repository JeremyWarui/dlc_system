import React from "react";
import { Head, Btn, Card, Badge, StatusBadge } from "../Utilities.jsx";
import { ROLES } from "../../constants/roles.js";
import { T } from "../../constants/theme.js";

export default function Partners({ db, role, openForm, go }) {
  return (
    <div>
      <Head title="Partner directory" sub="A partner is recorded once; every MOU attaches to it"
        right={ROLES[role].write.includes("partner") &&
          <Btn onClick={() => openForm("partner")}>Add partner</Btn>} />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))", gap: 12 }}>
        {db.partners.map(p => {
          const ms = db.mous.filter(m => m.partnerId === p.id);
          return (
            <Card key={p.id} pad={16}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 8, marginBottom: 6 }}>
                <div className="serif" style={{ fontSize: 16, lineHeight: 1.3 }}>{p.name}</div>
                <Badge>{p.type}</Badge>
              </div>
              <div style={{ fontSize: 12.5, color: T.fgMuted, marginBottom: 12 }}>
                {p.country}{p.person ? ` · ${p.person}` : ""}</div>
              {!ms.length && <div style={{ fontSize: 12.5, color: T.amber, paddingTop: 10,
                borderTop: `1px solid ${T.borderSubtle}` }}>No MOU recorded yet</div>}
              {ms.map(m => (
                <div key={m.id} className="ksg-row" onClick={() => go("track", m.id)}
                  style={{ display: "flex", justifyContent: "space-between", gap: 8, padding: "9px 0 0",
                    borderTop: `1px solid ${T.borderSubtle}`, alignItems: "center" }}>
                  <span className="tnum" style={{ fontSize: 12.5, color: T.fgMuted }}>{m.ref}</span>
                  <StatusBadge s={db.statusOf(m).status} atRisk={db.statusOf(m).atRisk} />
                </div>))}
            </Card>);
        })}
      </div>
    </div>
  );
}
