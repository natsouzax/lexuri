const SAVED_ITEMS_KEY = 'verbly:saved_feed_items'

export function getSavedItemIds(): string[] {
  if (typeof window === 'undefined') return []
  try {
    return JSON.parse(localStorage.getItem(SAVED_ITEMS_KEY) ?? '[]') as string[]
  } catch {
    return []
  }
}

export function saveItem(id: string): void {
  const ids = getSavedItemIds()
  if (!ids.includes(id)) {
    localStorage.setItem(SAVED_ITEMS_KEY, JSON.stringify([...ids, id]))
  }
}

export function unsaveItem(id: string): void {
  const ids = getSavedItemIds().filter((s) => s !== id)
  localStorage.setItem(SAVED_ITEMS_KEY, JSON.stringify(ids))
}

export function isItemSaved(id: string): boolean {
  return getSavedItemIds().includes(id)
}
