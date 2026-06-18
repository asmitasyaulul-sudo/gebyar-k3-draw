import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import confetti from "canvas-confetti";
import {
  HardHat,
  History,
  Lock,
  LogIn,
  Maximize2,
  Minimize2,
  Moon,
  PartyPopper,
  Play,
  RotateCcw,
  Settings,
  Sun,
  Volume2,
  VolumeX,
  X,
  Download,
} from "lucide-react";
import {
  PRESET_BACKGROUNDS,
  hashPw,
  useApp,
  type Participant,
} from "@/lib/store";
import { Decorations } from "@/components/Decorations";
import { LotteryMachine } from "@/components/LotteryMachine";
import { WinnerCards } from "@/components/WinnerCards";
import { AdminPanel, exportWinners } from "@/components/AdminPanel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import {
  playApplause,
  playCelebration,
  playClick,
  playSiren,
  playSpin,
} from "@/lib/sounds";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Gebyar Bulan K3 Nasional — Safety Lucky Draw" },
      {
        name: "description",
        content:
          "Premium festive lucky draw system for the National K3 (Occupational Health & Safety) month celebration.",
      },
      { property: "og:title", content: "Gebyar Bulan K3 Nasional — Safety Lucky Draw" },
      {
        property: "og:description",
        content:
          "Industrial-themed cinematic lucky draw with animated lottery machine for company K3 events.",
      },
    ],
  }),
  component: Index,
});

const LOGO_SIZE_MAP = {
  sm: "h-10",
  md: "h-14",
  lg: "h-20",
  xl: "h-28",
} as const;

