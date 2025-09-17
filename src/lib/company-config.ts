import yaml from 'js-yaml'
import fs from 'fs'
import path from 'path'

export interface CompanyConfig {
  company: {
    name: string
    tagline: string
    website: string
    logo: {
      text: string
      image?: string
    }
    contact: {
      email: string
      phone: string
      address: {
        street: string
        city: string
        state: string
        zip: string
        country: string
      }
    }
    social: {
      linkedin?: string
      twitter?: string
      github?: string
      facebook?: string
      instagram?: string
    }
    careers: {
      hero: {
        title: string
        subtitle: string
        description: string
      }
      stats: Array<{
        label: string
        value: string
      }>
      culture: {
        title: string
        subtitle: string
        values: Array<{
          icon: string
          title: string
          description: string
        }>
      }
      cta: {
        title: string
        description: string
        buttonText: string
      }
    }
    application: {
      requireCoverLetter: boolean
      requireLinkedIn: boolean
      requireGitHub: boolean
      requirePortfolio: boolean
      maxResumeSize: number
      allowedResumeFormats: string[]
    }
    emailTemplates: {
      applicationReceived: {
        subject: string
        sender: string
      }
    }
    theme: {
      primaryColor: string
      secondaryColor: string
      darkMode: boolean
    }
  }
}

let cachedConfig: CompanyConfig | null = null

export function getCompanyConfig(): CompanyConfig {
  if (cachedConfig) {
    return cachedConfig
  }

  try {
    // Try to load custom config first
    const configPath = path.join(process.cwd(), 'config', 'company.yaml')

    if (fs.existsSync(configPath)) {
      const fileContents = fs.readFileSync(configPath, 'utf8')
      cachedConfig = yaml.load(fileContents) as CompanyConfig
      return cachedConfig
    }
  } catch (error) {
    console.warn('Failed to load company.yaml, using defaults', error)
  }

  // Return default configuration if custom config not found
  const defaultConfig: CompanyConfig = {
    company: {
      name: 'ATS Platform',
      tagline: 'Modern Applicant Tracking System',
      website: 'https://example.com',
      logo: {
        text: 'ATS',
      },
      contact: {
        email: 'careers@example.com',
        phone: '+1 (555) 123-4567',
        address: {
          street: '123 Main St',
          city: 'San Francisco',
          state: 'CA',
          zip: '94105',
          country: 'USA',
        },
      },
      social: {
        linkedin: '',
        twitter: '',
        github: '',
      },
      careers: {
        hero: {
          title: 'Join Our Team',
          subtitle: 'Help us build the future',
          description: "We're looking for passionate individuals who want to make a difference.",
        },
        stats: [
          { label: 'Team Members', value: '50+' },
          { label: 'Open Positions', value: '15+' },
          { label: 'Glassdoor Rating', value: '4.8' },
          { label: 'Remote Friendly', value: '100%' },
        ],
        culture: {
          title: 'Why Work With Us',
          subtitle: 'We offer more than just a job - we offer a career',
          values: [
            {
              icon: 'Users',
              title: 'Great Team',
              description: 'Work with talented and passionate people who love what they do',
            },
            {
              icon: 'TrendingUp',
              title: 'Growth',
              description: 'Continuous learning opportunities and career development',
            },
            {
              icon: 'Heart',
              title: 'Benefits',
              description: 'Competitive salary, health insurance, and flexible work arrangements',
            },
            {
              icon: 'Building2',
              title: 'Remote First',
              description: 'Work from anywhere with flexible hours and async communication',
            },
          ],
        },
        cta: {
          title: "Don't see the right position?",
          description: "We're always looking for talented people. Send us your resume and we'll keep you in mind for future opportunities.",
          buttonText: 'Send Your Resume',
        },
      },
      application: {
        requireCoverLetter: false,
        requireLinkedIn: false,
        requireGitHub: false,
        requirePortfolio: false,
        maxResumeSize: 5242880,
        allowedResumeFormats: ['.pdf', '.doc', '.docx'],
      },
      emailTemplates: {
        applicationReceived: {
          subject: 'Thank you for applying to {{jobTitle}}',
          sender: 'Hiring Team',
        },
      },
      theme: {
        primaryColor: '#3B82F6',
        secondaryColor: '#8B5CF6',
        darkMode: true,
      },
    },
  }

  cachedConfig = defaultConfig
  return defaultConfig
}

// Client-side config loader (for use in React components)
export async function loadCompanyConfig(): Promise<CompanyConfig> {
  try {
    const response = await fetch('/api/config')
    if (response.ok) {
      return await response.json()
    }
  } catch (error) {
    console.warn('Failed to load company config from API', error)
  }

  // Return default config for client-side
  return getCompanyConfig()
}