import math
import datetime
from typing import List, Dict, Any, Optional

DISCLAIMER_TEXT = (
    "This is a pattern-based observation, not a medical diagnosis. "
    "Please discuss this result with a healthcare professional."
)

def compute_metric_prediction(
    metric_key: str, 
    historical_points: List[Dict[str, Any]],
    display_name: str = "",
    canonical_name: str = "",
    unit: str = "",
    ref_low: Optional[float] = None,
    ref_high: Optional[float] = None,
    forecast_days: int = 60
) -> Dict[str, Any]:
    """
    Computes an explainable predictive forecast for a given clinical metric.
    Enforces a 3-point minimum history gate.
    
    historical_points: list of {"date": "2026-01-15", "value": 94.0, "source": "clinicReportOCR"}
    """
    name = display_name or canonical_name or metric_key
    # Sort chronological
    sorted_points = sorted(
        historical_points, 
        key=lambda p: str(p.get("date") or p.get("recorded_date") or "")
    )
    
    n = len(sorted_points)
    
    # Check minimum history threshold gate
    if n < 3:
        return {
            "metric_key": metric_key,
            "display_name": display_name or metric_key,
            "unit": unit,
            "has_prediction": False,
            "status": "not_enough_history",
            "history_count": n,
            "required_count": 3,
            "message": f"Requires at least 3 confirmed entries to compute predictive trend. Currently have {n}.",
            "historical_points": sorted_points,
            "forecast_series": sorted_points,
            "predicted_value": None,
            "expected_range_min": None,
            "expected_range_max": None,
            "trend_slope": 0.0,
            "trend_direction": "insufficient_data"
        }

    # Extract X (time in days from first point) and Y (values)
    t0 = _parse_date(sorted_points[0].get("date") or sorted_points[0].get("recorded_date"))
    x_vals = []
    y_vals = []
    
    for i, pt in enumerate(sorted_points):
        d = _parse_date(pt.get("date") or pt.get("recorded_date"))
        day_offset = (d - t0).total_seconds() / 86400.0
        x_vals.append(day_offset if day_offset > 0 else float(i * 30))
        y_vals.append(float(pt.get("value", 0.0)))

    # Linear regression: y = m*x + b
    x_mean = sum(x_vals) / n
    y_mean = sum(y_vals) / n
    
    numerator = sum((x_vals[i] - x_mean) * (y_vals[i] - y_mean) for i in range(n))
    denominator = sum((x_vals[i] - x_mean) ** 2 for i in range(n))
    
    slope = (numerator / denominator) if denominator != 0 else 0.0
    intercept = y_mean - slope * x_mean

    # Standard error of regression
    residuals = [(y_vals[i] - (slope * x_vals[i] + intercept)) for i in range(n)]
    variance = sum(r**2 for r in residuals) / max(1, n - 2)
    std_err = math.sqrt(variance) if variance >= 0 else 1.0

    # Project next time point (assume next interval is roughly 30 to 60 days ahead)
    last_x = x_vals[-1]
    avg_interval = (last_x / max(1, n - 1)) if last_x > 0 else 30.0
    next_x = last_x + max(30.0, avg_interval)
    
    next_date = _parse_date(sorted_points[-1].get("date") or sorted_points[-1].get("recorded_date")) + datetime.timedelta(days=int(avg_interval))
    next_date_str = next_date.strftime("%Y-%m-%d")

    # Forecast calculation
    predicted_val = round(slope * next_x + intercept, 2)
    
    # Margin of error (approx 85% confidence interval ~ 1.5 * std_err)
    margin = max(std_err * 1.5, abs(predicted_val) * 0.05)
    expected_min = round(max(0.0, predicted_val - margin), 2)
    expected_max = round(predicted_val + margin, 2)

    # Trend classification
    relative_change = (slope * avg_interval) / max(0.1, y_mean)
    if relative_change > 0.04:
        trend_direction = "rising"
    elif relative_change < -0.04:
        trend_direction = "declining"
    else:
        trend_direction = "stable"

    # Build Recharts series
    forecast_series = []
    for i, pt in enumerate(sorted_points):
        d_str = str(pt.get("date") or pt.get("recorded_date") or f"Point {i+1}")[:10]
        forecast_series.append({
            "date": d_str,
            "actual": round(float(pt.get("value", 0.0)), 2),
            "trend": round(slope * x_vals[i] + intercept, 2),
            "expected_min": None,
            "expected_max": None,
            "is_projected": False,
            "source": pt.get("source", "clinicReportOCR")
        })

    # Append future projected point
    forecast_series.append({
        "date": f"{next_date_str} (Projected)",
        "actual": None,
        "trend": predicted_val,
        "expected_min": expected_min,
        "expected_max": expected_max,
        "is_projected": True,
        "source": "predictiveModel"
    })

    return {
        "metric_key": metric_key,
        "display_name": display_name or metric_key,
        "unit": unit,
        "has_prediction": True,
        "status": "forecast_active",
        "history_count": n,
        "required_count": 3,
        "predicted_value": predicted_val,
        "expected_range_min": expected_min,
        "expected_range_max": expected_max,
        "projected_date": next_date_str,
        "trend_slope": round(slope * 30, 3),  # delta per month
        "trend_direction": trend_direction,
        "std_error": round(std_err, 2),
        "disclaimer": DISCLAIMER_TEXT,
        "historical_points": sorted_points,
        "forecast_series": forecast_series
    }


