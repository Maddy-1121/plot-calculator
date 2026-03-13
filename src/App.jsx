import { useState, useMemo } from "react";

// ─── Colors ──────────────────────────────────────────────────────────────────
const COLORS = {
  bg:"#0b0e1a", card:"#141828", border:"#1e2640",
  text:"#e2e8f0", muted:"#64748b",
  gold:"#f59e0b", blue:"#3b82f6", green:"#22c55e",
  red:"#ef4444", purple:"#a855f7", orange:"#f97316"
};
const ACCENT_LIST = ["#f59e0b","#3b82f6","#22c55e","#ec4899","#a855f7","#f97316"];

// ─── Data ─────────────────────────────────────────────────────────────────────
const COMM_ZONES = {
  "Local Commercial": { far:1.5, cov:60, front:3,   side:1.5, rear:3, cM:1.8, cS:1.2 },
  "City Centre":      { far:3.0, cov:65, front:4.5, side:2.0, rear:3, cM:2.4, cS:1.5 },
  "Mixed Use":        { far:2.0, cov:55, front:4.5, side:2.0, rear:3, cM:2.0, cS:1.5 },
  "Custom":           { far:2.0, cov:60, front:3,   side:1.5, rear:3, cM:1.8, cS:1.2 },
};
const RES_ZONES = {
  "Plot ≤250 m²":  { far:1.5, cov:50, front:1.5, side:1.0, rear:1.5 },
  "Plot ≤500 m²":  { far:1.5, cov:50, front:2.0, side:1.5, rear:2.0 },
  "Plot ≤1000 m²": { far:1.5, cov:45, front:3.0, side:1.5, rear:3.0 },
  "Plot >1000 m²": { far:1.5, cov:40, front:4.5, side:2.0, rear:3.0 },
  "Custom":        { far:1.5, cov:50, front:2.0, side:1.0, rear:2.0 },
};
const NBC_ROOMS = [
  { type:"Master Bedroom",  minArea:9.5,  minDim:2.4, nbc:"6.2.1" },
  { type:"Bedroom",         minArea:7.5,  minDim:2.1, nbc:"6.2.1" },
  { type:"Living Room",     minArea:9.5,  minDim:2.4, nbc:"6.2.2" },
  { type:"Kitchen",         minArea:4.5,  minDim:1.5, nbc:"6.2.4" },
  { type:"Bathroom",        minArea:1.8,  minDim:1.0, nbc:"6.2.5" },
  { type:"Toilet / WC",     minArea:1.1,  minDim:0.9, nbc:"6.2.5" },
  { type:"Store / Utility", minArea:3.0,  minDim:1.5, nbc:"6.2.6" },
  { type:"Balcony",         minArea:0,    minDim:0,   nbc:"—" },
];

// ─── Utils ────────────────────────────────────────────────────────────────────
function nv(v) { const x = parseFloat(v); return isNaN(x) || x < 0 ? 0 : x; }
function fmt(v, d) { return (+v).toLocaleString("en-IN", { maximumFractionDigits: d === undefined ? 1 : d }); }
function pct(a, b) { return b > 0 ? ((a / b) * 100).toFixed(0) : "0"; }
function heronArea(a, b, c) { const s=(a+b+c)/2, v=s*(s-a)*(s-b)*(s-c); return v>0?Math.sqrt(v):0; }
function shoelace(pts) { let s=0; for(let i=0;i<pts.length;i++){const j=(i+1)%pts.length;s+=pts[i].x*pts[j].y-pts[j].x*pts[i].y;} return Math.abs(s)/2; }
function polygonPerim(pts) { let p=0; for(let i=0;i<pts.length;i++){const j=(i+1)%pts.length,dx=pts[j].x-pts[i].x,dy=pts[j].y-pts[i].y;p+=Math.sqrt(dx*dx+dy*dy);} return p; }

// ─── Shared UI ────────────────────────────────────────────────────────────────
function Card({ children, accentColor, style }) {
  return (
    <div style={{
      background: COLORS.card,
      border: "1px solid " + COLORS.border,
      borderRadius: 16,
      borderTop: accentColor ? "3px solid " + accentColor : "1px solid " + COLORS.border,
      padding: 16,
      marginBottom: 12,
      ...style
    }}>
      {children}
    </div>
  );
}

function SLabel({ children, color }) {
  return (
    <div style={{ fontSize: 11, fontWeight: 700, color: COLORS.muted, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 12, display: "flex", alignItems: "center", gap: 6 }}>
      <div style={{ width: 3, height: 14, background: color || COLORS.gold, borderRadius: 2 }} />
      {children}
    </div>
  );
}

function StatBox({ label, value, sub, color, warn }) {
  const col = warn ? COLORS.red : (color || COLORS.gold);
  return (
    <div style={{ background: COLORS.bg, border: "1px solid " + (warn ? COLORS.red : COLORS.border), borderRadius: 12, borderTop: "3px solid " + col, padding: "12px", flex: 1, minWidth: 0 }}>
      <div style={{ fontSize: 10, color: COLORS.muted, textTransform: "uppercase", marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 20, fontWeight: 800, color: col }}>{value}</div>
      {sub && <div style={{ fontSize: 10, color: COLORS.muted, marginTop: 4 }}>{sub}</div>}
    </div>
  );
}

