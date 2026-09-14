import React, { useEffect, useState } from "react";
import { Sidebar } from "./components/Sidebar";
import { Activity, Target, BarChart2, Medal, Crown, Users, Loader2, RefreshCw, AlertTriangle } from "lucide-react";
import { useAuth } from "./context/AuthContext";
import { api } from "./api";

interface GlobalUser {
  user_id: string;
  username: string;
  email: string;
  health_score: number;
  mode: string;
  has_profile: boolean;
  rank: number;
}

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) return <Crown className="w-5 h-5 text-yellow-400" />;
  if (rank === 2) return <Medal className="w-5 h-5 text-slate-300" />;
  if (rank === 3) return <Medal className="w-5 h-5 text-amber-600" />;
  return <span className="text-slate-500 font-black text-sm w-5 text-center">#{rank}</span>;
}

function ScoreBar({ score }: { score: number }) {
  const pct = Math.min(100, (score / 1000) * 100);
  const color =
    pct >= 80 ? "bg-emerald-500" :
    pct >= 60 ? "bg-cyan-500" :
    pct >= 40 ? "bg-amber-500" : "bg-slate-600";
  return (
    <div className="w-24 h-1.5 bg-slate-800 rounded-full overflow-hidden">
      <div className={`h-full rounded-full ${color} transition-all`} style={{ width: `${pct}%` }} />
    </div>
  );
}

