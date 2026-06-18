import { create } from "zustand";
import { persist } from "zustand/middleware";

export type Participant = {
  id: string;
  number: string;
  name: string;
  department: string;
  photoUrl?: string;
};

export type WinnerEntry = {
  round: number;
  participants: Participant[];
  timestamp: number;
};

export type DisplayMode =
  | "number"
  | "name"
  | "number_name"
  | "number_name_dept"
  | "number_name_photo";

export type AnimSpeed = "slow" | "normal" | "fast";
export type LogoSize = "sm" | "md" | "lg" | "xl";

export type Ornaments = {
  gears: boolean;
  helmets: boolean;
  hazard: boolean;
  cones: boolean;
  apar: boolean;
  sparkles: boolean;
  particles: boolean;
  stageLights: boolean;
  confetti: boolean;
};

export type Settings = {
  // Theme
  dark: boolean;
  // Background
  bgIndex: number; // index into preset list, -1 means custom
  bgCustom?: string; // data URL
  bgBrightness: number; // 0.2 - 1.2
  bgBlur: number; // 0 - 20
  overlayOpacity: number; // 0 - 0.85
  // Logos
  companyLogo?: string;
  eventLogo?: string;
  logoSize: LogoSize;
  // Draw
  winnersPerRound: number;
  displayMode: DisplayMode;
  // Ornaments
  animSpeed: AnimSpeed;
  ornaments: Ornaments;
  // Sound
  volume: number;
  muted: boolean;
  // Admin
  adminPasswordHash: string; // simple hash
};

export type AppState = {
  participants: Participant[];
  winners: WinnerEntry[];
  currentRound: number;
  settings: Settings;
  isAdmin: boolean;
  presentation: boolean;

  setParticipants: (p: Participant[]) => void;
  addParticipant: (p: Participant) => void;
  updateParticipant: (id: string, patch: Partial<Participant>) => void;
  removeParticipant: (id: string) => void;

  pushWinnerEntry: (w: WinnerEntry) => void;
  resetCurrentRound: () => void;
  resetAllWinners: () => void;

  setSettings: (patch: Partial<Settings>) => void;
  setOrnament: (key: keyof Ornaments, v: boolean) => void;

  setAdmin: (v: boolean) => void;
  setPresentation: (v: boolean) => void;
};

// Tiny non-secure hash; just to avoid storing plaintext.
export function hashPw(s: string): string {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h) ^ s.charCodeAt(i);
  return String(h >>> 0);
}

const defaultSettings: Settings = {
  dark: true,
  bgIndex: 0,
  bgBrightness: 0.7,
  bgBlur: 4,
  overlayOpacity: 0.55,
  logoSize: "lg",
  winnersPerRound: 5,
  displayMode: "number_name_dept",
  animSpeed: "normal",
  ornaments: {
    gears: true,
    helmets: true,
    hazard: true,
    cones: true,
    apar: true,
    sparkles: true,
    particles: true,
    stageLights: true,
    confetti: true,
  },
  volume: 0.7,
  muted: false,
  adminPasswordHash: hashPw("admin123"),
};

export const useApp = create<AppState>()(
  persist(
    (set) => ({
      participants: [],
      winners: [],
      currentRound: 0,
      settings: defaultSettings,
      isAdmin: false,
      presentation: false,

      setParticipants: (p) => set({ participants: p }),
      addParticipant: (p) =>
        set((s) => ({ participants: [...s.participants, p] })),
      updateParticipant: (id, patch) =>
        set((s) => ({
          participants: s.participants.map((x) =>
            x.id === id ? { ...x, ...patch } : x,
          ),
        })),
      removeParticipant: (id) =>
        set((s) => ({
          participants: s.participants.filter((x) => x.id !== id),
        })),

      pushWinnerEntry: (w) =>
        set((s) => ({
          winners: [...s.winners, w],
          currentRound: w.round,
        })),
      resetCurrentRound: () =>
        set((s) => {
          const list = [...s.winners];
          list.pop();
          return {
            winners: list,
            currentRound: list.length ? list[list.length - 1].round : 0,
          };
        }),
      resetAllWinners: () => set({ winners: [], currentRound: 0 }),

      setSettings: (patch) =>
        set((s) => ({ settings: { ...s.settings, ...patch } })),
      setOrnament: (key, v) =>
        set((s) => ({
          settings: {
            ...s.settings,
            ornaments: { ...s.settings.ornaments, [key]: v },
          },
        })),

      setAdmin: (v) => set({ isAdmin: v }),
      setPresentation: (v) => set({ presentation: v }),
    }),
    {
      name: "gebyar-k3-store",
      partialize: (s) => ({
        participants: s.participants,
        winners: s.winners,
        currentRound: s.currentRound,
        settings: s.settings,
      }),
    },
  ),
);

export const PRESET_BACKGROUNDS = [
  {
    name: "Industrial Factory",
    css: "linear-gradient(135deg,#1a2540,#0a1020), radial-gradient(circle at 20% 30%,#ffae00 0%,transparent 30%), radial-gradient(circle at 80% 70%,#0b5ed7 0%,transparent 35%)",
  },
  {
    name: "Oil & Gas Refinery",
    css: "linear-gradient(180deg,#0a0a0a,#1b2030), radial-gradient(circle at 50% 80%,#ff7a00 0%,transparent 40%), radial-gradient(circle at 10% 20%,#ffc107 0%,transparent 25%)",
  },
  {
    name: "Construction Site",
    css: "linear-gradient(160deg,#26200d,#0d0d0d), radial-gradient(circle at 70% 30%,#ffc107 0%,transparent 35%)",
  },
  {
    name: "Control Room",
    css: "linear-gradient(180deg,#02101f,#001520), radial-gradient(circle at 50% 60%,#0b5ed7 0%,transparent 45%)",
  },
  {
    name: "Safety Celebration Stage",
    css: "linear-gradient(180deg,#1a0030,#000), radial-gradient(circle at 50% 100%,#ff7a00 0%,transparent 50%), radial-gradient(circle at 20% 0%,#ffc107 0%,transparent 30%), radial-gradient(circle at 80% 0%,#0b5ed7 0%,transparent 30%)",
  },
];

export const DISPLAY_MODES: { value: DisplayMode; label: string }[] = [
  { value: "number", label: "Number only" },
  { value: "name", label: "Name only" },
  { value: "number_name", label: "Number + Name" },
  { value: "number_name_dept", label: "Number + Name + Department" },
  { value: "number_name_photo", label: "Number + Name + Photo" },
];

export const WINNERS_OPTIONS = [1, 5, 10, 15, 20];
