import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

// Create admin client with service role key (bypasses RLS)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
)

export async function POST(req: NextRequest) {
  try {
    // Get the current user from the request
    // Extract auth token from Authorization header or cookies
    const authHeader = req.headers.get('authorization')
    let accessToken = authHeader?.replace('Bearer ', '')
    
    if (!accessToken) {
      // Try to get from cookies
      const cookieStore = cookies()
      
      // Try different possible cookie names
      const possibleTokens = [
        cookieStore.get('sb-access-token'),
        cookieStore.get('supabase-auth-token'),
      ]
      
      for (const cookie of possibleTokens) {
        if (cookie?.value) {
          accessToken = cookie.value
          break
        }
      }
      
      // If still no token, try to parse the session cookie
      if (!accessToken) {
        const allCookies = cookieStore.getAll()
        const authCookie = allCookies.find(c => c.name.includes('auth-token'))
        if (authCookie) {
          try {
            const parsed = JSON.parse(authCookie.value)
            accessToken = parsed.access_token || parsed.accessToken
          } catch (e) {
            // Cookie might not be JSON
            accessToken = authCookie.value
          }
        }
      }
    }

    if (!accessToken) {
      return NextResponse.json({ 
        error: 'Unauthorized - No valid session found. Please sign in again.' 
      }, { status: 401 })
    }

    // Verify the token and get user
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(accessToken)
    
    if (userError || !user) {
      console.error('Auth error:', userError)
      return NextResponse.json({ 
        error: 'Unauthorized - Invalid session. Please sign in again.' 
      }, { status: 401 })
    }

    // Check if user is super_admin
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profileError) {
      console.error('Profile error:', profileError)
      return NextResponse.json({ 
        error: 'Error checking user permissions' 
      }, { status: 500 })
    }

    if (profile?.role !== 'super_admin') {
      return NextResponse.json({ 
        error: 'Forbidden: Super admin access required. Your role: ' + (profile?.role || 'none')
      }, { status: 403 })
    }

    // Get request body
    const body = await req.json()
    const { name, slug, state } = body

    // Validate input
    if (!name || !slug || !state) {
      return NextResponse.json(
        { error: 'Missing required fields: name, slug, state' },
        { status: 400 }
      )
    }

    // Validate state code (2 letters)
    if (!/^[A-Z]{2}$/.test(state)) {
      return NextResponse.json(
        { error: 'Invalid state code. Must be 2 uppercase letters (e.g., IN, OH)' },
        { status: 400 }
      )
    }

    // Check if slug already exists
    const { data: existing } = await supabaseAdmin
      .from('tenants')
      .select('id')
      .eq('slug', slug)
      .single()

    if (existing) {
      return NextResponse.json(
        { error: 'A county with this slug already exists. Please use a different name.' },
        { status: 409 }
      )
    }

    // Create tenant using admin client
    const { data, error } = await supabaseAdmin
      .from('tenants')
      .insert({
        name,
        slug,
        state,
        active: true,
        subscription_status: 'inactive',
        subscription_tier: 'standard',
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating tenant:', error)
      return NextResponse.json(
        { error: `Database error: ${error.message}` },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, tenant: data }, { status: 201 })
  } catch (error: any) {
    console.error('Error in create-tenant API:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
