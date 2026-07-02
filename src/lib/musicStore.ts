// Shared audio storage backed by Lovable Cloud (Supabase Storage) so uploaded
// music + SFX become the default for EVERY visitor on any device.
// IndexedDB is kept as a local cache so playback is instant on repeat loads.
import { supabase } from "@/integrations/supabase/client";

export type AudioSlot = "music" | "spin" | "winner";

const DB_NAME = "gebyar-k3-music";
const STORE = "music";
const MAX_BYTES = 100 * 1024 * 1024; // 100 MB hard cap
const BUCKET = "audio";
const NAME_META_KEY = "gebyar-k3-audio-names";

type SlotNames = Partial<Record<AudioSlot, string>>;
type Stored = { blob: Blob; name: string; type: string };

function readNames(): SlotNames {
  try { return JSON.parse(localStorage.getItem(NAME_META_KEY) || "{}"); } catch { return {}; }
}
function writeName(slot: AudioSlot, name: string) {
  const n = readNames(); n[slot] = name;
  try { localStorage.setItem(NAME_META_KEY, JSON.stringify(n)); } catch { /* ignore */ }
}
function clearName(slot: AudioSlot) {
  const n = readNames(); delete n[slot];
  try { localStorage.setItem(NAME_META_KEY, JSON.stringify(n)); } catch { /* ignore */ }
}

function remotePath(slot: AudioSlot, ext = "bin") {
  return `${slot}.${ext}`;
}
function extFromFile(file: File | Blob, fallbackName?: string) {
  const name = (file as File).name || fallbackName || "";
  const m = name.match(/\.([a-z0-9]+)$/i);
  return (m?.[1] || "mp3").toLowerCase();
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE);
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function idbPut(slot: AudioSlot, stored: Stored) {
  const db = await openDb();
  await new Promise<void>((res, rej) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).put(stored, slot === "music" ? "current" : slot);
    tx.oncomplete = () => res();
    tx.onerror = () => rej(tx.error);
    tx.onabort = () => rej(tx.error);
  });
  db.close();
}

async function idbGet(slot: AudioSlot): Promise<Stored | null> {
  try {
    const db = await openDb();
    const key = slot === "music" ? "current" : slot;
    const stored = await new Promise<Stored | null>((res, rej) => {
      const tx = db.transaction(STORE, "readonly");
      const req = tx.objectStore(STORE).get(key);
      req.onsuccess = () => res((req.result as Stored | undefined) ?? null);
      req.onerror = () => rej(req.error);
    });
    db.close();
    return stored;
  } catch {
    return null;
  }
}

async function idbDelete(slot: AudioSlot) {
  try {
    const db = await openDb();
    await new Promise<void>((res, rej) => {
      const tx = db.transaction(STORE, "readwrite");
      tx.objectStore(STORE).delete(slot === "music" ? "current" : slot);
      tx.oncomplete = () => res();
      tx.onerror = () => rej(tx.error);
    });
    db.close();
  } catch { /* ignore */ }
}

async function uploadRemote(slot: AudioSlot, blob: Blob, name: string) {
  try {
    const ext = extFromFile(blob, name);
    // Remove any prior file for this slot (any extension)
    try {
      const { data: list } = await supabase.storage.from(BUCKET).list("", { limit: 100 });
      const oldies = (list || []).filter((f) => f.name.startsWith(`${slot}.`));
      if (oldies.length) {
        await supabase.storage.from(BUCKET).remove(oldies.map((f) => f.name));
      }
    } catch { /* ignore */ }
    await supabase.storage.from(BUCKET).upload(remotePath(slot, ext), blob, {
      upsert: true,
      contentType: blob.type || "audio/mpeg",
    });
  } catch { /* ignore — local cache still works */ }
}

async function downloadRemote(slot: AudioSlot): Promise<Stored | null> {
  try {
    const { data: list } = await supabase.storage.from(BUCKET).list("", { limit: 100 });
    const match = (list || []).find((f) => f.name.startsWith(`${slot}.`));
    if (!match) return null;
    const { data, error } = await supabase.storage.from(BUCKET).download(match.name);
    if (error || !data) return null;
    const blob = data instanceof Blob ? data : new Blob([data]);
    const name = readNames()[slot] || match.name;
    return { blob, name, type: blob.type || "audio/mpeg" };
  } catch {
    return null;
  }
}

export async function saveAudio(
  slot: AudioSlot,
  file: File,
): Promise<{ url: string; name: string }> {
  if (file.size > MAX_BYTES) {
    throw new Error(
      `File terlalu besar (${(file.size / 1024 / 1024).toFixed(1)} MB). Maksimum 100 MB.`,
    );
  }
  const buf = await file.arrayBuffer();
  const blob = new Blob([buf], { type: file.type || "audio/mpeg" });
  const name = file.name;
  writeName(slot, name);
  await idbPut(slot, { blob, name, type: blob.type });
  // Push to cloud so every device gets it as the default. Fire-and-forget
  // (returns quickly so UI stays responsive; upload continues in background).
  void uploadRemote(slot, blob, name);
  return { url: URL.createObjectURL(blob), name };
}

export async function loadAudio(
  slot: AudioSlot,
): Promise<{ url: string; name: string } | null> {
  // Fast path: local IndexedDB cache
  const cached = await idbGet(slot);
  if (cached) return { url: URL.createObjectURL(cached.blob), name: cached.name };
  // Fallback: fetch from cloud and hydrate the cache
  const remote = await downloadRemote(slot);
  if (!remote) return null;
  await idbPut(slot, remote);
  return { url: URL.createObjectURL(remote.blob), name: remote.name };
}

export async function clearAudio(slot: AudioSlot): Promise<void> {
  clearName(slot);
  await idbDelete(slot);
  try {
    const { data: list } = await supabase.storage.from(BUCKET).list("", { limit: 100 });
    const oldies = (list || []).filter((f) => f.name.startsWith(`${slot}.`));
    if (oldies.length) {
      await supabase.storage.from(BUCKET).remove(oldies.map((f) => f.name));
    }
  } catch { /* ignore */ }
}

// Backwards-compatible wrappers for the existing "music" slot.
export const saveMusic = (f: File) => saveAudio("music", f);
export const loadMusic = () => loadAudio("music");
export const clearMusic = () => clearAudio("music");
