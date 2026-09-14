import React from "react";
import { T, R, tone, TONE } from "../constants/theme.js";
import { TH } from "../constants/thresholds.js";

export const Badge = ({ children, t = "zinc", subtle }) => {
  const c = tone(t);
  return (
    <span className="tnum" style={{
      background: subtle ? "transparent" : c.bg, color: c.fg,
      border: `1px solid ${subtle ? "transparent" : c.border}`,
      fontSize: 11.5, fontWeight: 500, padding: "2px 7px", borderRadius: R.md,
      whiteSpace: "nowrap", display: "inline-block", lineHeight: 1.45,
    }}>{children}</span>
  );
};

export const StatusBadge = ({ s, atRisk }) => (
  <span style={{ display: "inline-flex", gap: 5, alignItems: "center" }}>
    <Badge t={TONE[s] || "zinc"}>{s}</Badge>
    {atRisk && <Badge t="amber">at risk</Badge>}
  </span>
);

export const Card = ({ children, style, pad }) => (
  <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: R.lg,
    padding: pad, ...style }}>{children}</div>
);

export const Head = ({ eyebrow, title, sub, right }) => (
  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between",
    gap: 16, marginBottom: 20, flexWrap: "wrap" }}>
    <div>
      {eyebrow && <div className="eyebrow" style={{ color: T.amber, marginBottom: 6 }}>{eyebrow}</div>}
      <h2 className="serif" style={{ fontSize: 25, fontWeight: 500, color: T.fg, margin: 0,
        letterSpacing: "-0.01em" }}>{title}</h2>
      {sub && <div style={{ fontSize: 13, color: T.fgMuted, marginTop: 5 }}>{sub}</div>}
    </div>
    {right}
  </div>
);

export const Metric = ({ label, value, sub, t }) => (
  <Card pad={18} style={{ flex: "1 1 170px", minWidth: 155 }}>
    <div className="eyebrow" style={{ color: T.fgMuted }}>{label}</div>
    <div className="serif" style={{ fontSize: 28, fontWeight: 500, marginTop: 7,
      color: t ? T[t] : T.fg, lineHeight: 1.1 }}>{value}</div>
    {sub && <div style={{ fontSize: 12.5, color: T.fgSubtle, marginTop: 3 }}>{sub}</div>}
  </Card>
);

export const Bar = ({ pct, t }) => (
  <div style={{ background: T.zincBg, height: 6, borderRadius: 999, overflow: "hidden", flex: 1, minWidth: 44 }}>
    <div style={{ width: `${Math.min(pct, 100)}%`, height: "100%", borderRadius: 999,
      background: t ? T[t] : pct >= TH.IMPL_STRONG ? T.emerald : pct >= TH.IMPL_PARTIAL ? T.amber : T.rose }} />
  </div>
);

export const Th = ({ children, w, right }) => (
  <th style={{ textAlign: right ? "right" : "left", fontSize: 12, color: T.fgMuted, fontWeight: 500,
    padding: "0 14px 10px", borderBottom: `1px solid ${T.border}`, width: w, whiteSpace: "nowrap" }}>{children}</th>
);

export const Td = ({ children, style, right, num }) => (
  <td className={num ? "tnum" : ""} style={{ padding: "12px 14px", fontSize: 13.5, color: T.fg,
    borderBottom: `1px solid ${T.borderSubtle}`, verticalAlign: "middle",
    textAlign: right ? "right" : "left", ...style }}>{children}</td>
);

export const Empty = ({ title, hint, action }) => (
  <Card pad={44} style={{ textAlign: "center" }}>
    <div className="serif" style={{ fontSize: 17, color: T.fg }}>{title}</div>
    <div style={{ fontSize: 13.5, color: T.fgMuted, marginTop: 6, maxWidth: 460, margin: "6px auto 0" }}>{hint}</div>
    {action && <div style={{ marginTop: 18 }}>{action}</div>}
  </Card>
);

