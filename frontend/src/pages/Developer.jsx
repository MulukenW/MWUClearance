import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useBrandInfo } from "../utils/branding";

export default function Developer() {
  const { user } = useAuth();
  const { system_name, university_name } = useBrandInfo();
  const [activeTab, setActiveTab] = useState("team"); // "team" | "tech" | "features"

  const teamMembers = [
    {
      name: "Muluken Woldesenbet",
      role: "Full-Stack Software Engineer & System Architect",
      badge: "Lead Developer",
      badgeColor: "bg-blue-600 text-white",
      avatarColor: "from-blue-600 to-indigo-700",
      initials: "MW",
      email: "muluken.woldesenbet@mwu.edu.et",
      github: "https://github.com/MulukenW",
      responsibility:
        "End-to-end system architecture, database modeling, RESTful API framework, RBAC authorization gateways, React SPA foundations, and cryptographic QR clearance workflow pipelines.",
      tags: ["System Architecture", "React 18", "Laravel 8", "MySQL", "RBAC & Security"],
    },
    {
      name: "Tadele Shimerlis",
      role: "Full-Stack Software Engineer",
      badge: "Full-Stack Engineer",
      badgeColor: "bg-emerald-600 text-white",
      avatarColor: "from-emerald-600 to-teal-700",
      initials: "TS",
      email: "tadele.shimerlis@mwu.edu.et",
      github: null,
      responsibility:
        "Full-stack feature engineering, responsive component design, client-side routing, API integration endpoints, form validations, and user experience enhancements.",
      tags: ["Full-Stack", "React SPA", "REST APIs", "Tailwind CSS", "UI/UX"],
    },
    {
      name: "Mebratu Fana",
      role: "Backend Developer",
      badge: "Backend Developer",
      badgeColor: "bg-amber-600 text-white",
      avatarColor: "from-amber-600 to-orange-700",
      initials: "MF",
      email: "mebratu.fana@mwu.edu.et",
      github: null,
      responsibility:
        "Backend service logic, database queries, migration routines, clearance office approval validation rules, and server-side data operations.",
      tags: ["Backend Services", "PHP & Laravel", "MySQL Queries", "Database Design", "Business Logic"],
    },
  ];

  const techStack = [
    {
      category: "Frontend",
      title: "React 18 + Vite 6",
      desc: "Fast single-page application with modular layout, modern React hooks, and instantaneous client routing.",
      icon: (
        <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      ),
      items: ["Tailwind CSS 4", "React Router v6", "Axios Interceptors", "WebAuthn Biometrics"],
    },
    {
      category: "Backend",
      title: "Laravel 8 (PHP 7.4+)",
      desc: "Secure RESTful API providing token-based authentication, role-based gates, and audit trail logging.",
      icon: (
        <svg className="w-5 h-5 text-rose-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
        </svg>
      ),
      items: ["Sanctum Auth", "Ethiopian Calendar", "Seeders & Migrations", "Rate Limiting"],
    },
    {
      category: "Database",
      title: "MySQL 8 Relational DBMS",
      desc: "Normalized database schema with referential integrity, indexes, and full historical audit logs.",
      icon: (
        <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
        </svg>
      ),
      items: ["Foreign Keys", "Workflow Mapping", "Audit Trails", "Dynamic Settings"],
    },
    {
      category: "Security",
      title: "Institutional Protection",
      desc: "Multi-tab single-user session restriction, idle auto-lockouts, and tamper-proof verification.",
      icon: (
        <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      ),
      items: ["Single-Tab Guardian", "15-Min Auto-Lock", "SHA-256 QR Validation", "Role Middleware"],
    },
  ];

  const systemFeatures = [
    {
      title: "Student Self-Service Portal",
      desc: "One-click clearance requests, automatic student-type workflow binding, real-time approval status across all offices, and printable digital certificates.",
      icon: "🎓",
    },
    {
      title: "11 Specialized Clearance Offices",
      desc: "Dedicated queues for Department Heads, Library, Dormitory, Cafeteria, Laboratory, Registrar, Police, Cost-Sharing, and Student Services.",
      icon: "🏢",
    },
    {
      title: "Cryptographic QR Verification",
      desc: "Public-facing portal that lets employers or institutions scan the certificate QR code and instantly confirm the student's clearance authenticity.",
      icon: "🔒",
    },
    {
      title: "Central Administrative Control",
      desc: "Full administrative suite for managing colleges, departments, programs, student types, workflows, audit logs, reports, and custom branding.",
      icon: "⚙️",
    },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-12">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-mwu-blue via-blue-900 to-slate-900 text-white shadow-xl p-8 sm:p-12">
        <div className="relative z-10 max-w-2xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-xs font-semibold text-blue-200 border border-white/15">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Clearance Management System
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight leading-tight">
            Meet the Development Team
          </h1>
          <p className="text-blue-100/90 text-sm sm:text-base leading-relaxed">
            The engineering team behind the design, architecture, and deployment of <strong className="text-white">{system_name}</strong> for {university_name}.
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-3">
            {user ? (
              <span className="inline-flex items-center gap-2 text-xs bg-white/10 px-3 py-1.5 rounded-xl border border-white/15 text-white/90">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                Signed in as <strong className="text-white">{user.name}</strong>
              </span>
            ) : (
              <Link
                to="/login"
                className="inline-flex items-center gap-2 bg-white text-mwu-blue px-4 py-2 rounded-xl text-xs font-bold hover:bg-blue-50 transition-colors shadow-sm"
              >
                Sign In to Portal
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </Link>
            )}
          </div>
        </div>

        {/* Ambient decorative circle */}
        <div className="absolute -right-24 -bottom-24 w-96 h-96 rounded-full bg-blue-500/15 blur-3xl pointer-events-none" />
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-gray-200 pb-3">
        <button
          onClick={() => setActiveTab("team")}
          className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
            activeTab === "team"
              ? "bg-mwu-blue text-white shadow-sm"
              : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
          }`}
        >
          Team Members
        </button>
        <button
          onClick={() => setActiveTab("tech")}
          className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
            activeTab === "tech"
              ? "bg-mwu-blue text-white shadow-sm"
              : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
          }`}
        >
          Tech Stack & Architecture
        </button>
        <button
          onClick={() => setActiveTab("features")}
          className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
            activeTab === "features"
              ? "bg-mwu-blue text-white shadow-sm"
              : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
          }`}
        >
          System Features
        </button>
      </div>

      {/* TAB 1: Team Members */}
      {activeTab === "team" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {teamMembers.map((member, idx) => (
              <div
                key={idx}
                className="bg-white rounded-3xl p-6 sm:p-7 shadow-sm border border-gray-100 hover:border-gray-200 hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  {/* Avatar & Header */}
                  <div className="flex items-center gap-4 mb-4">
                    <div
                      className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${member.avatarColor} text-white flex items-center justify-center text-lg font-extrabold shadow-md flex-shrink-0`}
                    >
                      {member.initials}
                    </div>
                    <div className="min-w-0 flex-1">
                      <span
                        className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full mb-1 ${member.badgeColor}`}
                      >
                        {member.badge}
                      </span>
                      <h3 className="text-base sm:text-lg font-bold text-gray-900 leading-tight">
                        {member.name}
                      </h3>
                    </div>
                  </div>

                  {/* Role Title */}
                  <div className="mb-4">
                    <p className="text-xs font-semibold text-gray-700 bg-gray-50 border border-gray-100 px-3 py-1.5 rounded-xl">
                      {member.role}
                    </p>
                  </div>

                  {/* Responsibility Description */}
                  <p className="text-xs text-gray-600 leading-relaxed mb-5">
                    {member.responsibility}
                  </p>
                </div>

                <div>
                  {/* Skill Badges */}
                  <div className="pt-4 border-t border-gray-100 mb-4">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-2">
                      Core Areas
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {member.tags.map((t, i) => (
                        <span
                          key={i}
                          className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-gray-50 text-gray-700 border border-gray-200"
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Actions / Links */}
                  <div className="flex items-center gap-2 pt-2">
                    {member.github && (
                      <a
                        href={member.github}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl bg-gray-900 text-white hover:bg-gray-800 transition-colors"
                      >
                        <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                          <path
                            fillRule="evenodd"
                            clipRule="evenodd"
                            d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                          />
                        </svg>
                        GitHub
                      </a>
                    )}
                    <a
                      href={`mailto:${member.email}`}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
                    >
                      <svg className="w-3.5 h-3.5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      Email
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Quick Metrics Bar */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
            <div>
              <p className="text-2xl font-extrabold text-gray-900">3</p>
              <p className="text-xs text-gray-500 mt-0.5">Software Engineers</p>
            </div>
            <div>
              <p className="text-2xl font-extrabold text-gray-900">13</p>
              <p className="text-xs text-gray-500 mt-0.5">Supported Roles</p>
            </div>
            <div>
              <p className="text-2xl font-extrabold text-gray-900">11</p>
              <p className="text-xs text-gray-500 mt-0.5">Clearance Offices</p>
            </div>
            <div>
              <p className="text-2xl font-extrabold text-gray-900">100%</p>
              <p className="text-xs text-gray-500 mt-0.5">Digital Clearance</p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Tech Stack & Architecture */}
      {activeTab === "tech" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {techStack.map((tech, idx) => (
            <div
              key={idx}
              className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 hover:border-gray-200 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center">
                    {tech.icon}
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block">
                      {tech.category}
                    </span>
                    <h3 className="text-base font-bold text-gray-900">{tech.title}</h3>
                  </div>
                </div>

                <p className="text-xs text-gray-600 leading-relaxed mb-4">
                  {tech.desc}
                </p>
              </div>

              <div className="pt-3 border-t border-gray-100 flex flex-wrap gap-1.5">
                {tech.items.map((item, i) => (
                  <span
                    key={i}
                    className="px-2.5 py-1 rounded-md text-[11px] font-medium bg-gray-50 text-gray-700 border border-gray-200"
                  >
                    {item}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB 3: System Features */}
      {activeTab === "features" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {systemFeatures.map((f, idx) => (
            <div
              key={idx}
              className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 hover:border-gray-200 transition-all flex gap-4 items-start"
            >
              <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-xl flex-shrink-0">
                {f.icon}
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-gray-900">{f.title}</h3>
                <p className="text-xs text-gray-500 leading-relaxed">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Footer */}
      <div className="text-center pt-4 border-t border-gray-200 text-xs text-gray-400 space-y-1">
        <p>
          &copy; {new Date().getFullYear()} {university_name} &bull; {system_name}
        </p>
        <p>
          Engineered by <strong className="text-gray-700">Muluken Woldesenbet</strong>,{" "}
          <strong className="text-gray-700">Tadele Shimerlis</strong>, and{" "}
          <strong className="text-gray-700">Mebratu Fana</strong>.
        </p>
      </div>
    </div>
  );
}
