'use client'

import { useQuery } from 'convex/react'
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle,
  Download,
  FileText,
  Github,
  Globe,
  Linkedin,
  Mail,
  MapPin,
  Phone,
  Star,
  Upload,
  Video,
  XCircle,
} from 'lucide-react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useState } from 'react'
import { EmailThread } from '@/components/emails/email-thread'
import { AppShell } from '@/components/layout/app-shell'
import { CandidateFileModal } from '@/components/modals/candidate-file-modal'
import { api } from '../../../../convex/_generated/api'
import type { Id } from '../../../../convex/_generated/dataModel'

const statusColors = {
  screening: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
  interview: 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400',
  offer: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
  rejected: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400',
  applied: 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400',
  withdrawn: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400',
}

const timelineIcons = {
  applied: CheckCircle,
  screening: FileText,
  interview: Video,
  offer: Star,
  rejected: XCircle,
  withdrawn: AlertCircle,
}

export default function CandidatePage() {
  const params = useParams()
  const candidateId = params.id as Id<'candidates'>
  const [activeTab, setActiveTab] = useState('timeline')
  const [isFileModalOpen, setIsFileModalOpen] = useState(false)

  // Fetch candidate data from Convex
  const candidate = useQuery(api.candidates.get, { id: candidateId })

  if (!candidate) {
    return (
      <AppShell>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading candidate...</p>
          </div>
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell>
      <div className="min-h-screen">
        {/* Page header */}
        <div className="section-padding py-8 border-b border-border/50">
          <div className="container-max">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-4">
                <Link href="/candidates" className="p-2 rounded-md hover:bg-accent">
                  <ArrowLeft className="h-4 w-4" />
                </Link>
                <div>
                  <h1 className="text-2xl font-semibold tracking-tight">{candidate.name}</h1>
                  <p className="text-sm text-muted-foreground">{candidate.position}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span
                  className={`badge-clean ${statusColors[candidate.status as keyof typeof statusColors]}`}
                >
                  {candidate.status}
                </span>
                <button className="btn-secondary">Schedule Interview</button>
                <button className="btn-primary">Move to Next Stage</button>
              </div>
            </div>
          </div>
        </div>

        <div className="section-padding py-8">
          <div className="container-max">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Sidebar */}
              <div className="lg:col-span-1 space-y-6">
                {/* Candidate info card */}
                <div className="card-clean">
                  <div className="flex items-start gap-4">
                    <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center text-xl font-medium">
                      {candidate.name
                        .split(' ')
                        .map((n) => n[0])
                        .join('')}
                    </div>
                    <div className="flex-1">
                      <h2 className="text-xl font-semibold">{candidate.name}</h2>
                      <p className="text-sm text-muted-foreground">{candidate.position}</p>
                    </div>
                  </div>

                  <div className="space-y-3 mt-6">
                    <div className="flex items-center gap-3 text-sm">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      {candidate.email}
                    </div>
                    {candidate.phone && (
                      <div className="flex items-center gap-3 text-sm">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        {candidate.phone}
                      </div>
                    )}
                    <div className="flex items-center gap-3 text-sm">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      {candidate.location}
                    </div>
                  </div>

                  <div className="flex gap-2 mt-6">
                    {candidate.linkedin && (
                      <button className="p-2 rounded-md hover:bg-accent">
                        <Linkedin className="h-4 w-4" />
                      </button>
                    )}
                    {candidate.github && (
                      <button className="p-2 rounded-md hover:bg-accent">
                        <Github className="h-4 w-4" />
                      </button>
                    )}
                    {candidate.portfolio && (
                      <button className="p-2 rounded-md hover:bg-accent">
                        <Globe className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Evaluation scores */}
                <div className="card-clean">
                  <h3 className="font-medium mb-4">Evaluation Scores</h3>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Overall</span>
                        <span className="font-medium">{candidate.evaluation.overall}%</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div
                          className="bg-primary rounded-full h-2 transition-all"
                          style={{ width: `${candidate.evaluation.overall}%` }}
                        />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Technical</span>
                        <span className="font-medium">{candidate.evaluation.technical}%</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div
                          className="bg-blue-500 rounded-full h-2 transition-all"
                          style={{ width: `${candidate.evaluation.technical}%` }}
                        />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Cultural Fit</span>
                        <span className="font-medium">{candidate.evaluation.cultural}%</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div
                          className="bg-green-500 rounded-full h-2 transition-all"
                          style={{ width: `${candidate.evaluation.cultural}%` }}
                        />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Communication</span>
                        <span className="font-medium">{candidate.evaluation.communication}%</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div
                          className="bg-purple-500 rounded-full h-2 transition-all"
                          style={{ width: `${candidate.evaluation.communication}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Quick info */}
                <div className="card-clean">
                  <h3 className="font-medium mb-4">Quick Information</h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Applied</span>
                      <span className="font-medium">{candidate.appliedDate}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Experience</span>
                      <span className="font-medium">{candidate.experience}</span>
                    </div>
                    {candidate.currentCompany && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Current Company</span>
                        <span className="font-medium">{candidate.currentCompany}</span>
                      </div>
                    )}
                    {candidate.education && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Education</span>
                        <span className="font-medium text-right">{candidate.education}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Skills */}
                {candidate.skills && (
                  <div className="card-clean">
                    <h3 className="font-medium mb-4">Skills</h3>
                    <div className="flex flex-wrap gap-2">
                      {candidate.skills.map((skill) => (
                        <span key={skill} className="badge-clean text-xs">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Main content */}
              <div className="lg:col-span-2">
                {/* Tabs */}
                <div className="border-b border-border mb-6">
                  <nav className="flex space-x-6">
                    {['timeline', 'assessments', 'notes', 'emails', 'documents'].map((tab) => (
                      <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`pb-2 px-1 capitalize text-sm font-medium border-b-2 transition-colors ${
                          activeTab === tab
                            ? 'border-primary text-foreground'
                            : 'border-transparent text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        {tab}
                      </button>
                    ))}
                  </nav>
                </div>

                {/* Tab content */}
                {activeTab === 'timeline' && (
                  <div className="space-y-4">
                    {candidate.timeline && candidate.timeline.length > 0 ? (
                      candidate.timeline.map((event, index) => {
                        const Icon =
                          timelineIcons[event.type as keyof typeof timelineIcons] || CheckCircle
                        return (
                          <div key={index} className="flex gap-4">
                            <div className="relative">
                              <div
                                className={`p-2 rounded-full ${
                                  event.status === 'completed'
                                    ? 'bg-primary/10 text-primary'
                                    : event.status === 'scheduled'
                                      ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400'
                                      : 'bg-muted text-muted-foreground'
                                }`}
                              >
                                <Icon className="h-4 w-4" />
                              </div>
                              {index < candidate.timeline.length - 1 && (
                                <div className="absolute left-1/2 top-full h-[calc(100%+1rem)] w-[1px] bg-border -translate-x-1/2" />
                              )}
                            </div>
                            <div className="flex-1 pb-8">
                              <div className="card-clean">
                                <div className="flex items-start justify-between">
                                  <div>
                                    <h4 className="font-medium">{event.title}</h4>
                                    <p className="text-sm text-muted-foreground mt-1">
                                      {event.description}
                                    </p>
                                  </div>
                                  <span className="text-xs text-muted-foreground">
                                    {event.date}
                                  </span>
                                </div>
                                {(event as any).interviewer && (
                                  <div className="mt-3 pt-3 border-t border-border">
                                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                      <span>Interviewer: {(event as any).interviewer}</span>
                                      {(event as any).duration && (
                                        <span>Duration: {(event as any).duration}</span>
                                      )}
                                    </div>
                                    {(event as any).feedback && (
                                      <p className="mt-2 text-sm">{(event as any).feedback}</p>
                                    )}
                                    {(event as any).rating && (
                                      <div className="flex items-center gap-1 mt-2">
                                        {[1, 2, 3, 4, 5].map((star) => (
                                          <Star
                                            key={star}
                                            className={`h-4 w-4 ${
                                              star <= (event as any).rating
                                                ? 'fill-yellow-400 text-yellow-400'
                                                : 'text-gray-300'
                                            }`}
                                          />
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                )}
                                {(event as any).score && (
                                  <div className="mt-3 pt-3 border-t border-border">
                                    <span className="text-sm">Score: {(event as any).score}%</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        )
                      })
                    ) : (
                      <p className="text-muted-foreground">No timeline events yet</p>
                    )}
                  </div>
                )}

                {activeTab === 'assessments' && (
                  <div className="space-y-4">
                    {candidate.assessments && candidate.assessments.length > 0 ? (
                      candidate.assessments.map((assessment, index) => (
                        <div key={index} className="card-clean">
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="font-medium">{assessment.name}</h4>
                              <p className="text-sm text-muted-foreground mt-1">
                                Completed on {assessment.completedDate}
                              </p>
                            </div>
                            <div className="text-right">
                              <div className="text-2xl font-semibold">{assessment.score}</div>
                              <p className="text-xs text-muted-foreground">
                                out of {assessment.maxScore}
                              </p>
                            </div>
                          </div>
                          <div className="mt-4">
                            <div className="w-full bg-muted rounded-full h-2">
                              <div
                                className="bg-primary rounded-full h-2 transition-all"
                                style={{
                                  width: `${(assessment.score / assessment.maxScore) * 100}%`,
                                }}
                              />
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-muted-foreground">No assessments completed yet</p>
                    )}
                  </div>
                )}

                {activeTab === 'emails' && (
                  <EmailThread
                    candidateId={candidateId}
                    candidateName={candidate.name}
                    candidateEmail={candidate.email}
                    jobTitle={candidate.position}
                  />
                )}

                {activeTab === 'notes' && (
                  <div className="space-y-4">
                    {candidate.notes && candidate.notes.length > 0 ? (
                      <>
                        {candidate.notes.map((note, index) => (
                          <div key={index} className="card-clean">
                            <div className="flex items-start justify-between mb-2">
                              <div>
                                <h4 className="font-medium">{note.author}</h4>
                                <p className="text-xs text-muted-foreground">{note.role}</p>
                              </div>
                              <span className="text-xs text-muted-foreground">{note.date}</span>
                            </div>
                            <p className="text-sm mt-3">{note.content}</p>
                          </div>
                        ))}
                        <div className="card-clean">
                          <h4 className="font-medium mb-3">Add a Note</h4>
                          <textarea
                            placeholder="Type your note here..."
                            className="input-clean min-h-[100px]"
                          />
                          <button className="btn-primary mt-3">Add Note</button>
                        </div>
                      </>
                    ) : (
                      <div>
                        <p className="text-muted-foreground mb-4">No notes yet</p>
                        <div className="card-clean">
                          <h4 className="font-medium mb-3">Add a Note</h4>
                          <textarea
                            placeholder="Type your note here..."
                            className="input-clean min-h-[100px]"
                          />
                          <button className="btn-primary mt-3">Add Note</button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'documents' && (
                  <div className="space-y-6">
                    {/* File Management Header */}
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-medium">Documents</h3>
                        <p className="text-sm text-muted-foreground">
                          Manage candidate files and documents
                        </p>
                      </div>
                      <button
                        onClick={() => setIsFileModalOpen(true)}
                        className="btn-primary inline-flex items-center gap-2"
                      >
                        <Upload className="h-4 w-4" />
                        Manage Files
                      </button>
                    </div>

                    {/* Resume Section */}
                    <div className="card-clean">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-md">
                            <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                          </div>
                          <div>
                            <h4 className="font-medium">Resume</h4>
                            {candidate.resumeFilename ? (
                              <p className="text-sm text-muted-foreground mt-1">
                                {candidate.resumeFilename} • Uploaded {candidate.appliedDate}
                              </p>
                            ) : (
                              <p className="text-sm text-muted-foreground mt-1">
                                No resume uploaded
                              </p>
                            )}
                          </div>
                        </div>
                        {candidate.resumeUrl && candidate.resumeFilename && (
                          <button
                            onClick={() =>
                              window.open(`/api/files/download/${candidate.resumeUrl}`, '_blank')
                            }
                            className="btn-secondary inline-flex items-center gap-2"
                          >
                            <Download className="h-4 w-4" />
                            Download
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Cover Letter Section */}
                    <div className="card-clean">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-green-50 dark:bg-green-900/20 rounded-md">
                            <FileText className="h-5 w-5 text-green-600 dark:text-green-400" />
                          </div>
                          <div>
                            <h4 className="font-medium">Cover Letter</h4>
                            {candidate.coverLetterFilename ? (
                              <p className="text-sm text-muted-foreground mt-1">
                                {candidate.coverLetterFilename} • Uploaded {candidate.appliedDate}
                              </p>
                            ) : (
                              <p className="text-sm text-muted-foreground mt-1">
                                No cover letter uploaded
                              </p>
                            )}
                          </div>
                        </div>
                        {candidate.coverLetter && candidate.coverLetterFilename && (
                          <button
                            onClick={() =>
                              window.open(`/api/files/download/${candidate.coverLetter}`, '_blank')
                            }
                            className="btn-secondary inline-flex items-center gap-2"
                          >
                            <Download className="h-4 w-4" />
                            Download
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Empty State */}
                    {!candidate.resumeUrl && !candidate.coverLetter && (
                      <div className="text-center py-12">
                        <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <p className="text-muted-foreground mb-4">No documents uploaded yet</p>
                        <button
                          onClick={() => setIsFileModalOpen(true)}
                          className="btn-primary inline-flex items-center gap-2"
                        >
                          <Upload className="h-4 w-4" />
                          Upload Documents
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* File Management Modal */}
        <CandidateFileModal
          isOpen={isFileModalOpen}
          onClose={() => setIsFileModalOpen(false)}
          candidateId={candidateId}
          candidateName={candidate.name}
        />
      </div>
    </AppShell>
  )
}
