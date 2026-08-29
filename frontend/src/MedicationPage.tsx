import React, { useState, useEffect } from "react";
import { Sidebar } from "./components/Sidebar";
import { Pill, CheckCircle2, Circle, AlertCircle, PlusCircle, Trash2, X, Activity } from "lucide-react";
import { api } from "./api";
import { auth } from "./firebase";

interface Medication {
  id: string;
  name: string;
  dosage: string;
  time_of_day: string;
  type: "medication" | "supplement";
  taken: boolean;
  last_taken_at: string | null;
}

export default function MedicationPage() {
  const [meds, setMeds] = useState<Medication[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name: "", dosage: "", time_of_day: "", type: "supplement" });
  const [saving, setSaving] = useState(false);

  const uid = auth.currentUser?.uid || "test-user";

  useEffect(() => {
    api.getMedications(uid)
      .then(setMeds)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [uid]);

  const toggleMed = async (medId: string) => {
    try {
      const updated = await api.toggleMedication(medId);
      setMeds(prev => prev.map(m => m.id === medId ? { ...m, taken: updated.taken } : m));
    } catch (e) {
      console.error("Failed to toggle medication", e);
    }
  };

  const deleteMed = async (medId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await api.deleteMedication(medId);
      setMeds(prev => prev.filter(m => m.id !== medId));
    } catch (e) {
      console.error("Failed to delete medication", e);
    }
  };

  const addMed = async () => {
    if (!form.name || !form.dosage || !form.time_of_day) return;
    setSaving(true);
    try {
      const created = await api.addMedication(uid, {
        name: form.name,
        dosage: form.dosage,
        time_of_day: form.time_of_day,
        type: form.type,
      });
      setMeds(prev => [...prev, created]);
      setForm({ name: "", dosage: "", time_of_day: "", type: "supplement" });
      setShowAdd(false);
    } catch (e) {
      console.error("Failed to add medication", e);
    } finally {
      setSaving(false);
    }
  };

  const takenCount = meds.filter(m => m.taken).length;
  const progress = meds.length > 0 ? Math.round((takenCount / meds.length) * 100) : 0;

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
          <button
            onClick={() => setShowAdd(true)}
            className="btn-primary flex items-center gap-2 px-4 py-2"
          >
            <PlusCircle className="w-4 h-4" /> Add Protocol
          </button>
        </header>

        {/* Add Modal */}
        {showAdd && (
          <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => setShowAdd(false)}>
            <div className="card w-full max-w-md space-y-4" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-lg">Add Medication / Supplement</h3>
                <button onClick={() => setShowAdd(false)}><X className="w-5 h-5" /></button>
              </div>
              <div className="space-y-3">
                <input
                  placeholder="Name (e.g. Ibuprofen)"
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm"
                />
                <input
                  placeholder="Dosage (e.g. 400mg)"
                  value={form.dosage}
                  onChange={e => setForm(f => ({ ...f, dosage: e.target.value }))}
                  className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm"
                />
                <input
                  placeholder="Time (e.g. Morning w/ food)"
                  value={form.time_of_day}
                  onChange={e => setForm(f => ({ ...f, time_of_day: e.target.value }))}
                  className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm"
                />
                <select
                  value={form.type}
                  onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
                  className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm"
                >
                  <option value="supplement">Supplement</option>
                  <option value="medication">Medication</option>
                </select>
              </div>
              <button
                onClick={addMed}
                disabled={saving || !form.name}
                className="btn-primary w-full"
              >
                {saving ? "Adding..." : "Add to Protocol"}
              </button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            {/* Progress */}
            <div className="card space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold">Today's Adherence</span>
                <span className="font-mono-numbers text-primary font-bold">{progress}%</span>
              </div>
              <div className="h-3 w-full bg-border rounded-full overflow-hidden">
                <div className="h-full bg-primary transition-all duration-500" style={{ width: `${progress}%` }} />
              </div>
              <p className="text-xs text-muted-foreground">{takenCount} of {meds.length} taken today</p>
            </div>

            <h3 className="font-bold text-lg pt-2">Today's Schedule</h3>

            {loading && (
              <div className="card text-center text-muted-foreground py-10">Loading medications...</div>
            )}

            {!loading && meds.length === 0 && (
              <div className="card text-center py-12 space-y-3">
                <Pill className="w-10 h-10 text-muted-foreground mx-auto" />
                <p className="text-muted-foreground">No medications added yet.</p>
                <button onClick={() => setShowAdd(true)} className="btn-primary mx-auto flex items-center gap-2 px-4 py-2">
                  <PlusCircle className="w-4 h-4" /> Add Your First Protocol
                </button>
              </div>
            )}

            <div className="space-y-3">
              {meds.map(med => (
                <div
                  key={med.id}
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
                      {med.dosage} • {med.time_of_day}
                    </div>
                  </div>
                  <button
                    onClick={(e) => deleteMed(med.id, e)}
                    className="ml-3 p-1.5 rounded hover:bg-red-500/10 text-muted-foreground hover:text-red-400 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-6">
            {meds.length > 0 && (
              <div className="card bg-amber-500/10 border-amber-500/20">
                <h3 className="font-bold text-amber-500 flex items-center gap-2 mb-2">
                  <AlertCircle className="w-4 h-4" /> Pharmacological Reasoning
                </h3>
                {meds.some(m => m.name.toLowerCase().includes("ibuprofen") || m.name.toLowerCase().includes("nsaid")) ? (
                  <p className="text-sm text-amber-500/90 leading-relaxed">
                    You are currently taking NSAIDs. Prolonged use post-surgery can inhibit macrophage activity and slow collagen synthesis. Consider transitioning to acetaminophen as acute inflammation subsides.
                  </p>
                ) : (
                  <p className="text-sm text-amber-500/90 leading-relaxed">
                    Always take medications as directed by your physiotherapist. Supplement timing relative to workouts can impact recovery efficiency.
                  </p>
                )}
              </div>
            )}

            <div className="card space-y-3">
              <div className="flex items-center gap-2 border-b border-border pb-2 mb-2">
                <Activity className="w-4 h-4 text-primary" />
                <h3 className="font-bold">Adherence Summary</h3>
              </div>
              <div className="text-sm text-muted-foreground space-y-2">
                <div className="flex justify-between">
                  <span>Total protocols</span>
                  <span className="font-bold text-foreground">{meds.length}</span>
                </div>
                <div className="flex justify-between">
                  <span>Medications</span>
                  <span className="font-bold text-foreground">{meds.filter(m => m.type === 'medication').length}</span>
                </div>
                <div className="flex justify-between">
                  <span>Supplements</span>
                  <span className="font-bold text-foreground">{meds.filter(m => m.type === 'supplement').length}</span>
                </div>
                <div className="flex justify-between">
                  <span>Today's progress</span>
                  <span className={`font-bold ${progress === 100 ? 'text-emerald-400' : progress >= 50 ? 'text-yellow-400' : 'text-red-400'}`}>{progress}%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