function Index() {
  const {
    settings,
    setSettings,
    participants,
    winners,
    currentRound,
    pushWinnerEntry,
    resetCurrentRound,
    isAdmin,
    setAdmin,
    presentation,
    setPresentation,
  } = useApp();

  const [spinning, setSpinning] = useState(false);
  const [latest, setLatest] = useState<Participant[]>([]);
  const [reelFinal, setReelFinal] = useState<string[]>([]);
  const [loginOpen, setLoginOpen] = useState(false);
  const [adminOpen, setAdminOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);

  // Apply dark mode class
  useEffect(() => {
    document.documentElement.classList.toggle("dark", settings.dark);
  }, [settings.dark]);

  const wonIds = useMemo(
    () => new Set(winners.flatMap((w) => w.participants.map((p) => p.id))),
    [winners],
  );
  const pool = useMemo(
    () => participants.filter((p) => !wonIds.has(p.id)),
    [participants, wonIds],
  );

  const totalWinners = winners.reduce((a, w) => a + w.participants.length, 0);

  const handleDraw = () => {
    if (spinning) return;
    if (!pool.length) return toast.error("No participants remaining.");
    const count = Math.min(settings.winnersPerRound, pool.length);
    const shuffled = [...pool].sort(() => Math.random() - 0.5);
    const picks = shuffled.slice(0, count);
    setLatest([]);
    setReelFinal(["•••", "•••", "•••"]);
    setSpinning(true);
    const vol = settings.muted ? 0 : settings.volume;
    playClick(vol);
    playSpin(6500, vol);
    setTimeout(() => playSiren(vol), 6200);
    setTimeout(() => {
      setSpinning(false);
      const firstNum = picks[0]?.number ?? "•••";
      setReelFinal([firstNum.slice(-3, -2) || "•", firstNum.slice(-2, -1) || "•", firstNum.slice(-1) || "•"]);
      setLatest(picks);
      pushWinnerEntry({
        round: (winners[winners.length - 1]?.round ?? 0) + 1,
        participants: picks,
        timestamp: Date.now(),
      });
      playCelebration(vol);
      playApplause(vol);
      if (settings.ornaments.confetti) burstConfetti();
    }, 7000);
  };

  const handleResetRound = () => {
    resetCurrentRound();
    setLatest([]);
    toast.success("Latest round cleared.");
  };

  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) await document.documentElement.requestFullscreen();
      else await document.exitFullscreen();
    } catch {
      /* ignore */
    }
    setPresentation(!presentation);
  };

  const bgStyle = useMemo(() => {
    if (settings.bgCustom)
      return {
        backgroundImage: `url(${settings.bgCustom})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      } as React.CSSProperties;
    const preset = PRESET_BACKGROUNDS[Math.max(0, settings.bgIndex)] ?? PRESET_BACKGROUNDS[0];
    return { background: preset.css, backgroundSize: "cover" } as React.CSSProperties;
  }, [settings.bgCustom, settings.bgIndex]);

  return (
    <main className="relative min-h-screen overflow-hidden text-foreground">
      {/* Background */}
      <div
        className="absolute inset-0 -z-20"
        style={{
          ...bgStyle,
          filter: `brightness(${settings.bgBrightness}) blur(${settings.bgBlur}px)`,
          transform: "scale(1.05)",
        }}
      />
      <div
        className="absolute inset-0 -z-10"
        style={{ background: `oklch(0.1 0.03 257 / ${settings.overlayOpacity})` }}
      />

      <Decorations />

      {/* Top bar */}
      <div className="relative z-10 mx-auto flex max-w-[1600px] flex-wrap items-center gap-3 px-4 pt-4 sm:px-6">
        <div className="flex items-center gap-3">
          {settings.companyLogo ? (
            <img
              src={settings.companyLogo}
              className={`${LOGO_SIZE_MAP[settings.logoSize]} w-auto rounded-lg bg-white/90 p-1.5`}
            />
          ) : (
            <div className={`${LOGO_SIZE_MAP[settings.logoSize]} flex aspect-square items-center justify-center rounded-xl border border-white/30 bg-white/10 backdrop-blur`}>
              <HardHat className="h-2/3 w-2/3 text-safety-yellow" />
            </div>
          )}
          <div className="hidden text-white sm:block">
            <div className="font-display text-[10px] tracking-[0.4em] text-safety-yellow">
              SAFETY FIRST
            </div>
            <div className="font-display text-sm font-bold tracking-wider text-white/90">
              K3 NATIONAL MONTH 2026
            </div>
          </div>
        </div>

        <div className="ml-auto flex flex-wrap items-center gap-2">
          {!presentation && (
            <>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setSettings({ muted: !settings.muted })}
                aria-label="Mute"
              >
                {settings.muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setSettings({ dark: !settings.dark })}
                aria-label="Theme"
              >
                {settings.dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </Button>
              <Button variant="secondary" size="sm" onClick={() => setHistoryOpen(true)}>
                <History className="mr-1 h-4 w-4" /> History
              </Button>
              <Button variant="secondary" size="sm" onClick={() => exportWinners(winners, "xlsx")}>
                <Download className="mr-1 h-4 w-4" /> XLSX
              </Button>
              <Button variant="secondary" size="sm" onClick={() => exportWinners(winners, "csv")}>
                <Download className="mr-1 h-4 w-4" /> CSV
              </Button>
              {isAdmin ? (
                <Button size="sm" onClick={() => setAdminOpen(true)}>
                  <Settings className="mr-1 h-4 w-4" /> Admin
                </Button>
              ) : (
                <Button size="sm" onClick={() => setLoginOpen(true)}>
                  <LogIn className="mr-1 h-4 w-4" /> Admin login
                </Button>
              )}
            </>
          )}
          <Button variant="secondary" size="sm" onClick={toggleFullscreen}>
            {presentation ? (
              <Minimize2 className="mr-1 h-4 w-4" />
            ) : (
              <Maximize2 className="mr-1 h-4 w-4" />
            )}
            {presentation ? "Exit" : "Present"}
          </Button>
        </div>
      </div>

      {/* Hero title */}
      <div className="relative z-10 mx-auto max-w-[1600px] px-4 pt-6 text-center sm:px-6">
        <div className="font-display text-[10px] tracking-[0.6em] text-safety-yellow drop-shadow sm:text-xs">
          ━━ GEBYAR ━━
        </div>
        <h1 className="mt-1 font-display text-3xl font-black leading-tight text-white drop-shadow-[0_4px_20px_rgba(0,0,0,0.7)] sm:text-5xl md:text-6xl xl:text-7xl">
          BULAN K3 <span className="text-gradient-gold">NASIONAL</span>
        </h1>
        <div className="mt-2 flex items-center justify-center gap-3">
          <span className="hazard-stripes h-1 w-12 rounded sm:w-20" />
          <h2 className="font-display text-base font-bold tracking-[0.3em] text-white/95 sm:text-xl md:text-2xl">
            SAFETY LUCKY DRAW
          </h2>
          <span className="hazard-stripes h-1 w-12 rounded sm:w-20" />
        </div>

        {settings.eventLogo && (
          <img
            src={settings.eventLogo}
            className={`mx-auto mt-3 ${LOGO_SIZE_MAP[settings.logoSize]} w-auto`}
          />
        )}
      </div>

      {/* Stats */}
      <div className="relative z-10 mx-auto mt-5 grid max-w-[1100px] grid-cols-2 gap-3 px-4 sm:grid-cols-4 sm:px-6">
        <Stat label="Total Participants" value={participants.length} />
        <Stat label="Remaining" value={pool.length} highlight />
        <Stat label="Total Winners" value={totalWinners} />
        <Stat label="Current Round" value={currentRound} />
      </div>

      {/* Machine */}
      <div className="relative z-10 mt-8 px-4 sm:px-6">
        <LotteryMachine spinning={spinning} pool={pool} finalNumbers={reelFinal} />
      </div>

      {/* Controls */}
      <div className="relative z-10 mx-auto mt-6 flex max-w-3xl flex-wrap items-center justify-center gap-3 px-4">
        <Button
          size="lg"
          onClick={handleDraw}
          disabled={spinning || !pool.length}
          className="h-14 min-w-44 bg-gradient-to-r from-safety-orange via-safety-yellow to-safety-orange font-display text-lg tracking-widest text-slate-900 shadow-[0_10px_40px_-10px_rgba(255,193,7,0.8)] hover:brightness-110"
        >
          <Play className="mr-2 h-5 w-5" />
          {spinning ? "DRAWING…" : latest.length ? "NEXT DRAW" : "START DRAW"}
        </Button>

        <ConfirmBtn
          title="Reset current round?"
          desc="The latest round's winners will be returned to the pool."
          onConfirm={handleResetRound}
        >
          <Button size="lg" variant="secondary" disabled={!winners.length || spinning}>
            <RotateCcw className="mr-2 h-4 w-4" /> Reset Round
          </Button>
        </ConfirmBtn>
      </div>

      {/* Winners */}
      {latest.length > 0 && (
        <div className="relative z-10 mx-auto mt-8 max-w-[1500px] px-4 pb-12 sm:px-6">
          <div className="mb-3 flex items-center justify-center gap-3">
            <PartyPopper className="h-6 w-6 text-safety-yellow anim-sparkle" />
            <span className="font-display text-sm tracking-[0.4em] text-safety-yellow">
              ROUND {currentRound} WINNERS
            </span>
            <PartyPopper className="h-6 w-6 text-safety-orange anim-sparkle" />
          </div>
          <WinnerCards winners={latest} mode={settings.displayMode} />
        </div>
      )}

      {!latest.length && <div className="h-12" />}

      {/* Login dialog */}
      <Dialog open={loginOpen} onOpenChange={setLoginOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Lock className="h-4 w-4" /> Admin login
            </DialogTitle>
          </DialogHeader>
          <LoginForm
            onSuccess={() => {
              setLoginOpen(false);
              setAdminOpen(true);
            }}
          />
        </DialogContent>
      </Dialog>

      {/* Admin panel */}
      <Dialog open={adminOpen && isAdmin} onOpenChange={setAdminOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Admin Control Panel</DialogTitle>
          </DialogHeader>
          <AdminPanel onClose={() => setAdminOpen(false)} />
        </DialogContent>
      </Dialog>

      {/* History dialog */}
      <Dialog open={historyOpen} onOpenChange={setHistoryOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Draw History</DialogTitle>
          </DialogHeader>
          <div className="max-h-[60vh] overflow-auto">
            {winners.length === 0 && (
              <div className="py-10 text-center text-muted-foreground">
                No draws yet.
              </div>
            )}
            {[...winners].reverse().map((w) => (
              <div key={w.round} className="mb-3 rounded-lg border p-3">
                <div className="flex items-center justify-between">
                  <div className="font-display text-sm">Round {w.round}</div>
                  <div className="text-xs text-muted-foreground">
                    {new Date(w.timestamp).toLocaleString()}
                  </div>
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {w.participants.map((p) => (
                    <span
                      key={p.id}
                      className="rounded-md bg-secondary px-2 py-1 text-xs"
                    >
                      <b className="text-foreground">{p.number}</b> · {p.name}
                      {p.department && (
                        <span className="text-muted-foreground"> · {p.department}</span>
                      )}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </main>
  );
}

function Stat({
  label,
  value,
  highlight,
}: {
  label: string;
  value: number;
  highlight?: boolean;
}) {
  return (
    <div
      className={`glass-strong rounded-xl px-4 py-3 text-center ${
        highlight ? "ring-1 ring-safety-yellow/70 glow-gold" : ""
      }`}
    >
      <div className="font-display text-2xl font-black text-white drop-shadow sm:text-3xl">
        {value}
      </div>
      <div className="mt-0.5 text-[10px] uppercase tracking-[0.25em] text-white/80 sm:text-xs">
        {label}
      </div>
    </div>
  );
}

function ConfirmBtn({
  title,
  desc,
  onConfirm,
  children,
}: {
  title: string;
  desc: string;
  onConfirm: () => void;
  children: React.ReactNode;
}) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>{children}</AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{desc}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm}>Confirm</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

function LoginForm({ onSuccess }: { onSuccess: () => void }) {
  const { settings, setAdmin } = useApp();
  const [u, setU] = useState("");
  const [p, setP] = useState("");
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (u !== "admin" || hashPw(p) !== settings.adminPasswordHash)
          return toast.error("Invalid credentials.");
        setAdmin(true);
        toast.success("Welcome, admin.");
        onSuccess();
      }}
      className="space-y-3"
    >
      <div>
        <Label>Username</Label>
        <Input
          value={u}
          onChange={(e) => setU(e.target.value)}
          autoFocus
          placeholder="admin"
        />
      </div>
      <div>
        <Label>Password</Label>
        <Input
          type="password"
          value={p}
          onChange={(e) => setP(e.target.value)}
          placeholder="admin123"
        />
      </div>
      <Button type="submit" className="w-full">
        Sign in
      </Button>
      <p className="text-center text-xs text-muted-foreground">
        Default: admin / admin123
      </p>
    </form>
  );
}

function burstConfetti() {
  const colors = ["#FFC107", "#FF7A00", "#0B5ED7", "#ffffff"];
  const end = Date.now() + 1800;
  const frame = () => {
    confetti({
      particleCount: 4,
      angle: 60,
      spread: 60,
      origin: { x: 0, y: 0.7 },
      colors,
    });
    confetti({
      particleCount: 4,
      angle: 120,
      spread: 60,
      origin: { x: 1, y: 0.7 },
      colors,
    });
    if (Date.now() < end) requestAnimationFrame(frame);
  };
  confetti({
    particleCount: 200,
    spread: 100,
    origin: { y: 0.4 },
    colors,
  });
  frame();
}
