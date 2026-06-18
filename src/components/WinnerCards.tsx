import { motion } from "framer-motion";
import { HardHat } from "lucide-react";
import type { DisplayMode, Participant } from "@/lib/store";

export function WinnerCards({
  winners,
  mode,
}: {
  winners: Participant[];
  mode: DisplayMode;
}) {
  if (!winners.length) return null;

  // Choose columns based on count
  const cols =
    winners.length <= 3
      ? "grid-cols-1 sm:grid-cols-3"
      : winners.length <= 5
        ? "grid-cols-2 sm:grid-cols-3 lg:grid-cols-5"
        : winners.length <= 10
          ? "grid-cols-2 sm:grid-cols-3 md:grid-cols-5"
          : "grid-cols-2 sm:grid-cols-4 md:grid-cols-5";

  return (
    <div className={`grid ${cols} gap-4`}>
      {winners.map((w, i) => (
        <motion.div
          key={`${w.id}-${i}`}
          initial={{ opacity: 0, scale: 0.6, rotateY: 90 }}
          animate={{ opacity: 1, scale: 1, rotateY: 0 }}
          transition={{
            delay: i * 0.18,
            type: "spring",
            stiffness: 220,
            damping: 16,
          }}
        >
          <Card w={w} mode={mode} />
        </motion.div>
      ))}
    </div>
  );
}

function Card({ w, mode }: { w: Participant; mode: DisplayMode }) {
  const showNumber =
    mode === "number" ||
    mode === "number_name" ||
    mode === "number_name_dept" ||
    mode === "number_name_photo";
  const showName =
    mode === "name" ||
    mode === "number_name" ||
    mode === "number_name_dept" ||
    mode === "number_name_photo";
  const showDept = mode === "number_name_dept";
  const showPhoto = mode === "number_name_photo";

  return (
    <div className="group relative">
      <div className="absolute -inset-0.5 rounded-2xl bg-gradient-to-br from-safety-yellow via-safety-orange to-safety-blue opacity-80 blur-md transition group-hover:opacity-100" />
      <div className="relative glass-strong rounded-2xl p-4 text-center">
        {showPhoto && (
          <div className="mx-auto mb-3 flex h-20 w-20 items-center justify-center overflow-hidden rounded-full border-2 border-safety-yellow/60 bg-safety-blue/15">
            {w.photoUrl ? (
              <img src={w.photoUrl} alt={w.name} className="h-full w-full object-cover" />
            ) : (
              <HardHat className="h-10 w-10 text-safety-yellow" />
            )}
          </div>
        )}
        {showNumber && (
          <div className="font-display text-3xl font-black text-gradient-gold drop-shadow">
            {w.number}
          </div>
        )}
        {showName && (
          <div className="mt-1 truncate font-display text-base font-bold tracking-wide text-foreground">
            {w.name}
          </div>
        )}
        {showDept && (
          <div className="mt-0.5 truncate text-xs uppercase tracking-widest text-muted-foreground">
            {w.department}
          </div>
        )}
      </div>
    </div>
  );
}
