import { useEffect, useState } from 'react'
import { type CompanyConfig, loadCompanyConfig } from '@/lib/company-config'

export function useCompanyConfig() {
  const [config, setConfig] = useState<CompanyConfig | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true

    loadCompanyConfig()
      .then((data) => {
        if (mounted) {
          setConfig(data)
          setLoading(false)
        }
      })
      .catch((err) => {
        if (mounted) {
          console.error('Failed to load company config:', err)
          setError('Failed to load configuration')
          setLoading(false)
        }
      })

    return () => {
      mounted = false
    }
  }, [])

  return { config, loading, error }
}
