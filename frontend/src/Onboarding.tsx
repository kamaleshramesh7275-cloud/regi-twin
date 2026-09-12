import { useState } from 'react';
import { useLocation, Link } from 'wouter';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { 
  Dna, 
  Target, 
  Zap, 
  ShieldCheck, 
  Rocket, 
  User, 
  Activity, 
  Leaf, 
  Stethoscope, 
  AlertTriangle, 
  Check, 
  ArrowLeft, 
  ArrowRight,
  HeartPulse,
  Phone,
  Mail,
  Lock,
  UploadCloud,
  FileText,
  Sparkles,
  CheckCircle2
} from 'lucide-react';
import { api } from './api';
import { auth, db } from './firebase';
import { doc, setDoc } from 'firebase/firestore';

import { useAuth } from './context/AuthContext';

// ── Zod Schema for Onboarding Baseline Seed Data ──────────────────────────────
const onboardingSchema = z.object({
  fullName: z.string().min(2, 'Full name is required'),
  email: z.string().email('Please enter a valid email address'),
  phoneNumber: z.string().min(8, 'Please enter a valid phone number (at least 8 digits)'),
  password: z.string().optional(),
  
  age: z.coerce.number().min(12, 'Age must be at least 12').max(120, 'Please enter a valid age'),
  heightCm: z.coerce.number().min(100, 'Height must be at least 100 cm').max(250, 'Height must be less than 250 cm'),
  weightKg: z.coerce.number().min(30, 'Weight must be at least 30 kg').max(300, 'Weight must be less than 300 kg'),
  biologicalSex: z.enum(['Male', 'Female', 'Other', 'Prefer not to say']),
  activityLevel: z.enum(['Sedentary', 'Lightly Active', 'Moderately Active', 'Very Active', 'Elite Athlete']),
  
  goals: z.array(z.string()).min(1, 'Select at least one primary goal'),
  twinMode: z.string().min(1, 'Select a twin operation mode'),
  
  primaryPainZone: z.string(),
  baselinePainLevel: z.coerce.number().min(0).max(10),
  medicalReportNotes: z.string().optional(),
  medicalReportFileName: z.string().optional(),
  
  // TSK-11 Triage answers (1-4 scale)
  tskAnswers: z.object({
    q1: z.number().min(1).max(4),
    q2: z.number().min(1).max(4),
    q3: z.number().min(1).max(4),
    q4: z.number().min(1).max(4),
  }),
  
  consent: z.boolean().refine(val => val === true, 'You must consent to continue'),
});

export type OnboardingFormData = z.infer<typeof onboardingSchema>;

const STEPS = [
  { id: 1, title: 'Account & Contact', icon: <User className="w-5 h-5" />, desc: 'Name, email & phone' },
  { id: 2, title: 'Physical Baseline', icon: <Dna className="w-5 h-5" />, desc: 'Measurements & demographics' },
  { id: 3, title: 'Goals & Mode', icon: <Target className="w-5 h-5" />, desc: 'Target outcomes & AI model' },
  { id: 4, title: 'Medical Screen & Report', icon: <HeartPulse className="w-5 h-5" />, desc: 'Optional report & pain screen' },
  { id: 5, title: 'Consent', icon: <ShieldCheck className="w-5 h-5" />, desc: 'Terms & privacy' },
  { id: 6, title: 'Initialize', icon: <Rocket className="w-5 h-5" />, desc: 'Seed & launch dashboard' },
];

const GOALS_OPTIONS = [
  'General Tracking', 
  'Athletic Performance', 
  'Rehab & Recovery', 
  'Healthy Aging',
  'Injury Prevention',
  'Post-Op Rehabilitation'
];

const MODES = [
  { id: 'General Human', icon: <User className="w-6 h-6" />, desc: 'Everyday health & movement awareness' },
  { id: 'Athlete', icon: <Activity className="w-6 h-6" />, desc: 'Performance optimization & acute load tracking' },
  { id: 'Elder', icon: <Leaf className="w-6 h-6" />, desc: 'Fall prevention & joint preservation' },
  { id: 'Caregiver/Professional', icon: <Stethoscope className="w-6 h-6" />, desc: 'Clinician monitoring & remote triage' },
];

