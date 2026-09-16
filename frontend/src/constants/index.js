export const STATUS_CONFIG = {
  approved: {
    label: "Approved",
    color: "bg-green-100 text-green-800",
    dot: "bg-green-500",
    icon: "✓",
  },
  pending: {
    label: "Pending",
    color: "bg-amber-100 text-amber-800",
    dot: "bg-amber-500",
    icon: "⏳",
  },
  locked: {
    label: "Locked",
    color: "bg-gray-100 text-gray-600",
    dot: "bg-gray-400",
    icon: "🔒",
  },
  rejected: {
    label: "Rejected",
    color: "bg-red-100 text-red-800",
    dot: "bg-red-500",
    icon: "✗",
  },
  under_review: {
    label: "Under Review",
    color: "bg-blue-100 text-blue-800",
    dot: "bg-blue-500",
    icon: "🔍",
  },
  not_required: {
    label: "Not Required",
    color: "bg-gray-100 text-gray-400",
    dot: "bg-gray-300",
    icon: "—",
  },
  completed: {
    label: "Completed",
    color: "bg-green-100 text-green-800",
    dot: "bg-green-500",
    icon: "✓",
  },
  in_progress: {
    label: "In Progress",
    color: "bg-blue-100 text-blue-800",
    dot: "bg-blue-500",
    icon: "⟳",
  },
  submitted: {
    label: "Submitted",
    color: "bg-blue-100 text-blue-800",
    dot: "bg-blue-500",
    icon: "→",
  },
};

export const ROLE_DASHBOARDS = {
  student: "/student/dashboard",
  advisor: "/officer/dashboard",
  department_head: "/officer/dashboard",
  laboratory: "/officer/dashboard",
  library: "/officer/dashboard",
  dormitory: "/officer/dashboard",
  police: "/officer/dashboard",
  registrar: "/officer/dashboard",
  cafeteria: "/officer/dashboard",
  student_service: "/officer/dashboard",
  cost_sharing: "/officer/dashboard",
  continuing_education: "/officer/dashboard",
  admin: "/admin/dashboard",
};

export const OFFICER_ROLES = [
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

export const CLEARANCE_STATUS_OPTIONS = [
  { value: "", label: "All Statuses" },
  { value: "approved", label: "Approved" },
  { value: "pending", label: "Pending" },
  { value: "rejected", label: "Rejected" },
  { value: "in_progress", label: "In Progress" },
  { value: "completed", label: "Completed" },
];
