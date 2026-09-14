import React, { useState } from "react";
import { Sidebar } from "./components/Sidebar";
import { BookOpen, Search, Play, FileText, ChevronRight, X, CheckCircle2, Sparkles, Activity, Shield, Dumbbell, Zap } from "lucide-react";

interface Article {
  id: string;
  title: string;
  category: string;
  type: "article" | "video";
  readTime: string;
  summary: string;
  content: {
    intro: string;
    sections: { heading: string; body: string }[];
    keyTakeaways: string[];
    recommendedExercises: string[];
  };
}

const WIKI_ARTICLES: Article[] = [
  {
    id: "knee-anatomy",
    title: "The Anatomy of the Knee Joint & Ligamentous Stability",
    category: "Anatomy",
    type: "article",
    readTime: "5 min",
    summary: "Deep dive into the tibiofemoral and patellofemoral structures, meniscus cushions, and cruciate ligaments.",
    content: {
      intro: "The knee joint is a complex modified hinge joint subject to extreme biomechanical shear forces during athletic movements. Understanding its underlying anatomy helps prevent dynamic varus/valgus collapse and patellar tracking issues.",
      sections: [
        {
          heading: "1. Cruciate & Collateral Ligaments",
          body: "The Anterior Cruciate Ligament (ACL) prevents anterior translation of the tibia relative to the femur, while the Posterior Cruciate Ligament (PCL) restrains posterior displacement. Lateral stability is maintained by the MCL and LCL."
        },
        {
          heading: "2. Meniscal Shock Absorption",
          body: "The medial and lateral menisci are fibrocartilaginous discs that increase joint congruency and distribute load over 60% of joint surface area, reducing peak articular cartilage stress."
        },
        {
          heading: "3. Quad & Hip Abductor Interplay",
          body: "Dynamic stability relies on vastus medialis obliquus (VMO) timing and gluteus medius activation to resist dynamic knee valgus cave during landings."
        }
      ],
      keyTakeaways: [
        "Glute medius weakness directly increases knee valgus cave risk.",
        "Quad-to-hamstring ratio (H:Q ratio) should exceed 60% to protect the ACL.",
        "Dorsiflexion restriction forces knee rotation during squats."
      ],
      recommendedExercises: [
        "Banded Clamshells (3x15)",
        "Single-Leg Eccentric Step-Downs (3x10)",
        "Ankle Wall Mobilization (2x60s)"
      ]
    }
  },
  {
    id: "acl-rehab",
    title: "ACL Reconstruction Protocol: What to Expect",
    category: "Surgery",
    type: "video",
    readTime: "12 min",
    summary: "Phase-by-phase clinical roadmap from early extension recovery to return-to-sport clearance.",
    content: {
      intro: "A successful ACL reconstruction recovery requires strict adherence to biological graft maturation timelines (autograft vs allograft) and objective limb symmetry benchmarks.",
      sections: [
        {
          heading: "Phase 1: Early Extension & Graft Protection (Weeks 0-4)",
          body: "Primary goals include achieving full passive knee extension (0°), quads activation (quad sets, SLR without lag), and controlling joint effusion."
        },
        {
          heading: "Phase 2: Neuromuscular Control & Hypertrophy (Weeks 5-12)",
          body: "Focus shifts to closed kinetic chain exercises (squats, step-ups), single-leg balance stability, and normalizing gait mechanics without crutches."
        },
        {
          heading: "Phase 3: Plyometric Loading & Sport Return (Months 4-9+)",
          body: "Gradual introduction of straight-line jogging, change-of-direction drills, and biomechanical jump-landing camera tracking to verify >90% symmetry."
        }
      ],
      keyTakeaways: [
        "Full symmetrical extension (0°) is critical in week 1 to prevent arthrofibrosis.",
        "Limb Symmetry Index (LSI) must reach >90% before return-to-play clearance.",
        "Graft revascularization peaks between 6 to 12 months post-op."
      ],
      recommendedExercises: [
        "Isometric Quad Sets (3x10s holds)",
        "Banded Terminal Knee Extensions (3x15)",
        "Single-Leg Hop Testing (LSI check)"
      ]
    }
  },
  {
    id: "force-asymmetry",
    title: "Understanding Kinetic Force Asymmetry & Injury Risk",
    category: "Biomechanics",
    type: "article",
    readTime: "8 min",
    summary: "How left-to-right ground reaction force imbalances escalate joint wear and compensatory stress.",
    content: {
      intro: "Bilateral kinetic asymmetry above 15% forces the stronger limb to absorb excessive ground reaction forces, while overloading the weaker joint in dynamic deceleration.",
      sections: [
        {
          heading: "1. Measuring Limb Disparity",
          body: "Using markerless motion capture, we track left vs right knee flexion speed, angular velocity, and foot-ground contact duration during functional tests."
        },
        {
          heading: "2. Compensatory Kinematic Chain",
          body: "A quad force deficit on one side propagates upward into pelvic rotation and lumbar lateral flexion, predisposing the lower back to facet joint irritation."
        }
      ],
      keyTakeaways: [
        "Keep left/right force asymmetry below 10% for baseline health.",
        "Asymmetry during deceleration is a stronger predictor of re-injury than static strength.",
        "Single-leg functional training corrects side-to-side compensation."
      ],
      recommendedExercises: [
        "Single-Leg Romanian Deadlifts (3x10)",
        "Bulgarian Split Squats (3x8)",
        "Lateral Box Jumps (3x6)"
      ]
    }
  },
  {
    id: "running-protocol",
    title: "Phase 3: Return to Running & Deceleration Protocol",
    category: "Rehab Phases",
    type: "article",
    readTime: "10 min",
    summary: "Structured progression for re-introducing running, shuttle drills, and high-velocity braking.",
    content: {
      intro: "Transitioning from rehab strength work to continuous running requires passing objective readiness criteria: 30 single-leg calf raises, 20 single-leg squat reps, and no pain or swelling.",
      sections: [
        {
          heading: "Walk-to-Run Interval Progression",
          body: "Begin with a 1:1 interval (1 min jog, 1 min walk) for 20 minutes on flat synthetic surfaces, assessing joint reactivity 24 hours post-session."
        },
        {
          heading: "Deceleration & Multi-Directional Shuttles",
          body: "Braking forces exceed 3-4x bodyweight. Teach low center of mass, hip hinge loading, and strong core bracing during emergency stops."
        }
      ],
      keyTakeaways: [
        "Never progress volume if joint swelling occurs 24 hours post-run.",
        "Deceleration technique protects knees more than linear speed.",
        "Maintain 160-180 SPM cadence to reduce peak knee loading."
      ],
      recommendedExercises: [
        "Pogo Jumps (3x20s)",
        "Accelerate-Decelerate Shuttles (5x15m)",
        "Depth Drop to Stick Landing (3x6)"
      ]
    }
  },
  {
    id: "rotator-cuff",
    title: "Rotator Cuff Biomechanics & Scapular Dyskinesis",
    category: "Anatomy",
    type: "article",
    readTime: "7 min",
    summary: "Scapular positioning, humeral head centering, and preventing subacromial impingement.",
    content: {
      intro: "The rotator cuff (supraspinatus, infraspinatus, teres minor, subscapularis) centers the humeral head inside the shallow glenoid fossa during arm elevation.",
      sections: [
        {
          heading: "Subacromial Space & Impingement",
          body: "Forward shoulder posture reduces subacromial space height, causing tendon pinching against the acromion during overhead abduction."
        },
        {
          heading: "Scapulothoracic Rhythm",
          body: "Healthy overhead elevation follows a 2:1 ratio (2° humeral motion for every 1° scapular upward rotation). Serratus anterior weakness disrupts this pattern."
        }
      ],
      keyTakeaways: [
        "Face pulls and wall slides restore scapular upward rotation.",
        "Strengthen external rotators to balance dominant chest/lat muscles.",
        "Avoid overhead heavy presses if shoulder pinching is present."
      ],
      recommendedExercises: [
        "Cable Face Pulls (3x15)",
        "Banded External Rotations (3x15)",
        "Scapular Wall Slides (3x12)"
      ]
    }
  },
  {
    id: "core-stability",
    title: "Core Bracing Mechanics & Lumbar Spine Protection",
    category: "Biomechanics",
    type: "article",
    readTime: "6 min",
    summary: "Intra-abdominal pressure (IAP) management, anti-rotational core work, and pelvic control.",
    content: {
      intro: "True core stability is anti-movement: resisting rotation, lateral flexion, and excessive spinal extension under heavy lifting or dynamic athletic movement.",
      sections: [
        {
          heading: "The Intra-Abdominal Pressure Cylinder",
          body: "Bracing the transverse abdominis, diaphragm, and pelvic floor creates a rigid pneumatic cylinder that unloads peak compressive forces on L4/L5 discs."
        },
        {
          heading: "McGill Big 3 Core Protocol",
          body: "The Curl-up, Side Plank, and Bird-Dog build endurance in spinal stabilizer muscles without high spinal flexion shear loads."
        }
      ],
      keyTakeaways: [
        "Brace by expanding 360° outward rather than sucking in the stomach.",
        "Prioritize core endurance over short-duration max force strength.",
        "Anti-rotation exercises reduce shear stress on intervertebral discs."
      ],
      recommendedExercises: [
        "Pallof Press (3x12)",
        "McGill Bird-Dog (3x8 holds)",
        "Side Plank with Leg Abduction (3x20s)"
      ]
    }
  }
];

