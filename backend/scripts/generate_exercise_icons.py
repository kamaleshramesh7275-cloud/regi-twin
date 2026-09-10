import os
from pathlib import Path

MUSCLE_COLORS = {
    "chest": "#3b82f6",      # Blue
    "back": "#8b5cf6",       # Purple
    "shoulders": "#06b6d4",  # Cyan
    "legs": "#10b981",       # Emerald
    "arms": "#f59e0b",       # Amber
    "core": "#ec4899",       # Pink
    "full_body": "#6366f1"   # Indigo
}

def create_svg(title: str, muscle: str, equipment: str) -> str:
    color = MUSCLE_COLORS.get(muscle.lower(), "#3b82f6")
    return f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="100%" height="100%">
  <defs>
    <linearGradient id="grad_{muscle}" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="{color}" stop-opacity="0.25"/>
      <stop offset="100%" stop-color="{color}" stop-opacity="0.05"/>
    </linearGradient>
    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="6" result="blur"/>
      <feComposite in="SourceGraphic" in2="blur" operator="over"/>
    </filter>
  </defs>
  
  <!-- Background Card -->
  <rect width="200" height="200" rx="24" fill="#0B111E" stroke="{color}" stroke-opacity="0.3" stroke-width="2"/>
  <rect x="8" y="8" width="184" height="184" rx="18" fill="url(#grad_{muscle})"/>
  
  <!-- Biomechanical Grid Lines -->
  <circle cx="100" cy="100" r="65" fill="none" stroke="{color}" stroke-opacity="0.15" stroke-dasharray="4 4"/>
  <circle cx="100" cy="100" r="45" fill="none" stroke="{color}" stroke-opacity="0.2"/>
  
  <!-- Center Silhouette / Symbol -->
  <g transform="translate(100, 85)" filter="url(#glow)">
    <!-- Head / Joint Nodes -->
    <circle cx="0" cy="-28" r="10" fill="{color}"/>
    <!-- Torso Spine Line -->
    <line x1="0" y1="-18" x2="0" y2="15" stroke="{color}" stroke-width="6" stroke-linecap="round"/>
    <!-- Limbs / Barbell / Motion -->
    <line x1="-35" y1="-6" x2="35" y2="-6" stroke="{color}" stroke-width="4" stroke-linecap="round"/>
    <circle cx="-35" cy="-6" r="6" fill="#FFFFFF"/>
    <circle cx="35" cy="-6" r="6" fill="#FFFFFF"/>
    <!-- Legs / Base -->
    <line x1="0" y1="15" x2="-22" y2="48" stroke="{color}" stroke-width="5" stroke-linecap="round"/>
    <line x1="0" y1="15" x2="22" y2="48" stroke="{color}" stroke-width="5" stroke-linecap="round"/>
    <circle cx="-22" cy="48" r="4" fill="{color}"/>
    <circle cx="22" cy="48" r="4" fill="{color}"/>
  </g>
  
  <!-- Muscle Group Badge -->
  <rect x="20" y="152" width="160" height="28" rx="8" fill="#030712" fill-opacity="0.8" stroke="{color}" stroke-opacity="0.4"/>
  <text x="100" y="170" fill="{color}" font-family="system-ui, -apple-system, sans-serif" font-size="10" font-weight="800" text-anchor="middle" letter-spacing="1.5">
    {muscle.upper()} &bull; {equipment.upper()}
  </text>
</svg>'''

def main():
    import sys
    sys.path.insert(0, str(Path(__file__).parent.parent))
    target_dir = Path("c:/Users/Mohan Anbu/OneDrive/Pictures/Desktop/project/regi-twin/frontend/public/exercises")
    target_dir.mkdir(parents=True, exist_ok=True)
    
    from seed_exercises import EXERCISE_CATALOG
    
    for ex in EXERCISE_CATALOG:
        slug = ex["name"].lower().replace(" ", "-").replace("(", "").replace(")", "").replace("/", "-")
        svg_content = create_svg(ex["name"], ex["muscle_group"], ex["equipment"])
        file_path = target_dir / f"{slug}.svg"
        with open(file_path, "w", encoding="utf-8") as f:
            f.write(svg_content)
            
    print(f"Generated {len(EXERCISE_CATALOG)} exercise vector SVGs in {target_dir}")

if __name__ == "__main__":
    main()
