import os
import re
import json
import logging
from typing import List, Dict, Any, Optional

logger = logging.getLogger("clinic_parser")

# Canonical clinical metrics dictionary with regex aliases, standard units, reference bounds, and display titles
CANONICAL_METRICS = {
    "hemoglobin": {
        "display_name": "Hemoglobin (Hb)",
        "aliases": [r"\b(hemoglobin|haemoglobin|hb|hgb|hemo)\b"],
        "default_unit": "g/dL",
        "ref_min": 13.0,
        "ref_max": 17.5,
        "ref_str": "13.0 - 17.5 g/dL",
        "category": "Hematology"
    },
    "glucose_fasting": {
        "display_name": "Fasting Blood Glucose",
        "aliases": [r"\b(fasting\s+blood\s+glucose|fasting\s+glucose|fasting\s+sugar|fbs|gluccoe|gluccee|glucse|glucose\s*\(?fasting\)?)\b"],
        "default_unit": "mg/dL",
        "ref_min": 70.0,
        "ref_max": 99.0,
        "ref_str": "70 - 99 mg/dL",
        "category": "Metabolic"
    },
    "glucose_random": {
        "display_name": "Random Blood Glucose",
        "aliases": [r"\b(random\s+blood\s+sugar|rbs|random\s+glucose|glucose\s*\(?random\)?|blood\s+sugar)\b"],
        "default_unit": "mg/dL",
        "ref_min": 70.0,
        "ref_max": 140.0,
        "ref_str": "70 - 140 mg/dL",
        "category": "Metabolic"
    },
    "hba1c": {
        "display_name": "Glycated Hemoglobin (HbA1c)",
        "aliases": [r"\b(hba1c|hbaic|glycated\s+hemoglobin|glycohemoglobin|a1c|hb\s*a1c)\b"],
        "default_unit": "%",
        "ref_min": 4.0,
        "ref_max": 5.6,
        "ref_str": "4.0 - 5.6 %",
        "category": "Metabolic"
    },
    "cholesterol_total": {
        "display_name": "Total Cholesterol",
        "aliases": [r"\b(total\s+cholesterol|cholesterol\s+total|serum\s+cholesterol|cholestrol|cholesterol)\b"],
        "default_unit": "mg/dL",
        "ref_min": 125.0,
        "ref_max": 200.0,
        "ref_str": "< 200 mg/dL",
        "category": "Lipid Profile"
    },
    "hdl": {
        "display_name": "HDL Cholesterol ('Good')",
        "aliases": [r"\b(hdl\s+cholesterol|hdl\s+direct|hdl|high\s+density\s+lipoprotein)\b"],
        "default_unit": "mg/dL",
        "ref_min": 40.0,
        "ref_max": 60.0,
        "ref_str": "> 40 mg/dL",
        "category": "Lipid Profile"
    },
    "ldl": {
        "display_name": "LDL Cholesterol ('Bad')",
        "aliases": [r"\b(ldl\s+cholesterol|ldl\s+direct|ldl|low\s+density\s+lipoprotein)\b"],
        "default_unit": "mg/dL",
        "ref_min": 50.0,
        "ref_max": 100.0,
        "ref_str": "< 100 mg/dL",
        "category": "Lipid Profile"
    },
    "triglycerides": {
        "display_name": "Serum Triglycerides",
        "aliases": [r"\b(triglycerides|serum\s+triglycerides|tg|trigs|triglycer)\b"],
        "default_unit": "mg/dL",
        "ref_min": 50.0,
        "ref_max": 150.0,
        "ref_str": "< 150 mg/dL",
        "category": "Lipid Profile"
    },
    "creatinine": {
        "display_name": "Serum Creatinine",
        "aliases": [r"\b(serum\s+creatinine|creatinine\s+serum|creatinine|creatin)\b"],
        "default_unit": "mg/dL",
        "ref_min": 0.7,
        "ref_max": 1.3,
        "ref_str": "0.7 - 1.3 mg/dL",
        "category": "Renal Function"
    },
    "egfr": {
        "display_name": "Estimated GFR (eGFR)",
        "aliases": [r"\b(egfr|estimated\s+gfr|gfr\s+calculated)\b"],
        "default_unit": "mL/min/1.73m2",
        "ref_min": 90.0,
        "ref_max": 130.0,
        "ref_str": "> 90 mL/min/1.73m2",
        "category": "Renal Function"
    },
    "uric_acid": {
        "display_name": "Serum Uric Acid",
        "aliases": [r"\b(uric\s+acid|serum\s+uric\s+acid)\b"],
        "default_unit": "mg/dL",
        "ref_min": 3.5,
        "ref_max": 7.2,
        "ref_str": "3.5 - 7.2 mg/dL",
        "category": "Renal / Metabolic"
    },
    "vitamin_d": {
        "display_name": "Vitamin D (25-OH)",
        "aliases": [r"\b(25\s*-?\s*hydroxy\s+vitamin\s+d|vitamin\s+d3?|25\s*-?\s*oh\s+vitamin\s+d|vit\s*d)\b"],
        "default_unit": "ng/mL",
        "ref_min": 30.0,
        "ref_max": 100.0,
        "ref_str": "30 - 100 ng/mL",
        "category": "Vitamins & Hormones"
    },
    "ferritin": {
        "display_name": "Serum Ferritin",
        "aliases": [r"\b(serum\s+ferritin|ferritin)\b"],
        "default_unit": "ng/mL",
        "ref_min": 30.0,
        "ref_max": 400.0,
        "ref_str": "30 - 400 ng/mL",
        "category": "Hematology"
    },
    "testosterone": {
        "display_name": "Total Testosterone",
        "aliases": [r"\b(total\s+testosterone|serum\s+testosterone|testosterone\s+total)\b"],
        "default_unit": "ng/dL",
        "ref_min": 300.0,
        "ref_max": 1000.0,
        "ref_str": "300 - 1000 ng/dL",
        "category": "Vitamins & Hormones"
    },
    "crp": {
        "display_name": "hs-CRP (Inflammation)",
        "aliases": [r"\b(hs\s*-?\s*crp|c\s*-?\s*reactive\s+protein|crp)\b"],
        "default_unit": "mg/L",
        "ref_min": 0.0,
        "ref_max": 1.0,
        "ref_str": "< 1.0 mg/L",
        "category": "Cardiovascular"
    },
    "bp_systolic": {
        "display_name": "Systolic Blood Pressure",
        "aliases": [r"\b(systolic|sys\s*bp|sbp)\b"],
        "default_unit": "mmHg",
        "ref_min": 90.0,
        "ref_max": 120.0,
        "ref_str": "90 - 120 mmHg",
        "category": "Vital Signs"
    },
    "bp_diastolic": {
        "display_name": "Diastolic Blood Pressure",
        "aliases": [r"\b(diastolic|dia\s*bp|dbp)\b"],
        "default_unit": "mmHg",
        "ref_min": 60.0,
        "ref_max": 80.0,
        "ref_str": "60 - 80 mmHg",
        "category": "Vital Signs"
    },
    "heart_rate": {
        "display_name": "Heart Rate / Pulse",
        "aliases": [r"\b(heart\s+rate|pulse|pulse\s+rate|hr|bpm)\b"],
        "default_unit": "bpm",
        "ref_min": 60.0,
        "ref_max": 100.0,
        "ref_str": "60 - 100 bpm",
        "category": "Vital Signs"
    },
    "spo2": {
        "display_name": "Oxygen Saturation (SpO2)",
        "aliases": [r"\b(spo2|pulse\s+ox|oxygen\s+saturation|o2\s+sat)\b"],
        "default_unit": "%",
        "ref_min": 95.0,
        "ref_max": 100.0,
        "ref_str": "95 - 100 %",
        "category": "Vital Signs"
    },
    "weight": {
        "display_name": "Body Weight",
        "aliases": [r"\b(weight|wt|body\s+weight)\b"],
        "default_unit": "kg",
        "ref_min": 40.0,
        "ref_max": 150.0,
        "ref_str": "45 - 90 kg",
        "category": "Anthropometrics"
    }
}

