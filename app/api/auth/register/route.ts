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
    const { organizationName, slug, state, fullName, email, password } = await req.json()

    // Validate input
    if (!organizationName || !slug || !state || !fullName || !email || !password) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      )
    }

    // Validate state code
    if (!/^[A-Z]{2}$/.test(state)) {
      return NextResponse.json(
        { error: 'Invalid state code' },
        { status: 400 }
      )
    }

    // Validate password length
    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters' },
        { status: 400 }
      )
    }

    // Check if slug already exists
    const { data: existingTenant } = await supabaseAdmin
      .from('tenants')
      .select('id')
      .eq('slug', slug)
      .single()

    if (existingTenant) {
      return NextResponse.json(
        { error: 'An organization with this name already exists. Please choose a different name.' },
        { status: 409 }
      )
    }

    // Check if email already exists
    const { data: { users } } = await supabaseAdmin.auth.admin.listUsers()
    const existingUser = users.find(u => u.email === email)
    
    if (existingUser) {
      return NextResponse.json(
        { error: 'An account with this email already exists' },
        { status: 409 }
      )
    }

    // Step 1: Create tenant
    const { data: tenant, error: tenantError } = await supabaseAdmin
      .from('tenants')
      .insert({
        name: organizationName,
        slug,
        state,
        active: true,
        subscription_status: 'inactive',
        subscription_tier: 'standard',
      })
      .select()
      .single()

    if (tenantError) {
      console.error('Error creating tenant:', tenantError)
      return NextResponse.json(
        { error: 'Failed to create organization' },
        { status: 500 }
      )
    }

    // Step 2: Create user account (email verification sent automatically)
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: false, // Require email verification (Supabase sends email automatically)
      user_metadata: {
        full_name: fullName,
      },
    })

    if (authError) {
      console.error('Error creating user:', authError)
      // Rollback: delete tenant
      await supabaseAdmin.from('tenants').delete().eq('id', tenant.id)
      
      return NextResponse.json(
        { error: 'Failed to create user account: ' + authError.message },
        { status: 500 }
      )
    }

    // Step 3: Create profile
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .insert({
        id: authData.user.id,
        tenant_id: tenant.id,
        role: 'county_admin',
        full_name: fullName,
      })

    if (profileError) {
      console.error('Error creating profile:', profileError)
      console.error('Profile data attempted:', {
        id: authData.user.id,
        tenant_id: tenant.id,
        role: 'county_admin',
        full_name: fullName,
      })
      
      // Rollback: delete user and tenant
      try {
        await supabaseAdmin.auth.admin.deleteUser(authData.user.id)
        await supabaseAdmin.from('tenants').delete().eq('id', tenant.id)
      } catch (rollbackError) {
        console.error('Rollback error:', rollbackError)
      }
      
      return NextResponse.json(
        { 
          error: 'Failed to create user profile: ' + profileError.message,
          details: profileError.hint || 'Please contact support if this continues'
        },
        { status: 500 }
      )
    }

    // Note: Supabase automatically sends verification email when email_confirm is false

    return NextResponse.json({
      success: true,
      message: 'Registration successful! Please check your email to verify your account.',
      tenant: {
        id: tenant.id,
        name: tenant.name,
        slug: tenant.slug,
      },
    }, { status: 201 })

  } catch (error: any) {
    console.error('Registration error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
