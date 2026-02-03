'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import imageCompression from 'browser-image-compression'
import { MapPin, Save, Trash2, Edit2, Upload, X, GripVertical, Globe, Facebook, Instagram, Youtube } from 'lucide-react'
import Link from 'next/link'
import AdminNav from '@/app/components/AdminNav'

type DayHours = {
  open: string | null
  close: string | null
  closed: boolean
}

type MuseumHours = {
  monday: DayHours
  tuesday: DayHours
  wednesday: DayHours
  thursday: DayHours
  friday: DayHours
  saturday: DayHours
  sunday: DayHours
}

const defaultHours: MuseumHours = {
  monday: { open: '09:00', close: '17:00', closed: false },
  tuesday: { open: '09:00', close: '17:00', closed: false },
  wednesday: { open: '09:00', close: '17:00', closed: false },
  thursday: { open: '09:00', close: '17:00', closed: false },
  friday: { open: '09:00', close: '17:00', closed: false },
  saturday: { open: '10:00', close: '16:00', closed: false },
  sunday: { open: null, close: null, closed: true }
}

const LOCATION_CATEGORIES = [
  'Archaeological Site',
  'Battlefield',
  'Cemetery',
  'Cultural Center',
  'Historic Building',
  'Landmark',
  'Monument',
  'Museum',
  'Religious Site',
  'Other'
]

