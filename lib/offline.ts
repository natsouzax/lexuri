/**
 * Offline support — IndexedDB mutation queue.
 * Import only in browser (client components / service worker).
 */

const DB_NAME = 'verbly-offline'
const DB_VERSION = 1
const STORE_QUEUE = 'mutation_queue'
const STORE_CACHE  = 'flashcard_cache'

export interface QueuedMutation {
  clientId: string       // stable UUID generated client-side
  cardId: string
  quality: number
  responseTimeSec?: number
  reviewedAt: string     // ISO timestamp
  synced: boolean
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains(STORE_QUEUE)) {
        db.createObjectStore(STORE_QUEUE, { keyPath: 'clientId' })
      }
      if (!db.objectStoreNames.contains(STORE_CACHE)) {
        db.createObjectStore(STORE_CACHE, { keyPath: 'id' })
      }
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror   = () => reject(req.error)
  })
}

/** Queue a review mutation for later sync. */
export async function queueReview(mutation: QueuedMutation): Promise<void> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_QUEUE, 'readwrite')
    tx.objectStore(STORE_QUEUE).put(mutation)
    tx.oncomplete = () => resolve()
    tx.onerror    = () => reject(tx.error)
  })
}

/** Return all un-synced mutations. */
export async function getPendingMutations(): Promise<QueuedMutation[]> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_QUEUE, 'readonly')
    const req = tx.objectStore(STORE_QUEUE).getAll()
    req.onsuccess = () => resolve((req.result as QueuedMutation[]).filter(m => !m.synced))
    req.onerror   = () => reject(req.error)
  })
}

/** Mark a mutation as synced. */
export async function markSynced(clientId: string): Promise<void> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_QUEUE, 'readwrite')
    const store = tx.objectStore(STORE_QUEUE)
    const req = store.get(clientId)
    req.onsuccess = () => {
      const record = req.result as QueuedMutation | undefined
      if (record) store.put({ ...record, synced: true })
      resolve()
    }
    req.onerror = () => reject(req.error)
  })
}

/** Push pending mutations to the server. Idempotent — server deduplicates by clientId. */
export async function syncPendingMutations(): Promise<{ synced: number; failed: number }> {
  const pending = await getPendingMutations()
  let synced = 0, failed = 0

  for (const mutation of pending) {
    try {
      const res = await fetch('/api/offline/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mutation),
      })
      if (res.ok) {
        await markSynced(mutation.clientId)
        synced++
      } else {
        failed++
      }
    } catch {
      failed++
    }
  }

  return { synced, failed }
}

/** Cache flashcards locally for offline access. */
export async function cacheFlashcards(cards: object[]): Promise<void> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_CACHE, 'readwrite')
    const store = tx.objectStore(STORE_CACHE)
    cards.forEach(c => store.put(c))
    tx.oncomplete = () => resolve()
    tx.onerror    = () => reject(tx.error)
  })
}

/** Retrieve cached flashcards. */
export async function getCachedFlashcards<T = object>(): Promise<T[]> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_CACHE, 'readonly')
    const req = tx.objectStore(STORE_CACHE).getAll()
    req.onsuccess = () => resolve(req.result as T[])
    req.onerror   = () => reject(req.error)
  })
}
