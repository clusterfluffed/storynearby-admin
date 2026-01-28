'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Settings as SettingsIcon, Bell, Mail, MapPin, Shield } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import AdminNav from '@/app/components/AdminNav'

export default function SettingsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)

  const [settings, setSettings] = useState({
    emailNotifications: true,
    locationUpdates: true,
    marketingEmails: false,
    twoFactorAuth: false,
  })

  useEffect(() => {
    async function checkAuth() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/auth/signin')
        return
      }
      setLoading(false)
    }

    checkAuth()
  }, [router])

  const handleToggle = (setting: string) => {
    setSettings({
      ...settings,
      [setting]: !settings[setting as keyof typeof settings]
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <AdminNav activeTab="locations" />
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-12">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
            <p className="mt-4 text-gray-600">Loading settings...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminNav activeTab="locations" />
      
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <Link href="/dashboard/locations" className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900">
            ← Back to Locations
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow-md">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center">
              <SettingsIcon className="h-8 w-8 text-blue-600 mr-3" />
              <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
            </div>
          </div>

          <div className="p-6 space-y-8">
            {/* Notifications Section */}
            <div>
              <div className="flex items-center mb-4">
                <Bell className="h-5 w-5 text-gray-600 mr-2" />
                <h2 className="text-lg font-semibold text-gray-900">Notifications</h2>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between py-3 border-b border-gray-100">
                  <div>
                    <p className="text-sm font-medium text-gray-900">Email Notifications</p>
                    <p className="text-xs text-gray-500">Receive email updates about your account</p>
                  </div>
                  <button
                    onClick={() => handleToggle('emailNotifications')}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      settings.emailNotifications ? 'bg-blue-600' : 'bg-gray-200'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        settings.emailNotifications ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                <div className="flex items-center justify-between py-3 border-b border-gray-100">
                  <div>
                    <p className="text-sm font-medium text-gray-900">Location Updates</p>
                    <p className="text-xs text-gray-500">Get notified when locations are added or updated</p>
                  </div>
                  <button
                    onClick={() => handleToggle('locationUpdates')}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      settings.locationUpdates ? 'bg-blue-600' : 'bg-gray-200'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        settings.locationUpdates ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                <div className="flex items-center justify-between py-3">
                  <div>
                    <p className="text-sm font-medium text-gray-900">Marketing Emails</p>
                    <p className="text-xs text-gray-500">Receive updates about new features and tips</p>
                  </div>
                  <button
                    onClick={() => handleToggle('marketingEmails')}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      settings.marketingEmails ? 'bg-blue-600' : 'bg-gray-200'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        settings.marketingEmails ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>

            {/* Security Section */}
            <div>
              <div className="flex items-center mb-4">
                <Shield className="h-5 w-5 text-gray-600 mr-2" />
                <h2 className="text-lg font-semibold text-gray-900">Security</h2>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between py-3 border-b border-gray-100">
                  <div>
                    <p className="text-sm font-medium text-gray-900">Two-Factor Authentication</p>
                    <p className="text-xs text-gray-500">Add an extra layer of security to your account</p>
                  </div>
                  <button
                    onClick={() => handleToggle('twoFactorAuth')}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      settings.twoFactorAuth ? 'bg-blue-600' : 'bg-gray-200'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        settings.twoFactorAuth ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                <div className="py-3">
                  <p className="text-sm font-medium text-gray-900 mb-2">Active Sessions</p>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-900">Current Session</p>
                        <p className="text-xs text-gray-500">Last active: Just now</p>
                      </div>
                      <span className="text-xs font-medium text-green-600">Active</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Preferences Section */}
            <div>
              <div className="flex items-center mb-4">
                <MapPin className="h-5 w-5 text-gray-600 mr-2" />
                <h2 className="text-lg font-semibold text-gray-900">Location Preferences</h2>
              </div>
              
              <div className="space-y-4">
                <div className="py-3">
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Default Location Status
                  </label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500">
                    <option>Active</option>
                    <option>Inactive</option>
                  </select>
                  <p className="mt-1 text-xs text-gray-500">New locations will be set to this status by default</p>
                </div>

                <div className="py-3">
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Map Provider
                  </label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500">
                    <option>OpenStreetMap</option>
                    <option disabled>Google Maps (Coming Soon)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Save Button */}
            <div className="pt-4 border-t border-gray-200">
              <button className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                Save Settings
              </button>
              <p className="mt-2 text-xs text-gray-500">
                Note: These settings are for demonstration. Connect to a backend to persist changes.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
