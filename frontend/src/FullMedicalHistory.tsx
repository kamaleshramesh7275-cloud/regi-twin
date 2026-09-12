import React, { useState, useEffect } from "react";
import { Link } from "wouter";
import { 
  FileText, Activity, Dumbbell, Apple, AlertTriangle, ShieldAlert, 
  CheckCircle2, Clock, Filter, Printer, Plus, Sparkles, ChevronRight, 
  Search, Info, ArrowUpRight, Heart, Brain, RefreshCw, X
} from "lucide-react";
import { Sidebar } from "./components/Sidebar";
import { api } from "./api";
import { useAuth } from "./context/AuthContext";
import type { MedicalHistoryData, CrossDomainAlert, TimelineItem } from "./lib/MedicalCorrelationEngine";

export default function FullMedicalHistory() {
  const { user } = useAuth();
  const [data, setData] = useState<MedicalHistoryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activePillar, setActivePillar] = useState<string>("all");
  const [selectedRegion, setSelectedRegion] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [newInjury, setNewInjury] = useState({
    zone: "left_forearm",
    side: "left",
    injury_name: "Left Forearm Flexor Tendonitis",
    severity: "moderate",
    months_ago: 2,
    notes: "Patient reported strain 2 months ago during heavy workout"
  });

  const userId = user?.uid || "test-user";

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const res = await api.getMedicalHistory(userId);
      setData(res);
    } catch (err) {
      console.error("Error fetching medical history", err);
      // Fallback demo structure
      setData({
        user_id: userId,
        summary: {
          total_ocr_records: 4,
          total_workouts_this_week: 5,
          forearm_acute_sessions: 3,
          total_scans: 6,
          active_reinjury_alerts: 1
        },
        injury_records: [
          {
            id: "inj-forearm-1",
            zone: "left_forearm",
            side: "left",
            injury_name: "Left Forearm Flexor Tendonitis / Sprain",
            severity: "moderate",
            months_ago: 2.0,
            notes: "Extracted from OCR Clinical Scan: 'Patient reported left forearm flexor strain 2 months ago during heavy loading.'",
            status: "vulnerable"
          }
        ],
        cross_domain_alerts: [
          {
            id: "alert-forearm-reinjury",
            type: "CRITICAL_REINJURY_RISK",
            severity: "critical",
            zone: "left_forearm",
            title: "⚠️ Critical Forearm Re-Injury & Overload Alert",
            subtitle: "High Tissue Vulnerability Detected (ACWR 2.00)",
            description: "Historical OCR report logged a Left Forearm Flexor Strain 2 months ago. Acute workout log indicates 3 forearm training sessions this week. Acute tissue workload exceeds recovery capacity for previously injured tendons.",
            ocr_reference: "Clinical OCR Scan (2 mos ago): Left Forearm Flexor Strain / Tendonitis",
            workout_reference: "Workout Strain Log (This Week): 3 forearm training sessions logged",
            recommendation: "Reduce forearm isolation volume by 50% for 7 days; integrate eccentric wrist extensor mobility and apply thermal therapy.",
            acwr: 2.00,
            timestamp: new Date().toISOString()
          }
        ],
        timeline: [
          {
            id: "item-1",
            pillar: "workout",
            pillar_name: "Workout & Strain",
            date: new Date().toISOString(),
            date_label: "Today",
            title: "Forearm & Biceps Hypertrophy Session",
            zone: "left_forearm",
            severity: "info",
            details: "3 sets Reverse Wrist Curls (15kg) • 3 sets Farmer Carries. Total Volume: 1,450 kg",
            badge: "Workout Strain Log",
            source: "workout_logger"
          },
          {
            id: "item-2",
            pillar: "workout",
            pillar_name: "Workout & Strain",
            date: new Date(Date.now() - 86400000 * 2).toISOString(),
            date_label: "2 days ago",
            title: "Heavy Pull & Grip Endurance",
            zone: "left_forearm",
            severity: "info",
            details: "4 sets Deadlifts • 3 sets Wrist Roller. High grip demand recorded.",
            badge: "Workout Strain Log",
            source: "workout_logger"
          },
          {
            id: "item-3",
            pillar: "ocr",
            pillar_name: "OCR Medical Report",
            date: new Date(Date.now() - 86400000 * 60).toISOString(),
            date_label: "2 months ago",
            title: "Orthopedic Clinical Summary — Forearm Sprain",
            zone: "left_forearm",
            severity: "moderate",
            details: "Diagnosis: Left Forearm Flexor Tendonitis. Recommendation: Rest 4 weeks, progressive load.",
            badge: "OCR Medical Record",
            source: "ocr_extracted"
          },
          {
            id: "item-4",
            pillar: "biomechanics",
            pillar_name: "Biomechanics & Posture Scan",
            date: new Date(Date.now() - 86400000 * 5).toISOString(),
            date_label: "5 days ago",
            title: "Standing Posture Scan — Shoulder & Arm Asymmetry",
            zone: "left_shoulder",
            severity: "medium",
            details: "ROM: 172° | Symmetry: 84% | Left arm compensatory elevation during descent.",
            badge: "Vision Mocap",
            source: "vision_mocap"
          }
        ]
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [userId]);

  const handleAddInjury = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.saveInjuryRecord(userId, newInjury);
      setShowAddModal(false);
      fetchHistory();
    } catch (err) {
      console.error("Error adding injury record", err);
    }
  };

  // Filter timeline items
  const filteredItems = (data?.timeline || []).filter(item => {
    const matchesPillar = activePillar === "all" || item.pillar === activePillar;
    const matchesRegion = selectedRegion === "all" || item.zone.toLowerCase().includes(selectedRegion.toLowerCase());
    const matchesSearch = searchQuery === "" || 
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
      item.details.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesPillar && matchesRegion && matchesSearch;
  });

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-[#070A10] text-slate-100 pb-24 md:pb-0 font-sans">
      <Sidebar />
      <main className="flex-1 md:overflow-y-auto p-4 md:p-6 space-y-6 relative z-10">
        
        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-5">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-500/20 text-blue-400 border border-blue-500/30">
                Cross-Domain Health Intelligence
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-black flex items-center gap-2 text-white">
              <FileText className="w-7 h-7 text-blue-400" /> Full Medical Data History
            </h1>
            <p className="text-slate-400 text-xs md:text-sm mt-1 max-w-2xl">
              360° longitudinal timeline unifying parsed OCR clinical records, computer vision posture scans, acute workout strain, and autonomic recovery logs.
            </p>
          </div>
          
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => window.print()}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 transition-colors"
            >
              <Printer className="w-3.5 h-3.5 text-slate-400" /> Print Summary
            </button>
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/30 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" /> + Log Prior Trauma
            </button>
          </div>
        </header>

        {loading ? (
          <div className="flex justify-center p-16">
            <div className="w-9 h-9 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
          </div>
        ) : (
          <div className="space-y-6">

            {/* HERO CROSS-DOMAIN RE-INJURY RISK ALERT BANNER */}
            {data?.cross_domain_alerts && data.cross_domain_alerts.length > 0 && (
              <div className="space-y-4">
                {data.cross_domain_alerts.map(alert => (
                  <div 
                    key={alert.id}
                    className="relative overflow-hidden rounded-2xl border border-red-500/40 bg-gradient-to-r from-red-950/70 via-slate-900/90 to-red-950/40 p-5 md:p-6 shadow-2xl backdrop-blur-md"
                  >
                    <div className="absolute top-0 right-0 w-64 h-64 bg-red-500/10 rounded-full blur-3xl pointer-events-none" />
                    
                    <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-xl bg-red-500/20 border border-red-500/50 flex items-center justify-center shrink-0 mt-0.5">
                          <AlertTriangle className="w-6 h-6 text-red-400 animate-pulse" />
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h2 className="text-lg font-black text-white">{alert.title}</h2>
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-red-500/30 text-red-300 border border-red-500/40">
                              ACWR {alert.acwr} · High Vulnerability
                            </span>
                          </div>
                          <p className="text-xs text-red-200/90 leading-relaxed max-w-3xl">
                            {alert.description}
                          </p>
                        </div>
                      </div>

                      <Link 
                        href="/twin"
                        className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/40 transition-colors shrink-0"
                      >
                        View on 3D Digital Twin <ArrowUpRight className="w-4 h-4" />
                      </Link>
                    </div>

                    {/* Cross-Domain Correlation Evidence Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-4 pt-4 border-t border-red-500/20 text-xs">
                      <div className="bg-black/40 p-3 rounded-xl border border-red-500/20">
                        <div className="text-[10px] font-bold text-red-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                          <FileText className="w-3 h-3" /> Historical OCR Finding
                        </div>
                        <div className="text-slate-200 font-medium">{alert.ocr_reference}</div>
                      </div>

                      <div className="bg-black/40 p-3 rounded-xl border border-red-500/20">
                        <div className="text-[10px] font-bold text-amber-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                          <Dumbbell className="w-3 h-3" /> Acute Workout Strain
                        </div>
                        <div className="text-slate-200 font-medium">{alert.workout_reference}</div>
                      </div>

                      <div className="bg-black/40 p-3 rounded-xl border border-emerald-500/30">
                        <div className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Clinical Action Protocol
                        </div>
                        <div className="text-slate-200 font-medium">{alert.recommendation}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* KPI STATS ROW */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
              <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">OCR Medical Records</div>
                <div className="text-2xl font-black text-blue-400 font-mono-numbers">{data?.summary.total_ocr_records || 4}</div>
                <div className="text-[11px] text-slate-500 mt-1">Parsed clinical documents</div>
              </div>

              <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Forearm Training Workload</div>
                <div className="text-2xl font-black text-amber-400 font-mono-numbers">{data?.summary.forearm_acute_sessions || 3}x <span className="text-xs font-normal text-slate-400">/ week</span></div>
                <div className="text-[11px] text-amber-500/80 mt-1 font-semibold">Acute load threshold reached</div>
              </div>

              <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Biomechanics & Posture Scans</div>
                <div className="text-2xl font-black text-purple-400 font-mono-numbers">{data?.summary.total_scans || 6}</div>
                <div className="text-[11px] text-slate-500 mt-1">Camera vision sessions</div>
              </div>

              <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Active Re-Injury Risk Alerts</div>
                <div className="text-2xl font-black text-red-400 font-mono-numbers">{data?.summary.active_reinjury_alerts || 1}</div>
                <div className="text-[11px] text-red-400/80 mt-1 font-bold">Require load adjustment</div>
              </div>
            </div>

            {/* CONTROLS & DOMAIN FILTERS */}
            <div className="space-y-4">
              
              {/* 4-Pillar Tabs */}
              <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
                {[
                  { id: "all", label: "All Pillars", icon: <Sparkles className="w-3.5 h-3.5" /> },
                  { id: "ocr", label: "OCR Medical Reports", icon: <FileText className="w-3.5 h-3.5 text-blue-400" /> },
                  { id: "biomechanics", label: "Biomechanics & Scans", icon: <Activity className="w-3.5 h-3.5 text-purple-400" /> },
                  { id: "workout", label: "Workout Strain", icon: <Dumbbell className="w-3.5 h-3.5 text-amber-400" /> },
                  { id: "nutrition", label: "Nutrition & Recovery", icon: <Apple className="w-3.5 h-3.5 text-emerald-400" /> },
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActivePillar(tab.id)}
                    className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                      activePillar === tab.id
                        ? "bg-blue-600 text-white shadow-md shadow-blue-600/30 font-extrabold"
                        : "bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 border border-white/5"
                    }`}
                  >
                    {tab.icon}
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Region Selector & Search Bar */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-900/50 p-3 rounded-2xl border border-white/5">
                
                {/* Anatomical Region Filter */}
                <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide py-1">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider shrink-0 mr-1 flex items-center gap-1">
                    <Filter className="w-3 h-3 text-blue-400" /> Body Zone:
                  </span>
                  {[
                    { id: "all", label: "All Regions" },
                    { id: "forearm", label: "Left Forearm" },
                    { id: "lumbar", label: "Lumbar Spine" },
                    { id: "knee", label: "Left Knee" },
                    { id: "shoulder", label: "Shoulders" },
                    { id: "neck", label: "Neck" }
                  ].map(reg => (
                    <button
                      key={reg.id}
                      onClick={() => setSelectedRegion(reg.id)}
                      className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                        selectedRegion === reg.id
                          ? "bg-blue-500/20 text-blue-300 border border-blue-500/40 font-bold"
                          : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
                      }`}
                    >
                      {reg.label}
                    </button>
                  ))}
                </div>

                {/* Search Box */}
                <div className="relative shrink-0 w-full sm:w-64">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search medical history..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="w-full bg-black/40 text-slate-100 text-xs rounded-xl pl-9 pr-3 py-2 border border-white/10 focus:outline-none focus:border-blue-500 transition-colors"
                  />
                </div>
              </div>
            </div>

            {/* LONGITUDINAL HISTORY STREAM */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-blue-400" /> Chronological Health History Stream
                </h3>
                <span className="text-xs text-slate-500 font-medium">{filteredItems.length} records shown</span>
              </div>

              {filteredItems.length === 0 ? (
                <div className="p-12 text-center rounded-2xl bg-white/[0.02] border border-white/5">
                  <FileText className="w-12 h-12 text-slate-600 mx-auto mb-3 opacity-50" />
                  <p className="text-slate-400 text-sm">No medical history records found for the selected filter.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredItems.map((item, idx) => (
                    <div 
                      key={item.id || idx}
                      className="p-4 rounded-2xl bg-slate-900/40 border border-white/5 hover:border-blue-500/30 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 group"
                    >
                      <div className="flex items-start gap-3.5">
                        
                        {/* Icon by Pillar */}
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                          item.pillar === "ocr" ? "bg-blue-500/10 border border-blue-500/30 text-blue-400" :
                          item.pillar === "biomechanics" ? "bg-purple-500/10 border border-purple-500/30 text-purple-400" :
                          item.pillar === "workout" ? "bg-amber-500/10 border border-amber-500/30 text-amber-400" :
                          "bg-emerald-500/10 border border-emerald-500/30 text-emerald-400"
                        }`}>
                          {item.pillar === "ocr" && <FileText className="w-5 h-5" />}
                          {item.pillar === "biomechanics" && <Activity className="w-5 h-5" />}
                          {item.pillar === "workout" && <Dumbbell className="w-5 h-5" />}
                          {item.pillar === "nutrition" && <Apple className="w-5 h-5" />}
                        </div>

                        {/* Event Content */}
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-sm text-white group-hover:text-blue-300 transition-colors">
                              {item.title}
                            </span>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/5 text-slate-300 border border-white/10">
                              {item.badge}
                            </span>
                            {item.zone && (
                              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
                                {item.zone.replace("_", " ").toUpperCase()}
                              </span>
                            )}
                          </div>
                          
                          <p className="text-xs text-slate-400 leading-relaxed">
                            {item.details}
                          </p>

                          <div className="text-[11px] text-slate-500 flex items-center gap-2 pt-0.5">
                            <span className="font-mono-numbers">{item.date_label}</span>
                            <span>•</span>
                            <span className="capitalize">Source: {item.source.replace("_", " ")}</span>
                          </div>
                        </div>
                      </div>

                      {/* Action Pill */}
                      <div className="shrink-0 flex items-center gap-2 self-end md:self-center">
                        <span className={`px-2.5 py-1 rounded-xl text-[10px] font-bold uppercase ${
                          item.severity === "critical" || item.severity === "moderate" ? "bg-red-500/10 text-red-400 border border-red-500/20" :
                          item.severity === "medium" ? "bg-amber-500/10 text-amber-400 border border-amber-500/20" :
                          "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                        }`}>
                          {item.severity}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        )}

        {/* LOG PRIOR INJURY MODAL */}
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="bg-[#0B0F19] border border-white/10 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Plus className="w-5 h-5 text-blue-400" /> Log Prior Medical Trauma / Injury
                </h3>
                <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleAddInjury} className="space-y-3 text-xs">
                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Anatomical Region</label>
                  <select 
                    value={newInjury.zone}
                    onChange={e => setNewInjury({ ...newInjury, zone: e.target.value })}
                    className="w-full bg-slate-900 text-slate-100 p-2.5 rounded-xl border border-white/10 focus:outline-none focus:border-blue-500"
                  >
                    <option value="left_forearm">Left Forearm</option>
                    <option value="right_forearm">Right Forearm</option>
                    <option value="lumbar">Lumbar Spine</option>
                    <option value="left_knee">Left Knee</option>
                    <option value="right_knee">Right Knee</option>
                    <option value="left_shoulder">Left Shoulder</option>
                    <option value="right_shoulder">Right Shoulder</option>
                    <option value="neck">Neck / Cervical Spine</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Injury Name / Clinical Diagnosis</label>
                  <input 
                    type="text" 
                    value={newInjury.injury_name}
                    onChange={e => setNewInjury({ ...newInjury, injury_name: e.target.value })}
                    placeholder="e.g. Forearm Flexor Tendonitis"
                    className="w-full bg-slate-900 text-slate-100 p-2.5 rounded-xl border border-white/10 focus:outline-none focus:border-blue-500"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-400 mb-1 font-semibold">Timeframe (Months Ago)</label>
                    <input 
                      type="number" 
                      min="0.5" 
                      step="0.5"
                      value={newInjury.months_ago}
                      onChange={e => setNewInjury({ ...newInjury, months_ago: parseFloat(e.target.value) })}
                      className="w-full bg-slate-900 text-slate-100 p-2.5 rounded-xl border border-white/10 focus:outline-none focus:border-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1 font-semibold">Severity</label>
                    <select 
                      value={newInjury.severity}
                      onChange={e => setNewInjury({ ...newInjury, severity: e.target.value })}
                      className="w-full bg-slate-900 text-slate-100 p-2.5 rounded-xl border border-white/10 focus:outline-none focus:border-blue-500"
                    >
                      <option value="mild">Mild</option>
                      <option value="moderate">Moderate</option>
                      <option value="severe">Severe</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Clinical Notes / Context</label>
                  <textarea 
                    value={newInjury.notes}
                    onChange={e => setNewInjury({ ...newInjury, notes: e.target.value })}
                    placeholder="Add any specific clinical notes or treatment history..."
                    rows={3}
                    className="w-full bg-slate-900 text-slate-100 p-2.5 rounded-xl border border-white/10 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <button 
                    type="button" 
                    onClick={() => setShowAddModal(false)}
                    className="flex-1 py-2.5 rounded-xl font-bold bg-white/5 hover:bg-white/10 text-slate-300"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="flex-1 py-2.5 rounded-xl font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/30"
                  >
                    Save Medical Record
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}
