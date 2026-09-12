import React, { useState } from "react";
import { Link, useLocation } from "wouter";
import { 
  Activity, Camera, History, Clock, Brain, Settings, 
  User, BarChart2, ClipboardList, LineChart, Users, Building, UserCheck,
  Pill, HeartPulse, BrainCircuit, BookOpen, Trophy, Apple, Dumbbell, LogOut, 
  Stethoscope, FileText, Search, Menu, Sparkles, Shield
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { MobileMoreDrawer } from "./MobileMoreDrawer";

function NavItem({ 
  icon, 
  label, 
  href, 
  active,
  tag 
}: { 
  icon: React.ReactNode; 
  label: string; 
  href: string; 
  active?: boolean;
  tag?: string;
}) {
  return (
    <Link 
      href={href} 
      className={`nav-link flex items-center justify-between px-3 py-2 rounded-xl transition-all ${
        active 
          ? 'active text-emerald-400 bg-emerald-500/15 font-bold shadow-sm border border-emerald-500/30' 
          : 'text-slate-400 hover:text-white hover:bg-white/5'
      }`}
    >
      <div className="flex items-center gap-2.5 min-w-0">
        <span className="shrink-0">{icon}</span>
        <span className="text-xs font-semibold leading-tight truncate">{label}</span>
      </div>
      {tag && (
        <span className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shrink-0">
          {tag}
        </span>
      )}
    </Link>
  );
}

function NavSection({ title }: { title: string }) {
  return (
    <div className="mt-5 mb-1.5 px-3">
      <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{title}</span>
    </div>
  );
}

export function Sidebar() {
  const [location, setLocation] = useLocation();
  const { logout, role, user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [isMoreOpen, setIsMoreOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    setLocation("/login");
  };

  const navItemsList = [
    { label: "Dashboard", href: "/dashboard", section: "Core", icon: <Activity className="w-4 h-4" /> },
    { label: "3D Digital Twin", href: "/twin", section: "Core", icon: <User className="w-4 h-4" /> },
    { label: "Live Vision Mocap", href: "/capture", section: "Core", icon: <Camera className="w-4 h-4 text-cyan-400" /> },
    
    { label: "Nutrition & Recovery", href: "/nutrition-recovery", section: "Health & Training", icon: <Apple className="w-4 h-4" /> },
    { label: "Muscular Strain", href: "/muscular-strain", section: "Health & Training", icon: <Dumbbell className="w-4 h-4" /> },
    { label: "Exercise Library", href: "/exercises", section: "Health & Training", icon: <Dumbbell className="w-4 h-4 text-emerald-400" /> },
    { label: "Meds & Supplements", href: "/meds", section: "Health & Training", icon: <Pill className="w-4 h-4" /> },
    { label: "Mental Readiness", href: "/readiness", section: "Health & Training", icon: <BrainCircuit className="w-4 h-4" /> },
    
    { label: "Medical History", href: "/medical-history", section: "Records & Analysis", icon: <FileText className="w-4 h-4 text-blue-400" />, tag: "OCR" },
    { label: "Analytics & Trends", href: "/analytics", section: "Records & Analysis", icon: <LineChart className="w-4 h-4" /> },
    { label: "Recovery Timeline", href: "/timeline", section: "Records & Analysis", icon: <Clock className="w-4 h-4" /> },
    { label: "Clinical Insights", href: "/insights", section: "Records & Analysis", icon: <Brain className="w-4 h-4" /> },
    
    { label: "Programs", href: "/programs", section: "Clinical & Community", icon: <ClipboardList className="w-4 h-4" /> },
    { label: "Clinic Hub", href: "/clinic", section: "Clinical & Community", icon: <Building className="w-4 h-4" /> },
    { label: "Clinician Roster", href: "/clinic/roster", section: "Clinical & Community", icon: <UserCheck className="w-4 h-4" /> },
    { label: "Cohort Leaderboard", href: "/leaderboard", section: "Clinical & Community", icon: <BarChart2 className="w-4 h-4" /> },
    { label: "Community Feed", href: "/community", section: "Clinical & Community", icon: <Users className="w-4 h-4" /> },
    { label: "Trophies & Badges", href: "/achievements", section: "Clinical & Community", icon: <Trophy className="w-4 h-4 text-amber-400" /> },
    
    { label: "Knowledge Wiki", href: "/wiki", section: "System", icon: <BookOpen className="w-4 h-4" /> },
    { label: "App Settings", href: "/settings", section: "System", icon: <Settings className="w-4 h-4" /> },
  ];

  const filteredItems = searchQuery.trim()
    ? navItemsList.filter(item => item.label.toLowerCase().includes(searchQuery.toLowerCase()))
    : null;

  return (
    <>
      {/* ─────────────────────────────────────────────────────────────────────────
          1. LAPTOP / DESKTOP SIDEBAR (md: and above)
          ───────────────────────────────────────────────────────────────────────── */}
      <nav className="hidden md:flex md:w-64 flex-col bg-[#050B14] border-r border-slate-800/80 h-screen sticky top-0 shrink-0 z-40 select-none">
        
        {/* Brand Header */}
        <div className="p-4 pb-3 border-b border-slate-800/60 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center text-slate-950 font-black text-xs shadow-md shadow-emerald-500/20 group-hover:scale-105 transition-transform">
              PT
            </div>
            <div>
              <span className="font-black text-base tracking-tight text-white flex items-center gap-1.5">
                PhysioTwin <span className="text-[9px] uppercase font-bold px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">v2.0</span>
              </span>
              <p className="text-[10px] text-slate-500 font-medium">Digital Biomechanics</p>
            </div>
          </Link>
        </div>

        {/* Feature Search Filter */}
        <div className="px-3 pt-3 pb-1">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500 pointer-events-none" />
            <input
              type="text"
              placeholder="Search features..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-900/80 border border-slate-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder:text-slate-600 outline-none focus:border-emerald-500/50 transition-colors"
            />
          </div>
        </div>

        {/* Scrollable Navigation Items */}
        <div className="flex-1 overflow-y-auto px-2 py-2 space-y-0.5 scrollbar-hide">
          {filteredItems ? (
            <div className="space-y-1 pt-1">
              <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-2 mb-1">Search Results</div>
              {filteredItems.map(item => (
                <NavItem
                  key={item.href}
                  icon={item.icon}
                  label={item.label}
                  href={item.href}
                  tag={item.tag}
                  active={location === item.href}
                />
              ))}
              {filteredItems.length === 0 && (
                <div className="text-xs text-slate-500 text-center py-4">No features matched "{searchQuery}"</div>
              )}
            </div>
          ) : (
            <>
              <NavSection title="Core" />
              <NavItem icon={<Activity className="w-4 h-4" />} label="Dashboard" href="/dashboard" active={location === '/dashboard'} />
              <NavItem icon={<User className="w-4 h-4" />} label="3D Digital Twin" href="/twin" active={location === '/twin'} />
              <NavItem icon={<Camera className="w-4 h-4 text-cyan-400" />} label="Live Vision Mocap" href="/capture" active={location === '/capture'} />

              <NavSection title="Health & Training" />
              <NavItem icon={<Apple className="w-4 h-4" />} label="Nutrition & Recovery" href="/nutrition-recovery" active={location === '/nutrition-recovery'} />
              <NavItem icon={<Dumbbell className="w-4 h-4" />} label="Muscular Strain" href="/muscular-strain" active={location === '/muscular-strain'} />
              <NavItem icon={<Dumbbell className="w-4 h-4 text-emerald-400" />} label="Exercise Library" href="/exercises" active={location === '/exercises'} />
              <NavItem icon={<Pill className="w-4 h-4" />} label="Meds & Supplements" href="/meds" active={location === '/meds'} />
              <NavItem icon={<BrainCircuit className="w-4 h-4" />} label="Mental Readiness" href="/readiness" active={location === '/readiness'} />

              <NavSection title="Records & Analysis" />
              <NavItem icon={<FileText className="w-4 h-4 text-blue-400" />} label="Medical History" href="/medical-history" active={location === '/medical-history' || location === '/history'} tag="OCR" />
              <NavItem icon={<LineChart className="w-4 h-4" />} label="Analytics & Trends" href="/analytics" active={location === '/analytics'} />
              <NavItem icon={<Clock className="w-4 h-4" />} label="Recovery Timeline" href="/timeline" active={location === '/timeline'} />
              <NavItem icon={<Brain className="w-4 h-4" />} label="Clinical Insights" href="/insights" active={location === '/insights'} />

              <NavSection title="Clinical & Community" />
              <NavItem icon={<ClipboardList className="w-4 h-4" />} label="Therapy Programs" href="/programs" active={location === '/programs'} />
              <NavItem icon={<Building className="w-4 h-4" />} label="Clinic Hub" href="/clinic" active={location === '/clinic'} />
              <NavItem icon={<UserCheck className="w-4 h-4" />} label="Clinician Roster" href="/clinic/roster" active={location === '/clinic/roster'} />
              <NavItem icon={<BarChart2 className="w-4 h-4" />} label="Leaderboard" href="/leaderboard" active={location === '/leaderboard'} />
              <NavItem icon={<Users className="w-4 h-4" />} label="Community Feed" href="/community" active={location === '/community'} />
              <NavItem icon={<Trophy className="w-4 h-4 text-amber-400" />} label="Trophies" href="/achievements" active={location === '/achievements'} />

              <NavSection title="System" />
              <NavItem icon={<BookOpen className="w-4 h-4" />} label="Knowledge Wiki" href="/wiki" active={location === '/wiki'} />
              <NavItem icon={<Settings className="w-4 h-4" />} label="Settings" href="/settings" active={location === '/settings'} />
            </>
          )}
        </div>

        {/* Sticky User Profile & Footer Actions */}
        <div className="p-3 border-t border-slate-800/80 bg-[#070D18]/90 space-y-2">
          
          {/* Admin Portal Button (Clinicians/Admins only) */}
          {(role === 'clinician' || role === 'superadmin') && (
            <Link
              href="/admin"
              className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-teal-950/40 hover:bg-teal-900/40 border border-teal-800/40 text-teal-300 text-xs font-bold transition-all group"
            >
              <div className="flex items-center gap-2">
                <Stethoscope className="w-4 h-4 text-teal-400" />
                <span>Admin Portal</span>
              </div>
              <span className="text-[10px] font-mono bg-teal-900/80 px-1.5 py-0.2 rounded text-teal-200">
                PRO
              </span>
            </Link>
          )}

          {/* User Status Bar */}
          <div className="flex items-center justify-between px-2 py-1">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-7 h-7 rounded-lg bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-300 shrink-0">
                <User className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-bold text-white truncate max-w-[110px]">
                  {user?.displayName || user?.email?.split("@")[0] || "Athlete User"}
                </div>
                <div className="text-[10px] text-emerald-400 font-semibold uppercase tracking-wider">
                  {role || "client"}
                </div>
              </div>
            </div>

            <button
              onClick={handleLogout}
              title="Sign Out"
              className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </nav>

      {/* ─────────────────────────────────────────────────────────────────────────
          2. MOBILE / NATIVE APK BOTTOM DOCK (< md breakpoint)
          ───────────────────────────────────────────────────────────────────────── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#060C18]/95 backdrop-blur-2xl border-t border-slate-800/90 px-3 py-2 flex items-center justify-around safe-bottom shadow-[0_-8px_30px_rgba(0,0,0,0.6)]">
        
        {/* Tab 1: Dashboard */}
        <Link
          href="/dashboard"
          className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all ${
            location === "/dashboard"
              ? "text-emerald-400 font-bold"
              : "text-slate-400 hover:text-white"
          }`}
        >
          <Activity className="w-5 h-5 mb-0.5" />
          <span className="text-[10px] tracking-tight">Dashboard</span>
        </Link>

        {/* Tab 2: 3D Twin */}
        <Link
          href="/twin"
          className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all ${
            location === "/twin"
              ? "text-emerald-400 font-bold"
              : "text-slate-400 hover:text-white"
          }`}
        >
          <User className="w-5 h-5 mb-0.5" />
          <span className="text-[10px] tracking-tight">3D Twin</span>
        </Link>

        {/* Tab 3: CENTER HERO LIVE MOCAP ACTION */}
        <Link
          href="/capture"
          className="relative -top-3 flex flex-col items-center group cursor-pointer"
        >
          <div className="w-13 h-13 rounded-2xl bg-gradient-to-tr from-emerald-600 via-teal-500 to-cyan-400 p-[2px] shadow-lg shadow-emerald-500/30 group-hover:scale-105 transition-transform">
            <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
              <Camera className="w-6 h-6 text-emerald-400 animate-pulse" />
            </div>
          </div>
          <span className="text-[9px] font-black uppercase tracking-wider text-emerald-400 mt-0.5">
            Mocap
          </span>
        </Link>

        {/* Tab 4: Analytics */}
        <Link
          href="/analytics"
          className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all ${
            location === "/analytics"
              ? "text-emerald-400 font-bold"
              : "text-slate-400 hover:text-white"
          }`}
        >
          <LineChart className="w-5 h-5 mb-0.5" />
          <span className="text-[10px] tracking-tight">Analytics</span>
        </Link>

        {/* Tab 5: More Hub Drawer */}
        <button
          onClick={() => setIsMoreOpen(true)}
          className="flex flex-col items-center justify-center py-1 px-2 rounded-xl text-slate-400 hover:text-white cursor-pointer"
        >
          <Menu className="w-5 h-5 mb-0.5 text-teal-400" />
          <span className="text-[10px] tracking-tight text-teal-300">Hub</span>
        </button>
      </nav>

      {/* Slide-Up Hub Drawer */}
      <MobileMoreDrawer
        isOpen={isMoreOpen}
        onClose={() => setIsMoreOpen(false)}
      />
    </>
  );
}
