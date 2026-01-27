import Link from 'next/link'
import { Map, MapPin, Users, Settings } from 'lucide-react'

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Map className="h-8 w-8 text-primary-600" />
              <span className="ml-2 text-xl font-bold text-gray-900">StoryNearby Admin</span>
            </div>
            <div className="flex items-center space-x-4">
              <Link 
                href="/auth/signin" 
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Sign In
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Historical Society Content Management
          </h1>
          <p className="text-xl text-gray-600">
            Manage locations, media, and content for your county historical society app
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mt-12">
          <div className="bg-white rounded-lg shadow-md p-6 border-2 border-transparent hover:border-blue-500 transition-all">
            <MapPin className="h-12 w-12 text-blue-600 mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Locations</h3>
            <p className="text-gray-600">
              Add and manage historical sites, landmarks, and points of interest
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 border-2 border-transparent hover:border-blue-500 transition-all">
            <Users className="h-12 w-12 text-blue-600 mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Counties</h3>
            <p className="text-gray-600">
              Manage county organizations and their content
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 border-2 border-transparent hover:border-blue-500 transition-all">
            <Settings className="h-12 w-12 text-blue-600 mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Settings</h3>
            <p className="text-gray-600">
              Configure app settings, branding, and permissions
            </p>
          </div>
        </div>

        <div className="mt-16 bg-white rounded-lg shadow-md p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Getting Started</h2>
          <ol className="list-decimal list-inside space-y-3 text-gray-700">
            <li>Sign in with your admin credentials (or sign up for a new account)</li>
            <li>Set up your county tenant organization</li>
            <li>Add historical locations with photos and descriptions</li>
            <li>Upload audio tour content</li>
            <li>Review and publish content to the mobile app</li>
          </ol>
          <div className="mt-6">
            <Link 
              href="/auth/signin"
              className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Get Started →
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
}
