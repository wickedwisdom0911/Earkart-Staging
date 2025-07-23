'use client'

import { useEffect } from 'react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('🔴 Global Error:', {
      message: error.message,
      stack: error.stack,
      digest: error.digest
    })
  }, [error])

  return (
    <html>
      <body>
        <div className="flex min-h-screen items-center justify-center bg-gray-50">
          <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Something went wrong!
              </h2>
              <p className="text-gray-600 mb-6">
                {error.message || 'An unexpected error occurred'}
              </p>
              {error.digest && (
                <p className="text-sm text-gray-500 mb-4">
                  Error ID: {error.digest}
                </p>
              )}
              <button
                onClick={reset}
                className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
              >
                Try again
              </button>
            </div>
          </div>
        </div>
      </body>
    </html>
  )
} 