function NumInput({ label, value, onChange, min, step, suffix, hint, warn }) {
  const mn = min === undefined ? 0 : min;
  const st = step === undefined ? 0.5 : step;
  function dec() { const v = Math.max(mn, +(nv(value) - st).toFixed(2)); onChange(String(v)); }
  function inc() { const v = +(nv(value) + st).toFixed(2); onChange(String(v)); }
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
        <div>
          <div style={{ fontSize: 14, color: warn ? COLORS.red : COLORS.text, fontWeight: 500 }}>{label}</div>
          {hint && <div style={{ fontSize: 11, color: COLORS.muted }}>{hint}</div>}
        </div>
        {suffix && <span style={{ fontSize: 12, color: COLORS.muted, alignSelf: "flex-end" }}>{suffix}</span>}
      </div>
      <div style={{ display: "flex", alignItems: "center", background: COLORS.bg, border: "1.5px solid " + (warn ? COLORS.red : COLORS.border), borderRadius: 12, overflow: "hidden" }}>
        <button onClick={dec} style={{ width: 48, height: 48, border: "none", background: "transparent", color: COLORS.muted, fontSize: 24, cursor: "pointer" }}>−</button>
        <input
          type="number"
          inputMode="decimal"
          value={value}
          onChange={e => onChange(e.target.value)}
          style={{ flex: 1, background: "transparent", border: "none", color: COLORS.text, fontSize: 18, fontWeight: 700, textAlign: "center", outline: "none", padding: "0 4px", height: 48 }}
        />
        <button onClick={inc} style={{ width: 48, height: 48, border: "none", background: "transparent", color: COLORS.muted, fontSize: 24, cursor: "pointer" }}>+</button>
      </div>
    </div>
  );
}

function PillSelect({ options, value, onChange, color }) {
  const col = color || COLORS.gold;
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
      {options.map(function(o) {
        const active = value === o;
        return (
          <button key={o} onClick={function() { onChange(o); }} style={{
            padding: "8px 14px", borderRadius: 20,
            border: "1.5px solid " + (active ? col : COLORS.border),
            background: active ? "rgba(255,255,255,0.08)" : "transparent",
            color: active ? col : COLORS.muted,
            fontSize: 13, cursor: "pointer", fontWeight: active ? 700 : 400,
          }}>{o}</button>
        );
      })}
    </div>
  );
}

function OkBadge({ ok, label }) {
  return (
    <span style={{ padding: "4px 10px", borderRadius: 20, fontSize: 12, fontWeight: 600, background: ok ? "rgba(34,197,94,0.12)" : "rgba(239,68,68,0.12)", border: "1px solid " + (ok ? COLORS.green : COLORS.red), color: ok ? COLORS.green : COLORS.red }}>
      {ok ? "✓ " : "✗ "}{label}
    </span>
  );
}

function Bar({ value, max, color }) {
  const w = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  return (
    <div style={{ height: 8, background: COLORS.bg, borderRadius: 4, overflow: "hidden" }}>
      <div style={{ height: "100%", width: w + "%", background: color, borderRadius: 4 }} />
    </div>
  );
}

