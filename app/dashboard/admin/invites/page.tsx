'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { Mail, Copy, Check, Trash2, Plus, Building2 } from 'lucide-react'
import AdminNav from '@/app/components/AdminNav'

type Invite = {
  id: string
  email: string
  tenant_id: string
  role: string
  token: string
  expires_at: string
  used: boolean
  tenants?: { name: string; state: string }
}

type Tenant = {
  id: string
  name: string
  slug: string
  state: string
  active: boolean
}

// US States list
const US_STATES = [
  { code: 'AL', name: 'Alabama' },
  { code: 'AK', name: 'Alaska' },
  { code: 'AZ', name: 'Arizona' },
  { code: 'AR', name: 'Arkansas' },
  { code: 'CA', name: 'California' },
  { code: 'CO', name: 'Colorado' },
  { code: 'CT', name: 'Connecticut' },
  { code: 'DE', name: 'Delaware' },
  { code: 'FL', name: 'Florida' },
  { code: 'GA', name: 'Georgia' },
  { code: 'HI', name: 'Hawaii' },
  { code: 'ID', name: 'Idaho' },
  { code: 'IL', name: 'Illinois' },
  { code: 'IN', name: 'Indiana' },
  { code: 'IA', name: 'Iowa' },
  { code: 'KS', name: 'Kansas' },
  { code: 'KY', name: 'Kentucky' },
  { code: 'LA', name: 'Louisiana' },
  { code: 'ME', name: 'Maine' },
  { code: 'MD', name: 'Maryland' },
  { code: 'MA', name: 'Massachusetts' },
  { code: 'MI', name: 'Michigan' },
  { code: 'MN', name: 'Minnesota' },
  { code: 'MS', name: 'Mississippi' },
  { code: 'MO', name: 'Missouri' },
  { code: 'MT', name: 'Montana' },
  { code: 'NE', name: 'Nebraska' },
  { code: 'NV', name: 'Nevada' },
  { code: 'NH', name: 'New Hampshire' },
  { code: 'NJ', name: 'New Jersey' },
  { code: 'NM', name: 'New Mexico' },
  { code: 'NY', name: 'New York' },
  { code: 'NC', name: 'North Carolina' },
  { code: 'ND', name: 'North Dakota' },
  { code: 'OH', name: 'Ohio' },
  { code: 'OK', name: 'Oklahoma' },
  { code: 'OR', name: 'Oregon' },
  { code: 'PA', name: 'Pennsylvania' },
  { code: 'RI', name: 'Rhode Island' },
  { code: 'SC', name: 'South Carolina' },
  { code: 'SD', name: 'South Dakota' },
  { code: 'TN', name: 'Tennessee' },
  { code: 'TX', name: 'Texas' },
  { code: 'UT', name: 'Utah' },
  { code: 'VT', name: 'Vermont' },
  { code: 'VA', name: 'Virginia' },
  { code: 'WA', name: 'Washington' },
  { code: 'WV', name: 'West Virginia' },
  { code: 'WI', name: 'Wisconsin' },
  { code: 'WY', name: 'Wyoming' },
]

