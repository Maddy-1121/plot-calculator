import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
ReactDOM.createRoot(document.getElementById('root')).render(<App />)

// ─── Data ────────────────────────────────────────────────────────────────────
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
  { type:"Master Bedroom",   minArea:9.5,  minDim:2.4, nbc:"6.2.1" },
  { type:"Bedroom",          minArea:7.5,  minDim:2.1, nbc:"6.2.1" },
  { type:"Living Room",      minArea:9.5,  minDim:2.4, nbc:"6.2.2" },
  { type:"Kitchen",          minArea:4.5,  minDim:1.5, nbc:"6.2.4" },
  { type:"Bathroom",         minArea:1.8,  minDim:1.0, nbc:"6.2.5" },
  { type:"Toilet / WC",      minArea:1.1,  minDim:0.9, nbc:"6.2.5" },
  { type:"Store / Utility",  minArea:3.0,  minDim:1.5, nbc:"6.2.6" },
  { type:"Balcony",          minArea:0,    minDim:0,   nbc:"—" },
  { type:"Staircase",        minArea:0,    minDim:0,   nbc:"6.7" },
];

// ─── Utils ───────────────────────────────────────────────────────────────────
const nv = v => { const x=parseFloat(v); return isNaN(x)||x<0?0:x; };
const fmt = (v,d=1) => (+v).toLocaleString("en-IN",{maximumFractionDigits:d});
const pct = (a,b) => b>0?((a/b)*100).toFixed(0):"0";
function heronArea(a,b,c){ const s=(a+b+c)/2,v=s*(s-a)*(s-b)*(s-c); return v>0?Math.sqrt(v):0; }
function shoelace(pts){ let s=0; for(let i=0;i<pts.length;i++){const j=(i+1)%pts.length;s+=pts[i].x*pts[j].y-pts[j].x*pts[i].y;} return Math.abs(s)/2; }
function perim(pts){ let p=0; for(let i=0;i<pts.length;i++){const j=(i+1)%pts.length,dx=pts[j].x-pts[i].x,dy=pts[j].y-pts[i].y;p+=Math.sqrt(dx*dx+dy*dy);} return p; }

// ─── Design tokens ───────────────────────────────────────────────────────────
const C = { bg:"#0b0e1a", card:"#141828", border:"#1e2640", text:"#e2e8f0", muted:"#64748b", gold:"#f59e0b", blue:"#3b82f6", green:"#22c55e", red:"#ef4444", purple:"#a855f7", orange:"#f97316" };
const ACCENT = [C.gold, C.blue, C.green, "#ec4899", C.purple, C.orange];

// ─── Shared Components ───────────────────────────────────────────────────────
function Card({ children, accent, style={} }) {
  return (
    <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:16,
      borderTop: accent?`3px solid ${accent}`:`1px solid ${C.border}`,
      padding:"16px", marginBottom:12, ...style }}>
      {children}
    </div>
  );
}

function SectionTitle({ children, color=C.gold }) {
  return <div style={{ fontSize:11, fontWeight:700, color:C.muted, textTransform:"uppercase", letterSpacing:"0.12em", marginBottom:12, display:"flex", alignItems:"center", gap:6 }}>
    <div style={{ width:3, height:14, background:color, borderRadius:2 }} />{children}
  </div>;
}

function BigStat({ label, value, sub, color=C.gold, warn=false }) {
  const col = warn ? C.red : color;
  return (
    <div style={{ background:C.bg, border:`1px solid ${warn?C.red:C.border}`, borderRadius:12,
      padding:"14px 12px", flex:1, minWidth:0 }}>
      <div style={{ fontSize:10, color:C.muted, textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:6, lineHeight:1.2 }}>{label}</div>
      <div style={{ fontSize:22, fontWeight:800, color:col, lineHeight:1, fontVariantNumeric:"tabular-nums" }}>{value}</div>
      {sub && <div style={{ fontSize:11, color:C.muted, marginTop:4 }}>{sub}</div>}
    </div>
  );
}

function NumInput({ label, value, onChange, min=0, step=0.5, suffix, hint, warn=false }) {
  const decrement = () => { const v = Math.max(min, nv(value) - step); onChange(String(+v.toFixed(2))); };
  const increment = () => { const v = nv(value) + step; onChange(String(+v.toFixed(2))); };
  return (
    <div style={{ marginBottom:14 }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"baseline", marginBottom:6 }}>
        <div>
          <span style={{ fontSize:14, color: warn ? C.red : C.text, fontWeight:500 }}>{label}</span>
          {hint && <div style={{ fontSize:11, color:C.muted, marginTop:2 }}>{hint}</div>}
        </div>
        {suffix && <span style={{ fontSize:12, color:C.muted }}>{suffix}</span>}
      </div>
      <div style={{ display:"flex", alignItems:"center", gap:0, background:C.bg, border:`1.5px solid ${warn?C.red:C.border}`, borderRadius:12, overflow:"hidden" }}>
        <button onClick={decrement} style={{ width:48, height:48, border:"none", background:"transparent", color:C.muted, fontSize:22, cursor:"pointer", flexShrink:0, display:"flex", alignItems:"center", justifyContent:"center" }}>−</button>
        <input type="number" inputMode="decimal" min={min} step={step} value={value}
          onChange={e=>onChange(e.target.value)}
          style={{ flex:1, background:"transparent", border:"none", color:C.text, fontSize:18, fontWeight:700, textAlign:"center", outline:"none", padding:"0 4px", height:48 }} />
        <button onClick={increment} style={{ width:48, height:48, border:"none", background:"transparent", color:C.muted, fontSize:22, cursor:"pointer", flexShrink:0, display:"flex", alignItems:"center", justifyContent:"center" }}>+</button>
      </div>
    </div>
  );
}

function PillSelect({ options, value, onChange, color=C.gold }) {
  return (
    <div style={{ display:"flex", flexWrap:"wrap", gap:8, marginBottom:16 }}>
      {options.map(o => (
        <button key={o} onClick={() => onChange(o)} style={{
          padding:"8px 14px", borderRadius:20, border:`1.5px solid ${value===o?color:C.border}`,
          background: value===o?`rgba(${hexRgb(color)},0.12)`:"transparent",
          color: value===o?color:C.muted, fontSize:13, cursor:"pointer", fontWeight: value===o?700:400,
        }}>{o}</button>
      ))}
    </div>
  );
}