export default function LeaderboardPage() {
  const { user } = useAuth();
  const [users, setUsers] = useState<GlobalUser[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchLeaderboard = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await api.getGlobalLeaderboard();
      if (data && Array.isArray(data.users)) {
        setUsers(data.users);
        setTotal(data.total || data.users.length);
      } else {
        setUsers([]);
        setTotal(0);
      }
    } catch (e: any) {
      setError("Failed to load leaderboard. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const myEntry = users.find(u => u.user_id === user?.uid);

  const [tierFilter, setTierFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      !searchQuery ||
      u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.mode.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (tierFilter === "elite") return u.health_score >= 800;
    if (tierFilter === "advanced") return u.health_score >= 600 && u.health_score < 800;
    if (tierFilter === "intermediate") return u.health_score >= 400 && u.health_score < 600;
    if (tierFilter === "beginner") return u.health_score < 400;
    return true;
  });

  return (
    <div className="flex flex-col md:flex-row min-h-screen h-auto md:h-screen text-foreground md:overflow-hidden pb-24 md:pb-0 bg-black">
      <Sidebar />
      <main className="flex-1 overflow-y-auto p-4 md:p-10 space-y-6 max-w-3xl mx-auto w-full pt-12 md:pt-10">

        {/* Header */}
        <header className="flex items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                <Users className="w-3 h-3" /> Global Leaderboard
              </span>
            </div>
            <h1 className="text-3xl font-black tracking-tight text-white">Global User Rankings</h1>
            <p className="text-slate-400 text-sm mt-1">
              All {total} users in the system ranked by PhysioTwin Health Score (0–1000).
            </p>
          </div>
          <button
            onClick={fetchLeaderboard}
            className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-600 transition-all"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </header>

        {/* Search & Tier Filter Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-900/60 border border-slate-800 p-3 rounded-2xl">
          <input
            type="text"
            placeholder="Search users..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="px-3.5 py-1.5 rounded-xl bg-black border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500/50 w-full sm:w-48"
          />
          <div className="flex items-center gap-1 overflow-x-auto">
            {[
              { id: "all", label: "All Users" },
              { id: "elite", label: "800+ Elite" },
              { id: "advanced", label: "600–799" },
              { id: "intermediate", label: "400–599" },
              { id: "beginner", label: "< 400" },
            ].map((tier) => (
              <button
                key={tier.id}
                onClick={() => setTierFilter(tier.id)}
                className={`text-[11px] font-bold px-3 py-1.5 rounded-xl border transition-all whitespace-nowrap cursor-pointer ${
                  tierFilter === tier.id
                    ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-400"
                    : "bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200"
                }`}
              >
                {tier.label}
              </button>
            ))}
          </div>
        </div>

        {/* Your rank card */}
        {myEntry && (
          <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-5 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center">
                <RankBadge rank={myEntry.rank} />
              </div>
              <div>
                <div className="text-xs text-emerald-400 font-bold uppercase tracking-wider mb-0.5">Your Ranking</div>
                <div className="text-white font-black text-lg">#{myEntry.rank} of {total}</div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-3xl font-black text-emerald-400 font-mono">{myEntry.health_score}</div>
              <div className="text-xs text-slate-400 font-semibold mt-0.5">Health Score</div>
            </div>
          </div>
        )}

        {/* Table */}
        {loading ? (
          <div className="flex items-center justify-center py-20 gap-3 text-slate-400">
            <Loader2 className="w-6 h-6 animate-spin" /> Loading rankings…
          </div>
        ) : error ? (
          <div className="text-center py-16">
            <AlertTriangle className="w-10 h-10 mx-auto mb-4 text-red-400 opacity-60" />
            <p className="text-red-400 text-sm font-semibold mb-3">{error}</p>
            <button onClick={fetchLeaderboard} className="text-sm text-white/40 hover:text-white border border-white/10 hover:border-white/20 px-4 py-2 rounded-xl transition-all flex items-center gap-2 mx-auto">
              <RefreshCw className="w-4 h-4" /> Retry
            </button>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="text-center py-20">
            <BarChart2 className="w-12 h-12 mx-auto mb-4 text-slate-600" />
            <p className="text-slate-400 font-semibold">No users matching filter</p>
            <p className="text-slate-600 text-sm mt-1">Try selecting "All Users" or clearing your search.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {/* Column headers */}
            <div className="grid grid-cols-[40px_1fr_120px_80px] gap-3 px-4 mb-1">
              <span className="text-[10px] text-slate-600 font-bold uppercase">Rank</span>
              <span className="text-[10px] text-slate-600 font-bold uppercase">User</span>
              <span className="text-[10px] text-slate-600 font-bold uppercase text-right">Score</span>
              <span className="text-[10px] text-slate-600 font-bold uppercase hidden md:block"></span>
            </div>

            {filteredUsers.map((u) => {
              const isMe = u.user_id === user?.uid;
              return (
                <div
                  key={u.user_id}
                  className={`grid grid-cols-[40px_1fr_120px_80px] gap-3 items-center px-4 py-3.5 rounded-xl border transition-all ${
                    isMe
                      ? "bg-emerald-500/10 border-emerald-500/30 shadow-lg shadow-emerald-500/5"
                      : u.rank <= 3
                      ? "bg-slate-900/80 border-slate-700/80 hover:border-slate-600"
                      : "bg-slate-900/40 border-slate-800/60 hover:border-slate-700 hover:bg-slate-900/60"
                  }`}
                >
                  {/* Rank */}
                  <div className="flex items-center justify-center">
                    <RankBadge rank={u.rank} />
                  </div>

                  {/* User info */}
                  <div className="min-w-0">
                    <div className={`font-bold truncate ${isMe ? "text-emerald-400" : "text-white"}`}>
                      {u.username}{isMe && " (You)"}
                    </div>
                    <div className="text-[11px] text-slate-500 truncate">{u.mode}</div>
                  </div>

                  {/* Score */}
                  <div className="text-right">
                    <div className={`text-xl font-black font-mono ${
                      u.health_score >= 800 ? "text-emerald-400" :
                      u.health_score >= 600 ? "text-cyan-400" :
                      u.health_score >= 400 ? "text-amber-400" :
                      u.health_score > 0   ? "text-slate-300" : "text-slate-600"
                    }`}>
                      {u.health_score > 0 ? u.health_score : "—"}
                    </div>
                    {!u.has_profile && (
                      <div className="text-[10px] text-slate-600">No data yet</div>
                    )}
                  </div>

                  {/* Score bar */}
                  <div className="hidden md:flex justify-end">
                    <ScoreBar score={u.health_score} />
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Legend */}
        {!loading && !error && users.length > 0 && (
          <div className="flex flex-wrap gap-4 pt-2 border-t border-slate-800">
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <div className="w-3 h-1.5 rounded-full bg-emerald-500" /> 800–1000: Elite
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <div className="w-3 h-1.5 rounded-full bg-cyan-500" /> 600–799: Advanced
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <div className="w-3 h-1.5 rounded-full bg-amber-500" /> 400–599: Intermediate
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <div className="w-3 h-1.5 rounded-full bg-slate-600" /> 0–399: Beginner
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
