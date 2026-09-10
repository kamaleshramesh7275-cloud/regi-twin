import React, { useState, useEffect, useRef } from 'react';
import { api } from './api';
import { 
  Plus, Check, Trash2, Clock, Dumbbell, Award, Flame, 
  Camera, ChevronRight, X, Play, Pause, RotateCcw, Sparkles, 
  Bookmark, Calendar, AlertCircle, TrendingUp, History, ListOrdered,
  Search, Info
} from 'lucide-react';
import { useLocation } from 'wouter';

interface Exercise {
  id: string;
  name: string;
  category: string;
  primary_muscle: string;
  equipment: string;
  icon_svg?: string;
  instructions?: string;
}

interface SetLog {
  id?: string;
  set_number: number;
  set_type: string;
  weight_kg: number;
  reps: number;
  rpe?: number;
  is_completed: boolean;
  is_pr?: boolean;
}

interface WorkoutExerciseItem {
  id?: string; // workout_exercise db id
  exercise: Exercise;
  sets: SetLog[];
}

interface PastWorkout {
  id: string;
  name: string;
  date: string;
  duration_seconds: number;
  total_volume_kg: number;
  notes?: string;
  image_url?: string;
  exercises?: any[];
}

export default function WorkoutLogger() {
  const [, setLocation] = useLocation();
  const userId = 'default_user';

  // Tabs: 'active' | 'history' | 'templates'
  const [activeTab, setActiveTab] = useState<'active' | 'history' | 'templates'>('active');

  // Active workout state
  const [activeWorkoutId, setActiveWorkoutId] = useState<string | null>(null);
  const [workoutName, setWorkoutName] = useState('Evening Strength Session');
  const [workoutNotes, setWorkoutNotes] = useState('');
  const [workoutExercises, setWorkoutExercises] = useState<WorkoutExerciseItem[]>([]);
  const [workoutStartTime, setWorkoutStartTime] = useState<number | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);

  // Catalog for adding exercises
  const [catalog, setCatalog] = useState<Exercise[]>([]);
  const [showAddExerciseModal, setShowAddExerciseModal] = useState(false);
  const [searchCatalogQuery, setSearchCatalogQuery] = useState('');
  const [filterEquipment, setFilterEquipment] = useState<string>('all');
  const [filterMuscle, setFilterMuscle] = useState<string>('all');
  const [selectedExerciseInfo, setSelectedExerciseInfo] = useState<Exercise | null>(null);

  // Rest Timer State
  const [restSecondsLeft, setRestSecondsLeft] = useState<number | null>(null);
  const [restDurationTotal, setRestDurationTotal] = useState<number>(90);
  const [showRestModal, setShowRestModal] = useState(false);

  // PR Celebrations
  const [prBanner, setPrBanner] = useState<{ exerciseName: string; est1rm: number } | null>(null);

  // Finish Workout Modal
  const [showFinishModal, setShowFinishModal] = useState(false);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [saveAsTemplate, setSaveAsTemplate] = useState(false);
  const [templateName, setTemplateName] = useState('');

  // History & Templates data
  const [pastWorkouts, setPastWorkouts] = useState<PastWorkout[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  const [loadingData, setLoadingData] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Load catalog & history
  useEffect(() => {
    async function loadInitial() {
      try {
        const exs = await api.getExercises();
        setCatalog(exs);

        // Check if preselected exercise exists from ExerciseLibrary
        const preselect = sessionStorage.getItem('preselect_exercise');
        if (preselect) {
          sessionStorage.removeItem('preselect_exercise');
          const ex = JSON.parse(preselect);
          startNewWorkout(ex);
        }
      } catch (err) {
        console.error('Failed to load exercises', err);
      }
    }
    loadInitial();
    loadHistory();
    loadTemplates();
  }, []);

  // Timer Tick
  useEffect(() => {
    let interval: any = null;
    if (isTimerRunning && workoutStartTime) {
      interval = setInterval(() => {
        setElapsedSeconds(Math.floor((Date.now() - workoutStartTime) / 1000));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, workoutStartTime]);

  // Rest Timer Tick
  useEffect(() => {
    let restInterval: any = null;
    if (restSecondsLeft !== null && restSecondsLeft > 0) {
      restInterval = setInterval(() => {
        setRestSecondsLeft(prev => {
          if (prev === null || prev <= 1) return 0;
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(restInterval);
  }, [restSecondsLeft]);

  const loadHistory = async () => {
    try {
      setLoadingData(true);
      const data = await api.getWorkouts(userId, 30);
      setPastWorkouts(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingData(false);
    }
  };

  const loadTemplates = async () => {
    try {
      const data = await api.getWorkoutTemplates(userId);
      setTemplates(data);
    } catch (e) {
      console.error(e);
    }
  };

  const startNewWorkout = async (initialExercise?: Exercise) => {
    try {
      const session = await api.createWorkout(userId, { name: workoutName });
      setActiveWorkoutId(session.id);
      setWorkoutStartTime(Date.now());
      setIsTimerRunning(true);
      setElapsedSeconds(0);
      setWorkoutExercises([]);

      if (initialExercise) {
        const addedWe = await api.addWorkoutExercise(session.id, { exercise_id: initialExercise.id, order_index: 0 });
        setWorkoutExercises([{
          id: addedWe.id,
          exercise: initialExercise,
          sets: [{ set_number: 1, set_type: 'normal', weight_kg: 0, reps: 0, is_completed: false }]
        }]);
      }
      setActiveTab('active');
    } catch (err) {
      console.error('Failed to create session', err);
    }
  };

  const addExerciseToWorkout = async (exercise: Exercise) => {
    if (!activeWorkoutId) {
      await startNewWorkout(exercise);
      setShowAddExerciseModal(false);
      return;
    }

    try {
      const addedWe = await api.addWorkoutExercise(activeWorkoutId, {
        exercise_id: exercise.id,
        order_index: workoutExercises.length
      });

      setWorkoutExercises(prev => [
        ...prev,
        {
          id: addedWe.id,
          exercise,
          sets: [
            { set_number: 1, set_type: 'normal', weight_kg: 0, reps: 0, is_completed: false }
          ]
        }
      ]);
      setShowAddExerciseModal(false);
    } catch (err) {
      console.error('Failed to add exercise to workout', err);
    }
  };

  const addSetToExercise = (exIndex: number) => {
    setWorkoutExercises(prev => {
      const updated = [...prev];
      const target = updated[exIndex];
      const lastSet = target.sets[target.sets.length - 1];
      const nextNum = target.sets.length + 1;
      target.sets.push({
        set_number: nextNum,
        set_type: lastSet ? lastSet.set_type : 'normal',
        weight_kg: lastSet ? lastSet.weight_kg : 0,
        reps: lastSet ? lastSet.reps : 0,
        is_completed: false
      });
      return updated;
    });
  };

  const removeSet = (exIndex: number, setIndex: number) => {
    setWorkoutExercises(prev => {
      const updated = [...prev];
      updated[exIndex].sets.splice(setIndex, 1);
      // Reindex sets
      updated[exIndex].sets.forEach((s, idx) => { s.set_number = idx + 1; });
      return updated;
    });
  };

  const updateSetField = (exIndex: number, setIndex: number, field: keyof SetLog, value: any) => {
    setWorkoutExercises(prev => {
      const updated = [...prev];
      updated[exIndex].sets[setIndex] = {
        ...updated[exIndex].sets[setIndex],
        [field]: value
      };
      return updated;
    });
  };

  const toggleSetComplete = async (exIndex: number, setIndex: number) => {
    const targetEx = workoutExercises[exIndex];
    const targetSet = targetEx.sets[setIndex];
    const newCompleted = !targetSet.is_completed;

    updateSetField(exIndex, setIndex, 'is_completed', newCompleted);

    if (newCompleted && activeWorkoutId && targetEx.id) {
      try {
        const res = await api.logSet(activeWorkoutId, targetEx.id, {
          set_number: targetSet.set_number,
          set_type: targetSet.set_type,
          weight_kg: Number(targetSet.weight_kg) || 0,
          reps: Number(targetSet.reps) || 0,
          rpe: Number(targetSet.rpe) || undefined,
          is_completed: true
        });

        if (res.is_new_pr) {
          setPrBanner({
            exerciseName: targetEx.exercise.name,
            est1rm: Math.round(res.new_estimated_1rm || 0)
          });
          setTimeout(() => setPrBanner(null), 6000);
        }

        // Trigger rest timer
        startRestTimer(restDurationTotal);
      } catch (err) {
        console.error('Failed to log set to server', err);
      }
    }
  };

  const startRestTimer = (seconds: number) => {
    setRestDurationTotal(seconds);
    setRestSecondsLeft(seconds);
    setShowRestModal(true);
  };

  const handleFinishWorkout = async () => {
    if (!activeWorkoutId) return;
    try {
      setSubmitting(true);
      await api.finishWorkout(activeWorkoutId, {
        name: workoutName,
        notes: workoutNotes,
        duration_seconds: elapsedSeconds
      });

      if (photoFile) {
        await api.uploadWorkoutImage(activeWorkoutId, photoFile);
      }

      if (saveAsTemplate && templateName) {
        const templateExercises = workoutExercises.map(we => ({
          exercise_id: we.exercise.id,
          name: we.exercise.name,
          sets: we.sets.length
        }));
        await api.createWorkoutTemplate(userId, {
          name: templateName,
          exercises_json: JSON.stringify(templateExercises)
        });
      }

      // Reset active state
      setActiveWorkoutId(null);
      setIsTimerRunning(false);
      setWorkoutExercises([]);
      setShowFinishModal(false);
      setPhotoFile(null);
      setPhotoPreview(null);
      setActiveTab('history');
      await loadHistory();
      await loadTemplates();
    } catch (err) {
      console.error('Failed to complete workout', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setPhotoFile(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    return `${mins}:${s < 10 ? '0' : ''}${s}`;
  };

  const totalCompletedVolume = workoutExercises.reduce((sum, we) => {
    return sum + we.sets.filter(s => s.is_completed).reduce((sSum, s) => sSum + (s.weight_kg * s.reps), 0);
  }, 0);

  const totalCompletedSets = workoutExercises.reduce((sum, we) => {
    return sum + we.sets.filter(s => s.is_completed).length;
  }, 0);

  return (
    <div className="min-h-screen bg-[#07090E] text-slate-100 p-4 md:p-8 space-y-8">
      {/* PR TOAST CELEBRATION */}
      {prBanner && (
        <div className="fixed top-6 right-6 z-50 animate-bounce">
          <div className="bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 text-slate-950 p-4 rounded-2xl shadow-2xl shadow-yellow-500/50 flex items-center gap-3 border border-yellow-300">
            <div className="w-10 h-10 rounded-xl bg-slate-950 text-amber-400 flex items-center justify-center font-bold">
              🏆
            </div>
            <div>
              <span className="text-xs font-black uppercase tracking-wider block">New Personal Record!</span>
              <strong className="text-sm font-black">{prBanner.exerciseName}</strong>
              <span className="text-xs block font-semibold">Estimated 1RM: {prBanner.est1rm} kg</span>
            </div>
            <button onClick={() => setPrBanner(null)} className="text-slate-800 hover:text-black font-bold ml-2">✕</button>
          </div>
        </div>
      )}

      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-semibold uppercase tracking-wider mb-2">
            <Dumbbell className="w-3.5 h-3.5" />
            Native Workout Tracker
          </div>
          <h1 className="text-3xl md:text-4xl font-black text-white">
            Workout Session Logger
          </h1>
          <p className="text-slate-400 text-sm">
            Live set-by-set execution, automated 1RM detection, rest countdowns, and photo archiving.
          </p>
        </div>

        {/* TABS */}
        <div className="flex bg-slate-900/90 border border-slate-800 p-1 rounded-2xl">
          <button
            onClick={() => setActiveTab('active')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs md:text-sm font-bold transition-all ${
              activeTab === 'active' ? 'bg-cyan-500 text-slate-950 shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Play className="w-4 h-4 fill-current" />
            Active Session {activeWorkoutId && <span className="w-2 h-2 rounded-full bg-red-500 animate-ping"></span>}
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs md:text-sm font-bold transition-all ${
              activeTab === 'history' ? 'bg-cyan-500 text-slate-950 shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            <History className="w-4 h-4" />
            History ({pastWorkouts.length})
          </button>
          <button
            onClick={() => setActiveTab('templates')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs md:text-sm font-bold transition-all ${
              activeTab === 'templates' ? 'bg-cyan-500 text-slate-950 shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Bookmark className="w-4 h-4" />
            Templates ({templates.length})
          </button>
        </div>
      </div>

      {/* ── TAB 1: ACTIVE WORKOUT SESSION ── */}
      {activeTab === 'active' && (
        <div className="space-y-6">
          {!activeWorkoutId ? (
            /* EMPTY / START WORKOUT CARD */
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900 to-cyan-950/40 border border-slate-800 p-8 md:p-12 text-center space-y-6 shadow-2xl">
              <div className="w-20 h-20 rounded-3xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center mx-auto text-cyan-400">
                <Dumbbell className="w-10 h-10" />
              </div>
              <div className="max-w-md mx-auto space-y-2">
                <h2 className="text-2xl md:text-3xl font-black text-white">Ready for your workout?</h2>
                <p className="text-slate-400 text-sm">
                  Start an empty session or pick exercises from the built-in library. We will track your acute load and estimate your 1RM gains automatically.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <button
                  onClick={() => startNewWorkout()}
                  className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-base shadow-lg shadow-cyan-500/25 transition-all transform hover:-translate-y-0.5 flex items-center justify-center gap-2"
                >
                  <Play className="w-5 h-5 fill-current" />
                  Start Empty Workout
                </button>
                <button
                  onClick={() => setLocation('/exercises')}
                  className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-base transition-all flex items-center justify-center gap-2"
                >
                  <ListOrdered className="w-5 h-5" />
                  Browse Exercise Library
                </button>
              </div>
            </div>
          ) : (
            /* ACTIVE WORKOUT PANEL */
            <div className="space-y-6">
              {/* TOP BAR: NAME & DURATION TAPE */}
              <div className="bg-slate-900/90 border border-cyan-500/30 rounded-3xl p-5 md:p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex-1 space-y-1">
                  <input
                    type="text"
                    value={workoutName}
                    onChange={(e) => setWorkoutName(e.target.value)}
                    className="text-xl md:text-2xl font-black text-white bg-transparent border-b border-transparent hover:border-slate-700 focus:border-cyan-500 focus:outline-none w-full"
                    placeholder="Workout Title"
                  />
                  <div className="flex items-center gap-4 text-xs text-slate-400">
                    <span className="flex items-center gap-1.5 font-mono text-cyan-400 font-bold">
                      <Clock className="w-3.5 h-3.5" />
                      {formatTime(elapsedSeconds)}
                    </span>
                    <span>•</span>
                    <span>Volume: <strong className="text-white font-mono">{totalCompletedVolume.toLocaleString()} kg</strong></span>
                    <span>•</span>
                    <span>Sets: <strong className="text-white font-mono">{totalCompletedSets}</strong></span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setShowRestModal(true)}
                    className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs flex items-center gap-2"
                  >
                    <Clock className="w-3.5 h-3.5 text-cyan-400" />
                    Rest Timer ({restSecondsLeft !== null ? formatTime(restSecondsLeft) : 'Off'})
                  </button>

                  <button
                    onClick={() => setShowFinishModal(true)}
                    className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-black text-sm shadow-md shadow-emerald-500/20"
                  >
                    Finish Workout
                  </button>
                </div>
              </div>

              {/* EXERCISES IN WORKOUT */}
              <div className="space-y-6">
                {workoutExercises.map((we, exIdx) => {
                  const svgPath = we.exercise.icon_svg ? `/exercises/${we.exercise.icon_svg}` : `/exercises/${we.exercise.id}.svg`;
                  return (
                    <div
                      key={exIdx}
                      className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 md:p-6 shadow-lg space-y-4"
                    >
                      {/* Exercise Header */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center p-1.5">
                            <img src={svgPath} alt={we.exercise.name} className="w-full h-full object-contain" />
                          </div>
                          <div>
                            <h3 className="text-lg font-bold text-white">{we.exercise.name}</h3>
                            <span className="text-xs text-cyan-400 capitalize">{we.exercise.primary_muscle} • {we.exercise.equipment}</span>
                          </div>
                        </div>

                        <button
                          onClick={() => {
                            setWorkoutExercises(prev => prev.filter((_, i) => i !== exIdx));
                          }}
                          className="text-slate-500 hover:text-red-400 p-2 rounded-xl hover:bg-red-500/10"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Sets Table */}
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs md:text-sm">
                          <thead>
                            <tr className="text-slate-400 border-b border-slate-800 text-[11px] uppercase tracking-wider">
                              <th className="pb-2 w-12 text-center">Set</th>
                              <th className="pb-2 w-24">Type</th>
                              <th className="pb-2 w-28">Weight (kg)</th>
                              <th className="pb-2 w-24">Reps</th>
                              <th className="pb-2 w-20">RPE</th>
                              <th className="pb-2 w-16 text-center">Done</th>
                              <th className="pb-2 w-10"></th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-800/40">
                            {we.sets.map((set, sIdx) => {
                              return (
                                <tr
                                  key={sIdx}
                                  className={`transition-colors ${
                                    set.is_completed ? 'bg-emerald-950/20 text-emerald-300' : 'hover:bg-slate-800/30'
                                  }`}
                                >
                                  <td className="py-2.5 text-center font-bold font-mono text-slate-400">
                                    {set.set_number}
                                  </td>
                                  <td className="py-2.5">
                                    <select
                                      value={set.set_type}
                                      onChange={(e) => updateSetField(exIdx, sIdx, 'set_type', e.target.value)}
                                      className="bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-xs text-slate-300"
                                    >
                                      <option value="normal">Normal</option>
                                      <option value="warmup">Warm-up</option>
                                      <option value="drop">Drop set</option>
                                      <option value="failure">Failure</option>
                                    </select>
                                  </td>
                                  <td className="py-2.5">
                                    <input
                                      type="number"
                                      step="0.5"
                                      value={set.weight_kg || ''}
                                      onChange={(e) => updateSetField(exIdx, sIdx, 'weight_kg', parseFloat(e.target.value) || 0)}
                                      placeholder="0"
                                      className="w-20 bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-center font-mono text-white focus:border-cyan-500"
                                    />
                                  </td>
                                  <td className="py-2.5">
                                    <input
                                      type="number"
                                      value={set.reps || ''}
                                      onChange={(e) => updateSetField(exIdx, sIdx, 'reps', parseInt(e.target.value) || 0)}
                                      placeholder="0"
                                      className="w-16 bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-center font-mono text-white focus:border-cyan-500"
                                    />
                                  </td>
                                  <td className="py-2.5">
                                    <input
                                      type="number"
                                      min="1"
                                      max="10"
                                      value={set.rpe || ''}
                                      onChange={(e) => updateSetField(exIdx, sIdx, 'rpe', parseInt(e.target.value) || undefined)}
                                      placeholder="8"
                                      className="w-14 bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-center font-mono text-white focus:border-cyan-500"
                                    />
                                  </td>
                                  <td className="py-2.5 text-center">
                                    <button
                                      type="button"
                                      onClick={() => toggleSetComplete(exIdx, sIdx)}
                                      className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all mx-auto ${
                                        set.is_completed
                                          ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/30'
                                          : 'bg-slate-800 hover:bg-slate-700 text-slate-400'
                                      }`}
                                    >
                                      <Check className="w-4 h-4 stroke-[3]" />
                                    </button>
                                  </td>
                                  <td className="py-2.5 text-right">
                                    <button
                                      onClick={() => removeSet(exIdx, sIdx)}
                                      className="text-slate-600 hover:text-red-400"
                                    >
                                      ✕
                                    </button>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>

                      <button
                        onClick={() => addSetToExercise(exIdx)}
                        className="w-full py-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        Add Set
                      </button>
                    </div>
                  );
                })}

                {/* ADD EXERCISE BUTTON */}
                <button
                  onClick={() => setShowAddExerciseModal(true)}
                  className="w-full py-4 rounded-3xl bg-slate-900/60 hover:bg-slate-900 border-2 border-dashed border-slate-800 hover:border-cyan-500/50 text-slate-300 hover:text-cyan-400 font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-md"
                >
                  <Plus className="w-5 h-5" />
                  Add Exercise
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── TAB 2: WORKOUT HISTORY ── */}
      {activeTab === 'history' && (
        <div className="space-y-6">
          {loadingData ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => <div key={i} className="h-28 bg-slate-900/40 rounded-3xl animate-pulse" />)}
            </div>
          ) : pastWorkouts.length === 0 ? (
            <div className="text-center py-20 bg-slate-900/20 border border-slate-800 rounded-3xl p-8 space-y-4">
              <History className="w-12 h-12 text-slate-500 mx-auto" />
              <h3 className="text-xl font-bold text-white">No workouts recorded yet</h3>
              <p className="text-slate-400 text-sm max-w-sm mx-auto">
                Finish your first live workout session or browse templates to get started.
              </p>
              <button
                onClick={() => { setActiveTab('active'); startNewWorkout(); }}
                className="px-6 py-2.5 rounded-xl bg-cyan-500 text-slate-950 font-bold text-xs"
              >
                Start Workout Now
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {pastWorkouts.map(w => (
                <div
                  key={w.id}
                  className="bg-slate-900/80 border border-slate-800 hover:border-cyan-500/40 rounded-3xl p-6 shadow-lg space-y-4 transition-all"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-lg font-bold text-white">{w.name}</h3>
                      <div className="flex items-center gap-2 text-xs text-slate-400 mt-1">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>{new Date(w.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    </div>

                    <button
                      onClick={async () => {
                        if (confirm('Delete this workout record?')) {
                          await api.deleteWorkout(w.id);
                          loadHistory();
                        }
                      }}
                      className="text-slate-600 hover:text-red-400 p-1.5 rounded-lg hover:bg-slate-800"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {w.image_url && (
                    <div className="w-full h-44 rounded-2xl overflow-hidden border border-slate-800">
                      <img src={w.image_url} alt="Workout" className="w-full h-full object-cover" />
                    </div>
                  )}

                  <div className="grid grid-cols-3 gap-2 bg-slate-950/60 p-3 rounded-2xl text-center border border-slate-800/80 text-xs">
                    <div>
                      <span className="text-slate-500 block text-[10px] uppercase">Duration</span>
                      <strong className="text-white font-mono">{formatTime(w.duration_seconds || 0)}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px] uppercase">Volume</span>
                      <strong className="text-cyan-400 font-mono">{(w.total_volume_kg || 0).toLocaleString()} kg</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px] uppercase">Exercises</span>
                      <strong className="text-white font-mono">{w.exercises ? w.exercises.length : 0}</strong>
                    </div>
                  </div>

                  {w.notes && (
                    <p className="text-xs text-slate-400 italic bg-slate-950/40 p-2.5 rounded-xl border border-slate-800/50">
                      "{w.notes}"
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── TAB 3: WORKOUT TEMPLATES ── */}
      {activeTab === 'templates' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {templates.map(t => (
              <div
                key={t.id}
                className="bg-slate-900/80 border border-slate-800 hover:border-cyan-500/40 rounded-3xl p-6 shadow-lg space-y-4"
              >
                <div className="space-y-1">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 text-xs font-semibold">
                    <Bookmark className="w-3 h-3" /> Template
                  </div>
                  <h3 className="text-lg font-bold text-white">{t.name}</h3>
                  {t.description && <p className="text-xs text-slate-400">{t.description}</p>}
                </div>

                <button
                  onClick={() => {
                    setWorkoutName(t.name);
                    startNewWorkout();
                  }}
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs shadow-md flex items-center justify-center gap-2"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  Start from this Routine
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── MODAL: ADD EXERCISE (HEVY STYLE REFERENCE) ── */}
      {showAddExerciseModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 md:p-6">
          <div className="w-full max-w-xl bg-[#0B111E] border border-slate-800 rounded-3xl p-5 md:p-6 shadow-2xl flex flex-col max-h-[90vh] space-y-4">
            
            {/* Top Navigation Bar */}
            <div className="flex items-center justify-between pb-1 border-b border-slate-800/80">
              <button 
                onClick={() => setShowAddExerciseModal(false)}
                className="text-cyan-400 font-semibold text-sm hover:text-cyan-300 transition-colors"
              >
                Cancel
              </button>
              <h3 className="text-base font-bold text-white tracking-wide">Add Exercise</h3>
              <button 
                onClick={() => setShowAddExerciseModal(false)}
                className="text-cyan-400 font-bold text-sm hover:text-cyan-300 transition-colors"
              >
                Done
              </button>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchCatalogQuery}
                onChange={(e) => setSearchCatalogQuery(e.target.value)}
                placeholder="Search exercise"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-950/80 border border-slate-800/90 rounded-2xl text-white text-sm placeholder:text-slate-500 focus:outline-none focus:border-cyan-500"
                autoFocus
              />
            </div>

            {/* Filter Pills (All Equipment & All Muscles) */}
            <div className="grid grid-cols-2 gap-2.5">
              {/* Equipment Selector */}
              <select
                value={filterEquipment}
                onChange={(e) => setFilterEquipment(e.target.value)}
                className="w-full py-2 px-3 bg-slate-950 border border-slate-800 text-slate-200 font-bold text-xs rounded-xl focus:border-cyan-500 cursor-pointer"
              >
                <option value="all">All Equipment</option>
                <option value="barbell">Barbell</option>
                <option value="dumbbell">Dumbbell</option>
                <option value="cable">Cable</option>
                <option value="machine">Machine</option>
                <option value="bodyweight">Bodyweight</option>
              </select>

              {/* Muscle Selector */}
              <select
                value={filterMuscle}
                onChange={(e) => setFilterMuscle(e.target.value)}
                className="w-full py-2 px-3 bg-slate-950 border border-slate-800 text-slate-200 font-bold text-xs rounded-xl focus:border-cyan-500 cursor-pointer"
              >
                <option value="all">All Muscles</option>
                <option value="arms">Biceps / Triceps / Arms</option>
                <option value="chest">Chest</option>
                <option value="back">Back / Lats</option>
                <option value="shoulders">Shoulders / Delts</option>
                <option value="legs">Quads / Legs / Calves</option>
                <option value="core">Abs / Core</option>
                <option value="full_body">Full Body</option>
              </select>
            </div>

            {/* Exercise List */}
            <div className="overflow-y-auto space-y-1 flex-1 pr-1 divide-y divide-slate-900">
              
              {!searchCatalogQuery && filterEquipment === 'all' && filterMuscle === 'all' && (
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 py-1.5 px-2">
                  Recent & Popular Movements
                </div>
              )}

              {catalog
                .filter(ex => {
                  const matchQuery = !searchCatalogQuery || 
                    ex.name.toLowerCase().includes(searchCatalogQuery.toLowerCase()) ||
                    (ex.primary_muscle || '').toLowerCase().includes(searchCatalogQuery.toLowerCase()) ||
                    (ex.equipment || '').toLowerCase().includes(searchCatalogQuery.toLowerCase());
                  
                  const matchEquip = filterEquipment === 'all' || 
                    (ex.equipment || '').toLowerCase() === filterEquipment.toLowerCase();
                  
                  const matchMuscle = filterMuscle === 'all' || 
                    (ex.primary_muscle || '').toLowerCase().includes(filterMuscle.toLowerCase()) ||
                    (ex.category || '').toLowerCase().includes(filterMuscle.toLowerCase());

                  return matchQuery && matchEquip && matchMuscle;
                })
                .map(ex => {
                  const slug = ex.name.toLowerCase().replace(/ /g, '-').replace(/[()]/g, '').replace(/\//g, '-');
                  const svgPath = `/exercises/${slug}.svg`;
                  return (
                    <div
                      key={ex.id}
                      className="flex items-center justify-between p-2.5 rounded-2xl hover:bg-slate-900/90 transition-colors group cursor-pointer"
                      onClick={() => {
                        addExerciseToWorkout(ex);
                        setShowAddExerciseModal(false);
                      }}
                    >
                      {/* Left: Circular Anatomical Thumbnail + Name */}
                      <div className="flex items-center gap-3.5 flex-1 min-w-0">
                        <div className="w-12 h-12 rounded-full bg-slate-950 border border-slate-800 p-0.5 shrink-0 flex items-center justify-center overflow-hidden group-hover:border-cyan-500/50 transition-colors shadow-inner">
                          <img 
                            src={svgPath} 
                            alt={ex.name} 
                            className="w-full h-full object-contain"
                            onError={(e) => {
                              // fallback
                              (e.target as HTMLElement).style.display = 'none';
                            }}
                          />
                        </div>
                        <div className="truncate">
                          <strong className="text-sm font-semibold text-white block truncate group-hover:text-cyan-400 transition-colors">
                            {ex.name}
                          </strong>
                          <span className="text-xs text-slate-400 capitalize">
                            {ex.primary_muscle}
                          </span>
                        </div>
                      </div>

                      {/* Right: Info Icon & Add Trigger */}
                      <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedExerciseInfo(ex);
                          }}
                          className="p-2 text-slate-500 hover:text-cyan-400 rounded-full hover:bg-slate-800 transition-colors"
                          title="Exercise Details & Form Cues"
                        >
                          <Info className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            addExerciseToWorkout(ex);
                            setShowAddExerciseModal(false);
                          }}
                          className="p-2 text-slate-500 hover:text-emerald-400 rounded-full hover:bg-emerald-500/10 transition-colors"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: EXERCISE TECHNIQUE & FORM INFO ── */}
      {selectedExerciseInfo && (
        <div className="fixed inset-0 z-[60] bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4">
            
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-slate-950 border border-slate-800 p-0.5 shrink-0 overflow-hidden">
                  <img 
                    src={`/exercises/${selectedExerciseInfo.name.toLowerCase().replace(/ /g, '-').replace(/[()]/g, '').replace(/\//g, '-')}.svg`} 
                    alt={selectedExerciseInfo.name} 
                    className="w-full h-full object-contain" 
                  />
                </div>
                <div>
                  <h4 className="text-base font-bold text-white">{selectedExerciseInfo.name}</h4>
                  <span className="text-xs text-cyan-400 capitalize">{selectedExerciseInfo.primary_muscle} • {selectedExerciseInfo.equipment}</span>
                </div>
              </div>
              <button 
                onClick={() => setSelectedExerciseInfo(null)}
                className="text-slate-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 text-xs text-slate-300 space-y-2">
              <strong className="text-emerald-400 block font-bold">Biomechanical Form Cues:</strong>
              <p className="leading-relaxed text-slate-300">
                {selectedExerciseInfo.instructions || "Maintain strict scapular control, full range of motion, and control the eccentric tempo for optimal hypertrophy and joint safety."}
              </p>
            </div>

            <button
              onClick={() => {
                addExerciseToWorkout(selectedExerciseInfo);
                setSelectedExerciseInfo(null);
                setShowAddExerciseModal(false);
              }}
              className="w-full py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 text-slate-950 font-black text-xs shadow-lg shadow-emerald-500/20"
            >
              Add to Active Session
            </button>
          </div>
        </div>
      )}

      {/* ── MODAL: REST TIMER ── */}
      {showRestModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl p-6 text-center space-y-6 shadow-2xl">
            <h3 className="text-lg font-bold text-white flex items-center justify-center gap-2">
              <Clock className="w-5 h-5 text-cyan-400" /> Rest Countdown
            </h3>

            <div className="text-5xl font-black font-mono text-cyan-400">
              {restSecondsLeft !== null ? formatTime(restSecondsLeft) : '0:00'}
            </div>

            <div className="flex justify-center gap-2">
              {[30, 60, 90, 120, 180].map(sec => (
                <button
                  key={sec}
                  onClick={() => startRestTimer(sec)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold ${
                    restDurationTotal === sec ? 'bg-cyan-500 text-slate-950' : 'bg-slate-800 text-slate-300'
                  }`}
                >
                  {sec}s
                </button>
              ))}
            </div>

            <button
              onClick={() => { setShowRestModal(false); setRestSecondsLeft(null); }}
              className="w-full py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs"
            >
              Skip Rest
            </button>
          </div>
        </div>
      )}

      {/* ── MODAL: FINISH WORKOUT ── */}
      {showFinishModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 space-y-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-2xl font-black text-white">Complete Workout</h3>
              <button onClick={() => setShowFinishModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <div className="grid grid-cols-3 gap-3 bg-slate-950 p-4 rounded-2xl border border-slate-800 text-center">
              <div>
                <span className="text-slate-500 text-xs block">Duration</span>
                <strong className="text-white font-mono text-base">{formatTime(elapsedSeconds)}</strong>
              </div>
              <div>
                <span className="text-slate-500 text-xs block">Total Volume</span>
                <strong className="text-cyan-400 font-mono text-base">{totalCompletedVolume} kg</strong>
              </div>
              <div>
                <span className="text-slate-500 text-xs block">Sets Completed</span>
                <strong className="text-white font-mono text-base">{totalCompletedSets}</strong>
              </div>
            </div>

            {/* Photo Attachment */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <Camera className="w-4 h-4 text-cyan-400" />
                Attach Post-Workout Photo (Local Storage)
              </label>
              {photoPreview ? (
                <div className="relative w-full h-40 rounded-2xl overflow-hidden border border-slate-800">
                  <img src={photoPreview} alt="Upload preview" className="w-full h-full object-cover" />
                  <button
                    onClick={() => { setPhotoFile(null); setPhotoPreview(null); }}
                    className="absolute top-2 right-2 p-1.5 bg-black/70 rounded-full text-white"
                  >
                    ✕
                  </button>
                </div>
              ) : (
                <label className="border-2 border-dashed border-slate-800 hover:border-cyan-500/50 rounded-2xl p-6 flex flex-col items-center justify-center cursor-pointer bg-slate-950/60 hover:bg-slate-950 transition-colors">
                  <Camera className="w-6 h-6 text-slate-400 mb-1" />
                  <span className="text-xs text-slate-300 font-medium">Click to select photo</span>
                  <span className="text-[10px] text-slate-500">JPG, PNG, WEBP (Max 5MB)</span>
                  <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handlePhotoSelect} className="hidden" />
                </label>
              )}
            </div>

            {/* Save as Template */}
            <div className="space-y-3 pt-2">
              <label className="flex items-center gap-2 text-xs text-slate-300 font-semibold cursor-pointer">
                <input
                  type="checkbox"
                  checked={saveAsTemplate}
                  onChange={(e) => {
                    setSaveAsTemplate(e.target.checked);
                    if (e.target.checked && !templateName) setTemplateName(workoutName);
                  }}
                  className="rounded border-slate-700 text-cyan-500 focus:ring-0"
                />
                Save as reusable workout routine template
              </label>

              {saveAsTemplate && (
                <input
                  type="text"
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                  placeholder="Template routine name (e.g. Chest & Triceps Hypertrophy)"
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs"
                />
              )}
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setShowFinishModal(false)}
                className="flex-1 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs"
              >
                Cancel
              </button>
              <button
                onClick={handleFinishWorkout}
                disabled={submitting}
                className="flex-1 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-black text-xs shadow-lg shadow-emerald-500/20"
              >
                {submitting ? 'Saving...' : 'Save & Finish'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
