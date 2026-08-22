import React from "react";
import { Sidebar } from "./components/Sidebar";
import { Users, Search, MessageSquare, Heart, Share2, PlusCircle, TrendingUp } from "lucide-react";

export default function CommunityPage() {
  const posts = [
    {
      id: 1,
      author: "Sarah K.",
      avatar: "SK",
      group: "ACL Reconstruction Support",
      time: "2 hours ago",
      title: "Finally achieved 120° flexion at 6 weeks!",
      content: "Just wanted to share a win. The first few weeks were absolutely brutal, but stick with the heel slides! Consistency is key.",
      likes: 24,
      comments: 8,
    },
    {
      id: 2,
      author: "David L.",
      avatar: "DL",
      group: "General Mobility",
      time: "5 hours ago",
      title: "Has anyone tried the new 'Shoulder Opener' routine?",
      content: "I added it to my daily program but I'm feeling some pinching in the anterior deltoid. Is this normal?",
      likes: 12,
      comments: 15,
    },
    {
      id: 3,
      author: "Marcus J.",
      avatar: "MJ",
      group: "Return to Running",
      time: "1 day ago",
      title: "Cleared for 5k! Here's my force asymmetry graph",
      content: "My PT finally cleared me for a 5k after hitting <10% asymmetry on single leg jumps. Don't give up!",
      likes: 89,
      comments: 22,
    }
  ];

  return (
    <div className="flex flex-col md:flex-row min-h-screen text-foreground md:overflow-hidden pb-[72px] md:pb-0 bg-background">
      <Sidebar />
      <main className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6">
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black flex items-center gap-2">
              <Users className="w-6 h-6 text-primary" /> Community
            </h1>
            <p className="text-muted-foreground text-sm mt-1">Connect, share, and recover together.</p>
          </div>
          <button className="btn-primary flex items-center gap-2 px-4 py-2">
            <PlusCircle className="w-4 h-4" /> New Post
          </button>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          
          {/* Main Feed */}
          <div className="lg:col-span-3 space-y-4">
            
            {/* Search Bar */}
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input 
                type="text" 
                placeholder="Search discussions, groups, or members..." 
                className="w-full bg-card border border-border rounded-lg py-2 pl-10 pr-4 text-sm focus:outline-none focus:border-primary transition-colors"
              />
            </div>

            {/* Posts */}
            <div className="space-y-4">
              {posts.map((post) => (
                <div key={post.id} className="card hover:border-border/80 transition-colors">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center font-bold text-sm">
                        {post.avatar}
                      </div>
                      <div>
                        <div className="font-semibold text-sm">{post.author}</div>
                        <div className="text-xs text-muted-foreground">in <span className="text-primary cursor-pointer hover:underline">{post.group}</span> • {post.time}</div>
                      </div>
                    </div>
                  </div>
                  <h3 className="font-bold text-lg mb-2">{post.title}</h3>
                  <p className="text-sm text-muted-foreground mb-4">{post.content}</p>
                  
                  <div className="flex items-center gap-6 border-t border-border pt-3">
                    <button className="flex items-center gap-2 text-muted-foreground hover:text-emerald-400 transition-colors text-xs font-semibold">
                      <Heart className="w-4 h-4" /> {post.likes}
                    </button>
                    <button className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors text-xs font-semibold">
                      <MessageSquare className="w-4 h-4" /> {post.comments} Comments
                    </button>
                    <button className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors text-xs font-semibold ml-auto">
                      <Share2 className="w-4 h-4" /> Share
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Sidebar */}
          <div className="space-y-6">
            <div className="card">
              <h3 className="font-bold mb-4 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-primary" /> Trending Groups
              </h3>
              <div className="space-y-3">
                {["ACL Reconstruction Support", "Rotator Cuff Rehab", "General Mobility & Stretching", "Return to Running"].map((group, i) => (
                  <div key={i} className="group cursor-pointer">
                    <div className="text-sm font-semibold group-hover:text-primary transition-colors truncate">{group}</div>
                    <div className="text-xs text-muted-foreground">{100 + i * 45} active members</div>
                  </div>
                ))}
              </div>
              <button className="btn-secondary w-full mt-4 text-xs">Explore Groups</button>
            </div>
          </div>
          
        </div>
      </main>
    </div>
  );
}
