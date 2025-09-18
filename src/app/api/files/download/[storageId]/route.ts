import { ConvexHttpClient } from 'convex/browser'
import { type NextRequest, NextResponse } from 'next/server'
import { api } from '../../../../../../convex/_generated/api'
import type { Id } from '../../../../../../convex/_generated/dataModel'

// Validate required environment variables
const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL
if (!convexUrl) {
  throw new Error('NEXT_PUBLIC_CONVEX_URL environment variable is required')
}

const convex = new ConvexHttpClient(convexUrl)

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ storageId: string }> }
) {
  try {
    const { storageId: storageIdParam } = await params
    const storageId = storageIdParam as Id<'_storage'>

    // Get the file URL from Convex
    const fileUrl = await convex.query(api.files.getUrl, { storageId })

    if (!fileUrl) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 })
    }

    // Fetch the file content
    const response = await fetch(fileUrl)

    if (!response.ok) {
      return NextResponse.json({ error: 'Failed to fetch file' }, { status: 500 })
    }

    const blob = await response.blob()

    // Return the file content with appropriate headers
    return new NextResponse(blob, {
      status: 200,
      headers: {
        'Content-Type': response.headers.get('content-type') || 'application/octet-stream',
        'Content-Length': blob.size.toString(),
      },
    })
  } catch (error) {
    console.error('File download error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