KEY_NORMALIZATION = {
    "fasting_glucose": "glucose_fasting",
    "fasting_blood_glucose": "glucose_fasting",
    "fasting_blood_sugar": "glucose_fasting",
    "fbs": "glucose_fasting",
    "glucose": "glucose_fasting",
    "random_glucose": "glucose_random",
    "random_blood_sugar": "glucose_random",
    "rbs": "glucose_random",
    "total_cholesterol": "cholesterol_total",
    "serum_cholesterol": "cholesterol_total",
    "cholesterol": "cholesterol_total",
    "hdl_cholesterol": "hdl",
    "high_density_lipoprotein": "hdl",
    "ldl_cholesterol": "ldl",
    "low_density_lipoprotein": "ldl",
    "blood_pressure_systolic": "bp_systolic",
    "systolic_bp": "bp_systolic",
    "systolic": "bp_systolic",
    "blood_pressure_diastolic": "bp_diastolic",
    "diastolic_bp": "bp_diastolic",
    "diastolic": "bp_diastolic",
    "pulse": "heart_rate",
    "pulse_rate": "heart_rate",
    "oxygen_saturation": "spo2",
    "pulse_ox": "spo2",
    "body_weight": "weight",
    "wt": "weight",
    "glycated_hemoglobin": "hba1c",
    "hb_a1c": "hba1c",
    "a1c": "hba1c",
    "serum_creatinine": "creatinine",
    "serum_ferritin": "ferritin",
    "serum_uric_acid": "uric_acid",
    "vitamin_d3": "vitamin_d",
    "25_hydroxy_vitamin_d": "vitamin_d",
    "hs_crp": "crp"
}


