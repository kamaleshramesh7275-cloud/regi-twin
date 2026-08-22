import React from "react";
import { Sidebar } from "./components/Sidebar";
import { ClipboardList, CheckCircle2, Circle, Clock, ChevronRight, Play } from "lucide-react";

export default function ProgramsPage() {
  const currentProgram = {
    title: "6-Week Knee Stabilization Protocol",
    week: 3,
    progress: 45,
    todayTasks: [
      { id: 1, title: "Warm-up: Stationary Bike", duration: "10 min", completed: true, rationale: "Increases synovial fluid production to lubricate the joint capsule." },
      { id: 2, title: "Bodyweight Squats", duration: "3x10 reps", completed: true, rationale: "Builds quadriceps capacity, acting as the primary shock absorber for the ACL." },
      { id: 3, title: "Single-leg Romanian Deadlifts", duration: "3x8 reps/leg", completed: false, rationale: "Addresses hamstrings-to-quads strength asymmetry." },
      { id: 4, title: "Banded Lateral Walks", duration: "2x15 steps/side", completed: false, rationale: "Fires the gluteus medius to prevent knee valgus during jumping." },
      { id: 5, title: "Cool-down Stretches", duration: "5 min", completed: false, rationale: "Maintains tissue length and prevents scar tissue (arthrofibrosis)." },
    ]
  };

  return (
    <div className="flex flex-col md:flex-row min-h-screen text-foreground md:overflow-hidden pb-[72px] md:pb-0 bg-background">
      <Sidebar />
      <main className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6">
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black flex items-center gap-2">
              <ClipboardList className="w-6 h-6 text-primary" /> Active Programs
            </h1>
            <p className="text-muted-foreground text-sm mt-1">Track your structured rehabilitation and fitness plans.</p>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Current Program Card */}
          <div className="lg:col-span-2 space-y-6">
            <div className="card border-primary/20 bg-primary/5">
              <div className="flex items-center justify-between mb-4">
                <span className="badge badge-blue">Physical Therapy</span>
                <span className="text-xs font-bold text-muted-foreground">Week {currentProgram.week} of 6</span>
              </div>
              <h2 className="text-xl font-bold mb-2">{currentProgram.title}</h2>
              
              <div className="mt-6 mb-2 flex justify-between text-sm">
                <span className="font-semibold">Overall Progress</span>
                <span className="font-mono-numbers">{currentProgram.progress}%</span>
              </div>
              <div className="h-2 w-full bg-border rounded-full overflow-hidden">
                <div className="h-full bg-primary" style={{ width: `${currentProgram.progress}%` }} />
              </div>
            </div>

            <h3 className="text-lg font-bold mt-8 mb-4">Today's Session</h3>
            <div className="space-y-3">
              {currentProgram.todayTasks.map((task) => (
                <div key={task.id} className={`card flex items-center p-4 transition-colors hover:bg-card/80 cursor-pointer ${task.completed ? 'opacity-70' : ''}`}>
                  {task.completed ? (
                    <CheckCircle2 className="w-6 h-6 text-emerald-500 mr-4 shrink-0" />
                  ) : (
                    <Circle className="w-6 h-6 text-muted-foreground mr-4 shrink-0" />
                  )}
                  <div className="flex-1">
                    <div className={`font-semibold ${task.completed ? 'line-through text-muted-foreground' : ''}`}>{task.title}</div>
                    <div className="text-xs text-muted-foreground flex items-center gap-1 mt-1 font-mono-numbers">
                      <Clock className="w-3 h-3" /> {task.duration}
                    </div>
                    <div className="text-[10px] text-muted-foreground mt-2 bg-secondary/20 p-2 rounded border border-border/50">
                      <strong className="text-primary mr-1">Why this matters:</strong>
                      {task.rationale}
                    </div>
                  </div>
                  {!task.completed && (
                    <button className="btn-secondary px-3 py-1.5 text-xs flex items-center gap-1">
                      <Play className="w-3 h-3" /> Start
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Sidebar Area */}
          <div className="space-y-6">
            <div className="card">
              <h3 className="font-bold mb-4">Available Programs</h3>
              <div className="space-y-4">
                {[
                  { title: "Core Fundamentals", level: "Beginner", duration: "4 Weeks" },
                  { title: "Shoulder Mobility", level: "Intermediate", duration: "2 Weeks" },
                  { title: "Return to Running", level: "Advanced", duration: "8 Weeks" }
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
              <button className="btn-secondary w-full mt-4 text-sm">Browse All Programs</button>
            </div>
          </div>
          
        </div>
      </main>
    </div>
  );
}
