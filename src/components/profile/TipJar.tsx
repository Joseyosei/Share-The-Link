import { useState } from "react";
import { Heart, Loader2, CheckCircle } from "lucide-react";

interface TipJarProps {
  username: string;
  suggestedAmounts?: number[];
  customMessage?: string;
  currency?: string;
  textColor?: string;
  creatorId?: string;
}

export const TipJar = ({
  username,
  suggestedAmounts = [3, 5, 10, 25],
  customMessage = "Support my work!",
  currency = "GBP",
  textColor = "text-white",
  creatorId,
}: TipJarProps) => {
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [customAmount, setCustomAmount] = useState("");
  const [tipperName, setTipperName] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success">("idle");

  const currencySymbol = currency === "GBP" ? "\u00a3" : currency === "EUR" ? "\u20ac" : "$";

  const handleTip = async () => {
    const amount = selectedAmount || Number(customAmount);
    if (!amount || amount < 1) return;

    setStatus("loading");
    try {
      // Open Stripe payment link with amount
      // For now, redirect to a tip checkout (can be wired to /api/create-tip-checkout)
      const params = new URLSearchParams({
        amount: String(amount * 100),
        currency,
        creator: username,
        ...(tipperName && { name: tipperName }),
        ...(message && { message }),
      });
      window.open(`/api/create-tip-checkout?${params.toString()}`, "_blank");
      setStatus("success");
      setTimeout(() => setStatus("idle"), 5000);
    } catch {
      setStatus("idle");
    }
  };

  if (status === "success") {
    return (
      <div className="w-full max-w-xs mx-auto mt-4 p-4 rounded-2xl bg-white/10 backdrop-blur-sm text-center">
        <CheckCircle className="w-6 h-6 mx-auto mb-2 text-green-400" />
        <p className={`text-sm font-medium ${textColor}`}>Thank you for your support!</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-xs mx-auto mt-4">
      <div className="rounded-2xl bg-white/10 backdrop-blur-sm p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Heart className="w-4 h-4 text-pink-400" />
          <span className={`text-sm font-medium ${textColor}`}>{customMessage}</span>
        </div>

        {/* Amount buttons */}
        <div className="grid grid-cols-4 gap-2">
          {suggestedAmounts.map((amt) => (
            <button
              key={amt}
              onClick={() => { setSelectedAmount(amt); setCustomAmount(""); }}
              className={`py-2 rounded-xl text-sm font-semibold transition-all ${
                selectedAmount === amt
                  ? "bg-white text-gray-900 shadow-lg scale-105"
                  : "bg-white/20 text-white hover:bg-white/30"
              }`}
            >
              {currencySymbol}{amt}
            </button>
          ))}
        </div>

        {/* Custom amount */}
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/50 text-sm">{currencySymbol}</span>
          <input
            type="number"
            min="1"
            placeholder="Custom"
            value={customAmount}
            onChange={(e) => { setCustomAmount(e.target.value); setSelectedAmount(null); }}
            className="w-full pl-7 pr-3 py-2 rounded-xl bg-white/20 text-sm placeholder:text-white/50 text-white border-0 outline-none focus:ring-2 focus:ring-white/30"
          />
        </div>

        {/* Optional name & message */}
        <input
          type="text"
          placeholder="Your name (optional)"
          value={tipperName}
          onChange={(e) => setTipperName(e.target.value)}
          className="w-full px-3 py-2 rounded-xl bg-white/20 text-sm placeholder:text-white/50 text-white border-0 outline-none focus:ring-2 focus:ring-white/30"
        />
        <textarea
          placeholder="Leave a message (optional)"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={2}
          className="w-full px-3 py-2 rounded-xl bg-white/20 text-sm placeholder:text-white/50 text-white border-0 outline-none focus:ring-2 focus:ring-white/30 resize-none"
        />

        <button
          onClick={handleTip}
          disabled={status === "loading" || (!selectedAmount && !customAmount)}
          className="w-full py-2.5 rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 text-white text-sm font-semibold transition-all hover:opacity-90 disabled:opacity-50 shadow-lg"
        >
          {status === "loading" ? (
            <Loader2 className="w-4 h-4 animate-spin mx-auto" />
          ) : (
            `Send ${selectedAmount ? `${currencySymbol}${selectedAmount}` : customAmount ? `${currencySymbol}${customAmount}` : "Tip"}`
          )}
        </button>
      </div>
    </div>
  );
};
