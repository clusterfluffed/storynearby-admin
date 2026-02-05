'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Shield, ArrowLeft } from 'lucide-react'

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Link href="/" className="inline-block mb-4">
            <Image 
              src="/logo.png" 
              alt="History Nearby" 
              width={200} 
              height={50}
              className="h-10 w-auto"
            />
          </Link>
          <div className="flex items-center space-x-3">
            <Shield className="h-8 w-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900">Privacy Policy</h1>
          </div>
          <p className="mt-2 text-sm text-gray-600">Last Updated: February 5, 2026</p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-lg shadow-sm p-8 space-y-8">
          
          {/* Introduction */}
          <section>
            <p className="text-gray-700 leading-relaxed">
              History Nearby ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our website and mobile application (collectively, the "Service").
            </p>
          </section>

          {/* Information We Collect */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Information We Collect</h2>
            
            <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-4">1.1 Information You Provide</h3>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li><strong>Account Information:</strong> Name, email address, organization name, state</li>
              <li><strong>Location Data:</strong> Historical site information, descriptions, addresses, coordinates, images, and metadata you submit</li>
              <li><strong>Payment Information:</strong> Billing details processed through Stripe (we do not store credit card numbers)</li>
              <li><strong>Communications:</strong> Messages sent through support tickets or contact forms</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-4">1.2 Automatically Collected Information</h3>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li><strong>Usage Data:</strong> Pages visited, features used, time spent on the Service</li>
              <li><strong>Device Information:</strong> IP address, browser type, operating system, device identifiers</li>
              <li><strong>Location Information:</strong> Geographic location from mobile devices (with your permission)</li>
              <li><strong>Cookies and Tracking:</strong> Session cookies, analytics data, and similar technologies</li>
            </ul>
          </section>

          {/* How We Use Your Information */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">2. How We Use Your Information</h2>
            <p className="text-gray-700 mb-3">We use your information to:</p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li>Provide, maintain, and improve the Service</li>
              <li>Create and manage your account</li>
              <li>Process payments and subscriptions</li>
              <li>Display your historical locations to app users</li>
              <li>Send administrative communications and updates</li>
              <li>Respond to support requests and customer service inquiries</li>
              <li>Analyze usage patterns and improve user experience</li>
              <li>Prevent fraud and ensure platform security</li>
              <li>Comply with legal obligations</li>
            </ul>
          </section>

          {/* Information Sharing */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">3. Information Sharing and Disclosure</h2>
            
            <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-4">3.1 Public Information</h3>
            <p className="text-gray-700 mb-3">
              Historical location information you submit (names, descriptions, addresses, coordinates, images) is publicly displayed in our mobile app and may be visible to all users.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-4">3.2 Service Providers</h3>
            <p className="text-gray-700 mb-3">We share information with trusted third-party service providers:</p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li><strong>Supabase:</strong> Database and authentication services</li>
              <li><strong>Stripe:</strong> Payment processing</li>
              <li><strong>Vercel:</strong> Hosting and infrastructure</li>
              <li><strong>Google Maps:</strong> Mapping and geocoding services</li>
              <li><strong>Anthropic (Claude AI):</strong> AI-powered location research and content generation</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-4">3.3 Legal Requirements</h3>
            <p className="text-gray-700">
              We may disclose your information if required by law, court order, or governmental request, or to protect our rights, property, or safety.
            </p>
          </section>

          {/* Data Retention */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Data Retention</h2>
            <p className="text-gray-700">
              We retain your information for as long as your account is active or as needed to provide services. You may request deletion of your account and associated data at any time by contacting us. Historical location data you've contributed may remain publicly accessible unless specifically requested for removal.
            </p>
          </section>

          {/* Data Security */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Data Security</h2>
            <p className="text-gray-700">
              We implement industry-standard security measures to protect your information, including encryption, secure servers, and access controls. However, no method of transmission over the internet is 100% secure, and we cannot guarantee absolute security.
            </p>
          </section>

          {/* Your Rights */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Your Rights and Choices</h2>
            <p className="text-gray-700 mb-3">You have the right to:</p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li><strong>Access:</strong> Request a copy of your personal information</li>
              <li><strong>Correction:</strong> Update or correct inaccurate information</li>
              <li><strong>Deletion:</strong> Request deletion of your account and data</li>
              <li><strong>Opt-Out:</strong> Unsubscribe from marketing communications</li>
              <li><strong>Data Portability:</strong> Request your data in a portable format</li>
              <li><strong>Object:</strong> Object to certain processing of your information</li>
            </ul>
            <p className="text-gray-700 mt-3">
              To exercise these rights, contact us at <a href="mailto:privacy@historynearby.com" className="text-blue-600 hover:text-blue-800">privacy@historynearby.com</a>
            </p>
          </section>

          {/* Children's Privacy */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Children's Privacy</h2>
            <p className="text-gray-700">
              Our Service is not directed to children under 13. We do not knowingly collect personal information from children under 13. If you believe we have collected information from a child under 13, please contact us immediately.
            </p>
          </section>

          {/* International Users */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">8. International Users</h2>
            <p className="text-gray-700">
              Our Service is operated in the United States. If you access the Service from outside the U.S., your information may be transferred to, stored, and processed in the United States. By using the Service, you consent to this transfer.
            </p>
          </section>

          {/* Changes to Privacy Policy */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">9. Changes to This Privacy Policy</h2>
            <p className="text-gray-700">
              We may update this Privacy Policy from time to time. We will notify you of material changes by posting the new Privacy Policy on this page and updating the "Last Updated" date. Continued use of the Service after changes constitutes acceptance of the updated policy.
            </p>
          </section>

          {/* Contact Information */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">10. Contact Us</h2>
            <p className="text-gray-700 mb-2">
              If you have questions about this Privacy Policy, please contact us:
            </p>
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-2">
              <p className="text-gray-700"><strong>Email:</strong> <a href="mailto:privacy@historynearby.com" className="text-blue-600 hover:text-blue-800">privacy@historynearby.com</a></p>
              <p className="text-gray-700"><strong>Mail:</strong> History Nearby, Attn: Privacy Team</p>
            </div>
          </section>

          {/* California Privacy Rights */}
          <section className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">California Privacy Rights (CCPA)</h2>
            <p className="text-gray-700 mb-3">
              If you are a California resident, you have additional rights under the California Consumer Privacy Act (CCPA):
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li>Right to know what personal information is collected</li>
              <li>Right to know if personal information is sold or disclosed</li>
              <li>Right to say no to the sale of personal information</li>
              <li>Right to access your personal information</li>
              <li>Right to equal service and price (no discrimination)</li>
            </ul>
            <p className="text-gray-700 mt-3">
              <strong>Note:</strong> We do not sell personal information.
            </p>
          </section>

        </div>

        {/* Back Button */}
        <div className="mt-8 text-center">
          <Link 
            href="/auth/register"
            className="inline-flex items-center text-blue-600 hover:text-blue-800 font-medium"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Registration
          </Link>
        </div>
      </div>
    </div>
  )
}
