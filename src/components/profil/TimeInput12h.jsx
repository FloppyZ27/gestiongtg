import React, { useState, useEffect } from "react";

/**
 * Champ d'heure en format 12h (HH:MM AM/PM) intégré dans un seul input visuel.
 * value / onChange utilisent le format "HH:MM" en 24h (compatible avec le reste du code).
 */
export default function TimeInput12h({ value, onChange, required, className = "" }) {
  // Convertit "HH:MM" (24h) → { hour12, minute, ampm }
  const parse24h = (val) => {
    if (!val) return { hour12: "", minute: "", ampm: "AM" };
    const [hStr, mStr] = val.split(":");
    let h = parseInt(hStr, 10);
    const m = mStr || "00";
    const ampm = h < 12 ? "AM" : "PM";
    h = h % 12 || 12;
    return { hour12: String(h), minute: m, ampm };
  };

  const { hour12: initH, minute: initM, ampm: initA } = parse24h(value);
  const [hour12, setHour12] = useState(initH);
  const [minute, setMinute] = useState(initM);
  const [ampm, setAmpm] = useState(initA);

  // Sync depuis l'extérieur si value change
  useEffect(() => {
    const { hour12: h, minute: m, ampm: a } = parse24h(value);
    setHour12(h);
    setMinute(m);
    setAmpm(a);
  }, [value]);

  // Convertit les 3 champs → "HH:MM" 24h et appelle onChange
  const emit = (h, m, a) => {
    if (!h || !m) { onChange(""); return; }
    let h24 = parseInt(h, 10) % 12;
    if (a === "PM") h24 += 12;
    onChange(`${String(h24).padStart(2, "0")}:${m.padStart(2, "0")}`);
  };

  const handleHourChange = (e) => {
    let v = e.target.value.replace(/\D/g, "");
    if (v.length > 2) v = v.slice(-2);
    const n = parseInt(v, 10);
    if (v !== "" && (n < 1 || n > 12)) return;
    setHour12(v);
    emit(v, minute, ampm);
  };

  const handleMinuteChange = (e) => {
    let v = e.target.value.replace(/\D/g, "");
    if (v.length > 2) v = v.slice(-2);
    const n = parseInt(v, 10);
    if (v !== "" && (n < 0 || n > 59)) return;
    setMinute(v);
    emit(hour12, v, ampm);
  };

  const toggleAmpm = () => {
    const next = ampm === "AM" ? "PM" : "AM";
    setAmpm(next);
    emit(hour12, minute, next);
  };

  return (
    <div className={`flex items-center bg-slate-800 border border-slate-700 rounded-md overflow-hidden h-9 ${className}`}>
      <input
        type="text"
        inputMode="numeric"
        placeholder="hh"
        value={hour12}
        onChange={handleHourChange}
        required={required}
        maxLength={2}
        className="w-10 bg-transparent text-white text-center text-sm focus:outline-none focus:bg-slate-700/50 py-1 border-none shadow-none"
      />
      <span className="text-slate-400 text-sm select-none">:</span>
      <input
        type="text"
        inputMode="numeric"
        placeholder="mm"
        value={minute}
        onChange={handleMinuteChange}
        required={required}
        maxLength={2}
        className="w-10 bg-transparent text-white text-center text-sm focus:outline-none focus:bg-slate-700/50 py-1 border-none shadow-none"
      />
      <button
        type="button"
        onClick={toggleAmpm}
        className="ml-1 px-2 py-1 text-xs font-bold text-slate-300 hover:text-white hover:bg-slate-700/50 rounded transition-colors border-none shadow-none bg-transparent"
      >
        {ampm}
      </button>
    </div>
  );
}