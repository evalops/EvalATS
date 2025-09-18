import fs from 'fs'
import yaml from 'js-yaml'
import merge from 'lodash/merge'
import path from 'path'
import { z } from 'zod'

const logoSchema = z.object({
  text: z.string(),
  image: z.string().optional(),
})

const addressSchema = z.object({
  street: z.string(),
  city: z.string(),
  state: z.string(),
  zip: z.string(),
  country: z.string(),
})

const contactSchema = z.object({
  email: z.string(),
  phone: z.string(),
  address: addressSchema,
})

const socialSchema = z.object({
  linkedin: z.string().optional(),
  twitter: z.string().optional(),
  github: z.string().optional(),
  facebook: z.string().optional(),
  instagram: z.string().optional(),
})

const heroSchema = z.object({
  title: z.string(),
  subtitle: z.string(),
  description: z.string(),
})

const statsSchema = z.array(
  z.object({
    label: z.string(),
    value: z.string(),
  })
)

const cultureValuesSchema = z.array(
  z.object({
    icon: z.string(),
    title: z.string(),
    description: z.string(),
  })
)

const cultureSchema = z.object({
  title: z.string(),
  subtitle: z.string(),
  values: cultureValuesSchema,
})

const ctaSchema = z.object({
  title: z.string(),
  description: z.string(),
  buttonText: z.string(),
})

const careersSchema = z.object({
  hero: heroSchema,
  stats: statsSchema,
  culture: cultureSchema,
  cta: ctaSchema,
})

const applicationSchema = z.object({
  requireCoverLetter: z.boolean(),
  requireLinkedIn: z.boolean(),
  requireGitHub: z.boolean(),
  requirePortfolio: z.boolean(),
  maxResumeSize: z.number().nonnegative(),
  allowedResumeFormats: z.array(z.string()),
})

const emailTemplateSchema = z.object({
  subject: z.string(),
  sender: z.string(),
})

const emailTemplatesSchema = z.object({
  applicationReceived: emailTemplateSchema,
})

const themeSchema = z.object({
  primaryColor: z.string(),
  secondaryColor: z.string(),
  darkMode: z.boolean(),
})

const companySchema = z.object({
  name: z.string(),
  tagline: z.string(),
  website: z.string(),
  logo: logoSchema,
  contact: contactSchema,
  social: socialSchema,
  careers: careersSchema,
  application: applicationSchema,
  emailTemplates: emailTemplatesSchema,
  theme: themeSchema,
})

const companyConfigSchema = z.object({
  company: companySchema,
})

export type CompanyConfig = z.infer<typeof companyConfigSchema>

const partialCompanyConfigSchema = companyConfigSchema.deepPartial()

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
        description:
          "We're always looking for talented people. Send us your resume and we'll keep you in mind for future opportunities.",
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

let cachedConfig: CompanyConfig | null = null

export function getCompanyConfig(): CompanyConfig {
  if (cachedConfig) {
    return cachedConfig
  }

  try {
    // Try to load custom config first
    const configPath = resolveConfigPath()

    if (configPath && fs.existsSync(configPath)) {
      const fileContents = fs.readFileSync(configPath, 'utf8')
      const parsedYaml = yaml.load(fileContents)
      const partialConfig = partialCompanyConfigSchema.parse(parsedYaml)
      const mergedConfig = merge({}, defaultConfig, partialConfig)
      cachedConfig = companyConfigSchema.parse(mergedConfig)
      return cachedConfig
    }
  } catch (error) {
    console.warn('Failed to load company.yaml, using defaults', error)
  }

  // Return default configuration if custom config not found
  cachedConfig = defaultConfig
  return defaultConfig
}

function resolveConfigPath(): string | null {
  const customPath = process.env.COMPANY_CONFIG_PATH
  if (customPath && customPath.trim().length > 0) {
    const normalizedPath = path.isAbsolute(customPath)
      ? customPath
      : path.join(process.cwd(), customPath)
    return normalizedPath
  }

  return path.join(process.cwd(), 'config', 'company.yaml')
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
