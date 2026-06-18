import { useApp } from "@/lib/store";
import { Cog, HardHat, TriangleAlert, Flame, Sparkles } from "lucide-react";

const SPEED_MAP = { slow: 1.7, normal: 1, fast: 0.55 } as const;

export function Decorations() {
  const { settings } = useApp();
  const o = settings.ornaments;
  const k = SPEED_MAP[settings.animSpeed];

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {/* Stage lights */}
      {o.stageLights && (
        <>
          <div
            className="absolute -top-20 left-[12%] h-[60vh] w-[14vw] origin-top rotate-[18deg] anim-stage rounded-b-full"
            style={{
              background:
                "linear-gradient(180deg, oklch(0.87 0.18 92 / 0.45), transparent 80%)",
              animationDuration: `${1.6 * k}s`,
            }}
          />
          <div
            className="absolute -top-20 right-[12%] h-[60vh] w-[14vw] origin-top -rotate-[18deg] anim-stage rounded-b-full"
            style={{
              background:
                "linear-gradient(180deg, oklch(0.72 0.21 50 / 0.45), transparent 80%)",
              animationDuration: `${1.9 * k}s`,
            }}
          />
        </>
      )}

      {/* Hazard stripes top/bottom */}
      {o.hazard && (
        <>
          <div className="absolute top-0 left-0 right-0 h-2 hazard-stripes opacity-80" />
          <div className="absolute bottom-0 left-0 right-0 h-2 hazard-stripes opacity-80" />
        </>
      )}

      {/* Floating gears in corners */}
      {o.gears && (
        <>
          <Cog
            className="absolute -left-10 top-10 h-44 w-44 text-safety-yellow/25 anim-spin-slow"
            style={{ animationDuration: `${8 * k}s` }}
          />
          <Cog
            className="absolute -right-16 bottom-16 h-56 w-56 text-safety-blue/25 anim-spin-rev"
            style={{ animationDuration: `${12 * k}s` }}
          />
          <Cog
            className="absolute right-20 top-32 h-20 w-20 text-safety-orange/30 anim-spin-slow"
            style={{ animationDuration: `${6 * k}s` }}
          />
        </>
      )}

      {/* Floating helmets */}
      {o.helmets && (
        <>
          <HardHat
            className="absolute left-[8%] bottom-[18%] h-16 w-16 text-safety-yellow drop-shadow-[0_8px_20px_rgba(255,193,7,0.5)] anim-float-y"
            style={{ animationDuration: `${6 * k}s` }}
          />
          <HardHat
            className="absolute right-[10%] top-[22%] h-14 w-14 text-safety-orange drop-shadow-[0_8px_20px_rgba(255,122,0,0.5)] anim-float-x"
            style={{ animationDuration: `${7 * k}s` }}
          />
          <HardHat
            className="absolute left-[40%] top-[8%] h-12 w-12 text-safety-yellow/80 anim-float-y"
            style={{ animationDuration: `${8 * k}s` }}
          />
        </>
      )}

      {/* Cones */}
      {o.cones && (
        <>
          <TriangleAlert
            className="absolute left-[20%] bottom-[8%] h-12 w-12 text-safety-orange anim-float-x"
            style={{ animationDuration: `${5 * k}s` }}
          />
          <TriangleAlert
            className="absolute right-[24%] bottom-[12%] h-10 w-10 text-safety-yellow anim-float-y"
            style={{ animationDuration: `${6.5 * k}s` }}
          />
        </>
      )}

      {/* APAR (fire extinguisher icon ~ Flame) */}
      {o.apar && (
        <Flame
          className="absolute right-[8%] bottom-[28%] h-14 w-14 text-red-500 drop-shadow-[0_0_18px_rgba(239,68,68,0.55)] anim-float-y"
          style={{ animationDuration: `${5.5 * k}s` }}
        />
      )}

      {/* Sparkles */}
      {o.sparkles && (
        <>
          {[
            "left-[15%] top-[30%]",
            "left-[60%] top-[18%]",
            "left-[78%] top-[55%]",
            "left-[30%] top-[70%]",
            "left-[88%] top-[35%]",
            "left-[8%] top-[55%]",
          ].map((cls, i) => (
            <Sparkles
              key={i}
              className={`absolute h-6 w-6 text-safety-yellow anim-sparkle ${cls}`}
              style={{
                animationDuration: `${(1.8 + i * 0.4) * k}s`,
                animationDelay: `${i * 0.3}s`,
              }}
            />
          ))}
        </>
      )}

      {/* Particles */}
      {o.particles && (
        <>
          {Array.from({ length: 24 }).map((_, i) => (
            <span
              key={i}
              className="absolute rounded-full anim-float-y"
              style={{
                left: `${(i * 37) % 100}%`,
                top: `${(i * 53) % 100}%`,
                width: `${4 + (i % 5)}px`,
                height: `${4 + (i % 5)}px`,
                background: i % 3 === 0 ? "#FFC107" : i % 3 === 1 ? "#FF7A00" : "#0B5ED7",
                opacity: 0.6,
                filter: "blur(1px)",
                animationDuration: `${(4 + (i % 6)) * k}s`,
                animationDelay: `${(i % 10) * 0.2}s`,
              }}
            />
          ))}
        </>
      )}
    </div>
  );
}
