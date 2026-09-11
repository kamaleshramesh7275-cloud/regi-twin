import React, { useState } from "react";
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceArea,
  ReferenceLine
} from "recharts";
import { TrendingUp, TrendingDown, Minus, Info, AlertTriangle, Sparkles, CheckCircle2, ShieldAlert } from "lucide-react";

export interface MetricTrendItem {
  metric_key: string;
  canonical_name: string;
  unit: string;
  ref_low?: number | null;
  ref_high?: number | null;
  latest_value?: number | null;
  latest_status?: string;
  history: Array<{
    id: string;
    date: string;
    timestamp: string;
    value: number;
    status: string;
    confidence_tier?: string;
    source?: string;
  }>;
  prediction?: {
    has_prediction: boolean;
    status: string;
    history_count: number;
    required_count: number;
    message?: string;
    predicted_value?: number | null;
    expected_range_min?: number | null;
    expected_range_max?: number | null;
    projected_date?: string;
    trend_slope?: number;
    trend_direction?: string;
    std_error?: number;
    disclaimer?: string;
    forecast_series?: Array<{
      date: string;
      value: number;
      is_forecast?: boolean;
      expected_min?: number;
      expected_max?: number;
    }>;
  };
}

interface PredictiveTrendsViewProps {
  metrics: MetricTrendItem[];
  isLoading?: boolean;
}

