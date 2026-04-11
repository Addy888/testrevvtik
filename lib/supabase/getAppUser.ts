import { createClient } from "@/lib/supabase/server"

export type Role = "SUPER_ADMIN" | "ADMIN" | "MANAGER" | "EMPLOYEE"

export type AppUser = {
  id: string
  name: string | null
  email: string | null
  role: Role
  company_id: string | null
  manager_id: string | null
  company_name: string | null
  company_created_at: string | null
}

type AppUserWithRoleError = Error & { status?: number }

export async function getAppUserFromSupabase(supabase: any): Promise<AppUser> {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (!user || authError) {
    const err = new Error("Unauthorized") as AppUserWithRoleError
    err.status = 401
    throw err
  }

  // Fetch user data along with the company's info using a join
  console.log("Fetching user from app_users table");
  const { data: appUser, error: usersError } = await supabase
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
    const err = new Error("Failed to fetch user profile") as AppUserWithRoleError
    err.status = 500
    throw err
  }

  if (!appUser) {
    // If not exists, create default EMPLOYEE entry
    const newAppUser = {
      id: user.id,
      name: user.user_metadata?.full_name || user.email?.split("@")[0] || "New User",
      email: user.email,
      role: "EMPLOYEE",
      company_id: null,
      manager_id: null,
      company_name: null,
      company_created_at: null,
    }
    
    // Attempt to insert
    const { error: insertError } = await supabase
      .from("app_users")
      .insert({
        id: newAppUser.id,
        name: newAppUser.name,
        email: newAppUser.email,
        role: newAppUser.role,
        company_id: newAppUser.company_id,
        manager_id: newAppUser.manager_id,
      })
      
    if (insertError) {
      console.error("Error creating default user profile:", insertError);
    }
    
    return newAppUser as AppUser
  }
  
  // Map the joined company data
  const result: AppUser = {
    ...appUser,
    company_name: (appUser.company as any)?.name || null,
    company_created_at: null // Standardizing
  }
  
  delete (result as any).company // Clean up the joined object
  
  return result
}

export async function requireAppUser(): Promise<AppUser> {
  const supabase = await createClient()
  return getAppUserFromSupabase(supabase)
}