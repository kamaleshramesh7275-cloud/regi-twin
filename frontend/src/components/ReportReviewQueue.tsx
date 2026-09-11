import React, { useState } from "react";
import { CheckCircle2, AlertTriangle, HelpCircle, Edit3, Trash2, ArrowRight, ShieldAlert, Sparkles, FileText, Check } from "lucide-react";

export interface ExtractedMetric {
  id?: string;
  metric_key: string;
  canonical_name: string;
  display_name?: string;
  value: number;
  unit: string;
  ref_low?: number | null;
  ref_high?: number | null;
  ref_min?: number | null;
  ref_max?: number | null;
  reference_range?: string;
  is_out_of_range?: boolean;
  confidence?: string;
  confidence_score?: number;
  confidence_grade?: string;
  needs_review?: boolean;
  source_page?: number;
  raw_snippet?: string;
  status?: string;
}

interface ReportReviewQueueProps {
  reportId: string;
  filename: string;
  reportDate?: string;
  labName?: string;
  initialMetrics: ExtractedMetric[];
  onConfirm: (confirmedMetrics: ExtractedMetric[], notes?: string) => Promise<void>;
  onCancel?: () => void;
  isConfirming?: boolean;
}

export const ReportReviewQueue: React.FC<ReportReviewQueueProps> = ({
  reportId,
  filename,
  reportDate,
  labName,
  initialMetrics,
  onConfirm,
  onCancel,
  isConfirming = false
}) => {
  const [metrics, setMetrics] = useState<ExtractedMetric[]>(initialMetrics);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [reviewNotes, setReviewNotes] = useState<string>("");

  const handleUpdateMetric = (index: number, field: keyof ExtractedMetric, val: any) => {
    setMetrics(prev => {
      const updated = [...prev];
      const item = { ...updated[index], [field]: val };
      
      // Re-evaluate out of range if value or bounds change
      if (field === "value" || field === "ref_low" || field === "ref_high") {
        const numVal = parseFloat(item.value as any) || 0;
        const low = item.ref_low !== null && item.ref_low !== undefined ? Number(item.ref_low) : null;
        const high = item.ref_high !== null && item.ref_high !== undefined ? Number(item.ref_high) : null;
        item.is_out_of_range = (low !== null && numVal < low) || (high !== null && numVal > high);
        item.status = (low !== null && numVal < low) ? "low" : (high !== null && numVal > high ? "high" : "normal");
      }
      
      updated[index] = item;
      return updated;
    });
  };

  const handleRemoveMetric = (index: number) => {
    setMetrics(prev => prev.filter((_, i) => i !== index));
  };

  const handleConfirmAll = async () => {
    await onConfirm(metrics, reviewNotes);
  };

  return (
    <div className="bg-card border border-border/80 rounded-2xl p-5 md:p-6 shadow-xl space-y-6">
      {/* Header with Human-in-the-loop Badge */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-border/60">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/30">
              <ShieldAlert className="w-3.5 h-3.5" /> Human-in-the-Loop Review Queue
            </span>
            <span className="text-xs text-muted-foreground">Report #{reportId.slice(0, 8)}</span>
          </div>
          <h2 className="text-lg font-bold text-foreground mt-1.5 flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" /> {filename}
          </h2>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground mt-1">
            {labName && <span>Lab: <strong className="text-foreground">{labName}</strong></span>}
            {reportDate && <span>Date: <strong className="text-foreground">{new Date(reportDate).toLocaleDateString()}</strong></span>}
            <span>Detected: <strong className="text-primary font-bold">{metrics.length} metrics</strong></span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onCancel && (
            <button
              onClick={onCancel}
              className="px-3.5 py-2 text-xs font-semibold rounded-xl bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors"
            >
              Cancel
            </button>
          )}
          <button
            onClick={handleConfirmAll}
            disabled={isConfirming || metrics.length === 0}
            className="btn-primary px-4 py-2 text-xs font-bold flex items-center gap-2 shadow-lg shadow-primary/20 disabled:opacity-50"
          >
            {isConfirming ? (
              <>Ingesting into Twin...</>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" /> Confirm & Ingest ({metrics.length})
              </>
            )}
          </button>
        </div>
      </div>

      {/* Mandatory Non-Diagnostic Guidance Box */}
      <div className="bg-primary/5 border border-primary/20 rounded-xl p-3.5 flex items-start gap-3 text-xs text-muted-foreground">
        <Sparkles className="w-4 h-4 text-primary shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          <strong className="text-foreground">Zero Auto-Commit Verification:</strong> Please inspect the extracted numbers, units, and reference ranges below. Values will only be integrated into your Digital Twin baseline once confirmed by you.
        </p>
      </div>

      {/* Metrics Review Table / Cards */}
      <div className="space-y-3">
        <div className="hidden md:grid grid-cols-12 gap-3 px-3 py-2 text-[11px] font-bold text-muted-foreground uppercase tracking-wider bg-secondary/30 rounded-lg">
          <div className="col-span-4">Metric & Canonical Name</div>
          <div className="col-span-2 text-right">Extracted Value</div>
          <div className="col-span-2">Standard Unit</div>
          <div className="col-span-2">Reference Range</div>
          <div className="col-span-1 text-center">Confidence</div>
          <div className="col-span-1 text-right">Actions</div>
        </div>

        {metrics.map((item, idx) => {
          const isEditing = editingId === (item.id || `m-${idx}`);
          const confGrade = item.confidence_grade || item.confidence || "high";
          const isLowConf = confGrade === "low";
          const isMedConf = confGrade === "medium";

          return (
            <div
              key={item.id || idx}
              className={`p-3.5 rounded-xl border transition-all ${
                item.is_out_of_range
                  ? "border-amber-500/30 bg-amber-500/5"
                  : isLowConf
                  ? "border-amber-400/40 bg-card/90"
                  : "border-border/60 bg-card hover:border-primary/40"
              }`}
            >
              <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
                {/* Name & Snippet */}
                <div className="col-span-1 md:col-span-4 space-y-1">
                  {isEditing ? (
                    <input
                      type="text"
                      value={item.canonical_name || item.display_name || ""}
                      onChange={e => handleUpdateMetric(idx, "canonical_name", e.target.value)}
                      className="w-full bg-secondary text-foreground text-xs rounded-lg px-2.5 py-1.5 border border-primary/50 focus:outline-none"
                    />
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm text-foreground">
                        {item.canonical_name || item.display_name}
                      </span>
                      {item.is_out_of_range && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                          {item.status?.toUpperCase() || "FLAG"}
                        </span>
                      )}
                    </div>
                  )}

                  {item.raw_snippet && (
                    <p className="text-[11px] text-muted-foreground/80 truncate max-w-sm font-mono" title={item.raw_snippet}>
                      OCR source: "{item.raw_snippet}"
                    </p>
                  )}
                </div>

                {/* Value Input */}
                <div className="col-span-1 md:col-span-2 md:text-right">
                  <span className="text-[10px] text-muted-foreground md:hidden block">Value:</span>
                  <input
                    type="number"
                    step="any"
                    value={item.value}
                    onChange={e => handleUpdateMetric(idx, "value", parseFloat(e.target.value) || 0)}
                    className="w-full md:w-28 bg-secondary font-mono font-bold text-sm text-foreground rounded-lg px-2.5 py-1.5 border border-border focus:border-primary focus:outline-none md:text-right"
                  />
                </div>

                {/* Unit Input */}
                <div className="col-span-1 md:col-span-2">
                  <span className="text-[10px] text-muted-foreground md:hidden block">Unit:</span>
                  <input
                    type="text"
                    value={item.unit}
                    onChange={e => handleUpdateMetric(idx, "unit", e.target.value)}
                    className="w-full md:w-24 bg-secondary text-xs text-muted-foreground rounded-lg px-2.5 py-1.5 border border-border focus:border-primary focus:outline-none"
                  />
                </div>

                {/* Reference Range */}
                <div className="col-span-1 md:col-span-2 flex items-center gap-1 text-xs text-muted-foreground">
                  <span className="text-[10px] md:hidden">Ref:</span>
                  <input
                    type="number"
                    step="any"
                    placeholder="Min"
                    value={item.ref_low !== null && item.ref_low !== undefined ? item.ref_low : ""}
                    onChange={e => handleUpdateMetric(idx, "ref_low", e.target.value ? parseFloat(e.target.value) : null)}
                    className="w-14 bg-secondary text-xs rounded px-1.5 py-1 border border-border focus:border-primary text-center"
                  />
                  <span>–</span>
                  <input
                    type="number"
                    step="any"
                    placeholder="Max"
                    value={item.ref_high !== null && item.ref_high !== undefined ? item.ref_high : ""}
                    onChange={e => handleUpdateMetric(idx, "ref_high", e.target.value ? parseFloat(e.target.value) : null)}
                    className="w-14 bg-secondary text-xs rounded px-1.5 py-1 border border-border focus:border-primary text-center"
                  />
                </div>

                {/* Confidence Badge */}
                <div className="col-span-1 md:col-span-1 text-left md:text-center">
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      isLowConf
                        ? "bg-red-500/15 text-red-400 border border-red-500/30"
                        : isMedConf
                        ? "bg-amber-500/15 text-amber-400 border border-amber-500/30"
                        : "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                    }`}
                  >
                    {confGrade.toUpperCase()}
                  </span>
                </div>

                {/* Action Buttons */}
                <div className="col-span-1 md:col-span-1 flex items-center justify-end gap-1">
                  <button
                    onClick={() => setEditingId(isEditing ? null : (item.id || `m-${idx}`))}
                    className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                    title={isEditing ? "Done editing" : "Edit canonical details"}
                  >
                    {isEditing ? <Check className="w-4 h-4 text-emerald-400" /> : <Edit3 className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={() => handleRemoveMetric(idx)}
                    className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                    title="Remove from ingestion"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Review Notes Box */}
      <div className="space-y-2 pt-2">
        <label className="text-xs font-semibold text-muted-foreground">Clinical Reviewer Notes (Optional)</label>
        <textarea
          value={reviewNotes}
          onChange={e => setReviewNotes(e.target.value)}
          placeholder="e.g. Fasting glucose confirmed in metabolic panel; baseline verified."
          className="w-full h-16 bg-secondary text-foreground text-xs rounded-xl p-3 border border-border focus:border-primary focus:outline-none resize-none"
        />
      </div>

      {/* Bottom Actions */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-border/50">
        <p className="text-[11px] text-muted-foreground">
          Confirming will register <strong className="text-foreground">{metrics.length} data points</strong> with source <code className="text-primary font-mono text-[10px]">clinicReportOCR</code> into your Digital Twin.
        </p>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          {onCancel && (
            <button
              onClick={onCancel}
              className="flex-1 sm:flex-initial px-4 py-2.5 text-xs font-semibold rounded-xl bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors"
            >
              Cancel
            </button>
          )}
          <button
            onClick={handleConfirmAll}
            disabled={isConfirming || metrics.length === 0}
            className="flex-1 sm:flex-initial btn-primary px-5 py-2.5 text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-primary/20 disabled:opacity-50"
          >
            {isConfirming ? "Processing Ingestion..." : "Confirm & Ingest into Twin"} <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
