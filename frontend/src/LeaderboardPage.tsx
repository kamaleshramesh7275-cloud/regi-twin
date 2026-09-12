import React, { useEffect, useState } from "react";
import { Sidebar } from "./components/Sidebar";
import { Activity, Camera, History, Clock, Brain, Settings, User, Target, BarChart2 } from "lucide-react";
import { api } from "./api";
import { useAuth } from "./context/AuthContext";

interface LeaderboardEntry {
  username: string;
  score: number;
  rank_change: number;
  user_id?: string;
}

export default function LeaderboardPage() {
  const { user } = useAuth();
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardEntry[]>([]);
  const [capabilityMark, setCapabilityMark] = useState<number>(0);
  const [zoneRisks, setZoneRisks] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [lbData, dashboardData] = await Promise.all([
          api.getLeaderboard(),
          api.getDashboard(user?.uid || "")
        ]);
        setLeaderboardData(lbData);
        setCapabilityMark(dashboardData.capability_mark || 0);
        setZoneRisks(dashboardData.zone_risks || null);
      } catch (e) {
        console.error("Failed to load leaderboard data", e);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [user]);

  const getHighestRiskZone = () => {
    if (!zoneRisks) return null;
    let maxRisk = 0;
    let maxZone = "";
    Object.entries(zoneRisks).forEach(([zone, score]) => {
      const num = score as number;
      if (num > maxRisk) {
        maxRisk = num;
        maxZone = zone;
      }
    });
    return maxRisk > 10 ? { zone: maxZone.replace('_', ' '), score: maxRisk } : null;
  };

  const highest = getHighestRiskZone();


  return (
    <div className="flex flex-col md:flex-row min-h-screen h-auto md:h-screen text-foreground md:overflow-hidden pb-24 md:pb-0 bg-black">
      <Sidebar />
      
      <main className="flex-1 overflow-y-auto p-4 md:p-10 space-y-8 max-w-4xl mx-auto w-full pt-12 md:pt-10">
        <header className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Peer Benchmarking</h1>
          <p className="text-muted-foreground mt-2">Compare your physical capability mark with peers of your age.</p>
        </header>

        {loading ? (
          <div className="flex justify-center items-center h-48">
            <div className="animate-pulse flex flex-col items-center">
              <div className="h-12 w-12 rounded-full border-4 border-t-primary border-r-primary border-b-transparent border-l-transparent animate-spin mb-4"></div>
              <div className="text-muted-foreground">Loading global rankings...</div>
            </div>
          </div>
        ) : (
          <>
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 mb-6 text-center relative overflow-hidden shadow-xl">
              <div className="absolute top-0 right-0 p-4 opacity-10"><BarChart2 className="w-24 h-24 text-emerald-400" /></div>
              <div className="text-sm font-bold text-slate-400 mb-2 relative z-10 uppercase tracking-wider">Your Capability Mark</div>
              <div className="text-6xl font-black text-white font-mono-numbers tracking-tighter relative z-10 drop-shadow-md">{capabilityMark}</div>
              <div className="text-sm font-semibold text-slate-300 mt-4 relative z-10">Age 30 Baseline: <span className="text-emerald-400 font-bold">650</span> (Top 24%)</div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Leaderboard Column */}
              <div className="space-y-3">
                <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">Global Rankings</h2>
                {leaderboardData.map((u, i) => (
                  <a
                    key={i}
                    href={`/profile?id=${u.user_id || u.username}`}
                    className="flex items-center justify-between p-4 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-emerald-500/60 hover:bg-slate-900 transition-all cursor-pointer group shadow-md"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-8 text-center font-black text-lg ${i + 1 <= 3 ? 'text-amber-400 font-black' : 'text-slate-400'}`}>#{i + 1}</div>
                      <div className="text-base font-bold text-white group-hover:text-emerald-400 transition-colors">{u.username}</div>
                    </div>
                    <div className="font-mono-numbers text-lg font-black text-emerald-400">{u.score}</div>
                  </a>
                ))}
                {/* Current User */}
                {(() => {
                  const myIndex = leaderboardData.findIndex(u => u.user_id === user?.uid);
                  const myRankDisplay = myIndex !== -1 ? `#${myIndex + 1}` : "#—";
                  const displayUsername = user?.email ? user.email.split("@")[0] : "You";
                  return (
                    <div className="flex items-center justify-between p-4 rounded-xl bg-emerald-500/15 border border-emerald-500/40 mt-4 shadow-lg">
                      <div className="flex items-center gap-4">
                        <div className="w-8 text-center font-black text-emerald-400 text-lg">{myRankDisplay}</div>
                        <div className="text-base font-extrabold text-white">You ({displayUsername})</div>
                      </div>
                      <div className="font-mono-numbers text-lg font-black text-emerald-400">{capabilityMark}</div>
                    </div>
                  );
                })()}
              </div>

              {/* Insights Column */}
              <div className="space-y-4">
                <h2 className="text-lg font-semibold mb-4">Actionable Insights</h2>
                
                {highest ? (
                  <div className="bg-secondary/20 border border-border/50 p-5 rounded-2xl shadow-sm">
                    <div className="flex items-center gap-2 text-foreground font-medium mb-3">
                      <Target className="w-5 h-5 text-primary" /> Priority: {highest.zone.toUpperCase()}
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      Your {highest.zone} risk is holding your score back (Score: {highest.score}%). Target this area in your workouts to boost your peer capability mark.
                    </p>
                  </div>
                ) : (
                  <div className="bg-secondary/20 border border-border/50 p-5 rounded-2xl shadow-sm">
                    <div className="flex items-center gap-2 text-foreground font-medium mb-3">
                      <Target className="w-5 h-5 text-primary" /> Priority: Complete Capture
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      Record a movement capture session or sync external platforms to identify stability priorities and personalized quad/glute exercises.
                    </p>
                  </div>
                )}

                <div className="bg-secondary/20 border border-border/50 p-5 rounded-2xl shadow-sm">
                  <div className="flex items-center gap-2 text-foreground font-medium mb-3">
                    <Activity className="w-5 h-5 text-primary" /> Dynamic Insights
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Compare your metrics. Logging daily surveys on the Readiness page will evaluate kinesiophobia risk indices and return-to-sport indicators.
                  </p>
                </div>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
