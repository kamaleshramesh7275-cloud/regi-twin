import React from "react";
import { Link, useLocation } from "wouter";
import {
  X,
  Apple,
  Dumbbell,
  Pill,
  BrainCircuit,
  FileText,
  Clock,
  Brain,
  ClipboardList,
  Building,
  UserCheck,
  BarChart2,
  Users,
  Trophy,
  BookOpen,
  Settings,
  Stethoscope,
  LogOut,
  ChevronRight,
  User
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

interface MobileMoreDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

interface DrawerItemProps {
  icon: React.ReactNode;
  label: string;
  desc?: string;
  href: string;
  active?: boolean;
  tag?: string;
  onClick?: () => void;
}

function DrawerItem({ icon, label, desc, href, active, tag, onClick }: DrawerItemProps) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={`flex items-center justify-between p-3 rounded-2xl transition-all ${
        active
          ? "bg-emerald-500/15 border border-emerald-500/30 text-emerald-400"
          : "bg-slate-900/60 hover:bg-slate-800/80 border border-slate-800/80 text-slate-200"
      }`}
    >
      <div className="flex items-center gap-3">
        <div
          className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
            active ? "bg-emerald-500/20 text-emerald-400" : "bg-white/5 text-slate-400"
          }`}
        >
          {icon}
        </div>
        <div>
          <div className="text-xs font-bold leading-tight flex items-center gap-1.5">
            {label}
            {tag && (
              <span className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.2 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                {tag}
              </span>
            )}
          </div>
          {desc && <div className="text-[10px] text-slate-400 mt-0.5">{desc}</div>}
        </div>
      </div>
      <ChevronRight className="w-4 h-4 text-slate-500 shrink-0" />
    </Link>
  );
}

export function MobileMoreDrawer({ isOpen, onClose }: MobileMoreDrawerProps) {
  const [location, setLocation] = useLocation();
  const { logout, role, user } = useAuth();

  if (!isOpen) return null;

  const handleLogout = async () => {
    onClose();
    await logout();
    setLocation("/login");
  };

  return (
    <div className="fixed inset-0 z-[100] flex flex-col justify-end md:hidden">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
      />

      {/* Slide-Up Sheet */}
      <div className="relative z-10 w-full max-h-[85vh] bg-[#0A0F1D] border-t border-slate-800 rounded-t-3xl shadow-2xl flex flex-col overflow-hidden">
        {/* Top Handle & Header */}
        <div className="pt-3 pb-2 px-5 flex flex-col items-center border-b border-slate-800/60 shrink-0">
          <div className="w-12 h-1.5 bg-slate-700 rounded-full mb-3" />
          <div className="w-full flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center text-slate-950 font-black text-xs">
                PT
              </div>
              <div>
                <h3 className="text-sm font-black text-white">PhysioTwin Hub</h3>
                <p className="text-[10px] text-slate-400">All tools, clinical &amp; settings</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-300 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Scrollable Categories List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-5 scrollbar-hide">
          
          {/* User Profile Mini Bar */}
          <div className="p-3.5 rounded-2xl bg-gradient-to-r from-emerald-950/40 via-slate-900/80 to-slate-900/80 border border-emerald-500/20 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold text-sm">
                <User className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-bold text-white truncate max-w-[180px]">
                  {user?.displayName || user?.email || "Athlete User"}
                </div>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">
                    {role || "client"}
                  </span>
                </div>
              </div>
            </div>
            <Link
              href="/settings"
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white text-xs font-semibold"
            >
              Profile
            </Link>
          </div>

          {/* Section: Health & Training */}
          <div>
            <div className="text-[10px] font-black uppercase tracking-widest text-emerald-400 mb-2.5 px-1">
              Health &amp; Diagnostics
            </div>
            <div className="grid grid-cols-1 gap-2">
              <DrawerItem
                icon={<Brain className="w-4 h-4 text-emerald-400" />}
                label="What-If Simulator"
                desc="Predictive training & recovery counterfactual sandbox"
                href="/simulator"
                active={location === "/simulator"}
                tag="New"
                onClick={onClose}
              />
              <DrawerItem
                icon={<Apple className="w-4 h-4" />}
                label="Nutrition & Recovery"
                desc="Macro balance, circadian rest & hydration"
                href="/nutrition-recovery"
                active={location === "/nutrition-recovery"}
                onClick={onClose}
              />
              <DrawerItem
                icon={<Dumbbell className="w-4 h-4" />}
                label="Muscular Strain"
                desc="ACWR fatigue load & joint stress prediction"
                href="/muscular-strain"
                active={location === "/muscular-strain"}
                onClick={onClose}
              />
              <DrawerItem
                icon={<Dumbbell className="w-4 h-4 text-emerald-400" />}
                label="Exercise Library"
                desc="Biomechanical motion presets & video drills"
                href="/exercises"
                active={location === "/exercises"}
                onClick={onClose}
              />
              <DrawerItem
                icon={<Pill className="w-4 h-4" />}
                label="Medications & Supplements"
                desc="Dosing tracker & physiological interactions"
                href="/meds"
                active={location === "/meds"}
                onClick={onClose}
              />
              <DrawerItem
                icon={<BrainCircuit className="w-4 h-4" />}
                label="Mental Readiness"
                desc="TSK-11 kinesiophobia & nervous recovery"
                href="/readiness"
                active={location === "/readiness"}
                onClick={onClose}
              />
            </div>
          </div>

          {/* Section: Medical Records & Clinical */}
          <div>
            <div className="text-[10px] font-black uppercase tracking-widest text-cyan-400 mb-2.5 px-1">
              Records &amp; Clinical Analysis
            </div>
            <div className="grid grid-cols-1 gap-2">
              <DrawerItem
                icon={<FileText className="w-4 h-4 text-blue-400" />}
                label="Full Medical History"
                desc="OCR report scanner & injury timeline"
                href="/medical-history"
                tag="OCR"
                active={location === "/medical-history" || location === "/history"}
                onClick={onClose}
              />
              <DrawerItem
                icon={<Brain className="w-4 h-4" />}
                label="Clinical Insights"
                desc="LLM biomechanical anomaly detection"
                href="/insights"
                active={location === "/insights"}
                onClick={onClose}
              />
              <DrawerItem
                icon={<Clock className="w-4 h-4" />}
                label="Recovery Timeline"
                desc="Rehab milestones & session progressions"
                href="/timeline"
                active={location === "/timeline"}
                onClick={onClose}
              />
              <DrawerItem
                icon={<ClipboardList className="w-4 h-4" />}
                label="Therapy Programs"
                desc="Assigned clinician protocols"
                href="/programs"
                active={location === "/programs"}
                onClick={onClose}
              />
              <DrawerItem
                icon={<Building className="w-4 h-4" />}
                label="Clinic Dashboard"
                desc="Connected physio practice sync"
                href="/clinic"
                active={location === "/clinic"}
                onClick={onClose}
              />
              <DrawerItem
                icon={<UserCheck className="w-4 h-4" />}
                label="Clinician Roster"
                desc="Patient overview & risk queue"
                href="/clinic/roster"
                active={location === "/clinic/roster"}
                onClick={onClose}
              />
            </div>
          </div>

          {/* Section: Community & Benchmarks */}
          <div>
            <div className="text-[10px] font-black uppercase tracking-widest text-amber-400 mb-2.5 px-1">
              Community &amp; Milestones
            </div>
            <div className="grid grid-cols-1 gap-2">
              <DrawerItem
                icon={<BarChart2 className="w-4 h-4" />}
                label="Cohort Benchmark"
                desc="Symmetry & range-of-motion rankings"
                href="/leaderboard"
                active={location === "/leaderboard"}
                onClick={onClose}
              />
              <DrawerItem
                icon={<Users className="w-4 h-4" />}
                label="Athlete Community"
                desc="Social feeds & shared recovery protocols"
                href="/community"
                active={location === "/community"}
                onClick={onClose}
              />
              <DrawerItem
                icon={<Trophy className="w-4 h-4 text-amber-400" />}
                label="Trophies & Badges"
                desc="Biomechanics consistency milestones"
                href="/achievements"
                active={location === "/achievements"}
                onClick={onClose}
              />
            </div>
          </div>

          {/* Section: System & Admin */}
          <div>
            <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2.5 px-1">
              System &amp; Administration
            </div>
            <div className="grid grid-cols-1 gap-2">
              <DrawerItem
                icon={<BookOpen className="w-4 h-4" />}
                label="Knowledge Wiki"
                desc="Biomechanics references & clinical docs"
                href="/wiki"
                active={location === "/wiki"}
                onClick={onClose}
              />
              <DrawerItem
                icon={<Settings className="w-4 h-4" />}
                label="System Settings"
                desc="Sensors, Health Connect, cameras & privacy"
                href="/settings"
                active={location === "/settings"}
                onClick={onClose}
              />

              {/* Admin Portal Shortcut */}
              {(role === "clinician" || role === "superadmin") && (
                <DrawerItem
                  icon={<Stethoscope className="w-4 h-4 text-teal-400" />}
                  label="Clinician Admin Portal"
                  desc="Patient triage, clinic telemetry & roles"
                  href="/admin"
                  tag="Admin"
                  active={location.startsWith("/admin")}
                  onClick={onClose}
                />
              )}
            </div>
          </div>

          {/* Sign Out Button */}
          <div className="pt-2 pb-6">
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 p-3.5 rounded-2xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 font-bold text-xs transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out of PhysioTwin</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
