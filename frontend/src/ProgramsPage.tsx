import React, { useEffect, useState } from "react";
import { Sidebar } from "./components/Sidebar";
import { ClipboardList, CheckCircle2, Circle, Clock, ChevronRight, Play, RefreshCcw, Loader2, Dumbbell } from "lucide-react";
import { api } from "./api";
import { useAuth } from "./context/AuthContext";

export default function ProgramsPage() {
  const { user } = useAuth();
  const [program, setProgram] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeWeekIndex, setActiveWeekIndex] = useState(0);
  const [completedTasks, setCompletedTasks] = useState<Record<string, boolean>>({});

  const loadProgram = async (forceRegenerate = false) => {
    setLoading(true);
    try {
      const uid = user?.uid || "test-user";
      const cacheKey = `rehab_program_${uid}`;
      const cached = sessionStorage.getItem(cacheKey);
      if (cached && !forceRegenerate) {
        setProgram(JSON.parse(cached));
      } else {
        const data = await api.generateProgram(uid);
        setProgram(data);
        sessionStorage.setItem(cacheKey, JSON.stringify(data));
      }
    } catch (e) {
      console.error("Failed to load rehab program", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProgram();
  }, [user]);

  const toggleTask = (taskId: string) => {
    setCompletedTasks(prev => ({
      ...prev,
      [taskId]: !prev[taskId]
    }));
  };

  const activeWeek = program?.weeks?.[activeWeekIndex];
  const totalTasks = program?.weeks?.reduce((acc: number, w: any) => acc + (w.tasks?.length || 0), 0) || 12;
  const completedCount = Object.values(completedTasks).filter(Boolean).length;
  const progressPercent = Math.round((completedCount / totalTasks) * 100);

  return (
    <div className="flex flex-col md:flex-row min-h-screen text-foreground md:overflow-hidden pb-[72px] md:pb-0 bg-background">
      <Sidebar />
      <main className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6">
        <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black flex items-center gap-2">
              <ClipboardList className="w-6 h-6 text-primary" /> Dynamic Rehab
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              Structured stabilization program tailored to your latest capability profile and weak zones.
            </p>
          </div>
          <button
            onClick={() => loadProgram(true)}
            disabled={loading}
            className="btn-secondary flex items-center gap-2 px-3 py-1.5 text-xs self-start sm:self-auto disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <RefreshCcw className="w-3.5 h-3.5" />
            )}
            Regenerate Program
          </button>
        </header>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
            <div className="text-sm text-muted-foreground animate-pulse">
              Synthesizing custom corrective protocols using PhysioTwin AI...
            </div>
          </div>
        ) : !program ? (
          <div className="card text-center py-16">
            <Dumbbell className="w-12 h-12 text-muted-foreground opacity-40 mx-auto mb-4" />
            <p className="font-bold text-lg">No program available</p>
            <p className="text-sm text-muted-foreground mt-1">
              We couldn't generate a protocol. Try recording a dynamic session first.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Current Program Card */}
            <div className="lg:col-span-2 space-y-6">
              <div className="card border-primary/20 bg-primary/5">
                <div className="flex items-center justify-between mb-4">
                  <span className="badge badge-blue">AI-Generated Protocol</span>
                  <span className="text-xs font-bold text-muted-foreground">
                    Week {activeWeekIndex + 1} of {program.weeks?.length || 4}
                  </span>
                </div>
                <h2 className="text-xl font-bold mb-1">{program.title}</h2>
                <p className="text-xs text-muted-foreground italic mb-4">{program.focus}</p>
                
                <div className="mt-6 mb-2 flex justify-between text-sm">
                  <span className="font-semibold text-xs text-muted-foreground">Overall Completion</span>
                  <span className="font-mono-numbers text-xs font-bold">{progressPercent}%</span>
                </div>
                <div className="h-2 w-full bg-border rounded-full overflow-hidden">
                  <div className="h-full bg-primary transition-all duration-500" style={{ width: `${progressPercent}%` }} />
                </div>
              </div>

              {/* Week Tabs */}
              <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide border-b border-border">
                {program.weeks?.map((w: any, index: number) => (
                  <button
                    key={index}
                    onClick={() => setActiveWeekIndex(index)}
                    className={`px-4 py-2 text-xs font-bold border-b-2 whitespace-nowrap transition-colors ${
                      activeWeekIndex === index
                        ? "border-primary text-primary"
                        : "border-transparent text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    Week {index + 1}
                  </button>
                ))}
              </div>

              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-bold text-foreground">
                    Week {activeWeekIndex + 1}: {activeWeek?.focus || "Focus Area"}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Complete these daily sessions to target neural activation and tissue load tolerance.
                  </p>
                </div>

                <div className="space-y-3">
                  {activeWeek?.tasks?.map((task: any, idx: number) => {
                    const taskId = `w${activeWeekIndex}_t${idx}`;
                    const completed = !!completedTasks[taskId];
                    return (
                      <div
                        key={idx}
                        onClick={() => toggleTask(taskId)}
                        className={`card flex items-start p-4 transition-all hover:bg-secondary/10 cursor-pointer ${
                          completed ? 'opacity-60 border-emerald-500/20 bg-emerald-500/5' : ''
                        }`}
                      >
                        {completed ? (
                          <CheckCircle2 className="w-5 h-5 text-emerald-500 mr-3 mt-0.5 shrink-0" />
                        ) : (
                          <Circle className="w-5 h-5 text-muted-foreground mr-3 mt-0.5 shrink-0" />
                        )}
                        <div className="flex-1 min-w-0">
                          <div className={`font-semibold text-sm leading-snug ${completed ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                            {task.title}
                          </div>
                          <div className="text-[10px] text-muted-foreground flex items-center gap-1 mt-1 font-mono-numbers">
                            <Clock className="w-3 h-3 text-primary" /> {task.sets_reps}
                          </div>
                          {task.rationale && (
                            <div className="text-[10px] text-muted-foreground mt-2 bg-secondary/35 p-2.5 rounded border border-border/50 leading-relaxed">
                              <strong className="text-primary font-bold mr-1">Rationale:</strong>
                              {task.rationale}
                            </div>
                          )}
                        </div>
                        {!completed && (
                          <button className="btn-secondary px-2.5 py-1 text-[10px] font-bold flex items-center gap-1 shrink-0 ml-3 self-center">
                            <Play className="w-2.5 h-2.5" /> Start
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Sidebar Area */}
            <div className="space-y-6">
              <div className="card">
                <h3 className="font-bold mb-4">Core Rehab Library</h3>
                <div className="space-y-4">
                  {[
                    { title: "Hip Abductor Conditioning", level: "Beginner", duration: "4 Weeks" },
                    { title: "Vastus Medialis Oblique (VMO) Activation", level: "Intermediate", duration: "2 Weeks" },
                    { title: "Posterior Chain Recruitment", level: "Advanced", duration: "8 Weeks" }
                  ].map((prog, i) => (
                    <div key={i} className="group flex items-center justify-between p-3 rounded-lg border border-border hover:border-primary/50 hover:bg-primary/5 cursor-pointer transition-colors">
                      <div>
                        <div className="font-semibold text-sm group-hover:text-primary transition-colors">{prog.title}</div>
                        <div className="text-xs text-muted-foreground mt-0.5">{prog.level} • {prog.duration}</div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary" />
                    </div>
                  ))}
                </div>
                <button className="btn-secondary w-full mt-4 text-sm">Browse Movement Library</button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

