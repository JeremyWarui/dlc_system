/* Who may resolve what. An issue names an accountable UNIT, but units are not
   users — the person clicking resolve is always a system user acting on what
   that unit reported back. */
export const canResolve = (role, issue) => {
  if (["director", "officer"].includes(role)) return true;
  if (role === "legal") return issue.type === "Legal";
  if (role === "finance") return issue.type === "Financial";
  return false;
};

/* ---------- roles ---------- */
export const ROLES = {
  dg: { name: "Director General", short: "DG", scope: "All partnerships · read only",
        views: ["overview", "register", "track", "ledger", "reports", "partners"], write: [] },
  director: { name: "Director, Linkages & Collaborations", short: "DLC", scope: "All partnerships · full authority",
        views: ["overview", "register", "track", "activities", "issues", "ledger", "reports", "partners", "alerts"],
        write: ["partner", "mou", "activity", "indicator", "achievement", "issue", "value", "stage", "assign", "close", "renew", "complete"] },
  finance: { name: "Finance", short: "FIN", scope: "Value ledger · valuation queue",
        views: ["overview", "register", "ledger", "reports"], write: ["value", "issue"] },
  legal: { name: "Legal Services", short: "LEG", scope: "MOUs in clearance · legal issues",
        views: ["overview", "register", "track", "issues", "alerts"], write: ["stage", "issue"] },
  officer: { name: "DLC Officer", short: "OFF", scope: "Assigned partnerships · data entry",
        views: ["overview", "register", "track", "activities", "issues", "ledger", "partners", "alerts"],
        write: ["partner", "activity", "indicator", "achievement", "issue", "value", "stage"] },
};

export const VIEW_LABEL = {
  overview: "Dashboard", register: "MOU register", track: "MOU dossier",
  activities: "Activities", issues: "Issues", ledger: "Value ledger",
  reports: "Reports", partners: "Partners", alerts: "Alerts",
};
