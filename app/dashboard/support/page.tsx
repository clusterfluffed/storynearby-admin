'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Mail, Send, ArrowLeft, CheckCircle } from 'lucide-react'
import Link from 'next/link'
import AdminNav from '@/app/components/AdminNav'

export default function SupportPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')
  const [userInfo, setUserInfo] = useState({
    email: '',
    name: '',
    tenantId: null as string | null,
  })

  const [formData, setFormData] = useState({
    subject: '',
    description: '',
    priority: 'medium',
  })

  useEffect(() => {
    async function loadUser() {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        router.push('/auth/signin')
        return
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, tenant_id')
        .eq('id', user.id)
        .single()

      setUserInfo({
        email: user.email || '',
        name: profile?.full_name || '',
        tenantId: profile?.tenant_id || null,
      })
    }

    loadUser()
  }, [router])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        throw new Error('You must be logged in')
      }

      const { error: insertError } = await supabase
        .from('support_tickets')
        .insert({
          user_id: user.id,
          tenant_id: userInfo.tenantId,
          user_email: userInfo.email,
          user_name: userInfo.name,
          subject: formData.subject,
          description: formData.description,
          priority: formData.priority,
          status: 'open',
        })

      if (insertError) throw insertError

      setSubmitted(true)
      
      // Reset form
      setFormData({
        subject: '',
        description: '',
        priority: 'medium',
      })
    } catch (err: any) {
      setError(err.message || 'Failed to submit support ticket')
    } finally {
      setLoading(false)
    }
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50">
        <AdminNav activeTab="locations" />
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <div className="mb-6">
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              Support Ticket Submitted!
            </h1>
            <p className="text-gray-600 mb-6">
              Thank you for contacting us. We've received your support request and will respond via email within 24-48 hours.
            </p>
            <div className="space-y-3">
              <button
                onClick={() => setSubmitted(false)}
                className="w-full inline-flex justify-center items-center px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700"
              >
                Submit Another Request
              </button>
              <Link
                href="/dashboard/locations"
                className="w-full inline-flex justify-center items-center px-6 py-3 bg-gray-200 text-gray-700 font-semibold rounded-lg hover:bg-gray-300"
              >
                Back to Dashboard
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminNav activeTab="locations" />
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link
          href="/dashboard/locations"
          className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Dashboard
        </Link>

        <div className="bg-white rounded-lg shadow-md p-8">
          <div className="flex items-center mb-6">
            <Mail className="h-8 w-8 text-blue-600 mr-3" />
            <h1 className="text-3xl font-bold text-gray-900">Contact Support</h1>
          </div>

          <p className="text-gray-600 mb-6">
            Need help? Fill out the form below and our support team will get back to you as quickly as posible.
          </p>

          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* User Info Display */}
            <div className="bg-gray-50 rounded-lg p-4 space-y-2">
              <div>
                <span className="text-sm font-medium text-gray-700">Email: </span>
                <span className="text-sm text-gray-900">{userInfo.email}</span>
              </div>
              {userInfo.name && (
                <div>
                  <span className="text-sm font-medium text-gray-700">Name: </span>
                  <span className="text-sm text-gray-900">{userInfo.name}</span>
                </div>
              )}
            </div>

            {/* Subject */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Subject *
              </label>
              <input
                type="text"
                required
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                placeholder="Brief description of your issue"
                maxLength={500}
              />
            </div>

            {/* Priority */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Priority
              </label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="low">Low - General question</option>
                <option value="medium">Medium - Need assistance</option>
                <option value="high">High - Issue affecting work</option>
                <option value="urgent">Urgent - Critical issue</option>
              </select>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description *
              </label>
              <textarea
                required
                rows={6}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                placeholder="Please provide as much detail as possible about your issue..."
              />
              <p className="mt-1 text-xs text-gray-500">
                Include any error messages, steps to reproduce the issue, and what you expected to happen.
              </p>
            </div>

            {/* Submit Button */}
            <div className="flex space-x-3">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 inline-flex justify-center items-center px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                <Send className="h-5 w-5 mr-2" />
                {loading ? 'Submitting...' : 'Submit Ticket'}
              </button>
              <Link
                href="/dashboard/locations"
                className="inline-flex justify-center items-center px-6 py-3 bg-gray-200 text-gray-700 font-semibold rounded-lg hover:bg-gray-300"
              >
                Cancel
              </Link>
            </div>
          </form>

          {/* FAQ Section */}
          <div className="mt-8 pt-8 border-t">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Before You Submit...
            </h2>
            <div className="space-y-3 text-sm text-gray-600">
              <div>
                <strong className="text-gray-900">Payment Issues?</strong> Check your Account page to manage your subscription.
              </div>
              <div>
                <strong className="text-gray-900">Can't Add Locations?</strong> Make sure you have an active subscription.
              </div>
              <div>
                <strong className="text-gray-900">Response Time:</strong> We typically respond within 24-48 hours during business days.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
