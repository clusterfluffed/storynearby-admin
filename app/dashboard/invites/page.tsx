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
  tenants?: { name: string }
}

type Tenant = {
  id: string
  name: string
  slug: string
  active: boolean
}

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

  const { data: invites, isLoading } = useQuery({
    queryKey: ['invites'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('invites')
        .select('*, tenants (name)')
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
        .select('id, name, slug, active')
        .order('name')
      
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
      const { error } = await supabase
        .from('tenants')
        .insert({
          name: tenantName,
          slug: tenantSlug,
          active: true
        })
      
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenants'] })
      setTenantName('')
      setTenantSlug('')
      setShowCreateTenantForm(false)
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
            <form onSubmit={handleCreateTenant} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  County Name
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
                  Slug (auto-generated)
                </label>
                <input
                  type="text"
                  required
                  value={tenantSlug}
                  onChange={(e) => setTenantSlug(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 focus:ring-green-500 focus:border-green-500"
                  placeholder="franklin-county-historical-society"
                />
                <p className="mt-1 text-xs text-gray-500">Used for URL identification</p>
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
                  onClick={() => setShowCreateTenantForm(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Counties List */}
        {tenants && tenants.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Counties</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {tenants.map((tenant) => (
                <div key={tenant.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-gray-900">{tenant.name}</h3>
                      <p className="text-sm text-gray-500">{tenant.slug}</p>
                    </div>
                    <span className={`px-2 py-1 text-xs rounded-full ${
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
                  {tenants?.filter(t => t.active).map((tenant) => (
                    <option key={tenant.id} value={tenant.id}>
                      {tenant.name}
                    </option>
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
