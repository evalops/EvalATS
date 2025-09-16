'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Clock, MapPin, DollarSign } from 'lucide-react'

type Stage = 'applied' | 'screening' | 'interview' | 'offer' | 'hired'

interface Candidate {
  id: string
  name: string
  avatar?: string
  position: string
  location: string
  salary?: string
  appliedDays: number
  stage: Stage
  tags: string[]
}

const stages: { id: Stage; label: string; color: string }[] = [
  { id: 'applied', label: 'Applied', color: 'bg-blue-500/10 text-blue-500' },
  { id: 'screening', label: 'Screening', color: 'bg-purple-500/10 text-purple-500' },
  { id: 'interview', label: 'Interview', color: 'bg-yellow-500/10 text-yellow-500' },
  { id: 'offer', label: 'Offer', color: 'bg-green-500/10 text-green-500' },
  { id: 'hired', label: 'Hired', color: 'bg-emerald-500/10 text-emerald-500' },
]

const mockCandidates: Candidate[] = [
  {
    id: '1',
    name: 'Alice Johnson',
    position: 'Senior Frontend Engineer',
    location: 'San Francisco, CA',
    salary: '$150k-$180k',
    appliedDays: 2,
    stage: 'applied',
    tags: ['React', 'TypeScript'],
  },
  {
    id: '2',
    name: 'Bob Smith',
    position: 'Backend Developer',
    location: 'Remote',
    salary: '$140k-$160k',
    appliedDays: 5,
    stage: 'screening',
    tags: ['Node.js', 'PostgreSQL'],
  },
  {
    id: '3',
    name: 'Carol White',
    position: 'Full Stack Developer',
    location: 'New York, NY',
    salary: '$160k-$190k',
    appliedDays: 7,
    stage: 'interview',
    tags: ['React', 'Python'],
  },
  {
    id: '4',
    name: 'David Brown',
    position: 'DevOps Engineer',
    location: 'Austin, TX',
    salary: '$145k-$165k',
    appliedDays: 10,
    stage: 'offer',
    tags: ['Kubernetes', 'AWS'],
  },
]

export function PipelineBoard() {
  const [candidates] = useState<Candidate[]>(mockCandidates)

  const getCandidatesByStage = (stage: Stage) => {
    return candidates.filter(c => c.stage === stage)
  }

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold">Pipeline Overview</h3>
        <span className="text-sm text-muted-foreground">
          {candidates.length} active candidates
        </span>
      </div>

      <div className="grid grid-cols-5 gap-4">
        {stages.map((stage) => (
          <div key={stage.id} className="stage-column">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium">{stage.label}</span>
              <span className={`text-xs px-2 py-1 rounded-full ${stage.color}`}>
                {getCandidatesByStage(stage.id).length}
              </span>
            </div>

            <div className="space-y-2">
              {getCandidatesByStage(stage.id).map((candidate) => (
                <div key={candidate.id} className="pipeline-card">
                  <div className="flex items-start gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={candidate.avatar} />
                      <AvatarFallback>
                        {candidate.name.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{candidate.name}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {candidate.position}
                      </p>
                    </div>
                  </div>

                  <div className="mt-3 space-y-1">
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <MapPin className="h-3 w-3" />
                      <span>{candidate.location}</span>
                    </div>
                    {candidate.salary && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <DollarSign className="h-3 w-3" />
                        <span>{candidate.salary}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      <span>{candidate.appliedDays}d ago</span>
                    </div>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-1">
                    {candidate.tags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}