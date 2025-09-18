'use client'

import { useQuery } from 'convex/react'
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  MapPin,
  MessageSquare,
  Plus,
  Search,
  Star,
  User,
  Video,
} from 'lucide-react'
import { useState } from 'react'
import { AppShell } from '@/components/layout/app-shell'
import { InterviewFeedbackModal } from '@/components/modals/interview-feedback-modal'
import { InterviewSchedulingModal } from '@/components/modals/interview-scheduling-modal'
import { api } from '../../../convex/_generated/api'
import type { Id } from '../../../convex/_generated/dataModel'

const statusColors = {
  scheduled: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
  completed: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
  cancelled: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400',
  'no-show': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400',
}

export default function InterviewsPage() {
  const [currentDate, setCurrentDate] = useState(new Date().toISOString().split('T')[0])
  const [selectedStatus, setSelectedStatus] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false)
  const [feedbackInterviewId, setFeedbackInterviewId] = useState<Id<'interviews'> | null>(null)

  // Fetch interviews from Convex
  const interviews =
    useQuery(api.interviews.list, {
      status: selectedStatus === 'all' ? undefined : selectedStatus,
      date: currentDate,
      search: searchQuery || undefined,
    }) || []

  const formatTime = (time: string) => {
    return new Date(`2000-01-01 ${time}`).toLocaleTimeString([], {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    })
  }

  return (
    <AppShell>
      <div className="min-h-screen">
        {/* Page header */}
        <div className="section-padding py-8 border-b border-border/50">
          <div className="container-max">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-2xl font-semibold tracking-tight">Interviews</h1>
                <p className="text-sm text-muted-foreground mt-1">
                  Schedule and manage candidate interviews
                </p>
              </div>

              <div className="flex gap-2">
                <button className="btn-secondary">Calendar View</button>
                <button
                  onClick={() => setIsScheduleModalOpen(true)}
                  className="btn-primary inline-flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  <span>Schedule Interview</span>
                </button>
              </div>
            </div>

            {/* Date navigation and filters */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 mt-6">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    const date = new Date(currentDate)
                    date.setDate(date.getDate() - 1)
                    setCurrentDate(date.toISOString().split('T')[0])
                  }}
                  className="p-2 rounded-md hover:bg-accent"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <div className="flex items-center gap-2 text-sm font-medium min-w-0">
                  <CalendarIcon className="h-4 w-4" />
                  <span>
                    {new Date(currentDate).toLocaleDateString([], {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </span>
                </div>
                <button
                  onClick={() => {
                    const date = new Date(currentDate)
                    date.setDate(date.getDate() + 1)
                    setCurrentDate(date.toISOString().split('T')[0])
                  }}
                  className="p-2 rounded-md hover:bg-accent"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>

              <div className="flex gap-2 ml-auto">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="search"
                    placeholder="Search interviews..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="input-clean pl-10 pr-4 h-10 text-sm w-64"
                  />
                </div>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="input-clean h-10 text-sm px-3"
                >
                  <option value="all">All Status</option>
                  <option value="scheduled">Scheduled</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                  <option value="no-show">No Show</option>
                </select>
                <button
                  onClick={() => setCurrentDate(new Date().toISOString().split('T')[0])}
                  className="btn-secondary text-sm"
                >
                  Today
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Interviews list */}
        <div className="section-padding py-8">
          <div className="container-max">
            <div className="space-y-4">
              {interviews.map((interview) => (
                <div key={interview._id} className="card-clean hover:shadow-md transition-all">
                  <div className="flex items-start gap-4">
                    {/* Time column */}
                    <div className="text-center min-w-0 shrink-0">
                      <div className="text-sm font-medium">{formatTime(interview.time)}</div>
                      <div className="text-xs text-muted-foreground">{interview.duration}</div>
                    </div>

                    {/* Main content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="font-medium">{interview.candidateName}</h3>
                          <p className="text-sm text-muted-foreground">{interview.position}</p>
                        </div>
                        <span
                          className={`badge-clean ${statusColors[interview.status as keyof typeof statusColors]}`}
                        >
                          {interview.status}
                        </span>
                      </div>

                      <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                        <div className="flex items-center gap-1">
                          <Video className="h-3 w-3" />
                          {interview.type}
                        </div>
                        <div className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {interview.location}
                        </div>
                        <div className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {interview.interviewers.join(', ')}
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex flex-wrap gap-2">
                          {interview.interviewers.map((interviewer, index) => (
                            <span key={index} className="badge-clean text-xs">
                              {interviewer}
                            </span>
                          ))}
                        </div>
                        <div className="flex gap-2">
                          {interview.status === 'scheduled' && (
                            <>
                              <button className="btn-secondary text-sm">Reschedule</button>
                              <button className="btn-primary text-sm">Join Meeting</button>
                            </>
                          )}
                          {interview.status === 'completed' &&
                            (interview.feedback ? (
                              <>
                                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                  <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                                  <span>{interview.rating}/5</span>
                                </div>
                                <button
                                  onClick={() => setFeedbackInterviewId(interview._id)}
                                  className="btn-secondary text-sm inline-flex items-center gap-1"
                                >
                                  <MessageSquare className="h-3 w-3" />
                                  View Feedback
                                </button>
                              </>
                            ) : (
                              <button
                                onClick={() => setFeedbackInterviewId(interview._id)}
                                className="btn-primary text-sm inline-flex items-center gap-1"
                              >
                                <MessageSquare className="h-3 w-3" />
                                Add Feedback
                              </button>
                            ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {interviews.length === 0 && (
              <div className="text-center py-12">
                <CalendarIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No interviews scheduled for this date</p>
                <button
                  onClick={() => setIsScheduleModalOpen(true)}
                  className="btn-primary mt-4 inline-flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Schedule Interview
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Interview Scheduling Modal */}
      <InterviewSchedulingModal
        isOpen={isScheduleModalOpen}
        onClose={() => setIsScheduleModalOpen(false)}
      />

      {/* Interview Feedback Modal */}
      {feedbackInterviewId && (
        <InterviewFeedbackModal
          isOpen={true}
          onClose={() => setFeedbackInterviewId(null)}
          interviewId={feedbackInterviewId}
        />
      )}
    </AppShell>
  )
}
