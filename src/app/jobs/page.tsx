'use client'

import { useState } from 'react'
import { AppShell } from '@/components/layout/app-shell'
import { Plus, Search, Filter, MoreVertical, Users, Clock, MapPin } from 'lucide-react'
import { useQuery } from 'convex/react'
import { api } from '../../../convex/_generated/api'
import Link from 'next/link'
import { JobCreationModal } from '@/components/modals/job-creation-modal'

const statusColors = {
  active: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
  paused: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400',
  closed: 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400',
}

const urgencyColors = {
  high: 'border-l-red-500',
  medium: 'border-l-yellow-500',
  low: 'border-l-green-500',
}

export default function JobsPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedStatus, setSelectedStatus] = useState('all')
  const [isJobModalOpen, setIsJobModalOpen] = useState(false)

  // Fetch jobs from Convex
  const jobs = useQuery(api.jobs.list, {
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
                <h1 className="text-2xl font-semibold tracking-tight">Jobs</h1>
                <p className="text-sm text-muted-foreground mt-1">
                  Manage job postings and track applications
                </p>
              </div>

              <div className="flex gap-2">
                <button className="btn-secondary inline-flex items-center gap-2">
                  <Filter className="h-4 w-4" />
                  <span>Filter</span>
                </button>
                <button
                  onClick={() => setIsJobModalOpen(true)}
                  className="btn-primary inline-flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  <span>Post Job</span>
                </button>
              </div>
            </div>

            {/* Search and filters */}
            <div className="flex flex-col sm:flex-row gap-4 mt-6">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="search"
                  placeholder="Search jobs..."
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
                <option value="active">Active</option>
                <option value="paused">Paused</option>
                <option value="closed">Closed</option>
              </select>
            </div>
          </div>
        </div>

        {/* Jobs list */}
        <div className="section-padding py-8">
          <div className="container-max">
            <div className="grid gap-4">
              {jobs.map((job) => (
                <div
                  key={job._id}
                  className={`card-clean hover:shadow-md transition-all border-l-4 ${urgencyColors[job.urgency as keyof typeof urgencyColors]}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <Link href={`/jobs/${job._id}`}>
                            <h3 className="text-lg font-medium hover:text-primary transition-colors cursor-pointer">
                              {job.title}
                            </h3>
                          </Link>
                          <p className="text-sm text-muted-foreground">{job.department}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`badge-clean ${statusColors[job.status as keyof typeof statusColors]}`}>
                            {job.status}
                          </span>
                          <button className="p-2 rounded-md hover:bg-accent">
                            <MoreVertical className="h-4 w-4" />
                          </button>
                        </div>
                      </div>

                      <div className="flex items-center gap-6 text-sm text-muted-foreground mb-4">
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4" />
                          {job.location}
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          {job.type}
                        </div>
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4" />
                          {job.applicantCount || 0} applicants
                        </div>
                      </div>

                      {job.description && (
                        <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                          {job.description}
                        </p>
                      )}

                      {job.requirements && job.requirements.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-4">
                          {job.requirements.slice(0, 4).map((requirement, index) => (
                            <span key={index} className="badge-clean text-xs">
                              {requirement}
                            </span>
                          ))}
                          {job.requirements.length > 4 && (
                            <span className="badge-clean text-xs">
                              +{job.requirements.length - 4} more
                            </span>
                          )}
                        </div>
                      )}

                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-4">
                          <span className="text-muted-foreground">
                            Posted {job.postedDate}
                          </span>
                          {job.salaryMin && job.salaryMax && (
                            <span className="font-medium">
                              ${job.salaryMin.toLocaleString()} - ${job.salaryMax.toLocaleString()}
                            </span>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <Link href={`/jobs/${job._id}`} className="btn-secondary text-sm">
                            View Applications
                          </Link>
                          <button className="btn-primary text-sm">
                            Edit Job
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {jobs.length === 0 && (
              <div className="text-center py-12">
                <p className="text-muted-foreground">No jobs found matching your criteria</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Job Creation Modal */}
      <JobCreationModal
        isOpen={isJobModalOpen}
        onClose={() => setIsJobModalOpen(false)}
      />
    </AppShell>
  )
}