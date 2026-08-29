import React from 'react';

interface MuscleHeatmap2DProps {
  stressLevels?: { [key: string]: number }; // Values 0 to 100
  className?: string;
}

export function MuscleHeatmap2D({ stressLevels = {}, className = "" }: MuscleHeatmap2DProps) {
  // Helper to map 0-100 to a color (blue -> yellow -> red)
  const getStressColor = (level: number | undefined) => {
    if (level === undefined) return "#1e293b"; // default slate-800
    
    // Very basic gradient logic:
    // 0 = blue (0,0,255)
    // 50 = yellow (255,255,0)
    // 100 = red (255,0,0)
    const normalized = Math.max(0, Math.min(100, level));
    if (normalized < 50) {
      const g = Math.round((normalized / 50) * 255);
      return `rgb(0, ${g}, 255)`;
    } else {
      const g = Math.round((1 - (normalized - 50) / 50) * 255);
      return `rgb(255, ${g}, 0)`;
    }
  };

  return (
    <div className={`relative w-full max-w-xs mx-auto ${className}`}>
      {/* A stylized 2D SVG representing the lower body/legs for the heatmap */}
      <svg viewBox="0 0 200 400" className="w-full h-auto drop-shadow-lg" preserveAspectRatio="xMidYMid meet">
        <defs>
          <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="5" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>
        
        {/* Background silhouette */}
        <path d="M70,10 L130,10 L150,80 L140,200 L120,380 L80,380 L60,200 L50,80 Z" fill="#0f172a" stroke="#334155" strokeWidth="2" />
        
        {/* Left Thigh (Quadriceps) */}
        <path 
          d="M70,80 L95,80 L95,190 L60,190 Z" 
          fill={getStressColor(stressLevels["left_thigh"])} 
          className="transition-colors duration-300"
          filter="url(#glow)"
        />
        
        {/* Right Thigh (Quadriceps) */}
        <path 
          d="M105,80 L130,80 L140,190 L105,190 Z" 
          fill={getStressColor(stressLevels["right_thigh"])} 
          className="transition-colors duration-300"
          filter="url(#glow)"
        />

        {/* Left Knee */}
        <circle 
          cx="77" cy="205" r="12" 
          fill={getStressColor(stressLevels["left_knee"])} 
          className="transition-colors duration-300"
          filter="url(#glow)"
        />

        {/* Right Knee */}
        <circle 
          cx="123" cy="205" r="12" 
          fill={getStressColor(stressLevels["right_knee"])} 
          className="transition-colors duration-300"
          filter="url(#glow)"
        />
        
        {/* Left Calf/Shin */}
        <path 
          d="M65,220 L85,220 L80,360 L70,360 Z" 
          fill={getStressColor(stressLevels["left_shin"])} 
          className="transition-colors duration-300"
        />

        {/* Right Calf/Shin */}
        <path 
          d="M115,220 L135,220 L130,360 L120,360 Z" 
          fill={getStressColor(stressLevels["right_shin"])} 
          className="transition-colors duration-300"
        />
        
        {/* Labels (Optional) */}
        <text x="30" y="140" fill="#94a3b8" fontSize="10">L. Quad</text>
        <text x="145" y="140" fill="#94a3b8" fontSize="10">R. Quad</text>
        <text x="40" y="210" fill="#94a3b8" fontSize="10">L. Knee</text>
        <text x="145" y="210" fill="#94a3b8" fontSize="10">R. Knee</text>
      </svg>
    </div>
  );
}
