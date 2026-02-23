import React, { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { supabase } from '../config/supabaseClient'
import { api, API_ENDPOINTS } from '../services/apiService'

const Register = () => {
  const navigate = useNavigate()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    if (password !== confirmPassword) {
      setError("Passwords do not match")
      setLoading(false)
      return
    }

    try {
      // Try to register with backend API first
      const response = await api.post(API_ENDPOINTS.REGISTER, {
        email,
        password,
      })
      
      const data = await response.json()
      
      // Store auth token if provided
      if (data.token) {
        localStorage.setItem('authToken', data.token)
        localStorage.setItem('user', JSON.stringify(data.user))
      }
      
      navigate('/')
    } catch (apiError) {
      console.error('API registration failed, trying Supabase:', apiError)
      
      // Fallback to Supabase authentication
      const { error } = await supabase.auth.signUp({
        email,
        password,
      })

      if (error) {
        setError(error.message)
      } else {
        navigate('/')
      }
    }

    setLoading(false)
  }

  return (
    <div className="w-full max-w-6xl bg-gradient-to-br from-slate-200 to-slate-300 flex items-center justify-center px-4">
      <div className="w-full max-w-6xl bg-white rounded-3xl shadow-xl overflow-hidden">
        
        {/* Header */}
        <div className="flex justify-between items-center px-10 py-5 border-b">
          <h1 className="text-xl font-semibold">
            {/* <span className="text-orange-400">Libra</span> */}
            <span className="text-gray-800">Library</span>
          </h1>
          <Link
            to="/login"
            className="bg-green-900 text-white px-5 py-2 rounded-md text-sm font-medium hover:bg-green-800"
          >
            Sign In
          </Link>
        </div>

        {/* Body */}
        <div className="grid grid-cols-1 md:grid-cols-2 bg-[#f5f2e6] p-12">
          
          {/* Form */}
          <div>
            <h2 className="text-3xl font-semibold mb-6 text-gray-900">
              Register
            </h2>

            {error && (
              <div className="mb-4 bg-red-100 text-red-700 px-4 py-2 rounded">
                {error}
              </div>
            )}

            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Email
                </label>
                <input
                  type="email"
                  className="w-full px-4 py-3 rounded-md border focus:outline-none focus:ring-2 focus:ring-green-900"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Password
                </label>
                <input
                  type="password"
                  className="w-full px-4 py-3 rounded-md border focus:outline-none focus:ring-2 focus:ring-green-900"
                  placeholder="Create a password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Confirm Password
                </label>
                <input
                  type="password"
                  className="w-full px-4 py-3 rounded-md border focus:outline-none focus:ring-2 focus:ring-green-900"
                  placeholder="Confirm your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>

              <button 
                type="submit"
                disabled={loading}
                className="w-full bg-green-900 text-white py-3 rounded-md font-medium hover:bg-green-800 transition disabled:opacity-50"
              >
                {loading ? 'Creating Account...' : 'Create Account'}
              </button>

              <p className="text-sm text-gray-600">
                Already have an account?{" "}
                <Link to="/login" className="text-green-900 font-medium">
                  Log in
                </Link>
              </p>
            </form>
          </div>

          {/* Illustration */}
          <div className="hidden md:flex items-center justify-center">
            <img
              src="/images/login-illustration.png"
              alt="Books Illustration"
              className="max-w-sm"
            />
          </div>
        </div>
      </div>
    </div>
  )
}

export default Register