export default function WikiPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);

  const categories = ["all", "Anatomy", "Surgery", "Biomechanics", "Rehab Phases"];

  const filteredArticles = WIKI_ARTICLES.filter((art) => {
    const matchesSearch =
      !searchQuery ||
      art.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      art.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
      art.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = activeCategory === "all" || art.category.toLowerCase() === activeCategory.toLowerCase();
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="flex flex-col md:flex-row min-h-screen text-foreground md:overflow-hidden pb-24 md:pb-0 bg-black">
      <Sidebar />
      <main className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6 max-w-6xl mx-auto w-full pt-6 md:pt-10">
        
        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-800 pb-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-cyan-500/15 text-cyan-400 border border-cyan-500/30 flex items-center gap-1">
                <BookOpen className="w-3 h-3" /> Educational Knowledge Base
              </span>
            </div>
            <h1 className="text-3xl font-black tracking-tight text-white flex items-center gap-2">
              Biomechanical & Surgery Wiki
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              Explore evidence-based clinical guides, surgery protocols, and movement mechanics books.
            </p>
          </div>
        </header>

        {/* Search & Category Filter */}
        <div className="space-y-4">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search anatomy, ACL protocols, rotator cuff, or biomechanics..."
              className="w-full bg-slate-900 border border-slate-800 rounded-2xl py-3 pl-10 pr-4 text-sm text-white focus:outline-none focus:border-cyan-500 transition-colors shadow-lg placeholder:text-slate-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              >
                ✕
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer capitalize whitespace-nowrap ${
                  activeCategory === cat
                    ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 shadow-md shadow-cyan-500/10"
                    : "bg-slate-900 text-slate-400 hover:text-white border border-slate-800"
                }`}
              >
                {cat === "all" ? "All Books & Articles" : cat}
              </button>
            ))}
          </div>
        </div>

        {/* Articles & Books Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredArticles.map((art) => (
            <div
              key={art.id}
              onClick={() => setSelectedArticle(art)}
              className="bg-slate-900/80 border border-slate-800 hover:border-cyan-500/50 rounded-2xl p-5 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl hover:shadow-cyan-500/10 cursor-pointer flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="px-2.5 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-wider bg-purple-500/15 text-purple-300 border border-purple-500/30">
                    {art.category}
                  </span>
                  <div className="w-7 h-7 rounded-lg bg-slate-800 flex items-center justify-center text-slate-400 group-hover:text-cyan-400 group-hover:bg-cyan-500/10 transition-colors">
                    {art.type === "video" ? <Play className="w-3.5 h-3.5" /> : <FileText className="w-3.5 h-3.5" />}
                  </div>
                </div>
                <h3 className="font-extrabold text-base text-white mb-2 leading-snug group-hover:text-cyan-300 transition-colors">
                  {art.title}
                </h3>
                <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                  {art.summary}
                </p>
              </div>

              <div className="mt-5 pt-3 border-t border-slate-800 flex justify-between items-center text-xs font-semibold text-slate-400">
                <span className="font-mono text-[11px]">{art.readTime} read</span>
                <span className="text-cyan-400 font-bold group-hover:underline flex items-center gap-1">
                  Open Book Reader <ChevronRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>
          ))}
        </div>

        {filteredArticles.length === 0 && (
          <div className="text-center py-16 bg-slate-900/50 border border-slate-800 rounded-3xl space-y-3">
            <BookOpen className="w-12 h-12 text-slate-600 mx-auto" />
            <p className="text-slate-300 font-bold">No articles found matching "{searchQuery}"</p>
            <p className="text-xs text-slate-500">Try searching for keywords like knee, ACL, rotator cuff, or asymmetry.</p>
          </div>
        )}
      </main>

      {/* ── Interactive Book Reader Modal ── */}
      {selectedArticle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
            
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-800 flex items-start justify-between bg-slate-950/80">
              <div className="space-y-1.5 pr-4">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-wider bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                    {selectedArticle.category}
                  </span>
                  <span className="text-xs font-mono text-slate-400">• {selectedArticle.readTime} read</span>
                </div>
                <h2 className="text-xl font-black text-white leading-tight">{selectedArticle.title}</h2>
                <div className="text-xs text-slate-400 flex items-center gap-1.5 pt-1">
                  <Shield className="w-3.5 h-3.5 text-emerald-400" /> Reviewed by PhysioTwin Clinical Advisory Board
                </div>
              </div>
              <button
                onClick={() => setSelectedArticle(null)}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1 text-slate-300 text-xs leading-relaxed scrollbar-hide">
              <div className="bg-cyan-500/10 border border-cyan-500/20 p-4 rounded-2xl text-cyan-200 font-medium">
                {selectedArticle.content.intro}
              </div>

              {/* Sections */}
              <div className="space-y-5">
                {selectedArticle.content.sections.map((sec, idx) => (
                  <div key={idx} className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2">
                    <h4 className="font-extrabold text-sm text-white flex items-center gap-2">
                      <Sparkles className="w-3.5 h-3.5 text-cyan-400" /> {sec.heading}
                    </h4>
                    <p className="text-slate-300 leading-relaxed">{sec.body}</p>
                  </div>
                ))}
              </div>

              {/* Key Takeaways */}
              <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-2xl space-y-2">
                <h4 className="font-extrabold text-xs text-amber-300 uppercase tracking-widest flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-amber-400" /> Key Clinical Takeaways
                </h4>
                <ul className="space-y-1.5 pl-1">
                  {selectedArticle.content.keyTakeaways.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-slate-200">
                      <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Recommended Exercises */}
              <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-2xl space-y-2">
                <h4 className="font-extrabold text-xs text-emerald-300 uppercase tracking-widest flex items-center gap-1.5">
                  <Dumbbell className="w-3.5 h-3.5 text-emerald-400" /> Targeted Rehab Exercises
                </h4>
                <div className="flex flex-wrap gap-2 pt-1">
                  {selectedArticle.content.recommendedExercises.map((ex, idx) => (
                    <span key={idx} className="px-3 py-1 rounded-xl bg-slate-950 border border-emerald-500/30 text-emerald-300 font-bold text-[11px] flex items-center gap-1">
                      <Zap className="w-3 h-3 text-emerald-400" /> {ex}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-slate-800 bg-slate-950 text-right">
              <button
                onClick={() => setSelectedArticle(null)}
                className="px-6 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs transition-all cursor-pointer shadow-lg shadow-cyan-500/20"
              >
                Close Book Reader
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
