'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Image from 'next/image'
import Link from 'next/link'
import { CheckCircle, XCircle, Loader2 } from 'lucide-react'

export default function AuthCallbackPage() {
  const router = useRouter()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('')

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Get the hash fragment from URL (Supabase uses hash-based routing for tokens)
        const hashParams = new URLSearchParams(window.location.hash.substring(1))
        const accessToken = hashParams.get('access_token')
        const refreshToken = hashParams.get('refresh_token')
        const type = hashParams.get('type')
        const error = hashParams.get('error')
        const errorDescription = hashParams.get('error_description')

        console.log('Auth callback type:', type)
        console.log('Has access token:', !!accessToken)

        // Check for errors from Supabase
        if (error) {
          console.error('Auth error:', error, errorDescription)
          setStatus('error')
          setMessage(errorDescription || 'An error occurred during authentication')
          return
        }

        // Handle different callback types
        if (type === 'signup' || type === 'email') {
          // Email verification
          if (accessToken && refreshToken) {
            const { error: sessionError } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            })

            if (sessionError) {
              console.error('Session error:', sessionError)
              setStatus('error')
              setMessage('Failed to verify email. Please try again.')
              return
            }

            setStatus('success')
            setMessage('Email verified successfully! Redirecting to dashboard...')
            
            // Redirect to dashboard after 2 seconds
            setTimeout(() => {
              router.push('/dashboard/locations')
            }, 2000)
          } else {
            setStatus('error')
            setMessage('Invalid verification link. Please request a new one.')
          }
        } else if (type === 'recovery') {
          // Password reset
          if (accessToken && refreshToken) {
            const { error: sessionError } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            })

            if (sessionError) {
              console.error('Session error:', sessionError)
              setStatus('error')
              setMessage('Invalid reset link. Please request a new one.')
              return
            }

            setStatus('success')
            setMessage('Verification successful! Redirecting to set new password...')
            
            // Redirect to password reset page after 2 seconds
            setTimeout(() => {
              router.push('/auth/reset-password')
            }, 2000)
          } else {
            setStatus('error')
            setMessage('Invalid reset link. Please request a new one.')
          }
        } else {
          // Unknown type or just checking session
          const { data: { session } } = await supabase.auth.getSession()
          
          if (session) {
            setStatus('success')
            setMessage('Already signed in! Redirecting...')
            setTimeout(() => {
              router.push('/dashboard/locations')
            }, 2000)
          } else {
            setStatus('error')
            setMessage('No valid session found. Please sign in.')
          }
        }
      } catch (err) {
        console.error('Callback error:', err)
        setStatus('error')
        setMessage('An unexpected error occurred. Please try again.')
      }
    }

    handleCallback()
  }, [router])

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-xl border border-gray-100 text-center">
        <Link href="/" className="inline-block mb-6">
          <Image 
            src="/logo.png" 
            alt="History Nearby" 
            width={200} 
            height={50}
            className="h-10 w-auto mx-auto"
          />
        </Link>

        {status === 'loading' && (
          <>
            <Loader2 className="h-16 w-16 text-blue-600 mx-auto mb-4 animate-spin" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Verifying...</h2>
            <p className="text-gray-600">Please wait while we verify your email.</p>
          </>
        )}

        {status === 'success' && (
          <>
            <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Success!</h2>
            <p className="text-gray-600">{message}</p>
          </>
        )}

        {status === 'error' && (
          <>
            <XCircle className="h-16 w-16 text-red-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Verification Failed</h2>
            <p className="text-gray-600 mb-6">{message}</p>
            
            <div className="space-y-3">
              <Link
                href="/auth/signin"
                className="block w-full py-3 px-4 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
              >
                Go to Sign In
              </Link>
              <Link
                href="/auth/register"
                className="block w-full py-3 px-4 bg-gray-200 text-gray-700 font-semibold rounded-lg hover:bg-gray-300 transition-colors"
              >
                Create New Account
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
