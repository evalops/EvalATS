'use client'

import { useState } from 'react'
import { AppShell } from '@/components/layout/app-shell'
import { Search, Filter, Star, Mail, Calendar, Download, MoreVertical, MapPin, Briefcase } from 'lucide-react'
import Link from 'next/link'
import { useQuery } from 'convex/react'
import { api } from '../../../convex/_generated/api'
import { CandidateStatusActions } from '@/components/candidate-status-actions'

const statusColors = {
  screening: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
  interview: 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400',
  offer: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
  rejected: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400',
  applied: 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400',
  withdrawn: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400',
}

export default function CandidatesPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedStatus, setSelectedStatus] = useState('all')

  // Fetch candidates from Convex
  const candidates = useQuery(api.candidates.list, {
    status: selectedStatus === 'all' ? undefined : selectedStatus,
    search: searchQuery || undefined,
  }) || []

  return (
    <AppShell>
      <div className="min-h-screen">
        {/* Page header */}
        <div className="section-padding py-8 border-b border-border/50">
          <div className="container-max">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-2xl font-semibold tracking-tight">Candidates</h1>
                <p className="text-sm text-muted-foreground mt-1">
                  Review and evaluate candidate applications
                </p>
              </div>

              <div className="flex gap-2">
                <button className="btn-secondary inline-flex items-center gap-2">
                  <Download className="h-4 w-4" />
                  <span>Export</span>
                </button>
              </div>
            </div>

            {/* Search and filters */}
            <div className="flex flex-col sm:flex-row gap-4 mt-6">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="search"
                  placeholder="Search candidates..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="input-clean pl-10 pr-4 h-10 text-sm w-full"
                />
              </div>

              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="input-clean h-10 text-sm px-3"
              >
                <option value="all">All Status</option>
                <option value="applied">Applied</option>
                <option value="screening">Screening</option>
                <option value="interview">Interview</option>
                <option value="offer">Offer</option>
                <option value="rejected">Rejected</option>
                <option value="withdrawn">Withdrawn</option>
              </select>
            </div>
          </div>
        </div>

        {/* Candidates list */}
        <div className="section-padding py-8">
          <div className="container-max">
            <div className="space-y-4">
              {candidates.map((candidate) => (
                <Link
                  key={candidate._id}
                  href={`/candidates/${candidate._id}`}
                  className="block"
                >
                  <div className="card-clean hover:shadow-md transition-all cursor-pointer">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start gap-4">
                          {/* Avatar */}
                          <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center text-sm font-medium shrink-0">
                            {candidate.name.split(' ').map(n => n[0]).join('')}
                          </div>

                          <div className="flex-1">
                            <div className="flex items-start justify-between">
                              <div>
                                <h3 className="text-base font-medium hover:text-primary transition-colors">
                                  {candidate.name}
                                </h3>
                                <p className="text-sm text-muted-foreground">{candidate.email}</p>
                              </div>

                              {/* Evaluation score */}
                              <div className="text-right">
                                <div className="text-2xl font-semibold">{candidate.evaluation.overall}%</div>
                                <p className="text-xs text-muted-foreground">Eval Score</p>
                              </div>
                            </div>

                            <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <Briefcase className="h-3 w-3" />
                                {candidate.position}
                              </div>
                              <div className="flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                {candidate.location}
                              </div>
                              <div>
                                {candidate.experience}
                              </div>
                            </div>

                            {/* Skills */}
                            <div className="flex flex-wrap gap-2 mt-3">
                              {candidate.skills.slice(0, 4).map((skill) => (
                                <span key={skill} className="badge-clean text-xs">
                                  {skill}
                                </span>
                              ))}
                              {candidate.skills.length > 4 && (
                                <span className="badge-clean text-xs">
                                  +{candidate.skills.length - 4} more
                                </span>
                              )}
                            </div>

                            {/* Status and Actions */}
                            <div className="mt-4"
                              onClick={(e) => {
                                e.preventDefault()
                                e.stopPropagation()
                              }}
                            >
                              <CandidateStatusActions
                                candidateId={candidate._id}
                                currentStatus={candidate.status}
                                candidateName={candidate.name}
                                compact={true}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {candidates.length === 0 && (
              <div className="text-center py-12">
                <p className="text-muted-foreground">No candidates found matching your criteria</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  )
}