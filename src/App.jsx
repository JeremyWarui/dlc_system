import React, { useState, useEffect } from "react";

/* ---------- data & constants ---------- */
import {
  SEED_PARTNERS,
  SEED_MOUS,
  SEED_ACTS,
  SEED_INDICATORS,
  SEED_ACH,
  SEED_VALUES,
  SEED_ISSUES,
} from "../data/seedData.js";
import { T, R } from "./constants/theme.js";
import { STAGES, sIdx, stageOf } from "./constants/stages.js";
import { ROLES, VIEW_LABEL } from "./constants/roles.js";
import {
  CATS,
  TYPES,
  UNITS,
  EXTERNAL_BODIES,
  OFFICERS,
  BASES,
  VALUE_TYPES,
  streamOf,
  NON_CASH,
  ISSUE_TYPES,
  SEVERITIES,
  ACT_STATUS,
} from "./constants/types.js";

/* ---------- helpers & calculations ---------- */
import { today, dt, days, fyOf, qOf, fmtFull } from "./utils/helpers.js";
import { deriveStatus } from "./utils/calculations.js";

/* ---------- ui primitives ---------- */
import { Drawer, Note, Field, Txt, Sel, Area, Chips, inputCss } from "./components/Utilities.jsx";

/* ---------- views ---------- */
import Dashboard from "./components/dashboard.jsx";
import Register from "./components/register/Register.jsx";
import Dossier from "./components/dossier/Dossier.jsx";
import Activities from "./components/shared/Activities.jsx";
import Issues from "./components/shared/Issues.jsx";
import Ledger from "./components/shared/Ledger.jsx";
import Reports from "./components/shared/Reports.jsx";
import Partners from "./components/shared/Partners.jsx";
import Alerts from "./components/shared/Alerts.jsx";

