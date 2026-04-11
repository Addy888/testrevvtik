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

        console.log("Fetching user from app_users table");
        const { data, error: usersError } = await supabase
          .from("app_users")
          .select(`
            id,
            name,
            email,
            role,
            company_id,
            manager_id,
            company:companies(id, name)
          `)
          .eq("email", user.email)
          .maybeSingle()

        if (usersError) {
          console.error("Error fetching user profile:", usersError)
        }

        if (!data) {
          setAppUser({
            id: user.id,
            email: user.email ?? null,
            name: user.user_metadata?.full_name || user.email?.split("@")[0] || "New User",
            role: "ADMIN",
            company_id: null,
            manager_id: null,
            company_name: null,
            company_created_at: null,
          })
          setError(null)
          return
        }
        
        const enrichedUser = {
          ...data,
          company_name: (data.company as any)?.name || null,
          company_created_at: null // Standardizing since created_at was removed from join
        }
        delete (enrichedUser as any).company
        
        setAppUser(enrichedUser as AppUser)
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

