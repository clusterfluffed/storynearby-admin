'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { MapPin, Save, Trash2, Edit2, Eye } from 'lucide-react'
import Link from 'next/link'
import AdminNav from '@/app/components/AdminNav'

export default function LocationDetailPage() {
  const router = useRouter()
  const params = useParams()
  const locationId = params.id as string

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [editMode, setEditMode] = useState(false)

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    address: '',
    lat: '',
    lng: '',
    featured: false,
    active: true,
  })

  useEffect(() => {
    loadLocation()
  }, [locationId])

  const loadLocation = async () => {
    const { data, error } = await supabase
      .from('locations')
      .select('*')
      .eq('id', locationId)
      .single()

    if (error) {
      setError('Location not found')
      setLoading(false)
      return
    }

    setFormData({
      name: data.name,
      description: data.description || '',
      address: data.address || '',
      lat: data.lat.toString(),
      lng: data.lng.toString(),
      featured: data.featured,
      active: data.active,
    })
    setLoading(false)
  }

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError('')

    const { error: updateError } = await supabase
      .from('locations')
      .update({
        name: formData.name,
        description: formData.description,
        address: formData.address,
        lat: parseFloat(formData.lat),
        lng: parseFloat(formData.lng),
        featured: formData.featured,
        active: formData.active,
      })
      .eq('id', locationId)

    if (updateError) {
      setError(updateError.message)
      setSaving(false)
      return
    }

    setEditMode(false)
    setSaving(false)
    loadLocation()
  }

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this location? This action cannot be undone.')) {
      return
    }

    const { error: deleteError } = await supabase
      .from('locations')
      .delete()
      .eq('id', locationId)

    if (deleteError) {
      setError(deleteError.message)
      return
    }

    router.push('/dashboard/locations')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <AdminNav activeTab="locations" />
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-12">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
            <p className="mt-4 text-gray-600">Loading location...</p>
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
          <Link
            href="/dashboard/locations"
            className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900"
          >
            ← Back to Locations
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <MapPin className="h-8 w-8 text-blue-600 mr-3" />
              <h1 className="text-2xl font-bold text-gray-900">
                {editMode ? 'Edit Location' : 'Location Details'}
              </h1>
            </div>
            <div className="flex space-x-2">
              {!editMode && (
                <button
                  onClick={() => setEditMode(true)}
                  className="inline-flex items-center px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  <Edit2 className="h-4 w-4 mr-2" />
                  Edit
                </button>
              )}
              <button
                onClick={handleDelete}
                className="inline-flex items-center px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </button>
            </div>
          </div>

          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          {editMode ? (
            <form onSubmit={handleUpdate} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  rows={4}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Address
                </label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Latitude *
                  </label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={formData.lat}
                    onChange={(e) => setFormData({ ...formData, lat: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Longitude *
                  </label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={formData.lng}
                    onChange={(e) => setFormData({ ...formData, lng: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-6">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.featured}
                    onChange={(e) => setFormData({ ...formData, featured: e.target.checked })}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700">Featured Location</span>
                </label>

                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.active}
                    onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700">Active</span>
                </label>
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 inline-flex justify-center items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  <Save className="h-5 w-5 mr-2" />
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEditMode(false)
                    loadLocation()
                  }}
                  className="inline-flex justify-center items-center px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">Name</h3>
                <p className="text-lg text-gray-900">{formData.name}</p>
              </div>

              {formData.description && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Description</h3>
                  <p className="text-gray-900 whitespace-pre-wrap">{formData.description}</p>
                </div>
              )}

              {formData.address && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Address</h3>
                  <p className="text-gray-900">{formData.address}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Latitude</h3>
                  <p className="text-gray-900">{formData.lat}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Longitude</h3>
                  <p className="text-gray-900">{formData.lng}</p>
                </div>
              </div>

              <div className="flex space-x-6">
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Status</h3>
                  <div className="flex space-x-2">
                    {formData.featured && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                        Featured
                      </span>
                    )}
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      formData.active 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {formData.active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
