import { stageOf } from "../constants/stages.js";
import { TH } from "../constants/thresholds.js";

/* ---------- helpers ---------- */
export const TODAY = new Date("2026-08-30");
export const days = d => d ? Math.round((TODAY - new Date(d)) / 864e5) : null;
export const fmt = n => !n ? "—" : n >= 1e6 ? "KES " + (n / 1e6).toFixed(1) + "M" : "KES " + Math.round(n / 1e3) + "K";
export const fmtFull = n => "KES " + Number(n).toLocaleString();
export const dt = d => d ? new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "—";
export const today = () => "2026-08-30";
export const maxDate = (...ds) => {
  const v = ds.filter(Boolean).map(d => new Date(d));
  return v.length ? new Date(Math.max(...v)).toISOString().slice(0, 10) : null;
};
export const fyOf = d => {
  const x = new Date(d), y = x.getFullYear();
  return x.getMonth() + 1 >= 7
    ? `${y}/${String((y + 1) % 100).padStart(2, "0")}`
    : `${y - 1}/${String(y % 100).padStart(2, "0")}`;
};
export const qOf = d => {
  const m = new Date(d).getMonth() + 1;
  return m >= 7 && m <= 9 ? "Q1" : m >= 10 ? "Q2" : m <= 3 ? "Q3" : "Q4";
};

export const custodyBand = m => {
  const st = stageOf(m.stage);
  if (!["Inception", "Activation"].includes(st.phase)) return "not_applicable";
  const d = days(m.stageSince);
  return d > TH.CUSTODY_OVERDUE ? "overdue" : d > TH.CUSTODY_AGEING ? "ageing" : "fresh";
};

export const custodyTone = b =>
  b === "overdue" ? "rose" : b === "ageing" ? "amber" : b === "fresh" ? "emerald" : "zinc";
