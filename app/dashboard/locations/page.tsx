'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { MapPin, Edit2, Plus, Search, User, LogOut, Settings, UserCircle, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import AdminNav from '@/app/components/AdminNav'

export default function LocationsPage() {
  const router = useRouter()
  const [locations, setLocations] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [featuredFilter, setFeaturedFilter] = useState('all')
  const [tenantName, setTenantName] = useState('')
  const [userRole, setUserRole] = useState('')
  const [showProfileMenu, setShowProfileMenu] = useState(false)
  const [subscriptionStatus, setSubscriptionStatus] = useState('inactive')

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
          role,
          tenants (
            name,
            subscription_status
          )
        `)
        .eq('id', user.id)
        .single()

      console.log('Profile data:', profile)

      if (profile) {
        setUserRole(profile.role || '')
        
        // Check if tenants data exists and extract name and subscription status
        if (profile.tenants && typeof profile.tenants === 'object') {
          const name = (profile.tenants as any).name
          const status = (profile.tenants as any).subscription_status
          console.log('Tenant name from join:', name)
          console.log('Subscription status:', status)
          setTenantName(name || '')
          setSubscriptionStatus(status || 'inactive')
        } else {
          // Fallback: fetch tenant directly by ID
          console.log('Fetching tenant by ID:', profile.tenant_id)
          if (profile.tenant_id) {
            const { data: tenant } = await supabase
              .from('tenants')
              .select('name, subscription_status')
              .eq('id', profile.tenant_id)
              .single()
            
            if (tenant) {
              console.log('Tenant name from direct fetch:', tenant.name)
              console.log('Subscription status from direct fetch:', tenant.subscription_status)
              setTenantName(tenant.name || '')
              setSubscriptionStatus(tenant.subscription_status || 'inactive')
            }
          }
        }
      }

      const { data, error } = await supabase
        .from('locations')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error loading locations:', error)
      } else {
        setLocations(data || [])
      }
      
      setLoading(false)
    }

    loadData()
  }, [router])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/auth/signin')
  }

  const handleDelete = async (e: React.MouseEvent, locationId: string, locationName: string) => {
    e.stopPropagation()
    
    if (!confirm(`Are you sure you want to delete "${locationName}"? This action cannot be undone.`)) {
      return
    }

    try {
      const { error } = await supabase
        .from('locations')
        .delete()
        .eq('id', locationId)

      if (error) {
        alert('Error deleting location: ' + error.message)
        return
      }

      // Refresh the locations list
      setLocations(locations.filter(loc => loc.id !== locationId))
    } catch (err) {
      alert('Failed to delete location')
      console.error(err)
    }
  }

  const handleTileClick = (locationId: string, e: React.MouseEvent) => {
    // Don't navigate if clicking the edit button or delete button
    if ((e.target as HTMLElement).closest('button')) {
      return
    }
    router.push(`/dashboard/locations/${locationId}`)
  }

  const handleEditClick = (e: React.MouseEvent, locationId: string) => {
    e.stopPropagation()
    router.push(`/dashboard/locations/${locationId}`)
  }

  const filteredLocations = locations?.filter(location => {
    const matchesSearch = !searchTerm || 
      location.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      location.address?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      location.description?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'active' && location.active) ||
      (statusFilter === 'inactive' && !location.active)
    
    const matchesFeatured = featuredFilter === 'all' ||
      (featuredFilter === 'featured' && location.featured) ||
      (featuredFilter === 'not-featured' && !location.featured)
    
    return matchesSearch && matchesStatus && matchesFeatured
  })

  const clearFilters = () => {
    setSearchTerm('')
    setStatusFilter('all')
    setFeaturedFilter('all')
  }

  const hasActiveFilters = searchTerm || statusFilter !== 'all' || featuredFilter !== 'all'

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-8">
              <h1 className="text-xl font-bold text-gray-900">StoryNearby Admin</h1>
              <nav className="flex space-x-4">
                <Link href="/dashboard/locations" className="px-3 py-2 text-sm font-medium text-blue-600 border-b-2 border-blue-600">
                  Locations
                </Link>
                {userRole === 'super_admin' && (
                  <Link href="/dashboard/invites" className="px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900">
                    Invites
                  </Link>
                )}
              </nav>
            </div>
            
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
                  ></div>
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-1 z-20">
                    <Link
                      href="/dashboard/account"
                      className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={() => setShowProfileMenu(false)}
                    >
                      <User className="h-4 w-4 mr-3" />
                      Account
                    </Link>
                    <Link
                      href="/dashboard/settings"
                      className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={() => setShowProfileMenu(false)}
                    >
                      <Settings className="h-4 w-4 mr-3" />
                      Settings
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
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {tenantName && (
          <div className="mb-4">
            <h2 className="text-xl text-gray-700">Welcome {tenantName}</h2>
          </div>
        )}
        
        {/* Subscription Warning Banner - Only shows when inactive */}
        {(subscriptionStatus === 'inactive' || subscriptionStatus === 'past_due') && (
          <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-6 rounded-lg shadow-md">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="h-8 w-8 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-4 flex-1">
                <h3 className="text-lg font-bold text-red-800 mb-2">
                  ⚠️ Subscription Required
                </h3>
                <p className="text-red-700 mb-3">
                  Your locations are currently <strong>hidden from the mobile app</strong>. Community members cannot discover your historical sites until you activate a subscription.
                </p>
                <div className="flex flex-col sm:flex-row gap-3">
                  <Link
                    href="/dashboard/subscription"
                    className="inline-flex items-center justify-center px-6 py-3 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 shadow-sm transition-colors"
                  >
                    Subscribe Now - Start 14-Day Free Trial
                  </Link>
                  <Link
                    href="/dashboard/account"
                    className="inline-flex items-center justify-center px-6 py-3 bg-white text-red-700 font-semibold rounded-lg border-2 border-red-300 hover:bg-red-50 transition-colors"
                  >
                    View Account Details
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}
        
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Locations</h1>
          </div>
          <Link 
            href="/dashboard/locations/new"
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus className="h-5 w-5 mr-2" />
            Add Location
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search by name, address, or description..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Featured</label>
              <select
                value={featuredFilter}
                onChange={(e) => setFeaturedFilter(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Locations</option>
                <option value="featured">Featured</option>
                <option value="not-featured">Not Featured</option>
              </select>
            </div>
          </div>

          {hasActiveFilters && (
            <div className="mt-4 flex items-center justify-between">
              <p className="text-sm text-gray-600">
                Showing {filteredLocations.length} of {locations.length} locations
              </p>
              <button
                onClick={clearFilters}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                Clear filters
              </button>
            </div>
          )}
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
            <p className="mt-4 text-gray-600">Loading locations...</p>
          </div>
        ) : filteredLocations.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <MapPin className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            {hasActiveFilters ? (
              <>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No matching locations</h3>
                <p className="text-gray-600 mb-4">Try adjusting your filters</p>
                <button
                  onClick={clearFilters}
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Clear filters
                </button>
              </>
            ) : (
              <>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No locations yet</h3>
                <p className="text-gray-600 mb-4">Get started by adding your first location</p>
                <Link
                  href="/dashboard/locations/new"
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  <Plus className="h-5 w-5 mr-2" />
                  Add Location
                </Link>
              </>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredLocations.map((location) => (
              <div 
                key={location.id} 
                onClick={(e) => handleTileClick(location.id, e)}
                className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
              >
                {location.images && location.images.length > 0 ? (
                  <div className="relative h-48 bg-gray-200 overflow-hidden">
                    <img 
                      src={location.images[0]} 
                      alt={location.name}
                      className="w-full h-full object-cover"
                    />
                    {location.images.length > 1 && (
                      <div className="absolute top-2 right-2 bg-black bg-opacity-60 text-white text-xs px-2 py-1 rounded">
                        +{location.images.length - 1} more
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="h-48 bg-gray-100 flex items-center justify-center">
                    <MapPin className="h-12 w-12 text-gray-400" />
                  </div>
                )}
                
                <div className="p-6">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="text-lg font-semibold text-gray-900 flex-1">{location.name}</h3>
                    <div className="flex flex-wrap gap-1 ml-2">
                      {location.is_museum && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                          Museum
                        </span>
                      )}
                      {location.featured && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                          Featured
                        </span>
                      )}
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                        location.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {location.active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>

                  {location.address && (
                    <p className="text-sm text-gray-600 mb-3">{location.address}</p>
                  )}

                  {location.description && (
                    <p className="text-sm text-gray-700 mb-4 line-clamp-2">{location.description}</p>
                  )}

                  <div className="flex space-x-2">
                    <button
                      onClick={(e) => handleEditClick(e, location.id)}
                      className="flex-1 inline-flex justify-center items-center px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                    >
                      <Edit2 className="h-4 w-4 mr-1" />
                      Edit
                    </button>
                    <button
                      onClick={(e) => handleDelete(e, location.id, location.name)}
                      className="inline-flex justify-center items-center px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
