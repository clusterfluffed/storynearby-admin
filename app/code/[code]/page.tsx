'use client'

import { useEffect } from 'react'
import { useParams } from 'next/navigation'

export default function CodeRedirect() {
  const params = useParams()
  const code = params.code as string

  useEffect(() => {
    redirectToApp()
  }, [])

  function redirectToApp() {
    const userAgent = navigator.userAgent || navigator.vendor
    const isIOS = /iPad|iPhone|iPod/.test(userAgent)
    const isAndroid = /android/i.test(userAgent)

    // Deep link with code
    const appUrl = `historynearby://code/${code}`
    
    window.location.href = appUrl

    setTimeout(() => {
      if (isIOS) {
        window.location.href = 'https://apps.apple.com/app/history-nearby/idXXXXXXXXX'
      } else if (isAndroid) {
        window.location.href = 'https://play.google.com/store/apps/details?id=com.historynearby.app'
      } else {
        window.location.href = '/'
      }
    }, 2000)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          Opening Location
        </h1>
        <div className="text-6xl font-bold text-blue-600 mb-4 tracking-widest">
          {code}
        </div>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p className="text-gray-600 mt-4">Redirecting to app...</p>
      </div>
    </div>
  )
}
