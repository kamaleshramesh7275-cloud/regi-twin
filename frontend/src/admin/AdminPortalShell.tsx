import React, { useState } from "react";
import { Link, useLocation } from "wouter";
import {
  LayoutDashboard,
  Users,
  FileText,
  UserCog,
  Activity,
  Settings,
  LogOut,
  ChevronRight,
  ArrowLeftRight,
  Shield,
  Stethoscope,
  AlertCircle,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { ClientDetailContext, type ClientDetailCtx } from "./ClientDetailContext";
import AdminOverview from "./AdminOverview";
import AdminClientDetail from "./AdminClientDetail";
import AdminUserManagement from "./AdminUserManagement";
import AdminClinicReports from "./AdminClinicReports";
import AdminSystemHealth from "./AdminSystemHealth";
import AdminSettings from "./AdminSettings";

// ── Types ──────────────────────────────────────────────────────────────────────

type AdminPage =
  | "overview"
  | "users"
  | "clinic-reports"
  | "system-health"
  | "settings";

interface NavItem {
  id: AdminPage;
  label: string;
  icon: React.ReactNode;
  roles: Array<"clinician" | "superadmin">;
  href: string;
}

const NAV_ITEMS: NavItem[] = [
  {
    id: "overview",
    label: "Overview",
    icon: <LayoutDashboard className="w-4 h-4" />,
    roles: ["clinician", "superadmin"],
    href: "/admin",
  },
  {
    id: "clinic-reports",
    label: "Clinic Reports",
    icon: <FileText className="w-4 h-4" />,
    roles: ["clinician", "superadmin"],
    href: "/admin/clinic-reports",
  },
  {
    id: "users",
    label: "User & Roles",
    icon: <UserCog className="w-4 h-4" />,
    roles: ["superadmin"],
    href: "/admin/users",
  },
  {
    id: "system-health",
    label: "System Health",
    icon: <Activity className="w-4 h-4" />,
    roles: ["superadmin"],
    href: "/admin/system-health",
  },
  {
    id: "settings",
    label: "Admin Settings",
    icon: <Settings className="w-4 h-4" />,
    roles: ["superadmin"],
    href: "/admin/settings",
  },
];



// ── Sidebar ─────────────────────────────────────────────────────────────────────

function AdminSidebar({
  activePage,
  collapsed,
  onToggle,
}: {
  activePage: string;
  collapsed: boolean;
  onToggle: () => void;
}) {
  const { role, logout } = useAuth();
  const [, setLocation] = useLocation();

  const visibleItems = NAV_ITEMS.filter((item) =>
    item.roles.includes(role as "clinician" | "superadmin")
  );

  const handleLogout = async () => {
    await logout();
    setLocation("/login");
  };

  return (
    <aside
      className={`fixed top-0 left-0 h-full z-40 flex flex-col transition-all duration-300 ease-in-out
        bg-[#050e18] border-r border-teal-900/40
        ${collapsed ? "w-16" : "w-64"}
      `}
    >
      {/* Logo / Header */}
      <div className="flex items-center gap-2.5 px-4 py-5 border-b border-teal-900/30">
        <div className="w-8 h-8 rounded-lg bg-teal-600 flex items-center justify-center shrink-0 shadow-md shadow-teal-900/50">
          <Stethoscope className="w-4 h-4 text-white" />
        </div>
        {!collapsed && (
          <div className="flex flex-col min-w-0">
            <span className="font-black text-sm tracking-tight text-white leading-tight">
              PhysioTwin
            </span>
            <span className="text-[10px] font-bold text-teal-400 uppercase tracking-[0.15em] leading-tight">
              Admin Portal
            </span>
          </div>
        )}
        <button
          onClick={onToggle}
          className="ml-auto w-6 h-6 rounded-md hover:bg-white/10 flex items-center justify-center transition-colors shrink-0"
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <ChevronRight
            className={`w-3.5 h-3.5 text-white/40 transition-transform duration-200 ${
              collapsed ? "" : "rotate-180"
            }`}
          />
        </button>
      </div>

      {/* Role badge */}
      {!collapsed && (
        <div className="px-4 py-2.5">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-teal-950/60 border border-teal-800/40">
            <Shield className="w-3.5 h-3.5 text-teal-400 shrink-0" />
            <span className="text-[11px] font-bold text-teal-300 capitalize">
              {role}
            </span>
          </div>
        </div>
      )}

      {/* Nav */}
      <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto">
        {visibleItems.map((item) => {
          const isActive =
            activePage === item.id ||
            (item.id === "overview" && activePage === "");
          return (
            <Link
              key={item.id}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-sm font-medium group
                ${
                  isActive
                    ? "bg-teal-600/20 text-teal-300 border border-teal-600/30 shadow-sm"
                    : "text-white/50 hover:text-white hover:bg-white/5"
                }`}
            >
              <span className={`shrink-0 ${isActive ? "text-teal-400" : ""}`}>
                {item.icon}
              </span>
              {!collapsed && (
                <span className="truncate">{item.label}</span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Bottom actions */}
      <div className="px-2 py-3 border-t border-teal-900/30 space-y-1">
        {/* View as My Account */}
        <Link
          href="/dashboard"
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-cyan-400 hover:bg-cyan-500/10 hover:text-cyan-300 transition-all group"
          title="Switch to User Portal"
        >
          <ArrowLeftRight className="w-4 h-4 shrink-0" />
          {!collapsed && (
            <span className="truncate">View as My Account</span>
          )}
        </Link>

        {/* Sign Out */}
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-white/40 hover:text-red-300 hover:bg-red-500/10 transition-all cursor-pointer"
          title="Sign out"
        >
          <LogOut className="w-4 h-4 shrink-0" />
          {!collapsed && <span>Sign Out</span>}
        </button>
      </div>
    </aside>
  );
}

// ── Top Header ─────────────────────────────────────────────────────────────────

function AdminHeader({
  activePage,
  sidebarCollapsed,
}: {
  activePage: string;
  sidebarCollapsed: boolean;
}) {
  const { user, role } = useAuth();
  const pageLabels: Record<string, string> = {
    "": "Overview",
    overview: "Overview",
    users: "User & Role Management",
    "clinic-reports": "Clinic Report Oversight",
    "system-health": "System Health",
    settings: "Admin Settings",
  };
  const label = pageLabels[activePage] ?? "Admin Portal";

  return (
    <header
      className={`fixed top-0 right-0 z-30 h-14 flex items-center justify-between px-6 bg-[#050e18]/95 backdrop-blur-sm border-b border-teal-900/30 transition-all duration-300 ${
        sidebarCollapsed ? "left-16" : "left-64"
      }`}
    >
      <div className="flex items-center gap-3">
        {/* Persistent ADMIN label */}
        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-teal-400 bg-teal-950/60 border border-teal-700/40 px-2 py-0.5 rounded-md">
          Admin
        </span>
        <span className="text-sm font-semibold text-white/80">{label}</span>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 text-xs text-white/40">
          <div className="w-6 h-6 rounded-full bg-teal-800/60 border border-teal-700/40 flex items-center justify-center text-teal-300 font-bold text-[10px]">
            {user?.displayName?.[0] ?? user?.email?.[0]?.toUpperCase() ?? "?"}
          </div>
          <span className="hidden sm:block truncate max-w-[140px]">
            {user?.displayName || user?.email}
          </span>
          <span className="text-teal-500 font-semibold capitalize">
            ({role})
          </span>
        </div>

        <Link
          href="/dashboard"
          className="flex items-center gap-1.5 text-xs font-bold text-cyan-400 bg-cyan-950/40 hover:bg-cyan-900/40 border border-cyan-800/40 hover:border-cyan-600/50 px-3 py-1.5 rounded-xl transition-all"
        >
          <ArrowLeftRight className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">View as My Account</span>
          <span className="sm:hidden">My Account</span>
        </Link>
      </div>
    </header>
  );
}

// ── Page Router ─────────────────────────────────────────────────────────────────
// Parses the URL segment after /admin/ to pick the right page.
// Access control: if a clinician tries to reach a superadmin-only page via URL,
// they're redirected to /admin (overview).

function AdminPageRouter({
  page,
  role,
}: {
  page: string;
  role: string;
}) {
  const superadminOnly = ["users", "system-health", "settings"];
  if (superadminOnly.includes(page) && role !== "superadmin") {
    // Clinician hit a superadmin-only URL — silently redirect to overview
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <AlertCircle className="w-10 h-10 text-amber-400 opacity-60" />
        <p className="text-white/40 text-sm">You don't have access to this page.</p>
        <Link href="/admin" className="text-teal-400 text-sm hover:underline">
          ← Back to Overview
        </Link>
      </div>
    );
  }

  switch (page) {
    case "":
    case "overview":
      return <AdminOverview />;
    case "users":
      return <AdminUserManagement />;
    case "clinic-reports":
      return <AdminClinicReports />;
    case "system-health":
      return <AdminSystemHealth />;
    case "settings":
      return <AdminSettings />;
    default:
      return (
        <div className="flex flex-col items-center justify-center h-64 gap-4">
          <span className="text-5xl font-black text-white/10">404</span>
          <p className="text-white/40 text-sm">Admin page not found.</p>
          <Link href="/admin" className="text-teal-400 text-sm hover:underline">
            ← Back to Overview
          </Link>
        </div>
      );
  }
}

// ── Main Shell ──────────────────────────────────────────────────────────────────

export default function AdminPortalShell({ page = "" }: { page?: string }) {
  const { role } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [openClientId, setOpenClientId] = useState<string | null>(null);

  const ctxValue: ClientDetailCtx = {
    openClientId,
    openClient: setOpenClientId,
    closeClient: () => setOpenClientId(null),
  };

  return (
    <ClientDetailContext.Provider value={ctxValue}>
      <div className="min-h-screen bg-[#030b14] text-white">
        {/* Sidebar */}
        <AdminSidebar
          activePage={page}
          collapsed={collapsed}
          onToggle={() => setCollapsed((c) => !c)}
        />

        {/* Header */}
        <AdminHeader activePage={page} sidebarCollapsed={collapsed} />

        {/* Main content */}
        <main
          className={`pt-14 min-h-screen transition-all duration-300 ${
            collapsed ? "pl-16" : "pl-64"
          }`}
        >
          <div className="p-6 lg:p-8">
            <AdminPageRouter page={page} role={role} />
          </div>
        </main>

        {/* Client Detail Drawer — rendered at shell level so it can be triggered from any page */}
        {openClientId && (
          <AdminClientDetail
            clientId={openClientId}
            onClose={() => setOpenClientId(null)}
          />
        )}
      </div>
    </ClientDetailContext.Provider>
  );
}
