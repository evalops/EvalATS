import { NextResponse } from 'next/server'
import { getCompanyConfig } from '@/lib/company-config'

export async function GET() {
  try {
    const config = getCompanyConfig()
    return NextResponse.json(config)
  } catch (error) {
    console.error('Error loading company config:', error)
    return NextResponse.json({ error: 'Failed to load configuration' }, { status: 500 })
  }
}
