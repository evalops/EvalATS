import { NextRequest, NextResponse } from 'next/server'
import { ConvexHttpClient } from 'convex/browser'
import { api } from '../../../../../../convex/_generated/api'
import { Id } from '../../../../../../convex/_generated/dataModel'

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!)

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ storageId: string }> }
) {
  try {
    const { storageId: storageIdParam } = await params
    const storageId = storageIdParam as Id<"_storage">

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