function Badge({ ok, label }) {
  return <span style={{ padding:"4px 10px", borderRadius:20, fontSize:12, fontWeight:600,
    background:ok?"rgba(34,197,94,0.12)":"rgba(239,68,68,0.12)",
    border:`1px solid ${ok?C.green:C.red}`, color:ok?C.green:C.red }}>
    {ok?"✓":"✗"} {label}
  </span>;
}

function ProgressBar({ value, max, color }) {
  return (
    <div style={{ height:8, background:C.bg, borderRadius:4, overflow:"hidden" }}>
      <div style={{ height:"100%", width:`${Math.min(100,(value/max)*100)}%`, background:color, borderRadius:4, transition:"width 0.3s" }}/>
    </div>
  );
}

function Accordion({ title, children, defaultOpen=false, color=C.gold }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={{ border:`1px solid ${C.border}`, borderRadius:14, marginBottom:10, overflow:"hidden" }}>
      <button onClick={()=>setOpen(o=>!o)} style={{ width:"100%", display:"flex", justifyContent:"space-between", alignItems:"center", padding:"14px 16px", background:C.card, border:"none", cursor:"pointer", textAlign:"left" }}>
        <span style={{ fontSize:15, fontWeight:600, color:C.text }}>{title}</span>
        <span style={{ fontSize:18, color:color, transition:"transform 0.2s", display:"inline-block", transform:open?"rotate(180deg)":"none" }}>⌄</span>
      </button>
      {open && <div style={{ padding:"0 16px 16px", background:C.card }}>{children}</div>}
    </div>
  );
}

function hexRgb(hex){ const r=parseInt(hex.slice(1,3),16),g=parseInt(hex.slice(3,5),16),b=parseInt(hex.slice(5,7),16); return `${r},${g},${b}`; }

// ─── SVG Plan ─────────────────────────────────────────────────────────────────
function SitePlanSVG({ plotL, plotB, sbF, sbR, sbS, shopL, shopB, cM, cS, shopCols, shopRows, color=C.gold }) {
  const W=340, H=220, PAD=28;
  if(!plotL||!plotB) return null;
  const sc = Math.min((W-2*PAD)/plotL,(H-2*PAD)/plotB,10);
  const pw=plotL*sc, ph=plotB*sc, ox=(W-pw)/2, oy=(H-ph)/2;
  const sf=sbF*sc, sr=sbR*sc, ss=sbS*sc, cm=cM*sc, cs=cS*sc;
  const bx=ox+ss, by=oy+sf, bw=Math.max(0,pw-2*ss), bh=Math.max(0,ph-sf-sr);
  const sW=shopL*sc, sH=shopB*sc;
  const cells=[];
  for(let r=0;r<shopRows;r++) for(let c2=0;c2<shopCols;c2++) cells.push({r,c:c2,i:r*shopCols+c2});
  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ display:"block", borderRadius:12, background:C.bg }}>
      <rect x={ox} y={oy} width={pw} height={ph} fill="none" stroke={color} strokeWidth="1.5" strokeDasharray="6,3"/>
      <rect x={bx} y={by} width={bw} height={bh} fill="rgba(59,130,246,0.06)" stroke={C.blue} strokeWidth="0.8" strokeDasharray="4,2"/>
      {cm>0&&bw>0&&<rect x={bx} y={by} width={bw} height={Math.min(cm,bh)} fill="rgba(245,158,11,0.12)" stroke={C.gold} strokeWidth="0.8"/>}
      {cells.map(({r,c2c,i,c})=>{
        const sx=bx+c*(sW+cs), sy=by+cm+r*(sH+cs), col=ACCENT[i%ACCENT.length];
        if(sx+sW>bx+bw-1||sy+sH>by+bh-1) return null;
        return <g key={i}><rect x={sx} y={sy} width={sW} height={sH} fill={col} opacity="0.2" rx="1"/><rect x={sx} y={sy} width={sW} height={sH} fill="none" stroke={col} strokeWidth="0.7" rx="1"/>{sW>14&&sH>10&&<text x={sx+sW/2} y={sy+sH/2+3} textAnchor="middle" fontSize={Math.min(7,sH*0.35)} fill={col}>{i+1}</text>}</g>;
      })}
      <text x={W/2} y={oy-8} textAnchor="middle" fontSize="9" fill={color} opacity="0.7">{plotL}m</text>
      <text x={ox-8} y={oy+ph/2} textAnchor="middle" fontSize="9" fill={color} opacity="0.7" transform={`rotate(-90,${ox-8},${oy+ph/2})`}>{plotB}m</text>
    </svg>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MODULE 1 — IRREGULAR PLOT