function Accordion({ title, children, defaultOpen, color }) {
  const [open, setOpen] = useState(defaultOpen ? true : false);
  return (
    <div style={{ border: "1px solid " + COLORS.border, borderRadius: 14, marginBottom: 10, overflow: "hidden" }}>
      <button onClick={function() { setOpen(function(o) { return !o; }); }} style={{ width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 16px", background: COLORS.card, border: "none", cursor: "pointer" }}>
        <span style={{ fontSize: 15, fontWeight: 600, color: COLORS.text }}>{title}</span>
        <span style={{ fontSize: 18, color: color || COLORS.gold }}>{open ? "▲" : "▼"}</span>
      </button>
      {open && <div style={{ padding: "4px 16px 16px", background: COLORS.card }}>{children}</div>}
    </div>
  );
}

// ─── Site Plan SVG ────────────────────────────────────────────────────────────
function SitePlan({ plotL, plotB, sbF, sbR, sbS, shopL, shopB, cM, cS, shopCols, shopRows, lineColor }) {
  const col = lineColor || COLORS.gold;
  const W = 340, H = 220, PAD = 28;
  if (!plotL || !plotB) { return null; }
  const sc = Math.min((W - 2*PAD) / plotL, (H - 2*PAD) / plotB, 10);
  const pw = plotL*sc, ph = plotB*sc;
  const ox = (W - pw) / 2, oy = (H - ph) / 2;
  const bx = ox + sbS*sc, by = oy + sbF*sc;
  const bw = Math.max(0, pw - 2*sbS*sc), bh = Math.max(0, ph - sbF*sc - sbR*sc);
  const sW = shopL*sc, sH = shopB*sc, cm = cM*sc, cs = cS*sc;
  const cells = [];
  for (let r = 0; r < shopRows; r++) {
    for (let c2 = 0; c2 < shopCols; c2++) {
      cells.push({ r: r, c: c2, i: r * shopCols + c2 });
    }
  }
  return (
    <svg width="100%" viewBox={"0 0 " + W + " " + H} style={{ display: "block", borderRadius: 12, background: COLORS.bg }}>
      <rect x={ox} y={oy} width={pw} height={ph} fill="none" stroke={col} strokeWidth="1.5" strokeDasharray="6,3" />
      <rect x={bx} y={by} width={bw} height={bh} fill="rgba(59,130,246,0.06)" stroke={COLORS.blue} strokeWidth="0.8" strokeDasharray="4,2" />
      {cm > 0 && bw > 0 && <rect x={bx} y={by} width={bw} height={Math.min(cm, bh)} fill="rgba(245,158,11,0.12)" stroke={COLORS.gold} strokeWidth="0.8" />}
      {cells.map(function(cell) {
        const sx = bx + cell.c * (sW + cs);
        const sy = by + cm + cell.r * (sH + cs);
        const acol = ACCENT_LIST[cell.i % ACCENT_LIST.length];
        if (sx + sW > bx + bw - 1 || sy + sH > by + bh - 1) { return null; }
        return (
          <g key={cell.i}>
            <rect x={sx} y={sy} width={sW} height={sH} fill={acol} opacity="0.2" rx="1" />
            <rect x={sx} y={sy} width={sW} height={sH} fill="none" stroke={acol} strokeWidth="0.7" rx="1" />
            {sW > 14 && sH > 10 && <text x={sx + sW/2} y={sy + sH/2 + 3} textAnchor="middle" fontSize={Math.min(7, sH * 0.35)} fill={acol}>{cell.i + 1}</text>}
          </g>
        );
      })}
      <text x={W/2} y={oy - 8} textAnchor="middle" fontSize="9" fill={col} opacity="0.7">{plotL}m</text>
      <text x={ox - 8} y={oy + ph/2} textAnchor="middle" fontSize="9" fill={col} opacity="0.7" transform={"rotate(-90," + (ox-8) + "," + (oy+ph/2) + ")"}>{plotB}m</text>
    </svg>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// TAB 1 — IRREGULAR PLOT
// ═══════════════════════════════════════════════════════════════════════════════
function IrregularPlot() {
  const [method, setMethod] = useState("sides");
  const [unit, setUnit] = useState("m");
  const [pts, setPts] = useState([
    { x: "0", y: "0" }, { x: "15", y: "0" }, { x: "14", y: "10" }, { x: "2", y: "12" }
  ]);
  const [sides, setSides] = useState({ A: "15", B: "12", C: "14", D: "10", diag: "18" });

  function updatePt(i, f, v) { setPts(function(p) { return p.map(function(x, idx) { return idx === i ? Object.assign({}, x, { [f]: v }) : x; }); }); }
  function addPt() { if (pts.length >= 8) { return; } const l = pts[pts.length - 1]; setPts(function(p) { return [...p, { x: String(nv(l.x) + 3), y: l.y }]; }); }
  function removePt(i) { if (pts.length <= 3) { return; } setPts(function(p) { return p.filter(function(_, idx) { return idx !== i; }); }); }

  const coordPts = pts.map(function(p) { return { x: nv(p.x), y: nv(p.y) }; });
  const coordArea = shoelace(coordPts);
  const coordP = polygonPerim(coordPts);
  const tri1 = heronArea(nv(sides.A), nv(sides.B), nv(sides.diag));
  const tri2 = heronArea(nv(sides.C), nv(sides.D), nv(sides.diag));
  const fieldArea = tri1 + tri2;
  const area = method === "coords" ? coordArea : fieldArea;
  const perimV = method === "coords" ? coordP : (nv(sides.A) + nv(sides.B) + nv(sides.C) + nv(sides.D));
  const toSqFt = unit === "m" ? 10.764 : unit === "yd" ? 9 : 1;
  const sqFt = area * toSqFt;
  const acres = sqFt / 43560;
  const guntha = acres * 40;

  const W2 = 320, H2 = 190, P2 = 22;
  const scaledPts = useMemo(function() {
    if (coordPts.length < 2) { return []; }
    const xs = coordPts.map(function(p) { return p.x; });
    const ys = coordPts.map(function(p) { return p.y; });
    const minX = Math.min(...xs), maxX = Math.max(...xs);
    const minY = Math.min(...ys), maxY = Math.max(...ys);
    const rX = maxX - minX || 1, rY = maxY - minY || 1;
    const sc2 = Math.min((W2 - 2*P2) / rX, (H2 - 2*P2) / rY);
    return coordPts.map(function(p) { return { sx: P2 + (p.x - minX) * sc2, sy: H2 - P2 - (p.y - minY) * sc2 }; });
  }, [coordPts]);

  return (
    <div>
      <Card accentColor={COLORS.blue}>
        <SLabel color={COLORS.blue}>Method</SLabel>
        <PillSelect options={["sides", "coords"]} value={method} onChange={setMethod} color={COLORS.blue} />
        <SLabel color={COLORS.blue}>Unit</SLabel>
        <PillSelect options={["m", "ft", "yd"]} value={unit} onChange={setUnit} color={COLORS.blue} />
      </Card>

      {method === "sides" ? (
        <Card>
          <SLabel>4 Sides + Diagonal</SLabel>
          <div style={{ padding: 10, background: COLORS.bg, borderRadius: 10, marginBottom: 14 }}>
            <svg width="100%" viewBox="0 0 240 130">
              <polygon points="20,110 190,110 220,25 55,8" fill="rgba(245,158,11,0.06)" stroke={COLORS.gold} strokeWidth="1.5" strokeDasharray="5,3" />
              <line x1="20" y1="110" x2="220" y2="25" stroke={COLORS.blue} strokeWidth="1" strokeDasharray="4,3" />
              <text x="105" y="125" fontSize="11" fill={COLORS.gold} textAnchor="middle">A (bottom)</text>
              <text x="225" y="72" fontSize="11" fill={COLORS.gold}>B</text>
              <text x="128" y="14" fontSize="11" fill={COLORS.gold} textAnchor="middle">C (top)</text>
              <text x="2" y="62" fontSize="11" fill={COLORS.gold}>D</text>
              <text x="105" y="60" fontSize="10" fill={COLORS.blue} textAnchor="middle">diagonal</text>
            </svg>
          </div>
          {["A", "B", "C", "D"].map(function(k) {
            return <NumInput key={k} label={"Side " + k} value={sides[k]} onChange={function(v) { setSides(function(s) { return Object.assign({}, s, { [k]: v }); }); }} suffix={unit} />;
          })}
          <NumInput label="Diagonal (A→C)" value={sides.diag} onChange={function(v) { setSides(function(s) { return Object.assign({}, s, { diag: v }); }); }} suffix={unit} hint="Measure A-corner to C-corner" />
          <div style={{ marginTop: 8, padding: "10px 12px", background: COLORS.bg, borderRadius: 8, fontSize: 12, color: COLORS.muted }}>
            Tri 1: <b style={{ color: COLORS.gold }}>{fmt(tri1)} {unit}²</b> + Tri 2: <b style={{ color: COLORS.gold }}>{fmt(tri2)} {unit}²</b>
          </div>
        </Card>
      ) : (
        <Card>
          <SLabel>Corner Coordinates</SLabel>
          {scaledPts.length >= 3 && (
            <svg width="100%" viewBox={"0 0 " + W2 + " " + H2} style={{ display: "block", background: COLORS.bg, borderRadius: 10, marginBottom: 12 }}>
              <polygon points={scaledPts.map(function(p) { return p.sx + "," + p.sy; }).join(" ")} fill="rgba(59,130,246,0.08)" stroke={COLORS.blue} strokeWidth="1.5" />
              {scaledPts.map(function(p, i) {
                const j = (i + 1) % scaledPts.length;
                const q = scaledPts[j];
                const dx = coordPts[j].x - coordPts[i].x, dy = coordPts[j].y - coordPts[i].y;
                const d = Math.sqrt(dx*dx + dy*dy);
                return (
                  <g key={i}>
                    <text x={(p.sx + q.sx) / 2} y={(p.sy + q.sy) / 2 - 4} textAnchor="middle" fontSize="8" fill={COLORS.blue} opacity="0.8">{d.toFixed(1)}{unit}</text>
                    <circle cx={p.sx} cy={p.sy} r="6" fill={ACCENT_LIST[i % ACCENT_LIST.length]} stroke={COLORS.bg} strokeWidth="2" />
                    <text x={p.sx + 9} y={p.sy - 3} fontSize="8" fill={ACCENT_LIST[i % ACCENT_LIST.length]}>{i + 1}</text>
                  </g>
                );
              })}
            </svg>
          )}
          {pts.map(function(p, i) {
            return (
              <div key={i} style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 8 }}>
                <div style={{ width: 24, height: 24, borderRadius: "50%", background: ACCENT_LIST[i % ACCENT_LIST.length], display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, color: "#fff", fontWeight: 700, flexShrink: 0 }}>{i + 1}</div>
                <input type="number" inputMode="decimal" placeholder="X" value={p.x} onChange={function(e) { updatePt(i, "x", e.target.value); }}
                  style={{ flex: 1, background: COLORS.bg, border: "1px solid " + COLORS.border, color: COLORS.text, borderRadius: 8, padding: 10, fontSize: 15, outline: "none", textAlign: "center" }} />
                <input type="number" inputMode="decimal" placeholder="Y" value={p.y} onChange={function(e) { updatePt(i, "y", e.target.value); }}
                  style={{ flex: 1, background: COLORS.bg, border: "1px solid " + COLORS.border, color: COLORS.text, borderRadius: 8, padding: 10, fontSize: 15, outline: "none", textAlign: "center" }} />
                <button onClick={function() { removePt(i); }} disabled={pts.length <= 3}
                  style={{ width: 36, height: 36, borderRadius: 8, border: "1px solid " + COLORS.border, background: "transparent", color: COLORS.muted, cursor: "pointer", fontSize: 18, flexShrink: 0 }}>×</button>
              </div>
            );
          })}
          <button onClick={addPt} disabled={pts.length >= 8}
            style={{ width: "100%", padding: 12, border: "1.5px dashed " + COLORS.blue, borderRadius: 10, background: "transparent", color: COLORS.blue, cursor: "pointer", fontSize: 14, marginTop: 4 }}>
            + Add Corner (max 8)
          </button>
        </Card>
      )}

      <Card accentColor={COLORS.gold}>
        <SLabel>Results</SLabel>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
          <StatBox label={"Area (" + unit + "²)"} value={fmt(area, 2)} color={COLORS.gold} />
          <StatBox label="Area (sq ft)" value={fmt(sqFt, 0)} color={COLORS.blue} />
          <StatBox label="Acres" value={acres.toFixed(4)} color={COLORS.green} />
          <StatBox label="Guntha" value={guntha.toFixed(3)} color={COLORS.purple} />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <StatBox label={"Perimeter (" + unit + ")"} value={fmt(perimV, 1)} color={COLORS.orange} />
          <StatBox label="Sq Yards" value={fmt(unit === "yd" ? area : unit === "m" ? area * 1.196 : area / 9, 1)} color="#ec4899" />
        </div>
      </Card>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// TAB 2 — COMMERCIAL
// ═══════════════════════════════════════════════════════════════════════════════
function CommercialCalc() {
  const [zone, setZone] = useState("Local Commercial");
  const zp = COMM_ZONES[zone];
  const [pL, setPL] = useState("30");
  const [pB, setPB] = useState("20");
  const [sbF, setSbF] = useState(String(zp.front));
  const [sbR, setSbR] = useState(String(zp.rear));
  const [sbS, setSbS] = useState(String(zp.side));
  const [far, setFar] = useState(String(zp.far));
  const [cov, setCov] = useState(String(zp.cov));
  const [cM, setCM] = useState(String(zp.cM));
  const [cS, setCS] = useState(String(zp.cS));
  const [sL, setSL] = useState("3");
  const [sB, setSB] = useState("4");
  const [floors, setFloors] = useState("1");

  function applyZone(zk) {
    setZone(zk);
    const p = COMM_ZONES[zk];
    setSbF(String(p.front)); setSbR(String(p.rear)); setSbS(String(p.side));
    setFar(String(p.far)); setCov(String(p.cov)); setCM(String(p.cM)); setCS(String(p.cS));
  }

  const calc = useMemo(function() {
    const plotL=nv(pL), plotB=nv(pB), sF=nv(sbF), sR=nv(sbR), sS=nv(sbS);
    const FAR=nv(far), COV=nv(cov), cm=nv(cM), cs=nv(cS), shopL=nv(sL), shopB=nv(sB);
    const fl = Math.max(1, Math.round(nv(floors)));
    const plotArea = plotL * plotB;
    const bpL = Math.max(0, plotL - 2*sS), bpB = Math.max(0, plotB - sF - sR);
    const buildFP = bpL * bpB, maxCov = plotArea * COV / 100;
    const effGround = Math.min(buildFP, maxCov), maxFAR = plotArea * FAR;
    const corrArea = bpL * cm + Math.max(0, bpB - cm) * cs;
    const netShop = Math.max(0, effGround - corrArea);
    const cols = shopL > 0 ? Math.floor(bpL / (shopL + cs)) : 0;
    const rows = shopB > 0 ? Math.floor(Math.max(0, bpB - cm) / (shopB + cs)) : 0;
    const shopsPF = cols * rows, totalShops = shopsPF * fl;
    const totalShopArea = shopsPF * shopL * shopB;
    const eff = effGround > 0 ? (totalShopArea / effGround) * 100 : 0;
    const checks = {
      cM: cm >= 1.8, cS: cs >= 1.2,
      sbF: sF >= zp.front, sbR: sR >= 3, sbS: sS >= zp.side,
      cov: COV <= 70, shopMin: shopL >= 2.4 && shopB >= 2.4
    };
    return { plotArea, bpL, bpB, buildFP, maxCov, effGround, maxFAR, corrArea, netShop, cols, rows, shopsPF, totalShops, totalShopArea, eff, fl, checks, cm, cs, plotL, plotB, sF, sR, sS, shopL, shopB };
  }, [pL, pB, sbF, sbR, sbS, far, cov, cM, cS, sL, sB, floors, zp]);

  const allPass = Object.values(calc.checks).every(Boolean);

  return (
    <div>
      <Card>
        <SLabel>Zone</SLabel>
        <PillSelect options={Object.keys(COMM_ZONES)} value={zone} onChange={applyZone} />
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <OkBadge ok={allPass} label={allPass ? "NBC Compliant" : "Needs Review"} />
        </div>
      </Card>

      <Accordion title="📐 Plot & FAR" defaultOpen={true} color={COLORS.gold}>
        <NumInput label="Plot Length" value={pL} onChange={setPL} suffix="m" />
        <NumInput label="Plot Breadth" value={pB} onChange={setPB} suffix="m" />
        <NumInput label="Floors" value={floors} onChange={setFloors} min={1} step={1} suffix="fl" />
        <NumInput label="FAR / FSI" value={far} onChange={setFar} step={0.25} />
        <NumInput label="Ground Coverage" value={cov} onChange={setCov} step={5} suffix="%" warn={nv(cov) > 70} hint="NBC max 70%" />
        {nv(pL) > 0 && nv(pB) > 0 && (
          <div style={{ marginTop: 8, padding: "10px 12px", background: COLORS.bg, borderRadius: 8, fontSize: 13, color: COLORS.gold }}>
            Plot: <b>{fmt(nv(pL) * nv(pB))} m²</b> = <b>{fmt(nv(pL) * nv(pB) * 10.764, 0)} sq ft</b>
          </div>
        )}
      </Accordion>

      <Accordion title="↔️ Setbacks" color={COLORS.blue}>
        <NumInput label="Front Setback" value={sbF} onChange={setSbF} suffix="m" hint={"NBC min " + zp.front + "m"} warn={nv(sbF) < zp.front} />
        <NumInput label="Rear Setback" value={sbR} onChange={setSbR} suffix="m" hint="NBC min 3.0m" warn={nv(sbR) < 3} />
        <NumInput label="Side Setback" value={sbS} onChange={setSbS} suffix="m" hint={"NBC min " + zp.side + "m"} warn={nv(sbS) < zp.side} />
      </Accordion>

      <Accordion title="🚶 Corridors (NBC 8.2)" color={COLORS.green}>
        <NumInput label="Main Corridor" value={cM} onChange={setCM} suffix="m" hint="NBC min 1.8m" warn={nv(cM) < 1.8} />
        <NumInput label="Sub Corridor" value={cS} onChange={setCS} suffix="m" hint="NBC min 1.2m" warn={nv(cS) < 1.2} />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 8 }}>
          <StatBox label="Corridor/floor" value={fmt(calc.corrArea) + " m²"} color={COLORS.gold} />
          <StatBox label="Corridor %" value={pct(calc.corrArea, calc.effGround) + "%"} color={calc.corrArea / calc.effGround > 0.3 ? COLORS.red : COLORS.green} warn={calc.corrArea / calc.effGround > 0.3} />
        </div>
      </Accordion>

      <Card accentColor={COLORS.gold}>
        <SLabel>Area Breakdown</SLabel>
        {[
          ["Buildable footprint", calc.effGround, COLORS.text],
          ["Corridor area", calc.corrArea, COLORS.gold],
          ["Net shop area", calc.netShop, COLORS.green],
          ["FAR limit (total)", calc.maxFAR, COLORS.purple]
        ].map(function(item) {
          return (
            <div key={item[0]} style={{ marginBottom: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                <span style={{ fontSize: 13, color: item[2] }}>{item[0]}</span>
                <span style={{ fontSize: 13, color: item[2], fontWeight: 700 }}>{fmt(item[1])} m²</span>
              </div>
              <Bar value={item[1]} max={calc.plotArea} color={item[2]} />
              <div style={{ fontSize: 11, color: COLORS.muted, marginTop: 2 }}>{fmt(item[1] * 10.764, 0)} sqft</div>
            </div>
          );
        })}
      </Card>

      <Accordion title="🏪 Shop Size & Count" color={COLORS.blue}>
        <NumInput label="Shop Length" value={sL} onChange={setSL} suffix="m" warn={nv(sL) < 2.4} hint="NBC min 2.4m" />
        <NumInput label="Shop Breadth" value={sB} onChange={setSB} suffix="m" warn={nv(sB) < 2.4} hint="NBC min 2.4m" />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 8 }}>
          <StatBox label="Shops/floor" value={calc.shopsPF} color={COLORS.gold} />
          <StatBox label="Total shops" value={calc.totalShops} color={COLORS.green} sub={calc.fl + " floor(s)"} />
          <StatBox label="Grid" value={calc.cols + "×" + calc.rows} color={COLORS.blue} sub="cols × rows" />
          <StatBox label="Efficiency" value={calc.eff.toFixed(0) + "%"} color={calc.eff > 55 ? COLORS.green : COLORS.gold} />
        </div>
      </Accordion>

      <Card>
        <SLabel>Site Plan Preview</SLabel>
        <SitePlan plotL={calc.plotL} plotB={calc.plotB} sbF={calc.sF} sbR={calc.sR} sbS={calc.sS} shopL={calc.shopL} shopB={calc.shopB} cM={calc.cm} cS={calc.cs} shopCols={calc.cols} shopRows={calc.rows} lineColor={COLORS.gold} />
      </Card>

      <Card>
        <SLabel>NBC 2016 Code Check</SLabel>
        {[
          ["Main corridor", "NBC 8.2.1", "≥1.8m", nv(cM).toFixed(1) + "m", calc.checks.cM],
          ["Sub corridor", "NBC 8.2.2", "≥1.2m", nv(cS).toFixed(1) + "m", calc.checks.cS],
          ["Front setback", "NBC Tb.2", "≥" + zp.front + "m", nv(sbF).toFixed(1) + "m", calc.checks.sbF],
          ["Rear setback", "NBC Tb.2", "≥3.0m", nv(sbR).toFixed(1) + "m", calc.checks.sbR],
          ["Coverage", "NBC 12.3", "≤70%", nv(cov) + "%", calc.checks.cov],
          ["Shop min size", "NBC 6.4.1", "≥2.4×2.4m", nv(sL).toFixed(1) + "×" + nv(sB).toFixed(1) + "m", calc.checks.shopMin],
        ].map(function(item) {
          return (
            <div key={item[0]} style={{ padding: "10px 0", borderBottom: "1px solid " + COLORS.border, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, color: COLORS.text, fontWeight: 500 }}>{item[0]}</div>
                <div style={{ fontSize: 11, color: COLORS.muted }}>{item[1]} · {item[2]} · got: <b style={{ color: item[4] ? COLORS.green : COLORS.red }}>{item[3]}</b></div>
              </div>
              <OkBadge ok={item[4]} label={item[4] ? "PASS" : "FAIL"} />
            </div>
          );
        })}
        <div style={{ marginTop: 12, padding: "10px 12px", background: COLORS.bg, borderRadius: 8, fontSize: 12, color: COLORS.muted }}>
          🚗 Parking: <b style={{ color: COLORS.blue }}>{Math.ceil(calc.effGround * calc.fl / 50)} ECS</b> (1 per 50m² GFA)
        </div>
      </Card>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// TAB 3 — RESIDENTIAL
// ═══════════════════════════════════════════════════════════════════════════════
function ResidentialCalc() {
  const [zone, setZone] = useState("Plot ≤250 m²");
  const zp = RES_ZONES[zone];
  const [pL, setPL] = useState("12");
  const [pB, setPB] = useState("18");
  const [sbF, setSbF] = useState(String(zp.front));
  const [sbR, setSbR] = useState(String(zp.rear));
  const [sbS, setSbS] = useState(String(zp.side));
  const [far, setFar] = useState(String(zp.far));
  const [cov, setCov] = useState(String(zp.cov));
  const [floors, setFloors] = useState("2");
  const [rooms, setRooms] = useState([
    { type: "Master Bedroom", l: "4", b: "3.5", qty: "1" },
    { type: "Bedroom", l: "3.5", b: "3", qty: "2" },
    { type: "Living Room", l: "5", b: "4", qty: "1" },
    { type: "Kitchen", l: "3.5", b: "2.5", qty: "1" },
    { type: "Bathroom", l: "2", b: "1.8", qty: "2" },
    { type: "Toilet / WC", l: "1.5", b: "1.2", qty: "1" },
  ]);

  function applyZone(zk) {
    setZone(zk);
    const p = RES_ZONES[zk];
    setSbF(String(p.front)); setSbR(String(p.rear)); setSbS(String(p.side));
    setFar(String(p.far)); setCov(String(p.cov));
  }
  function updateRoom(i, f, v) { setRooms(function(r) { return r.map(function(x, idx) { return idx === i ? Object.assign({}, x, { [f]: v }) : x; }); }); }
  function addRoom() { setRooms(function(r) { return [...r, { type: "Store / Utility", l: "3", b: "2", qty: "1" }]; }); }
  function removeRoom(i) { setRooms(function(r) { return r.filter(function(_, idx) { return idx !== i; }); }); }

  const R = useMemo(function() {
    const plotL=nv(pL), plotB=nv(pB), sF=nv(sbF), sR=nv(sbR), sS=nv(sbS);
    const FAR=nv(far), COV=nv(cov), fl=Math.max(1, Math.round(nv(floors)));
    const plotArea=plotL*plotB, bpL=Math.max(0,plotL-2*sS), bpB=Math.max(0,plotB-sF-sR);
    const buildFP=bpL*bpB, maxCov=plotArea*COV/100, effGround=Math.min(buildFP,maxCov), maxFAR=plotArea*FAR;
    const totalBuiltUp=Math.min(maxFAR,effGround*fl), netLivable=totalBuiltUp*0.85, wallEtc=totalBuiltUp*0.15;
    const roomResults = rooms.map(function(rm) {
      const rl=nv(rm.l), rb=nv(rm.b), qty=Math.max(1,parseInt(rm.qty)||1), area=rl*rb;
      const nbcR = NBC_ROOMS.find(function(x) { return x.type === rm.type; }) || { minArea:0, minDim:0, nbc:"—" };
      return Object.assign({}, rm, { rl, rb, area, qty, totalArea: area*qty, areaOk: area >= nbcR.minArea || nbcR.minArea === 0, dimOk: (rl >= nbcR.minDim && rb >= nbcR.minDim) || nbcR.minDim === 0, nbcR });
    });
    const totalRoomArea = roomResults.reduce(function(s, r) { return s + r.totalArea; }, 0);
    const checks = { sbF: sF >= zp.front, sbR: sR >= zp.rear, sbS: sS >= zp.side, cov: COV <= 60, roomFit: totalRoomArea <= netLivable };
    return { plotArea, bpL, bpB, buildFP, maxCov, effGround, maxFAR, totalBuiltUp, netLivable, wallEtc, totalRoomArea, fl, checks, roomResults, plotL, plotB, sF, sR, sS };
  }, [pL, pB, sbF, sbR, sbS, far, cov, floors, rooms, zp]);

  const allPass = Object.values(R.checks).every(Boolean);
  const fits = R.totalRoomArea <= R.netLivable;

  return (
    <div>
      <Card>
        <SLabel color={COLORS.green}>Zone</SLabel>
        <PillSelect options={Object.keys(RES_ZONES)} value={zone} onChange={applyZone} color={COLORS.green} />
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <OkBadge ok={allPass} label={allPass ? "Compliant" : "Review"} />
        </div>
      </Card>

      <Accordion title="📐 Plot Setup" defaultOpen={true} color={COLORS.green}>
        <NumInput label="Plot Length" value={pL} onChange={setPL} suffix="m" />
        <NumInput label="Plot Breadth" value={pB} onChange={setPB} suffix="m" />
        <NumInput label="Floors" value={floors} onChange={setFloors} min={1} step={1} suffix="fl" hint="G=1, G+1=2" />
        <NumInput label="FAR / FSI" value={far} onChange={setFar} step={0.25} hint={"Zone: " + zp.far} />
        <NumInput label="Coverage %" value={cov} onChange={setCov} step={5} suffix="%" warn={nv(cov) > 60} hint="Max 60%" />
      </Accordion>

      <Accordion title="↔️ Setbacks" color={COLORS.blue}>
        <NumInput label="Front Setback" value={sbF} onChange={setSbF} suffix="m" hint={"Min " + zp.front + "m"} warn={nv(sbF) < zp.front} />
        <NumInput label="Rear Setback" value={sbR} onChange={setSbR} suffix="m" hint={"Min " + zp.rear + "m"} warn={nv(sbR) < zp.rear} />
        <NumInput label="Side Setback" value={sbS} onChange={setSbS} suffix="m" hint={"Min " + zp.side + "m"} warn={nv(sbS) < zp.side} />
      </Accordion>

      <Card accentColor={COLORS.green}>
        <SLabel color={COLORS.green}>Permissible Construction</SLabel>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 14 }}>
          <StatBox label="Total Built-up" value={fmt(R.totalBuiltUp) + " m²"} color={COLORS.green} sub={fmt(R.totalBuiltUp * 10.764, 0) + " sqft"} />
          <StatBox label="Net Livable" value={fmt(R.netLivable) + " m²"} color={COLORS.blue} sub="85% of built-up" />
          <StatBox label="Per Floor" value={fmt(R.effGround) + " m²"} color={COLORS.gold} />
          <StatBox label="Floors" value={R.fl} color={COLORS.purple} />
        </div>
        {[
          ["Total built-up", R.totalBuiltUp, COLORS.text],
          ["Walls / stairs", R.wallEtc, COLORS.orange],
          ["Net livable", R.netLivable, COLORS.green],
          ["Rooms planned", R.totalRoomArea, fits ? COLORS.blue : COLORS.red],
          ["Remaining", Math.max(0, R.netLivable - R.totalRoomArea), COLORS.purple],
        ].map(function(item) {
          return (
            <div key={item[0]} style={{ marginBottom: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                <span style={{ fontSize: 12, color: item[2] }}>{item[0]}</span>
                <span style={{ fontSize: 12, color: item[2], fontWeight: 700 }}>{fmt(item[1], 1)} m²</span>
              </div>
              <Bar value={item[1]} max={R.totalBuiltUp} color={item[2]} />
            </div>
          );
        })}
      </Card>

      <Card>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <SLabel color={COLORS.green}>🏠 Room Planner</SLabel>
          <button onClick={addRoom} style={{ padding: "8px 14px", border: "1.5px solid " + COLORS.green, borderRadius: 20, background: "rgba(34,197,94,0.1)", color: COLORS.green, cursor: "pointer", fontSize: 13, fontWeight: 600 }}>+ Room</button>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid " + COLORS.border, marginBottom: 8 }}>
          <span style={{ fontSize: 13, color: COLORS.muted }}>Total rooms area</span>
          <span style={{ fontSize: 14, fontWeight: 700, color: fits ? COLORS.green : COLORS.red }}>{fmt(R.totalRoomArea, 1)} m²</span>
        </div>
        {R.roomResults.map(function(rm, i) {
          return (
            <div key={i} style={{ background: COLORS.bg, border: "1px solid " + (rm.areaOk && rm.dimOk ? COLORS.border : COLORS.red), borderRadius: 12, padding: 12, marginBottom: 8 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <select value={rm.type} onChange={function(e) { updateRoom(i, "type", e.target.value); }}
                  style={{ background: "transparent", border: "none", color: COLORS.text, fontSize: 14, fontWeight: 600, cursor: "pointer", flex: 1, outline: "none" }}>
                  {NBC_ROOMS.map(function(r) { return <option key={r.type} value={r.type} style={{ background: COLORS.card }}>{r.type}</option>; })}
                </select>
                <button onClick={function() { removeRoom(i); }} style={{ width: 28, height: 28, borderRadius: 7, border: "1px solid " + COLORS.border, background: "transparent", color: COLORS.muted, cursor: "pointer", fontSize: 16 }}>×</button>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 56px", gap: 8 }}>
                {[["Length", "l"], ["Breadth", "b"]].map(function(fld) {
                  return (
                    <div key={fld[0]}>
                      <div style={{ fontSize: 10, color: COLORS.muted, marginBottom: 4 }}>{fld[0]} (m)</div>
                      <input type="number" inputMode="decimal" value={rm[fld[1]]} onChange={function(e) { updateRoom(i, fld[1], e.target.value); }}
                        style={{ width: "100%", background: COLORS.card, border: "1px solid " + COLORS.border, color: COLORS.text, borderRadius: 8, padding: 10, fontSize: 16, outline: "none", textAlign: "center", boxSizing: "border-box" }} />
                    </div>
                  );
                })}
                <div>
                  <div style={{ fontSize: 10, color: COLORS.muted, marginBottom: 4 }}>Qty</div>
                  <input type="number" inputMode="numeric" min="1" step="1" value={rm.qty} onChange={function(e) { updateRoom(i, "qty", e.target.value); }}
                    style={{ width: "100%", background: COLORS.card, border: "1px solid " + COLORS.border, color: COLORS.text, borderRadius: 8, padding: 10, fontSize: 16, outline: "none", textAlign: "center", boxSizing: "border-box" }} />
                </div>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 8 }}>
                <span style={{ fontSize: 12, color: COLORS.muted }}>Area: <b style={{ color: COLORS.gold }}>{fmt(rm.totalArea, 1)} m²</b></span>
                <span style={{ fontSize: 11, color: rm.areaOk && rm.dimOk ? COLORS.green : COLORS.red }}>{rm.areaOk && rm.dimOk ? "✓ NBC OK" : "Below minimum"}</span>
              </div>
            </div>
          );
        })}
      </Card>

      <Accordion title="📋 NBC Min Room Sizes" color={COLORS.muted}>
        {NBC_ROOMS.filter(function(r) { return r.minArea > 0; }).map(function(r) {
          return (
            <div key={r.type} style={{ display: "flex", justifyContent: "space-between", padding: "9px 0", borderBottom: "1px solid " + COLORS.border }}>
              <span style={{ fontSize: 13, color: COLORS.text }}>{r.type}</span>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 13, color: COLORS.gold, fontWeight: 600 }}>≥{r.minArea} m²</div>
                <div style={{ fontSize: 11, color: COLORS.muted }}>dim {r.minDim}m · NBC {r.nbc}</div>
              </div>
            </div>
          );
        })}
      </Accordion>

      <Card>
        <SLabel color={COLORS.green}>Site Plan</SLabel>
        <SitePlan plotL={R.plotL} plotB={R.plotB} sbF={R.sF} sbR={R.sR} sbS={R.sS} shopL={0} shopB={0} cM={0} cS={0} shopCols={0} shopRows={0} lineColor={COLORS.green} />
      </Card>

      <Card>
        <SLabel color={COLORS.green}>NBC Compliance</SLabel>
        {[
          ["Front setback", "NBC Tb.2", "≥" + zp.front + "m", nv(sbF).toFixed(1) + "m", R.checks.sbF],
          ["Rear setback", "NBC Tb.2", "≥" + zp.rear + "m", nv(sbR).toFixed(1) + "m", R.checks.sbR],
          ["Coverage", "NBC 12.3", "≤60%", nv(cov) + "%", R.checks.cov],
          ["Rooms fit", "Design", "—", fits ? "Yes" : "Exceeds", R.checks.roomFit],
        ].map(function(item) {
          return (
            <div key={item[0]} style={{ padding: "10px 0", borderBottom: "1px solid " + COLORS.border, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontSize: 13, color: COLORS.text }}>{item[0]}</div>
                <div style={{ fontSize: 11, color: COLORS.muted }}>{item[1]} · {item[2]} → <b style={{ color: item[4] ? COLORS.green : COLORS.red }}>{item[3]}</b></div>
              </div>
              <OkBadge ok={item[4]} label={item[4] ? "PASS" : "FAIL"} />
            </div>
          );
        })}
        <div style={{ marginTop: 12, padding: "10px 12px", background: COLORS.bg, borderRadius: 8, fontSize: 12, color: COLORS.muted, lineHeight: 1.8 }}>
          🚗 Parking: <b style={{ color: COLORS.blue }}>{R.fl} ECS</b> (~{R.fl * 23} m²)<br />
          💧 Rainwater harvesting if plot &gt;300 m²<br />
          ☀️ Solar water heater mandatory (ECBC)
        </div>
      </Card>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// ROOT APP
// ═══════════════════════════════════════════════════════════════════════════════
const TABS = [
  { label: "Irregular\nPlot", icon: "🔷", color: COLORS.blue },
  { label: "Commercial\nShops", icon: "🏪", color: COLORS.gold },
  { label: "Residential\nHome", icon: "🏠", color: COLORS.green },
];

export default function App() {
  const [tab, setTab] = useState(0);
  return (
    <div style={{ minHeight: "100vh", background: COLORS.bg, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", paddingBottom: 90 }}>
      <div style={{ background: "linear-gradient(135deg,#0f1428,#141828)", borderBottom: "1px solid " + COLORS.border, padding: "16px 16px 12px", position: "sticky", top: 0, zIndex: 10 }}>
        <div style={{ fontSize: 10, color: COLORS.gold, fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: 4 }}>NBC 2016 · BIS SP 7 · INDIA</div>
        <div style={{ fontSize: 18, fontWeight: 800, color: COLORS.text }}>Indian Plot & Building Analyser</div>
      </div>

      <div style={{ padding: "14px 14px 0" }}>
        {tab === 0 && <IrregularPlot />}
        {tab === 1 && <CommercialCalc />}
        {tab === 2 && <ResidentialCalc />}
      </div>

      <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, background: "#0d1122", borderTop: "1px solid " + COLORS.border, display: "flex", zIndex: 20 }}>
        {TABS.map(function(t, i) {
          return (
            <button key={i} onClick={function() { setTab(i); }} style={{ flex: 1, padding: "10px 4px 8px", border: "none", background: "transparent", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 3, borderTop: "3px solid " + (tab === i ? t.color : "transparent") }}>
              <span style={{ fontSize: 22 }}>{t.icon}</span>
              <span style={{ fontSize: 9, color: tab === i ? t.color : COLORS.muted, fontWeight: tab === i ? 700 : 400, whiteSpace: "pre", textAlign: "center", lineHeight: 1.3 }}>{t.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
