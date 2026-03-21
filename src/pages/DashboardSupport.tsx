/**
 * Customer Service / Support Page
 *
 * Users can send messages to the Share The Link admin team
 * and view their conversation history.
 */
import { useState, useEffect, useRef, useCallback } from "react";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { MobileSidebar } from "@/components/dashboard/MobileSidebar";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useUserProfile } from "@/hooks/useUserProfile";
import {
  MessageCircle, Send, Loader2, HelpCircle, Clock, CheckCheck,
  AlertCircle, Paperclip, Smile
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

interface SupportMessage {
  id: string;
  user_id: string;
  sender_type: "user" | "admin";
  message: string;
  is_read: boolean;
  created_at: string;
  admin_name?: string | null;
}

interface SupportTicket {
  id: string;
  user_id: string;
  subject: string;
  status: "open" | "in_progress" | "resolved" | "closed";
  priority: "low" | "normal" | "high" | "urgent";
  category: string;
  created_at: string;
  updated_at: string;
}

const CATEGORIES = [
  { value: "general", label: "General Question" },
  { value: "billing", label: "Billing & Payments" },
  { value: "technical", label: "Technical Issue" },
  { value: "feature", label: "Feature Request" },
  { value: "account", label: "Account Help" },
  { value: "streaming", label: "Live Streaming" },
  { value: "shop", label: "My Shop / Products" },
  { value: "other", label: "Other" },
];

const PRIORITY_COLORS: Record<string, string> = {
  low: "bg-gray-100 text-gray-700",
  normal: "bg-blue-100 text-blue-700",
  high: "bg-amber-100 text-amber-700",
  urgent: "bg-red-100 text-red-700",
};

const STATUS_COLORS: Record<string, string> = {
  open: "bg-green-100 text-green-700",
  in_progress: "bg-blue-100 text-blue-700",
  resolved: "bg-purple-100 text-purple-700",
  closed: "bg-gray-100 text-gray-700",
};

const DashboardSupport = () => {
  const { toast } = useToast();
  const { profile } = useUserProfile();
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [activeTicket, setActiveTicket] = useState<SupportTicket | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [messageText, setMessageText] = useState("");
  const [showNewTicket, setShowNewTicket] = useState(false);
  const [newTicket, setNewTicket] = useState({ subject: "", category: "general", priority: "normal", message: "" });
  const [userId, setUserId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => { scrollToBottom(); }, [messages]);

  // Fetch tickets
  const fetchTickets = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    setUserId(user.id);

    const { data, error } = await supabase
      .from("support_tickets")
      .select("*")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false });

    if (!error && data) {
      setTickets(data as SupportTicket[]);
      // Auto-select most recent open ticket
      if (!activeTicket && data.length > 0) {
        setActiveTicket(data[0] as SupportTicket);
      }
    }
    setLoading(false);
  }, [activeTicket]);

  useEffect(() => { fetchTickets(); }, [fetchTickets]);

  // Fetch messages for active ticket
  useEffect(() => {
    if (!activeTicket) return;

    const fetchMessages = async () => {
      const { data, error } = await supabase
        .from("support_messages")
        .select("*")
        .eq("ticket_id", activeTicket.id)
        .order("created_at", { ascending: true });

      if (!error && data) {
        setMessages(data as SupportMessage[]);
        // Mark unread messages as read
        const unread = data.filter((m: any) => m.sender_type === "admin" && !m.is_read);
        if (unread.length > 0) {
          await supabase
            .from("support_messages")
            .update({ is_read: true })
            .in("id", unread.map((m: any) => m.id));
        }
      }
    };
    fetchMessages();

    // Real-time subscription for new messages
    const channel = supabase
      .channel(`support-${activeTicket.id}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "support_messages", filter: `ticket_id=eq.${activeTicket.id}` },
        (payload) => {
          const newMsg = payload.new as SupportMessage;
          setMessages((prev) => [...prev, newMsg]);
          if (newMsg.sender_type === "admin") {
            toast({ title: "New reply from support", description: newMsg.message.slice(0, 100) });
          }
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [activeTicket, toast]);

  // Create new ticket
  const handleCreateTicket = async () => {
    if (!userId || !newTicket.subject.trim() || !newTicket.message.trim()) {
      toast({ title: "Error", description: "Please fill in subject and message", variant: "destructive" });
      return;
    }
    setSending(true);
    try {
      const { data: ticket, error: ticketErr } = await supabase
        .from("support_tickets")
        .insert({
          user_id: userId,
          subject: newTicket.subject.trim(),
          category: newTicket.category,
          priority: newTicket.priority,
          status: "open",
        })
        .select()
        .single();

      if (ticketErr) throw ticketErr;

      // Add first message
      const { error: msgErr } = await supabase
        .from("support_messages")
        .insert({
          ticket_id: (ticket as SupportTicket).id,
          user_id: userId,
          sender_type: "user",
          message: newTicket.message.trim(),
          sender_name: profile?.full_name || profile?.username || "User",
        });

      if (msgErr) throw msgErr;

      setActiveTicket(ticket as SupportTicket);
      setTickets((prev) => [ticket as SupportTicket, ...prev]);
      setShowNewTicket(false);
      setNewTicket({ subject: "", category: "general", priority: "normal", message: "" });
      toast({ title: "Support ticket created", description: "Our team will respond shortly." });
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Failed to create ticket", variant: "destructive" });
    } finally {
      setSending(false);
    }
  };

  // Send message in existing ticket
  const handleSendMessage = async () => {
    if (!activeTicket || !messageText.trim() || !userId) return;
    setSending(true);
    try {
      const { error } = await supabase
        .from("support_messages")
        .insert({
          ticket_id: activeTicket.id,
          user_id: userId,
          sender_type: "user",
          message: messageText.trim(),
          sender_name: profile?.full_name || profile?.username || "User",
        });

      if (error) throw error;

      // Update ticket's updated_at and reopen if resolved
      await supabase
        .from("support_tickets")
        .update({
          updated_at: new Date().toISOString(),
          ...(activeTicket.status === "resolved" ? { status: "open" } : {}),
        })
        .eq("id", activeTicket.id);

      setMessageText("");
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const unreadCount = (ticketId: string) => {
    // We only track this per active ticket, so return 0 for simplicity
    return 0;
  };

  return (
    <div className="min-h-screen bg-muted">
      <Sidebar />
      <MobileSidebar />

      <main className="lg:ml-64 p-8 pt-20 lg:pt-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
                <MessageCircle className="w-6 h-6" />
                Customer Support
              </h1>
              <p className="text-muted-foreground">Get help from our team</p>
            </div>
            <Button
              onClick={() => setShowNewTicket(true)}
              className="gradient-button text-primary-foreground hover:opacity-90"
            >
              <MessageCircle className="w-4 h-4 mr-2" />
              New Conversation
            </Button>
          </div>

          <div className="grid lg:grid-cols-3 gap-6" style={{ height: "calc(100vh - 200px)" }}>
            {/* Ticket List */}
            <div className="bg-card rounded-2xl shadow-lg overflow-hidden flex flex-col">
              <div className="p-4 border-b border-border">
                <h2 className="font-semibold text-foreground">Conversations</h2>
                <p className="text-xs text-muted-foreground">{tickets.length} tickets</p>
              </div>
              <div className="flex-1 overflow-y-auto">
                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                  </div>
                ) : tickets.length === 0 ? (
                  <div className="p-6 text-center text-muted-foreground">
                    <HelpCircle className="w-10 h-10 mx-auto mb-3 opacity-30" />
                    <p className="text-sm">No conversations yet</p>
                    <p className="text-xs mt-1">Start a new conversation to get help</p>
                  </div>
                ) : (
                  tickets.map((ticket) => (
                    <button
                      key={ticket.id}
                      onClick={() => setActiveTicket(ticket)}
                      className={`w-full text-left p-4 border-b border-border hover:bg-muted/50 transition-colors ${
                        activeTicket?.id === ticket.id ? "bg-primary/5 border-l-4 border-l-primary" : ""
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-foreground truncate text-sm">{ticket.subject}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {CATEGORIES.find((c) => c.value === ticket.category)?.label}
                          </p>
                        </div>
                        <Badge className={`${STATUS_COLORS[ticket.status]} text-[10px] shrink-0`}>
                          {ticket.status.replace("_", " ")}
                        </Badge>
                      </div>
                      <p className="text-[10px] text-muted-foreground mt-1.5 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(ticket.updated_at).toLocaleDateString()}
                      </p>
                    </button>
                  ))
                )}
              </div>
            </div>

            {/* Chat Area */}
            <div className="lg:col-span-2 bg-card rounded-2xl shadow-lg overflow-hidden flex flex-col">
              {activeTicket ? (
                <>
                  {/* Chat Header */}
                  <div className="p-4 border-b border-border bg-muted/30">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-foreground">{activeTicket.subject}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge className={`${STATUS_COLORS[activeTicket.status]} text-[10px]`}>
                            {activeTicket.status.replace("_", " ")}
                          </Badge>
                          <Badge className={`${PRIORITY_COLORS[activeTicket.priority]} text-[10px]`}>
                            {activeTicket.priority}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {messages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`flex ${msg.sender_type === "user" ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                            msg.sender_type === "user"
                              ? "bg-primary text-white rounded-br-md"
                              : "bg-muted text-foreground rounded-bl-md"
                          }`}
                        >
                          {msg.sender_type === "admin" && msg.admin_name && (
                            <p className="text-xs font-semibold text-primary mb-1">
                              {msg.admin_name} (Support)
                            </p>
                          )}
                          <p className="text-sm whitespace-pre-wrap">{msg.message}</p>
                          <div className={`flex items-center gap-1 mt-1 ${
                            msg.sender_type === "user" ? "justify-end text-white/60" : "text-muted-foreground"
                          }`}>
                            <span className="text-[10px]">
                              {new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                            </span>
                            {msg.sender_type === "user" && (
                              <CheckCheck className={`w-3 h-3 ${msg.is_read ? "text-blue-300" : "text-white/40"}`} />
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Message Input */}
                  <div className="p-4 border-t border-border">
                    {activeTicket.status === "closed" ? (
                      <p className="text-center text-sm text-muted-foreground py-2">
                        This ticket is closed. Create a new conversation for further help.
                      </p>
                    ) : (
                      <div className="flex gap-2">
                        <Textarea
                          value={messageText}
                          onChange={(e) => setMessageText(e.target.value)}
                          onKeyDown={handleKeyDown}
                          placeholder="Type your message... (Enter to send, Shift+Enter for new line)"
                          className="min-h-[44px] max-h-[120px] resize-none"
                          rows={1}
                        />
                        <Button
                          onClick={handleSendMessage}
                          disabled={!messageText.trim() || sending}
                          className="gradient-button text-primary-foreground shrink-0 h-[44px] px-4"
                        >
                          {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                        </Button>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                  <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                    <MessageCircle className="w-10 h-10 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    Welcome to Support
                  </h3>
                  <p className="text-muted-foreground text-sm max-w-sm mb-6">
                    Select a conversation from the left or start a new one to get help from our team.
                  </p>
                  <Button onClick={() => setShowNewTicket(true)} className="gradient-button text-primary-foreground">
                    Start New Conversation
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* New Ticket Modal */}
      {showNewTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-foreground/50 backdrop-blur-sm" onClick={() => setShowNewTicket(false)} />
          <div className="relative w-full max-w-md bg-card rounded-2xl shadow-2xl p-6 animate-scale-in">
            <h2 className="text-xl font-bold text-foreground mb-4">New Conversation</h2>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-foreground">Subject *</label>
                <input
                  type="text"
                  value={newTicket.subject}
                  onChange={(e) => setNewTicket((t) => ({ ...t, subject: e.target.value }))}
                  placeholder="How can we help?"
                  className="w-full mt-1 px-4 py-3 rounded-xl border-2 border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium text-foreground">Category</label>
                  <select
                    value={newTicket.category}
                    onChange={(e) => setNewTicket((t) => ({ ...t, category: e.target.value }))}
                    className="w-full mt-1 px-3 py-2.5 rounded-xl border-2 border-border bg-background text-sm"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c.value} value={c.value}>{c.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground">Priority</label>
                  <select
                    value={newTicket.priority}
                    onChange={(e) => setNewTicket((t) => ({ ...t, priority: e.target.value }))}
                    className="w-full mt-1 px-3 py-2.5 rounded-xl border-2 border-border bg-background text-sm"
                  >
                    <option value="low">Low</option>
                    <option value="normal">Normal</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">Message *</label>
                <Textarea
                  value={newTicket.message}
                  onChange={(e) => setNewTicket((t) => ({ ...t, message: e.target.value }))}
                  placeholder="Describe your issue or question in detail..."
                  rows={4}
                  className="mt-1"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <Button variant="outline" className="flex-1" onClick={() => setShowNewTicket(false)}>Cancel</Button>
                <Button
                  className="flex-1 gradient-button text-primary-foreground"
                  onClick={handleCreateTicket}
                  disabled={sending}
                >
                  {sending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Send className="w-4 h-4 mr-2" />}
                  Send
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardSupport;
