import React, { useState } from "react";
import { Sidebar } from "./components/Sidebar";
import { Pill, CheckCircle2, Circle, AlertCircle, PlusCircle, Activity } from "lucide-react";

export default function MedicationPage() {
  const [meds, setMeds] = useState([
    { id: 1, name: "Ibuprofen (NSAID)", dosage: "400mg", time: "Morning w/ food", type: "medication", taken: true },
    { id: 2, name: "Collagen Peptides", dosage: "20g", time: "Morning", type: "supplement", taken: true },
    { id: 3, name: "Vitamin D3", dosage: "5000 IU", time: "Morning", type: "supplement", taken: true },
    { id: 4, name: "Ibuprofen (NSAID)", dosage: "400mg", time: "Evening w/ food", type: "medication", taken: false },
    { id: 5, name: "Whey Protein", dosage: "30g", time: "Post-workout", type: "supplement", taken: false },
  ]);

  const toggleMed = (id: number) => {
    setMeds(meds.map(m => m.id === id ? { ...m, taken: !m.taken } : m));
  };

  const takenCount = meds.filter(m => m.taken).length;
  const progress = Math.round((takenCount / meds.length) * 100);

  return (
    <div className="flex flex-col md:flex-row min-h-screen text-foreground md:overflow-hidden pb-[72px] md:pb-0 bg-background">
      <Sidebar />
      <main className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6">
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black flex items-center gap-2">
              <Pill className="w-6 h-6 text-primary" /> Medications & Supplements
            </h1>
            <p className="text-muted-foreground text-sm mt-1">Track your daily adherence to support tissue recovery.</p>
          </div>
          <button className="btn-primary flex items-center gap-2 px-4 py-2">
            <PlusCircle className="w-4 h-4" /> Add Protocol
          </button>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          <div className="lg:col-span-2 space-y-4">
            
            <div className="card space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold">Today's Adherence</span>
                <span className="font-mono-numbers text-primary font-bold">{progress}%</span>
              </div>
              <div className="h-3 w-full bg-border rounded-full overflow-hidden">
                <div className="h-full bg-primary transition-all duration-500" style={{ width: `${progress}%` }} />
              </div>
            </div>

            <h3 className="font-bold text-lg pt-2">Today's Schedule</h3>
            <div className="space-y-3">
              {meds.map(med => (
                <div key={med.id} 
                  onClick={() => toggleMed(med.id)}
                  className={`card flex items-center p-4 transition-colors hover:border-primary/50 cursor-pointer ${med.taken ? 'opacity-70 bg-card/50' : 'border-border'}`}
                >
                  {med.taken ? (
                    <CheckCircle2 className="w-6 h-6 text-emerald-500 mr-4 shrink-0" />
                  ) : (
                    <Circle className="w-6 h-6 text-muted-foreground mr-4 shrink-0" />
                  )}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`font-semibold ${med.taken ? 'line-through text-muted-foreground' : ''}`}>{med.name}</span>
                      <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded ${med.type === 'medication' ? 'bg-red-500/10 text-red-400' : 'bg-blue-500/10 text-blue-400'}`}>
                        {med.type}
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {med.dosage} • {med.time}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-6">
            
            <div className="card space-y-3">
              <div className="flex items-center justify-between border-b border-border pb-2 mb-2">
                <h3 className="font-bold flex items-center gap-2 text-emerald-400">
                  <Activity className="w-4 h-4" /> HealthifyMe Nutrition
                </h3>
                <span className="text-[10px] text-muted-foreground uppercase tracking-widest">Live</span>
              </div>
              
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Protein (Tissue Repair)</span>
                  <span className="font-bold font-mono-numbers">165g <span className="text-muted-foreground text-xs font-normal">/ 180g</span></span>
                </div>
                <div className="h-1.5 w-full bg-border rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500" style={{ width: '91%' }} />
                </div>
              </div>
              
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Carbs (Energy/Glycogen)</span>
                  <span className="font-bold font-mono-numbers">210g <span className="text-muted-foreground text-xs font-normal">/ 250g</span></span>
                </div>
                <div className="h-1.5 w-full bg-border rounded-full overflow-hidden">
                  <div className="h-full bg-blue-400" style={{ width: '84%' }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Fats (Hormone Health)</span>
                  <span className="font-bold font-mono-numbers">65g <span className="text-muted-foreground text-xs font-normal">/ 70g</span></span>
                </div>
                <div className="h-1.5 w-full bg-border rounded-full overflow-hidden">
                  <div className="h-full bg-orange-400" style={{ width: '92%' }} />
                </div>
              </div>
            </div>

            <div className="card bg-amber-500/10 border-amber-500/20">
              <h3 className="font-bold text-amber-500 flex items-center gap-2 mb-2">
                <AlertCircle className="w-4 h-4" /> Pharmacological Reasoning
              </h3>
              <p className="text-sm text-amber-500/90 leading-relaxed">
                You are currently taking NSAIDs (Ibuprofen). Prolonged use of anti-inflammatories post-surgery can inhibit macrophage activity and slow down collagen synthesis. Consider transitioning to acetaminophen for pain management as acute inflammation subsides.
              </p>
            </div>

            <div className="card space-y-4">
              <h3 className="font-bold flex items-center gap-2">
                <Activity className="w-4 h-4 text-primary" /> Weekly Adherence
              </h3>
              <div className="flex justify-between items-end h-24 pt-4 border-b border-border pb-2">
                {[100, 80, 100, 60, 100, 100, progress].map((val, i) => (
                  <div key={i} className="w-6 bg-primary/20 rounded-t-sm relative group flex flex-col justify-end h-full">
                    <div className="bg-primary rounded-t-sm w-full transition-all" style={{ height: `${val}%` }} />
                  </div>
                ))}
              </div>
              <div className="flex justify-between text-[10px] text-muted-foreground font-semibold">
                <span>M</span><span>T</span><span>W</span><span>T</span><span>F</span><span>S</span><span>S</span>
              </div>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
