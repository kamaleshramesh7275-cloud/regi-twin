import React, { useState } from "react";
import { Link } from "wouter";
import {
  TrendingUp, TrendingDown, Minus, ChevronDown, ChevronUp,
  FlaskConical, AlertTriangle, Sparkles, ExternalLink
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ResponsiveContainer, LineChart, Line, Tooltip as RechartTooltip
} from "recharts";
import type { MetricTrendItem } from "./PredictiveTrendsView";

// ── Trend helpers matching existing TwinPage colour system ────────────────────
function trendColor(dir: string | undefined, status: string | undefined) {
  if (status === "high" || status === "low" || status === "flagged") return "text-red-400";
  if (dir === "up")   return "text-amber-400";
  if (dir === "down") return "text-amber-400";
  return "text-emerald-400";
}

function trendLabel(dir: string | undefined, status: string | undefined) {
  if (status === "high" || status === "low" || status === "flagged") return "Flagged";
  if (dir === "up")   return "Rising";
  if (dir === "down") return "Falling";
  return "Stable";
}

function TrendIcon({ dir, status, className }: { dir?: string; status?: string; className?: string }) {
  const isFlag = status === "high" || status === "low" || status === "flagged";
  if (isFlag) return <AlertTriangle className={`w-3.5 h-3.5 text-red-400 ${className ?? ""}`} />;
  if (dir === "up")   return <TrendingUp   className={`w-3.5 h-3.5 text-amber-400 ${className ?? ""}`} />;
  if (dir === "down") return <TrendingDown className={`w-3.5 h-3.5 text-amber-400 ${className ?? ""}`} />;
  return <Minus className={`w-3.5 h-3.5 text-emerald-400 ${className ?? ""}`} />;
}

