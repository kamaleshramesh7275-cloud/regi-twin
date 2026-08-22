import { useState } from "react";

export type ZoneId =
  | "head" | "neck" | "chest" | "lumbar"
  | "left_shoulder" | "right_shoulder"
  | "left_arm"      | "right_arm"
  | "left_forearm"  | "right_forearm"
  | "left_hip"      | "right_hip"
  | "left_thigh"    | "right_thigh"
  | "left_knee"     | "right_knee"
  | "left_shin"     | "right_shin"
  | "left_ankle"    | "right_ankle";

export type ZoneRisk = Partial<Record<ZoneId, number>>;

// Precise polygon mapping over a centralized anatomical figure (100x100 grid)
const REGIONS: Record<ZoneId, string> = {
  head: "43,4 57,4 59,14 41,14",
  neck: "45,15 55,15 57,19 43,19",
  chest: "35,20 65,20 63,33 37,33",
  lumbar: "38,34 62,34 63,45 37,45",
  left_shoulder: "66,20 75,23 74,31 64,28",
  right_shoulder: "34,20 25,23 26,31 36,28",
  left_arm: "73,32 79,46 72,48 65,34",
  right_arm: "27,32 21,46 28,48 35,34",
  left_forearm: "80,47 84,62 77,63 72,49",
  right_forearm: "20,47 16,62 23,63 28,49",
  left_hip: "51,46 64,46 66,54 51,57",
  right_hip: "49,46 36,46 34,54 49,57",
  left_thigh: "52,58 65,55 58,73 50,73",
  right_thigh: "48,58 35,55 42,73 50,73",
  left_knee: "50,74 58,74 56,80 49,80",
  right_knee: "50,74 42,74 44,80 51,80",
  left_shin: "49,81 55,81 53,94 48,94",
  right_shin: "51,81 45,81 47,94 52,94",
  left_ankle: "47,95 53,95 55,98 46,98",
  right_ankle: "53,95 47,95 45,98 54,98"
};

export interface HoloOverlayProps {
  riskData: ZoneRisk;
  selectedZone: ZoneId | null;
  onZoneClick: (zone: ZoneId) => void;
}

// Helper to calculate the center of a polygon string
function getCenter(pointsStr: string) {
  const points = pointsStr.split(' ').map(p => {
    const [x, y] = p.split(',').map(Number);
    return { x, y };
  });
  const cx = points.reduce((sum, p) => sum + p.x, 0) / points.length;
  const cy = points.reduce((sum, p) => sum + p.y, 0) / points.length;
  return { x: cx, y: cy };
}

