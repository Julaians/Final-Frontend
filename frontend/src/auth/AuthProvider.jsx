import { useState } from 'react'
import { AuthContext } from './authContext.js'

const USERS_KEY = 'planit_users'
const SESSION_KEY = 'planit_session'
const DEFAULT_EMAIL = 'test@example.com'

function readJSON(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem(key)) ?? fallback
  } catch {
    return fallback
  }
}

export default function AuthProvider({ children }) {
  const [user, setUser] = useState(() => readJSON(SESSION_KEY, null))

  const startSession = (u) => {
    const session = { id: u.id, username: u.username, email: u.email || DEFAULT_EMAIL }
    localStorage.setItem(SESSION_KEY, JSON.stringify(session))
    setUser(session)
  }

  const login = (username, password) => {
    const users = readJSON(USERS_KEY, [])
    const match = users.find(
      (u) => u.username === username.trim() && u.password === password.trim(),
    )
    if (!match) return { ok: false, error: 'Invalid username or password.' }
    startSession(match)
    return { ok: true }
  }

  const register = ({ username, email, password }) => {
    const users = readJSON(USERS_KEY, [])
    const name = username.trim()

    if (users.some((u) => u.username === name)) {
      return { ok: false, error: 'Username already exists.' }
    }

    const newUser = {
      id: 'user_' + Date.now(),
      username: name,
      email: email.trim() || DEFAULT_EMAIL,
      password: password.trim(),
    }
    localStorage.setItem(USERS_KEY, JSON.stringify([...users, newUser]))
    startSession(newUser)
    return { ok: true }
  }

  const logout = () => {
    localStorage.removeItem(SESSION_KEY)
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}