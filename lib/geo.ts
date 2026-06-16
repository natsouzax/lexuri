import { headers } from 'next/headers'

export async function isBrazil(): Promise<boolean> {
  const h = await headers()
  const country = h.get('x-vercel-ip-country') ?? h.get('cf-ipcountry')
  if (country) return country === 'BR'
  const lang = h.get('accept-language') ?? ''
  return lang.toLowerCase().startsWith('pt-br')
}
