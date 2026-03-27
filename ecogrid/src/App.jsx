import { useState, useEffect, useCallback } from "react";

// ─── ROOMS ────────────────────────────────────────────────────────────────────
const ROOM_DEFS = [
  { id: 1, name: "Conference Room A", floor: "3F", area: 450 },
  { id: 2, name: "Open Office B",      floor: "2F", area: 1200 },
  { id: 3, name: "Lab 101",            floor: "1F", area: 600 },
  { id: 4, name: "Meeting Pod C",      floor: "3F", area: 120 },
  { id: 5, name: "Classroom D",        floor: "4F", area: 800 },
  { id: 6, name: "Lounge E",           floor: "2F", area: 350 },
];
const APPLIANCES = ["Lights", "HVAC", "Fans"];
const TIMEOUT_SEC = 15;

function initRoom(r) {
  return {
    ...r,
    occupied:    Math.random() > 0.45,
    timerSecs:   0,
    timerActive: false,
    poweredDown: false,
    appliances:  { Lights: true, HVAC: true, Fans: true },
    savedKwh:    +(Math.random() * 7 + 1).toFixed(2),
    streak:      Math.floor(Math.random() * 18),
  };
}

// ─── CARBON API ───────────────────────────────────────────────────────────────
const API = "https://api.carbonintensity.org.uk";
async function fetchIntensity()    { const r = await fetch(`${API}/intensity`);   const j = await r.json(); return j.data[0].intensity; }
async function fetchGenerationMix(){ const r = await fetch(`${API}/generation`);  const j = await r.json(); return j.data.generationmix; }
async function fetchForecast()     { const r = await fetch(`${API}/intensity/date`); const j = await r.json(); return j.data; }

// ─── HELPERS ──────────────────────────────────────────────────────────────────
function fmt(s) { return s > 59 ? `${Math.floor(s / 60)}m ${s % 60}s` : `${s}s`; }

function indexColor(idx) {
  const map = { "very low": "#16a34a", "low": "#22c55e", "moderate": "#d97706", "high": "#dc2626", "very high": "#b91c1c" };
  return map[(idx || "").toLowerCase()] || "#64748b";
}
function indexColorDark(idx) {
  const map = { "very low": "#4ade80", "low": "#86efac", "moderate": "#fde68a", "high": "#fca5a5", "very high": "#f87171" };
  return map[(idx || "").toLowerCase()] || "#94a3b8";
}

// ─── SUB-COMPONENTS ───────────────────────────────────────────────────────────

function Toast({ n, onDismiss }) {
  useEffect(() => { const t = setTimeout(onDismiss, 5000); return () => clearTimeout(t); }, []);
  return (
    <div style={{
      position: "fixed", bottom: 24, right: 24, zIndex: 9999,
      background: "var(--surface)", border: "1px solid var(--border)",
      borderLeft: "3px solid var(--accent)",
      borderRadius: 12, padding: "14px 18px", maxWidth: 320,
      boxShadow: "0 12px 40px var(--shadow)",
      animation: "toastIn .3s cubic-bezier(.16,1,.3,1)",
      display: "flex", gap: 12, alignItems: "flex-start",
    }}>
      <span style={{ fontSize: 20 }}>⚡</span>
      <div style={{ flex: 1 }}>
        <div style={{ fontFamily: "var(--ui)", fontWeight: 600, fontSize: 13, color: "var(--text)", marginBottom: 2 }}>{n.message}</div>
        <div style={{ fontSize: 11, color: "var(--accent)", fontFamily: "var(--mono)" }}>+{n.saved} kWh recovered</div>
      </div>
      <button onClick={onDismiss} style={{ background: "none", border: "none", color: "var(--muted)", cursor: "pointer", fontSize: 18, lineHeight: 1 }}>×</button>
    </div>
  );
}

function Pill({ ok, warn, off, children }) {
  const bg  = off ? "var(--off-bg)"   : ok ? "var(--on-bg)"   : "var(--warn-bg)";
  const col = off ? "var(--off-col)"  : ok ? "var(--on-col)"  : "var(--warn-col)";
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "3px 10px", borderRadius: 999, fontSize: 11, fontWeight: 600, fontFamily: "var(--ui)", background: bg, color: col }}>
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: col, animation: ok ? "dot 2s ease infinite" : "none" }} />
      {children}
    </span>
  );
}

