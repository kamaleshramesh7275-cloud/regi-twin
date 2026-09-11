import React, { useState } from "react";
import { CheckCircle2, AlertTriangle, HelpCircle, Edit3, Trash2, ArrowRight, ShieldAlert, Sparkles, FileText, Check, Plus, Eye, EyeOff } from "lucide-react";

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
  engine?: string;
}

interface ReportReviewQueueProps {
  reportId: string;
  filename: string;
  reportDate?: string;
  labName?: string;
  initialMetrics: ExtractedMetric[];
  rawOcrLines?: string[];
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
  rawOcrLines = [],
  onConfirm,
  onCancel,
  isConfirming = false
}) => {
  const [metrics, setMetrics] = useState<ExtractedMetric[]>(initialMetrics);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [reviewNotes, setReviewNotes] = useState<string>("");
  const [showRawOcr, setShowRawOcr] = useState<boolean>(false);

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

  const handleAddManualMetric = () => {
    const newMetric: ExtractedMetric = {
      id: `manual-${Date.now()}`,
      metric_key: "custom_metric",
      canonical_name: "New Biomarker",
      display_name: "New Biomarker",
      value: 0,
      unit: "mg/dL",
      ref_low: 0,
      ref_high: 100,
      reference_range: "Normal",
      is_out_of_range: false,
      confidence: "high",
      confidence_score: 1.0,
      confidence_grade: "high",
      needs_review: false,
      source_page: 1,
      raw_snippet: "Manually entered",
      status: "pending",
      engine: "manual"
    };
    setMetrics(prev => [...prev, newMetric]);
    setEditingId(newMetric.id || `m-${metrics.length}`);
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
          {rawOcrLines.length > 0 && (
            <button
              onClick={() => setShowRawOcr(!showRawOcr)}
              className="px-3 py-2 text-xs font-semibold rounded-xl bg-secondary hover:bg-secondary/80 text-secondary-foreground transition-colors flex items-center gap-1.5"
              title="Inspect raw optical character recognition text"
            >
              {showRawOcr ? <EyeOff className="w-3.5 h-3.5 text-primary" /> : <Eye className="w-3.5 h-3.5 text-primary" />}
              {showRawOcr ? "Hide OCR Text" : `Raw Text (${rawOcrLines.length})`}
            </button>
          )}

          <button
            onClick={handleAddManualMetric}
            className="btn-secondary px-3 py-2 text-xs font-semibold flex items-center gap-1.5"
            title="Add a metric manually"
          >
            <Plus className="w-3.5 h-3.5 text-primary" /> Add Metric
          </button>

          {onCancel && (
            <button
              onClick={onCancel}
              className="px-3 py-2 text-xs font-semibold rounded-xl bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors"
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

      {/* Raw OCR Text Collapsible Inspector */}
      {showRawOcr && rawOcrLines.length > 0 && (
        <div className="bg-secondary/30 border border-border/80 rounded-xl p-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-primary" /> Extracted OCR Text Lines
            </span>
            <span className="text-[10px] text-muted-foreground">{rawOcrLines.length} lines detected</span>
          </div>
          <div className="max-h-48 overflow-y-auto bg-background/60 p-3 rounded-lg font-mono text-[11px] text-muted-foreground space-y-0.5 border border-border/50 select-text">
            {rawOcrLines.map((line, lIdx) => (
              <div key={lIdx} className="hover:text-foreground">
                <span className="text-primary/50 select-none mr-2">{lIdx + 1}.</span>
                {line}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Mandatory Non-Diagnostic Guidance Box */}
      <div className="bg-primary/5 border border-primary/20 rounded-xl p-3.5 flex items-start gap-3 text-xs text-muted-foreground">
        <Sparkles className="w-4 h-4 text-primary shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          <strong className="text-foreground">Zero Auto-Commit Verification:</strong> Please inspect the extracted numbers, units, and reference ranges below. Values will only be integrated into your Digital Twin baseline once confirmed by you.
        </p>
      </div>

      {/* Metrics List */}
      {metrics.length === 0 ? (
        <div className="p-8 text-center bg-secondary/15 rounded-2xl border border-dashed border-border/80 space-y-3">
          <AlertTriangle className="w-8 h-8 text-amber-400 mx-auto" />
          <h3 className="font-bold text-sm text-foreground">No Structured Metrics Detected Automatically</h3>
          <p className="text-xs text-muted-foreground max-w-md mx-auto">
            The OCR engine detected raw text but could not match standard laboratory ranges with high confidence. You can inspect the raw text above or add metrics manually.
          </p>
          <button
            onClick={handleAddManualMetric}
            className="btn-primary px-4 py-2 text-xs font-bold inline-flex items-center gap-2"
          >
            <Plus className="w-3.5 h-3.5" /> Add Metric Manually
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="grid grid-cols-12 text-xs font-semibold text-muted-foreground px-4 py-1">
            <span className="col-span-4 md:col-span-4">Biomarker / Analyte</span>
            <span className="col-span-3 md:col-span-3">Measured Value</span>
            <span className="col-span-3 md:col-span-3">Reference Range</span>
            <span className="col-span-1 md:col-span-1 text-center">Confidence</span>
            <span className="col-span-1 md:col-span-1 text-right">Actions</span>
          </div>

          {metrics.map((item, idx) => {
            const isEditing = editingId === (item.id || `m-${idx}`);
            const isAbnormal = item.is_out_of_range;
            const confGrade = item.confidence_grade || item.confidence || "high";
            const isLowConf = confGrade === "low" || (item.confidence_score && item.confidence_score < 0.7);
            const isMedConf = confGrade === "medium" || (item.confidence_score && item.confidence_score >= 0.7 && item.confidence_score < 0.85);

            return (
              <div
                key={item.id || idx}
                className={`p-4 rounded-xl border transition-all ${
                  isAbnormal
                    ? "bg-amber-500/5 border-amber-500/30"
                    : isLowConf
                    ? "bg-red-500/5 border-red-500/20"
                    : "bg-secondary/40 border-border/70 hover:border-primary/40"
                }`}
              >
                <div className="grid grid-cols-12 items-center gap-3">
                  {/* Biomarker Title & Category */}
                  <div className="col-span-12 md:col-span-4 space-y-1">
                    {isEditing ? (
                      <input
                        type="text"
                        value={item.display_name || item.canonical_name}
                        onChange={e => handleUpdateMetric(idx, "display_name", e.target.value)}
                        className="bg-background text-foreground text-xs rounded-lg px-2 py-1 w-full border border-border focus:border-primary focus:outline-none"
                      />
                    ) : (
                      <div className="font-bold text-sm text-foreground flex items-center gap-2">
                        {item.display_name || item.canonical_name}
                        {isAbnormal && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                            Flagged
                          </span>
                        )}
                        {item.engine && (
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-mono text-muted-foreground bg-secondary">
                            {item.engine}
                          </span>
                        )}
                      </div>
                    )}
                    {item.raw_snippet && (
                      <p className="text-[11px] font-mono text-muted-foreground truncate" title={item.raw_snippet}>
                        &ldquo;{item.raw_snippet}&rdquo;
                      </p>
                    )}
                  </div>

                  {/* Value & Unit */}
                  <div className="col-span-6 md:col-span-3 flex items-center gap-2">
                    {isEditing ? (
                      <>
                        <input
                          type="number"
                          step="any"
                          value={item.value}
                          onChange={e => handleUpdateMetric(idx, "value", parseFloat(e.target.value) || 0)}
                          className="bg-background text-foreground font-mono font-bold text-sm rounded-lg px-2 py-1 w-20 border border-border focus:border-primary focus:outline-none"
                        />
                        <input
                          type="text"
                          value={item.unit}
                          onChange={e => handleUpdateMetric(idx, "unit", e.target.value)}
                          className="bg-background text-muted-foreground text-xs rounded-lg px-2 py-1 w-16 border border-border focus:border-primary focus:outline-none"
                        />
                      </>
                    ) : (
                      <div className="flex items-baseline gap-1.5">
                        <span className={`text-base font-extrabold font-mono ${isAbnormal ? "text-amber-400" : "text-foreground"}`}>
                          {item.value}
                        </span>
                        <span className="text-xs text-muted-foreground font-medium">{item.unit}</span>
                      </div>
                    )}
                  </div>

                  {/* Reference Range */}
                  <div className="col-span-6 md:col-span-3 text-xs text-muted-foreground">
                    {isEditing ? (
                      <input
                        type="text"
                        value={item.reference_range || ""}
                        onChange={e => handleUpdateMetric(idx, "reference_range", e.target.value)}
                        placeholder="e.g. 70 - 99 mg/dL"
                        className="bg-background text-foreground text-xs rounded-lg px-2 py-1 w-full border border-border focus:border-primary focus:outline-none"
                      />
                    ) : (
                      <span>{item.reference_range || `${item.ref_min ?? item.ref_low ?? ""} - ${item.ref_max ?? item.ref_high ?? ""} ${item.unit}`}</span>
                    )}
                  </div>

                  {/* Confidence Badge */}
                  <div className="col-span-6 md:col-span-1 flex items-center justify-center">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
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
                  <div className="col-span-6 md:col-span-1 flex items-center justify-end gap-1">
                    <button
                      onClick={() => setEditingId(isEditing ? null : (item.id || `m-${idx}`))}
                      className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors cursor-pointer"
                      title={isEditing ? "Done editing" : "Edit canonical details"}
                    >
                      {isEditing ? <Check className="w-4 h-4 text-emerald-400" /> : <Edit3 className="w-4 h-4" />}
                    </button>
                    <button
                      onClick={() => handleRemoveMetric(idx)}
                      className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
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
      )}

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
              className="flex-1 sm:flex-initial px-4 py-2.5 text-xs font-semibold rounded-xl bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors cursor-pointer"
            >
              Cancel
            </button>
          )}
          <button
            onClick={handleConfirmAll}
            disabled={isConfirming || metrics.length === 0}
            className="flex-1 sm:flex-initial btn-primary px-5 py-2.5 text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-primary/20 disabled:opacity-50 cursor-pointer"
          >
            {isConfirming ? "Processing Ingestion..." : "Confirm & Ingest into Twin"} <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