// ═══════════════════════════════════════════════════════════════════════════════
function IrregularPlot() {
  const [method, setMethod] = useState("sides");
  const [unit, setUnit] = useState("m");
  const [pts, setPts] = useState([{x:"0",y:"0"},{x:"15",y:"0"},{x:"14",y:"10"},{x:"2",y:"12"}]);
  const [sides, setSides] = useState({A:"15",B:"12",C:"14",D:"10",diag:"18"});

  const updatePt = (i,f,v) => setPts(p=>p.map((x,idx)=>idx===i?{...x,[f]:v}:x));
  const addPt = () => { if(pts.length>=8) return; const l=pts[pts.length-1]; setPts(p=>[...p,{x:String(nv(l.x)+3),y:l.y}]); };
  const removePt = i => { if(pts.length<=3) return; setPts(p=>p.filter((_,idx)=>idx!==i)); };

  const coordPts = pts.map(p=>({x:nv(p.x),y:nv(p.y)}));
  const coordArea = shoelace(coordPts);
  const coordPerim = perim(coordPts);
  const {A,B,D,diag} = sides; const Bs=sides.B; const Cs=sides.C;
  const tri1 = heronArea(nv(A),nv(Bs),nv(diag));
  const tri2 = heronArea(nv(Cs),nv(D),nv(diag));
  const fieldArea = tri1+tri2;
  const area = method==="coords"?coordArea:fieldArea;
  const perimV = method==="coords"?coordPerim:(nv(A)+nv(Bs)+nv(Cs)+nv(D));
  const toSqFt = unit==="m"?10.764:unit==="yd"?9:1;
  const sqFt = area*toSqFt;
  const acres = sqFt/43560;
  const guntha = acres*40;

  // Mini SVG for coordinate method
  const W2=340,H2=200,P2=24;
  const scaledPts = useMemo(()=>{
    if(coordPts.length<2) return [];
    const xs=coordPts.map(p=>p.x),ys=coordPts.map(p=>p.y);
    const minX=Math.min(...xs),maxX=Math.max(...xs),minY=Math.min(...ys),maxY=Math.max(...ys);
    const rX=maxX-minX||1,rY=maxY-minY||1;
    const sc2=Math.min((W2-2*P2)/rX,(H2-2*P2)/rY);
    return coordPts.map(p=>({sx:P2+(p.x-minX)*sc2,sy:H2-P2-(p.y-minY)*sc2}));
  },[coordPts]);

  return (
    <div>
      <Card accent={C.blue}>
        <SectionTitle color={C.blue}>Method</SectionTitle>
        <PillSelect options={["sides","coords"]} value={method} onChange={setMethod} color={C.blue} />
        <SectionTitle color={C.blue}>Unit</SectionTitle>
        <PillSelect options={["m","ft","yd"]} value={unit} onChange={setUnit} color={C.blue} />
      </Card>

      {method==="sides" ? (
        <Card>
          <SectionTitle>4 Sides + Diagonal (Field Method)</SectionTitle>
          <div style={{ padding:"10px", background:C.bg, borderRadius:10, marginBottom:14 }}>
            <svg width="100%" viewBox="0 0 240 130">
              <polygon points="20,110 190,110 220,25 55,8" fill="rgba(245,158,11,0.06)" stroke={C.gold} strokeWidth="1.5" strokeDasharray="5,3"/>
              <line x1="20" y1="110" x2="220" y2="25" stroke={C.blue} strokeWidth="1" strokeDasharray="4,3"/>
              <text x="105" y="125" fontSize="11" fill={C.gold} textAnchor="middle">A (bottom)</text>
              <text x="222" y="72" fontSize="11" fill={C.gold}>B</text>
              <text x="128" y="14" fontSize="11" fill={C.gold} textAnchor="middle">C (top)</text>
              <text x="2" y="62" fontSize="11" fill={C.gold}>D</text>
              <text x="105" y="60" fontSize="10" fill={C.blue} textAnchor="middle">diagonal</text>
            </svg>
          </div>
          {["A","B","C","D"].map(k=>(
            <NumInput key={k} label={`Side ${k}`} value={sides[k]} onChange={v=>setSides(s=>({...s,[k]:v}))} suffix={unit}/>
          ))}
          <NumInput label="Diagonal (A→C)" value={sides.diag} onChange={v=>setSides(s=>({...s,diag:v}))} suffix={unit} hint="Measure from A-corner to C-corner"/>
          <div style={{ marginTop:8, padding:"10px 12px", background:C.bg, borderRadius:8, fontSize:12, color:C.muted }}>
            Triangle 1 (A+B+d): <b style={{color:C.gold}}>{fmt(tri1)} {unit}²</b> &nbsp;+&nbsp; Triangle 2 (C+D+d): <b style={{color:C.gold}}>{fmt(tri2)} {unit}²</b>
          </div>
        </Card>
      ) : (
        <Card>
          <SectionTitle>Corner Coordinates (X, Y)</SectionTitle>
          {scaledPts.length>=3 && (
            <svg width="100%" viewBox={`0 0 ${W2} ${H2}`} style={{ display:"block", background:C.bg, borderRadius:10, marginBottom:12 }}>
              <polygon points={scaledPts.map(p=>`${p.sx},${p.sy}`).join(" ")} fill="rgba(59,130,246,0.08)" stroke={C.blue} strokeWidth="1.5"/>
              {scaledPts.map((p,i)=>{
                const j=(i+1)%scaledPts.length;
                const q=scaledPts[j];
                const dx=coordPts[j].x-coordPts[i].x,dy=coordPts[j].y-coordPts[i].y;
                const d=Math.sqrt(dx*dx+dy*dy);
                return <g key={i}>
                  <text x={(p.sx+q.sx)/2} y={(p.sy+q.sy)/2-4} textAnchor="middle" fontSize="8" fill={C.blue} opacity="0.8">{d.toFixed(1)}{unit}</text>
                  <circle cx={p.sx} cy={p.sy} r="6" fill={ACCENT[i%ACCENT.length]} stroke={C.bg} strokeWidth="2"/>
                  <text x={p.sx+9} y={p.sy-3} fontSize="8" fill={ACCENT[i%ACCENT.length]}>{i+1}</text>
                </g>;
              })}
            </svg>
          )}
          {pts.map((p,i)=>(
            <div key={i} style={{ display:"flex", gap:8, alignItems:"center", marginBottom:8 }}>
              <div style={{ width:24, height:24, borderRadius:"50%", background:ACCENT[i%ACCENT.length], display:"flex", alignItems:"center", justifyContent:"center", fontSize:10, color:"#fff", fontWeight:700, flexShrink:0 }}>{i+1}</div>
              <div style={{ flex:1 }}>
                <div style={{ display:"flex", gap:6 }}>
                  <input type="number" inputMode="decimal" placeholder="X" value={p.x} onChange={e=>updatePt(i,"x",e.target.value)}
                    style={{ flex:1, background:C.bg, border:`1px solid ${C.border}`, color:C.text, borderRadius:8, padding:"10px", fontSize:15, outline:"none", textAlign:"center" }}/>
                  <input type="number" inputMode="decimal" placeholder="Y" value={p.y} onChange={e=>updatePt(i,"y",e.target.value)}
                    style={{ flex:1, background:C.bg, border:`1px solid ${C.border}`, color:C.text, borderRadius:8, padding:"10px", fontSize:15, outline:"none", textAlign:"center" }}/>
                </div>
              </div>
              <button onClick={()=>removePt(i)} disabled={pts.length<=3}
                style={{ width:36, height:36, borderRadius:8, border:`1px solid ${C.border}`, background:"transparent", color:C.muted, cursor:"pointer", fontSize:18, flexShrink:0 }}>×</button>
            </div>
          ))}
          <button onClick={addPt} disabled={pts.length>=8}
            style={{ width:"100%", padding:"12px", border:`1.5px dashed ${C.blue}`, borderRadius:10, background:"transparent", color:C.blue, cursor:"pointer", fontSize:14, marginTop:4 }}>
            + Add Corner (max 8)
          </button>
        </Card>
      )}

      {/* Results */}
      <Card accent={C.gold}>
        <SectionTitle>Area Results</SectionTitle>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:10 }}>
          <BigStat label={`Area (${unit}²)`} value={fmt(area,2)} color={C.gold}/>
          <BigStat label="Area (sq ft)" value={fmt(sqFt,0)} color={C.blue}/>
          <BigStat label="Acres" value={acres.toFixed(4)} color={C.green}/>
          <BigStat label="Guntha" value={guntha.toFixed(3)} color={C.purple}/>
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
          <BigStat label={`Perimeter (${unit})`} value={fmt(perimV,1)} color={C.orange}/>
          <BigStat label="Sq Yards" value={fmt(unit==="yd"?area:unit==="m"?area*1.196:area/9,1)} color="#ec4899"/>
        </div>
      </Card>

      {/* Side table for coordinates */}
      {method==="coords" && (
        <Card>
          <SectionTitle>Side Measurements</SectionTitle>
          {coordPts.map((p,i)=>{
            const j=(i+1)%coordPts.length,q=coordPts[j];
            const d=Math.sqrt((q.x-p.x)**2+(q.y-p.y)**2);
            return (
              <div key={i} style={{ display:"flex", justifyContent:"space-between", padding:"10px 0", borderBottom:`1px solid ${C.border}` }}>
                <span style={{ color:ACCENT[i%ACCENT.length], fontWeight:700, fontSize:14 }}>Side {String.fromCharCode(65+i)}</span>
                <span style={{ color:C.muted, fontSize:12 }}>P{i+1}→P{j+1}</span>
                <span style={{ color:C.green, fontWeight:700, fontSize:14 }}>{d.toFixed(2)} {unit}</span>
              </div>
            );
          })}
        </Card>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MODULE 2 — COMMERCIAL
// ═══════════════════════════════════════════════════════════════════════════════
function CommercialCalc() {
  const [zone,setZone] = useState("Local Commercial");
  const z = COMM_ZONES[zone];
  const [pL,setPL]=useState("30"); const [pB,setPB]=useState("20");
  const [sbF,setSbF]=useState(String(z.front)); const [sbR,setSbR]=useState(String(z.rear)); const [sbS,setSbS]=useState(String(z.side));
  const [far,setFar]=useState(String(z.far)); const [cov,setCov]=useState(String(z.cov));
  const [cM,setCM]=useState(String(z.cM)); const [cS,setCS]=useState(String(z.cS));
  const [sL,setSL]=useState("3"); const [sB,setSB]=useState("4");
  const [floors,setFloors]=useState("1");

  function applyZone(zk){ setZone(zk);const p=COMM_ZONES[zk];setSbF(String(p.front));setSbR(String(p.rear));setSbS(String(p.side));setFar(String(p.far));setCov(String(p.cov));setCM(String(p.cM));setCS(String(p.cS)); }

  const C2 = useMemo(()=>{
    const plotL=nv(pL),plotB=nv(pB),sF=nv(sbF),sR=nv(sbR),sS=nv(sbS),FAR=nv(far),COV=nv(cov),cm=nv(cM),cs=nv(cS),shopL=nv(sL),shopB=nv(sB),fl=Math.max(1,Math.round(nv(floors)));
    const plotArea=plotL*plotB;
    const bpL=Math.max(0,plotL-2*sS),bpB=Math.max(0,plotB-sF-sR);
    const buildFP=bpL*bpB,maxCov=plotArea*COV/100,effGround=Math.min(buildFP,maxCov),maxFAR=plotArea*FAR;
    const corrArea=bpL*cm+(Math.max(0,bpB-cm))*cs,netShop=Math.max(0,effGround-corrArea);
    const cols=shopL>0?Math.floor(bpL/(shopL+cs)):0,rows=shopB>0?Math.floor(Math.max(0,bpB-cm)/(shopB+cs)):0;
    const shopsPF=cols*rows,totalShops=shopsPF*fl,totalShopArea=shopsPF*shopL*shopB;
    const eff=effGround>0?(totalShopArea/effGround)*100:0;
    const checks={cM:cm>=1.8,cS:cs>=1.2,sbF:sF>=z.front,sbR:sR>=3,sbS:sS>=z.side,cov:COV<=70,shopMin:shopL>=2.4&&shopB>=2.4};
    return {plotArea,bpL,bpB,buildFP,maxCov,effGround,maxFAR,corrArea,netShop,cols,rows,shopsPF,totalShops,totalShopArea,eff,fl,checks,cm,cs,plotL,plotB,sF,sR,sS,shopL,shopB};
  },[pL,pB,sbF,sbR,sbS,far,cov,cM,cS,sL,sB,floors,z]);

  const allPass = Object.values(C2.checks).every(Boolean);

  return (
    <div>
      {/* Zone */}
      <Card>
        <SectionTitle>Zone Classification</SectionTitle>
        <PillSelect options={Object.keys(COMM_ZONES)} value={zone} onChange={applyZone}/>
        <div style={{ display:"flex", justifyContent:"flex-end" }}><Badge ok={allPass} label={allPass?"NBC Compliant":"Needs Review"}/></div>
      </Card>

      {/* Plot setup */}
      <Accordion title="📐 Plot & FAR Setup" defaultOpen color={C.gold}>
        <NumInput label="Plot Length" value={pL} onChange={setPL} suffix="m"/>
        <NumInput label="Plot Breadth" value={pB} onChange={setPB} suffix="m"/>
        <NumInput label="Floors" value={floors} onChange={setFloors} min={1} step={1} suffix="floors"/>
        <NumInput label="FAR / FSI" value={far} onChange={setFar} step={0.25}/>
        <NumInput label="Ground Coverage" value={cov} onChange={setCov} step={5} suffix="%" warn={nv(cov)>70} hint="NBC max 70% commercial"/>
        {nv(pL)>0&&nv(pB)>0&&<div style={{marginTop:8,padding:"10px 12px",background:C.bg,borderRadius:8,fontSize:13,color:C.gold}}>Plot area: <b>{fmt(nv(pL)*nv(pB))} m²</b> = <b>{fmt(nv(pL)*nv(pB)*10.764,0)} sq ft</b></div>}
      </Accordion>

      {/* Setbacks */}
      <Accordion title="↔️ Setbacks" color={C.blue}>
        <NumInput label="Front Setback" value={sbF} onChange={setSbF} suffix="m" hint={`NBC min ${z.front}m`} warn={nv(sbF)<z.front}/>
        <NumInput label="Rear Setback" value={sbR} onChange={setSbR} suffix="m" hint="NBC min 3.0m" warn={nv(sbR)<3}/>
        <NumInput label="Side Setback (each)" value={sbS} onChange={setSbS} suffix="m" hint={`NBC min ${z.side}m`} warn={nv(sbS)<z.side}/>
      </Accordion>

      {/* Corridors */}
      <Accordion title="🚶 Corridors (NBC Cl. 8.2)" color={C.green}>
        <NumInput label="Main Corridor" value={cM} onChange={setCM} suffix="m" hint="NBC min 1.8m" warn={nv(cM)<1.8}/>
        <NumInput label="Sub Corridor" value={cS} onChange={setCS} suffix="m" hint="NBC min 1.2m" warn={nv(cS)<1.2}/>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginTop:8 }}>
          <BigStat label="Corridor Area/fl" value={`${fmt(C2.corrArea)} m²`} color={C.gold}/>
          <BigStat label="Corridor %" value={`${pct(C2.corrArea,C2.effGround)}%`} color={C2.corrArea/C2.effGround>0.3?C.red:C.green} warn={C2.corrArea/C2.effGround>0.3}/>
        </div>
      </Accordion>

      {/* Key results */}
      <Card accent={C.gold}>
        <SectionTitle>Area Breakdown</SectionTitle>
        {[["Buildable footprint",C2.effGround,C.text,"(after setbacks)"],["Corridor area",C2.corrArea,C.gold,"per floor"],["Net shop area",C2.netShop,C.green,"per floor"],["FAR limit",C2.maxFAR,C.purple,"total"]].map(([l,v,col,s])=>(
          <div key={l} style={{ marginBottom:10 }}>
            <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
              <span style={{ fontSize:13, color:col }}>{l}</span>
              <span style={{ fontSize:13, color:col, fontWeight:700 }}>{fmt(v)} m²</span>
            </div>
            <ProgressBar value={v} max={C2.plotArea} color={col}/>
            <div style={{ fontSize:11, color:C.muted, marginTop:2 }}>{s} · {fmt(v*10.764,0)} sqft</div>
          </div>
        ))}
      </Card>

      {/* Shop layout */}
      <Accordion title="🏪 Shop Size & Count" color={C.blue}>
        <NumInput label="Shop Length" value={sL} onChange={setSL} suffix="m" warn={nv(sL)<2.4} hint="NBC min 2.4m"/>
        <NumInput label="Shop Breadth" value={sB} onChange={setSB} suffix="m" warn={nv(sB)<2.4} hint="NBC min 2.4m"/>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginTop:4 }}>
          <BigStat label="Shops/floor" value={C2.shopsPF} color={C.gold}/>
          <BigStat label="Total shops" value={C2.totalShops} color={C.green} sub={`${C2.fl} floor(s)`}/>
          <BigStat label="Grid" value={`${C2.cols}×${C2.rows}`} color={C.blue} sub="cols × rows"/>
          <BigStat label="Efficiency" value={`${C2.eff.toFixed(0)}%`} color={C2.eff>55?C.green:C.gold}/>
        </div>
      </Accordion>

      {/* Site plan */}
      <Card>
        <SectionTitle>Site Plan Preview</SectionTitle>
        <SitePlanSVG plotL={C2.plotL} plotB={C2.plotB} sbF={C2.sF} sbR={C2.sR} sbS={C2.sS} shopL={C2.shopL} shopB={C2.shopB} cM={C2.cm} cS={C2.cs} shopCols={C2.cols} shopRows={C2.rows}/>
        <div style={{ display:"flex", gap:12, marginTop:8, fontSize:11, color:C.muted, flexWrap:"wrap" }}>
          <span>▪ <span style={{color:C.gold}}>Plot outline</span></span>
          <span>▪ <span style={{color:C.blue}}>Buildable zone</span></span>
          <span>▪ <span style={{color:C.gold,opacity:0.6}}>Main corridor</span></span>
        </div>
      </Card>

      {/* Code check */}
      <Card>
        <SectionTitle>NBC 2016 Code Check</SectionTitle>
        {[
          ["NBC 8.2.1","Main corridor","≥1.8m",`${nv(cM).toFixed(1)}m`,C2.checks.cM],
          ["NBC 8.2.2","Sub corridor","≥1.2m",`${nv(cS).toFixed(1)}m`,C2.checks.cS],
          ["NBC Tb.2","Front setback",`≥${z.front}m`,`${nv(sbF).toFixed(1)}m`,C2.checks.sbF],
          ["NBC Tb.2","Rear setback","≥3.0m",`${nv(sbR).toFixed(1)}m`,C2.checks.sbR],
          ["NBC 12.3","Coverage","≤70%",`${nv(cov)}%`,C2.checks.cov],
          ["NBC 6.4.1","Min shop size","≥2.4×2.4m",`${nv(sL).toFixed(1)}×${nv(sB).toFixed(1)}m`,C2.checks.shopMin],
        ].map(([cl,req,mn,pr,ok])=>(
          <div key={cl} style={{ padding:"10px 0", borderBottom:`1px solid ${C.border}`, display:"flex", justifyContent:"space-between", alignItems:"center", gap:8 }}>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:12, color:C.text, fontWeight:500 }}>{req}</div>
              <div style={{ fontSize:10, color:C.muted }}>{cl} · {mn} · provided: <b style={{color:ok?C.green:C.red}}>{pr}</b></div>
            </div>
            <Badge ok={ok} label={ok?"PASS":"FAIL"}/>
          </div>
        ))}
        <div style={{ marginTop:12, padding:"10px 12px", background:C.bg, borderRadius:8, fontSize:12, color:C.muted }}>
          🚗 Parking: <b style={{color:C.blue}}>{Math.ceil(C2.effGround*C2.fl/50)} ECS</b> required (1 per 50m² GFA)
        </div>
      </Card>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MODULE 3 — RESIDENTIAL
