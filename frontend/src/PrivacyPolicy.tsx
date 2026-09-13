import React from "react";
import { Sidebar } from "./components/Sidebar";
import { ShieldCheck, Lock, Cpu, Eye, FileText, CheckCircle2, ArrowLeft } from "lucide-react";
import { useLocation } from "wouter";

export default function PrivacyPolicy() {
  const [, setLocation] = useLocation();

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-slate-950 text-foreground pb-20 md:pb-0">
      <Sidebar />

      <main className="flex-1 overflow-y-auto p-4 md:p-10 space-y-8 max-w-4xl mx-auto w-full pt-12 md:pt-10">
        
        {/* Top Header Navigation */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <button 
            onClick={() => setLocation("/")}
            className="flex items-center gap-2 text-slate-400 hover:text-emerald-400 text-sm font-semibold transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Dashboard
          </button>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 text-xs font-bold uppercase tracking-wider">
            <ShieldCheck className="w-3.5 h-3.5" /> HIPAA & GDPR Compliant Architecture
          </div>
        </div>

        <header className="space-y-2">
          <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight">
            Privacy Policy & Data Security Charter
          </h1>
          <p className="text-slate-400 text-sm leading-relaxed">
            Effective Date: September 2026 · PhysioTwin Autonomous Kinematics Engine
          </p>
        </header>

        {/* 100% On-Device Banner */}
        <div className="bg-slate-900 border border-emerald-500/40 rounded-2xl p-6 relative overflow-hidden shadow-xl space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center shrink-0">
              <Eye className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">100% On-Device Computer Vision Privacy</h2>
              <p className="text-xs text-emerald-400 font-semibold mt-0.5">Zero Video Frame Network Transmission</p>
            </div>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            PhysioTwin utilizes Google MediaPipe Tasks Vision running entirely inside your client browser’s WebAssembly (WASM) execution environment. Video feeds captured via smartphone, webcam, or tablet cameras are analyzed frame-by-frame directly in system RAM to compute 33 3D spatial keypoints. <strong>No video feeds, images, or raw camera streams are ever recorded, saved to disk, or transmitted to any remote server.</strong>
          </p>
        </div>

        {/* Core Security Principles Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 space-y-3">
            <div className="flex items-center gap-2.5 text-white font-bold text-base">
              <Lock className="w-5 h-5 text-emerald-400" />
              <span>AES-128 Fernet Token Encryption</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Tokens for external fitness integrations (Strava, Google Health/Fitbit, Hevy) are symmetrically encrypted at rest using AES-128-CBC Fernet cryptography (`STRAVA_TOKEN_ENCRYPTION_SECRET`). Plaintext API tokens are never exposed or stored in raw database columns.
            </p>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 space-y-3">
            <div className="flex items-center gap-2.5 text-white font-bold text-base">
              <Cpu className="w-5 h-5 text-emerald-400" />
              <span>Anonymized Diagnostic Processing</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Biomechanical joint angles, Acute-to-Chronic Workload Ratios (ACWR), and numerical symmetry scores processed by Meta Llama 3.1 LLM models are fully stripped of personal identifiers to safeguard user confidentiality.
            </p>
          </div>
        </div>

        {/* Detailed Sections */}
        <div className="space-y-6 text-sm text-slate-300 leading-relaxed">
          <section className="bg-slate-900/50 border border-slate-800/80 rounded-xl p-6 space-y-3">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Information We Process
            </h3>
            <ul className="list-disc pl-5 space-y-1.5 text-xs text-slate-400">
              <li><strong>Kinematic Telemetry</strong>: Derived 3D joint angles, bilateral symmetry percentages, range of motion values, and movement speeds.</li>
              <li><strong>User Account Details</strong>: Authenticated Google Auth UID, email address, and demographic baselines (age, height, weight).</li>
              <li><strong>Connected Fitness Logs</strong>: Sync records from Strava, Fitbit, Hevy, and Nutritionix as explicitly authorized by the user.</li>
              <li><strong>OCR Clinical Uploads</strong>: Document summaries processed on demand via local OCR parsers.</li>
            </ul>
          </section>

          <section className="bg-slate-900/50 border border-slate-800/80 rounded-xl p-6 space-y-3">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <FileText className="w-4 h-4 text-emerald-400" /> Clinical & Medical Disclaimer
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              PhysioTwin is an artificial intelligence platform designed to assist athletes, individuals, and physical therapists in tracking movement quality, athletic capability, and ergonomic form. PhysioTwin does <strong>not</strong> provide formal medical advice, diagnosis, or treatment for acute physical injuries. Users should consult a qualified physician or licensed physical therapist before commencing new rehabilitation programs.
            </p>
          </section>
        </div>

        {/* Footer */}
        <div className="border-t border-slate-800 pt-6 text-center text-xs text-slate-500">
          For privacy inquiries or account data deletion requests, contact <span className="text-emerald-400">privacy@physiotwin.ai</span>.
        </div>

      </main>
    </div>
  );
}
