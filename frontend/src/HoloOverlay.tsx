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

// Precise polygon mapping calibrated over anatomical figure (100x100 grid)
const REGIONS: Record<ZoneId, string> = {
  head: "44,3 56,3 56,12 44,12",
  neck: "46,13 54,13 54,17 46,17",
  chest: "42,18 58,18 57,32 43,32",
  lumbar: "43,33 57,33 57,44 43,44",
  left_shoulder: "59,18 67,19 65,27 59,26",
  right_shoulder: "41,18 33,19 35,27 41,26",
  left_arm: "63,28 70,43 66,45 59,29",
  right_arm: "37,28 30,43 34,45 41,29",
  left_forearm: "69,44 75,59 70,61 65,46",
  right_forearm: "31,44 25,59 30,61 35,46",
  left_hip: "51,46 62,46 62,57 51,57",
  right_hip: "38,46 49,46 49,57 38,57",
  left_thigh: "51,58 62,58 59,73 51,73",
  right_thigh: "38,58 49,58 49,73 41,73",
  left_knee: "52,74 61,74 59,82 52,82",
  right_knee: "39,74 48,74 48,82 40,82",
  left_shin: "52,83 60,83 59,94 51,94",
  right_shin: "40,83 48,83 49,94 41,94",
  left_ankle: "51,95 59,95 60,99 50,99",
  right_ankle: "41,95 49,95 50,99 40,99"
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
    <div className="absolute inset-0 z-0 bg-[#020a14] overflow-hidden flex items-center justify-center pointer-events-none p-4 pt-20 pb-8">
      
      {/* Locked aspect ratio wrapper so image and SVG scale identically */}
      <div className="relative w-full max-w-[45vh] md:max-w-xl aspect-[1/1.65] pointer-events-auto flex items-center justify-center">
        
        {/* Background anatomical image */}
        <img 
          src="/holographic_body.png" 
          alt="Sci-Fi Anatomy Overlay" 
          className="absolute inset-0 w-full h-full object-contain opacity-90 transition-opacity duration-1000 drop-shadow-[0_0_15px_rgba(0,240,255,0.4)]"
          style={{ mixBlendMode: 'screen', filter: 'contrast(1.2) brightness(1.1)' }}
        />
        
        {/* Interactive SVG layer mapped 1-to-1 to viewBox 100x100 */}
        <svg 
          viewBox="0 0 100 100" 
          preserveAspectRatio="xMidYMid meet" 
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
              fill = "#b91c1c"; // deep dark crimson red
              fillOpacity = 0.75;
              filter = "url(#glow-red)";
            } else if (risk >= 55) {
              fill = "#c2410c"; // dark burnt orange
              fillOpacity = 0.65;
              filter = "url(#glow-orange)";
            } else if (risk >= 35) {
              fill = "#047857"; // dark emerald
              fillOpacity = 0.35;
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
