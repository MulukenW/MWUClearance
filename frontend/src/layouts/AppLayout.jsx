import { useState, useEffect, useRef } from "react";
import { Outlet, NavLink, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { API_BASE_URL, notificationApi } from "../services/api";
import { getInitials, formatDateTime } from "../utils/helpers";
import { OFFICER_ROLES } from "../constants";
import useSingleTabSession from "../hooks/useSingleTabSession";
import useSessionTimer from "../hooks/useSessionTimer";
import SessionModals from "../components/SessionModals";

/* ─── SVG Icon Components ─────────────────────────────────────────────── */
const Icon = ({ d, className = "w-5 h-5" }) => (
  <svg
    className={className}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.5}
      d={d}
    />
  </svg>
);

const icons = {
  dashboard:
    "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6",
  users:
    "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z",
  students: "M12 14l9-5-9-5-9 5 9 5z",
  college:
    "M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4",
  department:
    "M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z",
  program:
    "M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253",
  studentType:
    "M7 7h.01M7 14h.01M14 7h.01M14 14h.01M21 7h.01M21 14h.01M7 21h.01M14 21h.01M21 21h.01M3 3h18v18H3V3z",
  office:
    "M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4",
  workflow:
    "M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z",
  reports:
    "M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z",
  audit:
    "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z",
  settings:
    "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z",
  clearance:
    "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4",
  clock: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z",
  certificate:
    "M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z",
};

/* ─── Sidebar Link ──────────────────────────────────────────────────── */
function SidebarLink({ to, icon, label, collapsed, onClick }) {
  return (
    <NavLink
      to={to}
      onClick={onClick}
      className={({ isActive }) =>
        `flex items-center gap-3 px-4 py-2.5 mx-2 rounded-lg text-[13px] font-medium transition-all duration-200 ${
          isActive
            ? "bg-white/15 text-white shadow-sm"
            : "text-white/60 hover:bg-white/8 hover:text-white/90"
        }`
      }
    >
      <span className="flex-shrink-0">{icon}</span>
      {!collapsed && <span>{label}</span>}
    </NavLink>
  );
}

/* ─── Section Label ─────────────────────────────────────────────────── */
function SectionLabel({ children, collapsed }) {
  if (collapsed) return <div className="my-2 mx-4 border-t border-white/10" />;
  return (
    <p className="px-6 pt-5 pb-1.5 text-[10px] font-bold uppercase tracking-widest text-white/30">
      {children}
    </p>
  );
}

