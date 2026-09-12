import React, { useState, useEffect, useMemo } from 'react';
import { api } from './api';
import { 
  Search, Dumbbell, CheckCircle2, AlertTriangle, Sparkles 
} from 'lucide-react';
import { ExerciseCard, type Exercise } from './components/ExerciseCard';
import { EXERCISES_DATABASE as exercisesData } from './data/exercisesData';

const CATEGORIES = [
  { id: 'all', label: 'All Movements' },
  { id: 'chest', label: 'Chest' },
  { id: 'back', label: 'Back' },
  { id: 'shoulders', label: 'Shoulders' },
  { id: 'upper arms', label: 'Arms / Biceps / Triceps' },
  { id: 'upper legs', label: 'Upper Legs / Quads' },
  { id: 'lower legs', label: 'Calves' },
  { id: 'waist', label: 'Core / Abs' },
  { id: 'cardio', label: 'Cardio' }
];

const EQUIPMENTS = [
  { id: 'all', label: 'All Equipment' },
  { id: 'barbell', label: 'Barbell' },
  { id: 'dumbbell', label: 'Dumbbell' },
  { id: 'cable', label: 'Cable' },
  { id: 'leverage machine', label: 'Machine' },
  { id: 'body weight', label: 'Bodyweight' },
  { id: 'band', label: 'Resistance Band' },
  { id: 'kettlebell', label: 'Kettlebell' }
];

