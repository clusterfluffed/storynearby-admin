import Link from 'next/link'
import Image from 'next/image'
import { MapPin, Users, Smartphone, Clock, CheckCircle, ArrowRight } from 'lucide-react'

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center">
              <Image 
                src="/logo.png" 
                alt="StoryNearby" 
                width={200} 
                height={50}
                priority
                className="h-8 w-auto"
              />
            </Link>

            {/* Auth Buttons */}
            <div className="flex items-center space-x-3">
              <Link 
                href="/auth/signin" 
                className="px-4 py-2 text-gray-700 hover:text-gray-900 font-medium transition-colors"
              >
                Sign In
              </Link>
              <Link 
                href="/auth/register" 
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold shadow-sm"
              >
                Get Started Free
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <main>
        {/* Hero Section */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
              Share Your Local History<br />with the Community
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 mb-8 leading-relaxed">
              StoryNearby helps historical societies and heritage organizations bring their stories to life on mobile devices. 
              Create interactive tours, manage locations, and connect your community with local history.
            </p>
            
            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link 
                href="/auth/register"
                className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-4 bg-blue-600 text-white text-lg font-semibold rounded-lg hover:bg-blue-700 transition-colors shadow-lg hover:shadow-xl"
              >
                Start Free Trial
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
              <Link 
                href="/auth/signin"
                className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-4 bg-white text-gray-700 text-lg font-semibold rounded-lg hover:bg-gray-50 transition-colors border-2 border-gray-200"
              >
                Sign In
              </Link>
            </div>

            {/* Trust Badge */}
            <p className="mt-6 text-sm text-gray-500">
              ✨ 14-day free trial • Cancel anytime if you don't love it
            </p>
          </div>
        </section>

        {/* Features Section */}
        <section className="bg-white py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                Everything You Need to Tell Your Story
              </h2>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                Powerful tools designed specifically for historical societies and heritage organizations
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {/* Feature 1 */}
              <div className="bg-gradient-to-br from-blue-50 to-white rounded-xl shadow-md p-8 hover:shadow-lg transition-shadow border border-blue-100">
                <div className="bg-blue-600 w-14 h-14 rounded-lg flex items-center justify-center mb-4">
                  <MapPin className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-2xl font-semibold text-gray-900 mb-3">Manage Locations</h3>
                <p className="text-gray-600 leading-relaxed">
                  Add historical sites, landmarks, and points of interest with photos, descriptions, and operating hours. 
                  Interactive maps make it easy for visitors to explore.
                </p>
              </div>

              {/* Feature 2 */}
              <div className="bg-gradient-to-br from-green-50 to-white rounded-xl shadow-md p-8 hover:shadow-lg transition-shadow border border-green-100">
                <div className="bg-green-600 w-14 h-14 rounded-lg flex items-center justify-center mb-4">
                  <Smartphone className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-2xl font-semibold text-gray-900 mb-3">Mobile-Friendly</h3>
                <p className="text-gray-600 leading-relaxed">
                  Your content automatically appears in our mobile app, making it easy for community members to 
                  discover and visit historical sites on-the-go.
                </p>
              </div>

              {/* Feature 3 */}
              <div className="bg-gradient-to-br from-purple-50 to-white rounded-xl shadow-md p-8 hover:shadow-lg transition-shadow border border-purple-100">
                <div className="bg-purple-600 w-14 h-14 rounded-lg flex items-center justify-center mb-4">
                  <Users className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-2xl font-semibold text-gray-900 mb-3">Team Collaboration</h3>
                <p className="text-gray-600 leading-relaxed">
                  Invite team members, manage permissions, and work together to curate your organization's 
                  historical content and stories.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section className="py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                Get Started in Minutes
              </h2>
              <p className="text-xl text-gray-600">
                Simple setup process to share your historical content
              </p>
            </div>

            <div className="grid md:grid-cols-4 gap-8">
              {/* Step 1 */}
              <div className="text-center">
                <div className="bg-blue-600 text-white w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4">
                  1
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Create Account</h3>
                <p className="text-gray-600">
                  Sign up with your organization details in under 2 minutes
                </p>
              </div>

              {/* Step 2 */}
              <div className="text-center">
                <div className="bg-blue-600 text-white w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4">
                  2
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Add Locations</h3>
                <p className="text-gray-600">
                  Upload photos and stories of your historical sites
                </p>
              </div>

              {/* Step 3 */}
              <div className="text-center">
                <div className="bg-blue-600 text-white w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4">
                  3
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Activate</h3>
                <p className="text-gray-600">
                  Choose your plan to make content visible in the mobile app
                </p>
              </div>

              {/* Step 4 */}
              <div className="text-center">
                <div className="bg-blue-600 text-white w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4">
                  4
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Share</h3>
                <p className="text-gray-600">
                  Community members discover your stories on their phones
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Benefits Section */}
        <section className="bg-gradient-to-br from-blue-600 to-blue-700 text-white py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Built for Historical Societies
              </h2>
              <p className="text-xl text-blue-100">
                We understand your unique needs
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
              <div className="flex items-start space-x-3">
                <CheckCircle className="h-6 w-6 text-blue-200 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-semibold text-lg mb-1">Easy Content Management</h3>
                  <p className="text-blue-100">No technical skills required - if you can use email, you can use StoryNearby</p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <CheckCircle className="h-6 w-6 text-blue-200 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-semibold text-lg mb-1">Museum Hours</h3>
                  <p className="text-blue-100">Display operating hours and special closures automatically</p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <CheckCircle className="h-6 w-6 text-blue-200 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-semibold text-lg mb-1">Rich Media Support</h3>
                  <p className="text-blue-100">Upload multiple photos per location to showcase your sites</p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <CheckCircle className="h-6 w-6 text-blue-200 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-semibold text-lg mb-1">Interactive Maps</h3>
                  <p className="text-blue-100">Visitors can easily find and navigate to your historical locations</p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <CheckCircle className="h-6 w-6 text-blue-200 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-semibold text-lg mb-1">Affordable Pricing</h3>
                  <p className="text-blue-100">Designed for historical societies with limited budgets</p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <CheckCircle className="h-6 w-6 text-blue-200 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-semibold text-lg mb-1">Email Support</h3>
                  <p className="text-blue-100">Friendly support team ready to help when you need it</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Final CTA Section */}
        <section className="py-20">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-4xl font-bold text-gray-900 mb-6">
              Ready to Share Your Stories?
            </h2>
            <p className="text-xl text-gray-600 mb-8">
              Join historical societies across the country using StoryNearby to preserve and share local history
            </p>
            <Link 
              href="/auth/register"
              className="inline-flex items-center justify-center px-10 py-4 bg-blue-600 text-white text-lg font-semibold rounded-lg hover:bg-blue-700 transition-colors shadow-lg hover:shadow-xl"
            >
              Create Free Account
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
            <p className="mt-4 text-sm text-gray-500">
              Already have an account?{' '}
              <Link href="/auth/signin" className="text-blue-600 hover:text-blue-700 font-medium">
                Sign in here
              </Link>
            </p>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-8">
            {/* Company Info */}
            <div>
              <Link href="/" className="inline-block mb-4">
                <Image 
                  src="/logo.png" 
                  alt="StoryNearby" 
                  width={150} 
                  height={38}
                  className="h-6 w-auto"
                  style={{ filter: 'brightness(0) invert(1)' }}
                />
              </Link>
              <p className="text-gray-400">
                Helping historical societies share local history with their communities.
              </p>
            </div>

            {/* Quick Links */}
            <div>
              <h3 className="text-white font-semibold mb-4">Quick Links</h3>
              <ul className="space-y-2">
                <li><Link href="/auth/signin" className="hover:text-white transition-colors">Sign In</Link></li>
                <li><Link href="/auth/register" className="hover:text-white transition-colors">Register</Link></li>
                <li><Link href="/dashboard/support" className="hover:text-white transition-colors">Support</Link></li>
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h3 className="text-white font-semibold mb-4">Contact</h3>
              <p className="text-gray-400">
                Questions? We're here to help.<br />
                <a href="mailto:support@storynearby.com" className="hover:text-white transition-colors">
                  support@storynearby.com
                </a>
              </p>
            </div>
          </div>

          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400 text-sm">
            <p>&copy; {new Date().getFullYear()} StoryNearby. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
