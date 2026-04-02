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
          .select('id, company_id, role')
          .eq('id', user.id)
          .single()

        if (usersError || !data) {
          setAppUser(null)
          setError('User profile not found')
          return
        }

        // Determine Personal vs Team onboarding by fetching company type.
        let companyType: AppUser['company_type'] = null
        try {
          const { data: companyData } = await supabase
            .from('companies')
            .select('type')
            .eq('id', (data as any).company_id)
            .single()
          companyType = (companyData?.type ?? null) as AppUser['company_type']
        } catch {
          companyType = null
        }

        setAppUser({ ...(data as AppUser), company_type: companyType })
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

