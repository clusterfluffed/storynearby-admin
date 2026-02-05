'use client'

import Link from 'next/link'
import Image from 'next/image'
import { FileText, ArrowLeft } from 'lucide-react'

export default function TermsOfServicePage() {
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
            <FileText className="h-8 w-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900">Terms of Service</h1>
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
              These Terms of Service ("Terms") govern your access to and use of History Nearby's website and mobile application (the "Service"). By using the Service, you agree to be bound by these Terms. If you do not agree to these Terms, do not use the Service.
            </p>
          </section>

          {/* Eligibility */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Eligibility</h2>
            <p className="text-gray-700">
              You must be at least 18 years old to create an account and use the Service. By using the Service, you represent that you are at least 18 years old and have the legal capacity to enter into these Terms.
            </p>
          </section>

          {/* Account Registration */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">2. Account Registration</h2>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li>You must provide accurate, complete information when creating an account</li>
              <li>You are responsible for maintaining the security of your account credentials</li>
              <li>You are responsible for all activities that occur under your account</li>
              <li>Notify us immediately of any unauthorized use of your account</li>
              <li>We reserve the right to suspend or terminate accounts that violate these Terms</li>
            </ul>
          </section>

          {/* Subscriptions and Billing */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">3. Subscriptions and Billing</h2>
            
            <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-4">3.1 Subscription Plans</h3>
            <p className="text-gray-700">
              History Nearby offers subscription-based access to publish historical locations on the mobile app. Subscription fees and features are available on our website and subject to change with notice.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-4">3.2 Free Trial</h3>
            <p className="text-gray-700">
              We may offer a 14-day free trial for new subscribers. Your subscription will automatically renew after the trial unless you cancel before the trial ends.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-4">3.3 Billing</h3>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li>Subscriptions are billed on a recurring basis (monthly or annually)</li>
              <li>Payment is processed through Stripe</li>
              <li>You authorize us to charge your payment method for all fees</li>
              <li>All fees are non-refundable except as required by law</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-4">3.4 Cancellation</h3>
            <p className="text-gray-700">
              You may cancel your subscription at any time. Cancellation takes effect at the end of the current billing period. You will not receive a refund for unused time.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-4">3.5 Inactive Subscriptions</h3>
            <p className="text-gray-700">
              If your subscription becomes inactive, your historical locations will be hidden from the mobile app but not deleted. You may reactivate your subscription to restore visibility.
            </p>
          </section>

          {/* User Content */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">4. User Content</h2>
            
            <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-4">4.1 Your Content</h3>
            <p className="text-gray-700 mb-3">
              You may create and publish historical location information ("User Content"). You retain ownership of your User Content, but grant us a license to use, display, and distribute it through the Service.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-4">4.2 Content Standards</h3>
            <p className="text-gray-700 mb-3">All User Content must:</p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li>Be accurate and factually correct to the best of your knowledge</li>
              <li>Not infringe on third-party intellectual property rights</li>
              <li>Not contain offensive, defamatory, or obscene material</li>
              <li>Comply with all applicable laws and regulations</li>
              <li>Be relevant to historical locations and educational in nature</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-4">4.3 Content Removal</h3>
            <p className="text-gray-700">
              We reserve the right to remove any User Content that violates these Terms or that we determine is inappropriate or harmful.
            </p>
          </section>

          {/* AI-Assisted Features */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">5. AI-Assisted Content Generation</h2>
            
            <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-4">5.1 AI Assist Feature</h3>
            <p className="text-gray-700">
              We offer an optional AI-powered feature to help generate historical location descriptions and data. This feature is subject to daily usage limits (20 requests per day per user).
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-4">5.2 Accuracy Disclaimer</h3>
            <p className="text-gray-700">
              AI-generated content may contain inaccuracies or errors. You are responsible for reviewing, verifying, and editing all AI-generated content before publishing. We make no warranties regarding the accuracy of AI-generated content.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-4">5.3 User Responsibility</h3>
            <p className="text-gray-700">
              By using AI-generated content, you accept full responsibility for its accuracy. You agree to fact-check all AI-generated information before making it public.
            </p>
          </section>

          {/* Prohibited Conduct */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Prohibited Conduct</h2>
            <p className="text-gray-700 mb-3">You agree not to:</p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li>Use the Service for any illegal purpose</li>
              <li>Impersonate any person or entity</li>
              <li>Interfere with or disrupt the Service</li>
              <li>Attempt unauthorized access to any part of the Service</li>
              <li>Upload viruses, malware, or malicious code</li>
              <li>Harass, abuse, or harm other users</li>
              <li>Scrape or copy content using automated means</li>
              <li>Engage in fraudulent or deceptive practices</li>
            </ul>
          </section>

          {/* Intellectual Property */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Intellectual Property</h2>
            <p className="text-gray-700 mb-3">
              The Service, including all content, features, and functionality (excluding User Content), is owned by History Nearby and protected by copyright, trademark, and other intellectual property laws.
            </p>
            <p className="text-gray-700">
              You may not copy, modify, distribute, sell, or reverse engineer any part of the Service without our written permission.
            </p>
          </section>

          {/* Third-Party Services */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Third-Party Services</h2>
            <p className="text-gray-700">
              The Service integrates with third-party services (Google Maps, Stripe, etc.). Your use of these services is subject to their respective terms. We are not responsible for third-party services or their content.
            </p>
          </section>

          {/* Disclaimers */}
          <section className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">9. Disclaimers</h2>
            <p className="text-gray-700 font-semibold mb-3">
              THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND.
            </p>
            <p className="text-gray-700">
              We disclaim all warranties, including but not limited to warranties of merchantability, fitness for a particular purpose, and non-infringement. We do not warrant that the Service will be uninterrupted, secure, or error-free.
            </p>
          </section>

          {/* Limitation of Liability */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">10. Limitation of Liability</h2>
            <p className="text-gray-700 mb-3">
              TO THE MAXIMUM EXTENT PERMITTED BY LAW, HISTORY NEARBY SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES ARISING FROM YOUR USE OF THE SERVICE.
            </p>
            <p className="text-gray-700">
              Our total liability shall not exceed the amount you paid us in the twelve (12) months preceding the claim, or $100, whichever is greater.
            </p>
          </section>

          {/* Indemnification */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">11. Indemnification</h2>
            <p className="text-gray-700">
              You agree to indemnify and hold harmless History Nearby from any claims, damages, losses, and expenses (including attorneys' fees) arising from your use of the Service, your User Content, or your violation of these Terms.
            </p>
          </section>

          {/* Dispute Resolution */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">12. Dispute Resolution</h2>
            <p className="text-gray-700 mb-3">
              If you have a dispute with us, you agree to first contact us at support@historynearby.com to attempt informal resolution.
            </p>
            <p className="text-gray-700">
              Any unresolved disputes will be resolved through binding arbitration rather than in court, except where prohibited by law.
            </p>
          </section>

          {/* Changes to Terms */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">13. Changes to These Terms</h2>
            <p className="text-gray-700">
              We may modify these Terms at any time. We will notify you of material changes by posting the updated Terms and updating the "Last Updated" date. Your continued use of the Service constitutes acceptance of the revised Terms.
            </p>
          </section>

          {/* Contact Information */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">14. Contact Us</h2>
            <p className="text-gray-700 mb-2">
              If you have questions about these Terms, please contact us:
            </p>
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-2">
              <p className="text-gray-700"><strong>Email:</strong> <a href="mailto:support@historynearby.com" className="text-blue-600 hover:text-blue-800">support@historynearby.com</a></p>
              <p className="text-gray-700"><strong>Mail:</strong> History Nearby, Attn: Terms and Conditions</p>
            </div>
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
