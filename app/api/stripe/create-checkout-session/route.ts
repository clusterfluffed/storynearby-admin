import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { supabase } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  try {
    const { priceId, tenantId } = await req.json()

    // Get tenant info
    const { data: tenant } = await supabase
      .from('tenants')
      .select('stripe_customer_id, name')
      .eq('id', tenantId)
      .single()

    let customerId = tenant?.stripe_customer_id

    // Create customer if doesn't exist
    if (!customerId) {
      const customer = await stripe.customers.create({
        metadata: {
          tenant_id: tenantId,
        },
      })
      customerId = customer.id

      // Save customer ID
      await supabase
        .from('tenants')
        .update({ stripe_customer_id: customerId })
        .eq('id', tenantId)
    }

    // Create checkout session with 14-day trial
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      subscription_data: {
        trial_period_days: 14,
        metadata: {
          tenant_id: tenantId,
        },
      },
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/account?success=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/account?canceled=true`,
      metadata: {
        tenant_id: tenantId,
      },
    })

    return NextResponse.json({ sessionId: session.id })
  } catch (error: any) {
    console.error('Error creating checkout session:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
