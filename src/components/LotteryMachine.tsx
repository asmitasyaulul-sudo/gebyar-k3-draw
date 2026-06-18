import { Cog } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import type { Participant } from "@/lib/store";

type Props = {
  spinning: boolean;
  pool: Participant[];
  finalNumbers?: string[];
};

export function LotteryMachine({ spinning, pool, finalNumbers }: Props) {
  const reels = 3;
  return (
    <div className="relative mx-auto w-full max-w-3xl">
      {/* Glow ring */}
      <div
        className={`pointer-events-none absolute -inset-10 rounded-[3rem] blur-3xl transition-opacity duration-500 ${
          spinning ? "opacity-100" : "opacity-60"
        }`}
        style={{
          background:
            "radial-gradient(closest-side, oklch(0.87 0.18 92 / 0.55), oklch(0.52 0.21 257 / 0.4), transparent 70%)",
        }}
      />

      {/* Machine body */}
      <div className="relative rounded-[2.5rem] metallic-panel p-6 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.6)]">
        {/* Top bar with rotating gears */}
        <div className="flex items-center justify-between px-2 pb-4">
          <Cog
            className={`h-10 w-10 text-slate-800 ${spinning ? "anim-spin-fast" : "anim-spin-slow"}`}
          />
          <div className="flex items-center gap-2">
            <span className={`h-3 w-3 rounded-full ${spinning ? "bg-red-500 animate-pulse" : "bg-emerald-500"} shadow-[0_0_12px_currentColor]`} />
            <span className="text-xs font-display tracking-widest text-slate-800">
              {spinning ? "DRAWING…" : "READY"}
            </span>
            <span className={`h-3 w-3 rounded-full ${spinning ? "bg-amber-400" : "bg-slate-400"} shadow-[0_0_12px_currentColor]`} />
          </div>
          <Cog
            className={`h-10 w-10 text-slate-800 ${spinning ? "anim-spin-fast" : "anim-spin-rev"}`}
          />
        </div>

        {/* Reel chamber */}
        <div className="relative rounded-3xl border-4 border-slate-800/70 bg-gradient-to-b from-slate-950 to-slate-900 p-5 shadow-inner">
          <div className="hazard-stripes absolute -top-1 left-6 right-6 h-1.5 rounded" />
          <div className="hazard-stripes absolute -bottom-1 left-6 right-6 h-1.5 rounded" />

          <div className="grid grid-cols-3 gap-3">
            {Array.from({ length: reels }).map((_, i) => (
              <Reel
                key={i}
                spinning={spinning}
                pool={pool}
                finalText={finalNumbers?.[i] ?? "•••"}
                seed={i}
              />
            ))}
          </div>

          {/* Center logo plate */}
          <div className="mt-5 flex items-center justify-center">
            <div className="rounded-xl border border-amber-400/40 bg-black/40 px-5 py-2 text-center">
              <div className="font-display text-[10px] tracking-[0.4em] text-amber-300">
                SAFETY • LUCKY • DRAW
              </div>
              <div className="font-display text-xs tracking-[0.3em] text-white/80">
                K3 INDUSTRIAL MACHINE
              </div>
            </div>
          </div>
        </div>

        {/* Bottom rivets */}
        <div className="mt-4 flex items-center justify-between px-3">
          {Array.from({ length: 7 }).map((_, i) => (
            <span
              key={i}
              className="h-3 w-3 rounded-full bg-slate-700 shadow-inner ring-1 ring-slate-500/60"
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function Reel({
  spinning,
  pool,
  finalText,
  seed,
}: {
  spinning: boolean;
  pool: Participant[];
  finalText: string;
  seed: number;
}) {
  const [tick, setTick] = useState(0);
  const intRef = useRef<number | null>(null);

  useEffect(() => {
    if (spinning) {
      intRef.current = window.setInterval(
        () => setTick((t) => t + 1),
        60 + seed * 20,
      );
    } else if (intRef.current) {
      clearInterval(intRef.current);
      intRef.current = null;
    }
    return () => {
      if (intRef.current) clearInterval(intRef.current);
    };
  }, [spinning, seed]);

  const visible = useMemo(() => {
    if (!spinning) return finalText;
    if (!pool.length) return "•••";
    const p = pool[(tick + seed * 7) % pool.length];
    return p.number;
  }, [spinning, tick, pool, seed, finalText]);

  return (
    <div className="relative h-32 overflow-hidden rounded-xl border border-amber-300/30 bg-gradient-to-b from-amber-50 via-white to-amber-100 shadow-inner sm:h-40">
      <div className="absolute inset-x-0 top-0 h-6 bg-gradient-to-b from-black/40 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 h-6 bg-gradient-to-t from-black/40 to-transparent" />
      <div className="flex h-full items-center justify-center">
        <span
          className={`font-display text-4xl font-black tracking-wider text-slate-900 sm:text-6xl ${
            spinning ? "opacity-95 blur-[1px]" : ""
          }`}
        >
          {visible}
        </span>
      </div>
      {spinning && (
        <div className="absolute inset-0 anim-shimmer pointer-events-none" />
      )}
    </div>
  );
}
