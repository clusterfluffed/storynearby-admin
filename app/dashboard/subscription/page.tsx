'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Check, ArrowLeft } from 'lucide-react'
import { loadStripe } from '@stripe/stripe-js'
import Link from 'next/link'
import AdminNav from '@/app/components/AdminNav'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

export default function SubscriptionPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [tenantId, setTenantId] = useState<string | null>(null)
  const [currentStatus, setCurrentStatus] = useState<string>('inactive')
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('yearly')

  useEffect(() => {
    async function loadData() {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        router.push('/auth/signin')
        return
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select(`
          tenant_id,
          tenants (
            subscription_status
          )
        `)
        .eq('id', user.id)
        .single()

      if (profile) {
        setTenantId(profile.tenant_id)
        const tenant = profile.tenants as any
        if (tenant) {
          setCurrentStatus(tenant.subscription_status || 'inactive')
        }
      }
    }

    loadData()
  }, [router])

  const pricing = {
    monthly: {
      price: 50,
      priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_MONTHLY!,
      period: 'month',
      savings: null,
      total: 600,
    },
    yearly: {
      price: 500,
      priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_YEARLY!,
      period: 'year',
      savings: '$100',
      savingsPercent: '17%',
      total: 500,
    },
  }

  const features = [
    'Unlimited locations',
    'Museum hours management',
    'Image uploads (5 per location)',
    'Mobile app visibility',
    'Interactive map features',
    'Email support',
    'Dashboard analytics',
    'Regular updates & improvements',
  ]

  async function handleSubscribe() {
    if (!tenantId) {
      alert('Unable to find your account. Please try again.')
      return
    }

    setLoading(true)

    try {
      const priceId = pricing[billingPeriod].priceId

      const response = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priceId, tenantId }),
      })

      const { sessionId, error } = await response.json()

      if (error) {
        throw new Error(error)
      }

      const stripe = await stripePromise

      const { error: stripeError } = await stripe!.redirectToCheckout({ sessionId })

      if (stripeError) {
        throw stripeError
      }
    } catch (err: any) {
      console.error('Error:', err)
      alert(err.message || 'Failed to start checkout')
      setLoading(false)
    }
  }

  const selectedPlan = pricing[billingPeriod]

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminNav activeTab="locations" />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/dashboard/account"
            className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Account
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Choose Your Plan</h1>
          <p className="mt-2 text-lg text-gray-600">
            Make your historical locations visible to the community
          </p>
        </div>

        {/* Billing Toggle */}
        <div className="flex justify-center mb-8">
          <div className="inline-flex rounded-lg border-2 border-blue-600 p-1 bg-gray-50">
            <button
              onClick={() => setBillingPeriod('monthly')}
              className={`px-8 py-3 text-sm font-semibold rounded-md transition-all ${
                billingPeriod === 'monthly'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingPeriod('yearly')}
              className={`px-8 py-3 text-sm font-semibold rounded-md transition-all relative ${
                billingPeriod === 'yearly'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              Yearly
              <span className="ml-2 inline-block bg-green-500 text-white text-xs font-bold px-2 py-0.5 rounded">
                SAVE {pricing.yearly.savingsPercent}
              </span>
            </button>
          </div>
        </div>

        {/* Pricing Comparison */}
        {billingPeriod === 'yearly' && (
          <div className="mb-6 text-center">
            <p className="text-lg text-gray-700">
              <span className="line-through text-gray-500">${pricing.yearly.total + 100}/year</span>
              {' → '}
              <span className="font-bold text-green-600">${pricing.yearly.total}/year</span>
              {' '}
              <span className="text-sm text-gray-600">({pricing.yearly.savings} savings)</span>
            </p>
          </div>
        )}

        {/* Main Plan Card */}
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-2xl shadow-xl border-4 border-blue-600 overflow-hidden">
            {/* Header Badge */}
            <div className="bg-blue-600 text-white text-center py-3">
              <p className="text-sm font-semibold uppercase tracking-wide">
                Standard Plan - 14-Day Free Trial
              </p>
            </div>

            <div className="p-8">
              {/* Pricing */}
              <div className="text-center mb-8">
                <div className="mb-2">
                  <span className="text-6xl font-bold text-gray-900">${selectedPlan.price}</span>
                  <span className="text-2xl text-gray-600">/{selectedPlan.period}</span>
                </div>
                {selectedPlan.savings && (
                  <div className="inline-block bg-green-100 text-green-800 px-4 py-2 rounded-full">
                    <p className="font-semibold">Save {selectedPlan.savings} with yearly billing</p>
                  </div>
                )}
              </div>

              {/* Features */}
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Everything included:</h3>
                <ul className="space-y-3">
                  {features.map((feature) => (
                    <li key={feature} className="flex items-start">
                      <Check className="h-6 w-6 text-green-500 mr-3 flex-shrink-0" />
                      <span className="text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* CTA Button */}
              <button
                onClick={handleSubscribe}
                disabled={loading || currentStatus === 'active' || currentStatus === 'trialing'}
                className="w-full py-4 px-6 bg-blue-600 text-white text-lg font-bold rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
              >
                {loading 
                  ? 'Processing...' 
                  : (currentStatus === 'active' || currentStatus === 'trialing')
                    ? 'Already Subscribed' 
                    : 'Start 14-Day Free Trial'
                }
              </button>

              {/* Trial Notice */}
              <div className="mt-6 text-center space-y-2">
                <p className="text-sm font-medium text-gray-900">
                  ✨ Start your free trial today
                </p>
                <p className="text-sm text-gray-600">
                  No credit card charged for 14 days • Cancel anytime
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Trust Indicators */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
          <div className="bg-white rounded-lg p-6 shadow-md">
            <div className="text-3xl mb-2">🔒</div>
            <h3 className="font-semibold text-gray-900 mb-1">Secure Payments</h3>
            <p className="text-sm text-gray-600">Powered by Stripe</p>
          </div>
          <div className="bg-white rounded-lg p-6 shadow-md">
            <div className="text-3xl mb-2">💳</div>
            <h3 className="font-semibold text-gray-900 mb-1">No Risk Trial</h3>
            <p className="text-sm text-gray-600">Free for 14 days</p>
          </div>
          <div className="bg-white rounded-lg p-6 shadow-md">
            <div className="text-3xl mb-2">📧</div>
            <h3 className="font-semibold text-gray-900 mb-1">Email Support</h3>
            <p className="text-sm text-gray-600">We're here to help</p>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mt-12 bg-white rounded-lg shadow-md p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Frequently Asked Questions</h2>
          
          <div className="space-y-6">
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">When will I be charged?</h3>
              <p className="text-gray-600">
                Your 14-day free trial starts immediately. You won't be charged until the trial ends. 
                You can cancel anytime during the trial with no charge.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Can I cancel anytime?</h3>
              <p className="text-gray-600">
                Yes! You can cancel your subscription at any time from your account settings. 
                Your locations will remain visible until the end of your billing period.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 mb-2">What happens if I don't subscribe?</h3>
              <p className="text-gray-600">
                Your locations won't be visible in the mobile app. You can still manage them in the 
                admin dashboard, but community members won't be able to discover your historical sites.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 mb-2">How do I manage my subscription?</h3>
              <p className="text-gray-600">
                You can manage your subscription, update payment methods, and view invoices from 
                your Account page. Click "Manage Subscription" to access the billing portal.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
