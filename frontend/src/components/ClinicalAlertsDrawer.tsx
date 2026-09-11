import React from "react";
import { AlertCircle, AlertTriangle, CheckCircle2, Bell, ShieldAlert, Sparkles, Check, ArrowUpRight } from "lucide-react";

export interface ClinicalAlertItem {
  id: string | number;
  metric_key: string;
  canonical_name?: string;
  metric_name?: string;
  alert_type: string;
  severity: string;
  title: string;
  message: string;
  disclaimer: string;
  suggested_action?: string;
  trigger_value?: number;
  expected_range_min?: number;
  expected_range_max?: number;
  is_read: boolean;
  created_at?: string;
}

interface ClinicalAlertsDrawerProps {
  alerts: ClinicalAlertItem[];
  onMarkRead: (alertId: string | number) => Promise<void>;
  isLoading?: boolean;
}

export const ClinicalAlertsDrawer: React.FC<ClinicalAlertsDrawerProps> = ({
  alerts,
  onMarkRead,
  isLoading = false
}) => {
  const unreadCount = alerts.filter(a => !a.is_read).length;

  return (
    <div className="bg-card border border-border/80 rounded-2xl p-5 md:p-6 shadow-xl space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-border/60">
        <div className="flex items-center gap-2.5">
          <div className="relative">
            <Bell className="w-5 h-5 text-primary" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-amber-500 rounded-full animate-pulse" />
            )}
          </div>
          <div>
            <h2 className="text-base font-bold text-foreground">Clinical Trajectory Alerts & Flags</h2>
            <p className="text-xs text-muted-foreground">Pattern-based observations and statistical shift notifications</p>
          </div>
        </div>

        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-secondary text-secondary-foreground">
          {unreadCount} Unread
        </span>
      </div>

      {/* Alert List */}
      {isLoading ? (
        <div className="p-6 text-center text-xs text-muted-foreground">Loading notifications...</div>
      ) : alerts.length === 0 ? (
        <div className="p-8 text-center space-y-2 bg-secondary/20 rounded-xl border border-border/40">
          <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
          <h4 className="text-sm font-bold text-foreground">All Biomarkers Within Expected Trajectory</h4>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            No statistical trend anomalies or out-of-reference bounds detected across your confirmed laboratory panels.
          </p>
        </div>
      ) : (
        <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
          {alerts.map(alert => {
            const isCaution = alert.severity === "caution" || alert.alert_type === "out_of_reference";

            return (
              <div
                key={alert.id}
                className={`p-4 rounded-xl border transition-all ${
                  alert.is_read
                    ? "bg-secondary/20 border-border/40 opacity-70"
                    : isCaution
                    ? "bg-amber-500/5 border-amber-500/30"
                    : "bg-primary/5 border-primary/25"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg mt-0.5 shrink-0 ${
                      isCaution ? "bg-amber-500/20 text-amber-400" : "bg-primary/20 text-primary"
                    }`}>
                      {isCaution ? <AlertTriangle className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-sm text-foreground">{alert.title}</h4>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                          isCaution ? "bg-amber-500/20 text-amber-400" : "bg-primary/20 text-primary"
                        }`}>
                          {alert.alert_type.replace('_', ' ')}
                        </span>
                      </div>

                      <p className="text-xs text-foreground/90 leading-relaxed">{alert.message}</p>

                      {alert.suggested_action && (
                        <p className="text-xs text-muted-foreground font-medium flex items-center gap-1 mt-1">
                          <ArrowUpRight className="w-3.5 h-3.5 text-primary" /> {alert.suggested_action}
                        </p>
                      )}

                      {/* Required Non-Diagnostic Disclaimer Box */}
                      <div className="mt-2 text-[10px] text-muted-foreground/90 bg-secondary/40 rounded-lg p-2 border border-border/40 font-mono">
                        ⚖️ {alert.disclaimer}
                      </div>
                    </div>
                  </div>

                  {!alert.is_read && (
                    <button
                      onClick={() => onMarkRead(alert.id)}
                      className="text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-secondary hover:bg-secondary/80 text-secondary-foreground flex items-center gap-1 shrink-0 transition-colors"
                      title="Acknowledge alert"
                    >
                      <Check className="w-3.5 h-3.5" /> Dismiss
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
