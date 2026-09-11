import React, { useState, useEffect, useRef } from "react";
import { Sidebar } from "./components/Sidebar";
import {
  Building,
  FileText,
  Send,
  UserCheck,
  Calendar,
  Shield,
  Share2,
  UploadCloud,
  CheckCircle2,
  Loader2,
  AlertCircle,
  TrendingUp,
  Sparkles,
  Bell,
  RefreshCw,
  Clock,
  ChevronRight,
  Database,
  Trash2,
  FileUp
} from "lucide-react";
import { useAuth } from "./context/AuthContext";
import { api } from "./api";
import { Link } from "wouter";
import { ReportReviewQueue, type ExtractedMetric } from "./components/ReportReviewQueue";
import { PredictiveTrendsView, type MetricTrendItem } from "./components/PredictiveTrendsView";
import { ClinicalAlertsDrawer, type ClinicalAlertItem } from "./components/ClinicalAlertsDrawer";

export default function ClinicPage() {
  const { user } = useAuth();
  const userId = user?.uid || "test-user";
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Active Tab: 'ocr' | 'trends' | 'alerts' | 'providers'
  const [activeTab, setActiveTab] = useState<"ocr" | "trends" | "alerts" | "providers">("ocr");

  // Upload & Review Queue States
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [labNameInput, setLabNameInput] = useState<string>("");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string>("");
  const [activeReviewReport, setActiveReviewReport] = useState<{
    id: string;
    filename: string;
    reportDate?: string;
    labName?: string;
    metrics: ExtractedMetric[];
  } | null>(null);
  const [isConfirming, setIsConfirming] = useState(false);
  const [reportsList, setReportsList] = useState<any[]>([]);
  const [isLoadingReports, setIsLoadingReports] = useState(false);

  // Digital Twin Trends & Alerts States
  const [metricTrends, setMetricTrends] = useState<MetricTrendItem[]>([]);
  const [isLoadingTrends, setIsLoadingTrends] = useState(false);
  const [alerts, setAlerts] = useState<ClinicalAlertItem[]>([]);
  const [isLoadingAlerts, setIsLoadingAlerts] = useState(false);
  const [isSeedingDemo, setIsSeedingDemo] = useState(false);

  // Therapist Notes States (Preserved)
  const [caseNotes, setCaseNotes] = useState<any[]>([]);
  const [noteText, setNoteText] = useState("");
  const [savingNote, setSavingNote] = useState(false);

  // Data Fetching
  const fetchAllData = async () => {
    setIsLoadingReports(true);
    setIsLoadingTrends(true);
    setIsLoadingAlerts(true);
    try {
      const [reports, trendsData, alertsData, notes] = await Promise.all([
        api.getClinicReports(userId).catch(() => []),
        api.getClinicMetricTrends(userId).catch(() => ({ metrics: [] })),
        api.getClinicNotifications(userId).catch(() => []),
        api.getCaseNotes(userId).catch(() => [])
      ]);

      setReportsList(reports || []);
      setMetricTrends(trendsData?.metrics || []);
      setAlerts(alertsData || []);
      setCaseNotes(notes || []);

      // If there is any pending report, auto-stage it in the review queue if none is open
      if (!activeReviewReport) {
        const pending = (reports || []).find((r: any) => r.status === "pending_review");
        if (pending && pending.metrics && pending.metrics.length > 0) {
          setActiveReviewReport({
            id: pending.id,
            filename: pending.filename,
            reportDate: pending.report_date,
            labName: pending.lab_name,
            metrics: pending.metrics
          });
        }
      }
    } catch (err) {
      console.error("Error loading clinic data:", err);
    } finally {
      setIsLoadingReports(false);
      setIsLoadingTrends(false);
      setIsLoadingAlerts(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, [userId]);

  // Handle OCR Document Upload
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
      setUploadError("");
    }
  };

  const handleUploadReport = async () => {
    if (!selectedFile) return;
    setIsUploading(true);
    setUploadError("");
    try {
      const res = await api.uploadClinicReport(
        userId,
        selectedFile,
        labNameInput || "Diagnostic Laboratory",
        "lab_panel"
      );

      // Open in Review Queue
      setActiveReviewReport({
        id: res.report_id,
        filename: res.filename || selectedFile.name,
        reportDate: res.report_date,
        labName: labNameInput || "Diagnostic Laboratory",
        metrics: res.parsed_metrics || []
      });

      setSelectedFile(null);
      setLabNameInput("");
      await fetchAllData();
    } catch (err: any) {
      setUploadError(err.message || "Failed to process document OCR. Please check file format.");
    } finally {
      setIsUploading(false);
    }
  };

  // Handle Human-in-the-loop Ingestion Confirmation
  const handleConfirmReview = async (confirmedMetrics: ExtractedMetric[], notes?: string) => {
    if (!activeReviewReport) return;
    setIsConfirming(true);
    try {
      await api.confirmClinicReport(activeReviewReport.id, {
        confirmed_metrics: confirmedMetrics.map(m => ({
          metric_key: m.metric_key,
          canonical_name: m.canonical_name || m.display_name || m.metric_key,
          value: Number(m.value),
          unit: m.unit,
          ref_low: m.ref_low !== undefined ? m.ref_low : (m.ref_min ?? null),
          ref_high: m.ref_high !== undefined ? m.ref_high : (m.ref_max ?? null),
          status: m.status || "normal",
          confidence: m.confidence || "high",
          confidence_score: m.confidence_score || 0.95
        })),
        notes: notes || "Confirmed via Human-in-the-loop Review Queue"
      });

      setActiveReviewReport(null);
      await fetchAllData();
      setActiveTab("trends"); // Switch to trends view to show updated Digital Twin
    } catch (err: any) {
      console.error("Failed to confirm report:", err);
      alert("Error ingesting report metrics into Digital Twin: " + (err.message || "Unknown error"));
    } finally {
      setIsConfirming(false);
    }
  };

  // Handle Seed Demo Data
  const handleSeedDemoData = async () => {
    setIsSeedingDemo(true);
    try {
      await api.seedClinicDemo(userId);
      await fetchAllData();
      setActiveTab("trends");
    } catch (err: any) {
      console.error("Failed to seed demo data:", err);
    } finally {
      setIsSeedingDemo(false);
    }
  };

  // Handle Delete Report
  const handleDeleteReport = async (reportId: string) => {
    if (!confirm("Are you sure you want to remove this clinical report record?")) return;
    try {
      await api.deleteClinicReport(reportId);
      if (activeReviewReport?.id === reportId) {
        setActiveReviewReport(null);
      }
      await fetchAllData();
    } catch (err) {
      console.error(err);
    }
  };

  // Handle Mark Alert Read
  const handleMarkAlertRead = async (alertId: string | number) => {
    try {
      await api.markClinicNotificationRead(alertId);
      setAlerts(prev => prev.map(a => a.id === alertId ? { ...a, is_read: true } : a));
    } catch (err) {
      console.error(err);
    }
  };

  // Handle Therapist Case Note Add (Preserved)
  const handleAddNote = async () => {
    if (!noteText.trim()) return;
    setSavingNote(true);
    try {
      await api.createCaseNote(userId, noteText);
      setNoteText("");
      const notes = await api.getCaseNotes(userId);
      setCaseNotes(notes);
    } catch (e) {
      console.error(e);
    } finally {
      setSavingNote(false);
    }
  };

  const unreadAlertsCount = alerts.filter(a => !a.is_read).length;

  return (
    <div className="flex flex-col md:flex-row min-h-screen text-foreground md:overflow-hidden pb-24 md:pb-0 bg-background">
      <Sidebar />
      <main className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 space-y-6">
        {/* Header (Preserving navigation & routing buttons) */}
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-2 border-b border-border/50">
          <div>
            <h1 className="text-2xl font-black flex items-center gap-2">
              <Building className="w-6 h-6 text-primary" /> Clinic Portal
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              OCR Lab Extraction, Human-in-the-Loop Review & Longitudinal Predictive Forecasting
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
            <button
              onClick={handleSeedDemoData}
              disabled={isSeedingDemo}
              className="btn-secondary flex items-center gap-2 px-3 py-2 text-xs font-semibold hover:border-primary/50 transition-colors cursor-pointer"
              title="Load 6 months of historical lab panels (Glucose, Lipids, HbA1c, Vit D) for testing"
            >
              {isSeedingDemo ? <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" /> : <Sparkles className="w-3.5 h-3.5 text-primary" />}
              Seed 6-Mo Lab Demo
            </button>
            <Link href="/clinic/roster" className="btn-secondary flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold">
              <UserCheck className="w-3.5 h-3.5" /> Patient Roster
            </Link>
            <button className="btn-primary flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold cursor-pointer">
              <Share2 className="w-3.5 h-3.5" /> Share Access
            </button>
          </div>
        </header>

        {/* Tab Navigation Navigation Bar */}
        <div className="flex flex-wrap items-center gap-2 border-b border-border/70 pb-3">
          <button
            onClick={() => setActiveTab("ocr")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === "ocr"
                ? "bg-primary text-primary-foreground shadow-md shadow-primary/25"
                : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
            }`}
          >
            <FileUp className="w-4 h-4" /> OCR Ingestion & Review Queue
            {reportsList.filter(r => r.status === "pending_review").length > 0 && (
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            )}
          </button>

          <button
            onClick={() => setActiveTab("trends")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === "trends"
                ? "bg-primary text-primary-foreground shadow-md shadow-primary/25"
                : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
            }`}
          >
            <TrendingUp className="w-4 h-4" /> Digital Twin Biomarker Trends ({metricTrends.length})
          </button>

          <button
            onClick={() => setActiveTab("alerts")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === "alerts"
                ? "bg-primary text-primary-foreground shadow-md shadow-primary/25"
                : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
            }`}
          >
            <Bell className="w-4 h-4" /> Clinical Alerts & Flags
            {unreadAlertsCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-amber-500 text-black">
                {unreadAlertsCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab("providers")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === "providers"
                ? "bg-primary text-primary-foreground shadow-md shadow-primary/25"
                : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
            }`}
          >
            <UserCheck className="w-4 h-4" /> Providers & Case Notes
          </button>
        </div>

        {/* TAB 1: OCR Ingestion & Review Queue */}
        {activeTab === "ocr" && (
          <div className="space-y-6">
            {/* If there is an active report open for review */}
            {activeReviewReport ? (
              <ReportReviewQueue
                reportId={activeReviewReport.id}
                filename={activeReviewReport.filename}
                reportDate={activeReviewReport.reportDate}
                labName={activeReviewReport.labName}
                initialMetrics={activeReviewReport.metrics}
                onConfirm={handleConfirmReview}
                onCancel={() => setActiveReviewReport(null)}
                isConfirming={isConfirming}
              />
            ) : (
              /* Dropzone Upload Section */
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 card space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-lg flex items-center gap-2">
                      <UploadCloud className="w-5 h-5 text-primary" /> Upload Clinical Document (PDF / Scan)
                    </h3>
                    <span className="text-[11px] font-medium px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      PyMuPDF + EasyOCR Engine
                    </span>
                  </div>

                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Upload laboratory blood work, metabolic panels, or pathology PDFs. The OCR pipeline extracts raw lines, bounding boxes, and lab bounds into the <strong>Human-in-the-Loop Review Queue</strong> with zero auto-commit to the digital twin.
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                    <div>
                      <label className="text-xs font-semibold text-muted-foreground block mb-1">Diagnostic Laboratory (Optional)</label>
                      <input
                        type="text"
                        placeholder="e.g. Quest Diagnostics, LabCorp, Mayo Clinic"
                        value={labNameInput}
                        onChange={e => setLabNameInput(e.target.value)}
                        className="w-full bg-secondary text-foreground text-xs rounded-xl px-3 py-2.5 border border-border focus:border-primary focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-muted-foreground block mb-1">Supported File Formats</label>
                      <div className="text-xs bg-secondary/50 text-muted-foreground rounded-xl px-3 py-2.5 border border-border flex items-center gap-2">
                        <FileText className="w-4 h-4 text-primary" /> PDF, JPG, PNG, TIFF (Max 15MB)
                      </div>
                    </div>
                  </div>

                  <div className="border-2 border-dashed border-border hover:border-primary/50 transition-colors rounded-2xl p-8 text-center bg-card/50 mt-2">
                    <input
                      type="file"
                      className="hidden"
                      ref={fileInputRef}
                      onChange={handleFileSelect}
                      accept="image/*,.pdf"
                    />

                    {!selectedFile ? (
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-14 h-14 rounded-2xl bg-secondary flex items-center justify-center text-primary shadow-inner">
                          <FileUp className="w-7 h-7" />
                        </div>
                        <div>
                          <button
                            onClick={() => fileInputRef.current?.click()}
                            className="text-primary font-bold hover:underline text-sm"
                          >
                            Click to select clinical report
                          </button>
                          <span className="text-muted-foreground text-sm ml-1">or drag & drop</span>
                        </div>
                        <p className="text-xs text-muted-foreground">Digital vector PDFs and high-res scanned images supported</p>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-4">
                        <div className="flex items-center gap-2 bg-secondary px-4 py-2 rounded-xl text-sm font-semibold">
                          <FileText className="w-4 h-4 text-primary" /> {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)
                        </div>
                        <div className="flex gap-2 w-full max-w-sm">
                          <button
                            onClick={() => setSelectedFile(null)}
                            className="btn flex-1 bg-secondary text-secondary-foreground"
                            disabled={isUploading}
                          >
                            Cancel
                          </button>
                          <button
                            onClick={handleUploadReport}
                            disabled={isUploading}
                            className="btn btn-primary flex-1 flex items-center justify-center gap-2 shadow-lg shadow-primary/20"
                          >
                            {isUploading ? (
                              <>
                                <Loader2 className="w-4 h-4 animate-spin" /> Running OCR Pipeline...
                              </>
                            ) : (
                              <>
                                <Sparkles className="w-4 h-4" /> Run OCR & Open Queue
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    )}

                    {uploadError && (
                      <div className="text-destructive text-xs font-semibold mt-4 bg-destructive/10 p-3 rounded-xl border border-destructive/20">
                        {uploadError}
                      </div>
                    )}
                  </div>
                </div>

                {/* Right Info Box */}
                <div className="space-y-4">
                  <div className="card space-y-3 bg-secondary/15 border-primary/20">
                    <div className="flex items-center gap-2 text-primary font-bold text-sm">
                      <Shield className="w-4 h-4" /> Human Review Architecture
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Every extracted biomarker value undergoes optical confidence scoring and must be human-verified before being tagged with <code className="text-primary font-mono text-[10px]">source: clinicReportOCR</code> and ingested into your Digital Twin.
                    </p>
                  </div>

                  <div className="card space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-sm text-foreground">Sample Test Reports</h4>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Test multi-month predictive trends and regression confidence cones immediately:
                    </p>
                    <button
                      onClick={handleSeedDemoData}
                      disabled={isSeedingDemo}
                      className="btn-primary w-full py-2.5 text-xs font-bold flex items-center justify-center gap-2"
                    >
                      {isSeedingDemo ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                      Seed 4 Longitudinal Reports
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Document Library / Upload History Table */}
            <div className="card space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-base flex items-center gap-2">
                  <Database className="w-4.5 h-4.5 text-primary" /> Staged & Confirmed Clinical Documents
                </h3>
                <span className="text-xs text-muted-foreground">{reportsList.length} total documents</span>
              </div>

              {isLoadingReports ? (
                <div className="py-6 text-center text-xs text-muted-foreground">Loading report records...</div>
              ) : reportsList.length === 0 ? (
                <div className="p-8 text-center text-xs text-muted-foreground italic bg-secondary/20 rounded-xl">
                  No clinical reports uploaded yet. Upload a document above or click "Seed 6-Mo Lab Demo".
                </div>
              ) : (
                <div className="divide-y divide-border/50 overflow-hidden rounded-xl border border-border/60">
                  {reportsList.map(r => {
                    const isPending = r.status === "pending_review";
                    return (
                      <div key={r.id} className="p-3.5 bg-card/60 hover:bg-secondary/30 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                            isPending ? "bg-amber-500/15 text-amber-400" : "bg-emerald-500/15 text-emerald-400"
                          }`}>
                            <FileText className="w-4.5 h-4.5" />
                          </div>
                          <div>
                            <div className="font-semibold text-xs text-foreground flex items-center gap-2">
                              <span>{r.filename}</span>
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                                isPending
                                  ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                                  : "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                              }`}>
                                {isPending ? "Pending Review" : "Ingested into Twin"}
                              </span>
                            </div>
                            <div className="flex items-center gap-3 text-[11px] text-muted-foreground mt-0.5">
                              <span>{r.lab_name}</span>
                              <span>•</span>
                              <span>{r.report_date ? new Date(r.report_date).toLocaleDateString() : "Recent"}</span>
                              <span>•</span>
                              <span>{r.total_metrics_found || r.metrics?.length || 0} metrics</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 self-end sm:self-center">
                          {isPending && (
                            <button
                              onClick={() => setActiveReviewReport({
                                id: r.id,
                                filename: r.filename,
                                reportDate: r.report_date,
                                labName: r.lab_name,
                                metrics: r.metrics || []
                              })}
                              className="btn-primary px-3 py-1.5 text-xs font-bold flex items-center gap-1 shadow-md shadow-primary/20"
                            >
                              Review & Confirm <ChevronRight className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <button
                            onClick={() => handleDeleteReport(r.id)}
                            className="p-1.5 text-muted-foreground hover:text-destructive transition-colors rounded-lg"
                            title="Delete report"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: Digital Twin Predictive Trends */}
        {activeTab === "trends" && (
          <div className="space-y-6">
            <PredictiveTrendsView metrics={metricTrends} isLoading={isLoadingTrends} />
          </div>
        )}

        {/* TAB 3: Clinical Alerts */}
        {activeTab === "alerts" && (
          <div className="space-y-6">
            <ClinicalAlertsDrawer
              alerts={alerts}
              onMarkRead={handleMarkAlertRead}
              isLoading={isLoadingAlerts}
            />
          </div>
        )}

        {/* TAB 4: Authorized Providers & Case Notes (Preserved) */}
        {activeTab === "providers" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Active Providers */}
            <div className="card space-y-4">
              <h3 className="font-bold text-lg flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-primary" /> Authorized Providers
              </h3>
              <p className="text-sm text-muted-foreground">The following providers currently have read-only access to your Digital Twin data.</p>
              
              <div className="space-y-3 mt-4">
                <div className="border border-border rounded-xl p-4 flex items-center justify-between bg-card/50">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center font-bold text-sm">
                      dr
                    </div>
                    <div>
                      <div className="font-semibold text-sm">Dr. Robert Chen, MD</div>
                      <div className="text-xs text-muted-foreground">Orthopedic Surgeon • Apex Sports Medicine</div>
                    </div>
                  </div>
                  <button className="text-xs font-semibold text-destructive hover:bg-destructive/10 px-3 py-1.5 rounded-lg transition-colors">
                    Revoke
                  </button>
                </div>

                <div className="border border-border rounded-xl p-4 flex items-center justify-between bg-card/50">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center font-bold text-sm">
                      pt
                    </div>
                    <div>
                      <div className="font-semibold text-sm">Sarah Jenkins, DPT</div>
                      <div className="text-xs text-muted-foreground">Physical Therapist • Kinetic Rehab</div>
                    </div>
                  </div>
                  <button className="text-xs font-semibold text-destructive hover:bg-destructive/10 px-3 py-1.5 rounded-lg transition-colors">
                    Revoke
                  </button>
                </div>
              </div>
            </div>

            {/* Provider Notes & Biomechanical PDF Export */}
            <div className="space-y-6">
              <div className="card space-y-4">
                <h3 className="font-bold text-lg flex items-center gap-2">
                  <FileText className="w-5 h-5 text-primary" /> Biomechanical Summary Export
                </h3>
                <p className="text-sm text-muted-foreground">Generate and print styled clinical summaries of your range of motion, symmetry, and logged pain history.</p>
                
                <div className="mt-4">
                  <a 
                    href={`http://localhost:8000/analytics/report/pdf/${userId}`}
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
        )}
      </main>
    </div>
  );
}
