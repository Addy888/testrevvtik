'use client'

import { useEffect, useMemo, useState } from 'react'
import { createBrowserClient } from '@/lib/supabase'
import type { AppUser } from '@/lib/supabase/getAppUser'

const supabase = createBrowserClient()

export function useAppUser() {
  const [appUser, setAppUser] = useState<AppUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const run = async () => {
      try {
        setLoading(true)
        setError(null)

        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser()

        if (authError || !user) {
          setAppUser(null)
          setError('Unauthorized')
          return
        }

        const { data, error: usersError } = await supabase
          .from('users')
          .select('id, email, role')
          .eq('id', user.id)
          .maybeSingle()

        if (usersError) {
          console.error('Error fetching user profile:', usersError)
        }

        if (!data) {
          setAppUser({
            id: user.id,
            email: user.email ?? null,
            role: 'admin',
          })
          setError(null)
          return
        }
        setAppUser(data as AppUser)
      } catch (e) {
        setAppUser(null)
        setError(e instanceof Error ? e.message : 'Failed to load user')
      } finally {
        setLoading(false)
      }
    }

    run()
  }, [])

  const role = useMemo(() => appUser?.role ?? null, [appUser])

  return { appUser, role, loading, error }
}

