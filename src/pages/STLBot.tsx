import { useState, useRef, useEffect } from "react";
import { Bot, Send, Loader2, Sparkles, Trash2, Link as LinkIcon, Palette, BarChart3, Calendar, ShoppingBag, User, Globe, Zap, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { MobileSidebar } from "@/components/dashboard/MobileSidebar";
import { supabase } from "@/integrations/supabase/client";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  toolsUsed?: boolean;
}

const QUICK_ACTIONS = [
  { label: "Show my links", icon: LinkIcon, prompt: "Show me all my current links" },
  { label: "View analytics", icon: BarChart3, prompt: "Give me a summary of my analytics" },
  { label: "Update my bio", icon: User, prompt: "Help me write a better bio" },
  { label: "Change theme", icon: Palette, prompt: "What themes are available? Show my current one" },
  { label: "View bookings", icon: Calendar, prompt: "Show my upcoming bookings" },
  { label: "View products", icon: ShoppingBag, prompt: "Show my digital products" },
  { label: "Distribute links", icon: Zap, prompt: "Help me distribute my links to social media platforms" },
  { label: "Search the web", icon: Globe, prompt: "Search for tips on growing a link-in-bio audience" },
];

const STLBot = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Load conversation from sessionStorage
  useEffect(() => {
    const saved = sessionStorage.getItem("stl-bot-chat");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setMessages(parsed.map((m: any) => ({ ...m, timestamp: new Date(m.timestamp) })));
      } catch { /* ignore */ }
    }
  }, []);

  // Save conversation to sessionStorage
  useEffect(() => {
    if (messages.length > 0) {
      sessionStorage.setItem("stl-bot-chat", JSON.stringify(messages));
    }
  }, [messages]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  // Auto-resize textarea
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    e.target.style.height = "auto";
    e.target.style.height = Math.min(e.target.scrollHeight, 150) + "px";
  };

  const sendMessage = async (content: string) => {
    if (!content.trim() || isLoading) return;

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: content.trim(),
      timestamp: new Date(),
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput("");
    if (inputRef.current) {
      inputRef.current.style.height = "auto";
    }
    setIsLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const apiMessages = newMessages.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const response = await fetch("/api/ai-agent?action=chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ messages: apiMessages }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || `Request failed (${response.status})`);
      }

      const data = await response.json();

      const assistantMessage: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: data.reply,
        timestamp: new Date(),
        toolsUsed: data.toolsUsed,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      const errorMessage: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: error instanceof Error
          ? `Sorry, something went wrong: ${error.message}`
          : "Sorry, I couldn't process that. Please try again.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const clearChat = () => {
    setMessages([]);
    sessionStorage.removeItem("stl-bot-chat");
  };

  // Simple markdown-like rendering
  const renderContent = (content: string) => {
    return content.split("\n").map((line, i) => {
      // Strip markdown headings and render as bold text
      let rendered = line.replace(/^#{1,4}\s+(.+)/, "<strong>$1</strong>");
      // Bold
      rendered = rendered.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
      // Inline code
      rendered = rendered.replace(/`(.+?)`/g, '<code class="px-1.5 py-0.5 rounded bg-muted text-sm font-mono">$1</code>');
      // Bullet points
      if (rendered.startsWith("- ") || rendered.startsWith("• ")) {
        rendered = `<span class="flex gap-2"><span class="text-primary mt-0.5">•</span><span>${rendered.slice(2)}</span></span>`;
      }
      // Numbered lists
      const numMatch = rendered.match(/^(\d+)\.\s(.+)/);
      if (numMatch) {
        rendered = `<span class="flex gap-2"><span class="text-primary font-medium">${numMatch[1]}.</span><span>${numMatch[2]}</span></span>`;
      }

      return (
        <span
          key={i}
          className={`block ${line === "" ? "h-2" : ""}`}
          dangerouslySetInnerHTML={{ __html: rendered }}
        />
      );
    });
  };

  return (
    <div className="min-h-screen bg-muted">
      <Sidebar />
      <MobileSidebar />

      <main className="lg:ml-64 flex flex-col h-screen pt-16 lg:pt-0">
        {/* Header */}
        <div className="flex-shrink-0 border-b border-border bg-card px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between max-w-4xl mx-auto">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center shadow-lg">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-foreground">STL Bot</h1>
                <p className="text-xs text-muted-foreground">
                  Your AI assistant for Share The Link
                </p>
              </div>
            </div>
            {messages.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearChat}
                className="text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="w-4 h-4 mr-1" />
                Clear
              </Button>
            )}
          </div>
        </div>

        {/* Messages area */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-6">
          <div className="max-w-4xl mx-auto space-y-6">
            {/* Welcome state */}
            {messages.length === 0 && (
              <div className="text-center py-12">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <Bot className="w-10 h-10 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-foreground mb-2">
                  Hi! I'm STL Bot
                </h2>
                <p className="text-muted-foreground max-w-md mx-auto mb-8">
                  I can help you manage your Share The Link profile — add links, update your bio,
                  change themes, check analytics, distribute links, and more. Just ask!
                </p>

                {/* Quick actions */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 max-w-2xl mx-auto">
                  {QUICK_ACTIONS.map((action) => (
                    <button
                      key={action.label}
                      onClick={() => sendMessage(action.prompt)}
                      className="flex items-center gap-2 px-3 py-2.5 rounded-xl border border-border bg-card hover:bg-accent text-sm text-left transition-colors"
                    >
                      <action.icon className="w-4 h-4 text-primary flex-shrink-0" />
                      <span className="text-foreground truncate">{action.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Message bubbles */}
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-3 ${message.role === "user" ? "justify-end" : "justify-start"}`}
              >
                {message.role === "assistant" && (
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center flex-shrink-0 mt-1">
                    <Bot className="w-4 h-4 text-white" />
                  </div>
                )}
                <div
                  className={`max-w-[80%] sm:max-w-[70%] rounded-2xl px-4 py-3 ${
                    message.role === "user"
                      ? "bg-primary text-primary-foreground rounded-br-md"
                      : "bg-card border border-border text-foreground rounded-bl-md shadow-sm"
                  }`}
                >
                  <div className="text-sm leading-relaxed">
                    {message.role === "assistant"
                      ? renderContent(message.content)
                      : message.content}
                  </div>
                  {message.toolsUsed && (
                    <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                      <Sparkles className="w-3 h-3" />
                      Used tools to answer
                    </div>
                  )}
                  <p className="text-[10px] mt-1 opacity-50">
                    {message.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
                {message.role === "user" && (
                  <div className="w-8 h-8 rounded-lg bg-foreground/10 flex items-center justify-center flex-shrink-0 mt-1">
                    <User className="w-4 h-4 text-foreground" />
                  </div>
                )}
              </div>
            ))}

            {/* Loading indicator */}
            {isLoading && (
              <div className="flex gap-3 justify-start">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center flex-shrink-0">
                  <Bot className="w-4 h-4 text-white" />
                </div>
                <div className="bg-card border border-border rounded-2xl rounded-bl-md px-4 py-3 shadow-sm">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    STL Bot is thinking...
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input area */}
        <div className="flex-shrink-0 border-t border-border bg-card px-4 sm:px-6 py-3">
          <form onSubmit={handleSubmit} className="max-w-4xl mx-auto">
            <div className="flex items-end gap-2">
              <div className="flex-1 relative">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={handleInputChange}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask STL Bot anything... (e.g., 'Add a link to my YouTube channel')"
                  rows={1}
                  className="w-full resize-none rounded-xl border-2 border-border bg-background px-4 py-3 pr-12 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                  disabled={isLoading}
                />
              </div>
              <Button
                type="submit"
                disabled={!input.trim() || isLoading}
                className="h-[46px] w-[46px] rounded-xl gradient-button text-primary-foreground hover:opacity-90 flex-shrink-0"
                size="icon"
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Send className="w-5 h-5" />
                )}
              </Button>
            </div>
            <p className="text-[10px] text-muted-foreground text-center mt-2">
              STL Bot can make mistakes. Changes made by the bot are applied instantly.
            </p>
          </form>
        </div>
      </main>
    </div>
  );
};

export default STLBot;
