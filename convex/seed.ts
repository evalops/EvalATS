import { mutation } from './_generated/server'

export const clearData = mutation({
  args: {},
  handler: async (ctx) => {
    // Get all documents from each table and delete them
    const [candidates, jobs, interviews, timeline, assessments, notes, applications] =
      await Promise.all([
        ctx.db.query('candidates').collect(),
        ctx.db.query('jobs').collect(),
        ctx.db.query('interviews').collect(),
        ctx.db.query('timeline').collect(),
        ctx.db.query('assessments').collect(),
        ctx.db.query('notes').collect(),
        ctx.db.query('applications').collect(),
      ])

    // Delete all documents
    await Promise.all([
      ...candidates.map((doc) => ctx.db.delete(doc._id)),
      ...jobs.map((doc) => ctx.db.delete(doc._id)),
      ...interviews.map((doc) => ctx.db.delete(doc._id)),
      ...timeline.map((doc) => ctx.db.delete(doc._id)),
      ...assessments.map((doc) => ctx.db.delete(doc._id)),
      ...notes.map((doc) => ctx.db.delete(doc._id)),
      ...applications.map((doc) => ctx.db.delete(doc._id)),
    ])

    return 'All data cleared successfully'
  },
})

export const seedData = mutation({
  args: {},
  handler: async (ctx) => {
    // Check if data already exists
    const existingCandidates = await ctx.db.query('candidates').take(1)
    if (existingCandidates.length > 0) {
      return 'Data already seeded'
    }

    // Seed jobs
    const jobs = [
      {
        title: 'Senior Frontend Engineer',
        department: 'Engineering',
        location: 'San Francisco, CA',
        type: 'full-time' as const,
        description: "We're looking for an experienced frontend engineer...",
        requirements: ['5+ years React', 'TypeScript', 'System design'],
        postedDate: '2024-01-10',
        status: 'active' as const,
        urgency: 'high' as const,
        salaryMin: 150000,
        salaryMax: 200000,
      },
      {
        title: 'Product Designer',
        department: 'Design',
        location: 'Remote',
        type: 'full-time' as const,
        description: 'Join our design team to create beautiful experiences...',
        requirements: ['Figma expertise', 'Design systems', 'User research'],
        postedDate: '2024-01-08',
        status: 'active' as const,
        urgency: 'medium' as const,
        salaryMin: 120000,
        salaryMax: 160000,
      },
      {
        title: 'Data Scientist',
        department: 'Data',
        location: 'New York, NY',
        type: 'full-time' as const,
        description: 'Help us make data-driven decisions...',
        requirements: ['Python', 'ML/AI', 'SQL', 'Statistics'],
        postedDate: '2024-01-05',
        status: 'active' as const,
        urgency: 'low' as const,
        salaryMin: 130000,
        salaryMax: 180000,
      },
    ]

    const jobIds = await Promise.all(jobs.map((job) => ctx.db.insert('jobs', job)))

    // Seed candidates
    const candidates = [
      {
        name: 'Sarah Chen',
        email: 'sarah.chen@email.com',
        phone: '+1 (415) 555-0123',
        location: 'San Francisco, CA',
        linkedin: 'linkedin.com/in/sarahchen',
        github: 'github.com/sarahchen',
        portfolio: 'sarahchen.dev',
        position: 'Senior Frontend Engineer',
        appliedDate: '2024-01-15',
        status: 'interview' as const,
        experience: '7 years',
        currentCompany: 'TechCorp Inc.',
        education: 'BS Computer Science, Stanford University',
        skills: ['React', 'TypeScript', 'Node.js', 'GraphQL', 'AWS'],
        evaluation: {
          overall: 92,
          technical: 95,
          cultural: 88,
          communication: 91,
        },
      },
      {
        name: 'Michael Rodriguez',
        email: 'michael.r@email.com',
        phone: '+1 (212) 555-0456',
        location: 'Remote',
        position: 'Product Designer',
        appliedDate: '2024-01-12',
        status: 'screening' as const,
        experience: '5 years',
        currentCompany: 'DesignStudio',
        education: 'BFA Design, Parsons',
        skills: ['Figma', 'UI/UX', 'Prototyping', 'Design Systems'],
        evaluation: {
          overall: 88,
          technical: 85,
          cultural: 92,
          communication: 89,
        },
      },
      {
        name: 'Emily Johnson',
        email: 'emily.j@email.com',
        phone: '+1 (917) 555-0789',
        location: 'New York, NY',
        position: 'Data Scientist',
        appliedDate: '2024-01-10',
        status: 'offer' as const,
        experience: '4 years',
        currentCompany: 'DataCorp',
        education: 'MS Data Science, NYU',
        skills: ['Python', 'Machine Learning', 'SQL', 'TensorFlow'],
        evaluation: {
          overall: 95,
          technical: 98,
          cultural: 91,
          communication: 94,
        },
      },
    ]

    const candidateIds = await Promise.all(
      candidates.map((candidate) => ctx.db.insert('candidates', candidate))
    )

    // Create applications linking candidates to jobs
    await Promise.all([
      ctx.db.insert('applications', {
        candidateId: candidateIds[0],
        jobId: jobIds[0],
        appliedDate: '2024-01-15',
        status: 'approved',
      }),
      ctx.db.insert('applications', {
        candidateId: candidateIds[1],
        jobId: jobIds[1],
        appliedDate: '2024-01-12',
        status: 'reviewing',
      }),
      ctx.db.insert('applications', {
        candidateId: candidateIds[2],
        jobId: jobIds[2],
        appliedDate: '2024-01-10',
        status: 'approved',
      }),
    ])

    // Add timeline events for first candidate
    await Promise.all([
      ctx.db.insert('timeline', {
        candidateId: candidateIds[0],
        date: '2024-01-15',
        type: 'applied',
        title: 'Application Received',
        description: 'Applied for Senior Frontend Engineer',
        status: 'completed',
      }),
      ctx.db.insert('timeline', {
        candidateId: candidateIds[0],
        date: '2024-01-16',
        type: 'screening',
        title: 'Initial Screening',
        description: 'Passed automated resume screening',
        status: 'completed',
        score: 88,
      }),
      ctx.db.insert('timeline', {
        candidateId: candidateIds[0],
        date: '2024-01-18',
        type: 'interview',
        title: 'Phone Screen',
        description: 'Initial phone interview',
        status: 'completed',
        interviewer: 'Jonathan Haas',
        duration: '30 min',
        feedback: 'Strong technical background, excellent communication',
        rating: 4.5,
      }),
    ])

    // Add assessments
    await Promise.all([
      ctx.db.insert('assessments', {
        candidateId: candidateIds[0],
        name: 'React Assessment',
        score: 95,
        maxScore: 100,
        completedDate: '2024-01-17',
      }),
      ctx.db.insert('assessments', {
        candidateId: candidateIds[0],
        name: 'System Design',
        score: 88,
        maxScore: 100,
        completedDate: '2024-01-19',
      }),
    ])

    // Add notes
    await ctx.db.insert('notes', {
      candidateId: candidateIds[0],
      author: 'Jennifer Smith',
      role: 'Recruiter',
      date: '2024-01-18',
      content:
        'Strong candidate with excellent technical skills. Previous experience at FAANG companies.',
    })

    // Add interviews
    await Promise.all([
      ctx.db.insert('interviews', {
        candidateId: candidateIds[0],
        jobId: jobIds[0],
        type: 'Technical Interview',
        date: '2024-01-25',
        time: '10:00 AM',
        duration: '90 min',
        interviewers: ['Alice Johnson', 'Bob Wilson'],
        location: 'Zoom',
        status: 'scheduled',
      }),
      ctx.db.insert('interviews', {
        candidateId: candidateIds[1],
        jobId: jobIds[1],
        type: 'Portfolio Review',
        date: '2024-01-26',
        time: '2:00 PM',
        duration: '60 min',
        interviewers: ['Emma Davis'],
        location: 'Office',
        status: 'scheduled',
      }),
    ])

    return 'Data seeded successfully!'
  },
})
