import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { supabase } from '@/lib/supabase'
import Stripe from 'stripe'

export async function POST(req: NextRequest) {
  const body = await req.text()
  const signature = req.headers.get('stripe-signature')!

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  console.log('Received event:', event.type)

  // Handle the event
  switch (event.type) {
    case 'customer.subscription.created':
    case 'customer.subscription.updated':
      await handleSubscriptionUpdate(event.data.object as Stripe.Subscription)
      break

    case 'customer.subscription.deleted':
      await handleSubscriptionDeleted(event.data.object as Stripe.Subscription)
      break

    case 'invoice.payment_succeeded':
      await handlePaymentSucceeded(event.data.object as Stripe.Invoice)
      break

    case 'invoice.payment_failed':
      await handlePaymentFailed(event.data.object as Stripe.Invoice)
      break

    default:
      console.log(`Unhandled event type: ${event.type}`)
  }

  return NextResponse.json({ received: true })
}

async function handleSubscriptionUpdate(subscription: Stripe.Subscription) {
  const tenantId = subscription.metadata.tenant_id

  const updateData = {
    subscription_status: subscription.status,
    stripe_subscription_id: subscription.id,
    subscription_start_date: new Date(subscription.current_period_start * 1000),
    subscription_end_date: new Date(subscription.current_period_end * 1000),
    trial_end_date: subscription.trial_end 
      ? new Date(subscription.trial_end * 1000) 
      : null,
  }

  await supabase
    .from('tenants')
    .update(updateData)
    .eq('id', tenantId)

  // Log to history
  await supabase
    .from('subscription_history')
    .insert({
      tenant_id: tenantId,
      status: subscription.status,
      stripe_event_id: subscription.id,
      stripe_event_type: 'subscription.updated',
      metadata: subscription.metadata,
    })

  console.log('Updated subscription for tenant:', tenantId)
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const tenantId = subscription.metadata.tenant_id

  await supabase
    .from('tenants')
    .update({
      subscription_status: 'canceled',
      subscription_end_date: new Date(),
    })
    .eq('id', tenantId)

  console.log('Canceled subscription for tenant:', tenantId)
}

async function handlePaymentSucceeded(invoice: Stripe.Invoice) {
  console.log('Payment succeeded for:', invoice.customer)
}

async function handlePaymentFailed(invoice: Stripe.Invoice) {
  const customerId = invoice.customer as string

  // Find tenant by customer ID
  const { data: tenant } = await supabase
    .from('tenants')
    .select('id')
    .eq('stripe_customer_id', customerId)
    .single()

  if (tenant) {
    await supabase
      .from('tenants')
      .update({ subscription_status: 'past_due' })
      .eq('id', tenant.id)

    console.log('Payment failed for tenant:', tenant.id)
  }
}
