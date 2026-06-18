import { useEffect, useMemo, useRef, useState } from "react";
import type { Participant } from "@/lib/store";

type Props = {
  spinning: boolean;
  pool: Participant[];
  finalNumbers?: string[];
};

const BALL_COLORS = [
  ["#FFC107", "#7a5a00"],
  ["#FF7A00", "#5a2a00"],
  ["#0B5ED7", "#082b66"],
  ["#dc2626", "#5a0e0e"],
  ["#16a34a", "#0a3e1e"],
  ["#0ea5e9", "#0a3a5a"],
];

export function BallsDraw({ spinning, pool, finalNumbers }: Props) {
  const balls = useMemo(() => {
    const list = pool.slice(0, 18).map((p) => p.number);
    while (list.length < 8) list.push(String(list.length + 1).padStart(3, "0"));
    return list.map((num, i) => ({
      num,
      color: BALL_COLORS[i % BALL_COLORS.length],
      delay: (i % 7) * 0.18,
      dur: 1.4 + (i % 5) * 0.25,
      left: 5 + ((i * 53) % 88),
    }));
  }, [pool]);

  const [tick, setTick] = useState(0);
  useEffect(() => {
    if (!spinning) return;
    const iv = setInterval(() => setTick((t) => t + 1), 90);
    return () => clearInterval(iv);
  }, [spinning]);

  const display =
    !spinning && finalNumbers?.[0]
      ? finalNumbers[0]
      : balls[(tick + 1) % balls.length]?.num ?? "•••";

  return (
    <div className="relative mx-auto w-full max-w-3xl">
      <div
        className={`pointer-events-none absolute -inset-10 rounded-[3rem] blur-3xl transition-opacity duration-500 ${
          spinning ? "opacity-100" : "opacity-60"
        }`}
        style={{
          background:
            "radial-gradient(closest-side, oklch(0.87 0.18 92 / 0.55), oklch(0.52 0.21 257 / 0.4), transparent 70%)",
        }}
      />
      <div className="relative metallic-panel rounded-[2.5rem] p-6 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.6)]">
        {/* Glass chamber */}
        <div className="relative h-72 overflow-hidden rounded-3xl border-4 border-slate-800/80 bg-gradient-to-b from-slate-900/80 via-slate-950 to-black shadow-inner sm:h-80">
          <div className="hazard-stripes absolute -top-1 left-6 right-6 h-1.5 rounded" />
          <div className="hazard-stripes absolute -bottom-1 left-6 right-6 h-1.5 rounded" />

          {/* Balls */}
          {balls.map((b, i) => (
            <div
              key={i}
              className={spinning ? "anim-bounce-ball" : ""}
              style={{
                position: "absolute",
                left: `${b.left}%`,
                bottom: spinning ? `${10 + ((i * 17) % 60)}%` : `${8 + (i % 4) * 18}%`,
                animationDuration: `${b.dur}s`,
                animationDelay: `${b.delay}s`,
                transition: spinning ? "none" : "bottom 0.6s ease-out",
              }}
            >
              <div
                className="flex h-12 w-12 items-center justify-center rounded-full font-display text-xs font-black text-white shadow-[inset_-4px_-4px_8px_rgba(0,0,0,.45),0_6px_14px_rgba(0,0,0,.55)] sm:h-14 sm:w-14 sm:text-sm"
                style={{
                  background: `radial-gradient(circle at 30% 30%, ${b.color[0]}, ${b.color[1]})`,
                }}
              >
                <span className="rounded-full bg-white/85 px-1.5 py-0.5 text-slate-900">
                  {b.num}
                </span>
              </div>
            </div>
          ))}

          {/* Drop tube */}
          <div className="absolute right-3 top-3 bottom-3 w-10 rounded-full border border-amber-400/50 bg-black/40 backdrop-blur">
            <div className="absolute inset-x-0 bottom-2 flex flex-col items-center">
              <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-amber-300 bg-white text-slate-900 font-display text-[10px] font-black shadow-lg">
                {display.slice(-3)}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-5 flex items-center justify-center">
          <div className="rounded-xl border border-amber-400/40 bg-black/60 px-6 py-2 text-center">
            <div className="font-display text-[10px] tracking-[0.4em] text-amber-300">
              {spinning ? "DRAWING…" : "WINNER"}
            </div>
            <div className="font-display text-3xl font-black tracking-wider text-white">
              {display}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
