'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import imageCompression from 'browser-image-compression'
import { MapPin, Save, Upload, X, GripVertical, Globe, Facebook, Instagram, Youtube, Search, Sparkles } from 'lucide-react'
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
  'Landmark',
  'Historic Building',
  'Battlefield',
  'Museum',
  'Monument',
  'Cemetery',
  'Archaeological Site',
  'Historic District',
  'Religious Site',
  'Cultural Center',
  'Other'
]

export default function NewLocationPage() {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [uploadingImages, setUploadingImages] = useState(false)
  const [compressing, setCompressing] = useState(false)
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)
  const [tenantId, setTenantId] = useState<string | null>(null)
  const [museumHours, setMuseumHours] = useState<MuseumHours | null>(null)
  const [geocoding, setGeocoding] = useState(false)
  const [aiAssisting, setAiAssisting] = useState(false)
  const [showAiDialog, setShowAiDialog] = useState(false)
  const [aiForm, setAiForm] = useState({
    locationName: '',
    city: '',
    state: ''
  })
  const [remainingAiRequests, setRemainingAiRequests] = useState<number | null>(null)
  
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

  const [imageFiles, setImageFiles] = useState<File[]>([])
  const [imagePreviews, setImagePreviews] = useState<string[]>([])

  const handleMuseumToggle = (checked: boolean) => {
    setFormData({ ...formData, is_museum: checked })
    if (checked && !museumHours) {
      setMuseumHours(defaultHours)
    }
  }

  const handleFindOnMap = async () => {
    if (!formData.address) {
      alert('Please enter an address first')
      return
    }

    setGeocoding(true)

    try {
      // @ts-ignore
      const geocoder = new google.maps.Geocoder()
      
      geocoder.geocode({ address: formData.address }, (results: any, status: any) => {
        // @ts-ignore
        if (status === google.maps.GeocoderStatus.OK && results[0]) {
          const location = results[0].geometry.location
          const lat = location.lat()
          const lng = location.lng()

          // Update form data
          setFormData(prev => ({
            ...prev,
            lat: lat.toFixed(6),
            lng: lng.toFixed(6)
          }))

          // Update map and marker
          if (googleMapRef.current && markerRef.current) {
            googleMapRef.current.setCenter({ lat, lng })
            googleMapRef.current.setZoom(16)
            markerRef.current.setPosition({ lat, lng })
          }

          setGeocoding(false)
        } else {
          setGeocoding(false)
          alert('Address not found. Please check the address and try again, or set the location manually on the map.')
        }
      })
    } catch (err) {
      console.error('Geocoding error:', err)
      setGeocoding(false)
      alert('Error finding address. Please try again or set the location manually.')
    }
  }

  const handleAiAssist = async () => {
    if (!aiForm.locationName || !aiForm.state) {
      alert('Please enter at least the location name and state')
      return
    }

    setAiAssisting(true)

    try {
      // Get session token
      const { data: { session } } = await supabase.auth.getSession()
      
      console.log('Session check:', session ? 'Has session' : 'No session')
      
      if (!session) {
        alert('Please sign in to use AI Assist')
        setAiAssisting(false)
        return
      }

      console.log('Making AI Assist request with token')

      const response = await fetch('/api/locations/ai-assist', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          locationName: aiForm.locationName,
          city: aiForm.city,
          state: aiForm.state
        })
      })

      console.log('Response status:', response.status)

      const result = await response.json()
      console.log('Response data:', result)

      if (!response.ok) {
        if (response.status === 429) {
          alert(result.error || 'Daily limit reached (20 requests per day)')
        } else if (response.status === 401) {
          alert('Authentication failed. Please try logging out and back in.')
        } else {
          alert(result.error || 'Error generating location data')
        }
        setAiAssisting(false)
        return
      }

      // Populate form with AI data
      setFormData(prev => ({
        ...prev,
        name: result.data.name,
        description: result.data.description,
        address: result.data.address,
        lat: result.data.lat,
        lng: result.data.lng,
        category: result.data.category,
        website_url: result.data.website_url
      }))

      // Update map
      if (result.data.lat && result.data.lng && googleMapRef.current && markerRef.current) {
        const lat = parseFloat(result.data.lat)
        const lng = parseFloat(result.data.lng)
        googleMapRef.current.setCenter({ lat, lng })
        googleMapRef.current.setZoom(16)
        markerRef.current.setPosition({ lat, lng })
      }

      setRemainingAiRequests(result.remainingRequests)
      setShowAiDialog(false)
      setAiForm({ locationName: '', city: '', state: '' })
      alert('Location data generated! Please review and edit as needed before saving.')
    } catch (err) {
      console.error('AI Assist error:', err)
      alert('Error generating location data. Please try again.')
    } finally {
      setAiAssisting(false)
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

  // Get tenant ID
  useEffect(() => {
    async function getTenant() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/auth/signin')
        return
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('tenant_id')
        .eq('id', user.id)
        .single()

      if (profile?.tenant_id) {
        setTenantId(profile.tenant_id)
      }
    }
    getTenant()
  }, [router])

  // Initialize Google Maps
  useEffect(() => {
    if (!mapRef.current) return

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
        title: 'New Location',
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
  }, [])

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

      setImageFiles([...imageFiles, ...compressedFiles])
      
      const previews = await Promise.all(
        compressedFiles.map(file => {
          return new Promise<string>((resolve) => {
            const reader = new FileReader()
            reader.onloadend = () => resolve(reader.result as string)
            reader.readAsDataURL(file)
          })
        })
      )
      
      setImagePreviews([...imagePreviews, ...previews])
    } catch (err) {
      console.error('Error compressing images:', err)
      alert('Error processing images')
    } finally {
      setCompressing(false)
    }
  }

  const removeImage = (index: number) => {
    setImageFiles(imageFiles.filter((_, i) => i !== index))
    setImagePreviews(imagePreviews.filter((_, i) => i !== index))
  }

  const handleDragStart = (index: number) => {
    setDraggedIndex(index)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleDrop = (index: number) => {
    if (draggedIndex === null) return

    const newFiles = [...imageFiles]
    const newPreviews = [...imagePreviews]
    
    const draggedFile = newFiles[draggedIndex]
    const draggedPreview = newPreviews[draggedIndex]
    
    newFiles.splice(draggedIndex, 1)
    newPreviews.splice(draggedIndex, 1)
    
    newFiles.splice(index, 0, draggedFile)
    newPreviews.splice(index, 0, draggedPreview)
    
    setImageFiles(newFiles)
    setImagePreviews(newPreviews)
    setDraggedIndex(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name) {
      alert('Please enter a location name')
      return
    }

    if (!formData.lat || !formData.lng) {
      alert('Please set the location coordinates by dragging the pin on the map, using "Find on Map", or entering them manually')
      return
    }

    if (!tenantId) {
      alert('Unable to determine your organization. Please try again.')
      return
    }

    setSaving(true)

    try {
      // Create location first to get ID
      const { data: location, error: locationError } = await supabase
        .from('locations')
        .insert({
          tenant_id: tenantId,
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
          images: [],
        })
        .select()
        .single()

      if (locationError) throw locationError

      // Upload images if any
      let imageUrls: string[] = []
      if (imageFiles.length > 0) {
        setUploadingImages(true)
        
        for (const file of imageFiles) {
          const fileExt = file.name.split('.').pop()
          const fileName = `${Math.random()}.${fileExt}`
          const filePath = `${location.id}/${fileName}`

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

          imageUrls.push(publicUrl)
        }

        // Update location with image URLs
        const { error: updateError } = await supabase
          .from('locations')
          .update({ images: imageUrls })
          .eq('id', location.id)

        if (updateError) throw updateError
        
        setUploadingImages(false)
      }

      router.push('/dashboard/locations')
    } catch (err: any) {
      console.error('Error creating location:', err)
      alert('Error creating location: ' + err.message)
      setSaving(false)
      setUploadingImages(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminNav activeTab="locations" />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <Link href="/dashboard/locations" className="text-blue-600 hover:underline mb-2 inline-block">
            ← Back to Locations
          </Link>
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold text-gray-900">Add New Location</h1>
            <button
              type="button"
              onClick={() => setShowAiDialog(true)}
              className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              <Sparkles className="h-5 w-5 mr-2" />
              AI Assist
            </button>
          </div>
          <p className="mt-2 text-sm text-gray-600">
            Use AI Assist to automatically research and populate location details
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          {/* AI Assist Dialog */}
          {showAiDialog && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">
                  <Sparkles className="h-5 w-5 inline mr-2 text-purple-600" />
                  AI-Powered Location Research
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  Enter information about the historical location. AI will research and generate a complete profile including description, address, and coordinates.
                </p>
                
                {remainingAiRequests !== null && (
                  <div className="mb-4 bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <p className="text-sm text-blue-800">
                      📊 <strong>{remainingAiRequests}</strong> AI requests remaining today
                    </p>
                  </div>
                )}

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Historical Place Name *
                    </label>
                    <input
                      type="text"
                      value={aiForm.locationName}
                      onChange={(e) => setAiForm({ ...aiForm, locationName: e.target.value })}
                      placeholder="e.g., Old Courthouse, Lincoln Memorial"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500"
                      autoFocus
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      City or County
                    </label>
                    <input
                      type="text"
                      value={aiForm.city}
                      onChange={(e) => setAiForm({ ...aiForm, city: e.target.value })}
                      placeholder="e.g., Hamilton County, Springfield"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      State *
                    </label>
                    <input
                      type="text"
                      value={aiForm.state}
                      onChange={(e) => setAiForm({ ...aiForm, state: e.target.value })}
                      placeholder="e.g., Indiana, IL, Ohio"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500"
                    />
                  </div>
                </div>

                <div className="mt-6 flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAiDialog(false)
                      setAiForm({ locationName: '', city: '', state: '' })
                    }}
                    disabled={aiAssisting}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleAiAssist}
                    disabled={!aiForm.locationName || !aiForm.state || aiAssisting}
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 inline-flex items-center"
                  >
                    {aiAssisting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Researching...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4 mr-2" />
                        Generate Profile
                      </>
                    )}
                  </button>
                </div>

                <p className="mt-4 text-xs text-gray-500">
                  💡 Limit: 20 AI-generated profiles per day
                </p>
              </div>
            </div>
          )}

          {/* 2-Column Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* LEFT COLUMN - Form Fields */}
            <div className="space-y-6">
              
              {/* 1. Images */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Images</h2>
                
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Upload Images
                  </label>
                  <div className="flex items-center justify-center w-full">
                    <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <Upload className="h-10 w-10 text-gray-400 mb-2" />
                        <p className="text-sm text-gray-600">
                          {compressing ? 'Compressing...' : 'Click to upload'}
                        </p>
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

                {imagePreviews.length > 0 && (
                  <div>
                    <p className="text-sm text-gray-600 mb-3">
                      Drag to reorder. First image = cover.
                    </p>
                    <div className="grid grid-cols-2 gap-4">
                      {imagePreviews.map((preview, index) => (
                        <div
                          key={index}
                          draggable
                          onDragStart={() => handleDragStart(index)}
                          onDragOver={handleDragOver}
                          onDrop={() => handleDrop(index)}
                          className="relative group cursor-move"
                        >
                          {index === 0 && (
                            <div className="absolute top-2 left-2 bg-blue-600 text-white text-xs px-2 py-1 rounded z-10">
                              Cover
                            </div>
                          )}
                          <div className="absolute top-2 right-2 z-10">
                            <GripVertical className="h-5 w-5 text-white drop-shadow" />
                          </div>
                          <img
                            src={preview}
                            alt={`Upload ${index + 1}`}
                            className="w-full h-32 object-cover rounded-lg"
                          />
                          <button
                            type="button"
                            onClick={() => removeImage(index)}
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

              {/* 2. Basic Information */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Basic Information</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Location Name *
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
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
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
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
                        className="h-4 w-4 text-blue-600 rounded focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">Active</span>
                    </label>

                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.is_museum}
                        onChange={(e) => handleMuseumToggle(e.target.checked)}
                        className="h-4 w-4 text-blue-600 rounded focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">Is Museum</span>
                    </label>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      rows={4}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  {formData.is_museum && museumHours && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-3">
                        Museum Hours
                      </label>
                      <div className="space-y-2 border border-gray-200 rounded-lg p-4 bg-gray-50">
                        {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map((day) => {
                          const dayKey = day as keyof MuseumHours
                          return (
                            <div key={day} className="grid grid-cols-7 gap-2 items-center text-sm">
                              <div className="col-span-2">
                                <span className="font-medium text-gray-700 capitalize">{day.slice(0,3)}</span>
                              </div>
                              <div className="col-span-2">
                                <input
                                  type="time"
                                  value={museumHours[dayKey].open || ''}
                                  onChange={(e) => handleHoursChange(dayKey, 'open', e.target.value)}
                                  disabled={museumHours[dayKey].closed}
                                  className="w-full px-2 py-1 border border-gray-300 rounded text-xs focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                                />
                              </div>
                              <div className="col-span-2">
                                <input
                                  type="time"
                                  value={museumHours[dayKey].close || ''}
                                  onChange={(e) => handleHoursChange(dayKey, 'close', e.target.value)}
                                  disabled={museumHours[dayKey].closed}
                                  className="w-full px-2 py-1 border border-gray-300 rounded text-xs focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                                />
                              </div>
                              <div className="col-span-1 flex justify-center">
                                <input
                                  type="checkbox"
                                  checked={museumHours[dayKey].closed}
                                  onChange={(e) => handleHoursChange(dayKey, 'closed', e.target.checked)}
                                  title="Closed"
                                  className="h-4 w-4 text-blue-600 rounded focus:ring-blue-500"
                                />
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* 3. Location & Address */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  <MapPin className="h-5 w-5 inline mr-2" />
                  Location & Address
                </h2>
                
                {/* Instructions */}
                <div className="mb-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-900 font-medium mb-2">📍 How to set the location:</p>
                  <ul className="text-sm text-blue-800 space-y-1 ml-4">
                    <li>• <strong>Option 1:</strong> Enter the address below and click "Find on Map"</li>
                    <li>• <strong>Option 2:</strong> Drag the pin on the map to the exact location</li>
                    <li>• <strong>Option 3:</strong> Enter latitude/longitude coordinates manually</li>
                  </ul>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Address
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={formData.address}
                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                        placeholder="123 Main St, City, State ZIP"
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                      />
                      <button
                        type="button"
                        onClick={handleFindOnMap}
                        disabled={!formData.address || geocoding}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center whitespace-nowrap"
                      >
                        {geocoding ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            Searching...
                          </>
                        ) : (
                          <>
                            <Search className="h-4 w-4 mr-2" />
                            Find on Map
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Latitude *
                      </label>
                      <input
                        type="text"
                        value={formData.lat}
                        onChange={(e) => setFormData({ ...formData, lat: e.target.value })}
                        placeholder="39.123456"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Longitude *
                      </label>
                      <input
                        type="text"
                        value={formData.lng}
                        onChange={(e) => setFormData({ ...formData, lng: e.target.value })}
                        placeholder="-98.123456"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* 4. Social Media & Website */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Social Media & Website</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Globe className="h-4 w-4 inline mr-1" />
                      Website URL
                    </label>
                    <input
                      type="text"
                      value={formData.website_url}
                      onChange={(e) => setFormData({ ...formData, website_url: e.target.value })}
                      placeholder="example.com or https://example.com"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Facebook className="h-4 w-4 inline mr-1" />
                      Facebook URL
                    </label>
                    <input
                      type="text"
                      value={formData.facebook_url}
                      onChange={(e) => setFormData({ ...formData, facebook_url: e.target.value })}
                      placeholder="facebook.com/yourpage"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Instagram className="h-4 w-4 inline mr-1" />
                      Instagram URL
                    </label>
                    <input
                      type="text"
                      value={formData.instagram_url}
                      onChange={(e) => setFormData({ ...formData, instagram_url: e.target.value })}
                      placeholder="instagram.com/yourpage"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Youtube className="h-4 w-4 inline mr-1" />
                      YouTube URL
                    </label>
                    <input
                      type="text"
                      value={formData.youtube_url}
                      onChange={(e) => setFormData({ ...formData, youtube_url: e.target.value })}
                      placeholder="youtube.com/@yourchannel"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN - Map */}
            <div className="lg:sticky lg:top-8 lg:self-start">
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Interactive Map</h2>
                <p className="text-sm text-gray-600 mb-3">
                  Drag the pin to set the location. Coordinates will update automatically.
                </p>
                <div 
                  ref={mapRef}
                  className="w-full rounded-lg bg-gray-100"
                  style={{ height: '600px' }}
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-6 flex justify-end space-x-4">
            <Link
              href="/dashboard/locations"
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={saving || uploadingImages || compressing}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 inline-flex items-center"
            >
              {saving || uploadingImages ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  {uploadingImages ? 'Uploading...' : 'Creating...'}
                </>
              ) : (
                <>
                  <Save className="h-5 w-5 mr-2" />
                  Create Location
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
