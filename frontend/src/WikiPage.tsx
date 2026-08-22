import React from "react";
import { Sidebar } from "./components/Sidebar";
import { BookOpen, Search, Play, FileText, ChevronRight } from "lucide-react";

export default function WikiPage() {
  const articles = [
    { title: "The Anatomy of the Knee", category: "Anatomy", type: "article", readTime: "5 min" },
    { title: "ACL Reconstruction: What to Expect", category: "Surgery", type: "video", readTime: "12 min" },
    { title: "Understanding Force Asymmetry", category: "Biomechanics", type: "article", readTime: "8 min" },
    { title: "Phase 3: Return to Running Protocol", category: "Rehab Phases", type: "article", readTime: "10 min" },
  ];

  return (
    <div className="flex flex-col md:flex-row min-h-screen text-foreground md:overflow-hidden pb-[72px] md:pb-0 bg-background">
      <Sidebar />
      <main className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6">
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black flex items-center gap-2">
              <BookOpen className="w-6 h-6 text-primary" /> Educational Wiki
            </h1>
            <p className="text-muted-foreground text-sm mt-1">Learn about biomechanics, surgery, and your recovery protocol.</p>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          
          <div className="lg:col-span-3 space-y-6">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input 
                type="text" 
                placeholder="Search for anatomy, conditions, or rehab guides..." 
                className="w-full bg-card border border-border rounded-lg py-3 pl-10 pr-4 text-sm focus:outline-none focus:border-primary transition-colors"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {articles.map((article, i) => (
                <div key={i} className="card hover:border-primary/50 hover:bg-card/80 transition-colors cursor-pointer flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="badge badge-purple text-[10px]">{article.category}</span>
                      {article.type === 'video' ? <Play className="w-4 h-4 text-muted-foreground" /> : <FileText className="w-4 h-4 text-muted-foreground" />}
                    </div>
                    <h3 className="font-bold text-lg mb-2 leading-tight">{article.title}</h3>
                  </div>
                  <div className="mt-4 pt-3 border-t border-border flex justify-between items-center text-xs font-semibold text-muted-foreground">
                    <span>{article.readTime}</span>
                    <span className="text-primary group-hover:underline flex items-center">Read <ChevronRight className="w-3 h-3 ml-0.5" /></span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-6">
            <div className="card space-y-3">
              <h3 className="font-bold border-b border-border pb-2 mb-4">Categories</h3>
              {["Anatomy Models", "Surgical Procedures", "Rehab Phases", "Biomechanics 101", "Nutrition & Tissue"].map((cat, i) => (
                <div key={i} className="text-sm text-muted-foreground hover:text-primary cursor-pointer transition-colors flex items-center justify-between">
                  {cat}
                  <ChevronRight className="w-3 h-3" />
                </div>
              ))}
            </div>
          </div>
          
        </div>
      </main>
    </div>
  );
}
