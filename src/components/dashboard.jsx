import React, { useState, useMemo } from "react";
import { Head, Metric, Card, Bar, Badge } from "./Utilities.jsx";
import { ROLES } from "../constants/roles.js";
import { T, R } from "../constants/theme.js";
import { TH } from "../constants/thresholds.js";
import { STAGES, stageOf, SEQ_SIGNED, SEQ_CLOSED } from "../constants/stages.js";
import { CATS, TYPES, NON_CASH } from "../constants/types.js";
import { TODAY, fyOf, qOf, custodyBand, fmt, days, dt } from "../utils/helpers.js";
import { valueSummary, activityScore } from "../utils/calculations.js";
import {
  BarChart, Bar as RBar, XAxis, YAxis, CartesianGrid, Tooltip as RTooltip,
  ResponsiveContainer, PieChart, Pie, Cell, LabelList
} from "recharts";
/* Bar and Tooltip are aliased: the prototype already has its own progress
   Bar component, and Recharts exports the same names. */

  /* ================= charts =================
     Recharts, which is what Tremor is built on — gridlines, real axes, hover
     tooltips and animation, themed from our tokens rather than its defaults.
     ========================================================================= */

const AXIS = { fontSize: 11.5, fill: T.fgMuted, fontFamily: "'IBM Plex Sans', sans-serif" };
const GRID = { stroke: T.borderSubtle, strokeDasharray: "3 3" };

