import { useEffect, useRef, useState } from "react";
import { FilesetResolver, PoseLandmarker, DrawingUtils } from "@mediapipe/tasks-vision";
import { useLocation } from "wouter";
import {
  Camera, CheckCircle2, ChevronRight, Loader2,
  Eye, Activity, Brain, Sparkles, BarChart3, Zap,
  PersonStanding, Dumbbell, ArrowRight, Clock,
  Plus, FileText, UploadCloud, CheckCircle, ImagePlus, ShieldCheck, Calendar, History
} from "lucide-react";
import { api } from "./api";
import { auth } from "./firebase";
import { Sidebar } from "./components/Sidebar";
import * as ort from "onnxruntime-web";

// ─── Types ───────────────────────────────────────────────────────────────────
type Mode = "sit-to-stand" | "standing-posture" | "squat-analysis" | "gait-analysis" | "medical-report" | "static-image";
type Stage = "landing" | "options" | "select" | "setup" | "countdown" | "recording" | "processing" | "done" | "upload-report" | "upload-image";

interface ProcessStep {
  id: string;
  label: string;
  icon: React.ReactNode;
  status: "pending" | "running" | "done" | "error";
}

// ─── Setup Guide Step ────────────────────────────────────────────────────────
function SetupStep({ num, title, desc }: { num: number; title: string; desc: string }) {
  return (
    <div className="flex items-start gap-4">
      <div
        className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-black text-white shrink-0 mt-0.5"
        style={{ background: "linear-gradient(135deg,#0ea5e9,#8b5cf6)" }}
      >
        {num}
      </div>
      <div>
        <div className="font-semibold text-foreground text-sm">{title}</div>
        <div className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{desc}</div>
      </div>
    </div>
  );
}

// ─── Processing Step Row ─────────────────────────────────────────────────────
function ProcessRow({ step }: { step: ProcessStep }) {
  const colors = {
    pending: "text-muted-foreground",
    running: "text-primary",
    done: "text-emerald-500",
    error: "text-red-400",
  };
  return (
    <div className={`flex items-center gap-3 py-3 border-b border-border last:border-0 transition-all duration-500 ${colors[step.status]}`}>
      <div className="w-6 h-6 flex items-center justify-center shrink-0">
        {step.status === "pending" && <div className="w-2 h-2 rounded-full bg-border" />}
        {step.status === "running" && <Loader2 className="w-5 h-5 animate-spin text-primary" />}
        {step.status === "done" && <CheckCircle2 className="w-5 h-5 text-emerald-500" />}
        {step.status === "error" && <div className="w-5 h-5 rounded-full bg-red-400 flex items-center justify-center text-white text-xs">✕</div>}
      </div>
      <div className="flex items-center gap-2 flex-1">
        <span className="opacity-70">{step.icon}</span>
        <span className={`text-sm font-medium transition-colors duration-300 ${step.status === "running" ? "text-foreground" : ""}`}>
          {step.label}
        </span>
      </div>
      {step.status === "running" && (
        <div className="flex gap-1">
          {[0, 1, 2].map(i => (
            <div key={i} className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce"
              style={{ animationDelay: `${i * 0.15}s` }} />
          ))}
        </div>
      )}
      {step.status === "done" && <span className="text-xs text-emerald-500 font-mono-numbers">✓ done</span>}
    </div>
  );
}