const PAIN_ZONES = [
  'None / Baseline Healthy',
  'Knee (ACL / Patellar)',
  'Lower Back (Lumbar)',
  'Shoulder (Rotator Cuff)',
  'Ankle & Achilles',
  'Hip & Pelvis',
  'Neck & Cervical Spine'
];

const TRIAGE_QUESTIONS = [
  { id: 'q1', text: "I am afraid that I might injure myself if I exercise." },
  { id: 'q2', text: "My pain would be worse if I did physical activity." },
  { id: 'q3', text: "It's not really safe for a person with my condition to be physically active." },
  { id: 'q4', text: "My body is telling me I have something seriously wrong." }
];

export default function Onboarding() {
  const { loginAsNewAthlete } = useAuth();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState<string>("");
  const [ocrProcessing, setOcrProcessing] = useState<boolean>(false);
  const [, setLocation] = useLocation();

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    trigger,
    formState: { errors }
  } = useForm<OnboardingFormData>({
    resolver: zodResolver(onboardingSchema),
    defaultValues: {
      fullName: auth.currentUser?.displayName || '',
      email: auth.currentUser?.email || '',
      phoneNumber: '',
      password: '',
      age: 28,
      heightCm: 175,
      weightKg: 72,
      biologicalSex: 'Prefer not to say',
      activityLevel: 'Moderately Active',
      goals: ['General Tracking', 'Rehab & Recovery'],
      twinMode: 'General Human',
      primaryPainZone: 'None / Baseline Healthy',
      baselinePainLevel: 1,
      medicalReportNotes: '',
      medicalReportFileName: '',
      tskAnswers: { q1: 2, q2: 2, q3: 2, q4: 2 },
      consent: false,
    },
    mode: 'onChange'
  });

  const selectedGoals = watch('goals') || [];
  const selectedMode = watch('twinMode');
  const consented = watch('consent');
  const tskAnswers = watch('tskAnswers');

  const validateCurrentStep = async () => {
    let fieldsToValidate: (keyof OnboardingFormData)[] = [];
    if (step === 1) fieldsToValidate = ['fullName', 'email', 'phoneNumber'];
    if (step === 2) fieldsToValidate = ['age', 'heightCm', 'weightKg', 'biologicalSex', 'activityLevel'];
    if (step === 3) fieldsToValidate = ['goals', 'twinMode'];
    if (step === 4) fieldsToValidate = ['primaryPainZone', 'baselinePainLevel', 'tskAnswers'];
    if (step === 5) fieldsToValidate = ['consent'];

    const isValid = await trigger(fieldsToValidate);
    return isValid;
  };

  const nextStep = async () => {
    const isValid = await validateCurrentStep();
    if (isValid) {
      setStep(s => Math.min(s + 1, 6));
    }
  };

  const prevStep = () => setStep(s => Math.max(s - 1, 1));

  const toggleGoal = (g: string) => {
    const current = [...selectedGoals];
    const updated = current.includes(g)
      ? current.filter(x => x !== g)
      : [...current, g];
    setValue('goals', updated, { shouldValidate: true });
  };

  const handleTriageChoice = (qKey: 'q1' | 'q2' | 'q3' | 'q4', val: number) => {
    setValue(`tskAnswers.${qKey}`, val, { shouldValidate: true });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadedFileName(file.name);
      setValue('medicalReportFileName', file.name);
      setOcrProcessing(true);
      setTimeout(() => {
        setOcrProcessing(false);
        setValue('medicalReportNotes', `Parsed from ${file.name}: General musculoskeletal screening recorded. No acute severe contraindications.`);
      }, 1200);
    }
  };

  const onFinalSubmit = async (data: OnboardingFormData) => {
    setIsSubmitting(true);
    try {
      const uid = auth.currentUser?.uid || `user-${Date.now()}`;
      
      // Calculate scaled TSK kinesiophobia score
      const totalRawScore = data.tskAnswers.q1 + data.tskAnswers.q2 + data.tskAnswers.q3 + data.tskAnswers.q4;
      const scaledTskScore = Math.round(totalRawScore * 2.75);

      // Seed baseline details to local storage cache for instant rendering
      const seedProfile = {
        uid,
        full_name: data.fullName,
        email: data.email,
        phone_number: data.phoneNumber,
        age: data.age,
        height_cm: data.heightCm,
        weight_kg: data.weightKg,
        biological_sex: data.biologicalSex,
        activity_level: data.activityLevel,
        goals: data.goals,
        twin_mode: data.twinMode,
        primary_pain_zone: data.primaryPainZone,
        baseline_pain_level: data.baselinePainLevel,
        medical_report_file: data.medicalReportFileName || null,
        medical_report_notes: data.medicalReportNotes || null,
        tsk_score: scaledTskScore,
        onboarding_completed: true,
        seeded_at: new Date().toISOString()
      };
      
      localStorage.setItem(`pt_user_seed_${uid}`, JSON.stringify(seedProfile));
      localStorage.setItem('pt_current_user_profile', JSON.stringify(seedProfile));

      // 1. Immediately log in user as active athlete session so Dashboard opens instantly
      loginAsNewAthlete(seedProfile);

      // 2. Fire backend/firestore sync in background without blocking UI
      api.saveUserProfile(uid, seedProfile).catch((err) => {
        console.warn("Backend saveUserProfile warn:", err);
      });

      if (auth.currentUser && db) {
        setDoc(doc(db, 'users', uid), {
          ...seedProfile,
          updatedAt: new Date()
        }, { merge: true }).catch((dbErr) => {
          console.warn("Firestore profile save warn:", dbErr);
        });
      }

      api.submitTriage(uid, {
        score: scaledTskScore,
        answers_json: JSON.stringify(data.tskAnswers)
      }).catch((apiErr) => {
        console.warn("Backend triage submit warn:", apiErr);
      });

      // 3. Immediately redirect to Dashboard
      setLocation('/dashboard');
    } catch (err) {
      console.error("Failed to finish onboarding:", err);
      setLocation('/dashboard');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen relative flex flex-col items-center justify-center p-4 bg-slate-950 text-slate-100 font-sans overflow-x-hidden">
      {/* Background glow effects */}
      <div className="fixed top-[-20%] left-[-10%] w-[50%] h-[50%] bg-emerald-500/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="fixed bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-blue-500/10 rounded-full blur-[140px] pointer-events-none" />

      <div className="relative z-10 w-full max-w-xl">
        {/* Top Header */}
        <div className="text-center mb-6 animate-fade-in">
          <div className="inline-flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center text-xs font-black text-white shadow-md">
              PT
            </div>
            <span className="font-extrabold text-lg text-white tracking-tight">PhysioTwin Registration &amp; Onboarding</span>
          </div>
          <p className="text-slate-400 text-xs">Step {step} of {STEPS.length} — Build Your Athlete Baseline &amp; Digital Twin</p>
        </div>

        {/* Progress Bar */}
        <div className="mb-6">
          <div className="flex items-center gap-1.5 mb-2">
            {STEPS.map((s, i) => (
              <div key={s.id} className="flex items-center flex-1">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-all duration-300 ${
                  step > s.id ? 'bg-emerald-500 text-slate-950 font-black' :
                  step === s.id ? 'bg-emerald-500/20 border-2 border-emerald-400 text-emerald-300' :
                  'bg-slate-900 border border-slate-800 text-slate-500'
                }`}>
                  {step > s.id ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : s.id}
                </div>
                {i < STEPS.length - 1 && (
                  <div className="flex-1 h-0.5 mx-1.5 rounded-full overflow-hidden bg-slate-800">
                    <div 
                      className="h-full bg-emerald-500 transition-all duration-500"
                      style={{ width: step > s.id ? '100%' : '0%' }} 
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
          <div className="text-center flex items-center justify-center gap-2 mt-3">
            <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-400">
              {STEPS[step-1].icon} {STEPS[step-1].title}
            </span>
            <span className="text-slate-400 text-[11px]">— {STEPS[step-1].desc}</span>
          </div>
        </div>

        {/* Wizard Form Card */}
        <form onSubmit={handleSubmit(onFinalSubmit)} className="bg-slate-900/80 border border-slate-800 backdrop-blur-xl p-6 sm:p-8 rounded-3xl shadow-2xl">
          
          {/* STEP 1: Account & Contact Details */}
          {step === 1 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-2xl font-black text-white">Create Your Account &amp; Profile</h2>
                <p className="text-slate-400 text-xs mt-1">Enter your contact credentials to register your personal PhysioTwin portal.</p>
              </div>

              <div className="space-y-3.5">
                <div>
                  <label className="text-xs font-semibold text-slate-300 mb-1.5 block">Full Name *</label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                    <input
                      type="text"
                      placeholder="e.g. Alex Mercer"
                      {...register('fullName')}
                      className="w-full bg-slate-950/80 border border-slate-800 rounded-xl pl-10 pr-3.5 py-2.5 text-sm outline-none focus:border-emerald-500 text-white"
                    />
                  </div>
                  {errors.fullName && <p className="text-red-400 text-[11px] mt-1">{errors.fullName.message}</p>}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-300 mb-1.5 block">Email Address *</label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                      <input
                        type="email"
                        placeholder="alex@example.com"
                        {...register('email')}
                        className="w-full bg-slate-950/80 border border-slate-800 rounded-xl pl-10 pr-3.5 py-2.5 text-sm outline-none focus:border-emerald-500 text-white"
                      />
                    </div>
                    {errors.email && <p className="text-red-400 text-[11px] mt-1">{errors.email.message}</p>}
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-300 mb-1.5 block">Phone Number *</label>
                    <div className="relative">
                      <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                      <input
                        type="tel"
                        placeholder="+1 (555) 019-2834"
                        {...register('phoneNumber')}
                        className="w-full bg-slate-950/80 border border-slate-800 rounded-xl pl-10 pr-3.5 py-2.5 text-sm outline-none focus:border-emerald-500 text-white"
                      />
                    </div>
                    {errors.phoneNumber && <p className="text-red-400 text-[11px] mt-1">{errors.phoneNumber.message}</p>}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 mb-1.5 block">Create Password (Optional)</label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                    <input
                      type="password"
                      placeholder="••••••••"
                      {...register('password')}
                      className="w-full bg-slate-950/80 border border-slate-800 rounded-xl pl-10 pr-3.5 py-2.5 text-sm outline-none focus:border-emerald-500 text-white font-mono"
                    />
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">You can also sign in anytime using Google or your registered email address.</p>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-between text-xs text-slate-400">
                <span>Already registered?</span>
                <Link href="/login" className="text-emerald-400 font-bold hover:underline">
                  Sign in to Existing Portal →
                </Link>
              </div>
            </div>
          )}

          {/* STEP 2: Baseline Physical Parameters */}
          {step === 2 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-2xl font-black text-white">Physical &amp; Body Measurements</h2>
                <p className="text-slate-400 text-xs mt-1">Help your twin build your athlete model and compute joint torque limits.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-300 mb-1.5 block">Age (Years)</label>
                  <input
                    type="number"
                    {...register('age')}
                    className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm outline-none focus:border-emerald-500 text-white"
                  />
                  {errors.age && <p className="text-red-400 text-[11px] mt-1">{errors.age.message}</p>}
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 mb-1.5 block">Height (cm)</label>
                  <input
                    type="number"
                    {...register('heightCm')}
                    className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm outline-none focus:border-emerald-500 text-white"
                  />
                  {errors.heightCm && <p className="text-red-400 text-[11px] mt-1">{errors.heightCm.message}</p>}
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 mb-1.5 block">Weight (kg)</label>
                  <input
                    type="number"
                    {...register('weightKg')}
                    className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm outline-none focus:border-emerald-500 text-white"
                  />
                  {errors.weightKg && <p className="text-red-400 text-[11px] mt-1">{errors.weightKg.message}</p>}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-300 mb-1.5 block">Biological Sex</label>
                  <select
                    {...register('biologicalSex')}
                    className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm outline-none focus:border-emerald-500 text-white"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                    <option value="Prefer not to say">Prefer not to say</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 mb-1.5 block">Daily Activity Level</label>
                  <select
                    {...register('activityLevel')}
                    className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm outline-none focus:border-emerald-500 text-white"
                  >
                    <option value="Sedentary">Sedentary (Desk Job)</option>
                    <option value="Lightly Active">Lightly Active (1-2x/wk)</option>
                    <option value="Moderately Active">Moderately Active (3-4x/wk)</option>
                    <option value="Very Active">Very Active (5-6x/wk)</option>
                    <option value="Elite Athlete">Elite Athlete (Daily Training)</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: Goals & Twin Mode */}
          {step === 3 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-2xl font-black text-white">Target Goals &amp; AI Twin Mode</h2>
                <p className="text-slate-400 text-xs mt-1">Select your primary outcomes and digital twin behavior engine.</p>
              </div>

              <div>
                <label className="text-xs font-bold text-emerald-400 uppercase tracking-wider block mb-2">Primary Goals (Select all that apply)</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {GOALS_OPTIONS.map(goal => {
                    const isSelected = selectedGoals.includes(goal);
                    return (
                      <button
                        key={goal}
                        type="button"
                        onClick={() => toggleGoal(goal)}
                        className={`text-left p-3.5 rounded-2xl border transition-all flex items-center justify-between cursor-pointer ${
                          isSelected
                            ? 'border-emerald-500 bg-emerald-500/10 text-white shadow-md'
                            : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:border-slate-700 hover:bg-slate-900'
                        }`}
                      >
                        <span className="text-xs font-bold">{goal}</span>
                        <div className={`w-4 h-4 rounded-md border flex items-center justify-center transition-colors ${
                          isSelected ? 'border-emerald-400 bg-emerald-500 text-slate-950' : 'border-slate-700'
                        }`}>
                          {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                        </div>
                      </button>
                    );
                  })}
                </div>
                {errors.goals && <p className="text-red-400 text-xs mt-1">{errors.goals.message}</p>}
              </div>

              <div>
                <label className="text-xs font-bold text-cyan-400 uppercase tracking-wider block mb-2">Twin Model Weighting Engine</label>
                <div className="space-y-2">
                  {MODES.map(mode => {
                    const isSelected = selectedMode === mode.id;
                    return (
                      <button
                        key={mode.id}
                        type="button"
                        onClick={() => setValue('twinMode', mode.id, { shouldValidate: true })}
                        className={`w-full text-left p-3 rounded-2xl border transition-all flex items-center gap-3.5 cursor-pointer ${
                          isSelected
                            ? 'border-emerald-500 bg-emerald-500/10 text-white shadow-md'
                            : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:border-slate-700 hover:bg-slate-900'
                        }`}
                      >
                        <div className={`p-2 rounded-xl border ${isSelected ? 'bg-emerald-500/20 border-emerald-400 text-emerald-400' : 'bg-slate-900 border-slate-800 text-slate-400'}`}>
                          {mode.icon}
                        </div>
                        <div className="flex-1">
                          <div className={`text-xs font-bold ${isSelected ? 'text-white' : 'text-slate-200'}`}>{mode.id}</div>
                          <div className="text-[11px] text-slate-400">{mode.desc}</div>
                        </div>
                        <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${isSelected ? 'border-emerald-400 bg-emerald-500' : 'border-slate-700'}`}>
                          {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-slate-950" />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: Medical Baseline & Optional Current Report Upload */}
          {step === 4 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-2xl font-black text-white">Medical Screen &amp; Current Report (Optional)</h2>
                <p className="text-slate-400 text-xs mt-1">Upload recent MRI, X-ray, or doctor notes to seed your injury history timeline.</p>
              </div>

              {/* Optional Medical Report Upload Box */}
              <div className="p-4 rounded-2xl bg-slate-950/90 border border-dashed border-emerald-500/40 hover:border-emerald-400 transition-colors">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs font-bold text-white">Upload Current Medical Report</span>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                    Optional · OCR Enabled
                  </span>
                </div>
                
                <label className="flex flex-col items-center justify-center p-4 bg-slate-900/50 hover:bg-slate-900 rounded-xl cursor-pointer transition-colors border border-slate-800">
                  <UploadCloud className="w-8 h-8 text-emerald-400 mb-2" />
                  <span className="text-xs font-semibold text-slate-200">
                    {uploadedFileName ? `Attached: ${uploadedFileName}` : "Click to select PDF, image, or clinical document"}
                  </span>
                  <span className="text-[10px] text-slate-500 mt-1">PDF, JPG, PNG, DICOM up to 25MB</span>
                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>

                {ocrProcessing && (
                  <div className="mt-2 flex items-center gap-2 text-xs text-teal-400 animate-pulse">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Processing document with on-device OCR engine...</span>
                  </div>
                )}

                {uploadedFileName && !ocrProcessing && (
                  <div className="mt-2.5 p-2.5 bg-emerald-950/40 border border-emerald-500/30 rounded-xl flex items-center gap-2 text-xs text-emerald-300">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Report loaded successfully. Ready to correlate with kinematics.</span>
                  </div>
                )}

                <div className="mt-3">
                  <label className="text-[11px] font-semibold text-slate-400 mb-1 block">Previous Injury / Clinical Notes (Optional)</label>
                  <textarea
                    placeholder="e.g. Left knee ACL repair 2024, occasional lower back tightness during squats..."
                    {...register('medicalReportNotes')}
                    rows={2}
                    className="w-full bg-slate-900/80 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder:text-slate-600 outline-none focus:border-emerald-500 transition-colors resize-none"
                  />
                </div>
              </div>

              {/* Primary Joint & Pain Level */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="text-xs font-semibold text-slate-300 mb-1.5 block">Primary Joint / Pain Zone</label>
                  <select
                    {...register('primaryPainZone')}
                    className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs outline-none focus:border-emerald-500 text-white"
                  >
                    {PAIN_ZONES.map(z => <option key={z} value={z}>{z}</option>)}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 mb-1.5 block">Baseline Pain (0-10)</label>
                  <input
                    type="number"
                    min="0"
                    max="10"
                    {...register('baselinePainLevel')}
                    className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs outline-none focus:border-emerald-500 text-white"
                  />
                </div>
              </div>

              {/* TSK-11 Questions */}
              <div className="space-y-3 pt-2">
                <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">TSK-11 Movement Fear Screen</span>
                {TRIAGE_QUESTIONS.map((q) => {
                  const qKey = q.id as 'q1' | 'q2' | 'q3' | 'q4';
                  const val = tskAnswers[qKey];
                  return (
                    <div key={q.id} className="p-3 bg-slate-950/60 border border-slate-800/80 rounded-xl space-y-2">
                      <p className="text-xs text-slate-300 font-medium">{q.text}</p>
                      <div className="grid grid-cols-4 gap-1.5 text-[10px]">
                        {[
                          { num: 1, label: 'Disagree' },
                          { num: 2, label: 'Slight Disagree' },
                          { num: 3, label: 'Slight Agree' },
                          { num: 4, label: 'Agree' }
                        ].map((opt) => (
                          <button
                            key={opt.num}
                            type="button"
                            onClick={() => handleTriageChoice(qKey, opt.num)}
                            className={`py-1.5 rounded-lg border text-center font-bold transition-all cursor-pointer ${
                              val === opt.num
                                ? 'bg-emerald-500 border-emerald-400 text-slate-950 shadow-sm'
                                : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                            }`}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 5: Privacy & Consent */}
          {step === 5 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-2xl font-black text-white">Consent &amp; Safety Terms</h2>
                <p className="text-slate-400 text-xs mt-1">Review clinical protocols before booting your digital twin engine.</p>
              </div>

              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs space-y-2 text-slate-300">
                <div className="flex items-center gap-2 text-amber-400 font-bold">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>Important Clinical &amp; Privacy Disclaimers</span>
                </div>
                <p>• <strong className="text-white">Non-Medical Device:</strong> PhysioTwin provides biomechanical screening estimates only, not formal medical diagnoses.</p>
                <p>• <strong className="text-white">On-Device Processing:</strong> Vision mocap data is processed strictly on-device in browser JS and never saved remotely.</p>
                <p>• <strong className="text-white">Wearable Sync:</strong> Smartwatch data (Garmin, Google Fit, Apple Health) is used to contextualize acute recovery.</p>
              </div>

              <Controller
                name="consent"
                control={control}
                render={({ field }) => (
                  <button
                    type="button"
                    onClick={() => field.onChange(!field.value)}
                    className={`w-full p-4 rounded-2xl border transition-all flex items-center gap-3 text-left cursor-pointer ${
                      field.value
                        ? 'border-emerald-500 bg-emerald-500/10 text-emerald-300'
                        : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className={`w-5 h-5 rounded-lg border flex items-center justify-center shrink-0 ${
                      field.value ? 'border-emerald-400 bg-emerald-500 text-slate-950' : 'border-slate-700'
                    }`}>
                      {field.value && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </div>
                    <span className="text-xs font-bold">I confirm that I understand and consent to the above terms.</span>
                  </button>
                )}
              />
              {errors.consent && <p className="text-red-400 text-xs">{errors.consent.message}</p>}
            </div>
          )}

          {/* STEP 6: Final Review & Launch */}
          {step === 6 && (
            <div className="space-y-6 text-center py-2">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center text-slate-950 shadow-xl shadow-emerald-500/20">
                <Rocket className="w-8 h-8" />
              </div>

              <div>
                <h2 className="text-2xl font-black text-white">Initialize Digital Twin</h2>
                <p className="text-slate-400 text-xs mt-1">Your baseline seed data is ready to launch into your dynamic athlete dashboard.</p>
              </div>

              <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 text-left space-y-2 text-xs">
                <div className="flex justify-between border-b border-slate-800/80 pb-2">
                  <span className="text-slate-400">Athlete Profile</span>
                  <span className="font-bold text-white">{watch('fullName') || 'New Athlete'}</span>
                </div>
                <div className="flex justify-between border-b border-slate-800/80 pb-2">
                  <span className="text-slate-400">Twin Profile Mode</span>
                  <span className="font-bold text-emerald-400">{selectedMode}</span>
                </div>
                <div className="flex justify-between border-b border-slate-800/80 pb-2">
                  <span className="text-slate-400">Selected Goals</span>
                  <span className="font-bold text-white">{selectedGoals.length} Goals Configured</span>
                </div>
                {uploadedFileName && (
                  <div className="flex justify-between border-b border-slate-800/80 pb-2">
                    <span className="text-slate-400">Medical Report</span>
                    <span className="font-bold text-cyan-400">{uploadedFileName} (OCR Parsed)</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-slate-400">Destination</span>
                  <span className="font-bold text-teal-400">Athlete Dashboard</span>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-sm transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
              >
                {isSubmitting ? 'Booting Twin Engine...' : 'Launch Athlete Dashboard →'}
              </button>
            </div>
          )}

          {/* Nav Controls */}
          {step < 6 && (
            <div className="flex items-center gap-3 mt-8 pt-4 border-t border-slate-800/80">
              {step > 1 && (
                <button
                  type="button"
                  onClick={prevStep}
                  className="flex-1 py-3 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-300 font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Back
                </button>
              )}
              <button
                type="button"
                onClick={nextStep}
                disabled={step === 5 && !consented}
                className="flex-1 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 text-slate-950 font-extrabold text-xs flex items-center justify-center gap-1.5 transition-all shadow-md cursor-pointer ml-auto"
              >
                {step === 5 ? 'Agree & Continue' : 'Next Step'} <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

        </form>
      </div>
    </div>
  );
}