export const Btn = ({ children, onClick, kind = "primary", sm }) => {
  const m = {
    primary: { bg: T.primary, fg: "#fff", bd: T.primary },
    outline: { bg: T.card, fg: T.fg, bd: T.border },
    ghost: { bg: "transparent", fg: T.fgMuted, bd: "transparent" },
    danger: { bg: T.card, fg: T.rose, bd: T.roseBorder },
  }[kind];
  return <button onClick={onClick} className="ksg-btn" style={{
    padding: sm ? "5px 10px" : "8px 14px", fontSize: sm ? 12.5 : 13.5, fontWeight: 500,
    borderRadius: R.md, cursor: "pointer", fontFamily: "inherit",
    border: `1px solid ${m.bd}`, background: m.bg, color: m.fg, whiteSpace: "nowrap",
  }}>{children}</button>;
};

export const inputCss = {
  width: "100%", padding: "8px 11px", border: `1px solid ${T.border}`, borderRadius: R.md,
  fontSize: 13.5, fontFamily: "inherit", background: T.card, color: T.fg,
};

export const Field = ({ label, hint, children, span }) => (
  <div style={{ marginBottom: 16, gridColumn: span ? "1 / -1" : undefined }}>
    <div style={{ marginBottom: 6, display: "flex", gap: 8, alignItems: "baseline", flexWrap: "wrap" }}>
      <label style={{ fontSize: 13, fontWeight: 500, color: T.fg }}>{label}</label>
      {hint && <span style={{ fontSize: 12, color: T.fgSubtle }}>{hint}</span>}
    </div>{children}
  </div>
);

export const Txt = p => <input {...p} style={inputCss} />;

export const Sel = ({ options, ...p }) => (
  <select {...p} style={inputCss}><option value="">Select…</option>
    {options.map(o => typeof o === "string"
      ? <option key={o} value={o}>{o}</option>
      : <option key={o.v} value={o.v}>{o.l}</option>)}</select>
);

export const Area = p => <textarea rows={3} {...p} style={{ ...inputCss, resize: "vertical" }} />;

export const Chips = ({ options, value, onChange }) => (
  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
    {options.map(o => { const on = value.includes(o);
      return <button key={o} onClick={() => onChange(on ? value.filter(v => v !== o) : [...value, o])}
        className="ksg-btn" style={{ padding: "5px 10px", fontSize: 12.5, borderRadius: R.md,
          cursor: "pointer", fontFamily: "inherit", fontWeight: 500,
          border: `1px solid ${on ? T.primary : T.border}`,
          background: on ? T.primary : T.card, color: on ? "#fff" : T.fgMuted }}>{o}</button>; })}
  </div>
);

export function Drawer({ open, title, sub, onClose, onSave, saveLabel = "Save", children, wide }) {
  if (!open) return null;
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(9,9,11,.42)",
      zIndex: 50, display: "flex", justifyContent: "flex-end" }}>
      <div className="drawer" onClick={e => e.stopPropagation()} style={{ width: wide ? 620 : 470,
        maxWidth: "100%", background: T.card, height: "100%", overflowY: "auto",
        display: "flex", flexDirection: "column" }}>
        <div style={{ padding: "20px 24px 16px", borderBottom: `1px solid ${T.border}`,
          position: "sticky", top: 0, background: T.card, zIndex: 2 }}>
          <div className="serif" style={{ fontSize: 20, color: T.fg }}>{title}</div>
          {sub && <div style={{ fontSize: 13, color: T.fgMuted, marginTop: 4 }}>{sub}</div>}
        </div>
        <div style={{ padding: "20px 24px", flex: 1 }}>{children}</div>
        <div style={{ padding: "14px 24px", borderTop: `1px solid ${T.border}`, background: T.card,
          display: "flex", gap: 8, justifyContent: "flex-end", position: "sticky", bottom: 0 }}>
          <Btn kind="outline" onClick={onClose}>Cancel</Btn>
          {onSave && <Btn onClick={onSave}>{saveLabel}</Btn>}
        </div>
      </div>
    </div>
  );
}

export const Note = ({ children, t = "zinc" }) => {
  const c = tone(t);
  return <div style={{ background: c.bg, border: `1px solid ${c.border}`, borderRadius: R.md,
    padding: "11px 13px", fontSize: 13, color: T.fg, lineHeight: 1.55 }}>{children}</div>;
};