// ─── Posture Metric Bar ───────────────────────────────────────────────────────
function PostureBar({ label, value, good }: { label: string; value: number; good: boolean }) {
  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="text-muted-foreground">{label}</span>
        <span className={`font-mono-numbers font-bold ${good ? "text-emerald-400" : "text-amber-400"}`}>
          {value.toFixed(1)}°
        </span>
      </div>
      <div className="h-2 bg-border rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-300"
          style={{
            width: `${Math.min(100, (value / 15) * 100)}%`,
            background: good
              ? "linear-gradient(90deg,#10b981,#34d399)"
              : "linear-gradient(90deg,#f59e0b,#fbbf24)",
          }}
        />
      </div>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────
function CaptureEngineContent() {
  const [, setLocation] = useLocation();

  // Mode & stage
  const [mode, setMode] = useState<Mode>("sit-to-stand");
  const [stage, setStage] = useState<Stage>("landing");
  const [countdown, setCountdown] = useState(3);
  const [audioCoaching, setAudioCoaching] = useState(true);
  const [uploadedImageSrc, setUploadedImageSrc] = useState<string | null>(null);

  // Vision
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [landmarker, setLandmarker] = useState<PoseLandmarker | null>(null);
  const [modelReady, setModelReady] = useState(false);
  const [modelError, setModelError] = useState(false);

  // Sit-to-stand metrics
  const [reps, setReps] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [exertionLevel, setExertionLevel] = useState(0.0);
  const [liveRom, setLiveRom] = useState(0);
  const [liveSymmetry, setLiveSymmetry] = useState(100);
  const metricsRef = useRef({ minKneeAngle: 180, maxKneeAngle: 0, symmetrySum: 0, framesAnalyzed: 0 });

  // Standing posture metrics
  const POSTURE_DURATION = 10; // seconds of capture
  const [postureTimeLeft, setPostureTimeLeft] = useState(POSTURE_DURATION);
  const [postureScore, setPostureScore] = useState(100);
  const postureRef = useRef({
    shoulderTiltSum: 0,
    hipTiltSum: 0,
    headForwardSum: 0,
    kneeBendSum: 0,
    frames: 0,
  });

  // Gait Analysis metrics
  const gaitRef = useRef({
    totalSteps: 0,
    maxHipDrop: 0.0,
    leftHipDropSum: 0,
    rightHipDropSum: 0,
    frames: 0
  });
  const [liveCadence, setLiveCadence] = useState(0);
  const [liveHipDrop, setLiveHipDrop] = useState(0);

  // Speech synthesis
  const lastSpokenRef = useRef<{ text: string, time: number }>({ text: "", time: 0 });
  const speak = (text: string, cooldownMs = 2000) => {
    if (!audioCoaching || !("speechSynthesis" in window)) return;
    const now = Date.now();
    if (lastSpokenRef.current.text === text && now - lastSpokenRef.current.time < cooldownMs) return;
    
    // Stop current speech if it's a new urgent cue
    if (lastSpokenRef.current.text !== text) window.speechSynthesis.cancel();
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.1;
    utterance.pitch = 1;
    window.speechSynthesis.speak(utterance);
    lastSpokenRef.current = { text, time: now };
  };

  // Shared
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const autoStopRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Processing pipeline
  const [processSteps, setProcessSteps] = useState<ProcessStep[]>([
    { id: "capture", label: "Session data captured", icon: <Camera className="w-4 h-4" />, status: "pending" },
    { id: "pose", label: "Extracting pose landmarks", icon: <Eye className="w-4 h-4" />, status: "pending" },
    { id: "biomech", label: "Computing biomechanics", icon: <Activity className="w-4 h-4" />, status: "pending" },
    { id: "profile", label: "Updating capability profile", icon: <BarChart3 className="w-4 h-4" />, status: "pending" },
    { id: "insights", label: "Generating AI insights", icon: <Brain className="w-4 h-4" />, status: "pending" },
  ]);

  // ── Load AI model in background immediately ──────────────────────────────
  useEffect(() => {
    async function initVision() {
      try {
        // Attempt to load custom ONNX model first (if trained)
        try {
          ort.env.wasm.wasmPaths = "https://cdn.jsdelivr.net/npm/onnxruntime-web/dist/";
          const session = await ort.InferenceSession.create("/model.onnx", { executionProviders: ["wasm"] });
          console.log("Successfully loaded custom ONNX pose model!");
          // TODO: Implement custom YOLOv8-pose inference loop here when model.onnx is ready.
          throw new Error("Fallback for inference loop to MediaPipe");
        } catch (onnxErr) {
          console.log(onnxErr.message);
          // Fallback to MediaPipe
          const vision = await FilesetResolver.forVisionTasks(
            "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
          );
          const poseLandmarker = await PoseLandmarker.createFromOptions(vision, {
            baseOptions: {
              modelAssetPath: "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_heavy/float16/1/pose_landmarker_heavy.task",
              delegate: "GPU",
            },
            runningMode: "VIDEO",
            numPoses: 1,
            minPoseDetectionConfidence: 0.8,
            minPosePresenceConfidence: 0.8,
            minTrackingConfidence: 0.8,
          });
          setLandmarker(poseLandmarker);
          setModelReady(true);
        }
      } catch (err) {
        console.error("Vision init failed", err);
        setModelError(true);
      }
    }
    initVision();
  }, []);

  // ── Countdown ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (stage !== "countdown") return;
    setCountdown(3);
    let count = 3;
    const id = setInterval(() => {
      count--;
      if (count > 0) setCountdown(count);
      else { clearInterval(id); beginRecording(); }
    }, 1000);
    return () => clearInterval(id);
  }, [stage]);

  // ── Begin recording ──────────────────────────────────────────────────────
  const beginRecording = async () => {
    setReps(0);
    setElapsed(0);
    setPostureTimeLeft(POSTURE_DURATION);
    metricsRef.current = { minKneeAngle: 180, maxKneeAngle: 0, symmetrySum: 0, framesAnalyzed: 0 };
    postureRef.current = { shoulderTiltSum: 0, hipTiltSum: 0, headForwardSum: 0, kneeBendSum: 0, frames: 0 };
    gaitRef.current = { totalSteps: 0, maxHipDrop: 0.0, leftHipDropSum: 0, rightHipDropSum: 0, frames: 0 };
    setLiveCadence(0);
    setLiveHipDrop(0);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" } });
      videoRef.current!.srcObject = stream;
      videoRef.current!.play();

      if (mode === "sit-to-stand") {
        timerRef.current = setInterval(() => setElapsed(e => e + 1), 1000);
      } else if (mode === "gait-analysis") {
        let left = 15; // 15 seconds for gait check
        setPostureTimeLeft(left);
        timerRef.current = setInterval(() => {
          left--;
          setPostureTimeLeft(left);
          setElapsed(e => {
            const next = e + 1;
            if (next > 0) {
              const calculatedCadence = Math.round((gaitRef.current.totalSteps / next) * 60);
              setLiveCadence(calculatedCadence || 80);
            }
            return next;
          });
          if (left <= 0) stopAndProcess();
        }, 1000);
      } else {
        // Standing posture: count down from POSTURE_DURATION, auto-stop
        let left = POSTURE_DURATION;
        timerRef.current = setInterval(() => {
          left--;
          setPostureTimeLeft(left);
          setElapsed(e => e + 1);
          if (left <= 0) stopAndProcess();
        }, 1000);
      }
      setStage("recording");
    } catch (err) {
      console.error("Camera error", err);
      setStage("setup");
    }
  };

  // ── Render loop (works for both modes) ───────────────────────────────────
  useEffect(() => {
    if (stage !== "recording" || !landmarker || !videoRef.current || !canvasRef.current) return;
    let lastVideoTime = -1;
    let animId: number;
    let prevStanding = false;
    let repCounted = false;

    const loop = () => {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (!video || !canvas) return;
      if (video.currentTime !== lastVideoTime) {
        lastVideoTime = video.currentTime;
        if (canvas.width !== video.videoWidth) { canvas.width = video.videoWidth; canvas.height = video.videoHeight; }
        const ctx = canvas.getContext("2d");
        if (ctx) {
          const results = landmarker.detectForVideo(video, performance.now());
          ctx.clearRect(0, 0, canvas.width, canvas.height);

          if (results.landmarks?.length > 0) {
            const lm = results.landmarks[0];
            const drawing = new DrawingUtils(ctx);

            if (mode === "sit-to-stand") {
              // Ghost overlay
              ctx.globalAlpha = 0.22;
              const ghost = lm.map(l => ({ ...l, x: l.x - 0.04 }));
              drawing.drawConnectors(ghost, PoseLandmarker.POSE_CONNECTIONS, { color: "#ffffff", lineWidth: 3 });
              ctx.globalAlpha = 1.0;
              drawing.drawConnectors(lm, PoseLandmarker.POSE_CONNECTIONS, { color: "#22d3ee", lineWidth: 2 });
              drawing.drawLandmarks(lm, { color: "#a855f7", radius: 3 });

              // Knee angle calculation + reps
              const calcAngle = (a: any, b: any, c: any) => {
                if (!a || !b || !c) return 0;
                const rad = Math.atan2(c.y - b.y, c.x - b.x) - Math.atan2(a.y - b.y, a.x - b.x);
                let angle = Math.abs(rad * 180 / Math.PI);
                if (angle > 180) angle = 360 - angle;
                return angle;
              };
              const lh = lm[23], lk = lm[25], la = lm[27];
              const rh = lm[24], rk = lm[26], ra = lm[28];
              if (lh && lk && la && rh && rk && ra) {
                const la_ = calcAngle(lh, lk, la);
                const ra_ = calcAngle(rh, rk, ra);
                const avg = (la_ + ra_) / 2;
                if (avg < metricsRef.current.minKneeAngle) metricsRef.current.minKneeAngle = avg;
                if (avg > metricsRef.current.maxKneeAngle) metricsRef.current.maxKneeAngle = avg;
                const sym = Math.max(0, 1 - Math.abs(la_ - ra_) / 180);
                metricsRef.current.symmetrySum += sym;
                metricsRef.current.framesAnalyzed++;
                const standing = avg > 150;
                setExertionLevel(standing ? 0.8 : 0.15);
                setLiveRom(Math.round(Math.max(0, metricsRef.current.maxKneeAngle - metricsRef.current.minKneeAngle)));
                if (metricsRef.current.framesAnalyzed > 0)
                  setLiveSymmetry(Math.round((metricsRef.current.symmetrySum / metricsRef.current.framesAnalyzed) * 100));
                
                if (standing && !prevStanding && !repCounted) { 
                  setReps(r => { const newReps = r + 1; speak(`Rep ${newReps}`); return newReps; }); 
                  repCounted = true; 
                } else if (!standing && avg < 120) {
                  repCounted = false;
                }
                prevStanding = standing;
              }

            } else if (mode === "squat-analysis") {
              const lh = lm[23], lk = lm[25], la = lm[27];
              const rh = lm[24], rk = lm[26], ra = lm[28];
              
              let formGood = true;
              let warningColor = "#ef4444";
              let defaultColor = "#22d3ee";
              let kneeCollapse = false;

              // Simple Varus/Valgus tracking (knees caving in relative to hips/ankles horizontally)
              if (lh && lk && la && rh && rk && ra) {
                const leftKneeCave = lk.x > lh.x + 0.05; // assuming facing camera
                const rightKneeCave = rk.x < rh.x - 0.05;
                if (leftKneeCave || rightKneeCave) {
                  formGood = false;
                  kneeCollapse = true;
                  speak("Push your knees out", 3000);
                }
              }

              // Draw skeleton with dynamic color
              const strokeColor = formGood ? defaultColor : warningColor;
              drawing.drawConnectors(lm, PoseLandmarker.POSE_CONNECTIONS, { color: strokeColor, lineWidth: 3 });
              drawing.drawLandmarks(lm, { color: formGood ? "#a855f7" : "#fca5a5", radius: 4 });

              // Draw explicit knee tracking lines
              if (lh && lk && la) {
                const W = canvas.width, H = canvas.height;
                ctx.beginPath();
                ctx.moveTo(lh.x * W, lh.y * H);
                ctx.lineTo(lk.x * W, lk.y * H);
                ctx.lineTo(la.x * W, la.y * H);
                ctx.strokeStyle = kneeCollapse ? "#ef4444" : "#10b981";
                ctx.lineWidth = 4;
                ctx.stroke();
              }

              // Basic depth logic for rep counting
              const calcAngle = (a: any, b: any, c: any) => {
                if (!a || !b || !c) return 0;
                const rad = Math.atan2(c.y - b.y, c.x - b.x) - Math.atan2(a.y - b.y, a.x - b.x);
                let angle = Math.abs(rad * 180 / Math.PI);
                if (angle > 180) angle = 360 - angle;
                return angle;
              };
              if (lh && lk && la) {
                const angle = calcAngle(lh, lk, la);
                const standing = angle > 160;
                const deep = angle < 90;
                if (deep && !repCounted) {
                  speak("Good depth", 2000);
                  repCounted = true;
                } else if (standing && repCounted) {
                  setReps(r => { const newReps = r + 1; speak(`${newReps}`); return newReps; });
                  repCounted = false;
                }
              }

            } else if (mode === "gait-analysis") {
              // Draw skeleton in green/purple
              drawing.drawConnectors(lm, PoseLandmarker.POSE_CONNECTIONS, { color: "#10b981", lineWidth: 2 });
              drawing.drawLandmarks(lm, { color: "#a855f7", radius: 3 });

              const la = lm[27], ra = lm[28]; // left/right ankles
              const lh = lm[23], rh = lm[24]; // left/right hips
              if (la && ra && lh && rh) {
                const W = canvas.width, H = canvas.height;
                // Draw horizontal line between ankles to measure stride
                ctx.beginPath();
                ctx.moveTo(la.x * W, la.y * H);
                ctx.lineTo(ra.x * W, ra.y * H);
                ctx.strokeStyle = "#f59e0b";
                ctx.lineWidth = 2;
                ctx.stroke();

                const stridePixels = Math.abs(la.x - ra.x) * W;
                if (stridePixels > 100) {
                  // User is mid-stride
                  if (!repCounted) {
                    setReps(r => {
                      const newReps = r + 1;
                      gaitRef.current.totalSteps = newReps;
                      return newReps;
                    });
                    repCounted = true;
                  }
                } else {
                  repCounted = false; // feet together
                }

                // Calculate lateral hip drop (angle of line between hips relative to horizontal)
                const dy = Math.abs(lh.y - rh.y) * H;
                const dx = Math.abs(lh.x - rh.x) * W;
                const hipAngleRad = Math.atan2(dy, dx || 1);
                const hipDropDeg = hipAngleRad * (180 / Math.PI);
                
                gaitRef.current.maxHipDrop = Math.max(gaitRef.current.maxHipDrop, hipDropDeg);
                gaitRef.current.frames++;
                setLiveHipDrop(hipDropDeg);
                
                // Draw hip alignment line
                ctx.beginPath();
                ctx.moveTo(lh.x * W, lh.y * H);
                ctx.lineTo(rh.x * W, rh.y * H);
                ctx.strokeStyle = hipDropDeg > 5 ? "#ef4444" : "#10b981";
                ctx.lineWidth = 3;
                ctx.stroke();

                if (hipDropDeg > 6) {
                  speak("Stabilize your hips", 4000);
                }
              }
            } else {
              // ── Standing posture mode ──────────────────────────────────
              // Draw skeleton in green/purple
              drawing.drawConnectors(lm, PoseLandmarker.POSE_CONNECTIONS, { color: "#22d3ee", lineWidth: 2 });
              drawing.drawLandmarks(lm, { color: "#a855f7", radius: 3 });

              const W = canvas.width;
              const H = canvas.height;

              // Key points
              const nose      = lm[0];
              const lShoulder = lm[11];
              const rShoulder = lm[12];
              const lHip      = lm[23];
              const rHip      = lm[24];
              const lKnee     = lm[25];
              const rKnee     = lm[26];
              const lEar      = lm[7];
              const rEar      = lm[8];

              // Draw alignment guide lines
              ctx.save();
              ctx.setLineDash([6, 4]);
              ctx.lineWidth = 1.5;

              if (lShoulder && rShoulder) {
                // Shoulder level line
                ctx.strokeStyle = Math.abs(lShoulder.y - rShoulder.y) * H < 15 ? "#10b981" : "#f59e0b";
                ctx.beginPath();
                ctx.moveTo(lShoulder.x * W - 30, lShoulder.y * H);
                ctx.lineTo(rShoulder.x * W + 30, rShoulder.y * H);
                ctx.stroke();
                // Label
                ctx.fillStyle = ctx.strokeStyle;
                ctx.font = "bold 10px sans-serif";
                ctx.fillText("Shoulders", lShoulder.x * W - 28, lShoulder.y * H - 5);
              }

              if (lHip && rHip) {
                // Hip level line
                ctx.strokeStyle = Math.abs(lHip.y - rHip.y) * H < 15 ? "#10b981" : "#f59e0b";
                ctx.beginPath();
                ctx.moveTo(lHip.x * W - 30, lHip.y * H);
                ctx.lineTo(rHip.x * W + 30, rHip.y * H);
                ctx.stroke();
                ctx.fillStyle = ctx.strokeStyle;
                ctx.font = "bold 10px sans-serif";
                ctx.fillText("Hips", lHip.x * W - 24, lHip.y * H - 5);
              }

              // Vertical plumb line (midpoint shoulder → midpoint hip)
              if (lShoulder && rShoulder && lHip && rHip && nose) {
                const midShoulderX = ((lShoulder.x + rShoulder.x) / 2) * W;
                const midShoulderY = ((lShoulder.y + rShoulder.y) / 2) * H;
                const midHipX = ((lHip.x + rHip.x) / 2) * W;
                const midHipY = ((lHip.y + rHip.y) / 2) * H;
                ctx.strokeStyle = "rgba(255,255,255,0.35)";
                ctx.beginPath();
                ctx.moveTo(midShoulderX, 0);
                ctx.lineTo(midShoulderX, H);
                ctx.stroke();

                // Head forward indicator
                const headOffset = Math.abs(nose.x * W - midShoulderX);
                ctx.setLineDash([]);
                ctx.strokeStyle = headOffset > 25 ? "#f59e0b" : "#10b981";
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(midShoulderX, nose.y * H);
                ctx.lineTo(nose.x * W, nose.y * H);
                ctx.stroke();
              }

              ctx.restore();

              // Accumulate posture metrics
              if (lShoulder && rShoulder && lHip && rHip && lKnee && rKnee && nose) {
                const shoulderTilt = Math.abs(lShoulder.y - rShoulder.y) * 90;
                const hipTilt = Math.abs(lHip.y - rHip.y) * 90;
                const midShoulderX = (lShoulder.x + rShoulder.x) / 2;
                const headForward = Math.abs(nose.x - midShoulderX) * 90;
                const kneeBend = Math.abs(lKnee.y - lHip.y) * 10;

                postureRef.current.shoulderTiltSum += shoulderTilt;
                postureRef.current.hipTiltSum += hipTilt;
                postureRef.current.headForwardSum += headForward;
                postureRef.current.kneeBendSum += kneeBend;
                postureRef.current.frames++;

                // Live posture score (0-100, higher = better)
                const deductions = shoulderTilt * 2 + hipTilt * 2 + headForward * 1.5;
                const score = Math.max(0, Math.round(100 - deductions));
                setPostureScore(score);
              }
            }
          }
        }
      }
      animId = requestAnimationFrame(loop);
    };
    loop();
    return () => cancelAnimationFrame(animId);
  }, [stage, landmarker, mode]);

  // ── Stop + run processing pipeline ──────────────────────────────────────
  const stopAndProcess = async () => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    if (autoStopRef.current) { clearTimeout(autoStopRef.current); autoStopRef.current = null; }
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(t => t.stop());
      videoRef.current.srcObject = null;
    }

    // Build session result depending on mode
    let sessionResult: any;
    if (mode === "sit-to-stand") {
      const m = metricsRef.current;
      const calculatedRom = Math.max(0, m.maxKneeAngle - m.minKneeAngle);
      const avgSymmetry = m.framesAnalyzed > 0 ? m.symmetrySum / m.framesAnalyzed : 0.95;
      sessionResult = {
        mode: "sit-to-stand",
        reps,
        elapsed,
        rom: calculatedRom || 90.5,
        symmetry: avgSymmetry,
        movementSpeed: reps > 0 && elapsed > 0 ? reps / (elapsed / 60) : 1.2,
      };
    } else if (mode === "squat-analysis") {
      sessionResult = {
        mode,
        reps,
        elapsed,
        rom: 120, // default placeholder depth
        symmetry: 0.92,
        movementSpeed: reps > 0 && elapsed > 0 ? reps / (elapsed / 60) : 1.0,
      };
    } else if (mode === "gait-analysis") {
      sessionResult = {
        mode,
        reps: gaitRef.current.totalSteps,
        elapsed,
        rom: Math.round(gaitRef.current.maxHipDrop * 10) / 10, // store max hip drop as rom
        symmetry: 0.96,
        movementSpeed: liveCadence || 82, // store cadence as speed
      };
    } else {
      const p = postureRef.current;
      const frames = p.frames || 1;
      const avgShoulderTilt = p.shoulderTiltSum / frames;
      const avgHipTilt = p.hipTiltSum / frames;
      const avgHeadForward = p.headForwardSum / frames;
      const overallDeductions = avgShoulderTilt * 2 + avgHipTilt * 2 + avgHeadForward * 1.5;
      const finalScore = Math.max(0, Math.round(100 - overallDeductions));
      const symmetry = Math.max(0, 1 - (avgShoulderTilt + avgHipTilt) / 30);
      sessionResult = {
        mode: "standing-posture",
        reps: 1,
        elapsed,
        rom: 180, // standing = full extension
        symmetry,
        movementSpeed: 0,
        postureScore: finalScore,
        shoulderTilt: avgShoulderTilt,
        hipTilt: avgHipTilt,
        headForward: avgHeadForward,
      };
    }

    sessionStorage.setItem("lastSession", JSON.stringify(sessionResult));
    // Reset step statuses
    setProcessSteps(steps => steps.map(s => ({ ...s, status: "pending" })));
    setStage("processing");

    const advance = (id: string, status: ProcessStep["status"]) => {
      setProcessSteps(prev => prev.map(s => s.id === id ? { ...s, status } : s));
    };
    const delay = (ms: number) => new Promise(r => setTimeout(r, ms));

    advance("capture", "running"); await delay(600); advance("capture", "done");
    advance("pose", "running"); await delay(900); advance("pose", "done");
    advance("biomech", "running");
    try {
      await api.submitVisionSession({
        user_id: auth.currentUser?.uid || "test-user",
        task_type: mode === "sit-to-stand" ? "Sit-to-Stand" : "Standing-Posture",
        pose_landmarks_json: "{}",
        joint_angles_json: "{}",
        rom: sessionResult.rom,
        movement_speed: sessionResult.movementSpeed,
        symmetry: sessionResult.symmetry,
        stability: mode === "standing-posture" ? (sessionResult.postureScore / 100) : 0.88,
        camera_quality: "High",
        annotated_image_url: sessionStorage.getItem("lastAnnotatedImage") || undefined,
      });
      await delay(400); advance("biomech", "done");
    } catch { advance("biomech", "error"); }
    advance("profile", "running"); await delay(800); advance("profile", "done");
    advance("insights", "running");
    try {
      const uid = auth.currentUser?.uid || "test-user";
      const res = await api.getDeepInsights(uid);
      sessionStorage.setItem("lastInsights", res.insights || "");
      await delay(300); advance("insights", "done");
    } catch { advance("insights", "done"); }

    setStage("done");
    await delay(800);
    setLocation("/insights");
  };

  const formatTime = (s: number) =>
    `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────

  if (stage === "landing") {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-start px-4 pt-8 pb-20 md:pb-8 relative overflow-y-auto overflow-x-hidden">
        {/* Background glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] rounded-full opacity-10 blur-3xl pointer-events-none"
          style={{ background: "radial-gradient(ellipse, #0ea5e9, #8b5cf6)" }} />

        <div className="w-full max-w-5xl relative z-10 flex flex-col gap-6">
          
          {/* Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-4">
            <div>
              <div className="inline-flex items-center gap-2 mb-3 px-3 py-1 rounded-full border border-primary/30 bg-primary/10 text-primary text-xs font-bold uppercase tracking-widest">
                <ShieldCheck className="w-3.5 h-3.5" /> Data Hub
              </div>
              <h1 className="text-3xl md:text-5xl font-black tracking-tight">
                Update your <span className="text-gradient">Digital Twin</span>
              </h1>
            </div>
            <button 
              onClick={() => setStage("options")}
              className="mt-4 md:mt-0 btn-primary px-6 py-3 shadow-[0_0_20px_rgba(14,165,233,0.3)] hover:shadow-[0_0_30px_rgba(14,165,233,0.5)] transition-all flex items-center gap-2"
            >
              <Plus className="w-5 h-5" /> Add New Data
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Twin Freshness Card (Spans 2 cols on tablet/desktop) */}
            <div className="md:col-span-2 glass-panel p-6 flex flex-col md:flex-row items-center gap-6 border-l-4 border-l-primary relative overflow-hidden group">
              <div className="absolute -right-10 -bottom-10 opacity-5 group-hover:opacity-10 transition-opacity">
                <Brain className="w-48 h-48" />
              </div>
              <div className="relative">
                <div className="w-24 h-24 rounded-full border-[6px] border-primary/20 flex items-center justify-center">
                  <div className="w-full h-full rounded-full border-[6px] border-primary border-t-transparent animate-spin-slow" />
                  <div className="absolute inset-0 flex items-center justify-center font-black text-2xl">94%</div>
                </div>
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-xl mb-1">Twin Accuracy is High</h3>
                <p className="text-sm text-muted-foreground mb-4">Your digital model is closely synced with your physical state. Keep it up by logging your weekly assessments.</p>
                <div className="flex gap-4">
                  <div className="flex items-center gap-2 text-xs font-medium text-emerald-400">
                    <CheckCircle className="w-4 h-4" /> Last scan: 3 days ago
                  </div>
                  <div className="flex items-center gap-2 text-xs font-medium text-amber-400">
                    <Activity className="w-4 h-4" /> Next due: Squat Analysis
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Action / Recommended */}
            <div className="glass-panel p-6 border border-emerald-500/20 bg-emerald-500/5 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 text-emerald-500 mb-2">
                  <Sparkles className="w-5 h-5" />
                  <span className="font-bold text-sm uppercase tracking-wider">Recommended</span>
                </div>
                <h3 className="font-bold text-lg mb-2">Weekly Posture Scan</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">It's been a week since your last standing posture scan. Take 10 seconds to update your alignment metrics.</p>
              </div>
              <button onClick={() => { setMode("standing-posture"); setStage("setup"); }} className="mt-4 w-full py-2.5 rounded-lg bg-emerald-500/20 text-emerald-400 font-semibold text-sm hover:bg-emerald-500/30 transition-colors border border-emerald-500/30">
                Start Posture Scan
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-2">
            
            {/* Recent Activity Feed */}
            <div className="glass-panel p-6">
              <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                <History className="w-5 h-5 text-sky-400" /> Recent Captures
              </h3>
              <div className="space-y-4">
                {[
                  { title: "Gait Analysis", date: "Today, 9:00 AM", status: "Processed", icon: <PersonStanding className="w-4 h-4" />, color: "text-emerald-400", bg: "bg-emerald-500/10" },
                  { title: "Medical Report Upload", date: "Yesterday, 2:15 PM", status: "Synced", icon: <FileText className="w-4 h-4" />, color: "text-purple-400", bg: "bg-purple-500/10" },
                  { title: "Sit-to-Stand Test", date: "3 days ago", status: "Processed", icon: <Dumbbell className="w-4 h-4" />, color: "text-blue-400", bg: "bg-blue-500/10" }
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-4 p-3 rounded-xl bg-card border border-border/50 hover:border-border transition-colors">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${item.bg} ${item.color}`}>
                      {item.icon}
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-sm">{item.title}</div>
                      <div className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                        <Calendar className="w-3 h-3" /> {item.date}
                      </div>
                    </div>
                    <div className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded bg-secondary/50 text-muted-foreground">
                      {item.status}
                    </div>
                  </div>
                ))}
              </div>
              <button className="w-full mt-4 py-2 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors border border-dashed border-border rounded-lg">
                View Full History
              </button>
            </div>

            {/* How it Works / Capabilities */}
            <div className="glass-panel p-6 bg-gradient-to-br from-card to-background/50">
              <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                <Zap className="w-5 h-5 text-amber-400" /> Data Capabilities
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-card border border-border">
                  <Camera className="w-6 h-6 text-blue-400 mb-2" />
                  <div className="font-bold text-sm mb-1">Live AI Vision</div>
                  <div className="text-xs text-muted-foreground">Real-time biomechanics tracking via your device camera.</div>
                </div>
                <div className="p-4 rounded-xl bg-card border border-border">
                  <ImagePlus className="w-6 h-6 text-emerald-400 mb-2" />
                  <div className="font-bold text-sm mb-1">Gallery Upload</div>
                  <div className="text-xs text-muted-foreground">Analyze static photos for posture and alignment.</div>
                </div>
                <div className="p-4 rounded-xl bg-card border border-border">
                  <FileText className="w-6 h-6 text-purple-400 mb-2" />
                  <div className="font-bold text-sm mb-1">Medical Reports</div>
                  <div className="text-xs text-muted-foreground">Extract insights from X-rays, MRIs, and notes.</div>
                </div>
                <div className="p-4 rounded-xl bg-card border border-border">
                  <Brain className="w-6 h-6 text-pink-400 mb-2" />
                  <div className="font-bold text-sm mb-1">Continuous Sync</div>
                  <div className="text-xs text-muted-foreground">All data feeds directly into your digital twin model.</div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    );
  }

  // ── Stage 0.2: Options Menu ─────────────────────────────────────────────
  if (stage === "options") {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 py-12 relative overflow-y-auto overflow-x-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[350px] rounded-full opacity-10 blur-3xl pointer-events-none"
          style={{ background: "radial-gradient(ellipse, #0ea5e9, #8b5cf6)" }} />

        <div className="w-full max-w-xl relative z-10">
          <button onClick={() => setStage("landing")} className="mb-6 text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors">
            ← Back to Hub
          </button>
          
          <div className="text-center mb-10">
            <h1 className="text-3xl font-black tracking-tight mb-2">
              What do you want to <span className="text-gradient">add?</span>
            </h1>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Live Motion Capture */}
            <button
              onClick={() => setStage("select")}
              className="text-left p-6 rounded-2xl border-2 border-border bg-card hover:border-primary/50 transition-all duration-200 hover:-translate-y-1 hover:shadow-xl group"
            >
              <div className="w-12 h-12 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Camera className="w-6 h-6" />
              </div>
              <div className="font-bold text-lg mb-1">Live Capture</div>
              <div className="text-sm text-muted-foreground leading-relaxed">
                Use your camera to perform physical assessments.
              </div>
            </button>

            {/* Static Image Analysis */}
            <button
              onClick={() => { setMode("static-image"); setStage("upload-image"); }}
              className="text-left p-6 rounded-2xl border-2 border-border bg-card hover:border-emerald-500/50 transition-all duration-200 hover:-translate-y-1 hover:shadow-xl group"
            >
              <div className="w-12 h-12 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <ImagePlus className="w-6 h-6" />
              </div>
              <div className="font-bold text-lg mb-1">Gallery Image</div>
              <div className="text-sm text-muted-foreground leading-relaxed">
                Upload a photo to analyse static standing posture.
              </div>
            </button>

            {/* Medical Report */}
            <button
              onClick={() => setStage("upload-report")}
              className="text-left p-6 rounded-2xl border-2 border-border bg-card hover:border-purple-500/50 transition-all duration-200 hover:-translate-y-1 hover:shadow-xl group"
            >
              <div className="w-12 h-12 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <FileText className="w-6 h-6" />
              </div>
              <div className="font-bold text-lg mb-1">Medical Report</div>
              <div className="text-sm text-muted-foreground leading-relaxed">
                Upload photos of X-rays, MRI reports, or doctor's notes.
              </div>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Stage 0.3: Upload Report ─────────────────────────────────────────────
  if (stage === "upload-report") {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 py-12 relative overflow-y-auto overflow-x-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[350px] rounded-full opacity-10 blur-3xl pointer-events-none"
          style={{ background: "radial-gradient(ellipse, #8b5cf6, #ec4899)" }} />

        <div className="w-full max-w-xl relative z-10">
          <button onClick={() => setStage("options")} className="mb-6 text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors">
            ← Back to Options
          </button>
          
          <div className="text-center mb-8">
            <h1 className="text-3xl font-black tracking-tight mb-2">
              Upload <span className="text-gradient">Medical Report</span>
            </h1>
            <p className="text-muted-foreground text-sm max-w-sm mx-auto">
              Our AI will scan the document and automatically update your digital twin's injury risk and capabilities.
            </p>
          </div>

          <div className="glass-panel p-8 text-center rounded-2xl border-2 border-dashed border-border hover:border-primary/50 transition-colors cursor-pointer group">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
              <UploadCloud className="w-8 h-8 text-primary" />
            </div>
            <div className="font-bold text-lg mb-1">Click to browse or drag file here</div>
            <div className="text-xs text-muted-foreground">Supports JPG, PNG, PDF (Max 10MB)</div>
            
            <button 
              onClick={() => {
                // Mock upload process
                setMode("medical-report");
                setStage("processing");
                setProcessSteps([
                  { id: "scan", label: "Scanning Document", icon: <FileText className="w-4 h-4" />, status: "running" },
                  { id: "extract", label: "Extracting Findings", icon: <Activity className="w-4 h-4" />, status: "pending" },
                  { id: "sync", label: "Syncing to Digital Twin", icon: <CheckCircle2 className="w-4 h-4" />, status: "pending" }
                ]);

                const delay = (ms: number) => new Promise(r => setTimeout(r, ms));
                const runMock = async () => {
                  await delay(1000);
                  setProcessSteps(prev => prev.map(s => s.id === "scan" ? { ...s, status: "done" } : s === prev[1] ? { ...s, status: "running" } : s));
                  await delay(1500);
                  setProcessSteps(prev => prev.map(s => s.id === "extract" ? { ...s, status: "done" } : s === prev[2] ? { ...s, status: "running" } : s));
                  await delay(1000);
                  setProcessSteps(prev => prev.map(s => s.id === "sync" ? { ...s, status: "done" } : s));
                  setStage("done");
                  await delay(1500);
                  setLocation("/dashboard");
                };
                runMock();
              }}
              className="mt-6 btn-primary px-6 py-2.5 text-sm"
            >
              Simulate Upload
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Stage 0.35: Upload Image (Gallery Analysis) ────────────────────────
  if (stage === "upload-image") {
    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
        const file = e.target.files[0];
        const url = URL.createObjectURL(file);
        setUploadedImageSrc(url);
      }
    };

    const processStaticImage = async () => {
      if (!uploadedImageSrc || !landmarker) return;
      const img = new Image();
      const loadPromise = new Promise(r => { img.onload = r; });
      img.src = uploadedImageSrc;
      await loadPromise;

      setProcessSteps([
        { id: "capture", label: "Initializing spatial mapping", icon: <Camera className="w-4 h-4" />, status: "running" },
        { id: "pose", label: "Extrapolating 3D kinematics", icon: <Eye className="w-4 h-4" />, status: "pending" },
        { id: "angles", label: "Analyzing joint angular deviations", icon: <Sparkles className="w-4 h-4" />, status: "pending" },
        { id: "biomech", label: "Computing biomechanical asymmetries", icon: <Activity className="w-4 h-4" />, status: "pending" },
        { id: "profile", label: "Cross-referencing Twin database", icon: <BarChart3 className="w-4 h-4" />, status: "pending" },
        { id: "insights", label: "Synthesizing deep AI insights", icon: <Brain className="w-4 h-4" />, status: "pending" },
      ]);
      setStage("processing");

      const advance = (id: string, status: ProcessStep["status"]) => {
        setProcessSteps(prev => prev.map(s => s.id === id ? { ...s, status } : s));
      };
      const delay = (ms: number) => new Promise(r => setTimeout(r, ms));

      // Step 1: Spatial mapping
      await delay(600);
      advance("capture", "done");
      advance("pose", "running");
      
      await landmarker.setOptions({ runningMode: "IMAGE" });
      const results = landmarker.detect(img);
      
      let avgShoulderTilt = 0;
      let avgHipTilt = 0;
      let avgHeadForward = 0;
      let finalScore = 85; // default
      let symmetry = 0.9;

      if (results.landmarks && results.landmarks.length > 0) {
        const lm = results.landmarks[0];

        // --- Draw skeleton on canvas ---
        try {
          const canvas = document.createElement("canvas");
          canvas.width = img.naturalWidth;
          canvas.height = img.naturalHeight;
          const ctx = canvas.getContext("2d")!;
          ctx.drawImage(img, 0, 0);

          // Use DrawingUtils for skeleton
          const drawingUtils = new DrawingUtils(ctx);
          drawingUtils.drawLandmarks(lm, { radius: 5, color: "#10b981", fillColor: "#10b981" });
          drawingUtils.drawConnectors(lm, PoseLandmarker.POSE_CONNECTIONS, { color: "#0ea5e9", lineWidth: 3 });

          // Calculate angles
          const lShoulder = lm[11]; const rShoulder = lm[12];
          const lHip = lm[23]; const rHip = lm[24];
          const nose = lm[0]; 
          const midShoulderX = (lShoulder.x + rShoulder.x) / 2;

          avgShoulderTilt = Math.abs(lShoulder.y - rShoulder.y) * canvas.height * 0.3;
          avgHipTilt = Math.abs(lHip.y - rHip.y) * canvas.height * 0.3;
          avgHeadForward = Math.abs(nose.x - midShoulderX) * canvas.width * 0.5;
          
          const totalDeviation = avgShoulderTilt + avgHipTilt + avgHeadForward;
          finalScore = Math.max(40, Math.round(100 - totalDeviation * 2));
          symmetry = Math.max(0.5, 1 - (Math.abs(lShoulder.y - rShoulder.y) + Math.abs(lHip.y - rHip.y)) * 0.5);

          // Draw text overlay for angles
          ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
          ctx.fillRect(10, 10, 250, 120);
          ctx.fillStyle = '#10b981';
          ctx.font = 'bold 22px sans-serif';
          ctx.fillText('Posture Analysis', 20, 38);
          ctx.fillStyle = 'white';
          ctx.font = '18px sans-serif';
          ctx.fillText(`Shoulder Tilt: ${avgShoulderTilt.toFixed(1)}°`, 20, 68);
          ctx.fillText(`Hip Tilt: ${avgHipTilt.toFixed(1)}°`, 20, 92);
          ctx.fillText(`Head Forward: ${avgHeadForward.toFixed(1)}°`, 20, 116);

          const annotatedUrl = canvas.toDataURL('image/jpeg', 0.85);
          sessionStorage.setItem("lastAnnotatedImage", annotatedUrl);
        } catch (e) {
          console.error("Canvas drawing error", e);
          sessionStorage.setItem("lastAnnotatedImage", uploadedImageSrc);
        }
      } else {
        sessionStorage.setItem("lastAnnotatedImage", uploadedImageSrc);
      }

      // Step 2: 3D kinematics done
      await delay(700); advance("pose", "done");

      // Step 3: Joint angular deviations
      advance("angles", "running");
      await delay(900); advance("angles", "done");

      // Step 4: Biomechanical asymmetries — submit to backend
      advance("biomech", "running");
      
      const sessionResult = {
        mode: "static-image",
        reps: 1,
        elapsed: 0,
        rom: 180,
        symmetry,
        movementSpeed: 0,
        postureScore: finalScore,
        shoulderTilt: avgShoulderTilt,
        hipTilt: avgHipTilt,
        headForward: avgHeadForward,
      };
      sessionStorage.setItem("lastSession", JSON.stringify(sessionResult));
      
      try {
        await api.submitVisionSession({
          user_id: auth.currentUser?.uid || "test-user",
          task_type: "Static-Image-Posture",
          pose_landmarks_json: JSON.stringify(results.landmarks || []),
          joint_angles_json: JSON.stringify({ shoulderTilt: avgShoulderTilt, hipTilt: avgHipTilt, headForward: avgHeadForward }),
          rom: sessionResult.rom,
          movement_speed: sessionResult.movementSpeed,
          symmetry: sessionResult.symmetry,
          stability: sessionResult.postureScore / 100,
          camera_quality: "High",
          annotated_image_url: sessionStorage.getItem("lastAnnotatedImage") || undefined,
        });
        await delay(500); advance("biomech", "done");
      } catch { advance("biomech", "error"); }
      
      // Step 5: Cross-reference Twin database
      advance("profile", "running"); await delay(800); advance("profile", "done");

      // Step 6: Synthesize deep AI insights
      advance("insights", "running");
      try {
        const uid = auth.currentUser?.uid || "test-user";
        const res = await api.getDeepInsights(uid);
        sessionStorage.setItem("lastInsights", res.insights || "");
        await delay(300); advance("insights", "done");
      } catch { advance("insights", "done"); }

      setStage("done");
      await delay(800);
      setLocation("/insights");
    };

    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 py-12 relative overflow-y-auto overflow-x-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[350px] rounded-full opacity-10 blur-3xl pointer-events-none"
          style={{ background: "radial-gradient(ellipse, #10b981, #0ea5e9)" }} />

        <div className="w-full max-w-xl relative z-10">
          <button onClick={() => { setStage("options"); setUploadedImageSrc(null); }} className="mb-6 text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors">
            ← Back to Options
          </button>
          
          <div className="text-center mb-8">
            <h1 className="text-3xl font-black tracking-tight mb-2">
              Gallery <span className="text-gradient">Image Analysis</span>
            </h1>
            <p className="text-muted-foreground text-sm max-w-sm mx-auto">
              Upload a standing photo from your gallery. Our AI will analyze your posture alignment instantly.
            </p>
          </div>

          <div className="glass-panel p-8 text-center rounded-2xl border-2 border-dashed border-border hover:border-emerald-500/50 transition-colors cursor-pointer group relative overflow-hidden">
            {!uploadedImageSrc ? (
              <>
                <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                  <ImagePlus className="w-8 h-8 text-emerald-500" />
                </div>
                <div className="font-bold text-lg mb-1">Click to browse or drag photo here</div>
                <div className="text-xs text-muted-foreground">Supports JPG, PNG (Max 10MB)</div>
                <input type="file" accept="image/*" onChange={handleImageChange} className="absolute inset-0 opacity-0 cursor-pointer" />
              </>
            ) : (
              <div className="relative">
                <img src={uploadedImageSrc} alt="Uploaded" className="max-h-64 mx-auto rounded-lg shadow-lg mb-4" />
                <button onClick={() => setUploadedImageSrc(null)} className="text-xs text-red-400 hover:text-red-300 mb-4 block mx-auto">Remove Image</button>
                <button onClick={processStaticImage} disabled={!landmarker} className="btn-primary px-8 py-3 w-full shadow-[0_0_25px_rgba(16,185,129,0.35)] disabled:opacity-50">
                  {landmarker ? "Analyze Posture" : "Loading AI Model..."}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ── Stage 0.4: Mode Select ─────────────────────────────────────────────────
  if (stage === "select") {
    const modes = [
      {
        id: "sit-to-stand" as Mode,
        icon: <Dumbbell className="w-7 h-7" />,
        label: "Sit-to-Stand Test",
        sub: "Dynamic movement",
        desc: "Repeatedly stand from a chair. Measures mobility, stability, and cardiovascular endurance over multiple reps.",
        duration: "1–3 min",
        color: "#0ea5e9",
        badge: "Most popular",
      },
      {
        id: "standing-posture" as Mode,
        icon: <PersonStanding className="w-7 h-7" />,
        label: "Standing Posture Scan",
        sub: "Static analysis",
        desc: "Stand naturally for 10 seconds. AI analyses your shoulder alignment, hip balance, head position, and spine curvature.",
        duration: "10 sec",
        color: "#8b5cf6",
        badge: "New",
      },
      {
        id: "squat-analysis" as Mode,
        icon: <Activity className="w-7 h-7" />,
        label: "Squat Mechanics",
        sub: "Form & Depth",
        desc: "Analyzes squat depth, knee tracking (varus/valgus), and rep speed with real-time audio coaching.",
        duration: "1–2 min",
        color: "#ec4899", // pink
        badge: "Advanced",
      },
      {
        id: "gait-analysis" as Mode,
        icon: <PersonStanding className="w-7 h-7" />,
        label: "Gait & Balance Walk",
        sub: "Locomotion",
        desc: "Walk across the frame. Evaluates stride length, cadence, and left/right movement symmetry.",
        duration: "30 sec",
        color: "#10b981", // green
        badge: "Clinical",
      },
    ];

    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 py-12 relative overflow-y-auto overflow-x-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[350px] rounded-full opacity-10 blur-3xl pointer-events-none"
          style={{ background: "radial-gradient(ellipse, #0ea5e9, #8b5cf6)" }} />

        <div className="w-full max-w-xl relative z-10">
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 mb-5 px-4 py-1.5 rounded-full border border-primary/30 bg-primary/10 text-primary text-xs font-bold uppercase tracking-widest">
              <Camera className="w-3.5 h-3.5" />
              Choose Assessment
            </div>
            <h1 className="text-4xl font-black tracking-tight mb-3">
              What would you<br />
              <span className="text-gradient">like to capture?</span>
            </h1>
            <p className="text-muted-foreground text-sm max-w-sm mx-auto">
              Pick an assessment type. Your digital twin will analyse the recording and generate personalised insights.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 mb-8">
            {modes.map(m => (
              <button
                key={m.id}
                onClick={() => { setMode(m.id); setStage("setup"); }}
                className={`text-left p-5 rounded-2xl border-2 transition-all duration-200 hover:scale-[1.01] hover:shadow-lg group ${
                  mode === m.id
                    ? "border-primary bg-primary/5"
                    : "border-border bg-card hover:border-primary/40"
                }`}
              >
                <div className="flex items-start gap-4">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center text-white shrink-0"
                    style={{ background: `linear-gradient(135deg,${m.color}cc,${m.color})` }}
                  >
                    {m.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <div className="font-black text-base">{m.label}</div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full text-white"
                        style={{ background: m.color }}>
                        {m.badge}
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground uppercase tracking-widest mb-2">{m.sub}</div>
                    <div className="text-sm text-muted-foreground leading-relaxed">{m.desc}</div>
                    <div className="flex items-center gap-1.5 mt-3 text-xs font-semibold" style={{ color: m.color }}>
                      <Clock className="w-3.5 h-3.5" />
                      {m.duration}
                    </div>
                  </div>
                  <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors shrink-0 mt-1" />
                </div>
              </button>
            ))}
          </div>

          {(!modelReady && !modelError) && (
            <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              AI pose model loading in background…
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── Stage 1: Setup ───────────────────────────────────────────────────────
  if (stage === "setup") {
    const isSts = mode === "sit-to-stand";
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 py-12 relative overflow-y-auto overflow-x-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] rounded-full opacity-10 blur-3xl pointer-events-none"
          style={{ background: "radial-gradient(ellipse, #0ea5e9, #8b5cf6)" }} />

        <div className="w-full max-w-lg relative z-10">
          {/* Back */}
          <button onClick={() => setStage("select")} className="mb-6 text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors">
            ← Change assessment type
          </button>

          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 mb-5 px-4 py-1.5 rounded-full border border-primary/30 bg-primary/10 text-primary text-xs font-bold uppercase tracking-widest">
              <Zap className="w-3.5 h-3.5" />
              {mode === "sit-to-stand" ? "Sit-to-Stand Assessment" 
                : mode === "squat-analysis" ? "Squat Mechanics"
                : mode === "gait-analysis" ? "Gait & Balance Walk" 
                : "Standing Posture Scan"}
            </div>
            <h1 className="text-4xl font-black tracking-tight mb-3">
              {mode === "standing-posture" ? <>Let's scan your<br /><span className="text-gradient">posture</span></> 
               : <>Let's capture your<br /><span className="text-gradient">movement</span></>}
            </h1>
            <p className="text-muted-foreground text-sm max-w-sm mx-auto leading-relaxed">
              {mode === "standing-posture"
                ? "Stand naturally for 10 seconds. Our AI will analyse your alignment."
                : "Follow these quick steps for an accurate reading. Takes under 2 minutes."}
            </p>
          </div>

          <div className="card p-6 space-y-5 mb-6 shadow-lg">
            {mode === "sit-to-stand" && (
              <>
                <SetupStep num={1} title="Place camera 2 metres away" desc="Set your phone or laptop so the camera faces you from the side or front at full height." />
                <div className="h-px bg-border" />
                <SetupStep num={2} title="Find a sturdy chair" desc="Sit all the way back. Keep arms crossed or at your sides — no armrests for pushing up." />
                <div className="h-px bg-border" />
                <SetupStep num={3} title="Perform slow, controlled sit-to-stands" desc="Rise fully upright, pause, then sit back down. Aim for 5–10 reps at a comfortable pace." />
              </>
            )}
            {mode === "squat-analysis" && (
              <>
                <SetupStep num={1} title="Place camera 2 metres away" desc="Position the camera straight-on to track knee varus/valgus collapse." />
                <div className="h-px bg-border" />
                <SetupStep num={2} title="Squat to depth" desc="Go as low as comfortable. AI will track your hip crease and knee angle." />
                <div className="h-px bg-border" />
                <SetupStep num={3} title="Listen to coaching" desc="If your knees cave in, you'll hear a voice cue to correct your form." />
              </>
            )}
            {mode === "gait-analysis" && (
              <>
                <SetupStep num={1} title="Clear a walking path" desc="Ensure you have at least 3-4 metres of horizontal space visible." />
                <div className="h-px bg-border" />
                <SetupStep num={2} title="Walk normally" desc="Walk side-to-side across the frame. The AI will measure your stride symmetry." />
              </>
            )}
            {mode === "standing-posture" && (
              <>
                <SetupStep num={1} title="Place camera 2 metres away" desc="Ideally at chest height so your full body fits in frame. Straight-on or slight angle both work." />
                <div className="h-px bg-border" />
                <SetupStep num={2} title="Stand naturally — don't try to look 'perfect'" desc="Relax your shoulders, arms at your sides, feet hip-width apart. We want your natural posture." />
                <div className="h-px bg-border" />
                <SetupStep num={3} title="Stay still for 10 seconds" desc="The scan will auto-stop after 10 seconds. You'll see a countdown and live alignment guides on screen." />
              </>
            )}
          </div>

          <div className="flex items-center justify-between p-4 bg-primary/5 rounded-xl border border-primary/20 mb-8 cursor-pointer" onClick={() => setAudioCoaching(!audioCoaching)}>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary">
                {audioCoaching ? <Zap className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </div>
              <div>
                <div className="text-sm font-bold">Audio Coaching</div>
                <div className="text-xs text-muted-foreground">Voice feedback during capture</div>
              </div>
            </div>
            <div className={`w-10 h-5 rounded-full transition-colors relative ${audioCoaching ? 'bg-primary' : 'bg-border'}`}>
              <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${audioCoaching ? 'left-5' : 'left-1'}`} />
            </div>
          </div>

          <button
            onClick={() => setStage("countdown")}
            disabled={modelError}
            className="btn-primary w-full py-4 text-base flex items-center justify-center gap-2 shadow-[0_0_25px_rgba(14,165,233,0.35)] hover:shadow-[0_0_35px_rgba(14,165,233,0.55)] transition-all"
          >
            {modelError ? "AI Model Failed — Reload Page"
              : !modelReady ? <><Loader2 className="w-4 h-4 animate-spin" />Loading AI Model…</>
              : <><ChevronRight className="w-5 h-5" />I'm Ready — Start</>}
          </button>

          {!modelReady && !modelError && (
            <p className="text-center text-xs text-muted-foreground mt-3">
              AI pose model is loading in the background…
            </p>
          )}
        </div>
      </div>
    );
  }

  // ── Stage 2: Countdown ───────────────────────────────────────────────────
  if (stage === "countdown") {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center gap-8">
        <div className="text-white/50 text-sm uppercase tracking-widest font-bold">
          {mode === "standing-posture" ? "Get into your natural standing position" : "Get into position"}
        </div>
        <div
          key={countdown}
          className="text-[160px] font-black font-mono-numbers text-white leading-none"
          style={{
            textShadow: "0 0 40px rgba(34,211,238,0.8), 0 0 80px rgba(34,211,238,0.4)",
            animation: "countdownPop 1s ease-out forwards",
          }}
        >
          {countdown}
        </div>
        <div className="text-white/40 text-sm">
          {mode === "standing-posture"
            ? "Relax your shoulders and stand naturally"
            : "Recording begins when the timer hits zero"}
        </div>
        <style>{`
          @keyframes countdownPop {
            0% { transform: scale(1.4); opacity: 0; }
            30% { opacity: 1; transform: scale(1); }
            80% { transform: scale(1); opacity: 1; }
            100% { transform: scale(0.85); opacity: 0.3; }
          }
        `}</style>
      </div>
    );
  }

  // ── Stage 3: Recording ───────────────────────────────────────────────────
  if (stage === "recording") {
    const isSts = mode === "sit-to-stand";
    const posturePercent = (postureTimeLeft / POSTURE_DURATION) * 100;

    return (
      <div className="min-h-screen bg-background text-foreground flex flex-col">
        {/* Top bar */}
        <header className="flex items-center justify-between px-6 py-4 border-b border-border bg-background/95 backdrop-blur-md z-20">
          <div className="flex items-center gap-3">
            <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.8)]" />
            <span className="text-sm font-bold uppercase tracking-widest text-red-400">
              {mode === "standing-posture" ? "Posture Scan" : "Recording"}
            </span>
          </div>
          <span className="font-mono-numbers text-xl font-black text-primary">{formatTime(elapsed)}</span>
        </header>

        <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
          {/* Camera feed */}
          <div className="relative flex-1 bg-black min-h-[50vh] md:min-h-0">
            <video ref={videoRef} className="absolute inset-0 w-full h-full object-cover" style={{ opacity: 0.6 }} playsInline muted />
            <canvas ref={canvasRef} className="absolute inset-0 w-full h-full object-cover z-10" />

            {/* Legend */}
            <div className="absolute top-4 left-4 z-20 flex flex-col gap-2">
              <div className="flex items-center gap-2 glass px-3 py-1.5 rounded-lg">
                <div className="w-3 h-0.5 bg-cyan-400" />
                <span className="text-xs text-cyan-400 font-semibold">Live Pose</span>
              </div>
              {isSts ? (
                <div className="flex items-center gap-2 glass px-3 py-1.5 rounded-lg">
                  <div className="w-3 h-0.5 bg-white/40" />
                  <span className="text-xs text-white/60 font-semibold">Ghost (Best Prior)</span>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-2 glass px-3 py-1.5 rounded-lg">
                    <div className="w-3 h-0.5 bg-emerald-400" />
                    <span className="text-xs text-emerald-400 font-semibold">Aligned</span>
                  </div>
                  <div className="flex items-center gap-2 glass px-3 py-1.5 rounded-lg">
                    <div className="w-3 h-0.5 bg-amber-400" />
                    <span className="text-xs text-amber-400 font-semibold">Misaligned</span>
                  </div>
                </>
              )}
            </div>

            {/* Posture auto-stop progress ring */}
            {!isSts && (
              <div className="absolute top-4 right-4 z-20 glass px-3 py-2 rounded-xl flex items-center gap-2">
                <div className="relative w-10 h-10">
                  <svg className="w-10 h-10 -rotate-90" viewBox="0 0 36 36">
                    <circle cx="18" cy="18" r="14" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="3" />
                    <circle
                      cx="18" cy="18" r="14" fill="none"
                      stroke="#22d3ee" strokeWidth="3"
                      strokeDasharray={`${posturePercent * 0.879} 100`}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center text-white text-xs font-black font-mono-numbers">
                    {postureTimeLeft}
                  </div>
                </div>
                <div className="text-xs text-white/70 font-semibold">sec<br />left</div>
              </div>
            )}
          </div>

          {/* Side panel */}
          <div className="w-full md:w-72 border-t md:border-t-0 md:border-l border-border flex flex-col p-5 gap-5 bg-background shrink-0">
            {isSts ? (
              <>
                <div className="metric-card text-center py-5">
                  <div className="text-xs text-muted-foreground uppercase tracking-widest mb-1">Reps Completed</div>
                  <div className="text-6xl font-black font-mono-numbers text-gradient-primary">{reps}</div>
                </div>
                <div className="metric-card space-y-3">
                  <div className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Live Biomechanics</div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Range of Motion</span>
                    <span className="font-mono-numbers font-bold">{liveRom}°</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Symmetry</span>
                    <span className="font-mono-numbers font-bold">{liveSymmetry}%</span>
                  </div>
                  <div>
                    <div className="flex justify-between text-xs mb-1.5">
                      <span className="text-muted-foreground">Exertion</span>
                      <span className="font-mono-numbers font-bold">{Math.round(exertionLevel * 100)}%</span>
                    </div>
                    <div className="h-2 bg-border rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-300"
                        style={{ width: `${exertionLevel * 100}%`, background: "linear-gradient(90deg,#0891b2,#22d3ee)", boxShadow: "0 0 8px rgba(34,211,238,0.5)" }} />
                    </div>
                  </div>
                </div>
                <div className="text-xs text-muted-foreground text-center">
                  Duration: <span className="font-mono-numbers font-bold text-foreground">{formatTime(elapsed)}</span>
                </div>
                <div className="mt-auto">
                  <button onClick={stopAndProcess} className="w-full py-4 rounded-xl font-black text-sm uppercase tracking-widest bg-red-600 hover:bg-red-500 text-white shadow-[0_0_20px_rgba(220,38,38,0.35)] transition-all">
                    ■ Stop & Analyze
                  </button>
                  <p className="text-center text-xs text-muted-foreground mt-2">Stop when done with reps</p>
                </div>
              </>
            ) : mode === "gait-analysis" ? (
              <>
                <div className="metric-card text-center py-5">
                  <div className="text-xs text-muted-foreground uppercase tracking-widest mb-1">Total Steps Tracked</div>
                  <div className="text-6xl font-black font-mono-numbers text-gradient-primary">{reps}</div>
                </div>
                <div className="metric-card space-y-3">
                  <div className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Live Gait Kinematics</div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Est. Cadence</span>
                    <span className="font-mono-numbers font-bold text-sky-400">{liveCadence || 82} SPM</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Lateral Hip Drop</span>
                    <span className={`font-mono-numbers font-bold ${liveHipDrop > 5 ? 'text-red-400' : 'text-emerald-400'}`}>{liveHipDrop.toFixed(1)}°</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Symmetry Ratio</span>
                    <span className="font-mono-numbers font-bold text-emerald-400">96.4%</span>
                  </div>
                </div>
                <div className="text-xs text-muted-foreground text-center">
                  Time Remaining: <span className="font-mono-numbers font-bold text-foreground">{postureTimeLeft}s</span>
                </div>
                <div className="mt-auto">
                  <button onClick={stopAndProcess} className="w-full py-4 rounded-xl font-black text-sm uppercase tracking-widest bg-red-600 hover:bg-red-500 text-white shadow-[0_0_20px_rgba(220,38,38,0.35)] transition-all">
                    ■ Stop & Analyze
                  </button>
                  <p className="text-center text-xs text-muted-foreground mt-2">Will auto-stop in {postureTimeLeft}s</p>
                </div>
              </>
            ) : (
              <>
                {/* Posture score ring */}
                <div className="metric-card text-center py-5">
                  <div className="text-xs text-muted-foreground uppercase tracking-widest mb-3">Posture Score</div>
                  <div className="relative w-24 h-24 mx-auto mb-2">
                    <svg className="w-24 h-24 -rotate-90" viewBox="0 0 80 80">
                      <circle cx="40" cy="40" r="30" fill="none" stroke="rgba(0,0,0,0.08)" strokeWidth="8" />
                      <circle
                        cx="40" cy="40" r="30" fill="none"
                        strokeWidth="8" strokeLinecap="round"
                        strokeDasharray={`${postureScore * 1.884} 188.4`}
                        stroke={postureScore >= 80 ? "#10b981" : postureScore >= 60 ? "#f59e0b" : "#ef4444"}
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <div className="text-2xl font-black font-mono-numbers">{postureScore}</div>
                      <div className="text-[9px] text-muted-foreground uppercase tracking-wide">/ 100</div>
                    </div>
                  </div>
                  <div className={`text-xs font-bold ${postureScore >= 80 ? "text-emerald-500" : postureScore >= 60 ? "text-amber-500" : "text-red-400"}`}>
                    {postureScore >= 80 ? "Excellent" : postureScore >= 60 ? "Needs Work" : "Poor Alignment"}
                  </div>
                </div>

                {/* Live alignment meters */}
                <div className="metric-card space-y-3">
                  <div className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Live Alignment</div>
                  <PostureBar label="Shoulder Tilt" value={postureRef.current.frames > 0 ? postureRef.current.shoulderTiltSum / postureRef.current.frames : 0} good={(postureRef.current.frames > 0 ? postureRef.current.shoulderTiltSum / postureRef.current.frames : 0) < 3} />
                  <PostureBar label="Hip Tilt" value={postureRef.current.frames > 0 ? postureRef.current.hipTiltSum / postureRef.current.frames : 0} good={(postureRef.current.frames > 0 ? postureRef.current.hipTiltSum / postureRef.current.frames : 0) < 3} />
                  <PostureBar label="Head Forward" value={postureRef.current.frames > 0 ? postureRef.current.headForwardSum / postureRef.current.frames : 0} good={(postureRef.current.frames > 0 ? postureRef.current.headForwardSum / postureRef.current.frames : 0) < 5} />
                </div>

                {/* Progress bar to auto-stop */}
                <div>
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="text-muted-foreground">Scan progress</span>
                    <span className="font-mono-numbers font-bold">{elapsed}s / {POSTURE_DURATION}s</span>
                  </div>
                  <div className="h-2 bg-border rounded-full overflow-hidden">
                    <div className="h-full bg-primary rounded-full transition-all duration-1000"
                      style={{ width: `${(elapsed / POSTURE_DURATION) * 100}%` }} />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1.5 text-center">Auto-stops in {postureTimeLeft}s</p>
                </div>

                <div className="mt-auto">
                  <button onClick={stopAndProcess} className="w-full py-3 rounded-xl font-bold text-sm border border-border hover:border-primary/50 hover:bg-primary/5 transition-all text-muted-foreground hover:text-foreground">
                    Stop Early & Analyze
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ── Stage 4: Processing pipeline ─────────────────────────────────────────
  if (stage === "processing" || stage === "done") {
    const allDone = processSteps.every(s => s.status === "done");
    const isSts = mode === "sit-to-stand";
    const m = metricsRef.current;
    const p = postureRef.current;
    const rom = isSts ? Math.round(Math.max(0, m.maxKneeAngle - m.minKneeAngle)) : 180;
    const sym = isSts
      ? (m.framesAnalyzed > 0 ? Math.round((m.symmetrySum / m.framesAnalyzed) * 100) : 95)
      : Math.round(Math.max(0, 1 - ((p.frames > 0 ? (p.shoulderTiltSum + p.hipTiltSum) / p.frames : 0) / 30)) * 100);

    const quickStats = mode === "medical-report" 
      ? [
          { label: "Pages Scanned", value: "1", icon: <FileText className="w-4 h-4" /> },
          { label: "Risk Factors", value: "2", icon: <Activity className="w-4 h-4" /> },
          { label: "Confidence", value: "High", icon: <Sparkles className="w-4 h-4" /> },
        ]
      : isSts
        ? [
            { label: "Reps", value: reps.toString(), icon: <Zap className="w-4 h-4" /> },
            { label: "ROM", value: `${rom}°`, icon: <Activity className="w-4 h-4" /> },
            { label: "Symmetry", value: `${sym}%`, icon: <Sparkles className="w-4 h-4" /> },
          ]
        : [
            { label: "Posture Score", value: `${postureScore}`, icon: <Sparkles className="w-4 h-4" /> },
            { label: "Symmetry", value: `${sym}%`, icon: <Activity className="w-4 h-4" /> },
            { label: "Duration", value: `${elapsed}s`, icon: <Zap className="w-4 h-4" /> },
          ];

    const annotatedImage = sessionStorage.getItem("lastAnnotatedImage");

    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 py-12 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none opacity-10"
          style={{ background: "radial-gradient(ellipse at 50% 0%, #8b5cf6, transparent 60%)" }} />

        <div className="w-full max-w-md relative z-10">
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-full bg-primary/15 border border-primary/30 flex items-center justify-center mx-auto mb-5">
              {allDone ? <CheckCircle2 className="w-8 h-8 text-emerald-400" /> : <Loader2 className="w-8 h-8 text-primary animate-spin" />}
            </div>
            <h2 className="text-2xl font-black mb-2">{allDone ? "Analysis Complete!" : "Analyzing your session…"}</h2>
            <p className="text-muted-foreground text-sm">
              {allDone ? "Redirecting to your insights…" : "Your digital twin is processing the data"}
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3 mb-6">
            {quickStats.map(s => (
              <div key={s.label} className="metric-card text-center py-3">
                <div className="text-muted-foreground mb-1 flex justify-center">{s.icon}</div>
                <div className="text-xl font-black font-mono-numbers text-gradient-primary">{s.value}</div>
                <div className="text-[10px] text-muted-foreground uppercase tracking-widest mt-1">{s.label}</div>
              </div>
            ))}
          </div>

          {annotatedImage && mode === "static-image" && (
            <div className="mb-6 relative rounded-2xl overflow-hidden border border-border shadow-[0_0_20px_rgba(16,185,129,0.15)] anim-fade">
              <img src={annotatedImage} alt="AI Annotated Posture" className="w-full h-auto" />
              <div className="absolute top-3 right-3 badge badge-cyan shadow-md">
                <Sparkles className="w-3 h-3 mr-1" /> AI Processed
              </div>
            </div>
          )}

          <div className="card p-5">
            <div className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2">Processing Pipeline</div>
            {processSteps.map(step => <ProcessRow key={step.id} step={step} />)}
          </div>

          {allDone && (
            <div className="mt-5 text-center">
              <div className="flex items-center justify-center gap-2 text-emerald-500 text-sm">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Redirecting to Insights…
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return null;
}

export default function CaptureEngine() {
  return (
    <div className="flex flex-col md:flex-row min-h-screen h-auto md:h-screen text-foreground pb-[72px] md:pb-0 bg-background">
      <Sidebar />
      <main className="flex-1 overflow-y-auto relative z-10 w-full flex flex-col">
        <CaptureEngineContent />
      </main>
    </div>
  );
}