export default function LocationDetailPage() {
  const router = useRouter()
  const params = useParams()
  const locationId = params.id as string

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [editMode, setEditMode] = useState(false)
  const [uploadingImages, setUploadingImages] = useState(false)
  const [compressing, setCompressing] = useState(false)
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)
  const [museumHours, setMuseumHours] = useState<MuseumHours | null>(null)
  
  const mapRef = useRef<HTMLDivElement>(null)
  const googleMapRef = useRef<any>(null)
  const markerRef = useRef<any>(null)

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    address: '',
    lat: '',
    lng: '',
    category: '',
    active: true,
    is_museum: false,
    youtube_url: '',
    facebook_url: '',
    instagram_url: '',
    website_url: '',
  })

  const [existingImages, setExistingImages] = useState<string[]>([])
  const [originalImages, setOriginalImages] = useState<string[]>([])
  const [newImageFiles, setNewImageFiles] = useState<File[]>([])
  const [newImagePreviews, setNewImagePreviews] = useState<string[]>([])

  const deleteImageFromStorage = async (imageUrl: string) => {
    try {
      const urlParts = imageUrl.split('/images/')
      if (urlParts.length !== 2) {
        console.error('Invalid image URL format:', imageUrl)
        return
      }
      
      const filePath = urlParts[1]
      
      console.log('Deleting from storage:', filePath)
      
      const { error } = await supabase.storage
        .from('images')
        .remove([filePath])
      
      if (error) {
        console.error('Error deleting from storage:', error)
      } else {
        console.log('Successfully deleted from storage:', filePath)
      }
    } catch (err) {
      console.error('Exception deleting from storage:', err)
    }
  }

  const handleMuseumToggle = (checked: boolean) => {
    setFormData({ ...formData, is_museum: checked })
    if (checked && !museumHours) {
      setMuseumHours(defaultHours)
    }
  }

  const handleHoursChange = (day: keyof MuseumHours, field: 'open' | 'close' | 'closed', value: string | boolean) => {
    if (!museumHours) return
    
    setMuseumHours({
      ...museumHours,
      [day]: {
        ...museumHours[day],
        [field]: value,
        ...(field === 'closed' && value === true ? { open: null, close: null } : {})
      }
    })
  }

  useEffect(() => {
    async function loadLocation() {
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
        name: data.name || '',
        description: data.description || '',
        address: data.address || '',
        lat: data.lat?.toString() || '',
        lng: data.lng?.toString() || '',
        category: data.category || '',
        active: data.active ?? true,
        is_museum: data.is_museum || false,
        youtube_url: data.youtube_url || '',
        facebook_url: data.facebook_url || '',
        instagram_url: data.instagram_url || '',
        website_url: data.website_url || '',
      })

      if (data.museum_hours) {
        setMuseumHours(data.museum_hours)
      }

      if (data.images) {
        setExistingImages(data.images)
        setOriginalImages([...data.images])
      }

      setLoading(false)
    }

    loadLocation()
  }, [locationId])

  // Initialize Google Maps
  useEffect(() => {
    if (!editMode || !mapRef.current) return

    const initMap = () => {
      const lat = parseFloat(formData.lat) || 39.8283
      const lng = parseFloat(formData.lng) || -98.5795
      const hasCoords = formData.lat && formData.lng

      // @ts-ignore
      const map = new google.maps.Map(mapRef.current, {
        zoom: hasCoords ? 14 : 4,
        center: { lat, lng },
        mapTypeControl: true,
        streetViewControl: true,
        fullscreenControl: true,
      })

      googleMapRef.current = map

      // @ts-ignore
      const marker = new google.maps.Marker({
        position: { lat, lng },
        map: map,
        draggable: true,
        title: formData.name || 'Location',
      })

      markerRef.current = marker

      // Update coordinates when marker is dragged
      marker.addListener('dragend', () => {
        const position = marker.getPosition()
        if (position) {
          setFormData(prev => ({
            ...prev,
            lat: position.lat().toFixed(6),
            lng: position.lng().toFixed(6)
          }))
        }
      })

      // Try to get user's location
      if (navigator.geolocation && !hasCoords) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const userLat = position.coords.latitude
            const userLng = position.coords.longitude
            map.setCenter({ lat: userLat, lng: userLng })
            map.setZoom(12)
            marker.setPosition({ lat: userLat, lng: userLng })
            setFormData(prev => ({
              ...prev,
              lat: userLat.toFixed(6),
              lng: userLng.toFixed(6)
            }))
          },
          (error) => {
            console.log('Geolocation error:', error)
          }
        )
      }
    }

    // Load Google Maps script if not already loaded
    // @ts-ignore
    if (typeof google === 'undefined' || typeof google.maps === 'undefined') {
      const script = document.createElement('script')
      script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`
      script.async = true
      script.defer = true
      script.onload = initMap
      document.head.appendChild(script)
    } else {
      initMap()
    }
  }, [editMode])

  // Update marker position when coordinates change
  useEffect(() => {
    if (markerRef.current && formData.lat && formData.lng) {
      const lat = parseFloat(formData.lat)
      const lng = parseFloat(formData.lng)
      if (!isNaN(lat) && !isNaN(lng)) {
        markerRef.current.setPosition({ lat, lng })
        googleMapRef.current?.setCenter({ lat, lng })
      }
    }
  }, [formData.lat, formData.lng])

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return

    setCompressing(true)

    try {
      const compressedFiles: File[] = []
      
      for (const file of files) {
        const options = {
          maxSizeMB: 1,
          maxWidthOrHeight: 1920,
          useWebWorker: true
        }
        
        const compressedFile = await imageCompression(file, options)
        compressedFiles.push(compressedFile)
      }

      setNewImageFiles([...newImageFiles, ...compressedFiles])
      
      const previews = await Promise.all(
        compressedFiles.map(file => {
          return new Promise<string>((resolve) => {
            const reader = new FileReader()
            reader.onloadend = () => resolve(reader.result as string)
            reader.readAsDataURL(file)
          })
        })
      )
      
      setNewImagePreviews([...newImagePreviews, ...previews])
    } catch (err) {
      console.error('Error compressing images:', err)
      alert('Error processing images')
    } finally {
      setCompressing(false)
    }
  }

  const removeExistingImage = (index: number) => {
    setExistingImages(existingImages.filter((_, i) => i !== index))
  }

  const removeNewImage = (index: number) => {
    setNewImageFiles(newImageFiles.filter((_, i) => i !== index))
    setNewImagePreviews(newImagePreviews.filter((_, i) => i !== index))
  }

  const handleDragStart = (index: number, isExisting: boolean) => {
    setDraggedIndex(isExisting ? index : index + existingImages.length)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleDrop = (index: number, isExisting: boolean) => {
    if (draggedIndex === null) return

    const dropIndex = isExisting ? index : index + existingImages.length
    const totalImages = [...existingImages, ...newImagePreviews]
    const draggedItem = totalImages[draggedIndex]
    
    totalImages.splice(draggedIndex, 1)
    totalImages.splice(dropIndex, 0, draggedItem)

    const newExisting = totalImages.slice(0, existingImages.length)
    const newPreviews = totalImages.slice(existingImages.length)
    
    setExistingImages(newExisting)
    setNewImagePreviews(newPreviews)
    setDraggedIndex(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name) {
      alert('Please enter a location name')
      return
    }

    setSaving(true)
    setError('')

    try {
      let allImages = [...existingImages]

      if (newImageFiles.length > 0) {
        setUploadingImages(true)
        
        for (const file of newImageFiles) {
          const fileExt = file.name.split('.').pop()
          const fileName = `${Math.random()}.${fileExt}`
          const filePath = `${locationId}/${fileName}`

          const { error: uploadError } = await supabase.storage
            .from('images')
            .upload(filePath, file)

          if (uploadError) {
            console.error('Upload error:', uploadError)
            throw uploadError
          }

          const { data: { publicUrl } } = supabase.storage
            .from('images')
            .getPublicUrl(filePath)

          allImages.push(publicUrl)
        }
        
        setUploadingImages(false)
      }

      const deletedImages = originalImages.filter(img => !existingImages.includes(img))
      for (const deletedImage of deletedImages) {
        await deleteImageFromStorage(deletedImage)
      }

      const { error: updateError } = await supabase
        .from('locations')
        .update({
          name: formData.name,
          description: formData.description,
          address: formData.address,
          lat: formData.lat ? parseFloat(formData.lat) : null,
          lng: formData.lng ? parseFloat(formData.lng) : null,
          category: formData.category || null,
          active: formData.active,
          is_museum: formData.is_museum,
          museum_hours: formData.is_museum ? museumHours : null,
          youtube_url: formData.youtube_url || null,
          facebook_url: formData.facebook_url || null,
          instagram_url: formData.instagram_url || null,
          website_url: formData.website_url || null,
          images: allImages,
        })
        .eq('id', locationId)

      if (updateError) throw updateError

      setOriginalImages([...allImages])
      setNewImageFiles([])
      setNewImagePreviews([])
      setEditMode(false)
      
      alert('Location updated successfully!')
    } catch (err: any) {
      console.error('Error updating location:', err)
      setError(err.message)
    } finally {
      setSaving(false)
      setUploadingImages(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this location? This action cannot be undone.')) {
      return
    }

    try {
      for (const imageUrl of existingImages) {
        await deleteImageFromStorage(imageUrl)
      }

      const { error } = await supabase
        .from('locations')
        .delete()
        .eq('id', locationId)

      if (error) throw error

      router.push('/dashboard/locations')
    } catch (err: any) {
      console.error('Error deleting location:', err)
      alert('Error deleting location: ' + err.message)
    }
  }

  const handleCancel = () => {
    setFormData({
      name: formData.name,
      description: formData.description,
      address: formData.address,
      lat: formData.lat,
      lng: formData.lng,
      category: formData.category,
      active: formData.active,
      is_museum: formData.is_museum,
      youtube_url: formData.youtube_url,
      facebook_url: formData.facebook_url,
      instagram_url: formData.instagram_url,
      website_url: formData.website_url,
    })
    // Reset museum hours to original loaded value
    if (formData.is_museum) {
      // Reload from database...keeping current value
    }
    setExistingImages([...originalImages])
    setNewImageFiles([])
    setNewImagePreviews([])
    setEditMode(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <AdminNav activeTab="locations" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-12">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
            <p className="mt-4 text-gray-600">Loading location...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error && !editMode) {
    return (
      <div className="min-h-screen bg-gray-50">
        <AdminNav activeTab="locations" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <p className="text-red-800">{error}</p>
            <Link href="/dashboard/locations" className="text-blue-600 hover:underline mt-4 inline-block">
              ← Back to Locations
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminNav activeTab="locations" />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <Link href="/dashboard/locations" className="text-blue-600 hover:underline mb-2 inline-block">
              ← Back to Locations
            </Link>
            <h1 className="text-3xl font-bold text-gray-900">{formData.name || 'Location Details'}</h1>
          </div>
          {!editMode && (
            <div className="flex space-x-3">
              <button
                onClick={() => setEditMode(true)}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <Edit2 className="h-5 w-5 mr-2" />
                Edit Location
              </button>
              <button
                onClick={handleDelete}
                className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                <Trash2 className="h-5 w-5 mr-2" />
                Delete
              </button>
            </div>
          )}
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Basic Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Location Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  disabled={!editMode}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  disabled={!editMode}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50"
                >
                  <option value="">Select a category</option>
                  {LOCATION_CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center space-x-6">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.active}
                    onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                    disabled={!editMode}
                    className="h-4 w-4 text-blue-600 rounded focus:ring-blue-500 disabled:opacity-50"
                  />
                  <span className="ml-2 text-sm text-gray-700">Active</span>
                </label>

                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.is_museum}
                    onChange={(e) => handleMuseumToggle(e.target.checked)}
                    disabled={!editMode}
                    className="h-4 w-4 text-blue-600 rounded focus:ring-blue-500 disabled:opacity-50"
                  />
                  <span className="ml-2 text-sm text-gray-700">Is Museum</span>
                </label>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Address
                </label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  disabled={!editMode}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  disabled={!editMode}
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50"
                />
              </div>

              {formData.is_museum && museumHours && (
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Museum Hours
                  </label>
                  <div className="space-y-3 border border-gray-200 rounded-lg p-4 bg-gray-50">
                    {(Object.keys(museumHours) as Array<keyof MuseumHours>).map((day) => (
                      <div key={day} className="grid grid-cols-6 gap-4 items-center">
                        <div className="col-span-1">
                          <span className="text-sm font-medium text-gray-700 capitalize">{day}</span>
                        </div>
                        <div className="col-span-2">
                          <input
                            type="time"
                            value={museumHours[day].open || ''}
                            onChange={(e) => handleHoursChange(day, 'open', e.target.value)}
                            disabled={!editMode || museumHours[day].closed}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:text-gray-500"
                          />
                        </div>
                        <div className="col-span-2">
                          <input
                            type="time"
                            value={museumHours[day].close || ''}
                            onChange={(e) => handleHoursChange(day, 'close', e.target.value)}
                            disabled={!editMode || museumHours[day].closed}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:text-gray-500"
                          />
                        </div>
                        <div className="col-span-1 flex justify-center">
                          <label className="flex items-center">
                            <input
                              type="checkbox"
                              checked={museumHours[day].closed}
                              onChange={(e) => handleHoursChange(day, 'closed', e.target.checked)}
                              disabled={!editMode}
                              className="h-4 w-4 text-blue-600 rounded focus:ring-blue-500 disabled:opacity-50"
                            />
                            <span className="ml-2 text-sm text-gray-600">Closed</span>
                          </label>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Social Links */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Social Media & Website</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Globe className="h-4 w-4 inline mr-1" />
                  Website URL
                </label>
                <input
                  type="url"
                  value={formData.website_url}
                  onChange={(e) => setFormData({ ...formData, website_url: e.target.value })}
                  disabled={!editMode}
                  placeholder="https://example.com"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Facebook className="h-4 w-4 inline mr-1" />
                  Facebook URL
                </label>
                <input
                  type="url"
                  value={formData.facebook_url}
                  onChange={(e) => setFormData({ ...formData, facebook_url: e.target.value })}
                  disabled={!editMode}
                  placeholder="https://facebook.com/..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Instagram className="h-4 w-4 inline mr-1" />
                  Instagram URL
                </label>
                <input
                  type="url"
                  value={formData.instagram_url}
                  onChange={(e) => setFormData({ ...formData, instagram_url: e.target.value })}
                  disabled={!editMode}
                  placeholder="https://instagram.com/..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Youtube className="h-4 w-4 inline mr-1" />
                  YouTube URL
                </label>
                <input
                  type="url"
                  value={formData.youtube_url}
                  onChange={(e) => setFormData({ ...formData, youtube_url: e.target.value })}
                  disabled={!editMode}
                  placeholder="https://youtube.com/..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50"
                />
              </div>
            </div>
          </div>

          {/* Coordinates & Map */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              <MapPin className="h-5 w-5 inline mr-2" />
              Location Coordinates
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Latitude
                </label>
                <input
                  type="text"
                  value={formData.lat}
                  onChange={(e) => setFormData({ ...formData, lat: e.target.value })}
                  disabled={!editMode}
                  placeholder="39.123456"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Longitude
                </label>
                <input
                  type="text"
                  value={formData.lng}
                  onChange={(e) => setFormData({ ...formData, lng: e.target.value })}
                  disabled={!editMode}
                  placeholder="-98.123456"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50"
                />
              </div>
            </div>

            {editMode && (
              <div>
                <p className="text-sm text-gray-600 mb-2">
                  Drag the pin to set the location. The map will center on your current location by default.
                </p>
                <div 
                  ref={mapRef}
                  className="w-full h-96 rounded-lg bg-gray-100"
                />
              </div>
            )}
          </div>

          {/* Images */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Images</h2>
            
            {editMode && (
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Upload Images
                </label>
                <div className="flex items-center justify-center w-full">
                  <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <Upload className="h-10 w-10 text-gray-400 mb-2" />
                      <p className="text-sm text-gray-600">
                        {compressing ? 'Compressing images...' : 'Click to upload or drag and drop'}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">PNG, JPG, GIF up to 10MB (will be compressed)</p>
                    </div>
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handleImageUpload}
                      disabled={compressing}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>
            )}

            {(existingImages.length > 0 || newImagePreviews.length > 0) && (
              <div>
                <p className="text-sm text-gray-600 mb-3">
                  {editMode ? 'Drag images to reorder. First image will be the cover photo.' : 'Images'}
                </p>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {existingImages.map((url, index) => (
                    <div
                      key={`existing-${index}`}
                      draggable={editMode}
                      onDragStart={() => handleDragStart(index, true)}
                      onDragOver={handleDragOver}
                      onDrop={() => handleDrop(index, true)}
                      className={`relative group ${editMode ? 'cursor-move' : ''}`}
                    >
                      {index === 0 && (
                        <div className="absolute top-2 left-2 bg-blue-600 text-white text-xs px-2 py-1 rounded z-10">
                          Cover
                        </div>
                      )}
                      {editMode && (
                        <div className="absolute top-2 right-2 z-10">
                          <GripVertical className="h-5 w-5 text-white drop-shadow" />
                        </div>
                      )}
                      <img
                        src={url}
                        alt={`Location ${index + 1}`}
                        className="w-full h-40 object-cover rounded-lg"
                      />
                      {editMode && (
                        <button
                          type="button"
                          onClick={() => removeExistingImage(index)}
                          className="absolute bottom-2 right-2 p-2 bg-red-600 text-white rounded-full hover:bg-red-700 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  ))}

                  {newImagePreviews.map((preview, index) => (
                    <div
                      key={`new-${index}`}
                      draggable={editMode}
                      onDragStart={() => handleDragStart(index, false)}
                      onDragOver={handleDragOver}
                      onDrop={() => handleDrop(index, false)}
                      className="relative group cursor-move"
                    >
                      <div className="absolute top-2 left-2 bg-green-600 text-white text-xs px-2 py-1 rounded z-10">
                        New
                      </div>
                      <div className="absolute top-2 right-2 z-10">
                        <GripVertical className="h-5 w-5 text-white drop-shadow" />
                      </div>
                      <img
                        src={preview}
                        alt={`New ${index + 1}`}
                        className="w-full h-40 object-cover rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={() => removeNewImage(index)}
                        className="absolute bottom-2 right-2 p-2 bg-red-600 text-white rounded-full hover:bg-red-700 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          {editMode && (
            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={handleCancel}
                disabled={saving}
                className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving || uploadingImages || compressing}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 inline-flex items-center"
              >
                {saving || uploadingImages ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    {uploadingImages ? 'Uploading Images...' : 'Saving...'}
                  </>
                ) : (
                  <>
                    <Save className="h-5 w-5 mr-2" />
                    Save Changes
                  </>
                )}
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  )
}
