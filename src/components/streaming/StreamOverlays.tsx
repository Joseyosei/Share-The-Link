import { useState, useEffect, useRef, useCallback } from "react";
import { Target, BarChart3, Clock, Heart, Sparkles, X, Plus, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

// ── Tip Alert ────────────────────────────────────────────────────────
interface TipAlertProps {
  tipperName: string;
  amount: number;
  message?: string;
  currency?: string;
  onDone: () => void;
}

export const TipAlert = ({ tipperName, amount, message, currency = "$", onDone }: TipAlertProps) => {
  useEffect(() => {
    const timer = setTimeout(onDone, 5000);
    return () => clearTimeout(timer);
  }, [onDone]);

  return (
    <div className="animate-[slideInRight_0.5s_ease-out] pointer-events-none">
      <div className="bg-gradient-to-r from-amber-500/90 to-yellow-400/90 backdrop-blur-xl rounded-2xl p-4 shadow-2xl border border-amber-300/30 max-w-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-xl animate-bounce">
            💰
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-white text-sm">{tipperName} tipped {currency}{amount.toFixed(2)}!</p>
            {message && <p className="text-white/80 text-xs truncate mt-0.5">{message}</p>}
          </div>
        </div>
      </div>
    </div>
  );
};

// ── Stream Goal ──────────────────────────────────────────────────────
interface StreamGoalProps {
  currentAmount: number;
  goalAmount: number;
  goalTitle: string;
  currency?: string;
}

export const StreamGoal = ({ currentAmount, goalAmount, goalTitle, currency = "$" }: StreamGoalProps) => {
  const pct = Math.min((currentAmount / goalAmount) * 100, 100);

  return (
    <div className="bg-black/60 backdrop-blur-xl rounded-xl p-3 border border-white/10 max-w-xs">
      <div className="flex items-center gap-2 mb-2">
        <Target className="w-4 h-4 text-primary" />
        <span className="text-white text-xs font-semibold truncate">{goalTitle}</span>
      </div>
      <div className="h-3 bg-white/10 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-primary to-pink-500 rounded-full transition-all duration-1000 ease-out"
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="flex justify-between mt-1.5 text-[10px] text-white/70">
        <span>{currency}{currentAmount.toFixed(0)}</span>
        <span>{pct.toFixed(0)}%</span>
        <span>{currency}{goalAmount.toFixed(0)}</span>
      </div>
    </div>
  );
};

// ── Stream Poll ──────────────────────────────────────────────────────
interface PollOption {
  text: string;
  votes: number;
}

interface StreamPollProps {
  question: string;
  options: PollOption[];
  onVote: (index: number) => void;
  isActive: boolean;
  totalVotes: number;
  hasVoted?: boolean;
}

export const StreamPoll = ({ question, options, onVote, isActive, totalVotes, hasVoted }: StreamPollProps) => {
  return (
    <div className="bg-black/70 backdrop-blur-xl rounded-xl p-4 border border-white/10 max-w-sm">
      <div className="flex items-center gap-2 mb-3">
        <BarChart3 className="w-4 h-4 text-blue-400" />
        <span className="text-white text-sm font-bold">Poll</span>
        {isActive && <Badge className="bg-green-500/80 text-[10px] px-1.5">Active</Badge>}
      </div>
      <p className="text-white text-sm font-medium mb-3">{question}</p>
      <div className="space-y-2">
        {options.map((opt, i) => {
          const pct = totalVotes > 0 ? (opt.votes / totalVotes) * 100 : 0;
          return (
            <button
              key={i}
              onClick={() => isActive && !hasVoted && onVote(i)}
              disabled={!isActive || hasVoted}
              className="w-full relative overflow-hidden rounded-lg h-9 text-left group"
            >
              <div className="absolute inset-0 bg-white/10" />
              <div
                className="absolute inset-y-0 left-0 bg-primary/40 transition-all duration-700 ease-out"
                style={{ width: `${pct}%` }}
              />
              <div className="relative flex items-center justify-between px-3 h-full">
                <span className="text-white text-xs font-medium">{opt.text}</span>
                <span className="text-white/70 text-[10px]">{pct.toFixed(0)}% ({opt.votes})</span>
              </div>
            </button>
          );
        })}
      </div>
      <p className="text-white/50 text-[10px] mt-2 text-center">{totalVotes} votes</p>
    </div>
  );
};

// ── Stream Countdown ─────────────────────────────────────────────────
interface StreamCountdownProps {
  targetTime: Date;
  label?: string;
}

export const StreamCountdown = ({ targetTime, label = "Starting in" }: StreamCountdownProps) => {
  const [timeLeft, setTimeLeft] = useState({ h: 0, m: 0, s: 0 });
  const [isZero, setIsZero] = useState(false);

  useEffect(() => {
    const tick = () => {
      const diff = Math.max(0, targetTime.getTime() - Date.now());
      if (diff === 0) {
        setIsZero(true);
        return;
      }
      setTimeLeft({
        h: Math.floor(diff / 3600000),
        m: Math.floor((diff % 3600000) / 60000),
        s: Math.floor((diff % 60000) / 1000),
      });
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [targetTime]);

  if (isZero) {
    return (
      <div className="bg-gradient-to-r from-red-600 to-pink-600 rounded-xl p-4 text-center animate-pulse shadow-2xl shadow-red-500/30">
        <p className="text-white text-2xl font-black tracking-wider">LIVE NOW!</p>
      </div>
    );
  }

  const pad = (n: number) => n.toString().padStart(2, "0");

  return (
    <div className="bg-black/70 backdrop-blur-xl rounded-xl p-4 border border-white/10 text-center">
      <p className="text-white/60 text-xs mb-2 flex items-center justify-center gap-1.5">
        <Clock className="w-3 h-3" />
        {label}
      </p>
      <div className="flex items-center justify-center gap-1.5">
        {[
          { val: pad(timeLeft.h), label: "h" },
          { val: pad(timeLeft.m), label: "m" },
          { val: pad(timeLeft.s), label: "s" },
        ].map((unit, i) => (
          <div key={i} className="flex items-baseline gap-0.5">
            <span className="text-white text-3xl font-mono font-black tabular-nums">{unit.val}</span>
            <span className="text-white/40 text-xs">{unit.label}</span>
            {i < 2 && <span className="text-white/30 text-2xl mx-1">:</span>}
          </div>
        ))}
      </div>
    </div>
  );
};

// ── Viewer Reactions ─────────────────────────────────────────────────
interface Reaction {
  emoji: string;
  id: string;
}

interface ViewerReactionsProps {
  reactions: Reaction[];
}

export const ViewerReactions = ({ reactions }: ViewerReactionsProps) => {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {reactions.map((r) => {
        const left = 10 + Math.random() * 80;
        return (
          <span
            key={r.id}
            className="absolute text-3xl animate-[floatUp_3s_ease-out_forwards]"
            style={{ left: `${left}%`, bottom: "10%" }}
          >
            {r.emoji}
          </span>
        );
      })}
    </div>
  );
};

// ── New Follower Alert ───────────────────────────────────────────────
interface NewFollowerAlertProps {
  followerName: string;
  onDone: () => void;
}

export const NewFollowerAlert = ({ followerName, onDone }: NewFollowerAlertProps) => {
  useEffect(() => {
    const timer = setTimeout(onDone, 4000);
    return () => clearTimeout(timer);
  }, [onDone]);

  return (
    <div className="animate-[slideDown_0.5s_ease-out] pointer-events-none">
      <div className="bg-gradient-to-r from-primary/90 to-purple-600/90 backdrop-blur-xl rounded-xl px-5 py-3 shadow-2xl border border-primary/30 flex items-center gap-3">
        <Heart className="w-5 h-5 text-white animate-pulse" />
        <div>
          <p className="text-white text-sm font-bold">{followerName} just followed!</p>
          <p className="text-white/70 text-[10px]">Welcome to the community</p>
        </div>
        <Sparkles className="w-4 h-4 text-yellow-300 animate-spin" />
      </div>
    </div>
  );
};

// ── Reaction Bar (for viewers to send reactions) ─────────────────────
interface ReactionBarProps {
  onReact: (emoji: string) => void;
}

const REACTION_EMOJIS = ["❤️", "🔥", "👏", "😂", "🎉", "💯", "😍", "🚀"];

export const ReactionBar = ({ onReact }: ReactionBarProps) => {
  const [cooldown, setCooldown] = useState(false);

  const handleReact = (emoji: string) => {
    if (cooldown) return;
    onReact(emoji);
    setCooldown(true);
    setTimeout(() => setCooldown(false), 500);
  };

  return (
    <div className="flex items-center gap-1 bg-black/40 backdrop-blur-sm rounded-full px-2 py-1">
      {REACTION_EMOJIS.map((e) => (
        <button
          key={e}
          onClick={() => handleReact(e)}
          disabled={cooldown}
          className="text-lg p-1 rounded-full hover:bg-white/10 transition-all hover:scale-125 active:scale-90 disabled:opacity-50"
        >
          {e}
        </button>
      ))}
    </div>
  );
};

// ── Overlay Manager (broadcaster control panel) ──────────────────────
interface StreamOverlayManagerProps {
  streamId: string;
  tipAlerts: TipAlertProps[];
  onDismissTip: (index: number) => void;
}

export const StreamOverlayManager = ({ streamId, tipAlerts, onDismissTip }: StreamOverlayManagerProps) => {
  const [showGoal, setShowGoal] = useState(false);
  const [goalTitle, setGoalTitle] = useState("");
  const [goalAmount, setGoalAmount] = useState("");
  const [goalCurrent, setGoalCurrent] = useState(0);

  const [showPoll, setShowPoll] = useState(false);
  const [pollQuestion, setPollQuestion] = useState("");
  const [pollOptions, setPollOptions] = useState<PollOption[]>([
    { text: "", votes: 0 },
    { text: "", votes: 0 },
  ]);

  const [showCountdown, setShowCountdown] = useState(false);
  const [countdownMinutes, setCountdownMinutes] = useState("5");
  const [countdownTarget, setCountdownTarget] = useState<Date | null>(null);

  const [reactions, setReactions] = useState<Reaction[]>([]);
  const [followerAlert, setFollowerAlert] = useState<string | null>(null);

  const addReaction = useCallback((emoji: string) => {
    const id = `${Date.now()}-${Math.random()}`;
    setReactions((prev) => [...prev, { emoji, id }]);
    setTimeout(() => {
      setReactions((prev) => prev.filter((r) => r.id !== id));
    }, 3000);
  }, []);

  const startPoll = () => {
    const valid = pollOptions.filter((o) => o.text.trim());
    if (!pollQuestion.trim() || valid.length < 2) return;
    setShowPoll(true);
  };

  const startCountdown = () => {
    const mins = parseInt(countdownMinutes) || 5;
    setCountdownTarget(new Date(Date.now() + mins * 60000));
    setShowCountdown(true);
  };

  return (
    <div className="space-y-4">
      {/* Overlay display area (positioned over video) */}
      <div className="relative">
        {/* Tip alerts */}
        <div className="absolute top-4 right-4 z-20 space-y-2">
          {tipAlerts.map((alert, i) => (
            <TipAlert key={i} {...alert} onDone={() => onDismissTip(i)} />
          ))}
        </div>

        {/* Follower alert */}
        {followerAlert && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20">
            <NewFollowerAlert followerName={followerAlert} onDone={() => setFollowerAlert(null)} />
          </div>
        )}

        {/* Reactions */}
        <ViewerReactions reactions={reactions} />
      </div>

      {/* Controls */}
      <div className="bg-card rounded-xl border border-border p-4 space-y-4">
        <h3 className="font-semibold text-sm flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-primary" />
          Stream Tools
        </h3>

        {/* Goal */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Tip Goal</span>
            <Button
              variant={showGoal ? "destructive" : "outline"}
              size="sm"
              onClick={() => setShowGoal(!showGoal)}
            >
              {showGoal ? <X className="w-3 h-3 mr-1" /> : <Target className="w-3 h-3 mr-1" />}
              {showGoal ? "Hide" : "Show"}
            </Button>
          </div>
          {!showGoal && (
            <div className="flex gap-2">
              <Input
                placeholder="Goal title"
                value={goalTitle}
                onChange={(e) => setGoalTitle(e.target.value)}
                className="flex-1 h-8 text-xs"
              />
              <Input
                type="number"
                placeholder="Amount"
                value={goalAmount}
                onChange={(e) => setGoalAmount(e.target.value)}
                className="w-20 h-8 text-xs"
              />
            </div>
          )}
          {showGoal && goalAmount && (
            <StreamGoal
              currentAmount={goalCurrent}
              goalAmount={parseFloat(goalAmount) || 100}
              goalTitle={goalTitle || "Stream Goal"}
            />
          )}
        </div>

        {/* Poll */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Poll</span>
            {!showPoll ? (
              <Button variant="outline" size="sm" onClick={startPoll}>
                <BarChart3 className="w-3 h-3 mr-1" />
                Launch
              </Button>
            ) : (
              <Button variant="destructive" size="sm" onClick={() => setShowPoll(false)}>
                <X className="w-3 h-3 mr-1" />
                End
              </Button>
            )}
          </div>
          {!showPoll && (
            <div className="space-y-1.5">
              <Input
                placeholder="Question"
                value={pollQuestion}
                onChange={(e) => setPollQuestion(e.target.value)}
                className="h-8 text-xs"
              />
              {pollOptions.map((opt, i) => (
                <Input
                  key={i}
                  placeholder={`Option ${i + 1}`}
                  value={opt.text}
                  onChange={(e) => {
                    const next = [...pollOptions];
                    next[i] = { ...next[i], text: e.target.value };
                    setPollOptions(next);
                  }}
                  className="h-8 text-xs"
                />
              ))}
              {pollOptions.length < 5 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setPollOptions([...pollOptions, { text: "", votes: 0 }])}
                  className="h-7 text-xs w-full"
                >
                  <Plus className="w-3 h-3 mr-1" />
                  Add option
                </Button>
              )}
            </div>
          )}
          {showPoll && (
            <StreamPoll
              question={pollQuestion}
              options={pollOptions}
              onVote={(i) => {
                const next = [...pollOptions];
                next[i] = { ...next[i], votes: next[i].votes + 1 };
                setPollOptions(next);
              }}
              isActive={true}
              totalVotes={pollOptions.reduce((s, o) => s + o.votes, 0)}
            />
          )}
        </div>

        {/* Countdown */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Countdown</span>
            {!showCountdown ? (
              <div className="flex gap-1">
                <Input
                  type="number"
                  value={countdownMinutes}
                  onChange={(e) => setCountdownMinutes(e.target.value)}
                  className="w-16 h-8 text-xs"
                  min="1"
                />
                <Button variant="outline" size="sm" onClick={startCountdown}>
                  <Clock className="w-3 h-3 mr-1" />
                  Start
                </Button>
              </div>
            ) : (
              <Button variant="destructive" size="sm" onClick={() => setShowCountdown(false)}>
                <X className="w-3 h-3 mr-1" />
                Stop
              </Button>
            )}
          </div>
          {showCountdown && countdownTarget && (
            <StreamCountdown targetTime={countdownTarget} />
          )}
        </div>

        {/* Reaction bar */}
        <div>
          <span className="text-sm font-medium block mb-2">Quick Reactions</span>
          <ReactionBar onReact={addReaction} />
        </div>
      </div>
    </div>
  );
};
