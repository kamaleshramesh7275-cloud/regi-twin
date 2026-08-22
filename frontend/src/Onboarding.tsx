import { useState } from 'react';
import { useLocation } from 'wouter';
import { Dna, Target, Zap, ShieldCheck, Rocket, User, Activity, Leaf, Stethoscope, AlertTriangle, Check } from 'lucide-react';

const STEPS = [
  { id: 1, title: 'Your Baseline', icon: <Dna className="w-5 h-5" />, desc: 'Tell us about your body' },
  { id: 2, title: 'Goals', icon: <Target className="w-5 h-5" />, desc: 'What do you want to achieve?' },
  { id: 3, title: 'Twin Mode', icon: <Zap className="w-5 h-5" />, desc: 'How should your twin think?' },
  { id: 4, title: 'Consent', icon: <ShieldCheck className="w-5 h-5" />, desc: 'Review before we begin' },
  { id: 5, title: 'Initialize', icon: <Rocket className="w-5 h-5" />, desc: 'Boot your digital twin' },
];

const GOALS = ['General Tracking', 'Athletic Performance', 'Rehab & Recovery', 'Healthy Aging'];
const MODES = [
  { id: 'General Human', icon: <User className="w-6 h-6" />, desc: 'Everyday health & movement awareness' },
  { id: 'Athlete', icon: <Activity className="w-6 h-6" />, desc: 'Performance optimization & peak tracking' },
  { id: 'Elder', icon: <Leaf className="w-6 h-6" />, desc: 'Fall prevention & mobility preservation' },
  { id: 'Caregiver/Professional', icon: <Stethoscope className="w-6 h-6" />, desc: 'Multi-patient monitoring & reporting' },
];