// ═══════════════════════════════════════════════════════════════════════════════
function ResidentialCalc() {
  const [zone,setZone] = useState("Plot ≤250 m²");
  const z = RES_ZONES[zone];
  const [pL,setPL]=useState("12"); const [pB,setPB]=useState("18");
  const [sbF,setSbF]=useState(String(z.front)); const [sbR,setSbR]=useState(String(z.rear)); const [sbS,setSbS]=useState(String(z.side));
  const [far,setFar]=useState(String(z.far)); const [cov,setCov]=useState(String(z.cov));
  const [floors,setFloors]=useState("2");
  const [rooms,setRooms]=useState([
    {type:"Master Bedroom",l:"4",b:"3.5",qty:"1"},
    {type:"Bedroom",l:"3.5",b:"3",qty:"2"},
    {type:"Living Room",l:"5",b:"4",qty:"1"},
    {type:"Kitchen",l:"3.5",b:"2.5",qty:"1"},
    {type:"Bathroom",l:"2",b:"1.8",qty:"2"},
    {type:"Toilet / WC",l:"1.5",b:"1.2",qty:"1"},
  ]);

  function applyZone(zk){setZone(zk);const p=RES_ZONES[zk];setSbF(String(p.front));setSbR(String(p.rear));setSbS(String(p.side));setFar(String(p.far));setCov(String(p.cov));}
  const updateRoom=(i,f,v)=>setRooms(r=>r.map((x,idx)=>idx===i?{...x,[f]:v}:x));
  const addRoom=()=>setRooms(r=>[...r,{type:"Store / Utility",l:"3",b:"2",qty:"1"}]);
  const removeRoom=i=>setRooms(r=>r.filter((_,idx)=>idx!==i));

  const R = useMemo(()=>{
    const plotL=nv(pL),plotB=nv(pB),sF=nv(sbF),sR=nv(sbR),sS=nv(sbS),FAR=nv(far),COV=nv(cov),fl=Math.max(1,Math.round(nv(floors)));
    const plotArea=plotL*plotB,bpL=Math.max(0,plotL-2*sS),bpB=Math.max(0,plotB-sF-sR);
    const buildFP=bpL*bpB,maxCov=plotArea*COV/100,effGround=Math.min(buildFP,maxCov),maxFAR=plotArea*FAR;
    const totalBuiltUp=Math.min(maxFAR,effGround*fl),netLivable=totalBuiltUp*0.85,wallEtc=totalBuiltUp*0.15;
    const roomResults=rooms.map(rm=>{
      const rl=nv(rm.l),rb=nv(rm.b),qty=Math.max(1,parseInt(rm.qty)||1),area=rl*rb;
      const nbc2=NBC_ROOMS.find(x=>x.type===rm.type)||{minArea:0,minDim:0,nbc:"—"};
      return {...rm,rl,rb,area,qty,totalArea:area*qty,areaOk:area>=nbc2.minArea||nbc2.minArea===0,dimOk:rl>=nbc2.minDim&&rb>=nbc2.minDim||nbc2.minDim===0,nbc2};
    });
    const totalRoomArea=roomResults.reduce((s,r)=>s+r.totalArea,0);
    const checks={sbF:sF>=z.front,sbR:sR>=z.rear,sbS:sS>=z.side,cov:COV<=60,roomFit:totalRoomArea<=netLivable};
    return {plotArea,bpL,bpB,buildFP,maxCov,effGround,maxFAR,totalBuiltUp,netLivable,wallEtc,totalRoomArea,fl,checks,roomResults,plotL,plotB,sF,sR,sS};
  },[pL,pB,sbF,sbR,sbS,far,cov,floors,rooms,z]);

  const allPass = Object.values(R.checks).every(Boolean);
  const fits = R.totalRoomArea <= R.netLivable;

  return (
    <div>
      {/* Zone */}
      <Card>
        <SectionTitle color={C.green}>Residential Zone (NBC)</SectionTitle>
        <PillSelect options={Object.keys(RES_ZONES)} value={zone} onChange={applyZone} color={C.green}/>
        <div style={{ display:"flex", justifyContent:"flex-end" }}><Badge ok={allPass} label={allPass?"Compliant":"Review Needed"}/></div>
      </Card>

      {/* Plot */}
      <Accordion title="📐 Plot Setup" defaultOpen color={C.green}>
        <NumInput label="Plot Length" value={pL} onChange={setPL} suffix="m"/>
        <NumInput label="Plot Breadth" value={pB} onChange={setPB} suffix="m"/>
        <NumInput label="Floors" value={floors} onChange={setFloors} min={1} step={1} suffix="floors" hint="G=1, G+1=2, G+2=3"/>
        <NumInput label="FAR / FSI" value={far} onChange={setFar} step={0.25} hint={`Zone default: ${z.far}`}/>
        <NumInput label="Coverage" value={cov} onChange={setCov} step={5} suffix="%" hint={`Zone max: 60%`} warn={nv(cov)>60}/>
        {nv(pL)>0&&nv(pB)>0&&<div style={{marginTop:8,padding:"10px 12px",background:C.bg,borderRadius:8,fontSize:13,color:C.green}}>Plot: <b>{fmt(nv(pL)*nv(pB))} m²</b> · Buildable: <b>{fmt(R.buildFP)} m²</b></div>}
      </Accordion>

      {/* Setbacks */}
      <Accordion title="↔️ Setbacks (NBC)" color={C.blue}>
        <NumInput label="Front Setback" value={sbF} onChange={setSbF} suffix="m" hint={`Min ${z.front}m`} warn={nv(sbF)<z.front}/>
        <NumInput label="Rear Setback" value={sbR} onChange={setSbR} suffix="m" hint={`Min ${z.rear}m`} warn={nv(sbR)<z.rear}/>
        <NumInput label="Side Setback" value={sbS} onChange={setSbS} suffix="m" hint={`Min ${z.side}m`} warn={nv(sbS)<z.side}/>
      </Accordion>

      {/* Key numbers */}
      <Card accent={C.green}>
        <SectionTitle color={C.green}>Permissible Construction</SectionTitle>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:10 }}>
          <BigStat label="Total Built-up" value={`${fmt(R.totalBuiltUp)} m²`} color={C.green} sub={`${fmt(R.totalBuiltUp*10.764,0)} sqft`}/>
          <BigStat label="Net Livable (85%)" value={`${fmt(R.netLivable)} m²`} color={C.blue}/>
          <BigStat label="Per Floor" value={`${fmt(R.effGround)} m²`} color={C.gold}/>
          <BigStat label="Floors" value={R.fl} color={C.purple}/>
        </div>
        {[
          ["Total built-up",R.totalBuiltUp,C.text],
          ["Walls/stairs/columns",R.wallEtc,C.orange],
          ["Net livable",R.netLivable,C.green],
          ["Your rooms planned",R.totalRoomArea,fits?C.blue:C.red],
          ["Remaining budget",Math.max(0,R.netLivable-R.totalRoomArea),C.purple],
        ].map(([l,v,col])=>(
          <div key={l} style={{ marginBottom:10 }}>
            <div style={{ display:"flex", justifyContent:"space-between", marginBottom:3 }}>
              <span style={{ fontSize:12, color:col }}>{l}</span>
              <span style={{ fontSize:12, color:col, fontWeight:700 }}>{fmt(v,1)} m²</span>
            </div>
            <ProgressBar value={v} max={R.totalBuiltUp} color={col}/>
          </div>
        ))}
      </Card>

      {/* Room planner */}
      <Card>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
          <SectionTitle color={C.green}>🏠 Room Planner</SectionTitle>
          <button onClick={addRoom} style={{ padding:"8px 14px", border:`1.5px solid ${C.green}`, borderRadius:20, background:"rgba(34,197,94,0.1)", color:C.green, cursor:"pointer", fontSize:13, fontWeight:600 }}>+ Room</button>
        </div>
        <div style={{ display:"flex", justifyContent:"space-between", padding:"10px 0", borderBottom:`1px solid ${C.border}`, marginBottom:8 }}>
          <span style={{ fontSize:13, color:C.muted }}>Total rooms area</span>
          <span style={{ fontSize:14, fontWeight:700, color:fits?C.green:C.red }}>{fmt(R.totalRoomArea,1)} m² <Badge ok={fits} label={fits?"Fits":"Exceeds"}/></span>
        </div>
        {R.roomResults.map((rm,i)=>(
          <div key={i} style={{ background:C.bg, border:`1px solid ${rm.areaOk&&rm.dimOk?C.border:C.red}`, borderRadius:12, padding:"12px", marginBottom:8 }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
              <select value={rm.type} onChange={e=>updateRoom(i,"type",e.target.value)}
                style={{ background:"transparent", border:"none", color:C.text, fontSize:14, fontWeight:600, cursor:"pointer", flex:1, outline:"none" }}>
                {NBC_ROOMS.map(r=><option key={r.type} value={r.type} style={{background:C.card}}>{r.type}</option>)}
              </select>
              <button onClick={()=>removeRoom(i)} style={{ width:28, height:28, borderRadius:7, border:`1px solid ${C.border}`, background:"transparent", color:C.muted, cursor:"pointer", fontSize:16, flexShrink:0 }}>×</button>
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 60px", gap:8, alignItems:"end" }}>
              <div>
                <div style={{ fontSize:10, color:C.muted, marginBottom:4 }}>Length (m)</div>
                <input type="number" inputMode="decimal" value={rm.l} onChange={e=>updateRoom(i,"l",e.target.value)}
                  style={{ width:"100%", background:C.card, border:`1px solid ${C.border}`, color:C.text, borderRadius:8, padding:"10px", fontSize:16, outline:"none", textAlign:"center", boxSizing:"border-box" }}/>
              </div>
              <div>
                <div style={{ fontSize:10, color:C.muted, marginBottom:4 }}>Breadth (m)</div>
                <input type="number" inputMode="decimal" value={rm.b} onChange={e=>updateRoom(i,"b",e.target.value)}
                  style={{ width:"100%", background:C.card, border:`1px solid ${C.border}`, color:C.text, borderRadius:8, padding:"10px", fontSize:16, outline:"none", textAlign:"center", boxSizing:"border-box" }}/>
              </div>
              <div>
                <div style={{ fontSize:10, color:C.muted, marginBottom:4 }}>Qty</div>
                <input type="number" inputMode="numeric" min={1} step={1} value={rm.qty} onChange={e=>updateRoom(i,"qty",e.target.value)}
                  style={{ width:"100%", background:C.card, border:`1px solid ${C.border}`, color:C.text, borderRadius:8, padding:"10px", fontSize:16, outline:"none", textAlign:"center", boxSizing:"border-box" }}/>
              </div>
            </div>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginTop:8 }}>
              <span style={{ fontSize:12, color:C.muted }}>Area: <b style={{color:C.gold}}>{fmt(rm.totalArea,1)} m²</b> {rm.qty>1?`(${fmt(rm.area,1)}×${rm.qty})`:""}</span>
              {!rm.areaOk&&rm.nbc2.minArea>0&&<span style={{ fontSize:11, color:C.red }}>Min {rm.nbc2.minArea}m² (NBC {rm.nbc2.nbc})</span>}
              {rm.areaOk&&rm.dimOk&&<span style={{ fontSize:11, color:C.green }}>✓ NBC OK</span>}
            </div>
          </div>
        ))}
      </Card>

      {/* NBC room reference */}
      <Accordion title="📋 NBC Min Room Sizes Reference" color={C.muted}>
        {NBC_ROOMS.filter(r=>r.minArea>0).map(r=>(
          <div key={r.type} style={{ display:"flex", justifyContent:"space-between", padding:"9px 0", borderBottom:`1px solid ${C.border}` }}>
            <span style={{ fontSize:13, color:C.text }}>{r.type}</span>
            <div style={{ textAlign:"right" }}>
              <div style={{ fontSize:13, color:C.gold, fontWeight:600 }}>≥{r.minArea} m²</div>
              <div style={{ fontSize:11, color:C.muted }}>min dim {r.minDim}m · NBC {r.nbc}</div>
            </div>
          </div>
        ))}
        <div style={{ marginTop:10, fontSize:11, color:C.muted, lineHeight:1.8 }}>
          • Room height ≥ 2.75m (NBC 6.3)<br/>
          • Kitchen/bath height ≥ 2.2m<br/>
          • Window area ≥ 1/10th of floor area<br/>
          • Staircase width ≥ 1.0m (NBC 6.7)
        </div>
      </Accordion>

      {/* Site plan */}
      <Card>
        <SectionTitle color={C.green}>Site Plan Preview</SectionTitle>
        <SitePlanSVG plotL={R.plotL} plotB={R.plotB} sbF={R.sF} sbR={R.sR} sbS={R.sS} shopL={0} shopB={0} cM={0} cS={0} shopCols={0} shopRows={0} color={C.green}/>
      </Card>

      {/* Code check */}
      <Card>
        <SectionTitle color={C.green}>NBC 2016 Compliance</SectionTitle>
        {[
          ["Front setback",`≥${z.front}m`,`${nv(sbF).toFixed(1)}m`,R.checks.sbF,"NBC Tb.2"],
          ["Rear setback",`≥${z.rear}m`,`${nv(sbR).toFixed(1)}m`,R.checks.sbR,"NBC Tb.2"],
          ["Side setback",`≥${z.side}m`,`${nv(sbS).toFixed(1)}m`,R.checks.sbS,"NBC Tb.2"],
          ["Coverage","≤60%",`${nv(cov)}%`,R.checks.cov,"NBC 12.3"],
          ["Rooms fit in plan","—",fits?"Yes":"Exceeds budget",R.checks.roomFit,"Design"],
        ].map(([req,mn,pr,ok,cl])=>(
          <div key={req} style={{ padding:"10px 0", borderBottom:`1px solid ${C.border}`, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
            <div>
              <div style={{ fontSize:13, color:C.text, fontWeight:500 }}>{req}</div>
              <div style={{ fontSize:11, color:C.muted }}>{cl} · {mn} → <b style={{color:ok?C.green:C.red}}>{pr}</b></div>
            </div>
            <Badge ok={ok} label={ok?"PASS":"FAIL"}/>
          </div>
        ))}
        <div style={{ marginTop:12, padding:"10px 12px", background:C.bg, borderRadius:8, fontSize:12, color:C.muted, lineHeight:1.8 }}>
          🚗 Parking: <b style={{color:C.blue}}>{R.fl} ECS</b> needed (~{R.fl*23} m²)<br/>
          💧 Rainwater harvesting mandatory if plot &gt;300 m²<br/>
          ☀️ Solar water heater mandatory (ECBC)<br/>
          🧱 Compound wall max 1.8m height
        </div>
      </Card>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// ROOT
// ═══════════════════════════════════════════════════════════════════════════════
const MAIN_TABS = [
  { label:"Irregular\nPlot", icon:"🔷", color:C.blue },
  { label:"Commercial\nShops", icon:"🏪", color:C.gold },
  { label:"Residential\nHome", icon:"🏠", color:C.green },
];

export default function App() {
  const [tab, setTab] = useState(0);
  return (
    <div style={{ minHeight:"100vh", background:C.bg, fontFamily:"-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif", paddingBottom:90 }}>
      {/* Header */}
      <div style={{ background:"linear-gradient(135deg,#0f1428,#141828)", borderBottom:`1px solid ${C.border}`, padding:"16px 16px 12px", position:"sticky", top:0, zIndex:10 }}>
        <div style={{ fontSize:10, color:C.gold, fontWeight:700, letterSpacing:"0.15em", textTransform:"uppercase", marginBottom:4 }}>NBC 2016 · BIS SP 7</div>
        <div style={{ fontSize:18, fontWeight:800, color:C.text }}>Indian Plot & Building Analyser</div>
      </div>

      {/* Content */}
      <div style={{ padding:"14px 14px 0" }}>
        {tab===0 && <IrregularPlot/>}
        {tab===1 && <CommercialCalc/>}
        {tab===2 && <ResidentialCalc/>}
      </div>

      {/* Bottom Nav */}
      <div style={{ position:"fixed", bottom:0, left:0, right:0, background:"#0d1122", borderTop:`1px solid ${C.border}`, display:"flex", zIndex:20, paddingBottom:"env(safe-area-inset-bottom,0px)" }}>
        {MAIN_TABS.map(({label,icon,color},i)=>(
          <button key={i} onClick={()=>setTab(i)} style={{ flex:1, padding:"10px 4px 8px", border:"none", background:"transparent", cursor:"pointer", display:"flex", flexDirection:"column", alignItems:"center", gap:3,
            borderTop:`3px solid ${tab===i?color:"transparent"}` }}>
            <span style={{ fontSize:22 }}>{icon}</span>
            <span style={{ fontSize:9, color:tab===i?color:C.muted, fontWeight:tab===i?700:400, whiteSpace:"pre", textAlign:"center", lineHeight:1.3 }}>{label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
