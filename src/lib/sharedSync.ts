// Sync the zustand store (settings, participants, winners, currentRound)
// with a single global row in Supabase so every device stays in sync.
import { supabase } from "@/integrations/supabase/client";
import { useApp } from "@/lib/store";

const ROW_ID = "global";
const TABLE = "shared_state";
const PUSH_DEBOUNCE_MS = 600;

type Snapshot = {
  participants: unknown;
  winners: unknown;
  currentRound: unknown;
  settings: unknown;
};

function snapshot(): Snapshot {
  const s = useApp.getState();
  // Strip runtime-only object URLs from settings before syncing.
  const {
    customMusic: _m,
    customSpinSound: _s,
    customWinnerSound: _w,
    ...settings
  } = s.settings as Record<string, unknown>;
  void _m; void _s; void _w;
  return {
    participants: s.participants,
    winners: s.winners,
    currentRound: s.currentRound,
    settings,
  };
}

let applyingRemote = false;
let lastPushedJson = "";
let pushTimer: ReturnType<typeof setTimeout> | null = null;

function applyRemote(data: Snapshot | null | undefined) {
  if (!data) return;
  applyingRemote = true;
  try {
    const st = useApp.getState();
    useApp.setState({
      participants: (data.participants as typeof st.participants) ?? st.participants,
      winners: (data.winners as typeof st.winners) ?? st.winners,
      currentRound: (data.currentRound as number) ?? st.currentRound,
      settings: {
        ...st.settings,
        ...((data.settings as Partial<typeof st.settings>) ?? {}),
        // Preserve runtime-only object URLs
        customMusic: st.settings.customMusic,
        customSpinSound: st.settings.customSpinSound,
        customWinnerSound: st.settings.customWinnerSound,
      },
    });
    lastPushedJson = JSON.stringify(snapshot());
  } finally {
    applyingRemote = false;
  }
}

async function pushNow() {
  const snap = snapshot();
  const json = JSON.stringify(snap);
  if (json === lastPushedJson) return;
  lastPushedJson = json;
  try {
    await supabase
      .from(TABLE)
      .upsert({ id: ROW_ID, data: snap as never, updated_at: new Date().toISOString() });
  } catch (e) {
    console.warn("[sharedSync] push failed", e);
  }
}

function schedulePush() {
  if (applyingRemote) return;
  if (pushTimer) clearTimeout(pushTimer);
  pushTimer = setTimeout(pushNow, PUSH_DEBOUNCE_MS);
}

let started = false;
export function startSharedSync() {
  if (started || typeof window === "undefined") return;
  started = true;

  // Initial fetch → hydrate local store from cloud
  supabase
    .from(TABLE)
    .select("data")
    .eq("id", ROW_ID)
    .maybeSingle()
    .then(({ data }) => {
      if (data?.data) applyRemote(data.data as Snapshot);
    });

  // Realtime subscription
  supabase
    .channel("shared_state_sync")
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: TABLE, filter: `id=eq.${ROW_ID}` },
      (payload) => {
        const newRow = payload.new as { data?: Snapshot } | undefined;
        if (newRow?.data) applyRemote(newRow.data);
      },
    )
    .subscribe();

  // Local → cloud push on any store change
  useApp.subscribe(() => schedulePush());
}