function Btn({ children, onClick, ghost, accent, outline }) {
  const [h, setH] = useState(false);
  const s = accent
    ? { background: "var(--accent)", color: "#fff", borderColor: "var(--accent)", opacity: h ? .82 : 1 }
    : outline
    ? { background: "transparent", color: "var(--accent)", borderColor: "var(--accent)" }
    : { background: "transparent", color: "var(--muted)", borderColor: h ? "var(--accent)" : "var(--border)" };
  return (
    <button style={{ padding: "7px 14px", borderRadius: 8, fontSize: 12, fontFamily: "var(--ui)", fontWeight: 600, cursor: "pointer", transition: "all .15s", border: "1px solid", ...s }}
      onClick={onClick} onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}>
      {children}
    </button>
  );
}

function BarChart({ data, labels }) {
  const max = Math.max(...data, 1);
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 8, height: 120 }}>
      {data.map((v, i) => (
        <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6, height: "100%" }}>
          <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "flex-end", width: "100%", position: "relative" }}>
            <div style={{ position: "absolute", top: -18, left: "50%", transform: "translateX(-50%)", fontSize: 9, color: i === data.length - 1 ? "var(--accent)" : "var(--muted)", fontFamily: "var(--mono)", whiteSpace: "nowrap" }}>{v}</div>
            <div style={{ width: "100%", height: `${(v / max) * 100}%`, background: i === data.length - 1 ? "var(--accent)" : "var(--bar)", borderRadius: "4px 4px 0 0", minHeight: 4, transition: "height .6s ease" }} />
          </div>
          <div style={{ fontSize: 9, color: i === data.length - 1 ? "var(--accent)" : "var(--muted)", fontFamily: "var(--ui)" }}>{labels[i]}</div>
        </div>
      ))}
    </div>
  );
}

function GenMix({ mix }) {
  const icons = { gas: "🔥", coal: "⚫", nuclear: "☢️", wind: "🌬️", solar: "☀️", hydro: "💧", biomass: "🌿", imports: "🔌", other: "⚡", oil: "🛢️", storage: "🔋" };
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {[...mix].sort((a, b) => b.perc - a.perc).slice(0, 7).map(({ fuel, perc }) => (
        <div key={fuel}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
            <span style={{ fontFamily: "var(--ui)", fontSize: 13, color: "var(--text)" }}>{icons[fuel] || "⚡"} {fuel.charAt(0).toUpperCase() + fuel.slice(1)}</span>
            <span style={{ fontFamily: "var(--mono)", fontSize: 13, color: "var(--accent)", fontWeight: 600 }}>{perc.toFixed(1)}%</span>
          </div>
          <div style={{ height: 4, background: "var(--bar)", borderRadius: 99 }}>
            <div style={{ height: "100%", width: `${perc}%`, background: "var(--accent)", borderRadius: 99, transition: "width .6s" }} />
          </div>
        </div>
      ))}
    </div>
  );
}