// ── Sparkline ─────────────────────────────────────────────────────────────────
function MiniSparkline({ history, color }: { history: MetricTrendItem["history"]; color: string }) {
  if (!history || history.length < 2) return null;
  const data = history.slice(-6).map(h => ({ v: h.value }));
  return (
    <div className="w-16 h-6 shrink-0">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <Line
            type="monotone"
            dataKey="v"
            stroke={color}
            strokeWidth={1.5}
            dot={false}
            isAnimationActive={false}
          />
          <RechartTooltip content={() => null} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

// ── Single metric card ────────────────────────────────────────────────────────
function SystemicCard({ metric }: { metric: MetricTrendItem }) {
  const [expanded, setExpanded] = useState(false);
  const dir    = metric.prediction?.trend_direction;
  const status = metric.latest_status;
  const isFlagged = status === "high" || status === "low" || status === "flagged";

  // Build full chart data for expanded view
  const histPoints = metric.history.slice(-8).map(h => ({
    d: new Date(h.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    v: h.value,
  }));

  const lineColor =
    isFlagged            ? "#f87171"   // red-400
    : dir === "up" || dir === "down" ? "#fbbf24"  // amber-400
    : "#34d399";                                   // emerald-400

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-xl border transition-colors cursor-pointer select-none ${
        isFlagged
          ? "bg-red-500/5 border-red-500/25 hover:border-red-500/40"
          : "bg-white/[0.03] border-white/10 hover:border-white/20"
      }`}
      onClick={() => setExpanded(p => !p)}
    >
      {/* Collapsed row */}
      <div className="flex items-center gap-2.5 px-3 py-2.5">
        {/* Coloured status dot */}
        <span
          className={`w-1.5 h-1.5 rounded-full shrink-0 ${
            isFlagged ? "bg-red-400 animate-pulse" : lineColor === "#34d399" ? "bg-emerald-400" : "bg-amber-400"
          }`}
        />

        {/* Name + value */}
        <div className="flex-1 min-w-0">
          <div className="text-[11px] font-bold text-white/90 truncate leading-tight">
            {metric.canonical_name}
          </div>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="font-mono text-[11px] font-black text-white">
              {metric.latest_value ?? "—"}
            </span>
            <span className="text-[10px] text-white/40">{metric.unit}</span>
            <span className={`text-[10px] font-bold flex items-center gap-0.5 ${trendColor(dir, status)}`}>
              <TrendIcon dir={dir} status={status} />
              {trendLabel(dir, status)}
            </span>
          </div>
        </div>

        {/* Sparkline */}
        <MiniSparkline history={metric.history} color={lineColor} />

        {/* Expand chevron */}
        <div className="text-white/30 shrink-0">
          {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </div>
      </div>

      {/* Expanded detail */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            key="expanded"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-3 pb-3 space-y-2 border-t border-white/8 pt-2">
              {/* Full chart */}
              {histPoints.length >= 2 && (
                <div className="h-20 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={histPoints} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                      <Line
                        type="monotone"
                        dataKey="v"
                        stroke={lineColor}
                        strokeWidth={2}
                        dot={{ r: 3, fill: lineColor, strokeWidth: 0 }}
                        isAnimationActive={false}
                      />
                      <RechartTooltip
                        content={({ active, payload }) => {
                          if (!active || !payload?.length) return null;
                          return (
                            <div className="bg-black/90 border border-white/15 rounded-lg px-2 py-1 text-[10px]">
                              <span className="font-mono font-black text-white">
                                {payload[0].value} {metric.unit}
                              </span>
                            </div>
                          );
                        }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* Prediction note */}
              {metric.prediction?.has_prediction && metric.prediction.predicted_value != null && (
                <div className="text-[10px] text-white/50 bg-white/5 rounded-lg px-2 py-1.5">
                  60-day projection:{" "}
                  <span className="font-mono font-bold text-white/80">
                    {metric.prediction.predicted_value} {metric.unit}
                  </span>
                  {metric.prediction.expected_range_min != null && (
                    <span className="ml-1 text-white/30">
                      ({metric.prediction.expected_range_min}–{metric.prediction.expected_range_max})
                    </span>
                  )}
                </div>
              )}

              {/* Report link */}
              <Link
                href="/clinic"
                className="flex items-center gap-1 text-[10px] text-primary/70 hover:text-primary transition-colors font-semibold"
                onClick={e => e.stopPropagation()}
              >
                <ExternalLink className="w-3 h-3" />
                View in Clinic Portal
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ── Loading skeleton ──────────────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5 flex items-center gap-2.5 animate-pulse">
      <div className="w-1.5 h-1.5 rounded-full bg-white/20 shrink-0" />
      <div className="flex-1 space-y-1.5">
        <div className="h-2.5 bg-white/10 rounded w-2/3" />
        <div className="h-2 bg-white/8 rounded w-1/3" />
      </div>
      <div className="w-16 h-6 bg-white/8 rounded" />
    </div>
  );
}

// ── Main panel ────────────────────────────────────────────────────────────────
interface SystemicInsightsPanelProps {
  metrics: MetricTrendItem[];
  isLoading: boolean;
  /** When false (default) the inner "Lab Insights" label row is hidden
   *  because the containing floating card already has a header. */
  showHeader?: boolean;
}

export function SystemicInsightsPanel({ metrics, isLoading, showHeader = false }: SystemicInsightsPanelProps) {
  const flagged  = metrics.filter(m => m.latest_status === "high" || m.latest_status === "low" || m.latest_status === "flagged");
  const routine  = metrics.filter(m => m.latest_status !== "high" && m.latest_status !== "low" && m.latest_status !== "flagged");

  return (
    <div className="space-y-2">
      {/* Optional section header */}
      {showHeader && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <FlaskConical className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-[11px] font-black text-muted-foreground uppercase tracking-widest">
              Lab Insights
            </span>
          </div>
          {metrics.length > 0 && (
            <Link
              href="/clinic"
              className="flex items-center gap-1 text-[10px] text-primary/60 hover:text-primary transition-colors font-semibold"
            >
              <Sparkles className="w-3 h-3" /> Clinic Portal
            </Link>
          )}
        </div>
      )}

      {/* Loading */}
      {isLoading && (
        <div className="space-y-2">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      )}

      {/* Empty state */}
      {!isLoading && metrics.length === 0 && (
        <div className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-4 text-center space-y-2">
          <FlaskConical className="w-6 h-6 text-white/20 mx-auto" />
          <p className="text-[11px] text-white/40 leading-relaxed">
            Upload a clinic report to see insights here
          </p>
          <Link
            href="/clinic"
            className="inline-flex items-center gap-1 text-[11px] text-primary/70 hover:text-primary font-semibold transition-colors"
          >
            <ExternalLink className="w-3 h-3" /> Go to Clinic Portal
          </Link>
        </div>
      )}

      {/* Flagged first */}
      {!isLoading && flagged.length > 0 && (
        <div className="space-y-1.5">
          <div className="text-[9px] font-bold text-red-400/80 uppercase tracking-widest px-0.5 flex items-center gap-1">
            <AlertTriangle className="w-3 h-3" /> Flagged ({flagged.length})
          </div>
          {flagged.map(m => (
            <SystemicCard key={m.metric_key} metric={m} />
          ))}
        </div>
      )}

      {/* Routine */}
      {!isLoading && routine.length > 0 && (
        <div className="space-y-1.5">
          {flagged.length > 0 && (
            <div className="text-[9px] font-bold text-white/30 uppercase tracking-widest px-0.5">
              All Biomarkers ({routine.length})
            </div>
          )}
          {routine.map(m => (
            <SystemicCard key={m.metric_key} metric={m} />
          ))}
        </div>
      )}
    </div>
  );
}
