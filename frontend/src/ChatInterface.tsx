import { useState, useRef, useEffect } from "react";
import { Send, User, Brain, Loader2 } from "lucide-react";
import { api } from "./api";
import { auth } from "./firebase";

interface Message {
  role: "user" | "twin";
  content: string;
}

export default function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([
    { role: "twin", content: "Hello! I'm your PhysioTwin. How can I help you today? You can ask me about your latest stats or ask for advice." }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [fetchingHistory, setFetchingHistory] = useState(true);

  const fetchHistory = async () => {
    try {
      const uid = auth.currentUser?.uid || "test-user";
      const history = await api.getChatHistory(uid);
      if (history && history.length > 0) {
        setMessages(history);
      }
    } catch (e) {
      console.error("Failed to load chat history", e);
    } finally {
      setFetchingHistory(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const handleClear = async () => {
    if (!window.confirm("Are you sure you want to clear your chat history?")) return;
    try {
      const uid = auth.currentUser?.uid || "test-user";
      await api.clearChatHistory(uid);
      setMessages([
        { role: "twin", content: "Hello! I'm your PhysioTwin. How can I help you today? You can ask me about your latest stats or ask for advice." }
      ]);
    } catch (e) {
      console.error("Failed to clear chat history", e);
    }
  };

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMsg = input.trim();
    setInput("");
    const newMessages: Message[] = [...messages, { role: "user", content: userMsg }];
    setMessages(newMessages);
    setLoading(true);

    try {
      const uid = auth.currentUser?.uid || "test-user";
      // Convert to API format
      const apiMessages = newMessages.map(m => ({
        role: m.role === "twin" ? "assistant" : "user",
        content: m.content
      }));
      
      const res = await api.chatWithTwin(uid, apiMessages);
      setMessages([...newMessages, { role: "twin", content: res.response }]);
    } catch (e) {
      setMessages([...newMessages, { role: "twin", content: "Sorry, I am having trouble connecting right now." }]);
    }
    
    setLoading(false);
  };

  return (
    <div className="flex flex-col h-full bg-card rounded-xl border border-border shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-border bg-muted/30">
        <div className="flex items-center gap-2">
          <Brain className="w-5 h-5 text-primary" />
          <div>
            <div className="text-sm font-bold">Interactive Twin</div>
            <div className="text-xs text-muted-foreground">Ask me anything</div>
          </div>
        </div>
        <button
          onClick={handleClear}
          className="text-[10px] text-red-400 hover:text-red-300 font-bold hover:underline shrink-0"
        >
          Clear History
        </button>
      </div>


      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {messages.map((msg, i) => (
          <div key={i} className={`flex items-start gap-2 ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
            <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${msg.role === "user" ? "bg-slate-200" : "bg-primary text-white"}`}>
              {msg.role === "user" ? <User className="w-3 h-3 text-slate-600" /> : <Brain className="w-3 h-3" />}
            </div>
            <div className={`text-xs px-3 py-2 rounded-xl max-w-[85%] leading-relaxed ${
              msg.role === "user" 
                ? "bg-slate-100 text-slate-800 rounded-tr-sm" 
                : "bg-primary/10 text-foreground border border-primary/20 rounded-tl-sm"
            }`}>
              {msg.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex items-start gap-2">
            <div className="w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center shrink-0">
              <Brain className="w-3 h-3" />
            </div>
            <div className="text-xs px-3 py-2 rounded-xl bg-primary/10 border border-primary/20 rounded-tl-sm flex items-center">
              <Loader2 className="w-3 h-3 animate-spin text-primary" />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-3 border-t border-border bg-background">
        <div className="relative">
          <input 
            type="text" 
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleSend()}
            placeholder="Ask about your stats..."
            className="w-full bg-muted border border-border rounded-full py-2 pl-4 pr-10 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
            disabled={loading}
          />
          <button 
            onClick={handleSend}
            disabled={loading || !input.trim()}
            className="absolute right-1.5 top-1.5 w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center disabled:opacity-50 hover:bg-primary/90 transition-colors"
          >
            <Send className="w-3 h-3 ml-0.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
