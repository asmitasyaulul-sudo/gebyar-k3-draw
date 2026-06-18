import { useApp } from "@/lib/store";
import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";

export function CustomIcons({ editable }: { editable: boolean }) {
  const { settings, updateCustomIcon, removeCustomIcon } = useApp();
  const icons = settings.customIcons;
  const reduced = settings.reducedMotion;

  if (!icons.length) return null;

  return (
    <div
      className={`absolute inset-0 ${editable ? "pointer-events-none" : "pointer-events-none"} overflow-hidden`}
      style={{ zIndex: 5 }}
    >
      {icons.map((ic) => (
        <DraggableIcon
          key={ic.id}
          icon={ic}
          editable={editable}
          reduced={reduced}
          onMove={(x, y) => updateCustomIcon(ic.id, { x, y })}
          onRemove={() => removeCustomIcon(ic.id)}
          onToggleFloat={() => updateCustomIcon(ic.id, { float: !ic.float })}
          onResize={(size) => updateCustomIcon(ic.id, { size })}
        />
      ))}
    </div>
  );
}

function DraggableIcon({
  icon,
  editable,
  reduced,
  onMove,
  onRemove,
  onToggleFloat,
  onResize,
}: {
  icon: { id: string; url: string; x: number; y: number; size: number; float: boolean };
  editable: boolean;
  reduced: boolean;
  onMove: (x: number, y: number) => void;
  onRemove: () => void;
  onToggleFloat: () => void;
  onResize: (size: number) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ dx: number; dy: number } | null>(null);
  const [dragging, setDragging] = useState(false);

  useEffect(() => {
    if (!dragging) return;
    const onMouse = (e: PointerEvent) => {
      const parent = ref.current?.parentElement;
      if (!parent || !dragRef.current) return;
      const rect = parent.getBoundingClientRect();
      const x = ((e.clientX - rect.left - dragRef.current.dx) / rect.width) * 100;
      const y = ((e.clientY - rect.top - dragRef.current.dy) / rect.height) * 100;
      onMove(Math.max(0, Math.min(100, x)), Math.max(0, Math.min(100, y)));
    };
    const onUp = () => {
      setDragging(false);
      dragRef.current = null;
    };
    window.addEventListener("pointermove", onMouse);
    window.addEventListener("pointerup", onUp);
    return () => {
      window.removeEventListener("pointermove", onMouse);
      window.removeEventListener("pointerup", onUp);
    };
  }, [dragging, onMove]);

  const animClass = icon.float && !reduced ? "anim-float-y" : "";

  return (
    <div
      ref={ref}
      className={`absolute select-none ${editable ? "pointer-events-auto" : ""} ${animClass}`}
      style={{
        left: `${icon.x}%`,
        top: `${icon.y}%`,
        width: icon.size,
        height: icon.size,
        transform: "translate(-50%, -50%)",
        cursor: editable ? (dragging ? "grabbing" : "grab") : "default",
        animationDuration: "6s",
      }}
      onPointerDown={(e) => {
        if (!editable) return;
        e.preventDefault();
        const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
        dragRef.current = {
          dx: e.clientX - rect.left - rect.width / 2,
          dy: e.clientY - rect.top - rect.height / 2,
        };
        setDragging(true);
      }}
    >
      <img
        src={icon.url}
        alt=""
        draggable={false}
        className="h-full w-full object-contain drop-shadow-[0_8px_20px_rgba(0,0,0,0.55)]"
      />
      {editable && (
        <div className="absolute -top-3 -right-3 flex items-center gap-1 rounded-full bg-black/70 px-1.5 py-1 text-[10px] text-white backdrop-blur">
          <button
            onPointerDown={(e) => e.stopPropagation()}
            onClick={onToggleFloat}
            className={`rounded px-1.5 ${icon.float ? "bg-amber-400/80 text-slate-900" : "bg-white/10"}`}
            title="Toggle floating animation"
          >
            ✦
          </button>
          <input
            type="range"
            min={32}
            max={240}
            value={icon.size}
            onPointerDown={(e) => e.stopPropagation()}
            onChange={(e) => onResize(Number(e.target.value))}
            className="w-16 accent-amber-400"
          />
          <button
            onPointerDown={(e) => e.stopPropagation()}
            onClick={onRemove}
            className="rounded bg-red-500/80 p-0.5"
            title="Remove"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      )}
    </div>
  );
}
