import React, { useState, useEffect, useRef } from 'react';
import { Dumbbell, ChevronRight, Play } from 'lucide-react';

export interface Exercise {
  id: string;
  index?: number;
  name: string;
  category?: string;
  bodyPart?: string;
  primary_muscle?: string;
  target?: string;
  secondary_muscles?: string;
  secondaryMuscles?: string[];
  equipment: string;
  difficulty?: string;
  instructions?: string | string[];
  tips?: string;
  icon_svg?: string;
  gif_url?: string;
  gifUrl?: string;
  imageUrl?: string;
  image_path?: string;
  localGif?: string;
  localIdGif?: string;
}

interface ExerciseCardProps {
  exercise: Exercise;
  onClick: () => void;
}

export function ExerciseCard({ exercise, onClick }: ExerciseCardProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [currentSrcIdx, setCurrentSrcIdx] = useState(0);
  const cardRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: '300px' }
    );

    if (cardRef.current) {
      observer.observe(cardRef.current);
    }

    return () => observer.disconnect();
  }, []);

  const sources = [
    exercise.gifUrl,
    exercise.imageUrl,
    exercise.gif_url,
    exercise.image_path,
    exercise.localGif,
    exercise.localIdGif,
    '/placeholder-exercise.svg'
  ].filter(Boolean) as string[];

  const currentImgSrc = sources[currentSrcIdx] || '/placeholder-exercise.svg';

  const handleImageError = () => {
    if (currentSrcIdx < sources.length - 1) {
      setCurrentSrcIdx(prev => prev + 1);
    } else {
      setImageError(true);
    }
  };

  const displayMuscle = exercise.primary_muscle || exercise.target || exercise.category || exercise.bodyPart || 'General';
  const displayCategory = exercise.bodyPart || exercise.category || 'General';

  return (
    <div
      ref={cardRef}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="group relative flex flex-col justify-between rounded-2xl bg-card hover:bg-card/90 border border-border/80 hover:border-emerald-500/50 p-3.5 shadow-lg hover:shadow-2xl hover:shadow-emerald-500/10 transition-all duration-300 cursor-pointer transform hover:-translate-y-1"
    >
      <div className="space-y-3">
        {/* GIF / THUMBNAIL CONTAINER - High contrast anatomical drawing presentation */}
        <div className="aspect-square w-full rounded-xl bg-white dark:bg-slate-950 border border-border/60 overflow-hidden relative flex items-center justify-center p-2 shadow-inner">
          {isVisible ? (
            !imageError ? (
              <img
                src={currentImgSrc}
                alt={exercise.name}
                loading="lazy"
                className="w-full h-full object-contain rounded-lg transition-transform duration-300 group-hover:scale-105"
                onError={handleImageError}
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center bg-slate-900/80 text-slate-400 p-2 text-center">
                <Dumbbell className="w-8 h-8 text-emerald-400 mb-1" />
                <span className="text-[10px] text-slate-400 font-semibold line-clamp-1">{exercise.name}</span>
              </div>
            )
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-slate-900/60 animate-pulse">
              <Dumbbell className="w-8 h-8 text-slate-700" />
            </div>
          )}

          {/* Equipment badge */}
          <div className="absolute top-2 right-2 px-2 py-0.5 rounded-md bg-slate-900/90 backdrop-blur-sm border border-slate-700/80 text-[10px] font-semibold text-slate-300 capitalize shadow">
            {exercise.equipment}
          </div>

          {/* Animated Demo Indicator */}
          {exercise.gifUrl && (
            <div className="absolute bottom-2 left-2 px-1.5 py-0.5 rounded bg-emerald-500/90 backdrop-blur-sm text-[9px] font-bold text-slate-950 flex items-center gap-1 shadow">
              <Play className="w-2.5 h-2.5 fill-current" />
              <span>DEMO</span>
            </div>
          )}
        </div>

        {/* METADATA BELOW THUMBNAIL */}
        <div className="space-y-1.5">
          <h3 className="text-sm font-bold text-foreground group-hover:text-emerald-400 transition-colors line-clamp-2 leading-snug" title={exercise.name}>
            {exercise.name}
          </h3>

          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 font-semibold border border-emerald-500/20 capitalize text-[11px]">
              {displayMuscle}
            </span>
            <span className="px-2 py-0.5 rounded-md bg-slate-800/80 text-slate-400 font-medium border border-slate-700/80 capitalize text-[11px]">
              {displayCategory}
            </span>
          </div>
        </div>
      </div>

      <div className="mt-3 pt-2.5 border-t border-border/60 flex items-center justify-between text-xs text-muted-foreground group-hover:text-emerald-400 font-medium">
        <span className="text-[11px]">View full breakdown</span>
        <ChevronRight className="w-3.5 h-3.5 transform group-hover:translate-x-1 transition-transform" />
      </div>
    </div>
  );
}

export default ExerciseCard;
