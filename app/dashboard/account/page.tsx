'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { User, Mail, Calendar, Save, CreditCard, AlertCircle, CheckCircle, Clock, XCircle } from 'lucide-react'
import Link from 'next/link'
import AdminNav from '@/app/components/AdminNav'

export default function AccountPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [managingSubscription, setManagingSubscription] = useState(false)

  const [accountData, setAccountData] = useState({
    email: '',
    firstName: '',
    lastName: '',
    createdAt: ''
  })

  const [subscriptionData, setSubscriptionData] = useState({
    status: 'inactive',
    tier: 'standard',
    startDate: null as Date | null,
    endDate: null as Date | null,
    trialEndDate: null as Date | null,
    stripeCustomerId: null as string | null,
  })

  const [tenantId, setTenantId] = useState<string | null>(null)

  useEffect(() => {
    loadAccount()

    // Check for success/cancel params from Stripe redirect
    if (searchParams.get('success') === 'true') {
      setMessage('Subscription activated successfully! 🎉')
      // Clear URL params
      router.replace('/dashboard/account')
    } else if (searchParams.get('canceled') === 'true') {
      setError('Subscription setup was canceled.')
      router.replace('/dashboard/account')
    }
  }, [searchParams, router])

  async function loadAccount() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        router.push('/auth/signin')
        return
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select(`
          first_name, 
          last_name,
          tenant_id,
          tenants (
            subscription_status,
            subscription_tier,
            subscription_start_date,
            subscription_end_date,
            trial_end_date,
            stripe_customer_id
          )
        `)
        .eq('id', user.id)
        .single()

      if (profile) {
        setAccountData({
          email: user.email || '',
          firstName: profile.first_name || '',
          lastName: profile.last_name || '',
          createdAt: new Date(user.created_at).toLocaleDateString()
        })

        setTenantId(profile.tenant_id)

        const tenant = profile.tenants as any
        if (tenant) {
          setSubscriptionData({
            status: tenant.subscription_status || 'inactive',
            tier: tenant.subscription_tier || 'standard',
            startDate: tenant.subscription_start_date ? new Date(tenant.subscription_start_date) : null,
            endDate: tenant.subscription_end_date ? new Date(tenant.subscription_end_date) : null,
            trialEndDate: tenant.trial_end_date ? new Date(tenant.trial_end_date) : null,
            stripeCustomerId: tenant.stripe_customer_id || null,
          })
        }
      }

      setLoading(false)
    } catch (err) {
      console.error('Error loading account:', err)
      setError('Failed to load account information')
      setLoading(false)
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setMessage('')
    setError('')

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          first_name: accountData.firstName,
          last_name: accountData.lastName,
        })
        .eq('id', user.id)

      if (updateError) throw updateError

      setMessage('Account updated successfully!')
    } catch (err: any) {
      setError(err.message || 'Failed to update account')
    } finally {
      setSaving(false)
    }
  }

  async function handlePasswordReset() {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(accountData.email, {
        redirectTo: `${window.location.origin}/auth/reset-password`
      })

      if (error) throw error

      setMessage('Password reset email sent! Check your inbox.')
    } catch (err: any) {
      setError(err.message || 'Failed to send reset email')
    }
  }

  async function handleManageSubscription() {
    if (!tenantId || !subscriptionData.stripeCustomerId) {
      setError('No subscription found')
      return
    }

    setManagingSubscription(true)

    try {
      const response = await fetch('/api/stripe/create-portal-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tenantId }),
      })

      const { url } = await response.json()

      if (url) {
        window.location.href = url
      } else {
        throw new Error('Failed to create portal session')
      }
    } catch (err: any) {
      setError(err.message || 'Failed to open subscription management')
      setManagingSubscription(false)
    }
  }

  function getSubscriptionBadge() {
    const badges = {
      active: {
        color: 'bg-green-100 text-green-800',
        icon: CheckCircle,
        text: 'Active',
      },
      trialing: {
        color: 'bg-blue-100 text-blue-800',
        icon: Clock,
        text: 'Trial Active',
      },
      past_due: {
        color: 'bg-yellow-100 text-yellow-800',
        icon: AlertCircle,
        text: 'Payment Due',
      },
      canceled: {
        color: 'bg-gray-100 text-gray-800',
        icon: XCircle,
        text: 'Canceled',
      },
      inactive: {
        color: 'bg-red-100 text-red-800',
        icon: XCircle,
        text: 'Inactive',
      },
    }

    const badge = badges[subscriptionData.status as keyof typeof badges] || badges.inactive
    const Icon = badge.icon

    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${badge.color}`}>
        <Icon className="h-4 w-4 mr-1.5" />
        {badge.text}
      </span>
    )
  }

  function isSubscriptionActive() {
    return subscriptionData.status === 'active' || subscriptionData.status === 'trialing'
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <AdminNav activeTab="" />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-12">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
            <p className="mt-4 text-gray-600">Loading account...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminNav activeTab="" />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Account Settings</h1>
          <p className="mt-1 text-sm text-gray-600">Manage your account and subscription</p>
        </div>

        {message && (
          <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
            {message}
          </div>
        )}

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        <div className="space-y-6">
          {/* Subscription Status Card */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center">
                <CreditCard className="h-6 w-6 text-blue-600 mr-3" />
                <h2 className="text-xl font-bold text-gray-900">Subscription</h2>
              </div>
              {getSubscriptionBadge()}
            </div>

            {!isSubscriptionActive() && (
              <div className="mb-6 bg-yellow-50 border-l-4 border-yellow-400 p-4">
                <div className="flex">
                  <AlertCircle className="h-5 w-5 text-yellow-400 mr-3 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="text-sm font-medium text-yellow-800">
                      Subscription Required
                    </h3>
                    <p className="mt-1 text-sm text-yellow-700">
                      Your locations are currently hidden from the mobile app. Subscribe to make your content visible to the community.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {subscriptionData.status === 'trialing' && subscriptionData.trialEndDate && (
              <div className="mb-6 bg-blue-50 border-l-4 border-blue-400 p-4">
                <div className="flex">
                  <Clock className="h-5 w-5 text-blue-400 mr-3 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="text-sm font-medium text-blue-800">
                      Free Trial Active
                    </h3>
                    <p className="mt-1 text-sm text-blue-700">
                      Your trial ends on {subscriptionData.trialEndDate.toLocaleDateString()}. 
                      No payment will be charged until then.
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Plan</label>
                <p className="text-lg font-semibold text-gray-900 capitalize">
                  {subscriptionData.tier}
                </p>
              </div>

              {subscriptionData.endDate && (
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">
                    {subscriptionData.status === 'trialing' ? 'Trial Ends' : 'Next Billing Date'}
                  </label>
                  <p className="text-lg font-semibold text-gray-900">
                    {subscriptionData.status === 'trialing' && subscriptionData.trialEndDate
                      ? subscriptionData.trialEndDate.toLocaleDateString()
                      : subscriptionData.endDate.toLocaleDateString()
                    }
                  </p>
                </div>
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              {isSubscriptionActive() ? (
                <button
                  onClick={handleManageSubscription}
                  disabled={managingSubscription}
                  className="inline-flex justify-center items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  <CreditCard className="h-4 w-4 mr-2" />
                  {managingSubscription ? 'Loading...' : 'Manage Subscription'}
                </button>
              ) : (
                <Link
                  href="/dashboard/subscription"
                  className="inline-flex justify-center items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  <CreditCard className="h-4 w-4 mr-2" />
                  Subscribe Now
                </Link>
              )}

              {isSubscriptionActive() && (
                <span className="inline-flex items-center px-4 py-2 text-sm text-gray-600">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                  Data visible in mobile app
                </span>
              )}
            </div>
          </div>

          {/* Profile Information Card */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center mb-6">
              <User className="h-6 w-6 text-blue-600 mr-3" />
              <h2 className="text-xl font-bold text-gray-900">Profile Information</h2>
            </div>

            <form onSubmit={handleSave} className="space-y-6">
              <div>
                <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                  <Mail className="h-4 w-4 mr-2 text-gray-500" />
                  Email Address
                </label>
                <input
                  type="email"
                  value={accountData.email}
                  disabled
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500 cursor-not-allowed"
                />
                <p className="mt-1 text-xs text-gray-500">Email cannot be changed</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    First Name
                  </label>
                  <input
                    type="text"
                    value={accountData.firstName}
                    onChange={(e) => setAccountData({ ...accountData, firstName: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder="John"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Last Name
                  </label>
                  <input
                    type="text"
                    value={accountData.lastName}
                    onChange={(e) => setAccountData({ ...accountData, lastName: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Doe"
                  />
                </div>
              </div>

              <div>
                <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                  <Calendar className="h-4 w-4 mr-2 text-gray-500" />
                  Member Since
                </label>
                <input
                  type="text"
                  value={accountData.createdAt}
                  disabled
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500 cursor-not-allowed"
                />
              </div>

              <div className="flex justify-between pt-4">
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex justify-center items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>

          {/* Password Reset Card */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Password</h2>
            <p className="text-sm text-gray-600 mb-4">
              Click the button below to receive a password reset link via email.
            </p>
            <button
              onClick={handlePasswordReset}
              className="inline-flex justify-center items-center px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
            >
              Send Password Reset Email
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