export default function HoloOverlay({ riskData = {}, selectedZone, onZoneClick }: HoloOverlayProps) {
  const [hovered, setHovered] = useState<ZoneId | null>(null);

  return (
    <div className="absolute inset-0 z-0 bg-[#020a14] overflow-hidden flex items-center justify-center pointer-events-none">
      
      {/* Container aspect ratio set to match a typical standing body proportion */}
      <div className="relative w-full max-w-[60vh] md:max-w-3xl aspect-[1/1.6] pointer-events-auto">
        
        {/* The high-fidelity background image */}
        <img 
          src="/holographic_body.png" 
          alt="Sci-Fi Anatomy Overlay" 
          className="absolute inset-0 w-full h-full object-contain opacity-90 transition-opacity duration-1000 drop-shadow-[0_0_15px_rgba(0,240,255,0.4)]"
          style={{ mixBlendMode: 'screen', filter: 'contrast(1.2) brightness(1.1)' }}
        />
        
        {/* The interactive SVG overlay layer */}
        <svg 
          viewBox="0 0 100 100" 
          preserveAspectRatio="none" 
          className="absolute inset-0 w-full h-full"
        >
          <defs>
            <filter id="glow-red" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="2.5" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
            <filter id="glow-orange" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="2" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
            <filter id="glow-cyan" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="1" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
            <pattern id="grid" width="4" height="4" patternUnits="userSpaceOnUse">
              <path d="M 4 0 L 0 0 0 4" fill="none" stroke="rgba(0, 240, 255, 0.1)" strokeWidth="0.1" />
            </pattern>
          </defs>

          {/* Technical Grid Background */}
          <rect width="100" height="100" fill="url(#grid)" className="pointer-events-none" />

          {/* Render the zones and labels */}
          {Object.entries(REGIONS).map(([id, points]) => {
            const zone = id as ZoneId;
            const risk = riskData[zone] ?? 0;
            const isSelected = selectedZone === zone;
            const isHovered = hovered === zone;
            const center = getCenter(points);
            
            // Determine dynamic coloring based on risk levels
            let fillOpacity = 0;
            let fill = "transparent";
            let filter: string | undefined = undefined;
            
            if (risk >= 70) {
              fill = "#ef4444"; // red
              fillOpacity = 0.55;
              filter = "url(#glow-red)";
            } else if (risk >= 55) {
              fill = "#f59e0b"; // orange
              fillOpacity = 0.4;
              filter = "url(#glow-orange)";
            } else if (risk >= 35) {
              fill = "#10b981"; // green
              fillOpacity = 0.1;
            }
            
            // Interaction boosts
            if (isSelected) fillOpacity = Math.max(fillOpacity, 0.6);
            if (isHovered) fillOpacity += 0.2;

            // Remove persistent outline to hide polygon mismatch
            const activeStroke = "rgba(255, 255, 255, 0.8)";
            const strokeColor = (isSelected || isHovered) ? activeStroke : "transparent";
            const strokeWidth = (isSelected || isHovered) ? "0.6" : "0";

            const shouldShowLabel = risk >= 70 || isSelected || isHovered;

            // Determine if the label should be on the left or right side of the body
            const isLeftSide = center.x > 50; 
            const labelXEnd = isLeftSide ? 95 : 5;
            const textAnchor = isLeftSide ? "end" : "start";

            return (
              <g key={zone}>
                <polygon
                  points={points}
                  fill={fill}
                  fillOpacity={fillOpacity}
                  stroke={strokeColor}
                  strokeWidth={strokeWidth}
                  filter={filter}
                  className="cursor-pointer transition-all duration-300 ease-out"
                  style={{ mixBlendMode: fillOpacity > 0 ? 'screen' : 'normal' }}
                  onMouseEnter={() => setHovered(zone)}
                  onMouseLeave={() => setHovered(null)}
                  onClick={() => onZoneClick(zone)}
                />

                {isSelected && (
                  <>
                    <line x1={center.x - 3} y1={center.y} x2={center.x + 3} y2={center.y} stroke="white" strokeWidth="0.5" className="pointer-events-none opacity-80" />
                    <line x1={center.x} y1={center.y - 3} x2={center.x} y2={center.y + 3} stroke="white" strokeWidth="0.5" className="pointer-events-none opacity-80" />
                    <circle cx={center.x} cy={center.y} r="2" fill="none" stroke="white" strokeWidth="0.4" className="pointer-events-none opacity-80 animate-ping" style={{animationDuration: '2s'}}/>
                  </>
                )}

                {shouldShowLabel && (
                  <g className="pointer-events-none transition-opacity duration-300">
                    <polyline
                      points={`${center.x},${center.y} ${isLeftSide ? center.x + 10 : center.x - 10},${center.y - 2} ${labelXEnd},${center.y - 2}`}
                      fill="none"
                      stroke={strokeColor}
                      strokeWidth="0.3"
                      strokeDasharray="1,1"
                      className="opacity-70"
                    />
                    <circle cx={center.x} cy={center.y} r="0.8" fill={strokeColor} />
                    <circle cx={labelXEnd} cy={center.y - 2} r="0.8" fill={strokeColor} />
                    
                    <text 
                      x={isLeftSide ? labelXEnd - 2 : labelXEnd + 2} 
                      y={center.y - 3} 
                      fill="white" 
                      fontSize="2.5" 
                      fontFamily="monospace"
                      fontWeight="bold"
                      textAnchor={textAnchor}
                      className="drop-shadow-md"
                    >
                      {zone.replace('_', ' ').toUpperCase()}
                    </text>
                    <text 
                      x={isLeftSide ? labelXEnd - 2 : labelXEnd + 2} 
                      y={center.y + 0.5} 
                      fill={fill !== "transparent" ? fill : "#00f0ff"} 
                      fontSize="2" 
                      fontFamily="monospace"
                      textAnchor={textAnchor}
                    >
                      RISK: {risk}%
                    </text>
                  </g>
                )}
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}
