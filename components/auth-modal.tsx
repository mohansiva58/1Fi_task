"use client"

import { useState, useEffect } from "react"
import { X, Mail } from "lucide-react"
import { useAuth } from "@/hooks/use-auth"

interface AuthModalProps {
  isOpen: boolean
  onClose: () => void
  defaultMode?: "login" | "register"
}

export default function AuthModal({ isOpen, onClose, defaultMode = "login" }: AuthModalProps) {
  const [mode, setMode] = useState<"login" | "register">(defaultMode)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [name, setName] = useState("")
  const [acceptUpdates, setAcceptUpdates] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const { loginWithEmail, registerWithEmail, loginWithGoogle } = useAuth()

  useEffect(() => {
    if (isOpen) {
      setMode(defaultMode)
      setError("")
    }
  }, [isOpen, defaultMode])

  // Close on ESC key
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    if (isOpen) window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [isOpen, onClose])

  if (!isOpen) return null

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      if (mode === "register") {
        await registerWithEmail(email, password, name)
      } else {
        await loginWithEmail(email, password)
      }
      onClose()
    } catch (err: any) {
      setError(err.message || "Authentication failed")
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleAuth = async () => {
    setError("")
    setLoading(true)
    try {
      await loginWithGoogle()
      onClose()
    } catch (err: any) {
      setError(err.message || "Google sign-in failed")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg shadow-2xl w-full max-w-md relative overflow-hidden animate-in fade-in zoom-in duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 bg-white border border-gray-200 rounded-full shadow-sm transition-colors z-10 flex items-center gap-1"
          title="Close"
          aria-label="Close authentication modal"
        >
          <X className="w-5 h-5" />
          <span className="sr-only">Close</span>
        </button>

        {/* Header */}
        <div className="bg-black text-white p-8 pb-12 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-wide">
            EMI PLATFORM
          </h2>
          <p className="text-sm text-gray-300 mt-2">
            {mode === "register" ? "Create your account" : "Sign in to continue"}
          </p>
        </div>

        {/* Content */}
        <div className="p-6 sm:p-8 -mt-6 bg-white rounded-t-3xl relative">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* Email and password form */}
            <form onSubmit={handleEmailAuth} className="space-y-4">
              {mode === "register" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter your name"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                    required
                    disabled={loading}
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                  required
                  disabled={loading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                  required
                  minLength={6}
                  disabled={loading}
                />
              </div>

              <button
                type="submit"
                className="w-full bg-black text-white py-3 rounded-lg font-medium hover:bg-gray-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={loading}
              >
                {loading ? "Processing..." : mode === "register" ? "Create Account" : "Sign In"}
              </button>
            </form>

          <button onClick={handleGoogleAuth} disabled={loading} className="mt-4 w-full border-2 border-gray-300 py-3 font-medium transition-colors hover:bg-gray-50 disabled:opacity-50">
            Continue with Google
          </button>

          {/* Updates Checkbox */}
          <div className="mt-6 flex items-start gap-2">
            <input
              type="checkbox"
              id="updates"
              checked={acceptUpdates}
              onChange={(e) => setAcceptUpdates(e.target.checked)}
              className="mt-1 w-4 h-4 border-gray-300 rounded focus:ring-black"
              disabled={loading}
            />
            <label htmlFor="updates" className="text-xs text-gray-600">
              Keep me updated on the latest trends, offers and much more!
            </label>
          </div>

          {/* Toggle Mode */}
          <div className="mt-6 text-center text-sm">
            {mode === "register" ? (
              <p className="text-gray-600">
                Already have an account?{" "}
                <button
                  onClick={() => setMode("login")}
                  className="text-black font-semibold hover:underline"
                  disabled={loading}
                >
                  Sign In
                </button>
              </p>
            ) : mode === "login" ? (
              <p className="text-gray-600">
                Don't have an account?{" "}
                <button
                  onClick={() => setMode("register")}
                  className="text-black font-semibold hover:underline"
                  disabled={loading}
                >
                  Create Account
                </button>
              </p>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  )
}
