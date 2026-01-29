'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import Image from 'next/image'
import { MapPin, Mail, Users, MessageSquare, ChevronDown, Shield, UserCircle, User, LogOut } from 'lucide-react'

interface AdminNavProps {
  activeTab: 'locations' | 'support' | 'invites' | 'tickets'
}

export default function AdminNav({ activeTab }: AdminNavProps) {
  const router = useRouter()
  const [userRole, setUserRole] = useState('')
  const [showAdminDropdown, setShowAdminDropdown] = useState(false)
  const [showProfileMenu, setShowProfileMenu] = useState(false)

  useEffect(() => {
    async function loadUserRole() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      setUserRole(profile?.role || '')
    }

    loadUserRole()
  }, [])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/auth/signin')
  }

  const isSuperAdmin = userRole === 'super_admin'

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center space-x-8">
            {/* Logo/Brand */}
            <Link href="/dashboard/locations" className="flex-shrink-0 flex items-center">
              <Image 
                src="/logo.png" 
                alt="StoryNearby" 
                width={150} 
                height={38}
                priority
                className="h-7 w-auto"
              />
            </Link>

            {/* Main Navigation */}
            <div className="flex space-x-4">
              {/* Locations */}
              <Link
                href="/dashboard/locations"
                className={`inline-flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                  activeTab === 'locations'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <MapPin className="h-4 w-4 mr-2" />
                Locations
              </Link>

              {/* Support */}
              <Link
                href="/dashboard/support"
                className={`inline-flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                  activeTab === 'support'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <MessageSquare className="h-4 w-4 mr-2" />
                Support
              </Link>

              {/* Admin Section - Only for super_admin */}
              {isSuperAdmin && (
                <div className="relative">
                  <button
                    onClick={() => setShowAdminDropdown(!showAdminDropdown)}
                    className={`inline-flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                      activeTab === 'invites' || activeTab === 'tickets'
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <Shield className="h-4 w-4 mr-2" />
                    Admin
                    <ChevronDown className="h-4 w-4 ml-1" />
                  </button>

                  {/* Admin Dropdown */}
                  {showAdminDropdown && (
                    <>
                      {/* Backdrop */}
                      <div
                        className="fixed inset-0 z-10"
                        onClick={() => setShowAdminDropdown(false)}
                      />
                      
                      {/* Dropdown Menu */}
                      <div className="absolute left-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20">
                        <Link
                          href="/dashboard/admin/invites"
                          onClick={() => setShowAdminDropdown(false)}
                          className={`flex items-center px-4 py-2 text-sm transition-colors ${
                            activeTab === 'invites'
                              ? 'bg-blue-50 text-blue-700'
                              : 'text-gray-700 hover:bg-gray-100'
                          }`}
                        >
                          <Users className="h-4 w-4 mr-3" />
                          User Invites
                        </Link>

                        <Link
                          href="/dashboard/admin/support-tickets"
                          onClick={() => setShowAdminDropdown(false)}
                          className={`flex items-center px-4 py-2 text-sm transition-colors ${
                            activeTab === 'tickets'
                              ? 'bg-blue-50 text-blue-700'
                              : 'text-gray-700 hover:bg-gray-100'
                          }`}
                        >
                          <Mail className="h-4 w-4 mr-3" />
                          Support Tickets
                        </Link>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* User Profile Menu */}
          <div className="flex items-center">
            <div className="relative">
              <button
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-gray-200 hover:bg-gray-300 transition-colors"
              >
                <UserCircle className="h-6 w-6 text-gray-700" />
              </button>
              
              {showProfileMenu && (
                <>
                  <div 
                    className="fixed inset-0 z-10" 
                    onClick={() => setShowProfileMenu(false)}
                  />
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20">
                    <Link
                      href="/dashboard/account"
                      className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={() => setShowProfileMenu(false)}
                    >
                      <User className="h-4 w-4 mr-3" />
                      Account
                    </Link>
                    <button
                      onClick={handleSignOut}
                      className="w-full flex items-center px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                    >
                      <LogOut className="h-4 w-4 mr-3" />
                      Sign Out
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  )
}