export default function Onboarding() {
  const [step, setStep] = useState(1);
  const [selectedGoals, setSelectedGoals] = useState<string[]>([]);
  const [selectedMode, setSelectedMode] = useState('');
  const [consented, setConsented] = useState(false);
  const [, setLocation] = useLocation();

  const nextStep = () => setStep(s => Math.min(s + 1, 5));
  const prevStep = () => setStep(s => Math.max(s - 1, 1));
  const toggleGoal = (g: string) => setSelectedGoals(prev => prev.includes(g) ? prev.filter(x => x !== g) : [...prev, g]);

  const progress = ((step - 1) / (STEPS.length - 1)) * 100;

  return (
    <div className="min-h-screen relative flex flex-col items-center justify-center p-4 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-grid opacity-30" />

      <div className="relative z-10 w-full max-w-lg">
        {/* Header */}
        <div className="text-center mb-8 animate-fade-in">
          <div className="inline-flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-xs font-black text-white shadow-md">PT</div>
            <span className="font-bold tracking-tight">PhysioTwin</span>
          </div>
          <div className="text-muted-foreground text-sm">Step {step} of {STEPS.length}</div>
        </div>

        {/* Progress Bar */}
        <div className="mb-8 animate-fade-in">
          <div className="flex items-center gap-2 mb-3">
            {STEPS.map((s, i) => (
              <div key={s.id} className="flex items-center flex-1">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-all duration-300 ${
                  step > s.id ? 'bg-gradient-to-br from-purple-500 to-purple-400 text-white' :
                  step === s.id ? 'bg-primary/10 border-2 border-primary text-primary' :
                  'bg-card border border-border text-muted-foreground'
                }`}>
                  {step > s.id ? <Check className="w-4 h-4" /> : s.id}
                </div>
                {i < STEPS.length - 1 && (
                  <div className="flex-1 h-0.5 mx-2 rounded-full overflow-hidden bg-border">
                    <div className="h-full bg-primary transition-all duration-500"
                      style={{ width: step > s.id ? '100%' : '0%' }} />
                  </div>
                )}
              </div>
            ))}
          </div>
          <div className="text-center mt-4 flex items-center justify-center gap-2">
            <span className="flex items-center gap-2 text-sm font-semibold">{STEPS[step-1].icon} {STEPS[step-1].title}</span>
            <span className="text-muted-foreground text-xs ml-2 hidden md:inline">— {STEPS[step-1].desc}</span>
          </div>
        </div>

        {/* Card */}
        <div className="card p-8 animate-fade-in-up">
          {step === 1 && (
            <div className="space-y-5">
              <h2 className="text-2xl font-bold">Your Physical Baseline</h2>
              <p className="text-muted-foreground text-sm">Help your twin understand your body's context. All fields optional.</p>
              <div className="space-y-3">
                <input type="number" placeholder="Age" className="input" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <input type="number" placeholder="Height (cm)" className="input" />
                  <input type="number" placeholder="Weight (kg)" className="input" />
                </div>
                <select className="input appearance-none" style={{cursor:'pointer'}}>
                  <option value="">Biological Sex (Optional)</option>
                  <option>Male</option>
                  <option>Female</option>
                  <option>Prefer not to say</option>
                </select>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-5">
              <h2 className="text-2xl font-bold">What Are Your Goals?</h2>
              <p className="text-muted-foreground text-sm">Select all that apply. Your twin will adapt its analysis lens accordingly.</p>
              <div className="space-y-3">
                {GOALS.map(goal => (
                  <button
                    key={goal}
                    onClick={() => toggleGoal(goal)}
                    className={`w-full text-left p-4 rounded-xl border transition-all duration-200 flex items-center justify-between ${
                      selectedGoals.includes(goal)
                        ? 'border-primary bg-primary/5 text-foreground shadow-sm'
                        : 'border-border bg-card text-muted-foreground hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <span className="font-medium">{goal}</span>
                    <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${
                      selectedGoals.includes(goal) ? 'border-primary bg-primary' : 'border-border'
                    }`}>
                      {selectedGoals.includes(goal) && <Check className="w-3 h-3 text-white" />}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-5">
              <h2 className="text-2xl font-bold">Select Twin Mode</h2>
              <p className="text-muted-foreground text-sm">This defines how your digital twin interprets and weights your metrics.</p>
              <div className="space-y-3">
                {MODES.map(mode => (
                  <button
                    key={mode.id}
                    onClick={() => setSelectedMode(mode.id)}
                    className={`w-full text-left p-4 rounded-xl border transition-all duration-200 ${
                      selectedMode === mode.id
                        ? 'border-primary bg-primary/5 shadow-sm'
                        : 'border-border bg-card hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <span className="text-muted-foreground">{mode.icon}</span>
                      <div>
                        <div className={`font-semibold ${selectedMode === mode.id ? 'text-primary' : 'text-foreground'}`}>{mode.id}</div>
                        <div className="text-xs text-muted-foreground mt-0.5">{mode.desc}</div>
                      </div>
                      <div className={`ml-auto w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                        selectedMode === mode.id ? 'border-primary bg-primary' : 'border-border'
                      }`}>
                        {selectedMode === mode.id && <div className="w-2 h-2 rounded-full bg-white" />}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-5">
              <h2 className="text-2xl font-bold">Consent & Safety</h2>
              <div className="space-y-3 p-4 rounded-xl bg-yellow-500/5 border border-yellow-500/20">
                <div className="flex gap-4">
                  <AlertTriangle className="text-yellow-400 w-6 h-6 shrink-0 mt-0.5" />
                  <div className="text-sm text-muted-foreground space-y-2">
                    <p><span className="text-foreground font-semibold">Not a medical device.</span> PhysioTwin provides estimates and screening signals only — not a clinical diagnosis or validated medical tool.</p>
                    <p><span className="text-foreground font-semibold">Digital wearable sync.</span> Heart rate, HRV, sleep, and SpO₂ data is synced from your smartwatch or fitness band (Google Fit, Garmin, Fitbit, Apple Health) — no custom hardware required.</p>
                    <p><span className="text-foreground font-semibold">On-device AI.</span> Your camera data is processed locally and never uploaded.</p>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setConsented(!consented)}
                className={`w-full text-left p-4 rounded-xl border transition-all duration-200 flex items-center gap-3 ${
                  consented ? 'border-green-500 bg-green-50 shadow-sm text-green-900' : 'border-border bg-card hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                  consented ? 'border-green-500 bg-green-500' : 'border-border'
                }`}>
                  {consented && <Check className="text-white w-4 h-4 font-bold" />}
                </div>
                <span className="text-sm font-semibold">I understand and consent to the above terms</span>
              </button>
            </div>
          )}

          {step === 5 && (
            <div className="space-y-6 text-center">
              <div className="w-20 h-20 mx-auto rounded-full bg-primary flex items-center justify-center shadow-lg text-white">
                <Rocket className="w-10 h-10" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">Initialize Your Twin</h2>
                <p className="text-muted-foreground text-sm mt-2">
                  We'll capture your first baseline session using your camera. A Sit-to-Stand test takes under 60 seconds.
                </p>
              </div>
              <div className="bg-secondary p-4 rounded-xl text-left space-y-2 border border-border">
                <div className="text-xs text-muted-foreground uppercase tracking-widest mb-3">Twin Configuration</div>
                {selectedMode && <div className="flex justify-between text-sm"><span className="text-muted-foreground">Mode</span><span className="font-medium">{selectedMode || 'General Human'}</span></div>}
                {selectedGoals.length > 0 && <div className="flex justify-between text-sm"><span className="text-muted-foreground">Goals</span><span className="font-medium">{selectedGoals.length} selected</span></div>}
                <div className="flex justify-between text-sm"><span className="text-muted-foreground">Sensor</span><span className="badge badge-yellow text-[10px]">Simulated</span></div>
              </div>
              <button
                onClick={() => setLocation('/dashboard')}
                className="btn btn-cyan w-full py-4 text-base"
              >
                Launch Twin Dashboard →
              </button>
            </div>
          )}

          {/* Navigation buttons */}
          <div className="flex gap-3 mt-8">
            {step > 1 && (
              <button onClick={prevStep} className="btn btn-secondary py-3 flex-1">
                ← Back
              </button>
            )}
            {step < 5 && (
              <button
                onClick={nextStep}
                disabled={step === 4 && !consented}
                className="btn btn-primary py-3 flex-1 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {step === 4 ? 'I Agree →' : 'Continue →'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
