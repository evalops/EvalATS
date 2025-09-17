'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import { AppShell } from '@/components/layout/app-shell'
import Link from 'next/link'
import {
  ArrowLeft, Users, MapPin, Clock, Calendar, Filter, Search,
  MoreVertical, Star, Mail, Phone, Download
} from 'lucide-react'
import { useQuery } from 'convex/react'
import { api } from '../../../../convex/_generated/api'
import { Id } from '../../../../convex/_generated/dataModel'
import { CandidateStatusActions } from '@/components/candidate-status-actions'

const statusColors = {
  screening: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
  interview: 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400',
  offer: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
  hired: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-400',
  rejected: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400',
  applied: 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400',
  withdrawn: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400',
}

export default function JobDetailPage() {
  const params = useParams()
  const jobId = params.id as Id<"jobs">
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedStatus, setSelectedStatus] = useState('all')

  // Fetch job details with applicants
  const job = useQuery(api.jobs.get, { id: jobId })

  if (!job) {
    return (
      <AppShell>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading job details...</p>
          </div>
        </div>
      </AppShell>
    )
  }

  // Filter applicants based on search and status
  const filteredApplicants = job.applicants?.filter(applicant => {
    const matchesSearch = !searchQuery ||
      applicant.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      applicant.email.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesStatus = selectedStatus === 'all' || applicant.status === selectedStatus

    return matchesSearch && matchesStatus
  }) || []

  return (
    <AppShell>
      <div className="min-h-screen">
        {/* Page header */}
        <div className="section-padding py-8 border-b border-border/50">
          <div className="container-max">
            <div className="flex items-center gap-4 mb-6">
              <Link
                href="/jobs"
                className="p-2 rounded-md hover:bg-accent"
              >
                <ArrowLeft className="h-4 w-4" />
              </Link>
              <div>
                <h1 className="text-2xl font-semibold tracking-tight">{job.title}</h1>
                <p className="text-sm text-muted-foreground">{job.department} • {job.location}</p>
              </div>
            </div>

            {/* Job overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div className="card-clean">
                <div className="flex items-center gap-3">
                  <Users className="h-8 w-8 text-primary" />
                  <div>
                    <div className="text-2xl font-semibold">{job.applicants?.length || 0}</div>
                    <p className="text-xs text-muted-foreground">Total Applications</p>
                  </div>
                </div>
              </div>
              <div className="card-clean">
                <div className="flex items-center gap-3">
                  <Calendar className="h-8 w-8 text-blue-500" />
                  <div>
                    <div className="text-2xl font-semibold">{job.applicants?.filter(a => a.status === 'interview').length || 0}</div>
                    <p className="text-xs text-muted-foreground">In Interviews</p>
                  </div>
                </div>
              </div>
              <div className="card-clean">
                <div className="flex items-center gap-3">
                  <Star className="h-8 w-8 text-green-500" />
                  <div>
                    <div className="text-2xl font-semibold">{job.applicants?.filter(a => a.status === 'offer').length || 0}</div>
                    <p className="text-xs text-muted-foreground">Offers Made</p>
                  </div>
                </div>
              </div>
              <div className="card-clean">
                <div className="flex items-center gap-3">
                  <Clock className="h-8 w-8 text-purple-500" />
                  <div>
                    <div className="text-2xl font-semibold">
                      {job.applicants?.filter(a => a.status === 'applied' || a.status === 'screening').length || 0}
                    </div>
                    <p className="text-xs text-muted-foreground">Pending Review</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Job details */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <div className="card-clean">
                  <h3 className="font-medium mb-4">Job Description</h3>
                  <p className="text-sm text-muted-foreground mb-4">{job.description}</p>

                  {job.requirements && job.requirements.length > 0 && (
                    <>
                      <h4 className="font-medium mb-2">Requirements</h4>
                      <ul className="text-sm text-muted-foreground space-y-1 mb-4">
                        {job.requirements.map((req, index) => (
                          <li key={index} className="flex items-start gap-2">
                            <span className="text-primary mt-1">•</span>
                            {req}
                          </li>
                        ))}
                      </ul>
                    </>
                  )}

                  {(job.salaryMin || job.salaryMax) && (
                    <div className="pt-4 border-t border-border">
                      <h4 className="font-medium mb-2">Compensation</h4>
                      <p className="text-sm font-medium">
                        ${job.salaryMin?.toLocaleString()} - ${job.salaryMax?.toLocaleString()} annually
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div className="lg:col-span-1">
                <div className="card-clean">
                  <h3 className="font-medium mb-4">Job Details</h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Department</span>
                      <span className="font-medium">{job.department}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Location</span>
                      <span className="font-medium">{job.location}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Type</span>
                      <span className="font-medium capitalize">{job.type}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Posted</span>
                      <span className="font-medium">{job.postedDate}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Status</span>
                      <span className={`badge-clean ${statusColors[job.status as keyof typeof statusColors] || 'bg-gray-100 text-gray-800'}`}>
                        {job.status}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Search and filters for applications */}
            <div className="flex flex-col sm:flex-row gap-4 mt-8">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="search"
                  placeholder="Search applicants..."
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
                <option value="all">All Applicants</option>
                <option value="applied">Applied</option>
                <option value="screening">Screening</option>
                <option value="interview">Interview</option>
                <option value="offer">Offer</option>
                <option value="rejected">Rejected</option>
                <option value="withdrawn">Withdrawn</option>
                <option value="hired">Hired</option>
              </select>
            </div>
          </div>
        </div>

        {/* Applications list */}
        <div className="section-padding py-8">
          <div className="container-max">
            <div className="mb-6">
              <h2 className="text-lg font-medium">
                Applications ({filteredApplicants.length})
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                Review and manage candidate applications
              </p>
            </div>

            <div className="space-y-4">
              {filteredApplicants.map((applicant) => (
                <Link
                  key={applicant._id}
                  href={`/candidates/${applicant._id}`}
                  className="block"
                >
                  <div className="card-clean hover:shadow-md transition-all cursor-pointer">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4 flex-1">
                        {/* Avatar */}
                        <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center text-sm font-medium shrink-0">
                          {applicant.name.split(' ').map(n => n[0]).join('')}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <h3 className="font-medium hover:text-primary transition-colors">
                                {applicant.name}
                              </h3>
                              <p className="text-sm text-muted-foreground">{applicant.email}</p>
                            </div>
                            <div className="text-right">
                              <div className="text-2xl font-semibold">{applicant.evaluation?.overall || 0}%</div>
                              <p className="text-xs text-muted-foreground">Eval Score</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                            <div className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {applicant.location}
                            </div>
                            <div>
                              {applicant.experience}
                            </div>
                            {applicant.currentCompany && (
                              <div>
                                {applicant.currentCompany}
                              </div>
                            )}
                          </div>

                          {/* Skills */}
                          {applicant.skills && applicant.skills.length > 0 && (
                            <div className="flex flex-wrap gap-2 mb-3">
                              {applicant.skills.slice(0, 4).map((skill) => (
                                <span key={skill} className="badge-clean text-xs">
                                  {skill}
                                </span>
                              ))}
                              {applicant.skills.length > 4 && (
                                <span className="badge-clean text-xs">
                                  +{applicant.skills.length - 4} more
                                </span>
                              )}
                            </div>
                          )}

                          <div
                            onClick={(e) => {
                              e.preventDefault()
                              e.stopPropagation()
                            }}
                          >
                            <CandidateStatusActions
                              candidateId={applicant._id}
                              currentStatus={applicant.status}
                              candidateName={applicant.name}
                              compact={true}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {filteredApplicants.length === 0 && (
              <div className="text-center py-12">
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  {job.applicants?.length === 0
                    ? "No applications received yet"
                    : "No applicants match your search criteria"}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  )
}