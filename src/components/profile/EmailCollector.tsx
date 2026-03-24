import { useState } from "react";
import { Mail, CheckCircle, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface EmailCollectorProps {
  username: string;
  textColor?: string;
  buttonColor?: string;
}

export const EmailCollector = ({ username, textColor = "text-white", buttonColor }: EmailCollectorProps) => {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setStatus("loading");
    try {
      const { data, error } = await supabase.rpc("subscribe_to_creator", {
        creator_username: username,
        subscriber_email: email.trim(),
        subscriber_name: name.trim() || null,
      });

      if (error) throw error;
      if (data === false) throw new Error("Creator not found");

      setStatus("success");
      setEmail("");
      setName("");
    } catch (err: any) {
      setStatus("error");
      setErrorMsg(err?.message || "Something went wrong");
      setTimeout(() => setStatus("idle"), 3000);
    }
  };

  if (status === "success") {
    return (
      <div className="w-full max-w-xs mx-auto mt-4 p-4 rounded-2xl bg-white/10 backdrop-blur-sm text-center">
        <CheckCircle className={`w-6 h-6 mx-auto mb-2 text-green-400`} />
        <p className={`text-sm font-medium ${textColor}`}>You're subscribed!</p>
        <p className={`text-xs ${textColor} opacity-70 mt-1`}>Thanks for joining the list.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-xs mx-auto mt-4">
      <div className="rounded-2xl bg-white/10 backdrop-blur-sm p-4 space-y-2">
        <div className="flex items-center gap-2 mb-2">
          <Mail className={`w-4 h-4 ${textColor} opacity-70`} />
          <span className={`text-sm font-medium ${textColor}`}>Stay connected</span>
        </div>
        <input
          type="text"
          placeholder="Your name (optional)"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full px-3 py-2 rounded-xl bg-white/20 text-sm placeholder:text-white/50 text-white border-0 outline-none focus:ring-2 focus:ring-white/30"
        />
        <input
          type="email"
          placeholder="your@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full px-3 py-2 rounded-xl bg-white/20 text-sm placeholder:text-white/50 text-white border-0 outline-none focus:ring-2 focus:ring-white/30"
        />
        <button
          type="submit"
          disabled={status === "loading"}
          className="w-full py-2.5 rounded-xl text-sm font-semibold transition-all hover:opacity-90 disabled:opacity-50"
          style={{ backgroundColor: buttonColor || "rgba(255,255,255,0.25)", color: "white" }}
        >
          {status === "loading" ? (
            <Loader2 className="w-4 h-4 animate-spin mx-auto" />
          ) : (
            "Subscribe"
          )}
        </button>
        {status === "error" && (
          <p className="text-xs text-red-300 text-center">{errorMsg}</p>
        )}
      </div>
    </form>
  );
};
