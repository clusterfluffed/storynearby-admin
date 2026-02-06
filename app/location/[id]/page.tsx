'use client'

import { useEffect } from 'react'
import { useParams } from 'next/navigation'

export default function LocationRedirect() {
  const params = useParams()
  const locationId = params.id as string

  useEffect(() => {
    redirectToApp()
  }, [])

  function redirectToApp() {
    const userAgent = navigator.userAgent || navigator.vendor
    const isIOS = /iPad|iPhone|iPod/.test(userAgent)
    const isAndroid = /android/i.test(userAgent)

    // Deep link URL
    const appUrl = `historynearby://location/${locationId}`
    
    // Try to open app
    window.location.href = appUrl

    // Fallback to store after 2 seconds
    setTimeout(() => {
      if (isIOS) {
        window.location.href = 'https://apps.apple.com/app/history-nearby/idXXXXXXXXX'
      } else if (isAndroid) {
        window.location.href = 'https://play.google.com/store/apps/details?id=com.historynearby.app'
      } else {
        // Desktop - redirect to home
        window.location.href = '/'
      }
    }, 2000)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
        <div className="mb-6">
          <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-10 h-10 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Opening in History Nearby
          </h1>
          <p className="text-gray-600">
            Redirecting you to the app...
          </p>
        </div>

        <div className="space-y-3">
          <p className="text-sm text-gray-500">
            Don&apos;t have the app yet?
          </p>
          
          <div className="flex gap-3 justify-center">
            <a
              href="https://apps.apple.com/app/history-nearby/idXXXXXXXXX"
              className="flex-1 inline-flex items-center justify-center px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors text-sm font-medium"
            >
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
              </svg>
              App Store
            </a>

            <a
              href="https://play.google.com/store/apps/details?id=com.historynearby.app"
              className="flex-1 inline-flex items-center justify-center px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors text-sm font-medium"
            >
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                <path d="M3,20.5V3.5C3,2.91 3.34,2.39 3.84,2.15L13.69,12L3.84,21.85C3.34,21.6 3,21.09 3,20.5M16.81,15.12L6.05,21.34L14.54,12.85L16.81,15.12M20.16,10.81C20.5,11.08 20.75,11.5 20.75,12C20.75,12.5 20.5,12.92 20.16,13.19L17.89,14.5L15.39,12L17.89,9.5L20.16,10.81M6.05,2.66L16.81,8.88L14.54,11.15L6.05,2.66Z"/>
              </svg>
              Play Store
            </a>
          </div>
        </div>

        <div className="mt-6 pt-6 border-t border-gray-200">
          <p className="text-xs text-gray-500">
            Having trouble? <a href="mailto:support@historynearbyapp.com" className="text-blue-600 hover:text-blue-700">Contact Support</a>
          </p>
        </div>
      </div>
    </div>
  )
}
