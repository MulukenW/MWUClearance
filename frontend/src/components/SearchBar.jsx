import { useState, useEffect } from "react";

export default function SearchBar({
  value,
  onChange,
  placeholder = "Search...",
  delay = 300,
}) {
  const [localValue, setLocalValue] = useState(value || "");

  useEffect(() => {
    const timer = setTimeout(() => onChange(localValue), delay);
    return () => clearTimeout(timer);
  }, [localValue, delay]); // eslint-disable-line

  return (
    <div className="relative">
      <svg
        className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
        />
      </svg>
      <input
        type="text"
        value={localValue}
        onChange={(e) => setLocalValue(e.target.value)}
        placeholder={placeholder}
        className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-mwu-blue/20 focus:border-mwu-blue outline-none text-sm bg-gray-50 focus:bg-white transition-all"
      />
    </div>
  );
}
