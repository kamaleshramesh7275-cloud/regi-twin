import os
import urllib.request
import urllib.parse
import json
import re
from typing import Dict, Any, List, Optional, Tuple
from dotenv import load_dotenv

load_dotenv()

NUTRITIONIX_BASE_URL = "https://trackapi.nutritionix.com/v2"

# Standard RDA targets for adult athlete
RDA_TARGETS = {
    "iron_mg": 18.0,
    "calcium_mg": 1000.0,
    "magnesium_mg": 400.0,
    "potassium_mg": 3400.0,
    "vitamin_d_iu": 800.0,
    "vitamin_b12_mcg": 2.4,
    "zinc_mg": 11.0
}

# Known Nutritionix Attribute IDs
ATTR_ID_MAP = {
    301: "calcium_mg",
    303: "iron_mg",
    304: "magnesium_mg",
    306: "potassium_mg",
    309: "zinc_mg",
    324: "vitamin_d_iu",
    328: "vitamin_d_iu",
    418: "vitamin_b12_mcg"
}

# Common food items dictionary for offline / smart fallback parsing
FOOD_DICTIONARY = {
    "egg": {"cal": 74, "p": 6.3, "c": 0.4, "f": 5.0, "iron": 0.9, "calcium": 28, "mag": 6, "pot": 69, "vit_d": 41, "b12": 0.5, "zinc": 0.6},
    "toast": {"cal": 75, "p": 3.0, "c": 14.0, "f": 1.0, "iron": 0.9, "calcium": 30, "mag": 11, "pot": 50, "vit_d": 0, "b12": 0, "zinc": 0.3},
    "bread": {"cal": 75, "p": 3.0, "c": 14.0, "f": 1.0, "iron": 0.9, "calcium": 30, "mag": 11, "pot": 50, "vit_d": 0, "b12": 0, "zinc": 0.3},
    "coffee": {"cal": 5, "p": 0.3, "c": 0.0, "f": 0.1, "iron": 0.0, "calcium": 5, "mag": 7, "pot": 116, "vit_d": 0, "b12": 0, "zinc": 0.1},
    "chicken": {"cal": 165, "p": 31.0, "c": 0.0, "f": 3.6, "iron": 1.0, "calcium": 15, "mag": 29, "pot": 256, "vit_d": 5, "b12": 0.3, "zinc": 1.0},
    "rice": {"cal": 130, "p": 2.7, "c": 28.0, "f": 0.3, "iron": 1.2, "calcium": 10, "mag": 12, "pot": 35, "vit_d": 0, "b12": 0, "zinc": 0.5},
    "broccoli": {"cal": 35, "p": 2.4, "c": 7.0, "f": 0.4, "iron": 0.7, "calcium": 47, "mag": 21, "pot": 316, "vit_d": 0, "b12": 0, "zinc": 0.4},
    "oats": {"cal": 150, "p": 5.0, "c": 27.0, "f": 2.5, "iron": 1.7, "calcium": 20, "mag": 56, "pot": 140, "vit_d": 0, "b12": 0, "zinc": 1.5},
    "oatmeal": {"cal": 150, "p": 5.0, "c": 27.0, "f": 2.5, "iron": 1.7, "calcium": 20, "mag": 56, "pot": 140, "vit_d": 0, "b12": 0, "zinc": 1.5},
    "whey": {"cal": 120, "p": 24.0, "c": 3.0, "f": 1.5, "iron": 0.5, "calcium": 140, "mag": 20, "pot": 150, "vit_d": 0, "b12": 1.2, "zinc": 0.8},
    "protein shake": {"cal": 150, "p": 25.0, "c": 5.0, "f": 2.0, "iron": 0.8, "calcium": 150, "mag": 30, "pot": 200, "vit_d": 0, "b12": 1.5, "zinc": 1.0},
    "salmon": {"cal": 208, "p": 22.0, "c": 0.0, "f": 13.0, "iron": 0.5, "calcium": 12, "mag": 29, "pot": 384, "vit_d": 526, "b12": 3.2, "zinc": 0.6},
    "yogurt": {"cal": 100, "p": 17.0, "c": 6.0, "f": 0.5, "iron": 0.1, "calcium": 180, "mag": 17, "pot": 240, "vit_d": 0, "b12": 0.8, "zinc": 0.9},
    "banana": {"cal": 105, "p": 1.3, "c": 27.0, "f": 0.3, "iron": 0.3, "calcium": 6, "mag": 32, "pot": 422, "vit_d": 0, "b12": 0, "zinc": 0.2},
    "apple": {"cal": 95, "p": 0.5, "c": 25.0, "f": 0.3, "iron": 0.2, "calcium": 11, "mag": 9, "pot": 195, "vit_d": 0, "b12": 0, "zinc": 0.1},
    "milk": {"cal": 122, "p": 8.0, "c": 12.0, "f": 4.8, "iron": 0.1, "calcium": 300, "mag": 27, "pot": 366, "vit_d": 100, "b12": 1.1, "zinc": 1.0},
    "steak": {"cal": 240, "p": 26.0, "c": 0.0, "f": 15.0, "iron": 2.8, "calcium": 18, "mag": 22, "pot": 318, "vit_d": 7, "b12": 2.6, "zinc": 4.5},
    "beef": {"cal": 240, "p": 26.0, "c": 0.0, "f": 15.0, "iron": 2.8, "calcium": 18, "mag": 22, "pot": 318, "vit_d": 7, "b12": 2.6, "zinc": 4.5},
    "potato": {"cal": 130, "p": 3.0, "c": 30.0, "f": 0.2, "iron": 1.1, "calcium": 15, "mag": 28, "pot": 620, "vit_d": 0, "b12": 0, "zinc": 0.4},
    "sweet potato": {"cal": 112, "p": 2.0, "c": 26.0, "f": 0.1, "iron": 0.8, "calcium": 38, "mag": 33, "pot": 438, "vit_d": 0, "b12": 0, "zinc": 0.3},
    "peanut butter": {"cal": 190, "p": 8.0, "c": 7.0, "f": 16.0, "iron": 0.6, "calcium": 14, "mag": 54, "pot": 189, "vit_d": 0, "b12": 0, "zinc": 0.9},
    "almonds": {"cal": 160, "p": 6.0, "c": 6.0, "f": 14.0, "iron": 1.0, "calcium": 76, "mag": 76, "pot": 208, "vit_d": 0, "b12": 0, "zinc": 0.9}
}

