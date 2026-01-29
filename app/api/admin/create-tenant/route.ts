import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

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
    // Verify user is super_admin
    const authHeader = req.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '')
    
    if (!token) {
      // Try to get user from cookie-based session
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      
      const supabase = createClient(supabaseUrl, supabaseAnonKey, {
        auth: {
          persistSession: false,
        },
      })

      // Get cookies from request
      const cookies = req.cookies
      const accessToken = cookies.get('sb-access-token')?.value
      const refreshToken = cookies.get('sb-refresh-token')?.value

      if (!accessToken || !refreshToken) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }

      // Set session
      const { data: { user }, error: userError } = await supabase.auth.getUser(accessToken)
      
      if (userError || !user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }

      // Check if user is super_admin
      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      if (profile?.role !== 'super_admin') {
        return NextResponse.json({ error: 'Forbidden: Super admin only' }, { status: 403 })
      }
    }

    // Get request body
    const { name, slug, state } = await req.json()

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
