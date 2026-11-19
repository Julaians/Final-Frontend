import { useState } from 'react'
import { Link } from 'react-router-dom'
import AuthCard from '../components/AuthCard.jsx'
import FormField from '../components/FormField.jsx'
import { useAuth } from '../auth/useAuth.js'

export default function Register() {
  const { register } = useAuth()
  const [form, setForm] = useState({ username: '', email: '', password: '' })
  const [error, setError] = useState('')

  const update = (field) => (e) => setForm({ ...form, [field]: e.target.value })

  const handleSubmit = (e) => {
    e.preventDefault()
    const result = register(form)
    if (!result.ok) setError(result.error)
  }

  return (
    <AuthCard
      title="Create Account"
      subtitle="Set up your workspace and start planning in a minute."
      error={error}
      footer={
        <>
          Already have an account?{' '}
          <Link to="/login" className="font-semibold text-indigo-400 transition-colors hover:text-indigo-300 hover:underline">
            Log In
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit}>
        <FormField
          label="Username"
          id="reg-username"
          type="text"
          placeholder="Username"
          autoComplete="username"
          required
          value={form.username}
          onChange={update('username')}
        />
        <FormField
          label="Email Address (for Task Notifications)"
          id="reg-email"
          type="email"
          placeholder="Email (for task notifications)"
          autoComplete="email"
          required
          value={form.email}
          onChange={update('email')}
        />
        <FormField
          label="Password"
          id="reg-password"
          type="password"
          placeholder="Password"
          autoComplete="new-password"
          required
          value={form.password}
          onChange={update('password')}
        />
        <div className="pt-2">
          <button
            type="submit"
            className="w-full rounded-xl bg-indigo-500 py-3 text-sm font-semibold text-white shadow-md shadow-indigo-950/50 transition-all duration-150 hover:bg-indigo-400 focus:ring-4 focus:ring-indigo-400/25 focus:outline-none active:scale-[0.99]"
          >
            Sign Up
          </button>
        </div>
      </form>
    </AuthCard>
  )
}