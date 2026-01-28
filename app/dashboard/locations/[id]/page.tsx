'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { geocodeAddress } from '@/lib/geocoding'
import imageCompression from 'browser-image-compression'
import { MapPin, Save, Trash2, Edit2, Upload, X, Search } from 'lucide-react'
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

  const [existingImages, setExistingImages] = useState<string[]>([])
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

      console.log('Location data:', data)
      console.log('Images from DB:', data.images)

      setFormData({
        name: data.name,
        description: data.description || '',
        address: data.address || '',
        lat: data.lat?.toString() || '',
        lng: data.lng?.toString() || '',
        featured: data.featured,
        active: data.active,
      })
      
      setExistingImages(data.images || [])
      setLoading(false)
    }

    loadLocation()
  }, [locationId])

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
    
    const totalImages = existingImages.length + newImageFiles.length
    const remainingSlots = 5 - totalImages
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
      
      setNewImageFiles([...newImageFiles, ...compressedFiles])
      setNewImagePreviews([...newImagePreviews, ...newPreviews])
    } catch (err) {
      setCompressing(false)
      setError('Error compressing images. Please try again.')
      console.error('Compression error:', err)
    }
  }

  const removeExistingImage = (index: number) => {
    setExistingImages(existingImages.filter((_, i) => i !== index))
  }

  const removeNewImage = (index: number) => {
    URL.revokeObjectURL(newImagePreviews[index])
    setNewImageFiles(newImageFiles.filter((_, i) => i !== index))
    setNewImagePreviews(newImagePreviews.filter((_, i) => i !== index))
  }

  const uploadNewImages = async () => {
    console.log('Starting upload for edit, locationId:', locationId)
    console.log('Number of new files to upload:', newImageFiles.length)
    
    const uploadedUrls: string[] = []

    for (let i = 0; i < newImageFiles.length; i++) {
      const file = newImageFiles[i]
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

    console.log('All newly uploaded URLs:', uploadedUrls)
    return uploadedUrls
  }

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError('')

    if (!formData.lat || !formData.lng) {
      if (formData.address) {
        const coords = await geocodeAddress(formData.address)
        if (coords) {
          formData.lat = coords.lat.toString()
          formData.lng = coords.lng.toString()
        } else {
          setError('Could not find coordinates for this address. Please enter coordinates manually or use a different address.')
          setSaving(false)
          return
        }
      } else {
        setError('Please provide either an address or coordinates')
        setSaving(false)
        return
      }
    }

    const { data: originalLocation } = await supabase
      .from('locations')
      .select('images')
      .eq('id', locationId)
      .single()

    const originalImages = originalLocation?.images || []
    
    const removedImages = originalImages.filter(
      (url: string) => !existingImages.includes(url)
    )
    
    if (removedImages.length > 0) {
      console.log('Deleting removed images from storage:', removedImages)
      await Promise.all(
        removedImages.map((url: string) => deleteImageFromStorage(url))
      )
    }

    let finalImages = [...existingImages]

    if (newImageFiles.length > 0) {
      setUploadingImages(true)
      const newUrls = await uploadNewImages()
      finalImages = [...finalImages, ...newUrls]
      setUploadingImages(false)
    }

    console.log('Updating location with final images:', finalImages)

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
        images: finalImages,
      })
      .eq('id', locationId)

    if (updateError) {
      console.error('Error updating location:', updateError)
      setError(updateError.message)
      setSaving(false)
      return
    }

    console.log('Location updated successfully')

    setEditMode(false)
    setSaving(false)
    setNewImageFiles([])
    setNewImagePreviews([])
    
    const { data } = await supabase
      .from('locations')
      .select('*')
      .eq('id', locationId)
      .single()

    if (data) {
      setFormData({
        name: data.name,
        description: data.description || '',
        address: data.address || '',
        lat: data.lat?.toString() || '',
        lng: data.lng?.toString() || '',
        featured: data.featured,
        active: data.active,
      })
      setExistingImages(data.images || [])
    }
  }

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this location? This action cannot be undone.')) {
      return
    }

    if (existingImages.length > 0) {
      console.log('Deleting all images from storage')
      await Promise.all(
        existingImages.map(url => deleteImageFromStorage(url))
      )
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

  const handleCancelEdit = async () => {
    setEditMode(false)
    setNewImageFiles([])
    newImagePreviews.forEach(url => URL.revokeObjectURL(url))
    setNewImagePreviews([])
    
    const { data } = await supabase
      .from('locations')
      .select('*')
      .eq('id', locationId)
      .single()

    if (data) {
      setFormData({
        name: data.name,
        description: data.description || '',
        address: data.address || '',
        lat: data.lat?.toString() || '',
        lng: data.lng?.toString() || '',
        featured: data.featured,
        active: data.active,
      })
      setExistingImages(data.images || [])
    }
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

  const totalImages = existingImages.length + newImageFiles.length

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
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center">
                <MapPin className="h-8 w-8 text-blue-600 mr-3" />
                <h1 className="text-2xl font-bold text-gray-900">{editMode ? 'Edit Location' : 'Location Details'}</h1>
              </div>
              <div className="flex space-x-2">
                {!editMode && (
                  <button onClick={() => setEditMode(true)} className="inline-flex items-center px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                    <Edit2 className="h-4 w-4 mr-2" />
                    Edit
                  </button>
                )}
                <button onClick={handleDelete} className="inline-flex items-center px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </button>
              </div>
            </div>

            {error && (
              <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">{error}</div>
            )}

            {editMode ? (
              <form onSubmit={handleUpdate} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                  <input type="text" required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea rows={4} value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500" />
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
                </div>

                <div className="border-t pt-4">
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-gray-700">Coordinates (Optional)</label>
                    <span className="text-xs text-gray-500">Auto-filled from address</span>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Latitude</label>
                      <input type="number" step="any" value={formData.lat} onChange={(e) => setFormData({ ...formData, lat: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Longitude</label>
                      <input type="number" step="any" value={formData.lng} onChange={(e) => setFormData({ ...formData, lng: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500" />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Images ({totalImages}/5)</label>
                  
                  {compressing && (
                    <div className="mb-3 bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded flex items-center">
                      <div className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-solid border-blue-600 border-r-transparent mr-3"></div>
                      <span className="text-sm">Compressing images, please wait...</span>
                    </div>
                  )}

                  {(existingImages.length > 0 || newImagePreviews.length > 0) && (
                    <div className="grid grid-cols-3 gap-3 mb-3">
                      {existingImages.map((url, index) => (
                        <div key={`existing-${index}`} className="relative group">
                          <img src={url} alt={`Image ${index + 1}`} className="w-full h-24 object-cover rounded-lg border border-gray-300" />
                          <button type="button" onClick={() => removeExistingImage(index)} className="absolute top-1 right-1 p-1 bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                      {newImagePreviews.map((preview, index) => (
                        <div key={`new-${index}`} className="relative group">
                          <img src={preview} alt={`New ${index + 1}`} className="w-full h-24 object-cover rounded-lg border border-blue-300" />
                          <button type="button" onClick={() => removeNewImage(index)} className="absolute top-1 right-1 p-1 bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                            <X className="h-4 w-4" />
                          </button>
                          <span className="absolute bottom-1 left-1 px-2 py-0.5 bg-blue-600 text-white text-xs rounded">New</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {totalImages < 5 && (
                    <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <Upload className="h-8 w-8 text-gray-400 mb-2" />
                        <p className="text-sm text-gray-600"><span className="font-semibold">Click to upload</span> or drag and drop</p>
                        <p className="text-xs text-gray-500">PNG, JPG, WebP (Max 5MB, auto-compressed)</p>
                      </div>
                      <input type="file" className="hidden" accept="image/jpeg,image/png,image/webp" multiple onChange={handleImageSelect} disabled={compressing} />
                    </label>
                  )}
                </div>

                <div className="flex items-center space-x-6">
                  <label className="flex items-center">
                    <input type="checkbox" checked={formData.featured} onChange={(e) => setFormData({ ...formData, featured: e.target.checked })} className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded" />
                    <span className="ml-2 text-sm text-gray-700">Featured Location</span>
                  </label>
                  <label className="flex items-center">
                    <input type="checkbox" checked={formData.active} onChange={(e) => setFormData({ ...formData, active: e.target.checked })} className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded" />
                    <span className="ml-2 text-sm text-gray-700">Active</span>
                  </label>
                </div>

                <div className="flex space-x-3 pt-4">
                  <button type="submit" disabled={saving || uploadingImages || compressing} className="flex-1 inline-flex justify-center items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
                    <Save className="h-5 w-5 mr-2" />
                    {uploadingImages ? 'Uploading...' : saving ? 'Saving...' : 'Save Changes'}
                  </button>
                  <button type="button" onClick={handleCancelEdit} className="inline-flex justify-center items-center px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300">Cancel</button>
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

                {existingImages.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-2">Images ({existingImages.length})</h3>
                    <div className="grid grid-cols-2 gap-3">
                      {existingImages.map((url, index) => (
                        <a key={index} href={url} target="_blank" rel="noopener noreferrer" className="group relative block">
                          <img src={url} alt={`Location image ${index + 1}`} className="w-full h-32 object-cover rounded-lg border border-gray-300 group-hover:border-blue-500 transition-all cursor-pointer" />
                          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 rounded-lg transition-all flex items-center justify-center">
                            <span className="text-white opacity-0 group-hover:opacity-100 text-xs font-medium px-2 py-1 bg-blue-600 rounded">View full size</span>
                          </div>
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {hasValidCoordinates() && (
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
                )}

                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Status</h3>
                  <div className="flex space-x-2">
                    {formData.featured && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">Featured</span>
                    )}
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${formData.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {formData.active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Location Map</h2>
            {hasValidCoordinates() ? (
              <div className="space-y-4">
                <div className="border rounded-lg overflow-hidden">
                  <iframe width="100%" height="300" frameBorder="0" scrolling="no" src={getMapUrl() || ''}></iframe>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Coordinates</h3>
                  <p className="text-sm text-gray-900">Latitude: {parseFloat(formData.lat).toFixed(6)}</p>
                  <p className="text-sm text-gray-900">Longitude: {parseFloat(formData.lng).toFixed(6)}</p>
                  <a href={getMapLink() || '#'} target="_blank" rel="noopener noreferrer" className="inline-flex items-center mt-3 text-sm text-blue-600 hover:text-blue-800">Open in OpenStreetMap →</a>
                </div>
                {editMode && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-sm text-blue-800">💡 <strong>Tip:</strong> Change the address and click "Find on Map" to update coordinates.</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                <div className="text-center">
                  <MapPin className="mx-auto h-12 w-12 text-gray-400 mb-3" />
                  <p className="text-gray-600 text-sm">No coordinates available</p>
                  <p className="text-gray-500 text-xs mt-1">Edit location to add address or coordinates</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
