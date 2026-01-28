'use client'

import dynamic from 'next/dynamic'

// This component must be loaded client-side only
const DraggableMapInner = dynamic(
  () => import('./DraggableMapInner'),
  { 
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-[300px] bg-gray-100 rounded-lg">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent mb-2"></div>
          <p className="text-sm text-gray-600">Loading map...</p>
        </div>
      </div>
    )
  }
)

interface MapProps {
  lat: number
  lng: number
  onLocationChange: (lat: number, lng: number) => void
}

export default function DraggableMap({ lat, lng, onLocationChange }: MapProps) {
  return (
    <div className="border rounded-lg overflow-hidden">
      <DraggableMapInner lat={lat} lng={lng} onLocationChange={onLocationChange} />
    </div>
  )
}
