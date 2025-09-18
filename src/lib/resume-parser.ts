import OpenAI from 'openai'

export interface ParsedResume {
  personalInfo: {
    firstName: string
    lastName: string
    email: string
    phone: string
    location: string
    linkedin?: string
    github?: string
    portfolio?: string
  }
  summary: string
  experience: Array<{
    company: string
    title: string
    startDate: string
    endDate: string
    description: string
    highlights: string[]
  }>
  education: Array<{
    institution: string
    degree: string
    field: string
    startDate: string
    endDate: string
    gpa?: string
  }>
  skills: {
    technical: string[]
    soft: string[]
    languages: string[]
    certifications: string[]
  }
  projects?: Array<{
    name: string
    description: string
    technologies: string[]
    url?: string
  }>
  achievements: string[]
  keywords: string[]
  yearsOfExperience: number
  currentRole?: string
  currentCompany?: string
}

const RESUME_PARSING_PROMPT = `
You are an expert resume parser. Extract structured information from the provided resume text.
Return the data in the exact JSON format specified below. Be thorough and accurate.

JSON Structure:
{
  "personalInfo": {
    "firstName": "string",
    "lastName": "string",
    "email": "string",
    "phone": "string",
    "location": "string",
    "linkedin": "string or null",
    "github": "string or null",
    "portfolio": "string or null"
  },
  "summary": "string - professional summary if available",
  "experience": [
    {
      "company": "string",
      "title": "string",
      "startDate": "string - format YYYY-MM",
      "endDate": "string - format YYYY-MM or 'Present'",
      "description": "string",
      "highlights": ["array of key achievements"]
    }
  ],
  "education": [
    {
      "institution": "string",
      "degree": "string",
      "field": "string",
      "startDate": "string",
      "endDate": "string",
      "gpa": "string or null"
    }
  ],
  "skills": {
    "technical": ["array of technical skills"],
    "soft": ["array of soft skills"],
    "languages": ["array of programming/spoken languages"],
    "certifications": ["array of certifications"]
  },
  "projects": [
    {
      "name": "string",
      "description": "string",
      "technologies": ["array of technologies used"],
      "url": "string or null"
    }
  ],
  "achievements": ["array of notable achievements"],
  "keywords": ["array of important keywords for ATS matching"],
  "yearsOfExperience": "number - calculate from work history",
  "currentRole": "string or null",
  "currentCompany": "string or null"
}

Important instructions:
- Extract all dates in YYYY-MM format when possible
- Calculate total years of experience from work history
- Identify the current role and company if still employed
- Extract all technical skills, tools, and technologies mentioned
- Identify both technical and soft skills
- Extract any GitHub, LinkedIn, or portfolio URLs
- Include relevant keywords for ATS matching
- If a field is not found, use null or empty array as appropriate
`

class ResumeParser {
  private openai: OpenAI | null = null

  constructor(apiKey?: string) {
    if (apiKey) {
      this.openai = new OpenAI({
        apiKey,
        dangerouslyAllowBrowser: false, // This should only be used server-side
      })
    }
  }

  async parseResume(resumeText: string): Promise<ParsedResume> {
    // If no OpenAI key, use basic parsing
    if (!this.openai) {
      return this.basicParse(resumeText)
    }

    try {
      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: RESUME_PARSING_PROMPT,
          },
          {
            role: 'user',
            content: `Parse this resume:\n\n${resumeText}`,
          },
        ],
        temperature: 0.1,
        response_format: { type: 'json_object' },
      })

      const result = completion.choices[0]?.message?.content
      if (!result) {
        throw new Error('No response from OpenAI')
      }

      return JSON.parse(result) as ParsedResume
    } catch (error) {
      console.error('AI parsing failed, falling back to basic parser:', error)
      return this.basicParse(resumeText)
    }
  }

  private basicParse(text: string): ParsedResume {
    // Basic regex-based parsing as fallback
    const lines = text
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line)

    // Extract email
    const emailMatch = text.match(/[\w.-]+@[\w.-]+\.\w+/)
    const email = emailMatch ? emailMatch[0] : ''

    // Extract phone
    const phoneMatch = text.match(/[\d()-.\s]+\d{4}/)
    const phone = phoneMatch ? phoneMatch[0].trim() : ''

    // Extract LinkedIn
    const linkedinMatch = text.match(/linkedin\.com\/in\/[\w-]+/)
    const linkedin = linkedinMatch ? `https://${linkedinMatch[0]}` : undefined

    // Extract GitHub
    const githubMatch = text.match(/github\.com\/[\w-]+/)
    const github = githubMatch ? `https://${githubMatch[0]}` : undefined

    // Extract name (usually first non-empty line)
    const potentialName = lines[0] || ''
    const nameParts = potentialName.split(/\s+/)
    const firstName = nameParts[0] || ''
    const lastName = nameParts.slice(1).join(' ') || ''

    // Extract skills (look for common programming languages and tools)
    const skillPatterns = [
      'JavaScript',
      'TypeScript',
      'Python',
      'Java',
      'C\\+\\+',
      'React',
      'Node\\.js',
      'AWS',
      'Docker',
      'Kubernetes',
      'SQL',
      'MongoDB',
      'Git',
      'CI/CD',
      'Machine Learning',
      'Data Science',
      'DevOps',
      'Agile',
      'Scrum',
    ]
    const skills: string[] = []
    skillPatterns.forEach((pattern) => {
      if (new RegExp(pattern, 'i').test(text)) {
        skills.push(pattern.replace('\\', ''))
      }
    })

    // Extract experience years (look for patterns like "5+ years")
    const yearsMatch = text.match(/(\d+)\+?\s*years?\s*(of\s*)?experience/i)
    const yearsOfExperience = yearsMatch ? parseInt(yearsMatch[1]) : 0

    return {
      personalInfo: {
        firstName,
        lastName,
        email,
        phone,
        location: '',
        linkedin,
        github,
      },
      summary: '',
      experience: [],
      education: [],
      skills: {
        technical: skills,
        soft: [],
        languages: [],
        certifications: [],
      },
      achievements: [],
      keywords: skills,
      yearsOfExperience,
      currentRole: undefined,
      currentCompany: undefined,
    }
  }

  // Extract text from different file formats
  async extractTextFromFile(file: File): Promise<string> {
    const fileType = file.type
    const fileName = file.name.toLowerCase()

    if (fileType === 'text/plain' || fileName.endsWith('.txt')) {
      return await file.text()
    }

    if (fileType === 'application/pdf' || fileName.endsWith('.pdf')) {
      // This would need to be handled server-side with pdf-parse
      // For now, we'll return a placeholder
      throw new Error('PDF parsing must be done server-side')
    }

    // For Word documents, we'd need additional libraries
    if (fileName.endsWith('.doc') || fileName.endsWith('.docx')) {
      throw new Error('Word document parsing not yet implemented')
    }

    throw new Error(`Unsupported file type: ${file.type}`)
  }
}

export default ResumeParser

// Utility function to score how well a resume matches a job
export function calculateMatchScore(resume: ParsedResume, jobRequirements: string[]): number {
  const resumeText = JSON.stringify(resume).toLowerCase()
  let matches = 0
  const totalRequirements = jobRequirements.length

  jobRequirements.forEach((requirement) => {
    if (resumeText.includes(requirement.toLowerCase())) {
      matches++
    }
  })

  return Math.round((matches / totalRequirements) * 100)
}