function RoomRow({ room, onToggle, onPowerDown, onRestore }) {
  const pct    = room.timerActive ? ((TIMEOUT_SEC - room.timerSecs) / TIMEOUT_SEC) * 100 : 0;
  const vacant = !room.occupied && !room.poweredDown;
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 110px 210px 120px 110px 190px", alignItems: "center", padding: "16px 0", borderBottom: "1px solid var(--border)", opacity: room.poweredDown ? 0.5 : 1, transition: "opacity .3s" }}>
      <div>
        <div style={{ fontFamily: "var(--ui)", fontWeight: 600, fontSize: 14, color: "var(--text)" }}>{room.name}</div>
        <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 2 }}>{room.floor} · {room.area} sqft</div>
      </div>
      <div><Pill ok={room.occupied && !room.poweredDown} warn={vacant} off={room.poweredDown}>{room.poweredDown ? "Offline" : room.occupied ? "Occupied" : "Vacant"}</Pill></div>
      <div>
        {room.timerActive && !room.poweredDown ? (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
              <span style={{ fontSize: 10, color: "var(--warn-col)", fontFamily: "var(--mono)" }}>Auto-off in</span>
              <span style={{ fontSize: 10, color: "var(--warn-col)", fontFamily: "var(--mono)", fontWeight: 700 }}>{fmt(room.timerSecs)}</span>
            </div>
            <div style={{ height: 3, background: "var(--bar)", borderRadius: 99, overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${pct}%`, background: "var(--warn-col)", borderRadius: 99, transition: "width 1s linear" }} />
            </div>
          </div>
        ) : (
          <div style={{ display: "flex", gap: 10 }}>
            {APPLIANCES.map(a => (
              <span key={a} style={{ fontSize: 12, color: room.appliances[a] && !room.poweredDown ? "var(--on-col)" : "var(--muted)", opacity: room.appliances[a] && !room.poweredDown ? 1 : 0.35, fontFamily: "var(--ui)" }}>
                {a === "Lights" ? "💡" : a === "HVAC" ? "❄️" : "🌀"} {a}
              </span>
            ))}
          </div>
        )}
      </div>
      <div>
        <div style={{ fontFamily: "var(--display)", fontSize: 22, fontWeight: 700, color: "var(--accent)", lineHeight: 1 }}>{room.savedKwh}</div>
        <div style={{ fontSize: 10, color: "var(--muted)", marginTop: 2 }}>kWh today</div>
      </div>
      <div>
        <div style={{ fontFamily: "var(--display)", fontSize: 20, fontWeight: 700, color: "var(--text)" }}>🔥 {room.streak}d</div>
        <div style={{ fontSize: 10, color: "var(--muted)" }}>streak</div>
      </div>
      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
        {!room.poweredDown ? (
          <>
            <Btn ghost onClick={() => onToggle(room.id)}>{room.occupied ? "Mark vacant" : "Mark occupied"}</Btn>
            {vacant && <Btn accent onClick={() => onPowerDown(room.id)}>Power down</Btn>}
          </>
        ) : (
          <Btn outline onClick={() => onRestore(room.id)}>Restore</Btn>
        )}
      </div>
    </div>
  );
}

function Section({ title, sub, badge, badgeColor, children }) {
  return (
    <div style={{ marginBottom: 8 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
        <h2 style={{ fontFamily: "var(--display)", fontSize: 22, fontWeight: 700, color: "var(--text)", letterSpacing: "-.01em" }}>{title}</h2>
        {badge && (
          <span style={{ fontSize: 10, fontFamily: "var(--ui)", fontWeight: 600, padding: "2px 8px", borderRadius: 99, color: badgeColor, background: `color-mix(in srgb,${badgeColor} 15%,transparent)`, border: `1px solid color-mix(in srgb,${badgeColor} 30%,transparent)` }}>{badge}</span>
        )}
      </div>
      {sub && <p style={{ fontFamily: "var(--ui)", fontSize: 12, color: "var(--muted)", marginBottom: 20 }}>{sub}</p>}
      {children}
    </div>
  );
}

function Divider() { return <div style={{ height: 1, background: "var(--border)", margin: "32px 0" }} />; }

function Spinner() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, height: 60 }}>
      <div style={{ width: 18, height: 18, border: "2px solid var(--bar)", borderTopColor: "var(--accent)", borderRadius: "50%", animation: "spin 1s linear infinite" }} />
      <span style={{ fontFamily: "var(--ui)", fontSize: 13, color: "var(--muted)" }}>Fetching live data…</span>
    </div>
  );
}

// ─── APP ──────────────────────────────────────────────────────────────────────
export default function App() {
  const [dark, setDark]       = useState(false);
  const [rooms, setRooms]     = useState(() => ROOM_DEFS.map(initRoom));
  const [toasts, setToasts]   = useState([]);
  const [tab, setTab]         = useState("rooms");
  const [savedKwh, setSaved]  = useState(47.3);
  const [costSaved, setCost]  = useState(18.9);

  const [intensity, setIntensity] = useState(null);
  const [genMix, setGenMix]       = useState([]);
  const [forecast, setForecast]   = useState([]);
  const [apiLoading, setLoading]  = useState(true);
  const [apiError, setError]      = useState(false);

  const loadApi = useCallback(async () => {
    setLoading(true);
    try {
      const [int, mix, fc] = await Promise.all([fetchIntensity(), fetchGenerationMix(), fetchForecast()]);
      setIntensity(int);
      setGenMix(mix);
      setForecast(fc);
      setError(false);
    } catch { setError(true); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { loadApi(); const t = setInterval(loadApi, 5 * 60 * 1000); return () => clearInterval(t); }, [loadApi]);

  useEffect(() => {
    const t = setInterval(() => {
      setRooms(prev => prev.map(room => {
        if (room.poweredDown || room.occupied) return room;
        if (!room.timerActive) return { ...room, timerActive: true, timerSecs: TIMEOUT_SEC };
        if (room.timerSecs <= 1) {
          const s = +(Math.random() * 0.8 + 0.2).toFixed(2);
          push(`${room.name} auto-powered down.`, s);
          setSaved(k => +(k + s).toFixed(1));
          setCost(c => +(c + s * 0.38).toFixed(1));
          return { ...room, poweredDown: true, timerActive: false, timerSecs: 0, appliances: { Lights: false, HVAC: false, Fans: false }, savedKwh: +(room.savedKwh + s).toFixed(2) };
        }
        return { ...room, timerSecs: room.timerSecs - 1 };
      }));
    }, 1000);
    return () => clearInterval(t);
  }, []);

  const push = (message, saved) => setToasts(n => [...n, { id: Date.now(), message, saved }]);
  const dismiss = id => setToasts(n => n.filter(x => x.id !== id));

  const toggleOccupied = id => setRooms(p => p.map(r => r.id !== id ? r : { ...r, occupied: !r.occupied, timerActive: false, timerSecs: 0, appliances: { Lights: true, HVAC: true, Fans: true } }));
  const powerDown = id => setRooms(p => p.map(r => {
    if (r.id !== id) return r;
    const s = +(Math.random() * 0.8 + 0.2).toFixed(2);
    push(`${r.name} powered down.`, s);
    setSaved(k => +(k + s).toFixed(1));
    setCost(c => +(c + s * 0.38).toFixed(1));
    return { ...r, poweredDown: true, timerActive: false, timerSecs: 0, appliances: { Lights: false, HVAC: false, Fans: false }, savedKwh: +(r.savedKwh + s).toFixed(2) };
  }));
  const restore = id => setRooms(p => p.map(r => r.id !== id ? r : { ...r, poweredDown: false, occupied: true, appliances: { Lights: true, HVAC: true, Fans: true } }));

  const offCount = rooms.filter(r => r.poweredDown).length;
  const occCount = rooms.filter(r => r.occupied && !r.poweredDown).length;
  const vacCount = rooms.filter(r => !r.occupied && !r.poweredDown).length;
  const co2 = intensity?.actual ? +((savedKwh * intensity.actual) / 1000).toFixed(2) : +(savedKwh * 0.233).toFixed(2);

  const iColor = intensity ? (dark ? indexColorDark(intensity.index) : indexColor(intensity.index)) : "var(--muted)";

  // Forecast chart — every 3 slots (~1.5hr buckets), first 8
  const fcSlots  = forecast.filter((_, i) => i % 3 === 0).slice(0, 8);
  const fcVals   = fcSlots.map(d => d.intensity?.forecast ?? 0);
  const fcLabels = fcSlots.map(d => { const h = new Date(d.from).getHours(); return `${h}:00`; });
  const fallbackFc   = [220, 195, 180, 175, 190, 210, 230, 215];
  const fallbackLbls = ["9:00","10:30","12:00","13:30","15:00","16:30","18:00","19:30"];

  const weekLabels = ["Mon","Tue","Wed","Thu","Fri","Sat","Today"];
  const weekData   = [14.2, 16.8, 12.1, 19.4, 22.7, 18.3, savedKwh];

  // ── CSS variables ──────────────────────────────────────────────────────────
  const vars = dark ? {
    "--bg":       "#0f1110", "--surface": "#181c1a", "--border": "#252b27",
    "--text":     "#e6ede8", "--muted":   "#5a6860", "--accent": "#4dde78",
    "--shadow":   "rgba(0,0,0,.5)",  "--bar": "#252b27",
    "--on-bg":    "rgba(77,222,120,.12)", "--on-col":   "#4dde78",
    "--warn-bg":  "rgba(251,146,60,.12)", "--warn-col": "#fb923c",
    "--off-bg":   "rgba(255,255,255,.04)","--off-col":  "#5a6860",
    "--nav-blur": "rgba(15,17,16,.88)",
  } : {
    "--bg":       "#f4f1eb", "--surface": "#ffffff", "--border": "#e2ddd4",
    "--text":     "#1a1c19", "--muted":   "#8a8880", "--accent": "#2a7a40",
    "--shadow":   "rgba(0,0,0,.07)", "--bar": "#e2ddd4",
    "--on-bg":    "rgba(42,122,64,.1)",  "--on-col":   "#2a7a40",
    "--warn-bg":  "rgba(234,88,12,.1)",  "--warn-col": "#ea580c",
    "--off-bg":   "rgba(0,0,0,.04)",     "--off-col":  "#8a8880",
    "--nav-blur": "rgba(244,241,235,.9)",
  };

  return (
    <div style={{ ...vars, background: "var(--bg)", minHeight: "100vh", width: "100%", transition: "background .3s, color .3s" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,500;0,700;1,400;1,500&family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600&family=DM+Mono:wght@400;500&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        :root { --display: 'Lora', Georgia, serif; --ui: 'DM Sans', sans-serif; --mono: 'DM Mono', monospace; }
        html, body { width: 100%; }
        ::-webkit-scrollbar { width: 5px; }
        ::-webkit-scrollbar-thumb { background: var(--border); border-radius: 3px; }
        @keyframes dot { 0%,100%{opacity:1} 50%{opacity:.3} }
        @keyframes toastIn { from{transform:translateY(12px);opacity:0} to{transform:none;opacity:1} }
        @keyframes spin { to{transform:rotate(360deg)} }
      `}</style>

      {/* NAV */}
      <nav style={{ position: "sticky", top: 0, zIndex: 100, background: "var(--nav-blur)", backdropFilter: "blur(16px)", borderBottom: "1px solid var(--border)", width: "100%" }}>
        <div style={{ padding: "0 48px", height: 60, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
            <span style={{ fontFamily: "var(--display)", fontSize: 22, fontWeight: 700, color: "var(--text)" }}>EcoGrid</span>
            <span style={{ fontFamily: "var(--ui)", fontSize: 11, color: "var(--muted)", letterSpacing: ".06em" }}>Smart Energy</span>
          </div>
          <div style={{ display: "flex", gap: 3, background: "var(--border)", borderRadius: 10, padding: 3 }}>
            {["rooms", "analytics"].map(t => (
              <button key={t} onClick={() => setTab(t)} style={{ padding: "5px 20px", borderRadius: 7, border: "none", background: tab === t ? "var(--surface)" : "transparent", color: tab === t ? "var(--text)" : "var(--muted)", fontFamily: "var(--ui)", fontSize: 13, fontWeight: tab === t ? 600 : 400, cursor: "pointer", transition: "all .2s", boxShadow: tab === t ? "0 1px 4px var(--shadow)" : "none" }}>
                {t[0].toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
            {!apiLoading && !apiError && intensity && (
              <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: iColor, animation: "dot 2s ease infinite", display: "inline-block" }} />
                <span style={{ fontFamily: "var(--mono)", fontSize: 11, color: iColor, fontWeight: 500 }}>
                  {intensity.actual ?? intensity.forecast} gCO₂/kWh
                </span>
                <span style={{ fontSize: 10, color: iColor, fontFamily: "var(--ui)", fontWeight: 600, padding: "1px 7px", borderRadius: 99, background: `color-mix(in srgb,${iColor} 15%,transparent)` }}>
                  {intensity.index}
                </span>
              </div>
            )}
            {apiError && <span style={{ fontSize: 11, color: "var(--warn-col)", fontFamily: "var(--ui)" }}>⚠ Grid API offline</span>}
            <button onClick={() => setDark(d => !d)} style={{ width: 44, height: 26, borderRadius: 99, border: "none", background: dark ? "var(--accent)" : "var(--border)", cursor: "pointer", position: "relative", transition: "background .25s" }}>
              <div style={{ position: "absolute", top: 3, left: dark ? 21 : 3, width: 20, height: 20, borderRadius: "50%", background: dark ? "#111" : "#fff", transition: "left .25s", boxShadow: "0 1px 4px rgba(0,0,0,.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11 }}>
                {dark ? "🌙" : "☀️"}
              </div>
            </button>
          </div>
        </div>
      </nav>

      <main style={{ width: "100%", padding: "0 48px 80px" }}>

        {/* HERO STATS */}
        <div style={{ padding: "36px 0 28px", borderBottom: "1px solid var(--border)", marginBottom: 36 }}>
          <div style={{ marginBottom: 28 }}>
            <h1 style={{ fontFamily: "var(--display)", fontSize: 40, fontWeight: 700, color: "var(--text)", lineHeight: 1.1, letterSpacing: "-.025em" }}>
              {offCount > 0
                ? <>Saved <em style={{ fontStyle: "italic", color: "var(--accent)" }}>{savedKwh} kWh</em> today.</>
                : "Monitoring your spaces."}
            </h1>
            <p style={{ fontFamily: "var(--ui)", fontSize: 14, color: "var(--muted)", marginTop: 8 }}>
              {occCount} occupied · {vacCount} vacant · {offCount} powered down
              {intensity && <> · Grid: <span style={{ color: iColor, fontWeight: 600 }}>{intensity.index}</span></>}
            </p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)" }}>
            {[
              { label: "Energy saved today",  val: savedKwh,         unit: "kWh", sub: "↑ 18% vs last week",                                                   icon: "⚡" },
              { label: "CO₂ offset",          val: co2,              unit: "kg",  sub: intensity ? `Grid: ${intensity.actual ?? intensity.forecast} gCO₂/kWh` : "Estimated", icon: "🌿" },
              { label: "Cost recovered",      val: `$${costSaved}`,  unit: "",    sub: "At $0.38 / kWh",                                                        icon: "💰" },
              { label: "Rooms offline",       val: `${offCount}/${rooms.length}`, unit: "", sub: offCount > 0 ? "Shutdown active" : "All systems on",            icon: "🏢" },
              { label: "Grid status",
                val: apiLoading ? "…" : apiError ? "N/A" : (intensity?.index ?? "—"),
                unit: "",
                sub: apiLoading ? "Fetching…" : apiError ? "Using estimates" : `${intensity?.actual ?? intensity?.forecast} gCO₂/kWh`,
                icon: "🌐", valColor: apiError || apiLoading ? "var(--muted)" : iColor },
            ].map((s, i) => (
              <div key={i} style={{ padding: "24px 0", paddingRight: i < 4 ? 28 : 0, paddingLeft: i > 0 ? 28 : 0, borderRight: i < 4 ? "1px solid var(--border)" : "none" }}>
                <div style={{ fontSize: 24, marginBottom: 8 }}>{s.icon}</div>
                <div style={{ fontFamily: "var(--display)", fontSize: 32, fontWeight: 700, color: s.valColor || "var(--text)", lineHeight: 1 }}>
                  {s.val}{s.unit && <span style={{ fontSize: 16, fontWeight: 400, color: "var(--muted)", marginLeft: 4 }}>{s.unit}</span>}
                </div>
                <div style={{ fontFamily: "var(--ui)", fontSize: 12, color: "var(--muted)", marginTop: 6 }}>{s.label}</div>
                {s.sub && <div style={{ fontSize: 11, color: "var(--accent)", marginTop: 3, fontFamily: "var(--ui)" }}>{s.sub}</div>}
              </div>
            ))}
          </div>
        </div>

        {/* ROOMS */}
        {tab === "rooms" && (
          <>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 110px 210px 120px 110px 190px", padding: "0 0 10px", borderBottom: "1px solid var(--border)" }}>
              {["Room", "Status", "Appliances", "Saved", "Streak", ""].map((h, i) => (
                <div key={i} style={{ fontFamily: "var(--ui)", fontSize: 10, fontWeight: 600, color: "var(--muted)", letterSpacing: ".08em", textTransform: "uppercase", textAlign: i === 5 ? "right" : "left" }}>{h}</div>
              ))}
            </div>
            {rooms.map(r => <RoomRow key={r.id} room={r} onToggle={toggleOccupied} onPowerDown={powerDown} onRestore={restore} />)}
          </>
        )}

        {/* ANALYTICS */}
        {tab === "analytics" && (
          <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: 64 }}>
            <div>
              <Section title="Weekly savings" sub="kWh recovered by powering down empty rooms">
                <BarChart data={weekData} labels={weekLabels} />
              </Section>
              <Divider />
              <Section
                title="Grid carbon forecast"
                sub={apiError ? "API unavailable — showing estimates" : "Live 48-hr forecast · carbonintensity.org.uk · gCO₂/kWh"}
                badge={apiLoading ? "Loading" : apiError ? "Offline" : "Live"}
                badgeColor={apiError ? "var(--warn-col)" : "var(--on-col)"}
              >
                {apiLoading ? <Spinner /> : <BarChart data={fcVals.length ? fcVals : fallbackFc} labels={fcLabels.length ? fcLabels : fallbackLbls} />}
              </Section>
              <Divider />
              <Section title="Room savings breakdown" sub="Sorted by kWh recovered today">
                {[...rooms].sort((a, b) => b.savedKwh - a.savedKwh).map((r, i) => (
                  <div key={r.id} style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 14 }}>
                    <div style={{ width: 20, fontFamily: "var(--mono)", fontSize: 11, color: "var(--muted)", textAlign: "right" }}>{i + 1}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                        <span style={{ fontFamily: "var(--ui)", fontSize: 13, color: "var(--text)", fontWeight: 500 }}>{r.name}</span>
                        <span style={{ fontFamily: "var(--mono)", fontSize: 13, color: "var(--accent)", fontWeight: 600 }}>{r.savedKwh} kWh</span>
                      </div>
                      <div style={{ height: 4, background: "var(--bar)", borderRadius: 99 }}>
                        <div style={{ height: "100%", width: `${Math.min((r.savedKwh / 10) * 100, 100)}%`, background: r.poweredDown ? "var(--accent)" : "var(--muted)", borderRadius: 99, opacity: r.poweredDown ? 1 : .45, transition: "width .6s" }} />
                      </div>
                    </div>
                  </div>
                ))}
              </Section>
            </div>

            <div>
              <Section
                title="Live generation mix"
                sub={apiError ? "API unavailable" : "Real-time UK electricity sources"}
                badge={apiLoading ? "Loading" : apiError ? "Offline" : "Live"}
                badgeColor={apiError ? "var(--warn-col)" : "var(--on-col)"}
              >
                {apiLoading ? <Spinner /> : genMix.length ? <GenMix mix={genMix} /> : <p style={{ fontFamily: "var(--ui)", fontSize: 13, color: "var(--muted)" }}>Data unavailable.</p>}
              </Section>
              <Divider />
              <Section title="Streak leaderboard" sub="Rooms ranked by consecutive shutdown days">
                {[...rooms].sort((a, b) => b.streak - a.streak).map((r, i) => (
                  <div key={r.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 0", borderBottom: "1px solid var(--border)" }}>
                    <div style={{ fontFamily: "var(--display)", fontSize: 18, width: 28, textAlign: "center" }}>
                      {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : <span style={{ fontFamily: "var(--mono)", fontSize: 12, color: "var(--muted)" }}>{i + 1}</span>}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontFamily: "var(--ui)", fontSize: 13, fontWeight: 500, color: "var(--text)" }}>{r.name}</div>
                      <div style={{ fontSize: 11, color: "var(--muted)" }}>{r.floor}</div>
                    </div>
                    <div style={{ fontFamily: "var(--display)", fontSize: 17, fontWeight: 700, color: "var(--text)" }}>🔥 {r.streak}d</div>
                  </div>
                ))}
              </Section>
              <Divider />
              <Section title="Environmental impact" sub="What your savings translate to">
                {[
                  { icon: "🌳", label: "Trees equivalent / year", value: `${(co2 / 21).toFixed(1)}` },
                  { icon: "🚗", label: "Car miles avoided",       value: `${(co2 * 2.5).toFixed(0)}` },
                  { icon: "💡", label: "Bulb-hours recovered",    value: `${(savedKwh * 100).toFixed(0)}` },
                  { icon: "📅", label: "Monthly projection",      value: `${(savedKwh * 30).toFixed(0)} kWh` },
                ].map(item => (
                  <div key={item.label} style={{ display: "flex", alignItems: "center", gap: 14, padding: "13px 0", borderBottom: "1px solid var(--border)" }}>
                    <span style={{ fontSize: 20 }}>{item.icon}</span>
                    <div style={{ flex: 1, fontFamily: "var(--ui)", fontSize: 13, color: "var(--muted)" }}>{item.label}</div>
                    <div style={{ fontFamily: "var(--display)", fontSize: 19, fontWeight: 700, color: "var(--text)" }}>{item.value}</div>
                  </div>
                ))}
              </Section>
            </div>
          </div>
        )}
      </main>

      {toasts.slice(-1).map(n => <Toast key={n.id} n={n} onDismiss={() => dismiss(n.id)} />)}
    </div>
  );
}
