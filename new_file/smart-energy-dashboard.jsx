import { useState, useEffect, useRef } from "react";

const ROOMS = [
  { id: 1, name: "Conference Room A", floor: "3F", capacity: 20, area: 450 },
  { id: 2, name: "Open Office B", floor: "2F", capacity: 40, area: 1200 },
  { id: 3, name: "Lab 101", floor: "1F", capacity: 15, area: 600 },
  { id: 4, name: "Meeting Pod C", floor: "3F", capacity: 6, area: 120 },
  { id: 5, name: "Classroom D", floor: "4F", capacity: 30, area: 800 },
  { id: 6, name: "Lounge E", floor: "2F", capacity: 25, area: 350 },
];

const APPLIANCES = ["Lights", "HVAC", "Fans"];

function initRoom(room) {
  return {
    ...room,
    occupied: Math.random() > 0.4,
    timerSeconds: 0,
    timerActive: false,
    poweredDown: false,
    appliances: { Lights: true, HVAC: true, Fans: true },
    energySaved: +(Math.random() * 8 + 1).toFixed(2),
    lastActivity: Date.now() - Math.floor(Math.random() * 300000),
    streak: Math.floor(Math.random() * 14),
    weekSavings: Array.from({ length: 7 }, () => +(Math.random() * 12 + 2).toFixed(1)),
  };
}

const TIMEOUT_SECONDS = 15; // demo-friendly

function formatTime(s) {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return m > 0 ? `${m}m ${sec}s` : `${sec}s`;
}

function timeAgo(ts) {
  const diff = Math.floor((Date.now() - ts) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  return `${Math.floor(diff / 3600)}h ago`;
}

function MiniBarChart({ data }) {
  const max = Math.max(...data);
  const days = ["M", "T", "W", "T", "F", "S", "S"];
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: "3px", height: "40px" }}>
      {data.map((v, i) => (
        <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "2px", flex: 1 }}>
          <div
            style={{
              width: "100%",
              height: `${(v / max) * 34}px`,
              background: i === 6 ? "#00ff88" : "#1a4a2e",
              borderRadius: "2px 2px 0 0",
              transition: "height 0.5s ease",
            }}
          />
          <span style={{ fontSize: "8px", color: "#4a6a5a", fontFamily: "monospace" }}>{days[i]}</span>
        </div>
      ))}
    </div>
  );
}

function Notification({ notif, onDismiss }) {
  useEffect(() => {
    const t = setTimeout(onDismiss, 4500);
    return () => clearTimeout(t);
  }, []);
  return (
    <div
      style={{
        position: "fixed",
        bottom: "24px",
        right: "24px",
        background: "#0a1a10",
        border: "1px solid #00ff88",
        borderRadius: "8px",
        padding: "14px 18px",
        maxWidth: "320px",
        zIndex: 999,
        animation: "slideIn 0.3s ease",
        boxShadow: "0 0 30px rgba(0,255,136,0.15)",
      }}
    >
      <div style={{ display: "flex", gap: "10px", alignItems: "flex-start" }}>
        <span style={{ fontSize: "18px" }}>🔔</span>
        <div>
          <div style={{ color: "#00ff88", fontFamily: "monospace", fontSize: "11px", letterSpacing: "0.1em", marginBottom: "4px" }}>SYSTEM ALERT</div>
          <div style={{ color: "#c8e6c9", fontSize: "13px", lineHeight: 1.4 }}>{notif.message}</div>
          <div style={{ color: "#4a6a5a", fontSize: "11px", marginTop: "4px", fontFamily: "monospace" }}>{notif.saved} kWh saved</div>
        </div>
        <button onClick={onDismiss} style={{ background: "none", border: "none", color: "#4a6a5a", cursor: "pointer", fontSize: "16px", padding: 0, marginLeft: "auto" }}>×</button>
      </div>
    </div>
  );
}

