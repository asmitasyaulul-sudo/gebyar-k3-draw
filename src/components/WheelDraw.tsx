import { useEffect, useMemo, useRef, useState } from "react";
import type { Participant } from "@/lib/store";

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
    const list = pool.slice(0, 16).map((p) => p.number);
    while (list.length < 8) list.push(String(list.length + 1).padStart(3, "0"));
    return list;
  }, [pool]);

  const seg = 360 / items.length;
  const [rot, setRot] = useState(0);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (spinning) {
      let start: number | null = null;
      const step = (t: number) => {
        if (start === null) start = t;
        setRot(((t - start) * 0.9) % 360);
        rafRef.current = requestAnimationFrame(step);
      };
      rafRef.current = requestAnimationFrame(step);
    } else if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [spinning]);

  const display = !spinning && finalNumbers?.[0]
    ? finalNumbers[0]
    : items[Math.floor((360 - (rot % 360)) / seg) % items.length] ?? "•••";

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
              transition: spinning ? "none" : "transform 0.4s ease-out",
              background: `conic-gradient(${items
                .map((_, i) => `${WHEEL_COLORS[i % WHEEL_COLORS.length]} ${i * seg}deg ${(i + 1) * seg}deg`)
                .join(",")})`,
            }}
          >
            {items.map((num, i) => {
              const angle = i * seg + seg / 2;
              return (
                <div
                  key={i}
                  className="absolute left-1/2 top-1/2 origin-left text-white font-display font-black text-xs sm:text-sm"
                  style={{
                    transform: `rotate(${angle}deg) translate(38%, -50%)`,
                  }}
                >
                  <span
                    className="block"
                    style={{ transform: "rotate(180deg)", textShadow: "0 1px 2px rgba(0,0,0,.7)" }}
                  >
                    {num}
                  </span>
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
              {spinning ? "SPINNING…" : "WINNER"}
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
