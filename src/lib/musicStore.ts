// IndexedDB-backed persistent audio storage.
// Avoids localStorage quota issues that plague data-URL persistence,
// so uploaded audio (background music + spin/winner SFX) survives reloads.

const DB_NAME = "gebyar-k3-music";
const STORE = "music";
const MAX_BYTES = 100 * 1024 * 1024; // 100 MB hard cap

export type AudioSlot = "music" | "spin" | "winner";

type Stored = { blob: Blob; name: string; type: string };

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
  const db = await openDb();
  await new Promise<void>((res, rej) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).put(
      { blob, name: file.name, type: blob.type } satisfies Stored,
      slot === "music" ? "current" : slot,
    );
    tx.oncomplete = () => res();
    tx.onerror = () => rej(tx.error);
    tx.onabort = () => rej(tx.error);
  });
  db.close();
  return { url: URL.createObjectURL(blob), name: file.name };
}

export async function loadAudio(
  slot: AudioSlot,
): Promise<{ url: string; name: string } | null> {
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
    if (!stored) return null;
    return { url: URL.createObjectURL(stored.blob), name: stored.name };
  } catch {
    return null;
  }
}

export async function clearAudio(slot: AudioSlot): Promise<void> {
  try {
    const db = await openDb();
    await new Promise<void>((res, rej) => {
      const tx = db.transaction(STORE, "readwrite");
      tx.objectStore(STORE).delete(slot === "music" ? "current" : slot);
      tx.oncomplete = () => res();
      tx.onerror = () => rej(tx.error);
    });
    db.close();
  } catch {
    /* ignore */
  }
}

// Backwards-compatible wrappers for the existing "music" slot.
export const saveMusic = (f: File) => saveAudio("music", f);
export const loadMusic = () => loadAudio("music");
export const clearMusic = () => clearAudio("music");
