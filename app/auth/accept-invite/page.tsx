'use client'

import { useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

type InviteData = {
  email: string
  tenant_id: string
  role: string
  used: boolean
  expires_at: string
  tenants: { name: string }
}

export default function AcceptInvitePage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const token = searchParams.get('token')
  
  const [inviteData, setInviteData] = useState<InviteData | null>(null)
  const [fullName, setFullName] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    async function loadInvite() {
      if (!token) {
        setError('Invalid invite link')
        setLoading(false)
        return
      }

      const { data, error } = await supabase
        .from('invites')
        .select('email, tenant_id, role, used, expires_at, tenants (name)')
        .eq('token', token)
        .single()

      if (error || !data) {
        setError('Invite not found')
        setLoading(false)
        return
      }

      if (data.used) {
        setError('This invite has already been used')
        setLoading(false)
        return
      }

      if (new Date(data.expires_at) < new Date()) {
        setError('This invite has expired')
        setLoading(false)
        return
      }

      setInviteData(data as InviteData)
      setLoading(false)
    }

    loadInvite()
  }, [token])

  const handleAcceptInvite = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError(null)

    if (!inviteData || !token) return

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: inviteData.email,
      password,
    })

    if (authError) {
      setError(authError.message)
      setSubmitting(false)
      return
    }

    if (authData.user) {
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          full_name: fullName,
          tenant_id: inviteData.tenant_id,
          role: inviteData.role
        })
        .eq('id', authData.user.id)

      if (profileError) {
        setError('Account created but profile update failed')
        setSubmitting(false)
        return
      }

      await supabase
        .from('invites')
        .update({ used: true })
        .eq('token', token)

      router.push('/dashboard/locations')
    }

    setSubmitting(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
          <p className="mt-4 text-gray-600">Loading invite...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white p-8 rounded-lg shadow-lg text-center">
          <div className="text-5xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Invalid Invite</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <a href="/" className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            Go to Home
          </a>
        </div>
      </div>
    )
  }

  if (!inviteData) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center px-4">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-lg shadow-lg">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900">Accept Invite</h2>
          <p className="mt-2 text-sm text-gray-600">
            You have been invited to join <strong>{inviteData.tenants.name}</strong>
          </p>
        </div>

        <form onSubmit={handleAcceptInvite} className="mt-8 space-y-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Email</label>
              <input
                type="email"
                disabled
                value={inviteData.email}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Full Name *</label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                placeholder="John Doe"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Password *</label>
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                placeholder="Min. 6 characters"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium"
          >
            {submitting ? 'Creating account...' : 'Accept Invite & Create Account'}
          </button>
        </form>
      </div>
    </div>
  )
}
