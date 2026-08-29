import React, { useState, useEffect } from "react";
import { Sidebar } from "./components/Sidebar";
import { Trophy, Medal, Award, Star, Zap, Activity, Loader } from "lucide-react";
import { api } from "./api";
import { auth } from "./firebase";

interface Achievement {
  id: string;
  title: string;
  desc: string;
  unlocked: boolean;
  progress: number;
  target: number;
}

function getIcon(id: string, unlocked: boolean) {
  const cls = `w-8 h-8 ${unlocked ? '' : 'text-muted-foreground'}`;
  switch (id) {
    case "sessions_10":   return <Medal className={`${cls} ${unlocked ? 'text-blue-400' : ''}`} />;
    case "sessions_100":  return <Award className={`${cls} ${unlocked ? 'text-yellow-400' : ''}`} />;
    case "symmetry":      return <Activity className={`${cls} ${unlocked ? 'text-emerald-400' : ''}`} />;
    case "consistency":   return <Zap className={`${cls} ${unlocked ? 'text-orange-400' : ''}`} />;
    case "rom_140":       return <Star className={`${cls} ${unlocked ? 'text-purple-400' : ''}`} />;
    case "cleared":       return <Trophy className={`${cls} ${unlocked ? 'text-yellow-300' : ''}`} />;
    default:              return <Trophy className={cls} />;
  }
}

export default function AchievementsPage() {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);

  const uid = auth.currentUser?.uid || "test-user";

  useEffect(() => {
    api.getAchievements(uid)
      .then(setAchievements)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [uid]);

  const unlocked = achievements.filter(a => a.unlocked).length;

  return (
    <div className="flex flex-col md:flex-row min-h-screen text-foreground md:overflow-hidden pb-[72px] md:pb-0 bg-background">
      <Sidebar />
      <main className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6">
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black flex items-center gap-2">
              <Trophy className="w-6 h-6 text-primary" /> Trophy Room
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              Track your major recovery milestones and clinical achievements.
            </p>
          </div>
          {!loading && (
            <div className="text-sm text-muted-foreground">
              <span className="font-bold text-foreground text-lg">{unlocked}</span>
              <span> / {achievements.length} unlocked</span>
            </div>
          )}
        </header>

        {loading && (
          <div className="flex items-center justify-center py-20 gap-2 text-muted-foreground">
            <Loader className="w-5 h-5 animate-spin" />
            <span>Loading achievements...</span>
          </div>
        )}

        {!loading && achievements.length === 0 && (
          <div className="card text-center py-16 space-y-3">
            <Trophy className="w-12 h-12 text-muted-foreground mx-auto" />
            <p className="text-muted-foreground">No achievements data available yet.</p>
            <p className="text-xs text-muted-foreground">Complete your first rehab session to start unlocking badges.</p>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {achievements.map((badge) => (
            <div
              key={badge.id}
              className={`card border ${badge.unlocked ? 'border-primary/30 bg-primary/5' : 'border-border/50 bg-card/30 opacity-70'} flex flex-col items-center text-center p-6 transition-all hover:scale-[1.02]`}
            >
              <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 ${badge.unlocked ? 'bg-background shadow-lg shadow-primary/20' : 'bg-background'}`}>
                {getIcon(badge.id, badge.unlocked)}
              </div>
              <h3 className={`font-bold text-lg mb-2 ${badge.unlocked ? 'text-foreground' : 'text-muted-foreground'}`}>
                {badge.title}
              </h3>
              <p className="text-xs text-muted-foreground mb-3">{badge.desc}</p>

              {/* Progress bar */}
              {!badge.unlocked && badge.target > 1 && (
                <div className="w-full mb-3">
                  <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
                    <span>{badge.progress}</span>
                    <span>{badge.target}</span>
                  </div>
                  <div className="h-1.5 w-full bg-border rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary/60 rounded-full transition-all"
                      style={{ width: `${Math.min(100, (badge.progress / badge.target) * 100)}%` }}
                    />
                  </div>
                </div>
              )}

              {badge.unlocked ? (
                <div className="mt-auto text-[10px] uppercase font-bold text-primary tracking-widest bg-primary/10 px-3 py-1 rounded-full">
                  Unlocked ✓
                </div>
              ) : (
                <div className="mt-auto text-[10px] uppercase font-bold text-muted-foreground tracking-widest bg-muted px-3 py-1 rounded-full">
                  {badge.target > 1
                    ? `${Math.min(100, Math.round((badge.progress / badge.target) * 100))}% complete`
                    : "Locked"}
                </div>
              )}
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