def _load_env_key(var_name: str) -> str:
    """Load an API key from os.environ or local .env file."""
    val = os.environ.get(var_name, "")
    if not val:
        env_path = os.path.join(os.path.dirname(__file__), ".env")
        if os.path.exists(env_path):
            with open(env_path, "r", encoding="utf-8") as f:
                for line in f:
                    if line.startswith(f"{var_name}="):
                        val = line.split("=", 1)[1].strip()
                        break
    return val


def _get_gemini_client():
    """Return a google.genai Client if GEMINI_API_KEY is configured."""
    api_key = _load_env_key("GEMINI_API_KEY")
    if api_key:
        try:
            import google.genai as genai
            return genai.Client(api_key=api_key)
        except Exception as e:
            logger.warning(f"Failed to init Gemini client: {e}")
    return None


def _get_groq_client():
    """Return a Groq client if GROQ_API_KEY is configured."""
    api_key = _load_env_key("GROQ_API_KEY")
    if api_key:
        try:
            from groq import Groq
            return Groq(api_key=api_key)
        except Exception as e:
            logger.warning(f"Failed to init Groq client: {e}")
    return None


# ──────────────────────────────────────────────────────────────
# Shared metric-item builder (used by all extraction tiers)
# ──────────────────────────────────────────────────────────────

CLINICAL_EXTRACTION_PROMPT = """You are a clinical data transcription AI. Your ONLY job is to read the printed numbers from this lab report image and transcribe them.

Return ONLY valid JSON — no markdown, no explanation:
{
  "metrics": [
    {
      "metric_key": "<snake_case_slug e.g. hemoglobin, fasting_glucose, hba1c, total_cholesterol, hdl, ldl, triglycerides, creatinine, vitamin_d, bp_systolic, bp_diastolic, heart_rate, spo2, weight, ferritin, uric_acid, egfr, crp, testosterone>",
      "display_name": "<exact test name as printed>",
      "value": <the numeric result printed in the document>,
      "unit": "<unit printed in the document>",
      "reference_range": "<reference range printed in the document, or empty string if not shown>",
      "raw_snippet": "<verbatim line from document e.g. 'Hemoglobin  14.2  g/dL  13.0-17.5'>"
    }
  ]
}

STRICT RULES — failure to follow these makes the output useless:
1. ONLY include tests that have a NUMERIC result PRINTED in this document. If you cannot see a number, do NOT include it.
2. NEVER invent, guess, or fill in values from your training data. If a test is common but not printed here, leave it out.
3. NEVER use standard reference ranges as patient results. The patient result is the measured value column, not the reference range column.
4. raw_snippet MUST be copied verbatim from the document. Do not paraphrase.
5. Skip non-result rows: patient name, DOB, lab ID, doctor name, collection date/time, addresses, footnotes.
6. Fix obvious OCR typos in test names only (e.g. 'Haemoglobin' -> hemoglobin), never alter numeric values.
7. For blood pressure printed as '120/80': create two entries — bp_systolic=120, bp_diastolic=80.
8. If the document has NO lab results, return: {"metrics": []}
"""


