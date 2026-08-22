import React, { useState, useRef } from "react";
import { Sidebar } from "./components/Sidebar";
import { Building, FileText, Send, UserCheck, Calendar, Shield, Share2, UploadCloud, CheckCircle2, Loader2, AlertCircle } from "lucide-react";
import { useAuth } from "./context/AuthContext";
import { api } from "./api";
import { Link } from "wouter";

export default function ClinicPage() {
  const { user } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [finding, setFinding] = useState<any>(null);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Therapist Notes States
  const [caseNotes, setCaseNotes] = useState<any[]>([]);
  const [noteText, setNoteText] = useState("");
  const [savingNote, setSavingNote] = useState(false);

  const fetchNotes = async () => {
    try {
      const uid = user?.uid || "test-user";
      const notes = await api.getCaseNotes(uid);
      setCaseNotes(notes);
    } catch (e) {
      console.error(e);
    }
  };

  React.useEffect(() => {
    if (user) {
      fetchNotes();
    }
  }, [user]);

  const handleAddNote = async () => {
    if (!noteText.trim() || !user) return;
    setSavingNote(true);
    try {
      await api.createCaseNote(user.uid, noteText);
      setNoteText("");
      await fetchNotes();
    } catch (e) {
      console.error(e);
    } finally {
      setSavingNote(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setFinding(null);
      setError("");
    }
  };

  const handleUpload = async () => {
    if (!file || !user) return;
    setIsUploading(true);
    setError("");
    try {
      const result = await api.uploadMedicalReport(user.uid, file);
      setFinding(result.finding);
      setFile(null);
    } catch (err: any) {
      setError("Failed to process medical report. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="flex flex-col md:flex-row min-h-screen text-foreground md:overflow-hidden pb-[72px] md:pb-0 bg-background">
      <Sidebar />
      <main className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6">
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black flex items-center gap-2">
              <Building className="w-6 h-6 text-primary" /> Clinic Portal
            </h1>
            <p className="text-muted-foreground text-sm mt-1">Manage data sharing and import external medical records.</p>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/clinic/roster" className="btn-secondary flex items-center gap-2 px-4 py-2 text-sm">
              <UserCheck className="w-4 h-4" /> Patient Roster
            </Link>
            <button className="btn-primary flex items-center gap-2 px-4 py-2 text-sm">
              <Share2 className="w-4 h-4" /> Share Access
            </button>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          <div className="space-y-6">
            {/* Upload Medical Report */}
            <div className="card space-y-4">
              <h3 className="font-bold text-lg flex items-center gap-2">
                <UploadCloud className="w-5 h-5 text-primary" /> AI Report Analysis
              </h3>
              <p className="text-sm text-muted-foreground">Upload your MRI reports, X-Rays, or doctor's notes. Our AI will extract diagnoses and update your Digital Twin risk profile automatically.</p>
              
              {!finding ? (
                <div className="border-2 border-dashed border-border hover:border-primary/50 transition-colors rounded-xl p-8 text-center bg-card/50">
                  <input 
                    type="file" 
                    className="hidden" 
                    ref={fileInputRef} 
                    onChange={handleFileChange} 
                    accept="image/*,.pdf"
                  />
                  {!file ? (
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-secondary/50 flex items-center justify-center">
                        <FileText className="w-6 h-6 text-muted-foreground" />
                      </div>
                      <div>
                        <button onClick={() => fileInputRef.current?.click()} className="text-primary font-semibold hover:underline">Click to upload</button>
                        <span className="text-muted-foreground text-sm ml-1">or drag and drop</span>
                      </div>
                      <p className="text-xs text-muted-foreground">PDF, JPG, PNG (max. 10MB)</p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-4">
                      <div className="font-semibold text-sm bg-secondary px-4 py-2 rounded-full">
                        {file.name}
                      </div>
                      <div className="flex gap-2 w-full">
                        <button onClick={() => setFile(null)} className="btn flex-1 bg-secondary text-secondary-foreground" disabled={isUploading}>Cancel</button>
                        <button onClick={handleUpload} className="btn btn-primary flex-1 flex items-center justify-center gap-2" disabled={isUploading}>
                          {isUploading ? <><Loader2 className="w-4 h-4 animate-spin" /> Processing AI...</> : 'Analyze Report'}
                        </button>
                      </div>
                    </div>
                  )}
                  {error && <div className="text-destructive text-sm mt-4">{error}</div>}
                </div>
              ) : (
                <div className="border border-emerald-500/30 bg-emerald-500/10 rounded-xl p-6 anim-fade">
                  <div className="flex items-center gap-3 mb-4">
                    <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                    <h4 className="font-bold text-emerald-500">Analysis Complete</h4>
                  </div>
                  <div className="space-y-3 mb-6">
                    <div className="flex justify-between items-center pb-2 border-b border-border/50">
                      <span className="text-sm text-muted-foreground">Detected Condition</span>
                      <span className="font-semibold text-sm">{finding.condition}</span>
                    </div>
                    <div className="flex justify-between items-center pb-2 border-b border-border/50">
                      <span className="text-sm text-muted-foreground">Affected Zone</span>
                      <span className="font-semibold text-sm capitalize">{finding.zone.replace('_', ' ')}</span>
                    </div>
                    <div className="flex justify-between items-center pb-2 border-b border-border/50">
                      <span className="text-sm text-muted-foreground">Assessed Risk Severity</span>
                      <span className="font-semibold text-sm text-red-400">{finding.severity}%</span>
                    </div>
                    <div className="pt-2">
                      <span className="text-sm text-muted-foreground block mb-1">Recommendation</span>
                      <span className="font-medium text-sm leading-relaxed">{finding.recommendation}</span>
                    </div>
                  </div>
                  <Link href="/twin" className="btn btn-primary w-full text-center block">View Updated Twin</Link>
                </div>
              )}
            </div>

            {/* Active Providers */}
            <div className="card space-y-4">
              <h3 className="font-bold text-lg flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-primary" /> Authorized Providers
              </h3>
              <p className="text-sm text-muted-foreground">The following providers currently have read-only access to your Digital Twin data.</p>
              
              <div className="space-y-3 mt-4">
                <div className="border border-border rounded-lg p-4 flex items-center justify-between bg-card/50">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center font-bold text-sm">
                      dr
                    </div>
                    <div>
                      <div className="font-semibold">Dr. Robert Chen, MD</div>
                      <div className="text-xs text-muted-foreground">Orthopedic Surgeon • Apex Sports Medicine</div>
                    </div>
                  </div>
                  <button className="text-xs font-semibold text-destructive hover:bg-destructive/10 px-3 py-1.5 rounded transition-colors">
                    Revoke
                  </button>
                </div>

                <div className="border border-border rounded-lg p-4 flex items-center justify-between bg-card/50">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center font-bold text-sm">
                      pt
                    </div>
                    <div>
                      <div className="font-semibold">Sarah Jenkins, DPT</div>
                      <div className="text-xs text-muted-foreground">Physical Therapist • Kinetic Rehab</div>
                    </div>
                  </div>
                  <button className="text-xs font-semibold text-destructive hover:bg-destructive/10 px-3 py-1.5 rounded transition-colors">
                    Revoke
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Provider Notes & Reports */}
          <div className="space-y-6">
            <div className="card space-y-4">
              <h3 className="font-bold text-lg flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" /> Clinical Reports
              </h3>
              <p className="text-sm text-muted-foreground">Generate and print dynamic styled summaries of your range of motion, symmetry, and logged pain history.</p>
              
              <div className="mt-4">
                <a 
                  href={`http://localhost:8000/analytics/report/pdf/${user?.uid || "test-user"}`}
                  target="_blank" 
                  rel="noreferrer"
                  className="btn-primary w-full text-center flex items-center justify-center gap-2 py-3 font-semibold text-sm cursor-pointer"
                >
                  <FileText className="w-4.5 h-4.5" /> Print Biomechanical Report
                </a>
              </div>
            </div>

            {/* Therapist Case Notes Widget */}
            <div className="card space-y-4">
              <h3 className="font-bold text-lg flex items-center gap-2">
                <Send className="w-5 h-5 text-primary" /> AI Case Notes & Clinical Flags
              </h3>
              <p className="text-sm text-muted-foreground">Add therapist case notes directly. These are stored in the database and fed into the Twin's LLM context so the AI remembers clinical status.</p>
              
              <div className="space-y-3">
                <textarea 
                  value={noteText}
                  onChange={e => setNoteText(e.target.value)}
                  placeholder="e.g. Patient displays mild kinesiophobia in knee flexion, limit single-leg explosive drills."
                  className="w-full h-20 bg-secondary text-foreground text-xs rounded-xl p-3 focus:outline-none focus:ring-1 focus:ring-primary border border-border resize-none"
                />
                <button
                  onClick={handleAddNote}
                  disabled={savingNote || !noteText.trim()}
                  className="btn-primary w-full py-2 text-xs font-bold disabled:opacity-50"
                >
                  {savingNote ? "Saving Note..." : "Add Case Note"}
                </button>
              </div>

              <div className="space-y-2 mt-4 max-h-60 overflow-y-auto">
                <div className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2">Logged Notes History</div>
                {caseNotes.length === 0 ? (
                  <div className="text-xs text-muted-foreground italic py-2 text-center">No case notes logged.</div>
                ) : (
                  caseNotes.map((n, i) => (
                    <div key={i} className="p-3 bg-secondary/35 rounded-lg border border-border/50 text-xs">
                      <div className="text-muted-foreground text-[10px] mb-1">
                        {new Date(n.timestamp).toLocaleString()}
                      </div>
                      <p className="leading-relaxed text-foreground font-medium">{n.note}</p>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="card bg-secondary/10 border-primary/20">
              <div className="flex items-start gap-3">
                <Shield className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <div>
                  <div className="font-semibold text-sm">HIPAA Compliant Sharing</div>
                  <div className="text-xs text-muted-foreground mt-1 leading-relaxed">
                    Your data is end-to-end encrypted. Providers can only view your data when explicitly authorized. You can revoke access at any time.
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
