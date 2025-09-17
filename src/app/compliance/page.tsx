'use client'

import { ComplianceDashboard } from '@/components/compliance-dashboard'

// Mock data for demonstration
const mockAuditData = {
  auditId: 'audit-2024-01',
  auditDate: '2024-01-15',
  jobTitle: 'Senior Software Engineer',
  period: {
    start: '2024-01-01',
    end: '2024-01-15'
  },
  metrics: {
    selectionRates: {
      overall: 0.25,
      byGroup: [
        { group: 'Male', category: 'Gender', rate: 0.28, count: 28, total: 100 },
        { group: 'Female', category: 'Gender', rate: 0.22, count: 11, total: 50 },
        { group: 'Non-Binary', category: 'Gender', rate: 0.20, count: 2, total: 10 },
        { group: 'White', category: 'Race', rate: 0.30, count: 30, total: 100 },
        { group: 'Asian', category: 'Race', rate: 0.25, count: 10, total: 40 },
        { group: 'Black', category: 'Race', rate: 0.15, count: 3, total: 20 },
        { group: 'Hispanic', category: 'Race', rate: 0.20, count: 4, total: 20 }
      ]
    },
    impactRatios: [
      { category: 'Gender', group1: 'Female', group2: 'Male', ratio: 0.79, passes_four_fifths: false },
      { category: 'Gender', group1: 'Non-Binary', group2: 'Male', ratio: 0.71, passes_four_fifths: false },
      { category: 'Race', group1: 'Asian', group2: 'White', ratio: 0.83, passes_four_fifths: true },
      { category: 'Race', group1: 'Black', group2: 'White', ratio: 0.50, passes_four_fifths: false },
      { category: 'Race', group1: 'Hispanic', group2: 'White', ratio: 0.67, passes_four_fifths: false }
    ]
  },
  recommendations: [
    'Review job requirements to ensure they are essential and not creating unnecessary barriers',
    'Expand recruitment sources to reach more diverse candidate pools',
    'Implement structured interviews to reduce unconscious bias',
    'Consider blind resume review for initial screening',
    'Provide unconscious bias training to all hiring managers'
  ],
  status: 'under_review' as const
}

const mockAIDecisions = [
  {
    id: '1',
    timestamp: '2024-01-15T10:00:00Z',
    decisionType: 'Resume Screening',
    candidateName: 'Candidate A',
    score: 85,
    humanReview: {
      agreedWithAI: true,
      reviewDate: '2024-01-15T14:00:00Z'
    }
  },
  {
    id: '2',
    timestamp: '2024-01-15T11:00:00Z',
    decisionType: 'Skill Matching',
    candidateName: 'Candidate B',
    score: 72,
    humanReview: {
      agreedWithAI: false,
      reviewDate: '2024-01-15T15:00:00Z'
    }
  },
  {
    id: '3',
    timestamp: '2024-01-15T12:00:00Z',
    decisionType: 'Resume Screening',
    candidateName: 'Candidate C',
    score: 91,
    humanReview: {
      agreedWithAI: true,
      reviewDate: '2024-01-15T16:00:00Z'
    }
  },
  {
    id: '4',
    timestamp: '2024-01-16T09:00:00Z',
    decisionType: 'Ranking',
    candidateName: 'Candidate D',
    score: 68,
    humanReview: undefined
  },
  {
    id: '5',
    timestamp: '2024-01-16T10:00:00Z',
    decisionType: 'Skill Matching',
    candidateName: 'Candidate E',
    score: 88,
    humanReview: undefined
  }
]

export default function CompliancePage() {
  return (
    <div className="container mx-auto p-6">
      <ComplianceDashboard
        auditData={mockAuditData}
        aiDecisions={mockAIDecisions}
      />
    </div>
  )
}