export const PredictiveTrendsView: React.FC<PredictiveTrendsViewProps> = ({
  metrics,
  isLoading = false
}) => {
  const [selectedKey, setSelectedKey] = useState<string>(metrics[0]?.metric_key || "fasting_blood_glucose");

  const currentMetric = metrics.find(m => m.metric_key === selectedKey) || metrics[0];

  if (isLoading) {
    return (
      <div className="bg-card border border-border/70 rounded-2xl p-8 text-center space-y-3">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-xs text-muted-foreground">Loading longitudinal clinical metrics & predictive models...</p>
      </div>
    );
  }

  if (!metrics || metrics.length === 0) {
    return (
      <div className="bg-card border border-border/70 rounded-2xl p-8 text-center space-y-3">
        <div className="w-12 h-12 rounded-full bg-secondary/50 flex items-center justify-center mx-auto text-muted-foreground">
          <TrendingUp className="w-6 h-6" />
        </div>
        <h3 className="font-bold text-foreground">No Confirmed Lab Records Found</h3>
        <p className="text-xs text-muted-foreground max-w-md mx-auto">
          Upload and confirm a clinical laboratory panel in the Review Queue to unlock longitudinal trend tracking and explainable predictive forecasting.
        </p>
      </div>
    );
  }

  // Build chart dataset combining historical data + forecast projections
  const historyPoints = currentMetric?.history || [];
  const prediction = currentMetric?.prediction;
  const hasPrediction = prediction?.has_prediction && historyPoints.length >= 3;

  const chartData: any[] = [];
  historyPoints.forEach(pt => {
    chartData.push({
      date: pt.date,
      displayDate: new Date(pt.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      actualValue: pt.value,
      projectedValue: null,
      confidenceMin: null,
      confidenceMax: null,
      coneSpread: null,
      isForecast: false,
      source: pt.source || "clinicReportOCR"
    });
  });

  if (hasPrediction && prediction?.projected_date && prediction.predicted_value !== null) {
    // Add the connecting bridge from the last actual point to the forecast point
    const lastActual = historyPoints[historyPoints.length - 1];
    if (chartData.length > 0) {
      chartData[chartData.length - 1].projectedValue = lastActual.value;
      chartData[chartData.length - 1].confidenceMin = lastActual.value;
      chartData[chartData.length - 1].confidenceMax = lastActual.value;
      chartData[chartData.length - 1].coneSpread = [lastActual.value, lastActual.value];
    }

    const expMin = prediction.expected_range_min ?? prediction.predicted_value;
    const expMax = prediction.expected_range_max ?? prediction.predicted_value;

    chartData.push({
      date: prediction.projected_date,
      displayDate: new Date(prediction.projected_date).toLocaleDateString("en-US", { month: "short", day: "numeric" }) + " (Proj)",
      actualValue: null,
      projectedValue: prediction.predicted_value,
      confidenceMin: expMin,
      confidenceMax: expMax,
      coneSpread: [expMin, expMax],
      isForecast: true
    });
  }

  const slope = prediction?.trend_slope || 0;
  const trendDir = prediction?.trend_direction || "stable";
  const historyCount = historyPoints.length;
  const requiredCount = prediction?.required_count || 3;

  return (
    <div className="bg-card border border-border/80 rounded-2xl p-5 md:p-6 shadow-xl space-y-6">
      {/* Top Header & Metric Selector Pills */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-border/60">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20">
              <Sparkles className="w-3.5 h-3.5" /> Digital Twin Trajectory Engine
            </span>
            <span className="text-xs text-muted-foreground">{metrics.length} metrics tracked</span>
          </div>
          <h2 className="text-lg font-bold text-foreground mt-1">Predictive Biomarker Longitudinal Trends</h2>
        </div>

        {/* Metric Selector Dropdown / Pills */}
        <div className="flex items-center gap-2">
          <label className="text-xs font-semibold text-muted-foreground">Select Biomarker:</label>
          <select
            value={selectedKey}
            onChange={e => setSelectedKey(e.target.value)}
            aria-label="Select Biomarker"
            className="bg-secondary text-foreground text-xs font-bold rounded-xl px-3 py-2 border border-border focus:border-primary focus:outline-none cursor-pointer"
          >
            {metrics.map(m => (
              <option key={m.metric_key} value={m.metric_key}>
                {m.canonical_name} ({m.unit})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* KPI Cards Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Latest Value */}
        <div className="bg-secondary/40 border border-border/60 rounded-xl p-3.5">
          <span className="text-[11px] font-medium text-muted-foreground block">Latest Confirmed</span>
          <div className="flex items-baseline gap-1.5 mt-1">
            <span className="text-xl font-black text-foreground font-mono">
              {currentMetric?.latest_value ?? "—"}
            </span>
            <span className="text-xs text-muted-foreground">{currentMetric?.unit}</span>
          </div>
          <span className={`text-[10px] font-bold mt-1 inline-block uppercase ${
            currentMetric?.latest_status === "normal" ? "text-emerald-400" : "text-amber-400"
          }`}>
            Status: {currentMetric?.latest_status || "Normal"}
          </span>
        </div>

        {/* History Gate */}
        <div className="bg-secondary/40 border border-border/60 rounded-xl p-3.5">
          <span className="text-[11px] font-medium text-muted-foreground block">History Gate (≥ 3 pts)</span>
          <div className="flex items-baseline gap-1.5 mt-1">
            <span className="text-xl font-black text-foreground font-mono">
              {historyCount}/{requiredCount}
            </span>
            <span className="text-xs text-muted-foreground">Entries</span>
          </div>
          <span className={`text-[10px] font-bold mt-1 inline-block ${
            historyCount >= 3 ? "text-emerald-400" : "text-amber-400"
          }`}>
            {historyCount >= 3 ? "● Forecasting Active" : "○ Needs More History"}
          </span>
        </div>

        {/* 60-Day Projected Forecast */}
        <div className="bg-secondary/40 border border-border/60 rounded-xl p-3.5">
          <span className="text-[11px] font-medium text-muted-foreground block">60-Day Projected Value</span>
          <div className="flex items-baseline gap-1.5 mt-1">
            <span className="text-xl font-black text-primary font-mono">
              {hasPrediction && prediction?.predicted_value !== null ? prediction?.predicted_value : "—"}
            </span>
            <span className="text-xs text-muted-foreground">{currentMetric?.unit}</span>
          </div>
          <span className="text-[10px] text-muted-foreground mt-1 inline-block">
            {hasPrediction && prediction?.expected_range_min !== null
              ? `Cone: ${prediction?.expected_range_min}–${prediction?.expected_range_max} ${currentMetric?.unit}`
              : "Linear regression model"}
          </span>
        </div>

        {/* Trend Direction & Slope */}
        <div className="bg-secondary/40 border border-border/60 rounded-xl p-3.5">
          <span className="text-[11px] font-medium text-muted-foreground block">Trend Velocity</span>
          <div className="flex items-center gap-1.5 mt-1">
            {trendDir === "up" ? (
              <TrendingUp className="w-4 h-4 text-amber-400" />
            ) : trendDir === "down" ? (
              <TrendingDown className="w-4 h-4 text-emerald-400" />
            ) : (
              <Minus className="w-4 h-4 text-muted-foreground" />
            )}
            <span className="text-sm font-bold font-mono text-foreground">
              {slope > 0 ? `+${slope}` : slope} {currentMetric?.unit}/mo
            </span>
          </div>
          <span className="text-[10px] text-muted-foreground mt-1 inline-block capitalize">
            Trajectory: {trendDir}
          </span>
        </div>
      </div>

      {/* Recharts Longitudinal Interactive Chart */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 bg-primary rounded inline-block" /> Confirmed Lab Readings
            </span>
            {hasPrediction && (
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-0.5 border-t border-dashed border-primary inline-block" /> 60-Day Linear Projection
              </span>
            )}
            {hasPrediction && (
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-2 bg-primary/20 rounded inline-block" /> Predictive Confidence Cone (±1.5σ)
              </span>
            )}
          </div>
          {currentMetric?.ref_low !== null && currentMetric?.ref_high !== null && (
            <span className="text-[11px]">
              Standard Reference: <strong className="text-foreground">{currentMetric.ref_low} – {currentMetric.ref_high} {currentMetric.unit}</strong>
            </span>
          )}
        </div>

        <div className="w-full h-72 bg-card/50 rounded-xl p-2 border border-border/50">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} margin={{ top: 15, right: 25, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" opacity={0.6} />
              
              <XAxis
                dataKey="displayDate"
                stroke="#71717a"
                fontSize={11}
                tickLine={false}
              />
              <YAxis
                stroke="#71717a"
                fontSize={11}
                tickLine={false}
                domain={['auto', 'auto']}
                unit={` ${currentMetric?.unit || ""}`}
              />

              <Tooltip
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-popover border border-border rounded-xl p-3 shadow-xl text-xs space-y-1.5">
                        <div className="font-bold text-foreground border-b border-border/50 pb-1 flex items-center justify-between gap-3">
                          <span>{data.displayDate}</span>
                          <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${
                            data.isForecast ? "bg-primary/20 text-primary" : "bg-secondary text-muted-foreground"
                          }`}>
                            {data.isForecast ? "Predicted Projection" : "Confirmed OCR"}
                          </span>
                        </div>
                        {data.actualValue !== null && (
                          <div className="flex justify-between gap-4">
                            <span className="text-muted-foreground">Reading:</span>
                            <span className="font-mono font-bold text-foreground">{data.actualValue} {currentMetric?.unit}</span>
                          </div>
                        )}
                        {data.projectedValue !== null && (
                          <div className="flex justify-between gap-4">
                            <span className="text-primary font-medium">Projected:</span>
                            <span className="font-mono font-bold text-primary">{data.projectedValue} {currentMetric?.unit}</span>
                          </div>
                        )}
                        {data.confidenceMin !== null && (
                          <div className="flex justify-between gap-4 text-[11px] text-muted-foreground">
                            <span>Confidence Bounds:</span>
                            <span className="font-mono">{data.confidenceMin} – {data.confidenceMax} {currentMetric?.unit}</span>
                          </div>
                        )}
                      </div>
                    );
                  }
                  return null;
                }}
              />

              {/* Shaded Reference Range Band */}
              {currentMetric?.ref_low !== null && currentMetric?.ref_high !== null && (
                <ReferenceArea
                  y1={currentMetric.ref_low}
                  y2={currentMetric.ref_high}
                  fill="#10b981"
                  fillOpacity={0.05}
                  stroke="#10b981"
                  strokeOpacity={0.2}
                  strokeDasharray="2 2"
                />
              )}

              {/* Shaded Confidence Cone for Projection */}
              {hasPrediction && (
                <Area
                  type="monotone"
                  dataKey="coneSpread"
                  fill="#3b82f6"
                  fillOpacity={0.15}
                  stroke="none"
                />
              )}

              {/* Historical Confirmed Line */}
              <Line
                type="monotone"
                dataKey="actualValue"
                stroke="#3b82f6"
                strokeWidth={2.5}
                dot={{ r: 5, fill: "#3b82f6", stroke: "#1e293b", strokeWidth: 2 }}
                activeDot={{ r: 7 }}
                connectNulls={false}
              />

              {/* Dotted Predictive Forecast Line */}
              {hasPrediction && (
                <Line
                  type="monotone"
                  dataKey="projectedValue"
                  stroke="#60a5fa"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={{ r: 5, fill: "#60a5fa", stroke: "#1e293b", strokeWidth: 2 }}
                  activeDot={{ r: 7 }}
                  connectNulls={true}
                />
              )}
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Explanatory Note & History Threshold Gate Notice */}
      {!hasPrediction && (
        <div className="bg-secondary/30 border border-border/70 rounded-xl p-3.5 flex items-start gap-3 text-xs text-muted-foreground">
          <Info className="w-4 h-4 text-primary shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            <strong className="text-foreground">Minimum History Threshold Gate:</strong> Predictive trend regression cones require at least <strong className="text-foreground">3 confirmed temporal lab entries</strong> to model statistical variance and prevent spurious forecasts. You currently have <strong className="text-primary font-bold">{historyCount}</strong> entries for this metric.
          </p>
        </div>
      )}

      {/* Mandatory Non-Diagnostic Disclaimer */}
      <div className="bg-secondary/15 border border-border/50 rounded-xl p-3.5 text-center">
        <p className="text-[11px] text-muted-foreground leading-relaxed">
          ⚠️ <strong className="text-foreground">Non-Diagnostic Notice:</strong> This is a pattern-based mathematical observation of your historical laboratory metrics, not a clinical diagnosis or medical judgment. Always discuss these findings with a licensed physician or healthcare professional.
        </p>
      </div>
    </div>
  );
};