def evaluate_clinical_anomaly(
    metric_key: str = "",
    new_value: Optional[float] = None,
    prediction: Optional[Dict[str, Any]] = None,
    ref_min: Optional[float] = None,
    ref_max: Optional[float] = None,
    display_name: str = "",
    canonical_name: str = "",
    metric_name: str = "",
    unit: str = "",
    latest_value: Optional[float] = None,
    prediction_result: Optional[Dict[str, Any]] = None,
    ref_low: Optional[float] = None,
    ref_high: Optional[float] = None
) -> Optional[Dict[str, Any]]:
    """
    Evaluates if newly confirmed value deviates from expected statistical projection or clinical reference bounds.
    """
    pred = prediction_result or prediction or {}
    val = new_value if new_value is not None else (latest_value if latest_value is not None else 0.0)
    name = metric_name or canonical_name or display_name or pred.get("display_name") or metric_key
    m_unit = unit or pred.get("unit", "")
    r_min = ref_min if ref_min is not None else ref_low
    r_max = ref_max if ref_max is not None else ref_high
    
    exp_min = pred.get("expected_range_min")
    exp_max = pred.get("expected_range_max")
    pred_val = pred.get("predicted_value")

    is_trend_anomaly = False
    is_ref_anomaly = False
    reasons = []

    # 1. Check statistical trend deviation
    if exp_min is not None and exp_max is not None and val is not None:
        if val < exp_min or val > exp_max:
            is_trend_anomaly = True
            delta_dir = "higher" if val > exp_max else "lower"
            reasons.append(
                f"Your latest reading ({val} {m_unit}) is noticeably {delta_dir} than your expected historical projection ({exp_min}–{exp_max} {m_unit})."
            )

    # 2. Check lab reference range bounds
    if r_min is not None and val < r_min:
        is_ref_anomaly = True
        reasons.append(f"Value is below standard clinical reference bounds (< {r_min} {m_unit}).")
    elif r_max is not None and val > r_max:
        is_ref_anomaly = True
        reasons.append(f"Value exceeds standard clinical reference bounds (> {r_max} {m_unit}).")

    if not is_trend_anomaly and not is_ref_anomaly:
        return None

    alert_type = "out_of_reference" if is_ref_anomaly else "trend_anomaly"
    title = f"Notice: {name} Trajectory Shift" if is_trend_anomaly else f"Clinical Flag: {name}"
    message = " ".join(reasons)

    return {
        "metric_key": metric_key or pred.get("metric_key", "metric"),
        "metric_name": name,
        "canonical_name": name,
        "actual_value": val,
        "trigger_value": val,
        "predicted_value": pred_val,
        "expected_range_min": exp_min,
        "expected_range_max": exp_max,
        "alert_type": alert_type,
        "severity": "caution" if is_ref_anomaly else "info",
        "title": title,
        "message": message,
        "suggested_action": f"Review this {name} pattern with your clinician at your next scheduled visit.",
        "disclaimer": DISCLAIMER_TEXT
    }


def _parse_date(d_val: Any) -> datetime.datetime:
    if isinstance(d_val, datetime.datetime):
        return d_val
    if isinstance(d_val, str) and d_val:
        try:
            return datetime.datetime.fromisoformat(d_val.replace("Z", "+00:00")).replace(tzinfo=None)
        except Exception:
            try:
                return datetime.datetime.strptime(d_val[:10], "%Y-%m-%d")
            except Exception:
                pass
    return datetime.datetime.utcnow()
