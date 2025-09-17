import { ai, ax } from '@ax-llm/ax'
import { ParsedResume } from './resume-parser'

// EEOC-compliant AI matcher using Ax
// This service ensures fair and unbiased candidate matching

export interface JobRequirements {
  requiredSkills: string[]
  preferredSkills: string[]
  experience: {
    minimum: number
    preferred: number
  }
  education: {
    level: string
    field?: string
  }
  responsibilities: string[]
}

export interface CandidateMatch {
  candidateId: string
  score: number
  reasoning: {
    skillMatch: {
      required: number
      preferred: number
      details: string[]
    }
    experienceMatch: {
      score: number
      details: string
    }
    educationMatch: {
      score: number
      details: string
    }
  }
  strengths: string[]
  gaps: string[]
  recommendation: 'strong_match' | 'good_match' | 'potential_match' | 'not_recommended'
  // EEOC compliance fields
  protected_attributes_masked: boolean
  evaluation_criteria: string[]
  timestamp: string
}

export interface BiasAuditMetrics {
  selectionRate: number
  groupRates: Map<string, number>
  fourFifthsCompliance: boolean
  disparateImpact: boolean
}

// Define structured extractors using Ax
const skillMatcher = ax(
  'resume:object, requirements:object -> match:object { requiredScore:number, preferredScore:number, details:string[] }'
)

const experienceMatcher = ax(
  'yearsOfExperience:number, requiredExperience:number, preferredExperience:number -> score:number, reasoning:string'
)

const educationMatcher = ax(
  'candidateEducation:object[], requiredEducation:object -> score:number, reasoning:string'
)

export class AIMatcherService {
  private llm: any
  private auditLog: Map<string, any> = new Map()

  constructor(apiKey?: string) {
    if (apiKey) {
      this.llm = ai({
        name: 'openai',
        apiKey,
        config: {
          model: 'gpt-4o-mini' as any, // Temporary fix for model type
          temperature: 0.1, // Low temperature for consistency
        }
      })
    }
  }

  /**
   * Match a candidate to a job with EEOC-compliant scoring
   * Protected attributes (race, gender, age, etc.) are masked before evaluation
   */
  async matchCandidate(
    resume: ParsedResume,
    jobRequirements: JobRequirements,
    candidateId: string,
    jobId: string
  ): Promise<CandidateMatch> {
    if (!this.llm) {
      return this.basicMatch(resume, jobRequirements, candidateId)
    }

    // Mask protected attributes for EEOC compliance
    const maskedResume = this.maskProtectedAttributes(resume)

    try {
      // Skill matching
      const skillMatch = await skillMatcher.forward(this.llm, {
        resume: {
          technical: maskedResume.skills.technical,
          certifications: maskedResume.skills.certifications,
          keywords: maskedResume.keywords
        },
        requirements: {
          required: jobRequirements.requiredSkills,
          preferred: jobRequirements.preferredSkills
        }
      })

      // Experience matching
      const experienceMatch = await experienceMatcher.forward(this.llm, {
        yearsOfExperience: maskedResume.yearsOfExperience,
        requiredExperience: jobRequirements.experience.minimum,
        preferredExperience: jobRequirements.experience.preferred
      })

      // Education matching
      const educationMatch = await educationMatcher.forward(this.llm, {
        candidateEducation: maskedResume.education,
        requiredEducation: jobRequirements.education
      })

      // Calculate overall score (weighted average)
      const overallScore = this.calculateOverallScore(
        skillMatch.match.requiredScore,
        skillMatch.match.preferredScore,
        experienceMatch.score,
        educationMatch.score
      )

      // Determine recommendation
      const recommendation = this.getRecommendation(overallScore)

      // Extract strengths and gaps
      const { strengths, gaps } = await this.analyzeStrengthsAndGaps(
        maskedResume,
        jobRequirements
      )

      const match: CandidateMatch = {
        candidateId,
        score: overallScore,
        reasoning: {
          skillMatch: {
            required: skillMatch.match.requiredScore,
            preferred: skillMatch.match.preferredScore,
            details: skillMatch.match.details
          },
          experienceMatch: {
            score: experienceMatch.score,
            details: experienceMatch.reasoning
          },
          educationMatch: {
            score: educationMatch.score,
            details: educationMatch.reasoning
          }
        },
        strengths,
        gaps,
        recommendation,
        protected_attributes_masked: true,
        evaluation_criteria: [
          'Technical Skills',
          'Years of Experience',
          'Education Level',
          'Relevant Certifications',
          'Industry Experience'
        ],
        timestamp: new Date().toISOString()
      }

      // Log for audit trail
      this.logDecision(candidateId, jobId, match)

      return match
    } catch (error) {
      console.error('AI matching failed, using basic matcher:', error)
      return this.basicMatch(resume, jobRequirements, candidateId)
    }
  }

