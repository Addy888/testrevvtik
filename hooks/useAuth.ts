'use client'

import { useEffect, useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export function useAuth() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const getUser = async () => {
      const { data, error } = await supabase.auth.getUser()

      if (!error) {
        setUser(data.user)
      }

      setLoading(false)
    }

    getUser()
  }, [])

  const logout = async () => {
    await supabase.auth.signOut()
    window.location.href = '/auth/login'
  }

  return { user, loading, logout }
}