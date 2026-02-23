import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../config/supabaseClient'
import { api, API_ENDPOINTS } from '../services/apiService'

const Login: React.FC = () => {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      // Try to login with backend API first
      const response = await api.post(API_ENDPOINTS.LOGIN, {
        email,
        password,
      })
      
      const data = await response.json()
      
      // Store auth token
      if (data.token) {
        localStorage.setItem('authToken', data.token)
        localStorage.setItem('user', JSON.stringify(data.user))
      }
      
      navigate('/')
    } catch (apiError) {
      console.error('API login failed, trying Supabase:', apiError)
      
      // Fallback to Supabase authentication
      const { error } = await supabase.auth.signInWithPassword({
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
    <div className="w-full max-w-5xl bg-[#F5F1E6] rounded-3xl shadow-2xl flex overflow-hidden">

      {/* LEFT */}
      <div className="w-full md:w-1/2 p-12">
        <div className="flex justify-between items-center mb-10">
          <h1 className="text-xl font-semibold">
            <span className="text-orange-500">Library</span>
          </h1>
          <Link
            to="/register"
            className="px-4 py-2 bg-[#2F3E2E] text-white rounded-md text-sm"
          >
            Sign Up
          </Link>
        </div>

        <h2 className="text-3xl font-semibold mb-8">Log in</h2>

        {error && (
          <div className="mb-4 bg-red-100 text-red-700 px-4 py-2 rounded">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="text-sm">Username or Email</label>
            <input
              type="email"
              required
              className="w-full mt-1 px-4 py-3 rounded-md border"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div>
            <label className="text-sm">Password</label>
            <input
              type="password"
              required
              className="w-full mt-1 px-4 py-3 rounded-md border"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#2F3E2E] text-white py-3 rounded-md"
          >
            {loading ? 'Logging in...' : 'Log In'}
          </button>

          <div className="text-center text-sm mt-2">
            <Link to="/forgot-password">Forgot Password?</Link>
          </div>
        </form>
      </div>

      {/* RIGHT */}
      <div className="hidden md:flex w-1/2 items-center justify-center">
        <img
          src="/images/login-books.png"
          alt="Books"
          className="max-w-sm"
        />
      </div>
    </div>
  )
}

export default Login