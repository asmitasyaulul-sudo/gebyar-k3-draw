// IndexedDB-backed persistent music storage.
// Avoids localStorage quota issues that plague data-URL persistence,
// so uploaded music survives reloads even for multi-MB MP3 files.

const DB_NAME = "gebyar-k3-music";
const STORE = "music";
const KEY = "current";
const MAX_BYTES = 100 * 1024 * 1024; // 100 MB hard cap

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

export async function saveMusic(file: File): Promise<{ url: string; name: string }> {
  if (file.size > MAX_BYTES) {
    throw new Error(
      `File terlalu besar (${(file.size / 1024 / 1024).toFixed(1)} MB). Maksimum 100 MB.`,
    );
  }
  // Read into an in-memory Blob so the stored copy is independent of the
  // File handle (which becomes invalid after the input element resets).
  const buf = await file.arrayBuffer();
  const blob = new Blob([buf], { type: file.type || "audio/mpeg" });
  const db = await openDb();
  await new Promise<void>((res, rej) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).put(
      { blob, name: file.name, type: blob.type } satisfies Stored,
      KEY,
    );
    tx.oncomplete = () => res();
    tx.onerror = () => rej(tx.error);
    tx.onabort = () => rej(tx.error);
  });
  db.close();
  return { url: URL.createObjectURL(blob), name: file.name };
}

export async function loadMusic(): Promise<{ url: string; name: string } | null> {
  try {
    const db = await openDb();
    const stored = await new Promise<Stored | null>((res, rej) => {
      const tx = db.transaction(STORE, "readonly");
      const req = tx.objectStore(STORE).get(KEY);
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

export async function clearMusic(): Promise<void> {
  try {
    const db = await openDb();
    await new Promise<void>((res, rej) => {
      const tx = db.transaction(STORE, "readwrite");
      tx.objectStore(STORE).delete(KEY);
      tx.oncomplete = () => res();
      tx.onerror = () => rej(tx.error);
    });
    db.close();
  } catch {
    /* ignore */
  }
}
