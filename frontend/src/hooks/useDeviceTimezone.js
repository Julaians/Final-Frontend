import { useEffect, useState } from 'react'
import { getDeviceTimezone } from '../utils/dates.js'

export function useDeviceTimezone() {
  const [tz, setTz] = useState(getDeviceTimezone)

  useEffect(() => {
    const check = () => setTz(getDeviceTimezone())
    const id = setInterval(check, 60000)
    window.addEventListener('focus', check)
    document.addEventListener('visibilitychange', check)
    return () => {
      clearInterval(id)
      window.removeEventListener('focus', check)
      document.removeEventListener('visibilitychange', check)
    }
  }, [])

  return tz
}