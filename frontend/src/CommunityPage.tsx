import React, { useState, useEffect } from "react";
import { Sidebar } from "./components/Sidebar";
import { Users, Search, MessageSquare, Heart, Share2, PlusCircle, TrendingUp, X, Loader } from "lucide-react";
import { api } from "./api";
import { auth } from "./firebase";

interface Post {
  id: string;
  author_name: string;
  group_name: string;
  title: string;
  content: string;
  likes: number;
  created_at: string;
}

const TRENDING_GROUPS = [
  "ACL Reconstruction Support",
  "Rotator Cuff Rehab",
  "General Mobility & Stretching",
  "Return to Running",
];

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function CommunityPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNew, setShowNew] = useState(false);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState({ title: "", content: "", group_name: TRENDING_GROUPS[0] });
  const [posting, setPosting] = useState(false);
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set());

  const uid = auth.currentUser?.uid || "anonymous";
  const displayName = auth.currentUser?.displayName || "Anonymous User";

  useEffect(() => {
    api.getCommunityPosts(30)
      .then(setPosts)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleLike = async (postId: string) => {
    if (likedIds.has(postId)) return; // prevent double-liking
    try {
      const updated = await api.likeCommunityPost(postId);
      setPosts(prev => prev.map(p => p.id === postId ? { ...p, likes: updated.likes } : p));
      setLikedIds(prev => new Set([...prev, postId]));
    } catch (e) {
      console.error("Failed to like post", e);
    }
  };

  const handlePost = async () => {
    if (!form.title.trim() || !form.content.trim()) return;
    setPosting(true);
    try {
      const created = await api.createCommunityPost(uid, {
        author_name: displayName,
        group_name: form.group_name,
        title: form.title,
        content: form.content,
      });
      // Reload list
      const fresh = await api.getCommunityPosts(30);
      setPosts(fresh);
      setForm({ title: "", content: "", group_name: TRENDING_GROUPS[0] });
      setShowNew(false);
    } catch (e) {
      console.error("Failed to create post", e);
    } finally {
      setPosting(false);
    }
  };

  const filtered = posts.filter(p =>
    p.title.toLowerCase().includes(search.toLowerCase()) ||
    p.content.toLowerCase().includes(search.toLowerCase()) ||
    p.group_name.toLowerCase().includes(search.toLowerCase())
  );

  // Group counts from real data
  const groupCounts = TRENDING_GROUPS.map(g => ({
    name: g,
    count: posts.filter(p => p.group_name === g).length,
  }));

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
          <button onClick={() => setShowNew(true)} className="btn-primary flex items-center gap-2 px-4 py-2">
            <PlusCircle className="w-4 h-4" /> New Post
          </button>
        </header>

        {/* New Post Modal */}
        {showNew && (
          <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => setShowNew(false)}>
            <div className="card w-full max-w-lg space-y-4" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-lg">Share with the Community</h3>
                <button onClick={() => setShowNew(false)}><X className="w-5 h-5" /></button>
              </div>
              <select
                value={form.group_name}
                onChange={e => setForm(f => ({ ...f, group_name: e.target.value }))}
                className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm"
              >
                {TRENDING_GROUPS.map(g => <option key={g}>{g}</option>)}
              </select>
              <input
                placeholder="Title (e.g. Hit 120° at week 6!)"
                value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm"
              />
              <textarea
                rows={4}
                placeholder="Share your experience, question, or milestone..."
                value={form.content}
                onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
                className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm resize-none"
              />
              <button
                onClick={handlePost}
                disabled={posting || !form.title.trim()}
                className="btn-primary w-full"
              >
                {posting ? "Posting..." : "Post to Community"}
              </button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Main Feed */}
          <div className="lg:col-span-3 space-y-4">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search discussions, groups, or members..."
                className="w-full bg-card border border-border rounded-lg py-2 pl-10 pr-4 text-sm focus:outline-none focus:border-primary transition-colors"
              />
            </div>

            {loading && (
              <div className="card text-center py-12 text-muted-foreground flex items-center justify-center gap-2">
                <Loader className="w-4 h-4 animate-spin" /> Loading community posts...
              </div>
            )}

            {!loading && filtered.length === 0 && (
              <div className="card text-center py-12 space-y-3">
                <Users className="w-10 h-10 text-muted-foreground mx-auto" />
                <p className="text-muted-foreground">
                  {search ? "No posts match your search." : "Be the first to post in the community!"}
                </p>
                {!search && (
                  <button onClick={() => setShowNew(true)} className="btn-primary mx-auto flex items-center gap-2 px-4 py-2">
                    <PlusCircle className="w-4 h-4" /> Create First Post
                  </button>
                )}
              </div>
            )}

            <div className="space-y-4">
              {filtered.map((post) => (
                <div key={post.id} className="card hover:border-border/80 transition-colors">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center font-bold text-sm">
                        {post.author_name.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-semibold text-sm">{post.author_name}</div>
                        <div className="text-xs text-muted-foreground">
                          in <span className="text-primary cursor-pointer hover:underline">{post.group_name}</span> • {timeAgo(post.created_at)}
                        </div>
                      </div>
                    </div>
                  </div>
                  <h3 className="font-bold text-lg mb-2">{post.title}</h3>
                  <p className="text-sm text-muted-foreground mb-4">{post.content}</p>

                  <div className="flex items-center gap-6 border-t border-border pt-3">
                    <button
                      onClick={() => handleLike(post.id)}
                      className={`flex items-center gap-2 transition-colors text-xs font-semibold ${likedIds.has(post.id) ? 'text-emerald-400' : 'text-muted-foreground hover:text-emerald-400'}`}
                    >
                      <Heart className={`w-4 h-4 ${likedIds.has(post.id) ? 'fill-current' : ''}`} /> {post.likes}
                    </button>
                    <button className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors text-xs font-semibold">
                      <MessageSquare className="w-4 h-4" /> Reply
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
                <TrendingUp className="w-4 h-4 text-primary" /> Active Groups
              </h3>
              <div className="space-y-3">
                {groupCounts.map(({ name, count }) => (
                  <div key={name} className="group cursor-pointer" onClick={() => setSearch(name)}>
                    <div className="text-sm font-semibold group-hover:text-primary transition-colors truncate">{name}</div>
                    <div className="text-xs text-muted-foreground">{count} post{count !== 1 ? 's' : ''}</div>
                  </div>
                ))}
              </div>
              <button onClick={() => setShowNew(true)} className="btn-secondary w-full mt-4 text-xs">
                Start a Discussion
              </button>
            </div>

            <div className="card bg-primary/5 border-primary/20">
              <p className="text-xs text-muted-foreground">
                <span className="font-bold text-foreground block mb-1">Community Guidelines</span>
                Be kind, share wins, ask questions. Never share medical advice — always consult your physiotherapist.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
