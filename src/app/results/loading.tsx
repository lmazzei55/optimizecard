'use client'
export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-900 via-purple-900 to-gray-900">
      <div className="text-center text-white space-y-4">
        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-purple-400 mx-auto"></div>
        <h2 className="text-xl font-semibold">Preparing your personalized recommendations…</h2>
      </div>
    </div>
  )
} 