function ChartTip({ active, payload, label, format = fmt }) {
    if (!active || !payload || !payload.length) return null;
    return (
      <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: R.md,
        padding: "9px 11px", boxShadow: "0 4px 14px rgba(20,26,23,.10)", fontSize: 12.5 }}>
        {label != null && <div style={{ fontWeight: 600, marginBottom: 5 }}>{label}</div>}
        {payload.filter(p => p.value > 0).map((p, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 7, marginTop: 2 }}>
            <span style={{ width: 8, height: 8, borderRadius: 2,
              background: p.color || p.payload.fill }} />
            <span style={{ color: T.fgMuted }}>{p.name}</span>
            <span className="tnum" style={{ marginLeft: "auto", fontWeight: 500 }}>
              {format(p.value)}</span>
          </div>))}
      </div>
    );
  }

  const Legend = ({ items }) => (
    <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginTop: 12, paddingTop: 11,
      borderTop: `1px solid ${T.borderSubtle}`, fontSize: 12, color: T.fgMuted }}>
      {items.map(it => (
        <span key={it.label} style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
          <span style={{ width: 9, height: 9, borderRadius: 2, background: it.colour }} />{it.label}</span>))}
    </div>
  );

  /* Horizontal bars — the default. Long labels fit. */
  function HChart({ data, height = 200, format = fmt, colour, sorted = true, unit,
                   compact, limit }) {
    let rows = sorted ? [...data].sort((a, b) => b.value - a.value) : data;
    if (limit && rows.length > limit) {
      const rest = rows.slice(limit);
      rows = [...rows.slice(0, limit),
        { label: `${rest.length} others`, value: rest.reduce((a, b) => a + b.value, 0),
          colour: T.zinc }];
    }
    const labelW = compact ? 104 : 150;
    return (
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={rows} layout="vertical"
          margin={{ top: 4, right: compact ? 34 : 40, left: 0, bottom: 0 }}>
          <CartesianGrid {...GRID} horizontal={false} />
          <XAxis type="number" tick={AXIS} axisLine={false} tickLine={false}
            tickFormatter={v => unit === "days" ? v + "d" : format(v)} />
          <YAxis type="category" dataKey="label" axisLine={false} tickLine={false}
            width={labelW}
            tick={{ ...AXIS, fontSize: compact ? 11 : 11.5 }}
            tickFormatter={v => compact && v.length > 17 ? v.slice(0, 16) + "…" : v} />
          <RTooltip cursor={{ fill: T.zincBg }}
            content={<ChartTip format={v => unit === "days" ? v + " days" : format(v)} />} />
          <RBar dataKey="value" name="Value" radius={[0, 3, 3, 0]} maxBarSize={22}
            animationDuration={420}>
            {rows.map((r, i) => <Cell key={i} fill={r.colour || colour || T.emerald} />)}
            <LabelList dataKey="value" position="right"
              formatter={v => unit === "days" ? v + "d" : format(v)}
              style={{ fontSize: 11.5, fill: T.fg, fontWeight: 500,
                fontFamily: "'IBM Plex Mono', monospace" }} />
          </RBar>
        </BarChart>
      </ResponsiveContainer>
    );
  }

  /* Vertical stacked columns — quarters. */
  function StackChart({ data, series, height = 230 }) {
    return (
      <div>
        <ResponsiveContainer width="100%" height={height}>
          <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid {...GRID} vertical={false} />
            <XAxis dataKey="label" tick={AXIS} axisLine={false} tickLine={false} />
            <YAxis tick={AXIS} axisLine={false} tickLine={false} tickFormatter={fmt} width={64} />
            <RTooltip cursor={{ fill: T.zincBg }} content={<ChartTip />} />
            {series.map((sr, i) => (
              <RBar key={sr.key} dataKey={sr.key} name={sr.label} stackId="a" fill={sr.colour}
                maxBarSize={56} animationDuration={420}
                radius={i === series.length - 1 ? [3, 3, 0, 0] : [0, 0, 0, 0]} />))}
          </BarChart>
        </ResponsiveContainer>
        <Legend items={series} />
      </div>
    );
  }

  /* Donut — ONLY where the parts form a genuine whole and there are 3-4. */
  function DonutChart({ data, height = 210, centreValue, centreLabel, format = fmt }) {
    const total = data.reduce((a, b) => a + b.value, 0);
    return (
      <div>
        <div style={{ position: "relative" }}>
          <ResponsiveContainer width="100%" height={height}>
            <PieChart>
              <Pie data={data} dataKey="value" nameKey="label" cx="50%" cy="50%"
                innerRadius={62} outerRadius={92} paddingAngle={2} strokeWidth={0}
                animationDuration={420}>
                {data.map((d, i) => <Cell key={i} fill={d.colour} />)}
              </Pie>
              <RTooltip content={<ChartTip format={format} />} />
            </PieChart>
          </ResponsiveContainer>
          <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center", pointerEvents: "none" }}>
            <div className="serif" style={{ fontSize: 22, color: T.fg }}>{centreValue}</div>
            <div className="eyebrow" style={{ color: T.fgMuted, marginTop: 2 }}>{centreLabel}</div>
          </div>
        </div>
        <div style={{ marginTop: 4 }}>
          {data.map((d, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 9, padding: "6px 0",
              borderBottom: i === data.length - 1 ? "none" : `1px solid ${T.borderSubtle}` }}>
              <span style={{ width: 9, height: 9, borderRadius: 2, background: d.colour, flexShrink: 0 }} />
              <span style={{ fontSize: 13, flex: 1 }}>{d.label}</span>
              <span className="tnum" style={{ fontSize: 12.5, fontWeight: 500 }}>{format(d.value)}</span>
              <span className="tnum" style={{ fontSize: 11.5, color: T.fgSubtle, minWidth: 36,
                textAlign: "right" }}>{total ? Math.round(d.value / total * 100) : 0}%</span>
            </div>))}
        </div>
      </div>
    );
  }

  /* Section wrapper — gives the dashboard its narrative spine. */
  function Section({ n, title, sub, children }) {
    return (
      <section style={{ marginBottom: 32 }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 12, marginBottom: 4 }}>
          <span className="tnum" style={{ fontSize: 12, color: T.amber }}>{String(n).padStart(2, "0")}</span>
          <h3 className="serif" style={{ fontSize: 19, fontWeight: 500, margin: 0, color: T.fg,
            letterSpacing: "-0.01em" }}>{title}</h3>
        </div>
        {sub && <div style={{ fontSize: 13, color: T.fgMuted, marginBottom: 16, paddingLeft: 30 }}>{sub}</div>}
        <div style={{ paddingLeft: 30, borderLeft: `1px solid ${T.borderSubtle}` }}>{children}</div>
      </section>
    );
  }

  function Panel({ title, sub, children, note, style }) {
    return (
      <Card pad={20} style={style}>
        <div className="eyebrow" style={{ color: T.fgMuted, marginBottom: 4 }}>{title}</div>
        {sub && <div style={{ fontSize: 12.5, color: T.fgSubtle, marginBottom: 16 }}>{sub}</div>}
        {children}
        {note && <div style={{ fontSize: 12, color: T.fgSubtle, marginTop: 13, paddingTop: 11,
          borderTop: `1px solid ${T.borderSubtle}`, lineHeight: 1.5 }}>{note}</div>}
      </Card>
    );
  }

  /* Register summary — exact counts. A table, not a chart. */
  function SummaryTable({ groups }) {
    return (
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <tbody>
          {groups.map((g, gi) => (
            <React.Fragment key={gi}>
              <tr><td colSpan={2} className="eyebrow" style={{ color: T.amber,
                padding: gi === 0 ? "0 0 9px" : "18px 0 9px" }}>{g.title}</td></tr>
              {g.rows.map((r, i) => (
                <tr key={i}>
                  <td style={{ padding: "7px 0", fontSize: 13,
                    borderBottom: `1px solid ${T.borderSubtle}`,
                    color: r.emphasis ? T.fg : T.fgMuted,
                    fontWeight: r.emphasis ? 500 : 400 }}>{r.label}</td>
                  <td className="tnum" style={{ padding: "7px 0", fontSize: 13.5, textAlign: "right",
                    borderBottom: `1px solid ${T.borderSubtle}`, fontWeight: 500,
                    color: r.flag && r.value > 0 ? T[r.flag] : T.fg }}>{r.value}</td>
                </tr>))}
            </React.Fragment>))}
        </tbody>
      </table>
    );
  }

  /* ================= dashboard ================= */
  export default function Dashboard({ role, db, go }) {
    const { mous, values, issues, partnerOf, statusOf, acts, events } = db;
    const S = mous.map(m => ({ m, ...statusOf(m), seq: stageOf(m.stage).seq }));
    const nStatus = k => S.filter(x => x.status === k).length;
    const atRisk = S.filter(x => x.atRisk);
    const dormant = S.filter(x => x.status === "Dormant");
    const G3 = { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(340px,1fr))", gap: 16 };
    const G2 = { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(460px,1fr))", gap: 16 };

    /* ---------- implementation buckets (signed MOUs only) ---------- */
    const impl = useMemo(() => {
      const b = { Ongoing: 0, Completed: 0, Stalled: 0, "Not started": 0 };
      S.filter(x => x.seq >= SEQ_SIGNED && x.seq < SEQ_CLOSED).forEach(({ m, status }) => {
        const a = acts.filter(x => x.mou === m.id);
        if (status === "Dormant") b.Stalled++;
        else if (m.isCompleted || (a.length && a.every(x => ["Completed","Cancelled"].includes(x.status)))) b.Completed++;
        else if (!a.length || a.every(x => x.status === "Not started")) b["Not started"]++;
        else b.Ongoing++;
      });
      return b;
    }, [S, acts]);

    /* ---------- value ---------- */
    const vs = valueSummary(values);
    const streams = [
      { label: "Realised income", value: vs.realisedIncome, colour: T.emerald },
      { label: "In-kind received", value: vs.inKindTotal, colour: T.amber },
      { label: "Cost avoided", value: vs.costAvoided, colour: T.sky },
    ];
    const valueByArea = useMemo(() => {
      const acc = {}; CATS.forEach(c => acc[c] = 0); acc["Unattributed"] = 0;
      values.forEach(v => { const a = acts.find(x => x.id === v.act);
        acc[a ? a.cat : "Unattributed"] += v.amount; });
      return Object.entries(acc).filter(([, v]) => v > 0).map(([label, value]) => ({ label, value }));
    }, [values, acts]);
    const countByArea = CATS.map(c => ({ label: c,
      value: mous.filter(m => m.cats.includes(c)).length, colour: T.sky }));
    const quarters = useMemo(() => ["Q1","Q2","Q3","Q4"].map(q => {
      const v = values.filter(x => fyOf(x.date) === "2025/26" && qOf(x.date) === q);
      const t2 = valueSummary(v);
      return { label: q, income: t2.realisedIncome, inkind: t2.inKindTotal, avoided: t2.costAvoided };
    }), [values]);

    /* ---------- reach ---------- */
    const byCountry = useMemo(() => {
      const acc = {};
      mous.forEach(m => { const c = partnerOf(m).country; acc[c] = (acc[c] || 0) + 1; });
      return Object.entries(acc).map(([label, value]) => ({ label, value, colour: T.emerald }));
    }, [mous]);
    const byType = TYPES.map((t2, i) => ({ label: t2,
      value: mous.filter(m => partnerOf(m).type === t2).length,
      colour: [T.emerald, T.sky, T.violet][i] }));

    /* ---------- pre-signature pipeline ---------- */
    const preSigning = useMemo(() => STAGES.filter(st => st.seq < SEQ_SIGNED).map(st => ({
      label: st.label, value: mous.filter(m => m.stage === st.code).length,
      colour: T.sky })), [mous]);

    const turnaround = useMemo(() => {
      const acc = {};
      events.filter(e => e.exited).forEach(e => {
        const st = stageOf(e.stage);
        if (!["Inception","Activation"].includes(st.phase)) return;
        const who = e.holder || st.holder;
        (acc[who] = acc[who] || []).push(Math.round((new Date(e.exited) - new Date(e.entered)) / 864e5));
      });
      return Object.entries(acc).map(([label, ds]) => {
        const avg = Math.round(ds.reduce((a, b) => a + b, 0) / ds.length);
        return { label, value: avg, colour: avg > TH.CUSTODY_AGEING ? T.rose : T.emerald };
      });
    }, [events]);

    const stuck = mous.filter(m => ["overdue","ageing"].includes(custodyBand(m)))
      .map(m => ({ m, held: days(m.stageSince), band: custodyBand(m) }))
      .sort((a, b) => b.held - a.held);

    const coverage = useMemo(() => {
      const scored = acts.filter(a => activityScore(a, db) !== null).length;
      return acts.length ? Math.round(100 * scored / acts.length) : null;
    }, [acts, db]);
    const concentration = useMemo(() => {
      const per = mous.map(m => valueSummary(values.filter(v => v.mou === m.id)).totalBenefit)
        .sort((a, b) => b - a);
      const tot = per.reduce((a, b) => a + b, 0);
      return tot ? Math.round(100 * per.slice(0, 3).reduce((a, b) => a + b, 0) / tot) : 0;
    }, [mous, values]);

    const dueRenewal = mous.filter(m => { const d = Math.round((new Date(m.end) - TODAY) / 864e5);
      return d > 0 && d <= 180; }).length;

    const summary = [
      { title: "Register", rows: [
        { label: "Total MOUs in register", value: mous.length, emphasis: true },
        { label: "Active", value: nStatus("Active") },
        { label: "Under negotiation", value: nStatus("Pending") },
        { label: "Expired", value: nStatus("Expired"), flag: "rose" },
        { label: "Closed / terminated", value: nStatus("Closed") },
      ]},
      { title: "Implementation", rows: [
        { label: "Workplan developed", value: S.filter(x => x.seq >= 100).length, emphasis: true },
        { label: "Ongoing", value: impl.Ongoing },
        { label: "Completed", value: impl.Completed },
        { label: "Stalled", value: impl.Stalled, flag: "amber" },
        { label: "Not started", value: impl["Not started"], flag: "amber" },
      ]},
      { title: "Requires decision", rows: [
        { label: "Due for renewal within 6 months", value: dueRenewal, flag: "amber", emphasis: true },
        { label: "Past expiry needing review", value: nStatus("Expired"), flag: "rose" },
        { label: "At risk of dormancy", value: atRisk.length, flag: "amber" },
        { label: "Unassigned to an officer", value: mous.filter(m => !m.officer).length, flag: "rose" },
      ]},
    ];

    return (
      <div>
        <Head eyebrow={`${ROLES[role].name} · FY 2026/27 Q1`} title="Portfolio overview"
          sub="Every figure derived from the registers. Status is computed, never typed." />

        {/* ============ 1. OVERVIEW ============ */}
        <Section n={1} title="Overview">
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 16 }}>
            <Metric label="Partnerships" value={mous.length} sub={`${nStatus("Active")} active`} />
            <Metric label="Realised income" value={fmt(vs.realisedIncome)} sub="cash" t="emerald" />
            <Metric label="Economic benefit" value={fmt(vs.totalBenefit)} sub="all three streams" t="amber" />
            <Metric label="Stalled" value={impl.Stalled + atRisk.length}
              sub={`${impl.Stalled} dormant, ${atRisk.length} at risk`}
              t={impl.Stalled ? "rose" : "emerald"} />
            <Metric label="Measured" value={coverage == null ? "—" : coverage + "%"}
              sub="activities with an indicator" t={coverage >= 70 ? "emerald" : "amber"} />
            <Metric label="Top 3 concentration" value={concentration + "%"} sub="of total benefit"
              t={concentration > 70 ? "amber" : undefined} />
          </div>

          {stuck.length > 0 && (
            <Card pad={16} style={{ borderLeft: `3px solid ${T.rose}` }}>
              <div className="eyebrow" style={{ color: T.rose, marginBottom: 10 }}>Requires attention now</div>
              {stuck.map(({ m, held, band }) => (
                <div key={m.id} className="ksg-row" tabIndex={0} onClick={() => go("track", m.id)}
                  style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center",
                    padding: "8px 10px", margin: "0 -10px", borderRadius: R.md }}>
                  <span style={{ fontSize: 13.5 }}>{partnerOf(m).name}</span>
                  <span style={{ display: "flex", gap: 10, alignItems: "center" }}>
                    <span style={{ fontSize: 12.5, color: T.fgMuted }}>
                      {m.holder || stageOf(m.stage).holder}</span>
                    <Badge t={band === "overdue" ? "overdue" : "dormant"}>{held}d</Badge>
                  </span>
                </div>))}
            </Card>)}
        </Section>

        {/* ============ 2. REACH — one row of three ============ */}
        <Section n={2} title="Partnership reach"
          sub="Who KSG partners with, where they are, and what the partnerships cover">
          <div style={G3}>
            <Panel title="By country" sub="Ranked, most partnerships first"
              note="A ranked bar rather than a world map: a dozen countries at one or two partnerships each shade a choropleth identically and say less than this.">
              <HChart data={byCountry} height={230} format={v => v} compact limit={8} />
            </Panel>
            <Panel title="By type of partnership"
              sub="Local within Kenya · Regional within Africa · International beyond">
              <DonutChart data={byType} height={190} centreValue={mous.length}
                centreLabel="PARTNERSHIPS" format={v => v} />
            </Panel>
            <Panel title="By area of collaboration" sub="Counts — an MOU may span several"
              note="Counts exceed the register total by design. Read this against value by area in the next row: most partnerships name the same area, but the value sits elsewhere.">
              <HChart data={countByArea} height={230} format={v => v} compact colour={T.sky} />
            </Panel>
          </div>
        </Section>

        {/* ============ 3. VALUE — one row of three ============ */}
        <Section n={3} title="Partnership value"
          sub="What the portfolio has returned, through which activities, and when">
          <div style={G3}>
            <Panel title="By accounting stream" sub="Only the green slice is revenue"
              note="Not additive for accounting. Income enters the financial statements; in-kind becomes an asset or expense; avoided cost enters no ledger at all.">
              <DonutChart data={streams} height={190} centreValue={fmt(vs.totalBenefit)}
                centreLabel="TOTAL BENEFIT" />
            </Panel>
            <Panel title="By area of collaboration" sub="Attributed through the earning activity"
              note="Runs through the activity that earned it, so an MOU spanning several areas is never double-counted.">
              <HChart data={valueByArea} height={230} compact colour={T.emerald} />
            </Panel>
            <Panel title="By quarter · FY 2025/26"
              sub="Stacked columns, not a line — four points is too few for a trend">
              <StackChart data={quarters} height={200} series={[
                { key: "income", label: "Income", colour: T.emerald },
                { key: "inkind", label: "In-kind", colour: T.amber },
                { key: "avoided", label: "Avoided", colour: T.sky }]} />
            </Panel>
          </div>
        </Section>

        {/* ============ 4. STATUS — one row of two ============ */}
        <Section n={4} title="Status of MOUs"
          sub="Two different questions, deliberately not combined">
          <div style={G2}>
            <Panel title="By implementation" sub="Signed partnerships only — what is being delivered"
              note="A partnership can be Active and Stalled at the same time. Merging this with the lifecycle chart beside it would hide exactly that case.">
              <HChart data={[
                { label: "Ongoing", value: impl.Ongoing, colour: T.emerald },
                { label: "Completed", value: impl.Completed, colour: T.violet },
                { label: "Stalled", value: impl.Stalled, colour: T.amber },
                { label: "Not started", value: impl["Not started"], colour: T.rose }]}
                height={200} format={v => v} />
            </Panel>
            <Panel title="By lifecycle" sub="Where each instrument sits, inception to closure"
              note="A bar, not a pie: six categories of very uneven size are unreadable as slices.">
              <HChart data={[
                { label: "Active", value: nStatus("Active"), colour: T.emerald },
                { label: "Dormant", value: nStatus("Dormant"), colour: T.amber },
                { label: "Under negotiation", value: nStatus("Pending"), colour: T.sky },
                { label: "Expired", value: nStatus("Expired"), colour: T.rose },
                { label: "Completed", value: nStatus("Completed"), colour: T.violet },
                { label: "Closed", value: nStatus("Closed"), colour: T.zinc }]}
                height={200} format={v => v} />
            </Panel>
          </div>
        </Section>

        {/* ============ 5. PIPELINE AND WATCHLIST ============ */}
        <Section n={5} title="Pipeline and watchlist"
          sub="Files awaiting clearance, and signed partnerships that have gone quiet">
          <div style={G3}>
            <Panel title="Pipeline by stage" sub="Partnerships not yet signed"
              note="Records open at expression of interest, not after the inception meeting — otherwise approaches that are declined never appear in any report.">
              <HChart data={preSigning} height={230} format={v => v} sorted={false} compact colour={T.sky} />
            </Panel>
            <Panel title="Clearance turnaround" sub="Average days each body holds a file"
              note="Derived entirely from stage transitions. The longest bar is the bottleneck, named.">
              {turnaround.length
                ? <HChart data={turnaround} height={230} unit="days" compact />
                : <div style={{ fontSize: 13, color: T.fgSubtle, padding: "24px 0" }}>
                    No completed transitions yet.</div>}
            </Panel>
            <Panel title="Dormancy watch"
              sub={`Nothing logged for ${TH.AT_RISK}+ days`}
              note="Recording achievement or value against any of these returns it to Active immediately — status is derived, never set by hand.">
              {(dormant.length + atRisk.length) === 0
                ? <div style={{ fontSize: 13, color: T.fgSubtle, padding: "24px 0" }}>
                    Every implementing partnership has logged activity recently.</div>
                : [...dormant, ...atRisk].map(({ m, status, since, lastActivity }) => (
                  <div key={m.id} className="ksg-row" tabIndex={0} onClick={() => go("track", m.id)}
                    style={{ padding: "9px 10px", margin: "0 -10px", borderRadius: R.md }}>
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 8,
                      marginBottom: 6 }}>
                      <span style={{ fontSize: 13, overflow: "hidden", textOverflow: "ellipsis",
                        whiteSpace: "nowrap" }}>{partnerOf(m).name}</span>
                      <Badge t={status === "Dormant" ? "dormant" : "closed"}>{since}d</Badge>
                    </div>
                    <Bar pct={(since / TH.DORMANCY) * 100} t={status === "Dormant" ? "amber" : "emerald"} />
                  </div>))}
            </Panel>
          </div>
        </Section>

        {/* ============ 6. REGISTER SUMMARY ============ */}
        <Section n={6} title="Register summary"
          sub="Exact counts for the quarterly return">
          <Card pad={22}>
            <div style={{ columns: "3 260px", columnGap: 40 }}>
              <SummaryTable groups={summary} />
            </div>
          </Card>
        </Section>
      </div>
    );
  }
