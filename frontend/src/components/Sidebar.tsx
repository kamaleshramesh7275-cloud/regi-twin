import React from "react";
import { Link, useLocation } from "wouter";
import { 
  Activity, Camera, History, Clock, Brain, Settings, 
  User, BarChart2, ClipboardList, LineChart, Users, Building, UserCheck,
  Pill, HeartPulse, BrainCircuit, BookOpen, Trophy, Apple, Dumbbell, LogOut, ImagePlus
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

function NavItem({ icon, label, href, active }: { icon: React.ReactNode; label: string; href: string; active?: boolean }) {
  return (
    <Link 
      href={href} 
      className={`nav-link flex flex-col md:flex-row items-center justify-center md:justify-start min-w-[62px] md:min-w-0 px-2 md:px-3 py-1.5 md:py-2 rounded-xl transition-all ${
        active 
          ? 'active text-primary bg-primary/15 font-bold shadow-sm' 
          : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
      }`}
    >
      <span className="mb-0.5 md:mb-0 md:mr-2.5 shrink-0">{icon}</span>
      <span className="text-[10px] md:text-sm font-medium leading-tight whitespace-nowrap">{label}</span>
    </Link>
  );
}

function NavSection({ title }: { title: string }) {
  return (
    <div className="hidden md:block mt-6 mb-2 px-3">
      <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">{title}</span>
    </div>
  );
}

export function Sidebar() {
  const [location, setLocation] = useLocation();
  const { logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    setLocation("/login");
  };
  
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-[#0B0F19]/95 backdrop-blur-2xl md:relative md:w-64 flex md:flex-col border-t md:border-t-0 md:border-r border-slate-800/80 p-1 md:p-4 shrink-0 h-[68px] md:h-full overflow-x-auto md:overflow-y-auto pointer-events-auto scrollbar-hide safe-bottom shadow-2xl">
      <div className="hidden md:flex items-center gap-2 px-2 mb-4 mt-2 sticky top-0 bg-[#0B0F19]/90 backdrop-blur z-10 py-2">
        <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-xs font-black text-white shadow-md">PT</div>
        <span className="font-black text-lg tracking-tight text-white">PhysioTwin</span>
      </div>

      <div className="flex md:flex-col items-center md:items-stretch justify-start w-full md:w-auto md:space-y-1 flex-1 px-1 md:px-0 py-0.5 md:py-0 md:pb-4 gap-1 md:gap-0">
        
        <NavSection title="Core" />
        <NavItem icon={<Activity className="w-4 h-4 md:w-5 md:h-5" />} label="Dashboard" href="/dashboard" active={location === '/dashboard'} />
        <NavItem icon={<User className="w-5 h-5 md:w-5 md:h-5" />} label="Twin" href="/twin" active={location === '/twin'} />
        <NavItem icon={<ImagePlus className="w-4 h-4 md:w-5 md:h-5 text-cyan-400" />} label="Gallery Upload" href="/capture" active={location === '/capture'} />
        
        <NavSection title="Health & Training" />
        {/* Temporarily hidden: <NavItem icon={<HeartPulse className="w-4 h-4 md:w-5 md:h-5" />} label="Vitals" href="/vitals" active={location === '/vitals'} /> */}
        <NavItem icon={<Apple className="w-4 h-4 md:w-5 md:h-5" />} label="Nutrition" href="/nutrition-recovery" active={location === '/nutrition-recovery'} />
        <NavItem icon={<Dumbbell className="w-4 h-4 md:w-5 md:h-5" />} label="Strain" href="/muscular-strain" active={location === '/muscular-strain'} />
        <NavItem icon={<Dumbbell className="w-4 h-4 md:w-5 md:h-5 text-emerald-400" />} label="Exercises" href="/exercises" active={location === '/exercises'} />
        <NavItem icon={<Pill className="w-4 h-4 md:w-5 md:h-5" />} label="Meds" href="/meds" active={location === '/meds'} />
        <NavItem icon={<BrainCircuit className="w-4 h-4 md:w-5 md:h-5" />} label="Readiness" href="/readiness" active={location === '/readiness'} />
        
        <NavSection title="Data & Analysis" />
        <NavItem icon={<LineChart className="w-4 h-4 md:w-5 md:h-5" />} label="Analytics" href="/analytics" active={location === '/analytics'} />
        <NavItem icon={<Clock className="w-4 h-4 md:w-5 md:h-5" />} label="Timeline" href="/timeline" active={location === '/timeline'} />
        <NavItem icon={<Brain className="w-4 h-4 md:w-5 md:h-5" />} label="Insights" href="/insights" active={location === '/insights'} />
        
        <NavSection title="Clinical & Community" />
        <NavItem icon={<ClipboardList className="w-4 h-4 md:w-5 md:h-5" />} label="Programs" href="/programs" active={location === '/programs'} />
        <NavItem icon={<Building className="w-4 h-4 md:w-5 md:h-5" />} label="Clinic" href="/clinic" active={location === '/clinic'} />
        <NavItem icon={<UserCheck className="w-4 h-4 md:w-5 md:h-5" />} label="Roster" href="/clinic/roster" active={location === '/clinic/roster'} />
        <NavItem icon={<BarChart2 className="w-4 h-4 md:w-5 md:h-5" />} label="Benchmark" href="/leaderboard" active={location === '/leaderboard'} />
        <NavItem icon={<Users className="w-4 h-4 md:w-5 md:h-5" />} label="Community" href="/community" active={location === '/community'} />
        <NavItem icon={<Trophy className="w-4 h-4 md:w-5 md:h-5" />} label="Trophies" href="/achievements" active={location === '/achievements'} />
        
        <NavSection title="System" />
        <NavItem icon={<BookOpen className="w-4 h-4 md:w-5 md:h-5" />} label="Wiki" href="/wiki" active={location === '/wiki'} />
        <NavItem icon={<Settings className="w-4 h-4 md:w-5 md:h-5" />} label="Settings" href="/settings" active={location === '/settings'} />
        
        <button
          onClick={handleLogout}
          title="Sign out of PhysioTwin"
          className="nav-link flex flex-col md:flex-row items-center justify-center md:justify-start min-w-[62px] md:min-w-0 px-2 md:px-3 py-1.5 md:py-2 rounded-xl text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all cursor-pointer mt-0 md:mt-2"
        >
          <span className="mb-0.5 md:mb-0 md:mr-2.5 shrink-0"><LogOut className="w-4 h-4 md:w-5 md:h-5" /></span>
          <span className="text-[10px] md:text-sm font-medium leading-tight whitespace-nowrap">Sign Out</span>
        </button>
      </div>
    </nav>
  );
}
