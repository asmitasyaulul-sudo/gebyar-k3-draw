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
  Download,
} from "lucide-react";
import {
  PRESET_BACKGROUNDS,
  DISPLAY_MODES,
  hashPw,
  useApp,
  type Participant,
  type DisplayMode,
} from "@/lib/store";
import { Decorations } from "@/components/Decorations";
import { LotteryMachine } from "@/components/LotteryMachine";
import { WheelDraw } from "@/components/WheelDraw";
import { BallsDraw } from "@/components/BallsDraw";
import { CustomIcons } from "@/components/CustomIcons";
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
  playCustomMusic,
  pauseCustomMusic,
  setCustomMusicVolume,
  subscribeMusic,
  isMusicPlaying,
} from "@/lib/sounds";
import { BText, useText } from "@/lib/texts";
import { Music, Pause } from "lucide-react";

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

  // Keyboard shortcut: M toggles reduced motion on the main draw screen
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isInput =
        /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName) ||
        target.isContentEditable;
      if (isInput) return;
      if (loginOpen || adminOpen || historyOpen) return;
      if (e.key === "m" || e.key === "M") {
        e.preventDefault();
        const next = !settings.reducedMotion;
        setSettings({ reducedMotion: next });
        toast.info(next ? "Reduced motion enabled" : "Reduced motion disabled");
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [settings.reducedMotion, setSettings, loginOpen, adminOpen, historyOpen]);

  const wonIds = useMemo(
    () => new Set(winners.flatMap((w) => w.participants.map((p) => p.id))),
    [winners],
  );
  const pool = useMemo(
    () => participants.filter((p) => !wonIds.has(p.id)),
    [participants, wonIds],
  );

  const totalWinners = winners.reduce((a, w) => a + w.participants.length, 0);

  const [musicPlaying, setMusicPlaying] = useState(false);
  const [popupWinners, setPopupWinners] = useState<Participant[]>([]);
  const [popupOpen, setPopupOpen] = useState(false);

  useEffect(() => {
    setMusicPlaying(isMusicPlaying());
    const unsub = subscribeMusic(setMusicPlaying);
    return () => {
      unsub();
    };
  }, []);

  // Restore music previously stored in IndexedDB (survives reloads / no re-upload needed)
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (settings.customMusic) return;
      const { loadMusic } = await import("@/lib/musicStore");
      const restored = await loadMusic();
      if (!cancelled && restored) {
        useApp.getState().setSettings({
          customMusic: restored.url,
          customMusicName: restored.name,
        });
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setCustomMusicVolume(settings.muted ? 0 : settings.volume);
  }, [settings.muted, settings.volume]);

  // Autoplay saved music on load (falls back to play on first user gesture)
  useEffect(() => {
    if (!settings.customMusic || settings.muted) return;
    const vol = settings.volume;
    playCustomMusic(settings.customMusic, vol, true);
    if (!isMusicPlaying()) {
      const kick = () => {
        playCustomMusic(settings.customMusic!, vol, true);
        window.removeEventListener("pointerdown", kick);
        window.removeEventListener("keydown", kick);
      };
      window.addEventListener("pointerdown", kick, { once: true });
      window.addEventListener("keydown", kick, { once: true });
      return () => {
        window.removeEventListener("pointerdown", kick);
        window.removeEventListener("keydown", kick);
      };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings.customMusic]);

  const toggleMusic = () => {
    if (!settings.customMusic) {
      toast.error("Upload a music file in Admin → Media first.");
      return;
    }
    if (isMusicPlaying()) pauseCustomMusic();
    else playCustomMusic(settings.customMusic, settings.muted ? 0 : settings.volume, true);
  };


  const handleDraw = async () => {
    if (spinning) return;
    if (!pool.length) return toast.error("No participants remaining.");
    const count = Math.min(settings.winnersPerRound, pool.length);
    const shuffled = [...pool].sort(() => Math.random() - 0.5);
    const picks = shuffled.slice(0, count);
    setLatest([]);
    setPopupWinners([]);
    setPopupOpen(true);
    const vol = settings.muted ? 0 : settings.volume;
    playClick(vol);

    const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));
    const perSpin = 1600;
    const holdMs = 1800; // brief pause on each winner so the machine clearly shows the number
    const revealed: Participant[] = [];

    for (let i = 0; i < picks.length; i++) {
      const p = picks[i];
      // spin phase: tumble the reels
      setReelFinal(["•", "•", "•"]);
      setSpinning(true);
      playSpin(perSpin, vol);
      await sleep(perSpin);
      // land on this winner — stop the reels so digits lock in clearly
      const num = p.number;
      setReelFinal([
        num.slice(-3, -2) || "•",
        num.slice(-2, -1) || "•",
        num.slice(-1) || "•",
      ]);
      setSpinning(false);
      revealed.push(p);
      setLatest([...revealed]);
      setPopupWinners([...revealed]);
      playSiren(vol);
      playCelebration(vol);
      playApplause(vol);
      if (settings.ornaments.confetti && !settings.reducedMotion) burstConfetti();
      // hold so the audience clearly sees this winner before the next spin
      await sleep(holdMs);
    }

    pushWinnerEntry({
      round: (winners[winners.length - 1]?.round ?? 0) + 1,
      participants: picks,
      timestamp: Date.now(),
    });
    setSpinning(false);
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
      <CustomIcons editable={isAdmin && !presentation} />

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
            <BText
              k="safetyFirst"
              className="font-display text-[10px] tracking-[0.4em] text-safety-yellow"
              secondaryClassName="block text-[9px] tracking-[0.3em] text-safety-yellow/80"
            />
            <BText
              k="brand"
              className="font-display text-sm font-bold tracking-wider text-white/90"
              secondaryClassName="block text-[11px] font-normal tracking-wider text-white/70"
            />
          </div>
        </div>

        <div className="ml-auto flex flex-wrap items-center gap-2">
          {!presentation && (
            <>
              <Button
                variant={musicPlaying ? "default" : "secondary"}
                size="sm"
                onClick={toggleMusic}
                aria-label="Music"
                title={settings.customMusicName || "Custom music"}
              >
                {musicPlaying ? (
                  <Pause className="h-4 w-4" />
                ) : (
                  <Music className="h-4 w-4" />
                )}
              </Button>
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
        <BText
          k="gebyar"
          className="font-display text-[10px] tracking-[0.6em] text-safety-yellow drop-shadow sm:text-xs"
          secondaryClassName="block text-[10px] tracking-[0.4em] text-safety-yellow/80"
        />
        <h1 className="mt-1 font-display text-3xl font-black leading-tight text-white drop-shadow-[0_4px_20px_rgba(0,0,0,0.7)] sm:text-5xl md:text-6xl xl:text-7xl">
          <TitleLine />
        </h1>
        <div className="mt-3 flex items-center justify-center gap-3">
          <span className="hazard-stripes h-1 w-12 rounded sm:w-20" />
          <BText
            k="subtitle"
            as="h2"
            className="font-display text-base font-bold tracking-[0.3em] text-white/95 sm:text-xl md:text-2xl"
            secondaryClassName="block text-sm font-normal tracking-[0.25em] text-white/75"
          />
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
        <Stat tkey="statTotal" value={participants.length} />
        <Stat tkey="statRemaining" value={pool.length} highlight />
        <Stat tkey="statWinners" value={totalWinners} />
        <Stat tkey="statRound" value={currentRound} />
      </div>

      {/* Machine */}
      <div className="relative z-10 mt-8 px-4 sm:px-6">
        {settings.drawStyle === "wheel" ? (
          <WheelDraw spinning={spinning} pool={pool} finalNumbers={reelFinal} />
        ) : settings.drawStyle === "balls" ? (
          <BallsDraw spinning={spinning} pool={pool} finalNumbers={reelFinal} />
        ) : (
          <LotteryMachine spinning={spinning} pool={pool} finalNumbers={reelFinal} />
        )}
      </div>

      {/* Controls */}
      <div className="relative z-10 mx-auto mt-6 flex max-w-5xl flex-col items-center justify-center gap-4 px-4">
        {/* Quick draw config */}
        <div className="flex flex-wrap items-center justify-center gap-3 rounded-2xl border border-white/15 bg-black/30 px-4 py-3 backdrop-blur">
          <div className="flex items-center gap-2">
            <Label className="font-display text-[11px] uppercase tracking-[0.25em] text-safety-yellow">
              <BText k="winnersPerSpin" secondaryClassName="block text-[10px] normal-case tracking-wider text-safety-yellow/70" />
            </Label>
            <div className="flex items-center gap-1">
              {[1, 3, 5, 10, 20].map((n) => (
                <Button
                  key={n}
                  type="button"
                  size="sm"
                  variant={settings.winnersPerRound === n ? "default" : "secondary"}
                  onClick={() => setSettings({ winnersPerRound: n })}
                  disabled={spinning}
                  className="h-8 min-w-9 px-2"
                >
                  {n}
                </Button>
              ))}
              <Input
                type="number"
                min={1}
                max={Math.max(1, pool.length || 1)}
                value={settings.winnersPerRound}
                onChange={(e) => {
                  const v = Math.max(1, Math.min(500, Number(e.target.value) || 1));
                  setSettings({ winnersPerRound: v });
                }}
                disabled={spinning}
                className="h-8 w-20"
              />
            </div>
          </div>

          <div className="hidden h-6 w-px bg-white/20 sm:block" />

          <div className="flex items-center gap-2">
            <Label className="font-display text-[11px] uppercase tracking-[0.25em] text-safety-yellow">
              <BText k="displayLabel" secondaryClassName="block text-[10px] normal-case tracking-wider text-safety-yellow/70" />
            </Label>
            <select
              value={settings.displayMode}
              onChange={(e) =>
                setSettings({ displayMode: e.target.value as DisplayMode })
              }
              disabled={spinning}
              className="h-8 rounded-md border border-white/20 bg-black/40 px-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-safety-yellow"
            >
              {DISPLAY_MODES.map((d) => (
                <option key={d.value} value={d.value} className="bg-slate-900">
                  {d.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3">
          <Button
            size="lg"
            onClick={handleDraw}
            disabled={spinning || !pool.length}
            className="h-14 min-w-44 bg-gradient-to-r from-safety-orange via-safety-yellow to-safety-orange font-display text-base tracking-widest text-slate-900 shadow-[0_10px_40px_-10px_rgba(255,193,7,0.8)] hover:brightness-110"
          >
            <Play className="mr-2 h-5 w-5" />
            <DrawButtonLabel
              spinning={spinning}
              hasLatest={latest.length > 0}
              count={Math.min(settings.winnersPerRound, pool.length || settings.winnersPerRound)}
            />
          </Button>

          <ConfirmBtn
            title="Reset current round?"
            desc="The latest round's winners will be returned to the pool."
            onConfirm={handleResetRound}
          >
            <Button size="lg" variant="secondary" disabled={!winners.length || spinning}>
              <RotateCcw className="mr-2 h-4 w-4" />
              <BText k="resetRound" secondaryClassName="block text-[10px] font-normal opacity-80" />
            </Button>
          </ConfirmBtn>
        </div>
      </div>

      {/* Winners */}
      {latest.length > 0 && (
        <div className="relative z-10 mx-auto mt-8 max-w-[1500px] px-4 pb-12 sm:px-6">
          <div className="mb-3 flex items-center justify-center gap-3">
            <PartyPopper className="h-6 w-6 text-safety-yellow anim-sparkle" />
            <BText
              k="roundWinners"
              vars={{ round: currentRound }}
              className="text-center font-display text-sm tracking-[0.4em] text-safety-yellow"
              secondaryClassName="block text-xs font-normal tracking-[0.3em] text-safety-yellow/80"
            />
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

      {/* Floating, non-blocking winner celebration panel — draw stays visible */}
      {popupOpen && (
        <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 px-3 pb-3 sm:px-6 sm:pb-6">
          <div className="pointer-events-auto mx-auto max-w-[1600px] overflow-hidden rounded-2xl border border-safety-yellow/40 bg-gradient-to-br from-slate-900/95 via-slate-950/95 to-slate-900/95 text-white shadow-[0_20px_60px_-10px_rgba(0,0,0,0.7)] backdrop-blur">
            <div className="flex items-center justify-between gap-2 border-b border-white/10 px-4 py-2">
              <div className="flex items-center gap-2">
                <PartyPopper className="h-4 w-4 text-safety-yellow anim-sparkle" />
                <BText
                  k="celebrate"
                  className="font-display text-[11px] tracking-[0.4em] text-safety-yellow"
                  secondaryClassName="block text-[10px] font-normal tracking-[0.3em] text-safety-yellow/80"
                />
              </div>
              <div className="flex items-center gap-2">
                <span className="font-display text-[10px] tracking-[0.3em] text-white/70">
                  {spinning
                    ? `REVEALING ${popupWinners.length} / ${Math.min(settings.winnersPerRound, pool.length + popupWinners.length)}`
                    : `${popupWinners.length} WINNERS`}
                </span>
                <button
                  type="button"
                  onClick={() => setPopupOpen(false)}
                  className="rounded-md border border-white/15 px-2 py-0.5 text-xs text-white/80 hover:bg-white/10"
                  aria-label="Close winners panel"
                >
                  ✕
                </button>
              </div>
            </div>
            <div className="max-h-[34vh] overflow-y-auto px-3 py-3">
              {popupWinners.length === 0 ? (
                <div className="py-6 text-center text-xs text-white/60">
                  Drawing…
                </div>
              ) : (
                <div className="flex flex-wrap justify-center gap-3">
                  {popupWinners.map((w, i) => (
                    <div
                      key={`${w.id}-${i}`}
                      className="relative w-40 rounded-2xl border border-safety-yellow/40 bg-black/40 p-3 text-center shadow-[0_10px_30px_-10px_rgba(255,193,7,0.5)]"
                      style={{
                        animation: "popIn 0.55s cubic-bezier(0.34,1.56,0.64,1)",
                      }}
                    >
                      {w.photoUrl && (
                        <img
                          src={w.photoUrl}
                          alt={w.name}
                          className="mx-auto mb-2 h-14 w-14 rounded-full border-2 border-safety-yellow object-cover"
                        />
                      )}
                      <div className="font-display text-2xl font-black text-gradient-gold drop-shadow">
                        {w.number}
                      </div>
                      {w.name && (
                        <div className="mt-1 truncate font-display text-xs font-bold text-white">
                          {w.name}
                        </div>
                      )}
                      {w.department && (
                        <div className="truncate text-[9px] uppercase tracking-[0.25em] text-safety-yellow/80">
                          {w.department}
                        </div>
                      )}
                      <div className="absolute -top-2 left-1/2 -translate-x-1/2 rounded-full bg-safety-yellow px-2 py-0.5 font-display text-[10px] font-black text-slate-900">
                        #{i + 1}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <style>{`@keyframes popIn { 0% { opacity: 0; transform: translateX(60px) scale(0.6) rotate(-6deg); } 60% { opacity: 1; transform: translateX(-6px) scale(1.06) rotate(1deg); } 100% { opacity: 1; transform: translateX(0) scale(1) rotate(0); } }`}</style>
          </div>
        </div>
      )}
    </main>

  );
}

function Stat({
  tkey,
  value,
  highlight,
}: {
  tkey: "statTotal" | "statRemaining" | "statWinners" | "statRound";
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
      <BText
        k={tkey}
        className="mt-0.5 block text-[10px] uppercase tracking-[0.25em] text-white/80 sm:text-xs"
        secondaryClassName="block text-[10px] normal-case tracking-wider text-white/65"
      />
    </div>
  );
}

function TitleLine() {
  const main = useText("titleMain");
  const hi = useText("titleHighlight");
  return (
    <>
      <span className="block">
        {main.primary} <span className="text-gradient-gold">{hi.primary}</span>
      </span>
      {main.secondary && (
        <span className="mt-1 block text-[0.55em] font-bold text-white/85">
          {main.secondary} <span className="text-gradient-gold">{hi.secondary}</span>
        </span>
      )}
    </>
  );
}

function DrawButtonLabel({
  spinning,
  hasLatest,
  count,
}: {
  spinning: boolean;
  hasLatest: boolean;
  count: number;
}) {
  const drawing = useText("drawing");
  const start = useText("startDraw");
  const next = useText("nextDraw");
  if (spinning) {
    return (
      <span className="flex flex-col leading-tight">
        <span>{drawing.primary}</span>
        {drawing.secondary && <span className="text-[10px] font-normal opacity-85">{drawing.secondary}</span>}
      </span>
    );
  }
  const t = hasLatest ? next : start;
  return (
    <span className="flex flex-col leading-tight">
      <span>{t.primary} · {count}</span>
      {t.secondary && <span className="text-[10px] font-normal opacity-85">{t.secondary}</span>}
    </span>
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
