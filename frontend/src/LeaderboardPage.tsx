import React, { useEffect, useState } from "react";
import { Sidebar } from "./components/Sidebar";
import { Activity, Camera, History, Clock, Brain, Settings, User, Target, BarChart2 } from "lucide-react";
import { api } from "./api";
import { useAuth } from "./context/AuthContext";

interface LeaderboardEntry {
  username: string;
  score: number;
  rank_change: number;
}

export default function LeaderboardPage() {
  const { user } = useAuth();
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardEntry[]>([]);
  const [capabilityMark, setCapabilityMark] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [lbData, dashboardData] = await Promise.all([
          api.getLeaderboard(),
          api.getDashboard(user?.uid || "demo_user")
        ]);
        setLeaderboardData(lbData);
        // We use the dashboard metrics to calculate a rough mark, or use reserve if available
        setCapabilityMark(Math.round(dashboardData.reserve * 10) || 712);
      } catch (e) {
        console.error("Failed to load leaderboard data", e);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [user]);

  return (
    <div className="flex flex-col md:flex-row min-h-screen h-auto md:h-screen text-foreground md:overflow-hidden pb-[72px] md:pb-0 bg-black">
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
            <div className="bg-secondary/10 border border-border/50 rounded-2xl p-8 mb-6 text-center relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10"><BarChart2 className="w-24 h-24" /></div>
              <div className="text-sm font-medium text-muted-foreground mb-2 relative z-10">Your Capability Mark</div>
              <div className="text-6xl font-bold text-foreground font-mono tracking-tighter relative z-10">{capabilityMark}</div>
              <div className="text-sm text-muted-foreground mt-4 relative z-10">Age 30 Baseline: 650 (Top 24%)</div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Leaderboard Column */}
              <div className="space-y-3">
                <h2 className="text-lg font-semibold mb-4">Global Rankings</h2>
                {leaderboardData.map((u, i) => (
                  <div key={i} className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5">
                    <div className="flex items-center gap-4">
                      <div className={`w-8 text-center font-medium text-lg ${i + 1 <= 3 ? 'text-foreground' : 'text-muted-foreground'}`}>#{i + 1}</div>
                      <div className="text-base font-medium">{u.username}</div>
                    </div>
                    <div className="font-mono text-base font-medium text-primary">{u.score}</div>
                  </div>
                ))}
                {/* Current User */}
                <div className="flex items-center justify-between p-4 rounded-xl bg-primary/10 border border-primary/20 mt-4 shadow-sm">
                  <div className="flex items-center gap-4">
                    <div className="w-8 text-center font-bold text-primary text-lg">#49</div>
                    <div className="text-base font-bold text-primary">You</div>
                  </div>
                  <div className="font-mono text-base font-bold text-primary">{capabilityMark}</div>
                </div>
              </div>

              {/* Insights Column */}
              <div className="space-y-4">
                <h2 className="text-lg font-semibold mb-4">Actionable Insights</h2>
                
                <div className="bg-secondary/20 border border-border/50 p-5 rounded-2xl shadow-sm">
                  <div className="flex items-center gap-2 text-foreground font-medium mb-3">
                    <Target className="w-5 h-5 text-primary" /> Priority: Knee Stability
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Your left knee risk is holding your score back. Strengthen your glute medius and left quad to boost your mark by +45 points.
                  </p>
                </div>

                <div className="bg-secondary/20 border border-border/50 p-5 rounded-2xl shadow-sm">
                  <div className="flex items-center gap-2 text-foreground font-medium mb-3">
                    <Activity className="w-5 h-5 text-primary" /> Mobility Gains
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    You are outperforming 80% of peers in shoulder mobility. Keep up the upper-cross syndrome prevention routine.
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
