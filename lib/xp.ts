export function awardXP(event: string) {
  fetch('/api/gamification/award-action', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ event }),
  }).catch(() => {})
}
