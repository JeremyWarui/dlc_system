import React, { useState } from "react";
import { Head, inputCss, Card, Th, Td, Badge, Bar } from "../Utilities.jsx";
import { activityScore } from "../../utils/calculations.js";
import { dt } from "../../utils/helpers.js";
import { T } from "../../constants/theme.js";

export default function Activities({ db, role, act }) {
  const [unit, setUnit] = useState("All");
  const units = [
    "All",
    ...Array.from(new Set(db.acts.flatMap((a) => a.units))),
  ].sort();
  const rows =
    unit === "All" ? db.acts : db.acts.filter((a) => a.units.includes(unit));
  return (
    <div>
      <Head
        title="Activity register"
        sub="Every activity across the portfolio, by implementing unit"
        right={
          <select
            value={unit}
            onChange={(e) => setUnit(e.target.value)}
            style={{ ...inputCss, width: "auto" }}
          >
            {units.map((u) => (
              <option key={u}>
                {u === "All" ? "All implementing units" : u}
              </option>
            ))}
          </select>
        }
      />
      <Card style={{ overflowX: "auto", padding: "16px 4px 4px" }}>
        <table
          style={{ width: "100%", borderCollapse: "collapse", minWidth: 1000 }}
        >
          <thead>
            <tr>
              <Th w="22%">Activity</Th>
              <Th w="15%">Partnership</Th>
              <Th>Area</Th>
              <Th w="18%">Implementing units</Th>
              <Th>Basis</Th>
              <Th>Status</Th>
              <Th w="12%">Achievement</Th>
              <Th right>Last logged</Th>
            </tr>
          </thead>
          <tbody>
            {rows.map((a) => {
              const m = db.mous.find((x) => x.id === a.mou);
              const sc = activityScore(a, db);
              const inds = db.indicators.filter((i) => i.act === a.id);
              const last = inds
                .flatMap((i) => db.achievements.filter((u) => u.ind === i.id))
                .map((u) => u.date)
                .sort()
                .pop();
              return (
                <tr key={a.id} className="ksg-row">
                  <Td>
                    <div style={{ fontWeight: 500 }}>{a.name}</div>
                    <div
                      style={{
                        fontSize: 12.5,
                        color: T.fgSubtle,
                        marginTop: 2,
                      }}
                    >
                      {inds.length
                        ? `${inds.length} indicator${inds.length > 1 ? "s" : ""}`
                        : "no indicator"}
                    </div>
                  </Td>
                  <Td style={{ fontSize: 13 }}>
                    {m ? db.partnerOf(m).name : "—"}
                  </Td>
                  <Td style={{ fontSize: 13 }}>{a.cat}</Td>
                  <Td style={{ fontSize: 13 }}>{a.units.join(", ")}</Td>
                  <Td>
                    <Badge
                      t={
                        a.basis === "narrative"
                          ? "zinc"
                          : a.basis === "milestone"
                            ? "violet"
                            : "sky"
                      }
                    >
                      {a.basis}
                    </Badge>
                  </Td>
                  <Td>
                    <Badge
                      t={
                        a.status === "Completed"
                          ? "emerald"
                          : a.status === "Ongoing"
                            ? "sky"
                            : "zinc"
                      }
                    >
                      {a.status}
                    </Badge>
                  </Td>
                  <Td>
                    {sc == null ? (
                      <span style={{ fontSize: 12.5, color: T.fgSubtle }}>
                        not scored
                      </span>
                    ) : (
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                        }}
                      >
                        <Bar pct={sc * 100} />
                        <span
                          className="tnum"
                          style={{
                            fontSize: 12.5,
                            color: T.fgMuted,
                            minWidth: 30,
                          }}
                        >
                          {Math.round(sc * 100)}%
                        </span>
                      </div>
                    )}
                  </Td>
                  <Td
                    num
                    right
                    style={{ fontSize: 13, color: last ? T.fgMuted : T.rose }}
                  >
                    {last ? dt(last) : "never"}
                  </Td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
