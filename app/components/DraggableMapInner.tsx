'use client'

import { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// Fix for default marker icon in Next.js
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
})

interface MapProps {
  lat: number
  lng: number
  onLocationChange: (lat: number, lng: number) => void
}

export default function DraggableMapInner({ lat, lng, onLocationChange }: MapProps) {
  const mapRef = useRef<L.Map | null>(null)
  const markerRef = useRef<L.Marker | null>(null)

  useEffect(() => {
    // Only initialize once
    if (!mapRef.current) {
      mapRef.current = L.map('draggable-map').setView([lat, lng], 15)
      
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      }).addTo(mapRef.current)

      // Add draggable marker
      markerRef.current = L.marker([lat, lng], { 
        draggable: true,
        autoPan: true
      }).addTo(mapRef.current)
      
      // When marker is dragged
      markerRef.current.on('dragend', (e) => {
        const pos = e.target.getLatLng()
        onLocationChange(pos.lat, pos.lng)
      })

      // When map is clicked, move marker to that location
      mapRef.current.on('click', (e) => {
        const { lat, lng } = e.latlng
        if (markerRef.current) {
          markerRef.current.setLatLng([lat, lng])
        }
        onLocationChange(lat, lng)
      })
    }

    // Cleanup on unmount
    return () => {
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
      }
    }
  }, [])

  // Update marker position when coordinates change externally
  useEffect(() => {
    if (markerRef.current && mapRef.current) {
      const newLatLng = L.latLng(lat, lng)
      markerRef.current.setLatLng(newLatLng)
      mapRef.current.setView(newLatLng, mapRef.current.getZoom())
    }
  }, [lat, lng])

  return (
    <div>
      <div id="draggable-map" style={{ height: '300px', width: '100%' }} />
      <div className="text-xs text-gray-600 mt-2 p-3 bg-blue-50 rounded">
        <p className="font-medium text-blue-800 mb-1">Interactive Map Controls:</p>
        <ul className="space-y-1 text-blue-700">
          <li>• <strong>Drag the marker</strong> to set the exact location</li>
          <li>• <strong>Click anywhere on the map</strong> to move the marker</li>
          <li>• <strong>Scroll to zoom</strong> in and out of the map</li>
        </ul>
      </div>
    </div>
  )
}