/* ─── Sidebar ───────────────────────────────────────────────────────── */
function Sidebar({ mobileOpen, onClose }) {
  const { user, roleCode } = useAuth();

  const studentLinks = [
    {
      to: "/student/dashboard",
      label: "Dashboard",
      icon: <Icon d={icons.dashboard} />,
    },
    {
      to: "/student/clearance/new",
      label: "New Clearance",
      icon: <Icon d={icons.clearance} />,
    },
    {
      to: "/student/certificates",
      label: "My Certificates",
      icon: <Icon d={icons.certificate} />,
    },
  ];

  const officerLinks = [
    {
      to: "/officer/dashboard",
      label: "Dashboard",
      icon: <Icon d={icons.dashboard} />,
    },
    {
      to: "/officer/pending",
      label: "Pending Clearances",
      icon: <Icon d={icons.clock} />,
    },
    {
      to: "/officer/history",
      label: "History",
      icon: <Icon d={icons.audit} />,
    },
  ];

  const adminLinks = {
    main: [
      {
        to: "/admin/dashboard",
        label: "Dashboard",
        icon: <Icon d={icons.dashboard} />,
      },
    ],
    people: [
      { to: "/admin/users", label: "Users", icon: <Icon d={icons.users} /> },
      {
        to: "/admin/students",
        label: "Students",
        icon: <Icon d={icons.students} />,
      },
    ],
    academic: [
      {
        to: "/admin/colleges",
        label: "Colleges",
        icon: <Icon d={icons.college} />,
      },
      {
        to: "/admin/departments",
        label: "Departments",
        icon: <Icon d={icons.department} />,
      },
      {
        to: "/admin/programs",
        label: "Programs",
        icon: <Icon d={icons.program} />,
      },
      {
        to: "/admin/student-types",
        label: "Student Types",
        icon: <Icon d={icons.studentType} />,
      },
    ],
    clearance: [
      {
        to: "/admin/clearance-offices",
        label: "Offices",
        icon: <Icon d={icons.office} />,
      },
      {
        to: "/admin/workflows",
        label: "Workflows",
        icon: <Icon d={icons.workflow} />,
      },
    ],
    system: [
      {
        to: "/admin/reports",
        label: "Reports",
        icon: <Icon d={icons.reports} />,
      },
      {
        to: "/admin/audit-logs",
        label: "Audit Logs",
        icon: <Icon d={icons.audit} />,
      },
      {
        to: "/admin/settings",
        label: "Settings",
        icon: <Icon d={icons.settings} />,
      },
    ],
  };

  let links = [];
  if (roleCode === "student") links = studentLinks;
  else if (roleCode === "admin") links = adminLinks;
  else if (OFFICER_ROLES.includes(roleCode)) links = officerLinks;

  const renderAdminSidebar = () => (
    <>
      <SectionLabel>Main</SectionLabel>
      {links.main.map((l) => (
        <SidebarLink key={l.to} {...l} onClick={onClose} />
      ))}

      <SectionLabel>People</SectionLabel>
      {links.people.map((l) => (
        <SidebarLink key={l.to} {...l} onClick={onClose} />
      ))}

      <SectionLabel>Academic</SectionLabel>
      {links.academic.map((l) => (
        <SidebarLink key={l.to} {...l} onClick={onClose} />
      ))}

      <SectionLabel>Clearance</SectionLabel>
      {links.clearance.map((l) => (
        <SidebarLink key={l.to} {...l} onClick={onClose} />
      ))}

      <SectionLabel>System</SectionLabel>
      {links.system.map((l) => (
        <SidebarLink key={l.to} {...l} onClick={onClose} />
      ))}
    </>
  );

  const renderSimpleSidebar = () => (
    <div className="py-2">
      {Array.isArray(links) &&
        links.map((l) => <SidebarLink key={l.to} {...l} />)}
    </div>
  );

  return (
    <>
      {mobileOpen && (
        <button
          type="button"
          aria-label="Close navigation"
          onClick={onClose}
          className="fixed inset-0 bg-gray-950/40 z-20 md:hidden"
        />
      )}
      <aside
        className={`w-64 min-h-screen flex flex-col fixed left-0 top-0 shadow-xl z-30 transform transition-transform duration-200 md:translate-x-0 ${mobileOpen ? "translate-x-0" : "-translate-x-full"}`}
        style={{ backgroundColor: "#042791" }}
      >
        {/* Logo */}
        <div className="px-5 py-5 border-b border-white/8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white p-1 flex items-center justify-center shadow-md">
              <img
                src={`${API_BASE_URL}/logo`}
                alt="MWU"
                className="w-8 h-8 object-contain"
                onError={(e) => {
                  if (!e.target.src.endsWith("/mwu-logo.png")) {
                    e.target.src = "/mwu-logo.png";
                  }
                }}
              />
            </div>
            <div>
              <h1 className="text-white text-sm font-bold leading-tight">
                MWU Clearance
              </h1>
              <p className="text-white/40 text-[10px] mt-0.5">
                Madda Walabu University
              </p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-2 overflow-y-auto scrollbar-thin">
          {roleCode === "admin" ? renderAdminSidebar() : renderSimpleSidebar()}
        </nav>

        {/* User */}
        <div className="px-4 py-3 border-t border-white/8">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-white/15 flex items-center justify-center text-white text-xs font-bold">
              {getInitials(user?.name)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-xs font-semibold truncate">
                {user?.name}
              </p>
              <p className="text-white/40 text-[10px]">{user?.role?.name}</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}

/* ─── Navbar ────────────────────────────────────────────────────────── */
function Navbar({ onMenu }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [unread, setUnread] = useState(0);
  const [showNotifs, setShowNotifs] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const panelRef = useRef(null);

  // Derive page title from path
  const pathSegments = location.pathname.split("/").filter(Boolean);
  const pageTitle =
    pathSegments.length > 1
      ? pathSegments.slice(1).join(" / ").replace(/-/g, " ")
      : "Dashboard";

  useEffect(() => {
    const fetchUnread = () => {
      notificationApi
        .unreadCount()
        .then((res) => setUnread(res.data.data?.unread_count || 0))
        .catch(() => {});
    };
    fetchUnread();
    const interval = setInterval(fetchUnread, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    function handleClickOutside(e) {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        setShowNotifs(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const openNotifications = async () => {
    if (!showNotifs) {
      try {
        const res = await notificationApi.list();
        setNotifications(res.data.data?.data || res.data.data || []);
      } catch {
        /* ignore */
      }
    }
    setShowNotifs(!showNotifs);
  };

  const markRead = async (id) => {
    try {
      await notificationApi.markRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)),
      );
      setUnread((prev) => Math.max(0, prev - 1));
    } catch {
      /* ignore */
    }
  };

  const markAllRead = async () => {
    try {
      await notificationApi.markAllRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnread(0);
    } catch {
      /* ignore */
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <header className="h-16 bg-white/80 backdrop-blur-lg border-b border-gray-200/60 flex items-center justify-between gap-3 px-4 sm:px-6 fixed top-0 right-0 left-0 md:left-64 z-10">
      {/* Breadcrumb / Page Title */}
      <div className="flex items-center gap-2 min-w-0">
        <button
          type="button"
          aria-label="Open navigation"
          onClick={onMenu}
          className="p-2 -ml-2 text-gray-500 hover:bg-gray-100 rounded-lg md:hidden"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.8}
              d="M4 6h16M4 12h16M4 18h16"
            />
          </svg>
        </button>
        <span className="text-xs text-gray-400 capitalize">
          {pathSegments[0]}
        </span>
        {pathSegments.length > 1 && (
          <>
            <svg
              className="w-3 h-3 text-gray-300"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
            <span className="text-sm font-medium text-gray-700 capitalize truncate">
              {pageTitle}
            </span>
          </>
        )}
      </div>

      <div className="flex items-center gap-1 sm:gap-3 shrink-0">
        {/* Notifications */}
        <div className="relative" ref={panelRef}>
          <button
            onClick={openNotifications}
            className="relative p-2.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-all"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
              />
            </svg>
            {unread > 0 && (
              <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[10px] font-bold rounded-full h-4.5 w-4.5 flex items-center justify-center shadow-sm animate-pulse">
                {unread > 9 ? "9+" : unread}
              </span>
            )}
          </button>

          {showNotifs && (
            <div className="fixed top-[4.5rem] right-2 sm:absolute sm:top-auto sm:right-0 sm:mt-2 w-[calc(100vw-1rem)] max-w-80 bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 max-h-[calc(100vh-5rem)] overflow-y-auto overflow-x-hidden">
              <div className="p-3 sm:p-4 border-b border-gray-100 flex flex-wrap gap-2 justify-between items-center sticky top-0 bg-white rounded-t-2xl">
                <h3 className="font-bold text-sm text-gray-800">
                  Notifications
                </h3>
                {unread > 0 && (
                  <button
                    onClick={markAllRead}
                    className="text-xs font-medium text-mwu-blue hover:text-mwu-blue-dark whitespace-nowrap"
                  >
                    Mark all read
                  </button>
                )}
              </div>
              {notifications.length === 0 ? (
                <div className="p-8 text-center">
                  <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-gray-100 flex items-center justify-center text-gray-400">
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                      />
                    </svg>
                  </div>
                  <p className="text-sm text-gray-400">No notifications</p>
                </div>
              ) : (
                notifications.slice(0, 10).map((n) => (
                  <div
                    key={n.id}
                    onClick={() => !n.is_read && markRead(n.id)}
                    className={`p-4 border-b border-gray-50 last:border-b-0 cursor-pointer hover:bg-gray-50 transition-colors ${!n.is_read ? "bg-mwu-blue/5" : ""}`}
                  >
                    <p className="text-sm font-medium text-gray-800 break-words">
                      {n.title}
                    </p>
                    <p className="text-xs text-gray-500 mt-1 break-words [overflow-wrap:anywhere] line-clamp-3">
                      {n.message}
                    </p>
                    <p className="text-[10px] text-gray-400 mt-1.5">
                      {formatDateTime(n.created_at)}
                    </p>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Divider */}
        <div className="w-px h-8 bg-gray-200" />

        {/* User */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-mwu-blue to-blue-600 text-white flex items-center justify-center text-xs font-bold shadow-sm">
            {getInitials(user?.name)}
          </div>
          <div className="hidden sm:block">
            <p className="text-sm font-semibold text-gray-800 leading-tight">
              {user?.name}
            </p>
            <p className="text-[10px] text-gray-400">{user?.role?.name}</p>
          </div>
          <button
            onClick={handleLogout}
            className="ml-1 p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
            title="Logout"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
              />
            </svg>
          </button>
        </div>
      </div>
    </header>
  );
}

/* ─── Main Layout ───────────────────────────────────────────────────── */
export default function AppLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, isAuthenticated, logout } = useAuth();

  // Single-user multi-tab restriction
  const { isDisplaced, claimSession } = useSingleTabSession(
    isAuthenticated,
    user,
  );

  // Inactivity session: after 15 idle minutes show the "Session Expired"
  // modal FIRST (blocks the UI and explains why), and only log out when the
  // user clicks through — previously onExpire logged out instantly, which
  // unmounted this layout before the modal could render (silent kick-out).
  // A 60s countdown warning modal appears beforehand (SessionModals).
  const { isExpired, isWarning, remainingSeconds, extendSession } =
    useSessionTimer({
      isAuthenticated,
      timeoutMs: 15 * 60 * 1000, // 15 minutes idle
      warningMs: 60 * 1000, // 60s countdown warning
    });

  return (
    <div className="min-h-screen bg-gray-50">
      <SessionModals
        isExpired={isExpired}
        isWarning={isWarning}
        remainingSeconds={remainingSeconds}
        extendSession={extendSession}
        isDisplaced={isDisplaced}
        claimSession={claimSession}
        onLogout={logout}
      />
      <Sidebar mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />
      <Navbar onMenu={() => setMobileOpen(true)} />
      <main className="ml-0 md:ml-64 p-4 pt-16 sm:p-6 sm:pt-16 min-w-0 overflow-x-hidden">
        <Outlet />
      </main>
    </div>
  );
}