function RoomCard({ room, onToggleOccupied, onPowerDown, onRestoreRoom }) {
  const urgency = !room.occupied && !room.poweredDown && room.timerActive;
  const progress = room.timerActive ? ((TIMEOUT_SECONDS - room.timerSeconds) / TIMEOUT_SECONDS) * 100 : 0;

  return (
    <div
      style={{
        background: room.poweredDown ? "#050d08" : "#0a1a10",
        border: `1px solid ${room.poweredDown ? "#1a2a1a" : urgency ? "#ff6b35" : room.occupied ? "#00ff88" : "#1a3a2a"}`,
        borderRadius: "10px",
        padding: "18px",
        transition: "all 0.4s ease",
        position: "relative",
        overflow: "hidden",
        opacity: room.poweredDown ? 0.7 : 1,
      }}
    >
      {urgency && (
        <div style={{
          position: "absolute", top: 0, left: 0, right: 0, height: "2px",
          background: `linear-gradient(90deg, transparent, #ff6b35 ${progress}%, transparent)`,
          animation: "pulse 1s ease infinite",
        }} />
      )}
      {room.poweredDown && (
        <div style={{
          position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
          background: "repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(0,255,136,0.01) 10px, rgba(0,255,136,0.01) 11px)",
          pointerEvents: "none",
        }} />
      )}

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
        <div>
          <div style={{ color: room.poweredDown ? "#2a4a3a" : "#c8e6c9", fontSize: "14px", fontWeight: 600, fontFamily: "'Space Mono', monospace" }}>{room.name}</div>
          <div style={{ color: "#4a6a5a", fontSize: "11px", marginTop: "2px", fontFamily: "monospace" }}>{room.floor} · {room.area} sqft</div>
        </div>
        <div style={{
          padding: "3px 10px",
          borderRadius: "20px",
          fontSize: "10px",
          fontFamily: "monospace",
          letterSpacing: "0.1em",
          background: room.poweredDown ? "#0a1a0a" : room.occupied ? "rgba(0,255,136,0.1)" : "rgba(255,107,53,0.1)",
          color: room.poweredDown ? "#2a4a2a" : room.occupied ? "#00ff88" : "#ff6b35",
          border: `1px solid ${room.poweredDown ? "#1a2a1a" : room.occupied ? "#00ff8840" : "#ff6b3540"}`,
        }}>
          {room.poweredDown ? "OFFLINE" : room.occupied ? "OCCUPIED" : "VACANT"}
        </div>
      </div>

      {urgency && (
        <div style={{ marginBottom: "12px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
            <span style={{ color: "#ff6b35", fontSize: "11px", fontFamily: "monospace" }}>AUTO SHUTDOWN IN</span>
            <span style={{ color: "#ff6b35", fontSize: "11px", fontFamily: "monospace", fontWeight: 700 }}>{formatTime(room.timerSeconds)}</span>
          </div>
          <div style={{ height: "3px", background: "#1a1a1a", borderRadius: "2px", overflow: "hidden" }}>
            <div style={{
              height: "100%",
              width: `${progress}%`,
              background: "linear-gradient(90deg, #ff6b35, #ff9500)",
              borderRadius: "2px",
              transition: "width 1s linear",
            }} />
          </div>
        </div>
      )}

      <div style={{ display: "flex", gap: "6px", marginBottom: "14px", flexWrap: "wrap" }}>
        {APPLIANCES.map((a) => (
          <div key={a} style={{
            padding: "2px 8px",
            borderRadius: "4px",
            fontSize: "10px",
            fontFamily: "monospace",
            background: room.appliances[a] && !room.poweredDown ? "rgba(0,255,136,0.08)" : "rgba(255,255,255,0.02)",
            color: room.appliances[a] && !room.poweredDown ? "#00cc66" : "#2a4a3a",
            border: `1px solid ${room.appliances[a] && !room.poweredDown ? "#00ff8820" : "#1a2a1a"}`,
          }}>
            {a === "Lights" ? "💡" : a === "HVAC" ? "❄️" : "🌀"} {a}
          </div>
        ))}
      </div>

      <div style={{ display: "flex", gap: "6px", marginBottom: "12px" }}>
        {!room.poweredDown ? (
          <>
            <button
              onClick={() => onToggleOccupied(room.id)}
              style={{
                flex: 1,
                padding: "7px",
                borderRadius: "6px",
                border: "1px solid #1a3a2a",
                background: "transparent",
                color: "#4a8a6a",
                fontSize: "11px",
                fontFamily: "monospace",
                cursor: "pointer",
                transition: "all 0.2s",
              }}
              onMouseEnter={e => e.target.style.borderColor = "#00ff88"}
              onMouseLeave={e => e.target.style.borderColor = "#1a3a2a"}
            >
              {room.occupied ? "MARK VACANT" : "MARK OCCUPIED"}
            </button>
            {!room.occupied && (
              <button
                onClick={() => onPowerDown(room.id)}
                style={{
                  flex: 1,
                  padding: "7px",
                  borderRadius: "6px",
                  border: "1px solid #3a2010",
                  background: "rgba(255,107,53,0.08)",
                  color: "#ff6b35",
                  fontSize: "11px",
                  fontFamily: "monospace",
                  cursor: "pointer",
                  fontWeight: 700,
                  transition: "all 0.2s",
                }}
                onMouseEnter={e => { e.target.style.background = "rgba(255,107,53,0.18)"; }}
                onMouseLeave={e => { e.target.style.background = "rgba(255,107,53,0.08)"; }}
              >
                POWER DOWN ⚡
              </button>
            )}
          </>
        ) : (
          <button
            onClick={() => onRestoreRoom(room.id)}
            style={{
              flex: 1,
              padding: "7px",
              borderRadius: "6px",
              border: "1px solid #1a3a2a",
              background: "rgba(0,255,136,0.06)",
              color: "#00ff88",
              fontSize: "11px",
              fontFamily: "monospace",
              cursor: "pointer",
              fontWeight: 700,
            }}
          >
            RESTORE POWER
          </button>
        )}
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", paddingTop: "10px", borderTop: "1px solid #0f2a1a" }}>
        <div>
          <div style={{ color: "#00ff88", fontSize: "15px", fontFamily: "monospace", fontWeight: 700 }}>{room.energySaved} kWh</div>
          <div style={{ color: "#2a5a3a", fontSize: "10px", fontFamily: "monospace" }}>SAVED TODAY</div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ color: "#4a8a6a", fontSize: "13px", fontFamily: "monospace" }}>🔥 {room.streak}d</div>
          <div style={{ color: "#2a5a3a", fontSize: "10px", fontFamily: "monospace" }}>STREAK</div>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [rooms, setRooms] = useState(() => ROOMS.map(initRoom));
  const [notifications, setNotifications] = useState([]);
  const [activeTab, setActiveTab] = useState("rooms");
  const [totalSaved, setTotalSaved] = useState(47.3);
  const [co2Saved, setCo2Saved] = useState(21.4);
  const [costSaved, setCostSaved] = useState(18.9);
  const intervalRef = useRef(null);

  const pushNotif = (message, saved) => {
    setNotifications(n => [...n, { id: Date.now(), message, saved }]);
  };

  // Tick timers
  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setRooms(prev => prev.map(room => {
        if (room.poweredDown || room.occupied) return room;
        if (!room.timerActive) {
          return { ...room, timerActive: true, timerSeconds: TIMEOUT_SECONDS };
        }
        if (room.timerSeconds <= 1) {
          // Auto power down
          const saved = +(room.energySaved + Math.random() * 0.5).toFixed(2);
          pushNotif(`${room.name} auto-powered down. All appliances off.`, `+${(Math.random() * 0.8 + 0.2).toFixed(2)}`);
          setTotalSaved(t => +(t + 0.4).toFixed(1));
          setCo2Saved(t => +(t + 0.18).toFixed(1));
          setCostSaved(t => +(t + 0.16).toFixed(1));
          return { ...room, poweredDown: true, timerActive: false, timerSeconds: 0, appliances: { Lights: false, HVAC: false, Fans: false }, energySaved: saved };
        }
        return { ...room, timerSeconds: room.timerSeconds - 1 };
      }));
    }, 1000);
    return () => clearInterval(intervalRef.current);
  }, []);

  const handleToggleOccupied = (id) => {
    setRooms(prev => prev.map(r => r.id === id ? {
      ...r,
      occupied: !r.occupied,
      timerActive: false,
      timerSeconds: 0,
      lastActivity: Date.now(),
      appliances: { Lights: true, HVAC: true, Fans: true },
    } : r));
  };

  const handlePowerDown = (id) => {
    setRooms(prev => prev.map(r => {
      if (r.id !== id) return r;
      const saved = +(Math.random() * 0.8 + 0.2).toFixed(2);
      pushNotif(`${r.name} manually powered down. Lights, HVAC & Fans off.`, `+${saved}`);
      setTotalSaved(t => +(t + saved).toFixed(1));
      setCo2Saved(t => +(t + saved * 0.45).toFixed(1));
      setCostSaved(t => +(t + saved * 0.4).toFixed(1));
      return { ...r, poweredDown: true, timerActive: false, timerSeconds: 0, appliances: { Lights: false, HVAC: false, Fans: false } };
    }));
  };

  const handleRestoreRoom = (id) => {
    setRooms(prev => prev.map(r => r.id !== id ? r : {
      ...r, poweredDown: false, occupied: true, appliances: { Lights: true, HVAC: true, Fans: true }, lastActivity: Date.now(),
    }));
  };

  const dismissNotif = (id) => setNotifications(n => n.filter(x => x.id !== id));

  const poweredDownCount = rooms.filter(r => r.poweredDown).length;
  const occupiedCount = rooms.filter(r => r.occupied && !r.poweredDown).length;
  const vacantCount = rooms.filter(r => !r.occupied && !r.poweredDown).length;

  const weekData = [14.2, 16.8, 12.1, 19.4, 22.7, 18.3, totalSaved];
  const maxWeek = Math.max(...weekData);

  return (
    <div style={{
      minHeight: "100vh",
      background: "#030c06",
      color: "#c8e6c9",
      fontFamily: "'Space Mono', monospace",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=Syne:wght@400;600;700;800&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: #030c06; }
        ::-webkit-scrollbar-thumb { background: #1a3a2a; border-radius: 2px; }
        @keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:0.4; } }
        @keyframes slideIn { from { transform: translateX(100%); opacity:0; } to { transform: translateX(0); opacity:1; } }
        @keyframes blink { 0%,100% { opacity:1; } 50% { opacity:0.2; } }
      `}</style>

      {/* Header */}
      <div style={{
        borderBottom: "1px solid #0f2a1a",
        padding: "0 28px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        height: "60px",
        position: "sticky",
        top: 0,
        background: "#030c06",
        zIndex: 100,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
          <div style={{
            width: "32px", height: "32px", borderRadius: "8px",
            background: "linear-gradient(135deg, #00ff88, #00cc66)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "16px",
          }}>⚡</div>
          <div>
            <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: "16px", color: "#00ff88", letterSpacing: "-0.02em" }}>EcoGrid</div>
            <div style={{ fontSize: "9px", color: "#2a5a3a", letterSpacing: "0.15em" }}>SMART ENERGY CONTROL</div>
          </div>
        </div>

        <div style={{ display: "flex", gap: "6px" }}>
          {["rooms", "analytics"].map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)} style={{
              padding: "6px 16px",
              borderRadius: "6px",
              border: `1px solid ${activeTab === tab ? "#00ff8840" : "#0f2a1a"}`,
              background: activeTab === tab ? "rgba(0,255,136,0.08)" : "transparent",
              color: activeTab === tab ? "#00ff88" : "#2a5a3a",
              fontSize: "11px",
              fontFamily: "monospace",
              cursor: "pointer",
              letterSpacing: "0.08em",
              textTransform: "uppercase",
            }}>
              {tab}
            </button>
          ))}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#00ff88", animation: "blink 2s ease infinite" }} />
          <span style={{ fontSize: "10px", color: "#2a5a3a", letterSpacing: "0.1em" }}>LIVE · {new Date().toLocaleTimeString()}</span>
        </div>
      </div>

      <div style={{ padding: "24px 28px", maxWidth: "1200px", margin: "0 auto" }}>

        {/* Stats bar */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px", marginBottom: "24px" }}>
          {[
            { label: "ENERGY SAVED", value: `${totalSaved} kWh`, sub: "Today", color: "#00ff88", icon: "⚡" },
            { label: "CO₂ REDUCED", value: `${co2Saved} kg`, sub: "Equivalent", color: "#00cc66", icon: "🌿" },
            { label: "COST SAVED", value: `$${costSaved}`, sub: "Estimated", color: "#4aff88", icon: "💰" },
            { label: "ROOMS OFFLINE", value: `${poweredDownCount}/${rooms.length}`, sub: `${occupiedCount} occupied · ${vacantCount} vacant`, color: "#ff6b35", icon: "🏢" },
          ].map((s) => (
            <div key={s.label} style={{
              background: "#0a1a10",
              border: "1px solid #0f2a1a",
              borderRadius: "10px",
              padding: "16px",
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <div style={{ color: "#2a5a3a", fontSize: "9px", letterSpacing: "0.15em", marginBottom: "6px" }}>{s.label}</div>
                  <div style={{ color: s.color, fontSize: "22px", fontFamily: "'Syne', sans-serif", fontWeight: 700 }}>{s.value}</div>
                  <div style={{ color: "#2a5a3a", fontSize: "10px", marginTop: "2px" }}>{s.sub}</div>
                </div>
                <span style={{ fontSize: "22px" }}>{s.icon}</span>
              </div>
            </div>
          ))}
        </div>

        {activeTab === "rooms" && (
          <>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: "14px", color: "#4a8a6a", letterSpacing: "0.08em" }}>
                ROOM CONTROL CENTER
              </div>
              <div style={{ display: "flex", gap: "10px", fontSize: "10px", color: "#2a5a3a" }}>
                <span>⬤ OCCUPIED</span>
                <span style={{ color: "#ff6b35" }}>⬤ VACANT</span>
                <span style={{ color: "#1a3a2a" }}>⬤ OFFLINE</span>
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "14px" }}>
              {rooms.map(room => (
                <RoomCard
                  key={room.id}
                  room={room}
                  onToggleOccupied={handleToggleOccupied}
                  onPowerDown={handlePowerDown}
                  onRestoreRoom={handleRestoreRoom}
                />
              ))}
            </div>
          </>
        )}

        {activeTab === "analytics" && (
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "16px" }}>
            {/* Week chart */}
            <div style={{ background: "#0a1a10", border: "1px solid #0f2a1a", borderRadius: "10px", padding: "20px" }}>
              <div style={{ color: "#2a5a3a", fontSize: "10px", letterSpacing: "0.15em", marginBottom: "16px" }}>7-DAY ENERGY SAVINGS (kWh)</div>
              <div style={{ display: "flex", alignItems: "flex-end", gap: "8px", height: "120px" }}>
                {weekData.map((v, i) => {
                  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Today"];
                  return (
                    <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: "4px", height: "100%" }}>
                      <div style={{ flex: 1, display: "flex", alignItems: "flex-end", width: "100%" }}>
                        <div style={{
                          width: "100%",
                          height: `${(v / maxWeek) * 100}%`,
                          background: i === 6 ? "linear-gradient(180deg, #00ff88, #00aa55)" : "#1a3a2a",
                          borderRadius: "3px 3px 0 0",
                          position: "relative",
                        }}>
                          <div style={{ position: "absolute", top: "-18px", left: "50%", transform: "translateX(-50%)", fontSize: "9px", color: i === 6 ? "#00ff88" : "#2a5a3a", whiteSpace: "nowrap" }}>
                            {v}
                          </div>
                        </div>
                      </div>
                      <div style={{ fontSize: "9px", color: i === 6 ? "#00ff88" : "#2a5a3a" }}>{days[i]}</div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Room breakdown */}
            <div style={{ background: "#0a1a10", border: "1px solid #0f2a1a", borderRadius: "10px", padding: "20px" }}>
              <div style={{ color: "#2a5a3a", fontSize: "10px", letterSpacing: "0.15em", marginBottom: "16px" }}>SAVINGS BY ROOM</div>
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {[...rooms].sort((a, b) => b.energySaved - a.energySaved).map(room => (
                  <div key={room.id}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                      <span style={{ fontSize: "11px", color: "#4a8a6a" }}>{room.name}</span>
                      <span style={{ fontSize: "11px", color: "#00ff88", fontWeight: 700 }}>{room.energySaved} kWh</span>
                    </div>
                    <div style={{ height: "4px", background: "#0f2a1a", borderRadius: "2px" }}>
                      <div style={{
                        height: "100%",
                        width: `${(room.energySaved / 10) * 100}%`,
                        background: room.poweredDown ? "#00ff88" : "#1a4a2a",
                        borderRadius: "2px",
                        maxWidth: "100%",
                      }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Streak leaderboard */}
            <div style={{ background: "#0a1a10", border: "1px solid #0f2a1a", borderRadius: "10px", padding: "20px" }}>
              <div style={{ color: "#2a5a3a", fontSize: "10px", letterSpacing: "0.15em", marginBottom: "16px" }}>EFFICIENCY LEADERBOARD 🏆</div>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {[...rooms].sort((a, b) => b.streak - a.streak).map((room, i) => (
                  <div key={room.id} style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <span style={{ color: i < 3 ? ["#ffd700", "#c0c0c0", "#cd7f32"][i] : "#2a5a3a", fontSize: "12px", width: "16px" }}>
                      {i < 3 ? ["🥇", "🥈", "🥉"][i] : `${i + 1}.`}
                    </span>
                    <span style={{ flex: 1, fontSize: "11px", color: "#4a8a6a" }}>{room.name}</span>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ color: "#00ff88", fontSize: "12px", fontWeight: 700 }}>🔥 {room.streak}d</div>
                    </div>
                    <MiniBarChart data={room.weekSavings} />
                  </div>
                ))}
              </div>
            </div>

            {/* Impact card */}
            <div style={{ background: "#0a1a10", border: "1px solid #0f2a1a", borderRadius: "10px", padding: "20px" }}>
              <div style={{ color: "#2a5a3a", fontSize: "10px", letterSpacing: "0.15em", marginBottom: "16px" }}>ENVIRONMENTAL IMPACT</div>
              {[
                { icon: "🌳", label: "Trees equivalent", value: `${(co2Saved / 21).toFixed(1)} trees/yr` },
                { icon: "🚗", label: "Car miles avoided", value: `${(co2Saved * 2.5).toFixed(0)} miles` },
                { icon: "💡", label: "Bulb-hours saved", value: `${(totalSaved * 100).toFixed(0)} hrs` },
                { icon: "🌍", label: "Monthly projection", value: `${(totalSaved * 30).toFixed(0)} kWh` },
              ].map(item => (
                <div key={item.label} style={{
                  display: "flex", alignItems: "center", gap: "10px",
                  padding: "10px 0", borderBottom: "1px solid #0f2a1a",
                }}>
                  <span style={{ fontSize: "20px" }}>{item.icon}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ color: "#2a5a3a", fontSize: "10px" }}>{item.label}</div>
                  </div>
                  <div style={{ color: "#00ff88", fontSize: "13px", fontWeight: 700 }}>{item.value}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Notifications */}
      {notifications.slice(-1).map(n => (
        <Notification key={n.id} notif={n} onDismiss={() => dismissNotif(n.id)} />
      ))}
    </div>
  );
}