class NutritionixClient:
    def __init__(self, app_id: Optional[str] = None, api_key: Optional[str] = None):
        self.app_id = (app_id or os.environ.get("NUTRITIONIX_APP_ID", "")).strip()
        self.api_key = (api_key or os.environ.get("NUTRITIONIX_API_KEY", "")).strip()

    @property
    def is_configured(self) -> bool:
        return bool(self.app_id and self.api_key and "your_" not in self.app_id.lower() and "your_" not in self.api_key.lower())

    def parse_natural_nutrition(self, query_text: str) -> Tuple[bool, Dict[str, Any], Optional[str]]:
        """
        Calls Nutritionix Natural Language endpoint, or uses smart natural language engine if keys are missing.
        """
        text = query_text.strip()
        if not text:
            return False, {}, "Please enter at least one food item."

        if self.is_configured:
            try:
                url = f"{NUTRITIONIX_BASE_URL}/natural/nutrients"
                payload_data = json.dumps({"query": text}).encode("utf-8")
                req = urllib.request.Request(
                    url,
                    data=payload_data,
                    headers={
                        "x-app-id": self.app_id,
                        "x-app-key": self.api_key,
                        "Content-Type": "application/json",
                        "User-Agent": "PhysioTwin-Nutrition/1.0"
                    }
                )

                with urllib.request.urlopen(req, timeout=10) as response:
                    body = response.read().decode("utf-8")
                    data = json.loads(body)
                    return True, self._format_nutritionix_response(data, text), None
            except urllib.error.HTTPError as e:
                err_body = e.read().decode("utf-8") if e.fp else ""
                print(f"Nutritionix API warning ({e.code}): {err_body}")
                # Fallback to local NLP food parser if quota exceeded or error
                parsed_fallback = self._fallback_nlp_parse(text)
                return True, parsed_fallback, f"Nutritionix API ({e.code}) — parsed via PhysioTwin Natural Food Engine"
            except Exception as e:
                print(f"Nutritionix connection error: {e}")
                parsed_fallback = self._fallback_nlp_parse(text)
                return True, parsed_fallback, "Parsed via PhysioTwin Natural Food Engine"
        else:
            # Keys not configured: parse with smart built-in natural language engine
            parsed = self._fallback_nlp_parse(text)
            return True, parsed, None

    def _format_nutritionix_response(self, data: Dict[str, Any], raw_query: str) -> Dict[str, Any]:
        foods = data.get("foods", [])
        total_cal = 0
        total_p = 0.0
        total_c = 0.0
        total_f = 0.0
        total_fiber = 0.0
        total_sodium = 0.0

        micros = {
            "iron_mg": 0.0,
            "calcium_mg": 0.0,
            "magnesium_mg": 0.0,
            "potassium_mg": 0.0,
            "vitamin_d_iu": 0.0,
            "vitamin_b12_mcg": 0.0,
            "zinc_mg": 0.0
        }

        food_items_summary = []

        for f in foods:
            name = f.get("food_name", "Food Item").title()
            qty = f.get("serving_qty", 1)
            unit = f.get("serving_unit", "serving")
            food_items_summary.append(f"{qty} {unit} {name}".strip())

            cals = f.get("nf_calories") or 0.0
            p = f.get("nf_protein") or 0.0
            c = f.get("nf_total_carbohydrate") or 0.0
            fat = f.get("nf_total_fat") or 0.0
            fiber = f.get("nf_dietary_fiber") or 0.0
            sod = f.get("nf_sodium") or 0.0

            total_cal += round(cals)
            total_p += p
            total_c += c
            total_f += fat
            total_fiber += fiber
            total_sodium += sod

            # Parse full nutrients
            full_nutrients = f.get("full_nutrients", [])
            for attr in full_nutrients:
                attr_id = attr.get("attr_id")
                val = float(attr.get("value") or 0.0)
                if attr_id in ATTR_ID_MAP:
                    key = ATTR_ID_MAP[attr_id]
                    micros[key] += val

        # Calculate % RDA for UI bars
        micro_percentages = {
            "iron_pct": min(100, round((micros["iron_mg"] / RDA_TARGETS["iron_mg"]) * 100)),
            "calcium_pct": min(100, round((micros["calcium_mg"] / RDA_TARGETS["calcium_mg"]) * 100)),
            "magnesium_pct": min(100, round((micros["magnesium_mg"] / RDA_TARGETS["magnesium_mg"]) * 100)),
            "potassium_pct": min(100, round((micros["potassium_mg"] / RDA_TARGETS["potassium_mg"]) * 100)),
            "vitamin_d_pct": min(100, round((micros["vitamin_d_iu"] / RDA_TARGETS["vitamin_d_iu"]) * 100)),
            "vitamin_b12_pct": min(100, round((micros["vitamin_b12_mcg"] / RDA_TARGETS["vitamin_b12_mcg"]) * 100)),
            "zinc_pct": min(100, round((micros["zinc_mg"] / RDA_TARGETS["zinc_mg"]) * 100))
        }

        return {
            "query": raw_query,
            "items_description": ", ".join(food_items_summary) if food_items_summary else raw_query,
            "calories": total_cal,
            "protein_g": round(total_p, 1),
            "carbs_g": round(total_c, 1),
            "fat_g": round(total_f, 1),
            "fiber_g": round(total_fiber, 1),
            "sodium_mg": round(total_sodium, 1),
            "micronutrients": micros,
            "micronutrient_pcts": micro_percentages,
            "raw_foods": foods
        }

    def _fallback_nlp_parse(self, text: str) -> Dict[str, Any]:
        """
        Natural-language rule engine: parses quantities and food nouns from free text.
        Example: '2 eggs, a slice of toast, 1 cup black coffee'
        """
        # Split by comma, 'and', '+', or newlines
        parts = re.split(r'[,+\n]|(?:\band\b)', text.lower())
        total_cal = 0
        total_p = 0.0
        total_c = 0.0
        total_f = 0.0
        micros = {k: 0.0 for k in RDA_TARGETS.keys()}
        matched_items = []

        num_words = {"a": 1, "an": 1, "one": 1, "two": 2, "three": 3, "four": 4, "five": 5, "half": 0.5, "double": 2}

        for part in parts:
            part = part.strip()
            if not part:
                continue

            # Extract number
            qty = 1.0
            num_match = re.search(r'\b(\d+(?:\.\d+)?)\b', part)
            if num_match:
                try:
                    qty = float(num_match.group(1))
                except Exception:
                    qty = 1.0
            else:
                for word, val in num_words.items():
                    if re.search(r'\b' + word + r'\b', part):
                        qty = val
                        break

            found_food = None
            for food_key, val in FOOD_DICTIONARY.items():
                if food_key in part:
                    found_food = (food_key, val)
                    break

            if found_food:
                name, nutr = found_food
                total_cal += int(nutr["cal"] * qty)
                total_p += nutr["p"] * qty
                total_c += nutr["c"] * qty
                total_f += nutr["f"] * qty
                micros["iron_mg"] += nutr["iron"] * qty
                micros["calcium_mg"] += nutr["calcium"] * qty
                micros["magnesium_mg"] += nutr["mag"] * qty
                micros["potassium_mg"] += nutr["pot"] * qty
                micros["vitamin_d_iu"] += nutr["vit_d"] * qty
                micros["vitamin_b12_mcg"] += nutr["b12"] * qty
                micros["zinc_mg"] += nutr["zinc"] * qty
                matched_items.append(f"{qty:g}x {name.title()}")
            else:
                # Generic fallback item estimate
                total_cal += int(150 * qty)
                total_p += 8.0 * qty
                total_c += 15.0 * qty
                total_f += 5.0 * qty
                micros["iron_mg"] += 0.8 * qty
                micros["calcium_mg"] += 40 * qty
                micros["magnesium_mg"] += 20 * qty
                micros["potassium_mg"] += 150 * qty
                micros["zinc_mg"] += 0.5 * qty
                matched_items.append(f"{qty:g}x {part.title()}")

        micro_percentages = {
            "iron_pct": min(100, round((micros["iron_mg"] / RDA_TARGETS["iron_mg"]) * 100)),
            "calcium_pct": min(100, round((micros["calcium_mg"] / RDA_TARGETS["calcium_mg"]) * 100)),
            "magnesium_pct": min(100, round((micros["magnesium_mg"] / RDA_TARGETS["magnesium_mg"]) * 100)),
            "potassium_pct": min(100, round((micros["potassium_mg"] / RDA_TARGETS["potassium_mg"]) * 100)),
            "vitamin_d_pct": min(100, round((micros["vitamin_d_iu"] / RDA_TARGETS["vitamin_d_iu"]) * 100)),
            "vitamin_b12_pct": min(100, round((micros["vitamin_b12_mcg"] / RDA_TARGETS["vitamin_b12_mcg"]) * 100)),
            "zinc_pct": min(100, round((micros["zinc_mg"] / RDA_TARGETS["zinc_mg"]) * 100))
        }

        return {
            "query": text,
            "items_description": ", ".join(matched_items) if matched_items else text,
            "calories": total_cal,
            "protein_g": round(total_p, 1),
            "carbs_g": round(total_c, 1),
            "fat_g": round(total_f, 1),
            "fiber_g": round(total_c * 0.15, 1),
            "sodium_mg": round(total_cal * 0.7, 1),
            "micronutrients": micros,
            "micronutrient_pcts": micro_percentages,
            "raw_foods": []
        }
