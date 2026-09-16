export default function ProgressBar({ percentage = 0, label }) {
  const pct = Math.min(100, Math.max(0, percentage));
  return (
    <div>
      {label && <div className="flex justify-between text-sm mb-1"><span className="text-gray-600">{label}</span><span className="font-medium">{pct}%</span></div>}
      <div className="w-full bg-gray-200 rounded-full h-3">
        <div className="bg-mwu-blue h-3 rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