export default function InvitesPage() {
  const queryClient = useQueryClient()
  const [showCreateInviteForm, setShowCreateInviteForm] = useState(false)
  const [showCreateTenantForm, setShowCreateTenantForm] = useState(false)
  const [email, setEmail] = useState('')
  const [tenantId, setTenantId] = useState('')
  const [copiedToken, setCopiedToken] = useState<string | null>(null)
  
  // Tenant form fields
  const [tenantName, setTenantName] = useState('')
  const [tenantSlug, setTenantSlug] = useState('')
  const [tenantState, setTenantState] = useState('')
  const [createError, setCreateError] = useState('')

  const { data: invites, isLoading } = useQuery({
    queryKey: ['invites'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('invites')
        .select('*, tenants (name, state)')
        .order('created_at', { ascending: false })
      
      if (error) throw error
      
      return data.map((invite: any) => ({
        ...invite,
        tenants: Array.isArray(invite.tenants) && invite.tenants.length > 0 
          ? invite.tenants[0] 
          : invite.tenants
      })) as Invite[]
    },
  })

  const { data: tenants } = useQuery({
    queryKey: ['tenants'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tenants')
        .select('id, name, slug, state, active')
        .order('state, name')
      
      if (error) throw error
      return data as Tenant[]
    },
  })

  const createInvite = useMutation({
    mutationFn: async () => {
      const token = crypto.randomUUID()
      const expiresAt = new Date()
      expiresAt.setDate(expiresAt.getDate() + 7)

      const { data: user } = await supabase.auth.getUser()
      
      const { error } = await supabase
        .from('invites')
        .insert({
          email,
          tenant_id: tenantId,
          role: 'county_admin',
          token,
          expires_at: expiresAt.toISOString(),
          created_by: user.user?.id
        })
      
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invites'] })
      setEmail('')
      setTenantId('')
      setShowCreateInviteForm(false)
    },
  })

  const createTenant = useMutation({
    mutationFn: async () => {
      setCreateError('')
      
      // Call API route instead of direct Supabase insert
      const response = await fetch('/api/admin/create-tenant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: tenantName,
          slug: tenantSlug,
          state: tenantState,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create tenant')
      }

      return result
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenants'] })
      setTenantName('')
      setTenantSlug('')
      setTenantState('')
      setShowCreateTenantForm(false)
      setCreateError('')
    },
    onError: (error: Error) => {
      setCreateError(error.message)
    },
  })

  const deleteInvite = useMutation({
    mutationFn: async (inviteId: string) => {
      const { error } = await supabase
        .from('invites')
        .delete()
        .eq('id', inviteId)
      
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invites'] })
    },
  })

  const handleCreateInvite = (e: React.FormEvent) => {
    e.preventDefault()
    createInvite.mutate()
  }

  const handleCreateTenant = (e: React.FormEvent) => {
    e.preventDefault()
    createTenant.mutate()
  }

  const copyInviteLink = (token: string) => {
    const inviteUrl = `${window.location.origin}/auth/accept-invite?token=${token}`
    navigator.clipboard.writeText(inviteUrl)
    setCopiedToken(token)
    setTimeout(() => setCopiedToken(null), 2000)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  // Auto-generate slug from name
  const handleTenantNameChange = (name: string) => {
    setTenantName(name)
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
    setTenantSlug(slug)
  }

  // Group tenants by state
  const tenantsByState = tenants?.reduce((acc, tenant) => {
    const state = tenant.state || 'Unknown'
    if (!acc[state]) acc[state] = []
    acc[state].push(tenant)
    return acc
  }, {} as Record<string, Tenant[]>)

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminNav activeTab="invites" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">User Invites</h1>
          <div className="flex space-x-3">
            <button
              onClick={() => setShowCreateTenantForm(!showCreateTenantForm)}
              className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <Building2 className="h-5 w-5 mr-2" />
              Add County
            </button>
            <button
              onClick={() => setShowCreateInviteForm(!showCreateInviteForm)}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="h-5 w-5 mr-2" />
              Create Invite
            </button>
          </div>
        </div>

        {/* Create Tenant Form */}
        {showCreateTenantForm && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Add New County</h2>
            
            {createError && (
              <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                {createError}
              </div>
            )}

            <form onSubmit={handleCreateTenant} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    County Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={tenantName}
                    onChange={(e) => handleTenantNameChange(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                    placeholder="Franklin County Historical Society"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    State *
                  </label>
                  <select
                    required
                    value={tenantState}
                    onChange={(e) => setTenantState(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                  >
                    <option value="">Select a state...</option>
                    {US_STATES.map((state) => (
                      <option key={state.code} value={state.code}>
                        {state.name} ({state.code})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Slug (auto-generated) *
                </label>
                <input
                  type="text"
                  required
                  value={tenantSlug}
                  onChange={(e) => setTenantSlug(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 focus:ring-green-500 focus:border-green-500"
                  placeholder="franklin-county-historical-society"
                />
                <p className="mt-1 text-xs text-gray-500">Used for URL identification. Must be unique.</p>
              </div>

              <div className="flex space-x-3">
                <button
                  type="submit"
                  disabled={createTenant.isPending}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                >
                  {createTenant.isPending ? 'Creating...' : 'Create County'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateTenantForm(false)
                    setCreateError('')
                  }}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Counties List */}
        {tenantsByState && Object.keys(tenantsByState).length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Counties by State</h2>
            <div className="space-y-6">
              {Object.entries(tenantsByState).sort().map(([state, stateTenants]) => (
                <div key={state}>
                  <h3 className="text-lg font-medium text-gray-700 mb-3 border-b pb-2">
                    {state}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {stateTenants.map((tenant) => (
                      <div key={tenant.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-900">{tenant.name}</h4>
                            <p className="text-sm text-gray-500 mt-1">{tenant.slug}</p>
                            <p className="text-xs text-gray-400 mt-1">{tenant.state}</p>
                          </div>
                          <span className={`px-2 py-1 text-xs rounded-full flex-shrink-0 ${
                            tenant.active 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {tenant.active ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Create Invite Form */}
        {showCreateInviteForm && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Create New Invite</h2>
            <form onSubmit={handleCreateInvite} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  placeholder="user@example.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  County
                </label>
                <select
                  required
                  value={tenantId}
                  onChange={(e) => setTenantId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select a county...</option>
                  {Object.entries(tenantsByState || {}).sort().map(([state, stateTenants]) => (
                    <optgroup key={state} label={state}>
                      {stateTenants
                        .filter(t => t.active)
                        .map((tenant) => (
                          <option key={tenant.id} value={tenant.id}>
                            {tenant.name} ({tenant.state})
                          </option>
                        ))}
                    </optgroup>
                  ))}
                </select>
              </div>
              <div className="flex space-x-3">
                <button
                  type="submit"
                  disabled={createInvite.isPending}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {createInvite.isPending ? 'Creating...' : 'Create Invite'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateInviteForm(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Invites Table */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
          </div>
        ) : invites && invites.length > 0 ? (
          <div className="bg-white shadow-md rounded-lg overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">County</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">State</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Expires</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {invites.map((invite) => (
                  <tr key={invite.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {invite.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {invite.tenants?.name || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {invite.tenants?.state || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        invite.used 
                          ? 'bg-green-100 text-green-800'
                          : new Date(invite.expires_at) < new Date()
                          ? 'bg-red-100 text-red-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {invite.used ? 'Used' : new Date(invite.expires_at) < new Date() ? 'Expired' : 'Pending'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(invite.expires_at)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      {!invite.used && new Date(invite.expires_at) > new Date() && (
                        <button
                          onClick={() => copyInviteLink(invite.token)}
                          className="text-blue-600 hover:text-blue-900 mr-4"
                          title="Copy invite link"
                        >
                          {copiedToken === invite.token ? (
                            <Check className="h-5 w-5 inline" />
                          ) : (
                            <Copy className="h-5 w-5 inline" />
                          )}
                        </button>
                      )}
                      <button
                        onClick={() => deleteInvite.mutate(invite.id)}
                        className="text-red-600 hover:text-red-900"
                        title="Delete invite"
                      >
                        <Trash2 className="h-5 w-5 inline" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12 bg-white rounded-lg shadow-md">
            <Mail className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No invites</h3>
            <p className="mt-1 text-sm text-gray-500">Get started by creating an invite.</p>
          </div>
        )}
      </div>
    </div>
  )
}
