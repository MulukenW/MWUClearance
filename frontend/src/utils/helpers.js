// ─── Ethiopian (Ethiopic) calendar ─────────────────────────────────────────
// The Ethiopian year starts on Meskerem 1 ≈ September 11 (or 12 before a
// Gregorian leap year). These helpers let the UI show EC years alongside or
// instead of Gregorian ones. Backend stores years in EC.
const EC_NEW_YEAR_MONTH = 8; // September (0-indexed)
const EC_NEW_YEAR_DEFAULT_DAY = 11;

/** Ethiopian year for a JS Date (or current date when omitted). */
export function ethiopianYear(date = new Date()) {
  const gcYear = date.getFullYear();
  const beforeNewYear =
    date.getMonth() < EC_NEW_YEAR_MONTH ||
    (date.getMonth() === EC_NEW_YEAR_MONTH &&
      date.getDate() < EC_NEW_YEAR_DEFAULT_DAY);
  return beforeNewYear ? gcYear - 8 : gcYear - 7;
}

/** Current Ethiopian year as a string, e.g. "2019". */
export function currentEthiopianYear() {
  return String(ethiopianYear());
}

/** Current Ethiopian academic year string, e.g. "2019/20". */
export function currentEthiopianAcademicYear() {
  const y = ethiopianYear();
  return `${y}/${String((y + 1) % 100).padStart(2, "0")}`;
}

/** Format a Gregorian date string as an Ethiopian-calendar date label. */
export function formatEthiopianDate(dateString) {
  if (!dateString) return "—";
  const d = new Date(dateString);
  if (Number.isNaN(d.getTime())) return "—";
  const months = [
    "Meskerem", "Tikimt", "Hidar", "Tahsas", "Tir", "Yekatit",
    "Megabit", "Miazia", "Ginbot", "Sene", "Hamle", "Nehase", "Pagume",
  ];
  const ecYear = ethiopianYear(d);
  // Day-of-year offset from the EC new year (Sep 11 / 12 in GC leap-precursors).
  const newYear = new Date(d.getFullYear(), EC_NEW_YEAR_MONTH, EC_NEW_YEAR_DEFAULT_DAY);
  if (d < newYear) newYear.setFullYear(newYear.getFullYear() - 1);
  const dayDiff = Math.floor((d - newYear) / 86400000);
  const monthIdx = Math.floor(dayDiff / 30);
  const day = (dayDiff % 30) + 1;
  const label =
    monthIdx < 12
      ? `${months[monthIdx]} ${day}`
      : `Pagume ${day}`;
  return `${label}, ${ecYear} EC`;
}

export function formatDate(dateString) {
  if (!dateString) return "—";
  const d = new Date(dateString);
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function formatDateTime(dateString) {
  if (!dateString) return "—";
  const d = new Date(dateString);
  return d.toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function getStatusColor(status) {
  const colors = {
    approved: "bg-green-100 text-green-800",
    pending: "bg-amber-100 text-amber-800",
    locked: "bg-gray-100 text-gray-600",
    rejected: "bg-red-100 text-red-800",
    under_review: "bg-blue-100 text-blue-800",
    not_required: "bg-gray-100 text-gray-400",
    completed: "bg-green-100 text-green-800",
    in_progress: "bg-blue-100 text-blue-800",
    submitted: "bg-blue-100 text-blue-800",
  };
  return colors[status] || "bg-gray-100 text-gray-600";
}

export function getInitials(name) {
  if (!name) return "?";
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function truncate(str, maxLen = 50) {
  if (!str) return "";
  return str.length > maxLen ? str.slice(0, maxLen) + "..." : str;
}

export function isOfficerRole(roleCode) {
  const officerRoles = [
    "advisor",
    "department_head",
    "laboratory",
    "library",
    "dormitory",
    "police",
    "registrar",
    "cafeteria",
    "student_service",
    "cost_sharing",
    "continuing_education",
  ];
  return officerRoles.includes(roleCode);
}

export function getDashboardPath(roleCode) {
  if (roleCode === "student") return "/student/dashboard";
  if (roleCode === "admin") return "/admin/dashboard";
  if (isOfficerRole(roleCode)) return "/officer/dashboard";
  return "/login";
}
