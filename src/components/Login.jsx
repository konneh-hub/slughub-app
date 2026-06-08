import { useState } from 'react'
import './Login.css'

const apiBase = import.meta.env.VITE_API_BASE || '/api'

function Login() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const response = await fetch(`${apiBase}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: username, password }),
      })

      if (!response.ok) {
        const body = await response.json()
        throw new Error(body.error || 'Login failed')
      }

      const responseBody = await response.json()
      localStorage.setItem('slughub_access_token', responseBody.accessToken)
      localStorage.setItem('slughub_refresh_token', responseBody.refreshToken)
      setUsername('')
      setPassword('')
      setError(null)
      window.location.reload()
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-container">
      <h1 className="slughub-brand">SLUGHub</h1>
      <form className="login-form" onSubmit={handleSubmit}>
        <h2 className="login-title">System Login</h2>
        <div className="login-field">
          <label htmlFor="username">Username</label>
          <input
            id="username"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Enter your username"
          />
        </div>
        <div className="login-field">
          <label htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter your password"
          />
        </div>
        {error && <div className="login-error">{error}</div>}
        <button type="submit" className="login-btn" disabled={loading}>
          {loading ? 'Signing in...' : 'Sign In'}
        </button>
      </form>
    </div>
  )
}

export default Login