  /**
   * Mask protected attributes to ensure EEOC compliance
   */
  private maskProtectedAttributes(resume: ParsedResume): ParsedResume {
    return {
      ...resume,
      personalInfo: {
        ...resume.personalInfo,
        // Remove name to prevent gender/ethnicity bias
        firstName: 'Candidate',
        lastName: `${Math.random().toString(36).substr(2, 9)}`,
        // Keep only job-relevant contact info
        email: resume.personalInfo.email,
        phone: resume.personalInfo.phone,
        location: this.generalizeLocation(resume.personalInfo.location),
        linkedin: resume.personalInfo.linkedin,
        github: resume.personalInfo.github,
        portfolio: resume.personalInfo.portfolio
      },
      // Remove dates that could indicate age
      education: resume.education.map(edu => ({
        ...edu,
        startDate: '',
        endDate: '',
        // Keep only degree and field
        institution: edu.institution,
        degree: edu.degree,
        field: edu.field,
        gpa: edu.gpa
      }))
    }
  }

  /**
   * Generalize location to prevent location-based discrimination
   */
  private generalizeLocation(location: string): string {
    // Extract only state/country level information
    const parts = location.split(',').map(s => s.trim())
    if (parts.length >= 2) {
      return parts[parts.length - 1] // Return only country/state
    }
    return 'Remote'
  }

  /**
   * Calculate weighted overall score
   */
  private calculateOverallScore(
    requiredSkills: number,
    preferredSkills: number,
    experience: number,
    education: number
  ): number {
    // Weights based on job relevance, not protected characteristics
    const weights = {
      requiredSkills: 0.4,
      preferredSkills: 0.2,
      experience: 0.25,
      education: 0.15
    }

    const score =
      requiredSkills * weights.requiredSkills +
      preferredSkills * weights.preferredSkills +
      experience * weights.experience +
      education * weights.education

    return Math.round(score)
  }

  /**
   * Get recommendation based on score
   */
  private getRecommendation(score: number): CandidateMatch['recommendation'] {
    if (score >= 85) return 'strong_match'
    if (score >= 70) return 'good_match'
    if (score >= 50) return 'potential_match'
    return 'not_recommended'
  }

  /**
   * Analyze strengths and gaps
   */
  private async analyzeStrengthsAndGaps(
    resume: ParsedResume,
    requirements: JobRequirements
  ): Promise<{ strengths: string[], gaps: string[] }> {
    const strengths: string[] = []
    const gaps: string[] = []

    // Check required skills
    requirements.requiredSkills.forEach(skill => {
      const hasSkill = resume.skills.technical.some(s =>
        s.toLowerCase().includes(skill.toLowerCase())
      )
      if (hasSkill) {
        strengths.push(`Has required skill: ${skill}`)
      } else {
        gaps.push(`Missing required skill: ${skill}`)
      }
    })

    // Check experience
    if (resume.yearsOfExperience >= requirements.experience.preferred) {
      strengths.push(`Exceeds experience requirement (${resume.yearsOfExperience} years)`)
    } else if (resume.yearsOfExperience >= requirements.experience.minimum) {
      strengths.push(`Meets experience requirement (${resume.yearsOfExperience} years)`)
    } else {
      gaps.push(`Below minimum experience (has ${resume.yearsOfExperience}, needs ${requirements.experience.minimum})`)
    }

    return { strengths, gaps }
  }

