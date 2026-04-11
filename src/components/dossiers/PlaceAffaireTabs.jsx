export default function PlaceAffaireTabs({ value, onChange, counts }) {
  const tabs = [
    { value: "tous", label: "Tous", count: counts.tous },
    { value: "Alma", label: "Alma", count: counts.alma },
    { value: "Saguenay", label: "Saguenay", count: counts.saguenay },
  ];

  return (
    <div className="flex items-center gap-2 mb-2">
      <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Place d'affaire :</span>
      <div className="flex gap-1">
      {tabs.map(tab => (
        <button
          key={tab.value}
          onClick={() => onChange(tab.value)}
          className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all border-0 ${
            value === tab.value
              ? "bg-emerald-500/20 text-emerald-400 border-b-2 border-emerald-400"
              : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
          }`}
        >
          {tab.label}
          <span className={`ml-1.5 text-xs px-1.5 py-0.5 rounded-full ${
            value === tab.value ? "bg-emerald-500/30 text-emerald-300" : "bg-slate-700 text-slate-400"
          }`}>{tab.count}</span>
        </button>
      ))}
      </div>
    </div>
  );
}