def _build_metric_from_llm_item(item: dict, engine: str) -> Optional[Dict[str, Any]]:
    """Convert a raw LLM-extracted item dict into a standardized metric record."""
    try:
        raw_key = str(item.get("metric_key", "")).strip().lower().replace(" ", "_").replace("-", "_")
        m_key = KEY_NORMALIZATION.get(raw_key, raw_key)
        val = float(item.get("value"))
        disp_name = item.get("display_name") or m_key.replace("_", " ").title()
        unit = str(item.get("unit") or "").strip()
        ref_range = item.get("reference_range") or ""
        raw_snip = item.get("raw_snippet") or f"{disp_name}: {val} {unit}"

        # Enrich from CANONICAL_METRICS if available
        canon = CANONICAL_METRICS.get(m_key)
        if not canon:
            for k, v in CANONICAL_METRICS.items():
                if k in m_key or m_key in k:
                    canon = v
                    m_key = k
                    break

        ref_min = canon.get("ref_min", 0.0) if canon else 0.0
        ref_max = canon.get("ref_max", 9999.0) if canon else 9999.0
        ref_str = ref_range or (canon.get("ref_str") if canon else "")
        cat = canon.get("category", "General Clinical") if canon else "General Clinical"
        unit = unit or (canon.get("default_unit", "") if canon else "")
        disp_name = canon.get("display_name", disp_name) if canon else disp_name

        is_out_of_range = (val < ref_min or val > ref_max)

        return {
            "id": f"{engine[:3]}-{m_key}-{int(val*10)}",
            "metric_key": m_key,
            "canonical_name": disp_name,
            "display_name": disp_name,
            "category": cat,
            "value": val,
            "unit": unit,
            "reference_range": ref_str,
            "ref_min": ref_min,
            "ref_max": ref_max,
            "ref_low": ref_min,
            "ref_high": ref_max,
            "is_out_of_range": is_out_of_range,
            "confidence": "high",
            "confidence_score": 0.97,
            "confidence_grade": "high",
            "needs_review": is_out_of_range,
            "source_page": 1,
            "raw_snippet": raw_snip,
            "status": "pending",
            "engine": engine
        }
    except Exception as e:
        logger.debug(f"Skipping unparseable item from {engine}: {e}")
        return None


def _repair_truncated_json(raw: str) -> List[dict]:
    """
    Recover as many metric objects as possible from a truncated/malformed JSON string.
    Extracts individual {...} objects from within the metrics array using regex.
    """
    recovered = []
    # Find all {...} blocks that look like metric objects
    for match in re.finditer(r'\{[^{}]+\}', raw, re.DOTALL):
        try:
            obj = json.loads(match.group())
            if "metric_key" in obj and "value" in obj:
                recovered.append(obj)
        except Exception:
            pass
    return recovered


# ──────────────────────────────────────────────────────────────
# TIER 1 PRIMARY: Gemini Flash Vision — reads image bytes directly
# ──────────────────────────────────────────────────────────────

def parse_lab_records_from_image(image_bytes: bytes, mime_type: str = "image/jpeg") -> List[Dict[str, Any]]:
    """
    PRIMARY extraction path: Send the raw image to Gemini 3.6 Flash Vision.
    Bypasses EasyOCR entirely. Gemini reads the document like a doctor.
    Returns structured metric list, or [] on failure (falls back to OCR path).
    """
    client = _get_gemini_client()
    if not client:
        logger.warning("Gemini client unavailable — falling back to OCR pipeline.")
        return []

    try:
        import google.genai.types as gtypes

        image_part = gtypes.Part.from_bytes(data=image_bytes, mime_type=mime_type)
        text_part = gtypes.Part.from_text(text=CLINICAL_EXTRACTION_PROMPT)

        response = client.models.generate_content(
            model="gemini-3.6-flash",
            contents=[image_part, text_part],
            config=gtypes.GenerateContentConfig(
                response_mime_type="application/json",
                temperature=0.05,
                max_output_tokens=4000,
            )
        )

        raw_json = response.text.strip()
        # Strip markdown code fences if present
        if raw_json.startswith("```"):
            raw_json = re.sub(r"^```[\w]*\n?", "", raw_json)
            raw_json = re.sub(r"\n?```$", "", raw_json.strip())

        # Try clean parse first
        raw_items = []
        try:
            data = json.loads(raw_json)
            raw_items = data.get("metrics", [])
        except json.JSONDecodeError:
            # Truncated JSON — recover individual metric objects via regex
            logger.warning("Gemini returned truncated JSON — attempting partial recovery.")
            raw_items = _repair_truncated_json(raw_json)

        metrics = []
        seen_keys = set()
        for item in raw_items:
            built = _build_metric_from_llm_item(item, "gemini_vision")
            if built:
                norm_key = KEY_NORMALIZATION.get(built["metric_key"], built["metric_key"])
                built["metric_key"] = norm_key
                if norm_key not in seen_keys:
                    metrics.append(built)
                    seen_keys.add(norm_key)



        logger.info(f"Gemini Vision extracted {len(metrics)} metrics from image.")
        return metrics

    except Exception as e:
        logger.error(f"Gemini Vision parser failed: {e}")
        return []