export default function ExerciseLibrary() {
  const [exercises, setExercises] = useState<Exercise[]>(exercisesData);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedEquipment, setSelectedEquipment] = useState('all');
  const [activeModalExercise, setActiveModalExercise] = useState<Exercise | null>(null);

  useEffect(() => {
    async function loadExercises() {
      try {
        const data = await api.getExercises();
        if (data && Array.isArray(data) && data.length > 0) {
          setExercises(data);
        }
      } catch (err) {
        console.warn('Using local exercises data bundle', err);
      }
    }
    loadExercises();
  }, []);

  const filteredExercises = useMemo(() => {
    return exercises.filter(ex => {
      const exName = ex.name || '';
      const exPrimary = ex.primary_muscle || ex.target || '';
      const exSec = ex.secondary_muscles || '';
      const exEquip = ex.equipment || '';
      const exCat = ex.category || ex.bodyPart || '';

      const matchesSearch = searchQuery === '' || 
        exName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        exPrimary.toLowerCase().includes(searchQuery.toLowerCase()) ||
        exSec.toLowerCase().includes(searchQuery.toLowerCase()) ||
        exEquip.toLowerCase().includes(searchQuery.toLowerCase()) ||
        exCat.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCat = selectedCategory === 'all' || 
        exCat.toLowerCase() === selectedCategory.toLowerCase() ||
        exPrimary.toLowerCase().includes(selectedCategory.toLowerCase());

      const matchesEquip = selectedEquipment === 'all' || 
        exEquip.toLowerCase().includes(selectedEquipment.toLowerCase());

      return matchesSearch && matchesCat && matchesEquip;
    });
  }, [exercises, searchQuery, selectedCategory, selectedEquipment]);

  return (
    <div className="min-h-screen bg-[#07090E] text-slate-100 p-4 md:p-8 space-y-8">
      {/* Sticky Exit Header */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-800">
        <a href="/dashboard" className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:border-emerald-500/50 text-xs font-bold transition-all shadow-md">
          ← Exit to Dashboard
        </a>
        <span className="text-xs text-slate-500 font-semibold">Press Esc or click exit to return</span>
      </div>

      {/* HEADER SECTION */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-emerald-950/40 via-cyan-950/30 to-indigo-950/40 border border-emerald-500/20 p-6 md:p-10 shadow-2xl backdrop-blur-xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold uppercase tracking-wider">
              <Dumbbell className="w-3.5 h-3.5 animate-pulse" />
              100% Visual Movement Directory
            </div>
            <h1 className="text-3xl md:text-5xl font-black tracking-tight text-white flex items-center gap-3">
              Exercise Library <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">1,300+ ExerciseDB Demos</span>
            </h1>
            <p className="text-slate-400 max-w-2xl text-sm md:text-base leading-relaxed">
              Explore biomechanically categorized movements with step-by-step cueing, animated GIF demos directly from the dataset, targeted muscle breakdowns, and instant form tips.
            </p>
          </div>

          <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs font-bold">
            <Sparkles className="w-4 h-4 text-emerald-400" />
            <span>{exercises.length} Total Exercises</span>
          </div>
        </div>
      </div>

      {/* SEARCH & FILTERS */}
      <div className="space-y-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search exercise by name, muscle (e.g. Abs, Chest, Lats), or equipment..."
              className="w-full pl-12 pr-4 py-3.5 bg-slate-900/80 border border-slate-800 rounded-2xl text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500/60 focus:ring-2 focus:ring-emerald-500/20 transition-all text-sm"
            />
          </div>

          <div className="flex gap-2 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
            <select
              value={selectedEquipment}
              onChange={(e) => setSelectedEquipment(e.target.value)}
              className="px-4 py-3 bg-slate-900/80 border border-slate-800 rounded-2xl text-slate-200 text-sm focus:outline-none focus:border-emerald-500/60"
            >
              {EQUIPMENTS.map(eq => (
                <option key={eq.id} value={eq.id} className="bg-slate-900 text-slate-200">
                  {eq.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-slate-800">
          {CATEGORIES.map(cat => {
            const isActive = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-4 py-2 rounded-xl text-xs md:text-sm font-semibold whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                    : 'bg-slate-900/60 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800/80'
                }`}
              >
                {cat.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* STATS / COUNT */}
      <div className="flex items-center justify-between text-xs md:text-sm text-slate-400 border-b border-slate-800/60 pb-3">
        <span>Showing <strong className="text-emerald-400 font-mono">{filteredExercises.length}</strong> movements</span>
        <span className="text-slate-500">Click any card for animated demo &amp; form cues</span>
      </div>

      {/* EXERCISE GRID */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-64 rounded-3xl bg-slate-900/40 border border-slate-800/50 animate-pulse p-5"></div>
          ))}
        </div>
      ) : filteredExercises.length === 0 ? (
        <div className="text-center py-20 bg-slate-900/20 border border-slate-800 rounded-3xl p-8 space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-slate-800/60 flex items-center justify-center mx-auto text-slate-400">
            <Dumbbell className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-slate-200">No exercises found</h3>
          <p className="text-slate-400 text-sm max-w-md mx-auto">
            Try tweaking your search term or select another category filter above.
          </p>
          <button
            onClick={() => { setSearchQuery(''); setSelectedCategory('all'); setSelectedEquipment('all'); }}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold"
          >
            Reset All Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredExercises.map(ex => (
            <ExerciseCard
              key={ex.id}
              exercise={ex}
              onClick={() => setActiveModalExercise(ex)}
            />
          ))}
        </div>
      )}

      {/* EXERCISE DETAIL MODAL */}
      {activeModalExercise && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-2xl overflow-y-auto max-h-[90vh] space-y-6">
            
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-semibold uppercase border border-emerald-500/30">
                    {activeModalExercise.category || activeModalExercise.bodyPart || 'Movement'}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 text-xs font-semibold capitalize border border-slate-700">
                    {activeModalExercise.equipment}
                  </span>
                </div>
                <h2 className="text-2xl md:text-3xl font-black text-white">
                  {activeModalExercise.name}
                </h2>
              </div>
              <button
                onClick={() => setActiveModalExercise(null)}
                className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-300 hover:text-white"
              >
                ✕
              </button>
            </div>

            {/* Animation / Demo Display */}
            <div className="w-full h-72 rounded-2xl bg-white dark:bg-slate-950 border border-slate-800 flex items-center justify-center p-4 overflow-hidden shadow-inner">
              <img
                src={activeModalExercise.gifUrl || activeModalExercise.imageUrl || activeModalExercise.gif_url || activeModalExercise.image_path || '/placeholder-exercise.svg'}
                alt={activeModalExercise.name}
                loading="lazy"
                className="h-full max-w-full object-contain rounded-xl"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/placeholder-exercise.svg';
                }}
              />
            </div>

            {/* Muscles Involved */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800">
                <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider block mb-1">Primary Target</span>
                <span className="text-emerald-400 font-bold capitalize text-base">{activeModalExercise.primary_muscle || activeModalExercise.target || 'General'}</span>
              </div>
              <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800">
                <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider block mb-1">Secondary Synergists</span>
                <span className="text-slate-300 font-medium capitalize text-sm">{Array.isArray(activeModalExercise.secondaryMuscles) ? activeModalExercise.secondaryMuscles.join(', ') : (activeModalExercise.secondary_muscles || 'Core, Stabilizers')}</span>
              </div>
            </div>

            {/* Instructions & Form Tips */}
            <div className="space-y-3">
              <h4 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                Form Execution &amp; Instructions
              </h4>
              <div className="p-4 rounded-2xl bg-slate-950/40 border border-slate-800/80 text-sm text-slate-300 leading-relaxed space-y-2">
                {Array.isArray(activeModalExercise.instructions) && activeModalExercise.instructions.length > 0 ? (
                  activeModalExercise.instructions.map((step, idx) => (
                    <p key={idx} className="flex items-start gap-2">
                      <span className="text-emerald-400 font-mono text-xs mt-0.5">0{idx + 1}.</span>
                      <span>{step.endsWith('.') ? step : `${step}.`}</span>
                    </p>
                  ))
                ) : typeof activeModalExercise.instructions === 'string' && activeModalExercise.instructions.trim() ? (
                  activeModalExercise.instructions.split('. ').map((step, idx) => (
                    step.trim() && (
                      <p key={idx} className="flex items-start gap-2">
                        <span className="text-emerald-400 font-mono text-xs mt-0.5">0{idx + 1}.</span>
                        <span>{step.endsWith('.') ? step : `${step}.`}</span>
                      </p>
                    )
                  ))
                ) : (
                  <p>Maintain controlled tempo throughout the eccentric and concentric phases. Engage core and preserve neutral spine alignment.</p>
                )}
              </div>
            </div>

            {activeModalExercise.tips && (
              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5 text-amber-400" />
                <div>
                  <strong className="block font-semibold mb-0.5">Biomechanical Note</strong>
                  {activeModalExercise.tips}
                </div>
              </div>
            )}

            {/* Action Button */}
            <div className="pt-2">
              <button
                onClick={() => setActiveModalExercise(null)}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 text-slate-950 font-bold text-sm shadow-lg shadow-emerald-500/20"
              >
                Close Guide
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

