'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

// Professional SVG Icons
const BotIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
  </svg>
)

const LogoutIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
  </svg>
)

const HomeIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
  </svg>
)

const BackIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
  </svg>
)

interface HeaderProps {
  title: string
  subtitle?: string
  showBackButton?: boolean
  backButtonText?: string
  backButtonHref?: string
  onBackClick?: () => void
  showHomeButton?: boolean
  showLogoutButton?: boolean
  children?: React.ReactNode
}

export default function Header({
  title,
  subtitle,
  showBackButton = false,
  backButtonText = "Back",
  backButtonHref,
  onBackClick,
  showHomeButton = false,
  showLogoutButton = true,
  children
}: HeaderProps) {
  const { user, logout } = useAuth()
  const router = useRouter()

  const handleBackClick = () => {
    if (onBackClick) {
      onBackClick()
    } else if (backButtonHref) {
      router.push(backButtonHref)
    } else {
      router.back()
    }
  }

  return (
    <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200/50 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-6">
          {/* Left side - Title and navigation */}
          <div className="flex items-center space-x-4">
            {showBackButton && (
              <button
                onClick={handleBackClick}
                className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 shadow-sm hover:shadow-md"
              >
                <BackIcon />
                <span className="ml-2">{backButtonText}</span>
              </button>
            )}
            
            {showHomeButton && (
              <Link
                href="/"
                className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 shadow-sm hover:shadow-md"
              >
                <HomeIcon />
                <span className="ml-2">Home</span>
              </Link>
            )}

            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                {title}
              </h1>
              {subtitle && (
                <p className="text-gray-600 mt-1">
                  {subtitle}
                </p>
              )}
            </div>
          </div>

          {/* Right side - Actions */}
          <div className="flex items-center gap-3">
            {children}
            
            {showLogoutButton && (
              <button
                onClick={logout}
                className="inline-flex items-center px-6 py-3 border border-gray-300 text-sm font-semibold rounded-xl text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-all duration-200 shadow-md hover:shadow-lg"
              >
                <LogoutIcon />
                <span className="ml-2">Logout</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// Specialized header for landing page (no logout button)
export function LandingHeader() {
  return (
    <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-6">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
              <BotIcon />
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Aura Bot
              </h1>
            </div>
          </div>
          
          <div className="flex gap-3">
            <Link
              href="/login"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              Sign In
            </Link>
            <Link
              href="/signup"
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 shadow-md hover:shadow-lg"
            >
              Create Account
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
