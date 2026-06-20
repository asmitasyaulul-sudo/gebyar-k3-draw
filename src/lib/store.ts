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
export type DrawStyle = "machine" | "wheel" | "balls";

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

export type CustomIcon = {
  id: string;
  url: string; // data URL
  // position as percentage of screen (0-100)
  x: number;
  y: number;
  size: number; // px
  float: boolean; // animate floating
};

export type Settings = {
  // Theme
  dark: boolean;
  // Background
  bgIndex: number;
  bgCustom?: string;
  bgBrightness: number;
  bgBlur: number;
  overlayOpacity: number;
  // Logos
  companyLogo?: string;
  eventLogo?: string;
  logoSize: LogoSize;
  // Draw
  winnersPerRound: number;
  displayMode: DisplayMode;
  drawStyle: DrawStyle;
  // Ornaments
  animSpeed: AnimSpeed;
  animSpeedMultiplier: number;
  reducedMotion: boolean;
  ornaments: Ornaments;
  // Custom flying icons
  customIcons: CustomIcon[];
  // Sound
  volume: number;
  muted: boolean;
  customMusic?: string; // data URL
  customMusicName?: string;
  // Admin
  adminPasswordHash: string;
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
  clearParticipants: () => void;

  pushWinnerEntry: (w: WinnerEntry) => void;
  resetCurrentRound: () => void;
  resetAllWinners: () => void;

  setSettings: (patch: Partial<Settings>) => void;
  setOrnament: (key: keyof Ornaments, v: boolean) => void;

  addCustomIcon: (i: CustomIcon) => void;
  updateCustomIcon: (id: string, patch: Partial<CustomIcon>) => void;
  removeCustomIcon: (id: string) => void;

  setAdmin: (v: boolean) => void;
  setPresentation: (v: boolean) => void;
};

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
  drawStyle: "machine",
  animSpeed: "normal",
  animSpeedMultiplier: 1,
  reducedMotion: false,
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
  customIcons: [],
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

      addCustomIcon: (i) =>
        set((s) => ({
          settings: { ...s.settings, customIcons: [...s.settings.customIcons, i] },
        })),
      updateCustomIcon: (id, patch) =>
        set((s) => ({
          settings: {
            ...s.settings,
            customIcons: s.settings.customIcons.map((x) =>
              x.id === id ? { ...x, ...patch } : x,
            ),
          },
        })),
      removeCustomIcon: (id) =>
        set((s) => ({
          settings: {
            ...s.settings,
            customIcons: s.settings.customIcons.filter((x) => x.id !== id),
          },
        })),

      setAdmin: (v) => set({ isAdmin: v }),
      setPresentation: (v) => set({ presentation: v }),
    }),
    {
      name: "gebyar-k3-store",
      version: 2,
      migrate: (persistedState: any) => {
        const base =
          typeof persistedState === "object" && persistedState !== null
            ? persistedState
            : {};
        const persistedSettings = base.settings ?? {};
        return {
          ...base,
          settings: {
            ...defaultSettings,
            ...persistedSettings,
            ornaments: {
              ...defaultSettings.ornaments,
              ...(persistedSettings.ornaments ?? {}),
            },
            customIcons: Array.isArray(persistedSettings.customIcons)
              ? persistedSettings.customIcons
              : [],
          },
        };
      },
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

export const DRAW_STYLES: { value: DrawStyle; label: string; desc: string }[] = [
  { value: "machine", label: "Industrial Reels", desc: "Classic slot-style lottery machine" },
  { value: "wheel", label: "Spinning Wheel", desc: "Circular roulette-style wheel" },
  { value: "balls", label: "Bingo Balls", desc: "Bouncing numbered balls" },
];

export const WINNERS_OPTIONS = [1, 5, 10, 15, 20];
