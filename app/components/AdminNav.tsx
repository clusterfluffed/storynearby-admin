'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { MapPin, Mail } from 'lucide-react'
import Link from 'next/link'

type Props = {
  activeTab: 'locations' | 'invites'
}

export default function AdminNav({ activeTab }: Props) {
  const [userRole, setUserRole] = useState<string | null>(null)

  useEffect(() => {
    async function getUserRole() {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single()
        
        if (profile) {
          setUserRole(profile.role)
        }
      }
    }
    getUserRole()
  }, [])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  return (
    <nav className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center space-x-8">
            <Link href="/" className="flex items-center">
              <MapPin className="h-8 w-8 text-blue-600" />
              <span className="ml-2 text-xl font-bold text-gray-900">StoryNearby Admin</span>
            </Link>
            <div className="flex space-x-4">
              <Link 
                href="/dashboard/locations" 
                className={`inline-flex items-center px-3 py-2 text-sm font-medium ${
                  activeTab === 'locations'
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-700 hover:text-gray-900 hover:border-b-2 hover:border-gray-300'
                }`}
              >
                <MapPin className="h-4 w-4 mr-2" />
                Locations
              </Link>
              
              {userRole === 'super_admin' && (
                <Link 
                  href="/dashboard/invites" 
                  className={`inline-flex items-center px-3 py-2 text-sm font-medium ${
                    activeTab === 'invites'
                      ? 'text-blue-600 border-b-2 border-blue-600'
                      : 'text-gray-700 hover:text-gray-900 hover:border-b-2 hover:border-gray-300'
                  }`}
                >
                  <Mail className="h-4 w-4 mr-2" />
                  Invites
                </Link>
              )}
            </div>
          </div>
          <div className="flex items-center">
            <button
              onClick={handleSignOut}
              className="px-4 py-2 text-sm text-gray-700 hover:text-gray-900"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </nav>
  )
}