export default function App() {
  const [role, setRole] = useState("director");
  const [view, setView] = useState("overview");
  const [selected, setSelected] = useState(8);
  const [toast, setToast] = useState(null);

  const [partners, setPartners] = useState(SEED_PARTNERS);
  const [mous, setMous] = useState(SEED_MOUS);
  const [acts, setActs] = useState(SEED_ACTS);
  const [indicators, setIndicators] = useState(SEED_INDICATORS);
  const [achievements, setAchievements] = useState(SEED_ACH);
  const [values, setValues] = useState(SEED_VALUES);
  const [issues, setIssues] = useState(SEED_ISSUES);
  const [events, setEvents] = useState(() =>
    SEED_MOUS.flatMap(m => STAGES.slice(0, sIdx(m.stage) + 1).map((s, i, arr) => ({
      id: `${m.id}-${s.code}`, mou: m.id, stage: s.code,
      entered: i === arr.length - 1 ? m.stageSince : m.start,
      exited: i === arr.length - 1 ? null : m.stageSince,
      holder: i === arr.length - 1 && m.holder ? m.holder
        : ["External", "Partner"].includes(s.holder) ? "DLC" : s.holder,
      remarks: "" }))));

  const [form, setForm] = useState(null);
  const [d, setD] = useState({});
  useEffect(() => { setD(form ? { ...form.data } : {}); }, [form]);
  const set = k => e => setD({ ...d, [k]: e.target.value });
  const openForm = (kind, data = {}) => setForm({ kind, data });
  const close = () => setForm(null);
  const say = m => { setToast(m); setTimeout(() => setToast(null), 4200); };

  const partnerOf = m => partners.find(p => p.id === m.partnerId) || { name: "—", type: "—", country: "—" };
  const base = { partners, mous, acts, indicators, achievements, values, issues, events, partnerOf };
  const statusOf = m => deriveStatus(m, base);
  const db = { ...base, statusOf };

  const mou = mous.find(m => m.id === selected) || mous[0];
  const nid = arr => Math.max(0, ...arr.map(x => x.id)) + 1;
  const go = (v, id) => { setView(v); if (id) setSelected(id); };
  const allowed = ROLES[role].views;
  const current = allowed.includes(view) ? view : "overview";
  const switchRole = r => { setRole(r); if (!ROLES[r].views.includes(view)) setView("overview"); };

  const moveStage = (code, remarks, holder, eff) => {
    setEvents(ev => [...ev.map(e => e.mou === mou.id && !e.exited ? { ...e, exited: eff } : e),
      { id: `${mou.id}-${code}-${Date.now()}`, mou: mou.id, stage: code, entered: eff, exited: null,
        holder: holder || (["External", "Partner"].includes(stageOf(code).holder) ? "DLC" : stageOf(code).holder),
        remarks: remarks || "" }]);
    setMous(ms => ms.map(m => m.id === mou.id
      ? { ...m, stage: code, stageSince: eff, holder: holder || null,
          implSince: code === "implementation" ? eff : m.implSince } : m));
  };

  const act = {
    logAchievement: (a, i) => openForm("achievement", { actId: a.id, indId: i.id,
      indName: i.name, indUnit: i.unit, target: i.target, actName: a.name }),
    addIndicator: a => openForm("indicator", { actId: a.id, actName: a.name }),
    markComplete: m => { setMous(ms => ms.map(x => x.id === m.id ? { ...x, isCompleted: true } : x));
      say(`${m.ref} marked complete.`); },
    startIssue: i => { setIssues(list => list.map(x => x.id === i.id ? { ...x, status: "Ongoing" } : x));
      say("Issue moved to Ongoing."); },
    resolveIssue: i => openForm("resolve", { id: i.id, desc: i.desc, type: i.type, raised: i.raised }),
    reopenIssue: i => openForm("reopen", { id: i.id, desc: i.desc, resolution: i.resolution }),
    reviseTarget: i => openForm("revise", { id: i.id, desc: i.desc, target: i.target,
      origTarget: i.origTarget, count: i.revisions.length }),
  };

  const save = () => {
    switch (form?.kind) {
      case "partner": {
        if (!d.name || !d.type) return say("Partner name and type are required.");
        setPartners([...partners, { id: nid(partners), name: d.name, country: d.country || "—",
          type: d.type, person: d.person || "", contact: d.contact || "" }]);
        say(`${d.name} added.`); break;
      }
      case "mou": {
        if (!d.partnerId || !d.title) return say("Partner and title are required.");
        const id = nid(mous), stage = d.stage || "eoi";
        const ref = d.ref || `MOU-26-${String(id).padStart(3, "0")}`;
        setMous([...mous, { id, ref, partnerId: +d.partnerId, title: d.title, stage,
          stageSince: today(), implSince: stage === "implementation" ? today() : null,
          start: d.start || today(), end: d.end || today(), cats: d.cats || [],
          officer: d.officer || "", contract: d.contract ? +d.contract : null,
          prev: null, isCompleted: false, holder: null }]);
        setEvents([...events, { id: `${id}-${stage}`, mou: id, stage, entered: today(),
          exited: null, holder: stageOf(stage).holder, remarks: "Record opened" }]);
        setSelected(id); setView("track"); say(`${ref} opened at ${stageOf(stage).label.toLowerCase()}.`); break;
      }
      case "activity": {
        if (!d.name || !d.cat || !(d.units || []).length)
          return say("Activity, area and at least one implementing unit are required.");
        setActs([...acts, { id: nid(acts), mou: mou.id, name: d.name, cat: d.cat,
          units: d.units, basis: d.basis || "indicator", status: d.status || "Not started",
          planned: d.planned ? +d.planned : null, start: d.start || today(), end: d.end || today() }]);
        say(d.basis === "narrative"
          ? "Activity added. Narrative activities are excluded from the implementation score."
          : "Activity added. Add at least one indicator so it can be measured."); break;
      }
      case "indicator": {
        if (!d.name || !d.unit) return say("Indicator name and unit of measure are required.");
        setIndicators([...indicators, { id: nid(indicators), act: d.actId, name: d.name,
          unit: d.unit, target: d.target ? +d.target : 1 }]);
        say(`Indicator added — target ${d.target || 1} ${d.unit}.`); break;
      }
      case "achievement": {
        if (!d.value) return say("Enter the amount achieved.");
        const before = statusOf(mou).status;
        const entry = { id: nid(achievements), ind: d.indId, date: d.date || today(),
          value: +d.value, note: d.note || "" };
        setAchievements([...achievements, entry]);
        const after = deriveStatus(mou, { ...base, achievements: [...achievements, entry] });
        say(before !== after.status
          ? `Logged. ${mou.ref} moved ${before} → ${after.status}. Status is derived, not set.`
          : "Achievement logged. Dormancy clock reset.");
        break;
      }
      case "value": {
        if (!d.type || !d.amount) return say("Value type and amount are required.");
        if (NON_CASH.includes(d.type) && !d.evidence)
          return say("Non-cash entries need a valuation basis. For a cost saving that means the counterfactual — what KSG would have paid.");
        const before = statusOf(mou).status;
        const entry = { id: nid(values), mou: mou.id, act: d.act ? +d.act : null, type: d.type,
          desc: d.desc || "", amount: +d.amount, date: d.date || today(), evidence: d.evidence || "" };
        setValues([...values, entry]);
        const after = deriveStatus(mou, { ...base, values: [...values, entry] });
        say(before !== after.status
          ? `${fmtFull(d.amount)} recorded. ${mou.ref} moved ${before} → ${after.status}.`
          : `${fmtFull(d.amount)} recorded as ${streamOf(d.type)}.`);
        break;
      }
      case "issue": {
        if (!d.desc || !d.target) return say("Description and target date are required.");
        setIssues([...issues, { id: nid(issues), mou: +d.mou || mou.id, type: d.type || "Operational",
          desc: d.desc, sev: d.sev || "Medium", status: "Pending", unit: d.unit || "DLC",
          target: d.target, origTarget: d.target, revisions: [], raised: today(),
          resolvedOn: null, resolution: "" }]);
        say("Issue logged — assigned to " + (d.unit || "DLC") + "."); break;
      }
      case "stage": {
        const nx = STAGES[sIdx(mou.stage) + 1];
        moveStage(nx.code, d.remarks, d.holder, d.effective || today());
        say(`${mou.ref} advanced to ${nx.label.toLowerCase()}.`); break;
      }
      case "revert": {
        const pv = STAGES[sIdx(mou.stage) - 1];
        if (!pv) return say("Already at the first stage.");
        moveStage(pv.code, d.remarks || "Returned for correction", null, d.effective || today());
        say(`Returned to ${pv.label.toLowerCase()}.`); break;
      }
      case "close": {
        if (!d.reason) return say("A closure reason is required.");
        moveStage("closed", d.reason, null, d.effective || today());
        say(`${mou.ref} closed.`); break;
      }
      case "renew": {
        const id = nid(mous);
        const gen = (mou.ref.match(/\/R(\d+)$/) ? +mou.ref.match(/\/R(\d+)$/)[1] + 1 : 1);
        const ref = mou.ref.replace(/\/R\d+$/, "") + `/R${gen}`;
        setMous([...mous, { ...mou, id, ref, prev: mou.id, stage: "signed",
          stageSince: d.effective || today(), implSince: null, isCompleted: false, holder: null,
          start: d.start || today(), end: d.end || today(),
          contract: d.contract ? +d.contract : mou.contract }]);
        setEvents([...events, { id: `${id}-signed`, mou: id, stage: "signed",
          entered: d.effective || today(), exited: null, holder: "DLC",
          remarks: `Renewal of ${mou.ref}` }]);
        setSelected(id); say(`${ref} created — re-enters at signing, then activation.`); break;
      }
      case "assign": {
        setMous(mous.map(m => m.id === mou.id ? { ...m, officer: d.officer || "" } : m));
        say(d.officer ? `${mou.ref} assigned to ${d.officer}.` : "Officer cleared."); break;
      }
      case "resolve": {
        if (!d.resolvedOn || !d.resolution) return say("Date resolved and what was done are required.");
        setIssues(issues.map(i => i.id === d.id
          ? { ...i, status: "Resolved", resolvedOn: d.resolvedOn, resolution: d.resolution } : i));
        say("Issue marked resolved."); break;
      }
      case "revise": {
        if (!d.newTarget || !d.why) return say("New target date and reason are required.");
        setIssues(issues.map(i => i.id === d.id ? {
          ...i, target: d.newTarget,
          revisions: [...i.revisions, { from: d.target, to: d.newTarget, on: today(), why: d.why }],
        } : i));
        say("Target date revised."); break;
      }
      case "reopen": {
        if (!d.why) return say("State why the issue is being reopened.");
        setIssues(issues.map(i => i.id === d.id ? {
          ...i, status: "Ongoing", resolvedOn: null,
          resolution: i.resolution ? `${i.resolution} [Reopened ${today()}: ${d.why}]` : `[Reopened ${today()}: ${d.why}]`,
        } : i));
        say("Issue reopened — returned to Ongoing."); break;
      }
      default: break;
    }
    close();
  };

  const G2 = { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 14px" };
  const F = form?.kind;
  const nextStage = STAGES[sIdx(mou.stage) + 1];

  return (
    <div className="ksg" style={{ background: T.bg, minHeight: "100vh", color: T.fg }}>
      <div style={{ display: "flex", minHeight: "100vh" }}>
        <nav style={{ width: 232, background: T.rail, flexShrink: 0, padding: "20px 0",
          position: "sticky", top: 0, height: "100vh", overflowY: "auto" }}>
          <div style={{ padding: "0 18px 18px", borderBottom: "1px solid rgba(255,255,255,.09)" }}>
            <div className="serif" style={{ color: "#fff", fontSize: 17, lineHeight: 1.25 }}>
              Kenya School<br />of Government</div>
            <div className="eyebrow" style={{ color: T.amber, marginTop: 8 }}>Partnerships &amp; MOUs</div>
          </div>
          <div style={{ padding: "12px 10px" }}>
            {allowed.map(v => (
              <button key={v} onClick={() => go(v)} className="ksg-nav"
                style={{ display: "block", width: "100%", textAlign: "left", padding: "8px 12px",
                  fontSize: 13.5, border: "none", cursor: "pointer", fontFamily: "inherit",
                  borderRadius: R.md, marginBottom: 1, fontWeight: current === v ? 500 : 400,
                  borderLeft: `2px solid ${current === v ? T.amber : "transparent"}`,
                  background: current === v ? "rgba(255,255,255,.10)" : "transparent",
                  color: current === v ? "#fff" : "rgba(255,255,255,.62)" }}>{VIEW_LABEL[v]}</button>))}
          </div>
          <div style={{ padding: "14px 18px", borderTop: "1px solid rgba(255,255,255,.09)", marginTop: 4 }}>
            <div className="eyebrow" style={{ color: "rgba(255,255,255,.4)", marginBottom: 10 }}>Viewing as</div>
            {Object.entries(ROLES).map(([k, r]) => (
              <button key={k} onClick={() => switchRole(k)} className="ksg-nav"
                style={{ display: "block", width: "100%", textAlign: "left", padding: "6px 8px",
                  marginLeft: -8, fontSize: 12.5, border: "none", cursor: "pointer", borderRadius: R.md,
                  fontFamily: "inherit", fontWeight: role === k ? 500 : 400,
                  background: role === k ? "rgba(154,111,38,.25)" : "transparent",
                  color: role === k ? T.amber : "rgba(255,255,255,.55)" }}>{r.name}</button>))}
          </div>
        </nav>

        <main style={{ flex: 1, minWidth: 0 }}>
          <header style={{ background: T.card, borderBottom: `1px solid ${T.border}`,
            padding: "12px 28px", display: "flex", justifyContent: "space-between",
            alignItems: "center", gap: 16, flexWrap: "wrap", position: "sticky", top: 0, zIndex: 10 }}>
            <div style={{ fontSize: 13, color: T.fgMuted }}>
              <span style={{ color: T.fg, fontWeight: 500 }}>{ROLES[role].name}</span>
              <span style={{ margin: "0 8px", color: T.border }}>·</span>{ROLES[role].scope}</div>
            <div className="tnum" style={{ fontSize: 12.5, color: T.fgMuted }}>30 Aug 2026 · FY 2026/27 Q1</div>
          </header>

          <div style={{ padding: "26px 28px 60px", width: "100%" }}>
            {current === "overview" && <Dashboard role={role} db={db} go={go} />}
            {current === "register" && <Register role={role} db={db} go={go} openForm={openForm} />}
            {current === "track" && <Dossier db={db} selected={selected} setSelected={setSelected}
              role={role} openForm={openForm} act={act} />}
            {current === "activities" && <Activities db={db} role={role} act={act} />}
            {current === "issues" && <Issues role={role} db={db} openForm={openForm} act={act} />}
            {current === "ledger" && <Ledger db={db} role={role} openForm={openForm} />}
            {current === "reports" && <Reports db={db} />}
            {current === "partners" && <Partners db={db} role={role} openForm={openForm} go={go} />}
            {current === "alerts" && <Alerts role={role} db={db} go={go} />}

            <div style={{ marginTop: 40, paddingTop: 18, borderTop: `1px solid ${T.border}`,
              fontSize: 12.5, color: T.fgSubtle, lineHeight: 1.6 }}>
              Prototype with illustrative data · matches schema v3.5. Status is derived on every render,
              never stored. Try logging achievement against the AAPAM roundtable to watch it return to
              Active, or resolve an issue as Legal Services to see the resolution rule bite.
            </div>
          </div>
        </main>
      </div>

      {/* ---------- forms ---------- */}
      <Drawer open={F === "partner"} title="Add a partner"
        sub="Recorded once — every MOU signed with them attaches to this record"
        onClose={close} onSave={save} saveLabel="Add partner">
        <Field label="Partner name" span><Txt value={d.name || ""} onChange={set("name")} /></Field>
        <div style={G2}>
          <Field label="Country"><Txt value={d.country || ""} onChange={set("country")} /></Field>
          <Field label="Type" hint="reach"><Sel options={TYPES} value={d.type || ""} onChange={set("type")} /></Field>
          <Field label="Contact person"><Txt value={d.person || ""} onChange={set("person")} /></Field>
          <Field label="Contact details"><Txt value={d.contact || ""} onChange={set("contact")} /></Field>
        </div>
      </Drawer>

      <Drawer open={F === "mou"} title="Record a new MOU" wide
        sub="Open at expression of interest, not after the inception meeting"
        onClose={close} onSave={save} saveLabel="Open record">
        <div style={G2}>
          <Field label="Partner" span>
            <select value={d.partnerId || ""} onChange={set("partnerId")} style={inputCss}>
              <option value="">Select partner…</option>
              {partners.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select></Field>
          <Field label="Title" span><Txt value={d.title || ""} onChange={set("title")} /></Field>
          <Field label="Reference" hint="auto if blank"><Txt value={d.ref || ""} onChange={set("ref")} /></Field>
          <Field label="Opening stage">
            <select value={d.stage || "eoi"} onChange={set("stage")} style={inputCss}>
              {STAGES.filter(s => s.code !== "closed").map(s =>
                <option key={s.code} value={s.code}>{s.label}</option>)}</select></Field>
          <Field label="Start date"><Txt type="date" value={d.start || ""} onChange={set("start")} /></Field>
          <Field label="End date"><Txt type="date" value={d.end || ""} onChange={set("end")} /></Field>
          <Field label="Assigned officer"><Sel options={OFFICERS} value={d.officer || ""} onChange={set("officer")} /></Field>
          <Field label="Contract value (KES)" hint="leave blank if none">
            <Txt type="number" value={d.contract || ""} onChange={set("contract")} /></Field>
        </div>
        <Field label="Areas of collaboration" span>
          <Chips options={CATS} value={d.cats || []} onChange={v => setD({ ...d, cats: v })} /></Field>
        <Note>Leaving contract value blank is correct for academic exchange MOUs with no
          financial target. Revenue achievement then reads "no target set", never 0%.</Note>
      </Drawer>

      <Drawer open={F === "activity"} title="Add activity" wide
        sub={mou.ref} onClose={close} onSave={save} saveLabel="Add activity">
        <Field label="Activity" span><Txt value={d.name || ""} onChange={set("name")} /></Field>
        <div style={G2}>
          <Field label="Area of collaboration"><Sel options={CATS} value={d.cat || ""} onChange={set("cat")} /></Field>
          <Field label="Status"><Sel options={ACT_STATUS} value={d.status || ""} onChange={set("status")} /></Field>
          <Field label="Planned start"><Txt type="date" value={d.start || ""} onChange={set("start")} /></Field>
          <Field label="Planned end"><Txt type="date" value={d.end || ""} onChange={set("end")} /></Field>
        </div>
        <Field label="Implementing units" hint="select all that deliver this activity" span>
          <Chips options={UNITS} value={d.units || []} onChange={v => setD({ ...d, units: v })} /></Field>
        <Field label="How is this measured?" span>
          <Sel options={BASES} value={d.basis || "indicator"} onChange={set("basis")} /></Field>
        {d.basis === "narrative" && <Note t="amber">
          Narrative activities are recorded but excluded from the implementation denominator.
          They are never scored zero — an activity nobody set a target for is not a failed activity.
        </Note>}
        {(!d.basis || d.basis === "indicator") && <Note>
          Add indicators after saving. A one-off event is an indicator too — target 1,
          unit "occurrence". An activity may carry several with different units.
        </Note>}
      </Drawer>

      <Drawer open={F === "indicator"} title="Add indicator" sub={d.actName}
        onClose={close} onSave={save} saveLabel="Add indicator">
        <Field label="Indicator name" span><Txt value={d.name || ""} onChange={set("name")}
          placeholder="e.g. Faculty participating" /></Field>
        <div style={G2}>
          <Field label="Unit of measure"><Txt value={d.unit || ""} onChange={set("unit")}
            placeholder="participants" /></Field>
          <Field label="Target"><Txt type="number" value={d.target ?? 1} onChange={set("target")} /></Field>
        </div>
        <Field label="Means of verification" span><Txt value={d.mov || ""} onChange={set("mov")}
          placeholder="attendance register, travel authority" /></Field>
        <Note>A study visit carries two indicators — "visits: 1" and "participants: 20".
          Each is scored on its own ratio and the activity takes the average, because
          summing targets would add visits to people.</Note>
      </Drawer>

      <Drawer open={F === "achievement"} title="Log achievement" sub={`${d.actName} · ${d.indName}`}
        onClose={close} onSave={save} saveLabel="Log achievement">
        <Note>Target {d.target} {d.indUnit}. This writes a dated row and never overwrites a
          total, so quarterly achievement is derived rather than retyped.</Note>
        <div style={{ ...G2, marginTop: 16 }}>
          <Field label={`Achieved (${d.indUnit || "units"})`}>
            <Txt type="number" value={d.value || ""} onChange={set("value")} /></Field>
          <Field label="Date achieved"><Txt type="date" value={d.date || today()} onChange={set("date")} /></Field>
        </div>
        <Field label="Narrative" span><Area value={d.note || ""} onChange={set("note")} /></Field>
      </Drawer>

      <Drawer open={F === "value"} title="Record value" sub={mou.ref}
        onClose={close} onSave={save} saveLabel="Record value">
        <div style={G2}>
          <Field label="Value type"><Sel options={VALUE_TYPES.map(v => v.v)} value={d.type || ""}
            onChange={set("type")} /></Field>
          <Field label="Amount (KES)"><Txt type="number" value={d.amount || ""} onChange={set("amount")} /></Field>
          <Field label="Date realised"><Txt type="date" value={d.date || today()} onChange={set("date")} /></Field>
          <Field label="Attribute to activity">
            <select value={d.act || ""} onChange={set("act")} style={inputCss}>
              <option value="">Not attributed</option>
              {acts.filter(a => a.mou === mou.id).map(a =>
                <option key={a.id} value={a.id}>{a.name}</option>)}</select></Field>
        </div>
        <Field label="Description" span><Area rows={2} value={d.desc || ""} onChange={set("desc")} /></Field>
        <Field label="Valuation basis"
          hint={NON_CASH.includes(d.type) ? "required for this type" : "optional for cash"} span>
          <Txt value={d.evidence || ""} onChange={set("evidence")}
            placeholder={d.type === "Cost saving" ? "3 quotations; KSG would have paid X" : "Invoice or valuation reference"} /></Field>
        {d.type && <Note t={streamOf(d.type) === "income" ? "emerald" : streamOf(d.type) === "in_kind" ? "amber" : "sky"}>
          Stream: <strong>{streamOf(d.type)}</strong>.{" "}
          {streamOf(d.type) === "income" ? "Enters the financial statements as cash."
            : streamOf(d.type) === "in_kind" ? "Becomes an asset or an expense — never cash."
            : "An expense NOT incurred. Enters no ledger at all, and is never revenue."}
          {d.date && <> Falls in FY {fyOf(d.date)} {qOf(d.date)}.</>}
        </Note>}
      </Drawer>

      <Drawer open={F === "issue"} title="Log an issue" onClose={close} onSave={save} saveLabel="Log issue">
        <Field label="Partnership" span>
          <select value={d.mou || mou.id} onChange={set("mou")} style={inputCss}>
            {mous.map(m => <option key={m.id} value={m.id}>{partnerOf(m).name} — {m.ref}</option>)}</select></Field>
        <div style={G2}>
          <Field label="Issue type"><Sel options={ISSUE_TYPES} value={d.type || ""} onChange={set("type")} /></Field>
          <Field label="Severity"><Sel options={SEVERITIES} value={d.sev || ""} onChange={set("sev")} /></Field>
          <Field label="Accountable unit"><Sel options={UNITS} value={d.unit || ""} onChange={set("unit")} /></Field>
          <Field label="Target resolution"><Txt type="date" value={d.target || ""} onChange={set("target")} /></Field>
        </div>
        <Field label="Description" span><Area value={d.desc || ""} onChange={set("desc")} /></Field>
      </Drawer>

      <Drawer open={F === "stage" || F === "revert"}
        title={F === "stage" ? `Advance to ${nextStage?.label || ""}` : `Return to ${STAGES[sIdx(mou.stage) - 1]?.label || ""}`}
        sub={`${mou.ref} · ${days(mou.stageSince)} days at ${stageOf(mou.stage).label.toLowerCase()}`}
        onClose={close} onSave={save} saveLabel={F === "stage" ? "Advance stage" : "Return file"}>
        <Note>Saving closes the current row and opens a new one. Elapsed time is preserved for
          the turnaround report.{F === "stage" && nextStage?.code === "implementation" &&
          " This also starts the dormancy clock."}</Note>
        <div style={{ marginTop: 16 }}>
          <Field label="Effective date" span><Txt type="date" value={d.effective || today()}
            onChange={set("effective")} /></Field>
          {F === "stage" && ["legal_external", "mfa"].includes(nextStage?.code) && (
            <Field label="Which body holds it?" hint="leave blank for the stage default" span>
              <Sel options={EXTERNAL_BODIES} value={d.holder || ""} onChange={set("holder")} /></Field>)}
          <Field label="Remarks" span><Area value={d.remarks || ""} onChange={set("remarks")} /></Field>
        </div>
      </Drawer>

      <Drawer open={F === "close"} title="Close partnership" sub={mou.ref}
        onClose={close} onSave={save} saveLabel="Close partnership">
        <Note t="rose">Closure ends reporting on this instrument. Activities, value and issues
          remain on the record and continue to count towards historical totals.</Note>
        <div style={{ marginTop: 16 }}>
          <Field label="Closure reason" span><Sel options={["Completed as planned",
            "Expired without renewal", "Dormant — no implementation", "Terminated by KSG",
            "Terminated by partner", "Superseded by a new instrument"]}
            value={d.reason || ""} onChange={set("reason")} /></Field>
          <Field label="Effective date" span><Txt type="date" value={d.effective || today()}
            onChange={set("effective")} /></Field>
        </div>
      </Drawer>

      <Drawer open={F === "renew"} title="Renew partnership" sub={mou.ref}
        onClose={close} onSave={save} saveLabel="Create renewal">
        <Note>A renewal creates a new instrument linked to this one. The original is retained in
          full — its activities, value and achievement stay attached, so historical reporting
          does not shift.</Note>
        <div style={{ ...G2, marginTop: 16 }}>
          <Field label="New start date"><Txt type="date" value={d.start || ""} onChange={set("start")} /></Field>
          <Field label="New end date"><Txt type="date" value={d.end || ""} onChange={set("end")} /></Field>
          <Field label="Signing date"><Txt type="date" value={d.effective || today()} onChange={set("effective")} /></Field>
          <Field label="Contract value (KES)"><Txt type="number" value={d.contract ?? mou.contract ?? ""}
            onChange={set("contract")} /></Field>
        </div>
      </Drawer>

      <Drawer open={F === "assign"} title="Assign DLC officer" sub={mou.ref}
        onClose={close} onSave={save} saveLabel="Assign">
        <Field label="Officer" hint="single point of accountability" span>
          <Sel options={OFFICERS} value={d.officer ?? mou.officer ?? ""} onChange={set("officer")} /></Field>
        <Note>The assigned officer collects from implementing units and enters on their behalf.
          Those units do not use this system.</Note>
      </Drawer>

      <Drawer open={F === "resolve"} title="Resolve issue" sub={d.desc}
        onClose={close} onSave={save} saveLabel="Mark resolved">
        <Note t="emerald">An issue cannot be resolved without a date and a statement of what was
          done. This is enforced in the database, not just here — so it holds for imports too.</Note>
        <div style={{ marginTop: 16 }}>
          <Field label="Date resolved" hint={`raised ${dt(d.raised)}`} span>
            <Txt type="date" value={d.resolvedOn || today()} onChange={set("resolvedOn")} /></Field>
          <Field label="What was done" hint="required" span>
            <Area rows={4} value={d.resolution || ""} onChange={set("resolution")}
              placeholder="e.g. Supplier valuation obtained and delivery note attached; entry passed to the asset register." /></Field>
        </div>
        <Note>Backdating is allowed — these are usually recorded after the fact. The elapsed
          days feed the average-to-resolve figure on the issue log.</Note>
      </Drawer>

      <Drawer open={F === "revise"} title="Move target date" sub={d.desc}
        onClose={close} onSave={save} saveLabel="Move date">
        <Note t="amber">Current target {dt(d.target)}
          {d.count > 0 && ` · already moved ${d.count}×`}. The original ({dt(d.origTarget)}) stays
          on the record and the register keeps showing it. An issue log where dates move quietly
          is an issue log where nothing is ever overdue.</Note>
        <div style={{ marginTop: 16 }}>
          <Field label="New target date" span>
            <Txt type="date" value={d.newTarget || ""} onChange={set("newTarget")} /></Field>
          <Field label="Why is it moving?" hint="required" span>
            <Area rows={3} value={d.why || ""} onChange={set("why")}
              placeholder="e.g. Treasury requested further documentation" /></Field>
        </div>
      </Drawer>

      <Drawer open={F === "reopen"} title="Reopen issue" sub={d.desc}
        onClose={close} onSave={save} saveLabel="Reopen">
        <Note t="amber">Reopening returns this to Ongoing. The previous resolution is kept and
          your reason is appended, so the record shows it recurred rather than looking as though
          it was never resolved.</Note>
        <div style={{ marginTop: 16 }}>
          <Field label="Why is it being reopened?" span>
            <Area rows={3} value={d.why || ""} onChange={set("why")}
              placeholder="e.g. Clearance stalled again after Treasury raised a fresh query" /></Field>
        </div>
      </Drawer>

      {toast && (
        <div style={{ position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)",
          background: T.fg, color: "#fff", padding: "12px 18px", borderRadius: R.lg, fontSize: 13.5,
          zIndex: 60, maxWidth: "90%", textAlign: "center", lineHeight: 1.5,
          boxShadow: "0 8px 24px rgba(0,0,0,.18)" }}>{toast}</div>
      )}
    </div>
  );
}
