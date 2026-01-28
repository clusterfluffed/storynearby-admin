'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { geocodeAddress } from '@/lib/geocoding'
import imageCompression from 'browser-image-compression'
import { MapPin, Save, X, Upload, Search } from 'lucide-react'
import Link from 'next/link'
import AdminNav from '@/app/components/AdminNav'

export default function NewLocationPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [uploadingImages, setUploadingImages] = useState(false)
  const [geocoding, setGeocoding] = useState(false)
  const [compressing, setCompressing] = useState(false)

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    address: '',
    lat: '',
    lng: '',
    featured: false,
    active: true,
  })

  const [imageFiles, setImageFiles] = useState<File[]>([])
  const [imagePreviews, setImagePreviews] = useState<string[]>([])

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    
    const maxSize = 5 * 1024 * 1024
    const validFiles = files.filter(file => {
      if (file.size > maxSize) {
        alert(`${file.name} is too large. Maximum file size is 5MB.`)
        return false
      }
      return true
    })
    
    const remainingSlots = 5 - imageFiles.length
    const filesToAdd = validFiles.slice(0, remainingSlots)
    
    if (validFiles.length > remainingSlots) {
      alert(`You can only upload ${remainingSlots} more image(s). Maximum 5 images total.`)
    }

    if (filesToAdd.length === 0) return

    const options = {
      maxSizeMB: 0.8,
      maxWidthOrHeight: 1920,
      useWebWorker: true,
      fileType: 'image/jpeg'
    }

    try {
      setCompressing(true)
      
      const compressedFiles = await Promise.all(
        filesToAdd.map(async (file) => {
          try {
            const compressed = await imageCompression(file, options)
            console.log(`${file.name}: ${(file.size / 1024 / 1024).toFixed(2)}MB → ${(compressed.size / 1024 / 1024).toFixed(2)}MB`)
            return compressed
          } catch (err) {
            console.error('Compression error:', err)
            return file
          }
        })
      )
      
      setCompressing(false)
      
      const newPreviews = compressedFiles.map(file => URL.createObjectURL(file))
      
      setImageFiles([...imageFiles, ...compressedFiles])
      setImagePreviews([...imagePreviews, ...newPreviews])
    } catch (err) {
      setCompressing(false)
      setError('Error compressing images. Please try again.')
      console.error('Compression error:', err)
    }
  }

  const removeImage = (index: number) => {
    URL.revokeObjectURL(imagePreviews[index])
    setImageFiles(imageFiles.filter((_, i) => i !== index))
    setImagePreviews(imagePreviews.filter((_, i) => i !== index))
  }

  const handleGeocodeAddress = async () => {
    if (!formData.address) {
      alert('Please enter an address first')
      return
    }

    setGeocoding(true)
    setError('')
    
    const coords = await geocodeAddress(formData.address)
    
    if (coords) {
      setFormData({
        ...formData,
        lat: coords.lat.toString(),
        lng: coords.lng.toString()
      })
      setGeocoding(false)
    } else {
      setError('Could not find coordinates for this address. Please enter them manually.')
      setGeocoding(false)
    }
  }

  const uploadImages = async (locationId: string) => {
    console.log('Starting upload, locationId:', locationId)
    console.log('Number of files to upload:', imageFiles.length)
    
    const uploadedUrls: string[] = []

    for (let i = 0; i < imageFiles.length; i++) {
      const file = imageFiles[i]
      const fileExt = file.name.split('.').pop()
      const fileName = `${locationId}/${Date.now()}-${i}.${fileExt}`

      console.log('Uploading file:', fileName)

      const { error: uploadError, data } = await supabase.storage
        .from('images')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        })

      if (uploadError) {
        console.error('Upload error:', uploadError)
        continue
      }

      console.log('Upload successful, data:', data)

      const { data: { publicUrl } } = supabase.storage
        .from('images')
        .getPublicUrl(fileName)

      console.log('Public URL:', publicUrl)
      uploadedUrls.push(publicUrl)
    }

    console.log('All uploaded URLs:', uploadedUrls)
    return uploadedUrls
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (!formData.lat || !formData.lng) {
      if (formData.address) {
        const coords = await geocodeAddress(formData.address)
        if (coords) {
          formData.lat = coords.lat.toString()
          formData.lng = coords.lng.toString()
        } else {
          setError('Could not find coordinates for this address. Please enter coordinates manually or use a different address.')
          setLoading(false)
          return
        }
      } else {
        setError('Please provide either an address or coordinates')
        setLoading(false)
        return
      }
    }

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setError('You must be logged in')
      setLoading(false)
      return
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('tenant_id')
      .eq('id', user.id)
      .single()

    if (!profile?.tenant_id) {
      setError('No tenant assigned to your account')
      setLoading(false)
      return
    }

    const { data: location, error: insertError } = await supabase
      .from('locations')
      .insert({
        name: formData.name,
        description: formData.description,
        address: formData.address,
        lat: parseFloat(formData.lat),
        lng: parseFloat(formData.lng),
        featured: formData.featured,
        active: formData.active,
        tenant_id: profile.tenant_id,
      })
      .select()
      .single()

    if (insertError || !location) {
      setError(insertError?.message || 'Failed to create location')
      setLoading(false)
      return
    }

    console.log('Location created with ID:', location.id)

    if (imageFiles.length > 0) {
      setUploadingImages(true)
      const imageUrls = await uploadImages(location.id)
      
      console.log('Updating location with images:', imageUrls)
      
      const { error: updateError } = await supabase
        .from('locations')
        .update({ images: imageUrls })
        .eq('id', location.id)
      
      if (updateError) {
        console.error('Error updating images:', updateError)
      } else {
        console.log('Images successfully saved to database')
      }
      
      setUploadingImages(false)
    }

    router.push('/dashboard/locations')
  }

  const hasValidCoordinates = () => {
    if (!formData.lat || !formData.lng) return false
    const lat = parseFloat(formData.lat)
    const lng = parseFloat(formData.lng)
    return !isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180
  }

  const getMapUrl = () => {
    if (!hasValidCoordinates()) return null
    const lat = parseFloat(formData.lat)
    const lng = parseFloat(formData.lng)
    const bbox = `${lng - 0.01},${lat - 0.01},${lng + 0.01},${lat + 0.01}`
    return `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat},${lng}`
  }

  const getMapLink = () => {
    if (!hasValidCoordinates()) return null
    const lat = parseFloat(formData.lat)
    const lng = parseFloat(formData.lng)
    return `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=15/${lat}/${lng}`
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminNav activeTab="locations" />
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <Link href="/dashboard/locations" className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900">
            ← Back to Locations
          </Link>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center mb-6">
              <MapPin className="h-8 w-8 text-blue-600 mr-3" />
              <h1 className="text-2xl font-bold text-gray-900">Add New Location</h1>
            </div>
            {error && (
              <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">{error}</div>
            )}
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                <input 
                  type="text" 
                  required 
                  value={formData.name} 
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })} 
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500" 
                  placeholder="Historic Courthouse" 
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea 
                  rows={4} 
                  value={formData.description} 
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })} 
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500" 
                  placeholder="Built in 1856..." 
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Address *</label>
                <div className="flex space-x-2">
                  <input 
                    type="text" 
                    required
                    value={formData.address} 
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })} 
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500" 
                    placeholder="123 Main St, City, State, ZIP" 
                  />
                  <button
                    type="button"
                    onClick={handleGeocodeAddress}
                    disabled={geocoding || !formData.address}
                    className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
                  >
                    <Search className="h-4 w-4 mr-2" />
                    {geocoding ? 'Finding...' : 'Find on Map'}
                  </button>
                </div>
                <p className="mt-1 text-xs text-gray-500">Enter full address for best results</p>
              </div>

              <div className="border-t pt-4">
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700">Coordinates (Optional)</label>
                  <span className="text-xs text-gray-500">Auto-filled from address</span>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Latitude</label>
                    <input 
                      type="number" 
                      step="any" 
                      value={formData.lat} 
                      onChange={(e) => setFormData({ ...formData, lat: e.target.value })} 
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500" 
                      placeholder="40.0150" 
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Longitude</label>
                    <input 
                      type="number" 
                      step="any" 
                      value={formData.lng} 
                      onChange={(e) => setFormData({ ...formData, lng: e.target.value })} 
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500" 
                      placeholder="-83.0133" 
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Images ({imageFiles.length}/5)</label>
                
                {compressing && (
                  <div className="mb-3 bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded flex items-center">
                    <div className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-solid border-blue-600 border-r-transparent mr-3"></div>
                    <span className="text-sm">Compressing images, please wait...</span>
                  </div>
                )}

                {imagePreviews.length > 0 && (
                  <div className="grid grid-cols-3 gap-3 mb-3">
                    {imagePreviews.map((preview, index) => (
                      <div key={index} className="relative group">
                        <img 
                          src={preview} 
                          alt={`Preview ${index + 1}`}
                          className="w-full h-24 object-cover rounded-lg border border-gray-300"
                        />
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          className="absolute top-1 right-1 p-1 bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {imageFiles.length < 5 && (
                  <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <Upload className="h-8 w-8 text-gray-400 mb-2" />
                      <p className="text-sm text-gray-600"><span className="font-semibold">Click to upload</span></p>
                      <p className="text-xs text-gray-500">PNG, JPG, WebP (Max 5MB, auto-compressed)</p>
                    </div>
                    <input 
                      type="file" 
                      className="hidden" 
                      accept="image/jpeg,image/png,image/webp"
                      multiple
                      onChange={handleImageSelect}
                      disabled={compressing}
                    />
                  </label>
                )}
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
                  disabled={loading || uploadingImages || compressing} 
                  className="flex-1 inline-flex justify-center items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  <Save className="h-5 w-5 mr-2" />
                  {uploadingImages ? 'Uploading images...' : loading ? 'Saving...' : 'Save Location'}
                </button>
                <Link 
                  href="/dashboard/locations" 
                  className="inline-flex justify-center items-center px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                >
                  <X className="h-5 w-5 mr-2" />
                  Cancel
                </Link>
              </div>
            </form>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Location Preview</h2>
            {hasValidCoordinates() ? (
              <div className="space-y-4">
                <div className="border rounded-lg overflow-hidden">
                  <iframe 
                    width="100%" 
                    height="300" 
                    frameBorder="0" 
                    scrolling="no" 
                    src={getMapUrl() || ''}
                  ></iframe>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Coordinates</h3>
                  <p className="text-sm text-gray-900">Latitude: {parseFloat(formData.lat).toFixed(6)}</p>
                  <p className="text-sm text-gray-900">Longitude: {parseFloat(formData.lng).toFixed(6)}</p>
                  <a 
                    href={getMapLink() || '#'} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="inline-flex items-center mt-3 text-sm text-blue-600 hover:text-blue-800"
                  >
                    Open in OpenStreetMap →
                  </a>
                </div>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-800">💡 <strong>Tip:</strong> The red marker shows where this location will appear on the mobile app map.</p>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                <div className="text-center">
                  <MapPin className="mx-auto h-12 w-12 text-gray-400 mb-3" />
                  <p className="text-gray-600 text-sm">Enter an address and click "Find on Map"</p>
                  <p className="text-gray-500 text-xs mt-1">Or enter coordinates manually</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
