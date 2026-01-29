'use client'

import { useState } from 'react'
import { Check } from 'lucide-react'
import { loadStripe } from '@stripe/stripe-js'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

interface SubscriptionPlansProps {
  tenantId: string
  currentStatus?: string
}

export default function SubscriptionPlans({ tenantId, currentStatus }: SubscriptionPlansProps) {
  const [loading, setLoading] = useState(false)
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('monthly')

  const pricing = {
    monthly: {
      price: 50,
      priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_MONTHLY!,
      period: 'month',
      savings: null,
    },
    yearly: {
      price: 500,
      priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_YEARLY!,
      period: 'year',
      savings: '$100 (17% off)',
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
  ]

  const handleSubscribe = async () => {
    setLoading(true)

    try {
      const priceId = pricing[billingPeriod].priceId

      const response = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priceId, tenantId }),
      })

      const { sessionId } = await response.json()
      const stripe = await stripePromise

      await stripe?.redirectToCheckout({ sessionId })
    } catch (error) {
      console.error('Error:', error)
      alert('Failed to start checkout')
    } finally {
      setLoading(false)
    }
  }

  const selectedPlan = pricing[billingPeriod]

  return (
    <div className="space-y-6">
      {/* Billing Toggle */}
      <div className="flex justify-center">
        <div className="inline-flex rounded-lg border border-gray-200 p-1 bg-gray-50">
          <button
            onClick={() => setBillingPeriod('monthly')}
            className={`px-6 py-2 text-sm font-medium rounded-md transition-colors ${
              billingPeriod === 'monthly'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setBillingPeriod('yearly')}
            className={`px-6 py-2 text-sm font-medium rounded-md transition-colors relative ${
              billingPeriod === 'yearly'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            Yearly
            <span className="ml-2 text-xs font-semibold text-green-600 bg-green-50 px-1.5 py-0.5 rounded">
              Save $100
            </span>
          </button>
        </div>
      </div>

      {/* Single Plan Card */}
      <div className="max-w-lg mx-auto">
        <div className="bg-white rounded-xl shadow-lg border-2 border-blue-600 p-8">
          {/* Header */}
          <div className="text-center mb-6">
            <div className="inline-block bg-blue-100 text-blue-800 text-xs font-semibold px-3 py-1 rounded-full mb-4">
              Standard Plan
            </div>
            <div className="mb-2">
              <span className="text-5xl font-bold text-gray-900">${selectedPlan.price}</span>
              <span className="text-xl text-gray-600">/{selectedPlan.period}</span>
            </div>
            {selectedPlan.savings && (
              <p className="text-green-600 font-medium">Save {selectedPlan.savings}</p>
            )}
          </div>

          {/* Features */}
          <ul className="space-y-3 mb-8">
            {features.map((feature) => (
              <li key={feature} className="flex items-start">
                <Check className="h-5 w-5 text-green-500 mr-3 flex-shrink-0 mt-0.5" />
                <span className="text-gray-700">{feature}</span>
              </li>
            ))}
          </ul>

          {/* CTA Button */}
          <button
            onClick={handleSubscribe}
            disabled={loading || currentStatus === 'active'}
            className="w-full py-4 px-6 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Processing...' : currentStatus === 'active' ? 'Already Subscribed' : 'Subscribe Now'}
          </button>

          {/* Trial Notice */}
          <p className="text-center text-sm text-gray-600 mt-4">
            14-day free trial • Cancel anytime
          </p>
        </div>
      </div>

      {/* Trust Indicators */}
      <div className="text-center space-y-2 text-sm text-gray-600">
        <p>🔒 Secure payment powered by Stripe</p>
        <p>💳 No credit card required for trial</p>
        <p>📧 Email support included</p>
      </div>
    </div>
  )
}