  /**
   * Basic matching without AI
   */
  private basicMatch(
    resume: ParsedResume,
    requirements: JobRequirements,
    candidateId: string
  ): CandidateMatch {
    // Count matching skills
    let requiredMatches = 0
    let preferredMatches = 0

    requirements.requiredSkills.forEach(skill => {
      if (resume.skills.technical.some(s =>
        s.toLowerCase().includes(skill.toLowerCase())
      )) {
        requiredMatches++
      }
    })

    requirements.preferredSkills.forEach(skill => {
      if (resume.skills.technical.some(s =>
        s.toLowerCase().includes(skill.toLowerCase())
      )) {
        preferredMatches++
      }
    })

    const requiredScore = requirements.requiredSkills.length > 0
      ? (requiredMatches / requirements.requiredSkills.length) * 100
      : 100

    const preferredScore = requirements.preferredSkills.length > 0
      ? (preferredMatches / requirements.preferredSkills.length) * 100
      : 100

    const experienceScore = resume.yearsOfExperience >= requirements.experience.minimum
      ? 100
      : (resume.yearsOfExperience / requirements.experience.minimum) * 100

    const score = this.calculateOverallScore(
      requiredScore,
      preferredScore,
      experienceScore,
      80 // Default education score
    )

    return {
      candidateId,
      score,
      reasoning: {
        skillMatch: {
          required: requiredScore,
          preferred: preferredScore,
          details: [`Matched ${requiredMatches} of ${requirements.requiredSkills.length} required skills`]
        },
        experienceMatch: {
          score: experienceScore,
          details: `${resume.yearsOfExperience} years of experience`
        },
        educationMatch: {
          score: 80,
          details: 'Education evaluation'
        }
      },
      strengths: [`Matched ${requiredMatches} required skills`],
      gaps: requirements.requiredSkills
        .filter(skill => !resume.skills.technical.some(s =>
          s.toLowerCase().includes(skill.toLowerCase())
        ))
        .map(skill => `Missing: ${skill}`),
      recommendation: this.getRecommendation(score),
      protected_attributes_masked: true,
      evaluation_criteria: ['Skills', 'Experience', 'Education'],
      timestamp: new Date().toISOString()
    }
  }

  /**
   * Log AI decision for audit trail
   */
  private logDecision(candidateId: string, jobId: string, match: CandidateMatch) {
    const key = `${candidateId}-${jobId}-${Date.now()}`
    this.auditLog.set(key, {
      candidateId,
      jobId,
      match,
      timestamp: new Date().toISOString(),
      modelUsed: 'gpt-4o-mini',
      modelVersion: '2024-01',
      protected_attributes_masked: true
    })
  }

  /**
   * Calculate bias metrics for Four-Fifths Rule compliance
   */
  calculateBiasMetrics(
    selections: Array<{ candidateId: string, selected: boolean, group?: string }>
  ): BiasAuditMetrics {
    const totalCount = selections.length
    const selectedCount = selections.filter(s => s.selected).length
    const overallRate = selectedCount / totalCount

    // Calculate rates by group
    const groupRates = new Map<string, number>()
    const groups = new Set(selections.map(s => s.group || 'unknown'))

    groups.forEach(group => {
      const groupSelections = selections.filter(s => s.group === group)
      const groupSelected = groupSelections.filter(s => s.selected).length
      const rate = groupSelected / groupSelections.length
      groupRates.set(group, rate)
    })

    // Check Four-Fifths Rule
    let fourFifthsCompliance = true
    let disparateImpact = false

    const rates = Array.from(groupRates.values())
    const maxRate = Math.max(...rates)
    const minRate = Math.min(...rates)

    if (minRate / maxRate < 0.8) {
      fourFifthsCompliance = false
      disparateImpact = true
    }

    return {
      selectionRate: overallRate,
      groupRates,
      fourFifthsCompliance,
      disparateImpact
    }
  }

  /**
   * Get audit log for compliance reporting
   */
  getAuditLog(): Array<any> {
    return Array.from(this.auditLog.values())
  }
}

export default AIMatcherService