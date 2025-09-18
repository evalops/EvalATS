import { NextRequest, NextResponse } from 'next/server'
import ResumeParser from '@/lib/resume-parser'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    // Check file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'File size exceeds 5MB limit' },
        { status: 400 }
      )
    }

    let resumeText = ''

    // Extract text based on file type
    const fileName = file.name.toLowerCase()

    if (fileName.endsWith('.txt')) {
      resumeText = await file.text()
    } else if (fileName.endsWith('.pdf')) {
      try {
        // Use require() for server-side pdf-parse to avoid webpack bundling issues
        const pdf = require('pdf-parse')
        const buffer = await file.arrayBuffer()
        const data = await pdf(Buffer.from(buffer))
        resumeText = data.text
      } catch (error) {
        console.error('PDF parsing error:', error)
        return NextResponse.json(
          { error: 'Failed to parse PDF file. Please try a text file instead.' },
          { status: 500 }
        )
      }
    } else if (fileName.endsWith('.doc') || fileName.endsWith('.docx')) {
      // For Word documents, we'd need additional processing
      // For now, return an error
      return NextResponse.json(
        { error: 'Word documents are not yet supported. Please upload a PDF or text file.' },
        { status: 400 }
      )
    } else {
      return NextResponse.json(
        { error: 'Unsupported file type. Please upload a PDF or text file.' },
        { status: 400 }
      )
    }

    // Parse the resume
    const parser = new ResumeParser(process.env.OPENAI_API_KEY)
    const parsedResume = await parser.parseResume(resumeText)

    return NextResponse.json({
      success: true,
      data: parsedResume,
      rawText: resumeText.substring(0, 500) + '...' // Include preview of raw text
    })
  } catch (error) {
    console.error('Resume parsing error:', error)
    return NextResponse.json(
      { error: 'Failed to parse resume', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

// Helper endpoint to check if OpenAI is configured
export async function GET() {
  const hasOpenAI = !!process.env.OPENAI_API_KEY
  return NextResponse.json({
    aiEnabled: hasOpenAI,
    message: hasOpenAI
      ? 'AI resume parsing is enabled'
      : 'AI parsing not configured. Using basic parser. Add OPENAI_API_KEY to enable AI parsing.'
  })
}