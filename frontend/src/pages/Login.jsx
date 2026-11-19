import { useState } from 'react'
import { Link } from 'react-router-dom'
import AuthCard from '../components/AuthCard.jsx'
import FormField from '../components/FormField.jsx'
import { useAuth } from '../auth/useAuth.js'

export default function Login() {
  const { login } = useAuth()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    const result = login(username, password)
    if (!result.ok) setError(result.error)
  }

  return (
    <AuthCard
      title="Welcome Back"
      error={error}
      footer={
        <>
          Don&apos;t have an account?{' '}
          <Link to="/register" className="font-semibold text-indigo-400 transition-colors hover:text-indigo-300 hover:underline">
            Sign Up
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit}>
        <FormField
          label="Username"
          id="username"
          type="text"
          placeholder="Username"
          autoComplete="username"
          required
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
        <FormField
          label="Password"
          id="password"
          type="password"
          placeholder="Password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <div className="pt-2">
          <button
            type="submit"
            className="w-full rounded-xl bg-indigo-500 py-3 text-sm font-semibold text-white shadow-md shadow-indigo-950/50 transition-all duration-150 hover:bg-indigo-400 focus:ring-4 focus:ring-indigo-400/25 focus:outline-none active:scale-[0.99]"
          >
            Log In
          </button>
        </div>
      </form>
    </AuthCard>
  )
}