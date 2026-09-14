import React, { useState } from "react";
import { Head, Btn, Metric, Empty } from "../Utilities.jsx";
import IssueTable from "./IssueTable.jsx";
import { ROLES } from "../../constants/roles.js";
import { T, R } from "../../constants/theme.js";
import { TODAY } from "../../utils/helpers.js";

export default function Issues({ role, db, openForm, act }) {
  const [f, setF] = useState("Open");
  const scoped = role === "legal" ? db.issues.filter(i => i.type === "Legal")
    : role === "finance" ? db.issues.filter(i => i.type === "Financial") : db.issues;
  const rows = scoped.filter(i => f === "All" ? true
    : f === "Open" ? i.status !== "Resolved"
    : f === "Overdue" ? (i.status !== "Resolved" && new Date(i.target) < TODAY)
    : i.status === "Resolved");
  const counts = {
    Open: scoped.filter(i => i.status !== "Resolved").length,
    Overdue: scoped.filter(i => i.status !== "Resolved" && new Date(i.target) < TODAY).length,
    Resolved: scoped.filter(i => i.status === "Resolved").length,
    All: scoped.length,
  };
  const resolved = scoped.filter(i => i.status === "Resolved" && i.resolvedOn);
  const avgDays = resolved.length
    ? Math.round(resolved.reduce((a, i) =>
        a + (new Date(i.resolvedOn) - new Date(i.raised)) / 864e5, 0) / resolved.length)
    : null;

  return (
    <div>
      <Head title="Issue log"
        sub={role === "legal" ? "Legal issues — you may resolve these"
          : role === "finance" ? "Financial issues — you may resolve these"
          : "All issue types"}
        right={ROLES[role].write.includes("issue") && <Btn onClick={() => openForm("issue")}>Log issue</Btn>} />

      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 16 }}>
        <Metric label="Open" value={counts.Open} t={counts.Open ? "sky" : "emerald"} />
        <Metric label="Overdue" value={counts.Overdue} sub="past target date"
          t={counts.Overdue ? "rose" : "emerald"} />
        <Metric label="Resolved" value={counts.Resolved} t="emerald" />
        <Metric label="Average to resolve" value={avgDays == null ? "—" : avgDays + "d"}
          sub={resolved.length ? `across ${resolved.length} closed` : "none closed yet"} />
      </div>

      <div style={{ display: "flex", gap: 6, marginBottom: 14, flexWrap: "wrap" }}>
        {["Open", "Overdue", "Resolved", "All"].map(k => (
          <button key={k} onClick={() => setF(k)} className="ksg-btn"
            style={{ padding: "7px 12px", fontSize: 12.5, borderRadius: R.md, cursor: "pointer",
              fontFamily: "inherit", fontWeight: 500,
              border: `1px solid ${f === k ? T.primary : T.border}`,
              background: f === k ? T.primary : T.card, color: f === k ? "#fff" : T.fg }}>
            {k} · {counts[k]}</button>))}
      </div>

      {!rows.length ? <Empty title={f === "Open" ? "Nothing open in your queue" : `No ${f.toLowerCase()} issues`}
          hint={f === "Open" ? "Every issue in your scope has been resolved."
            : "Change the filter to see other issues."} />
        : <IssueTable rows={rows} db={db} role={role} act={act} />}
    </div>
  );
}