# ──────────────────────────────────────────────────────────────
# TIER 2 TEXT FALLBACK: Fast Groq model on OCR text lines
# ──────────────────────────────────────────────────────────────

def _call_groq_llm_parser(raw_lines: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Fallback text-based extractor using Groq openai/gpt-oss-20b (~1s response).
    Used when Gemini Vision is unavailable or the file is a digital PDF with selectable text.
    """
    client = _get_groq_client()
    if not client:
        return []

    lines_text = "\n".join(
        [f"- {l.get('text', '')}" for l in raw_lines if l.get("text", "").strip()][:120]
    )
    if not lines_text.strip():
        return []

    prompt = CLINICAL_EXTRACTION_PROMPT + f"\n\nOCR Lines from document:\n{lines_text}"

    try:
        completion = client.chat.completions.create(
            model="openai/gpt-oss-20b",
            messages=[{"role": "user", "content": prompt}],
            response_format={"type": "json_object"},
            temperature=0.05,
            max_tokens=2000,
            timeout=25
        )
        raw_json = completion.choices[0].message.content.strip()
        data = json.loads(raw_json)

        metrics = []
        seen_keys = set()
        for item in data.get("metrics", []):
            built = _build_metric_from_llm_item(item, "groq_llm")
            if built and built["metric_key"] not in seen_keys:
                metrics.append(built)
                seen_keys.add(built["metric_key"])

        logger.info(f"Groq LLM extracted {len(metrics)} metrics from OCR text.")
        return metrics

    except Exception as e:
        logger.error(f"Groq LLM clinical parser failed: {e}")
        return []


def parse_lab_records_from_ocr(raw_lines: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Two-Tier Robust Clinical Ingestion Engine:
    Tier 1 (Primary): Groq LLM clinical parser for intelligent analyte understanding and typo recovery.
    Tier 2 (Complementary): Fuzzy regex scanner ensuring offline resilience.
    Results are merged and deduplicated.
    """
    extracted_metrics: List[Dict[str, Any]] = []
    found_keys = set()

    # 1. Primary pass: Groq LLM Intelligent Extractor
    if len(raw_lines) > 0:
        llm_metrics = _call_groq_llm_parser(raw_lines)
        for lm in llm_metrics:
            if lm["metric_key"] not in found_keys:
                extracted_metrics.append(lm)
                found_keys.add(lm["metric_key"])

    # 2. Complementary pass: High-speed regex scanner for any metrics not captured
    for line_item in raw_lines:
        line_text = line_item.get("text", "").strip()
        line_conf = float(line_item.get("confidence", 0.9))
        page = int(line_item.get("page", 1))

        if not line_text:
            continue

        # Handle BP compound "120/80 mmHg" or "130 / 85"
        if "blood pressure" in line_text.lower() or "bp" in line_text.lower() or re.search(r"\b\d{2,3}\s*[/\\-]\s*\d{2,3}\b", line_text):
            bp_match = re.search(r"(\d{2,3})\s*[/\\-]\s*(\d{2,3})", line_text)
            if bp_match:
                sys_val = float(bp_match.group(1))
                dia_val = float(bp_match.group(2))
                if 70 <= sys_val <= 240 and 40 <= dia_val <= 150:
                    if "bp_systolic" not in found_keys:
                        extracted_metrics.append(_create_metric_item("bp_systolic", sys_val, line_conf, page, line_text))
                        found_keys.add("bp_systolic")
                    if "bp_diastolic" not in found_keys:
                        extracted_metrics.append(_create_metric_item("bp_diastolic", dia_val, line_conf, page, line_text))
                        found_keys.add("bp_diastolic")

        for m_key, m_info in CANONICAL_METRICS.items():
            if m_key in found_keys or m_key.startswith("bp_"):
                continue

            for alias_pattern in m_info["aliases"]:
                match = re.search(alias_pattern, line_text, re.IGNORECASE)
                if match:
                    after_test = line_text[match.end():]
                    num_match = re.search(r"[:=\s]+(\d+(?:\.\d+)?)\s*([a-zA-Z/%³²\-\s]*)", after_test)
                    if num_match:
                        try:
                            val = float(num_match.group(1))
                            if _is_plausible_value(m_key, val):
                                parsed_item = _create_metric_item(m_key, val, line_conf, page, line_text)
                                extracted_metrics.append(parsed_item)
                                found_keys.add(m_key)
                                break
                        except ValueError:
                            pass

    # 3. Cross-line check for any still-missing key
    for i in range(len(raw_lines) - 1):
        curr_text = raw_lines[i].get("text", "")
        next_text = raw_lines[i+1].get("text", "")
        combined = f"{curr_text} {next_text}"
        line_conf = min(raw_lines[i].get("confidence", 0.9), raw_lines[i+1].get("confidence", 0.9))

        for m_key, m_info in CANONICAL_METRICS.items():
            if m_key in found_keys or m_key.startswith("bp_"):
                continue
            for alias_pattern in m_info["aliases"]:
                if re.search(alias_pattern, curr_text, re.IGNORECASE):
                    num_match = re.search(r"^[:=\s]*(\d+(?:\.\d+)?)", next_text)
                    if num_match:
                        val = float(num_match.group(1))
                        if _is_plausible_value(m_key, val):
                            parsed_item = _create_metric_item(m_key, val, line_conf, raw_lines[i].get("page", 1), combined)
                            extracted_metrics.append(parsed_item)
                            found_keys.add(m_key)

    return extracted_metrics


def _create_metric_item(metric_key: str, value: float, confidence: float, page: int, raw_snippet: str) -> Dict[str, Any]:
    info = CANONICAL_METRICS.get(metric_key, {
        "display_name": metric_key.replace("_", " ").title(),
        "category": "General Clinical",
        "default_unit": "",
        "ref_min": 0.0,
        "ref_max": 100.0,
        "ref_str": "Standard"
    })
    ref_min = info.get("ref_min", 0.0)
    ref_max = info.get("ref_max", 100.0)
    is_out_of_range = (value < ref_min or value > ref_max)

    conf_grade = "high" if confidence >= 0.80 else ("medium" if confidence >= 0.60 else "low")

    return {
        "id": f"ext-{metric_key}-{int(value*10)}",
        "metric_key": metric_key,
        "canonical_name": info["display_name"],
        "display_name": info["display_name"],
        "category": info["category"],
        "value": value,
        "unit": info["default_unit"],
        "reference_range": info["ref_str"],
        "ref_min": ref_min,
        "ref_max": ref_max,
        "ref_low": ref_min,
        "ref_high": ref_max,
        "is_out_of_range": is_out_of_range,
        "confidence": conf_grade,
        "confidence_score": round(float(confidence), 2),
        "confidence_grade": conf_grade,
        "needs_review": conf_grade == "low" or is_out_of_range,
        "source_page": page,
        "raw_snippet": raw_snippet.strip(),
        "status": "pending",
        "engine": "regex"
    }


def _is_plausible_value(metric_key: str, val: float) -> bool:
    """Sanity guardrails against wild OCR noise."""
    limits = {
        "hemoglobin": (3.0, 25.0),
        "glucose_fasting": (30.0, 500.0),
        "glucose_random": (30.0, 600.0),
        "hba1c": (3.0, 18.0),
        "cholesterol_total": (50.0, 600.0),
        "hdl": (10.0, 150.0),
        "ldl": (20.0, 400.0),
        "triglycerides": (20.0, 1000.0),
        "creatinine": (0.2, 15.0),
        "egfr": (5.0, 160.0),
        "uric_acid": (1.0, 20.0),
        "vitamin_d": (3.0, 180.0),
        "ferritin": (2.0, 2000.0),
        "testosterone": (20.0, 2500.0),
        "crp": (0.05, 100.0),
        "spo2": (50.0, 100.0),
        "heart_rate": (30.0, 220.0),
        "bp_systolic": (60.0, 250.0),
        "bp_diastolic": (40.0, 150.0),
        "weight": (20.0, 300.0)
    }
    bounds = limits.get(metric_key)
    if bounds:
        return bounds[0] <= val <= bounds[1]
    return 0.0 <= val <= 10000.0
