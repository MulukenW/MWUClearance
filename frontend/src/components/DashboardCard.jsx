export default function DashboardCard({
  title,
  value,
  subtitle,
  icon,
  gradient = "from-blue-500 to-blue-600",
  trend,
}) {
  return (
    <div className="relative overflow-hidden bg-white rounded-2xl shadow-sm border border-gray-100 p-5 group hover:shadow-md transition-all duration-300">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
            {title}
          </p>
          <p className="text-3xl font-extrabold text-gray-800 mt-2">{value}</p>
          {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
          {trend && (
            <p
              className={`text-xs font-medium mt-1 ${trend >= 0 ? "text-emerald-600" : "text-red-500"}`}
            >
              {trend >= 0 ? "+" : ""}
              {trend}% from last week
            </p>
          )}
        </div>
        <div
          className={`w-12 h-12 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center text-white text-lg shadow-lg shadow-${gradient.split("-")[1]}-200/50`}
        >
          {icon}
        </div>
      </div>
      <div
        className={`absolute -bottom-4 -right-4 w-24 h-24 rounded-full bg-gradient-to-br ${gradient} opacity-5 group-hover:opacity-10 transition-opacity`}
      />
    </div>
  );
}
