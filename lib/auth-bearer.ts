import { createClient } from '@supabase/supabase-js'
import type { User } from '@supabase/supabase-js'

// Auth via `Authorization: Bearer <token>` — para clientes que não têm cookie
// de sessão (a extensão de Chrome, o app Windows via server/). Diferente de
// lib/supabase-server.ts, que usa @supabase/ssr + cookies (páginas do site).
export async function getUserFromBearer(request: Request): Promise<User | null> {
  const authHeader = request.headers.get('authorization') ?? ''
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null
  if (!token) return null

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )
  const { data, error } = await supabase.auth.getUser(token)
  if (error) return null
  return data.user
}
