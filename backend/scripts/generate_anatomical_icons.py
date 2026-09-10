import os
from pathlib import Path
import sys

# Ensure backend path is in sys.path
sys.path.insert(0, str(Path(__file__).parent.parent))
from seed_exercises import EXERCISE_CATALOG

# Highlight colors per muscle group
MUSCLE_THEMES = {
    "biceps": {"primary": "#F97316", "accent": "#EA580C", "name": "Biceps"},
    "triceps": {"primary": "#EC4899", "accent": "#DB2777", "name": "Triceps"},
    "chest": {"primary": "#3B82F6", "accent": "#2563EB", "name": "Chest"},
    "back": {"primary": "#8B5CF6", "accent": "#7C3AED", "name": "Back"},
    "shoulders": {"primary": "#06B6D4", "accent": "#0891B2", "name": "Shoulders"},
    "legs": {"primary": "#10B981", "accent": "#059669", "name": "Quads / Legs"},
    "quads": {"primary": "#10B981", "accent": "#059669", "name": "Quads"},
    "hamstrings": {"primary": "#F43F5E", "accent": "#E11D48", "name": "Hamstrings"},
    "glutes": {"primary": "#F43F5E", "accent": "#E11D48", "name": "Glutes"},
    "calves": {"primary": "#14B8A6", "accent": "#0D9488", "name": "Calves"},
    "core": {"primary": "#EAB308", "accent": "#CA8A04", "name": "Abs / Core"},
    "full_body": {"primary": "#6366F1", "accent": "#4F46E5", "name": "Full Body"}
}

def get_muscle_theme(exercise_name: str, muscle_group: str):
    name_lower = exercise_name.lower()
    if "bicep" in name_lower or ("curl" in name_lower and "leg" not in name_lower and "hamstring" not in name_lower):
        return MUSCLE_THEMES["biceps"]
    if "tricep" in name_lower or "pushdown" in name_lower or "skull" in name_lower or "dip" in name_lower:
        return MUSCLE_THEMES["triceps"]
    if "squat" in name_lower or "quad" in name_lower or ("extension" in name_lower and "tricep" not in name_lower):
        return MUSCLE_THEMES["quads"]
    if "deadlift" in name_lower or "rdl" in name_lower or "hamstring" in name_lower or "leg curl" in name_lower:
        return MUSCLE_THEMES["hamstrings"]
    if "calf" in name_lower:
        return MUSCLE_THEMES["calves"]
    if "chest" in name_lower or "bench" in name_lower or "pec" in name_lower or "push-up" in name_lower:
        return MUSCLE_THEMES["chest"]
    if "lat" in name_lower or "pull" in name_lower or "row" in name_lower or "hyperextension" in name_lower:
        return MUSCLE_THEMES["back"]
    if "shoulder" in name_lower or ("press" in name_lower and "bench" not in name_lower and "leg" not in name_lower) or "lateral" in name_lower or "raise" in name_lower or "shrug" in name_lower:
        return MUSCLE_THEMES["shoulders"]
    if "plank" in name_lower or "crunch" in name_lower or "woodchopper" in name_lower or "twist" in name_lower or "ab" in name_lower:
        return MUSCLE_THEMES["core"]
    
    return MUSCLE_THEMES.get(muscle_group.lower(), MUSCLE_THEMES["full_body"])

