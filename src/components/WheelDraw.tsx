import { useEffect, useMemo, useRef, useState } from "react";
import type { Participant } from "@/lib/store";
import { useText } from "@/lib/texts";

type Props = {
  spinning: boolean;
  pool: Participant[];
  finalNumbers?: string[];
};

const WHEEL_COLORS = [
  "#FFC107",
  "#FF7A00",
  "#0B5ED7",
  "#1f2937",
  "#facc15",
  "#dc2626",
  "#0ea5e9",
  "#16a34a",
];

export function WheelDraw({ spinning, pool, finalNumbers }: Props) {
  const items = useMemo(() => {
    const list = pool.map((p) => p.number);
    while (list.length < 8) list.push(String(list.length + 1).padStart(3, "0"));
    return list;
  }, [pool]);

  const seg = 360 / items.length;
  const [rot, setRot] = useState(0);
  const rotRef = useRef(0);
  const rafRef = useRef<number | null>(null);
  const [landing, setLanding] = useState(false);

  const targetNum =
    finalNumbers?.[0] && finalNumbers[0] !== "•" ? finalNumbers[0] : null;

  useEffect(() => {
    rotRef.current = rot;
  }, [rot]);

  // Drive spin vs land
  useEffect(() => {
    // Always cancel any active RAF before deciding
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }

    if (targetNum) {
      // Land on the winner's slice
      const idx = items.indexOf(targetNum);
      if (idx >= 0) {
        const center = idx * seg + seg / 2;
        const current = rotRef.current;
        // Pick a rotation a few turns ahead that lands center at top (0deg)
        const base = Math.ceil(current / 360) * 360 + 720;
        const target = base + (360 - center);
        setLanding(true);
        setRot(target);
      }
      return;
    }

    if (spinning) {
      setLanding(false);
      const startRot = rotRef.current;
      let startT: number | null = null;
      const step = (t: number) => {
        if (startT === null) startT = t;
        setRot(startRot + (t - startT) * 0.9);
        rafRef.current = requestAnimationFrame(step);
      };
      rafRef.current = requestAnimationFrame(step);
    }

    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [spinning, targetNum, items, seg]);

  const display = targetNum ?? "•••";

  // Label font scales with count; always show labels
  const fontSize =
    items.length > 120 ? 6 : items.length > 60 ? 8 : items.length > 30 ? 10 : 12;

  return (
    <div className="relative mx-auto w-full max-w-3xl">
      <div
        className={`pointer-events-none absolute -inset-10 rounded-full blur-3xl transition-opacity duration-500 ${
          spinning ? "opacity-100" : "opacity-60"
        }`}
        style={{
          background:
            "radial-gradient(closest-side, oklch(0.87 0.18 92 / 0.55), oklch(0.52 0.21 257 / 0.4), transparent 70%)",
        }}
      />
      <div className="relative metallic-panel rounded-[2.5rem] p-6 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.6)]">
        <div className="relative mx-auto aspect-square w-full max-w-[420px]">
          {/* Pointer */}
          <div className="absolute left-1/2 -top-2 z-20 -translate-x-1/2">
            <div
              className="h-0 w-0"
              style={{
                borderLeft: "16px solid transparent",
                borderRight: "16px solid transparent",
                borderTop: "28px solid #FFC107",
                filter: "drop-shadow(0 4px 8px rgba(0,0,0,.5))",
              }}
            />
          </div>

          {/* Wheel */}
          <div
            className="relative h-full w-full rounded-full border-[10px] border-slate-800 shadow-2xl"
            style={{
              transform: `rotate(${rot}deg)`,
              transition: landing
                ? "transform 1.4s cubic-bezier(0.18,0.9,0.22,1)"
                : "none",
              background: `conic-gradient(${items
                .map(
                  (_, i) =>
                    `${WHEEL_COLORS[i % WHEEL_COLORS.length]} ${i * seg}deg ${(i + 1) * seg}deg`,
                )
                .join(",")})`,
            }}
          >
            {items.map((num, i) => {
              const angle = i * seg + seg / 2;
              return (
                <div
                  key={i}
                  className="pointer-events-none absolute left-0 top-0 h-full w-full"
                  style={{
                    transform: `rotate(${angle}deg)`,
                    transformOrigin: "50% 50%",
                  }}
                >
                  <div
                    className="absolute left-1/2 -translate-x-1/2 text-center font-display font-black text-white"
                    style={{
                      top: "6%",
                      fontSize,
                      lineHeight: 1,
                      textShadow: "0 2px 4px rgba(0,0,0,.85), 0 0 2px rgba(0,0,0,.9)",
                    }}
                  >
                    {num}
                  </div>
                </div>
              );
            })}
            {/* Hub */}
            <div className="absolute left-1/2 top-1/2 z-10 flex h-20 w-20 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-4 border-amber-400 bg-slate-900 shadow-inner">
              <span className="font-display text-xs tracking-widest text-amber-300">K3</span>
            </div>
          </div>
        </div>

        <div className="mt-5 flex items-center justify-center">
          <div className="rounded-xl border border-amber-400/40 bg-black/60 px-6 py-2 text-center">
            <div className="font-display text-[10px] tracking-[0.4em] text-amber-300">
              {targetNum
                ? winnerLabel.primary
                : spinning
                  ? spinningLabel.primary
                  : readyLabel.primary}
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