def generate_anatomical_svg(name: str, muscle_group: str, equipment: str) -> str:
    theme = get_muscle_theme(name, muscle_group)
    p_color = theme["primary"]
    a_color = theme["accent"]
    
    is_arm = theme["name"] in ["Biceps", "Triceps"]
    is_chest = theme["name"] == "Chest"
    is_back = theme["name"] == "Back"
    is_shoulder = theme["name"] == "Shoulders"
    is_leg = theme["name"] in ["Quads / Legs", "Quads", "Hamstrings", "Glutes", "Calves"]
    is_core = theme["name"] == "Abs / Core"
    
    bicep_fill = p_color if theme["name"] == "Biceps" else "none"
    bicep_stroke = p_color if theme["name"] == "Biceps" else "#64748B"
    bicep_width = "4" if theme["name"] == "Biceps" else "1.5"

    tricep_fill = p_color if theme["name"] == "Triceps" else "none"
    tricep_stroke = p_color if theme["name"] == "Triceps" else "#64748B"
    tricep_width = "4" if theme["name"] == "Triceps" else "1.5"

    chest_fill = p_color if is_chest else "none"
    chest_stroke = p_color if is_chest else "#64748B"
    chest_width = "4" if is_chest else "1.5"

    shoulder_fill = p_color if is_shoulder else "none"
    shoulder_stroke = p_color if is_shoulder else "#64748B"
    shoulder_width = "4" if is_shoulder else "1.5"

    back_fill = p_color if is_back else "none"
    back_stroke = p_color if is_back else "#64748B"

    leg_fill = p_color if is_leg else "none"
    leg_stroke = p_color if is_leg else "#64748B"
    leg_width = "4" if is_leg else "1.5"

    core_fill = p_color if is_core else "none"
    core_stroke = p_color if is_core else "#64748B"
    core_width = "4" if is_core else "1.5"

    return f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 160" width="100%" height="100%">
  <defs>
    <!-- Radial backdrop gradient -->
    <radialGradient id="bgGrad" cx="50%" cy="40%" r="60%">
      <stop offset="0%" stop-color="#1E293B" stop-opacity="0.9"/>
      <stop offset="100%" stop-color="#0F172A" stop-opacity="1"/>
    </radialGradient>
  </defs>

  <!-- Circular Avatar Frame -->
  <circle cx="80" cy="80" r="76" fill="url(#bgGrad)" stroke="#334155" stroke-width="2.5"/>
  <circle cx="80" cy="80" r="72" fill="none" stroke="{p_color}" stroke-opacity="0.25" stroke-dasharray="3 3"/>

  <!-- Anatomical Figure Silhouette -->
  <g transform="translate(80, 80) scale(0.85)" stroke-linecap="round" stroke-linejoin="round">
    
    <!-- Head -->
    <circle cx="0" cy="-56" r="11" fill="#334155" stroke="#94A3B8" stroke-width="1.5"/>
    <path d="M -5 -50 Q 0 -45 5 -50" stroke="#64748B" stroke-width="1" fill="none"/>

    <!-- Neck & Traps -->
    <path d="M -9 -46 L -16 -38 L 16 -38 L 9 -46 Z" fill="#1E293B" stroke="#64748B" stroke-width="1.5"/>

    <!-- Shoulders (Deltoids) -->
    <!-- Left Deltoid -->
    <ellipse cx="-23" cy="-33" rx="7" ry="6" fill="{shoulder_fill}" fill-opacity="0.85" stroke="{shoulder_stroke}" stroke-width="{shoulder_width}"/>
    <!-- Right Deltoid -->
    <ellipse cx="23" cy="-33" rx="7" ry="6" fill="{shoulder_fill}" fill-opacity="0.85" stroke="{shoulder_stroke}" stroke-width="{shoulder_width}"/>

    <!-- Torso / Chest / Back Base -->
    <!-- Pectorals (Chest) -->
    <path d="M -16 -34 C -16 -22 -3 -20 0 -22 C 3 -20 16 -22 16 -34 Z" 
          fill="{chest_fill}" fill-opacity="0.85" stroke="{chest_stroke}" stroke-width="{chest_width}"/>
    
    <!-- Ribcage & Core / Abs -->
    <rect x="-10" y="-18" width="20" height="24" rx="4" 
          fill="{core_fill}" fill-opacity="0.85" stroke="{core_stroke}" stroke-width="{core_width}"/>
    <!-- Abdominals grid lines -->
    <line x1="0" y1="-18" x2="0" y2="6" stroke="#475569" stroke-width="1"/>
    <line x1="-8" y1="-10" x2="8" y2="-10" stroke="#475569" stroke-width="1"/>
    <line x1="-8" y1="-2" x2="8" y2="-2" stroke="#475569" stroke-width="1"/>

    <!-- Upper Arms (Biceps & Triceps) -->
    <!-- Left Upper Arm -->
    <path d="M -26 -28 C -31 -18 -29 -10 -24 -2" 
          fill="{bicep_fill}" stroke="{bicep_stroke}" stroke-width="{bicep_width}"/>
    <ellipse cx="-26" cy="-14" rx="4.5" ry="7" 
             fill="{bicep_fill}" fill-opacity="0.9" stroke="{bicep_stroke}" stroke-width="{bicep_width}"/>
    
    <!-- Right Upper Arm -->
    <path d="M 26 -28 C 31 -18 29 -10 24 -2" 
          fill="{bicep_fill}" stroke="{bicep_stroke}" stroke-width="{bicep_width}"/>
    <ellipse cx="26" cy="-14" rx="4.5" ry="7" 
             fill="{bicep_fill}" fill-opacity="0.9" stroke="{bicep_stroke}" stroke-width="{bicep_width}"/>

    <!-- Forearms & Hands -->
    <!-- Left Forearm -->
    <line x1="-24" y1="-2" x2="-22" y2="16" stroke="#94A3B8" stroke-width="3"/>
    <circle cx="-22" cy="18" r="3.5" fill="#CBD5E1"/>
    <!-- Right Forearm -->
    <line x1="24" y1="-2" x2="22" y2="16" stroke="#94A3B8" stroke-width="3"/>
    <circle cx="22" cy="18" r="3.5" fill="#CBD5E1"/>

    <!-- Equipment Accent (Dumbbell/Barbell if applicable) -->
    <line x1="-34" y1="18" x2="-10" y2="18" stroke="{p_color}" stroke-width="3"/>
    <rect x="-36" y="14" width="4" height="8" rx="1" fill="{a_color}"/>
    <line x1="10" y1="18" x2="34" y2="18" stroke="{p_color}" stroke-width="3"/>
    <rect x="32" y="14" width="4" height="8" rx="1" fill="{a_color}"/>

    <!-- Pelvis / Hips -->
    <path d="M -13 6 L 13 6 L 8 18 L -8 18 Z" fill="#1E293B" stroke="#64748B" stroke-width="1.5"/>

    <!-- Upper Legs (Quads & Hamstrings) -->
    <!-- Left Thigh -->
    <ellipse cx="-12" cy="32" rx="7" ry="12" 
             fill="{leg_fill}" fill-opacity="0.85" stroke="{leg_stroke}" stroke-width="{leg_width}"/>
    <!-- Right Thigh -->
    <ellipse cx="12" cy="32" rx="7" ry="12" 
             fill="{leg_fill}" fill-opacity="0.85" stroke="{leg_stroke}" stroke-width="{leg_width}"/>

    <!-- Knees -->
    <circle cx="-12" cy="46" r="3" fill="#64748B"/>
    <circle cx="12" cy="46" r="3" fill="#64748B"/>

    <!-- Lower Legs (Calves & Shins) -->
    <line x1="-12" y1="48" x2="-12" y2="64" stroke="{leg_stroke}" stroke-width="{leg_width}"/>
    <line x1="12" y1="48" x2="12" y2="64" stroke="{leg_stroke}" stroke-width="{leg_width}"/>
    <!-- Feet -->
    <path d="M -15 64 L -8 64 L -6 68 L -17 68 Z" fill="#475569"/>
    <path d="M 8 64 L 15 64 L 17 68 L 6 68 Z" fill="#475569"/>
  </g>

  <!-- Muscle Badge at bottom -->
  <rect x="35" y="132" width="90" height="18" rx="9" fill="#0B111E" stroke="{p_color}" stroke-width="1" stroke-opacity="0.5"/>
  <text x="80" y="144" fill="{p_color}" font-family="system-ui, -apple-system, sans-serif" font-size="8.5" font-weight="800" text-anchor="middle" letter-spacing="0.8">
    {theme["name"].upper()}
  </text>
</svg>'''

def main():
    target_dir = Path("c:/Users/Mohan Anbu/OneDrive/Pictures/Desktop/project/regi-twin/frontend/public/exercises")
    target_dir.mkdir(parents=True, exist_ok=True)
    
    count = 0
    for ex in EXERCISE_CATALOG:
        slug = ex["name"].lower().replace(" ", "-").replace("(", "").replace(")", "").replace("/", "-")
        svg = generate_anatomical_svg(ex["name"], ex["muscle_group"], ex["equipment"])
        file_path = target_dir / f"{slug}.svg"
        with open(file_path, "w", encoding="utf-8") as f:
            f.write(svg)
        count += 1
        
    print(f"Generated {count} high-fidelity anatomical muscle SVGs in {target_dir}")

if __name__ == "__main__":
    main()
