'use client'

import { useMutation, useQuery } from 'convex/react'
import { Calendar, Clock, MapPin, Plus, Users, Video, X } from 'lucide-react'
import { useState } from 'react'
import { Modal } from '@/components/ui/modal'
import { useToast } from '@/hooks/use-toast'
import { api } from '../../../convex/_generated/api'
import type { Id } from '../../../convex/_generated/dataModel'

interface InterviewSchedulingModalProps {
  isOpen: boolean
  onClose: () => void
  candidateId?: Id<'candidates'>
  jobId?: Id<'jobs'>
  candidateName?: string
  jobTitle?: string
}

const interviewTypes = [
  { value: 'phone', label: 'Phone Interview', icon: '📞' },
  { value: 'video', label: 'Video Interview', icon: '📹' },
  { value: 'in-person', label: 'In-Person Interview', icon: '🏢' },
  { value: 'technical', label: 'Technical Interview', icon: '💻' },
  { value: 'panel', label: 'Panel Interview', icon: '👥' },
]

const durations = [
  { value: '30 min', label: '30 minutes' },
  { value: '45 min', label: '45 minutes' },
  { value: '60 min', label: '1 hour' },
  { value: '90 min', label: '1.5 hours' },
  { value: '120 min', label: '2 hours' },
]

const timeSlots = [
  '09:00 AM',
  '09:30 AM',
  '10:00 AM',
  '10:30 AM',
  '11:00 AM',
  '11:30 AM',
  '12:00 PM',
  '12:30 PM',
  '01:00 PM',
  '01:30 PM',
  '02:00 PM',
  '02:30 PM',
  '03:00 PM',
  '03:30 PM',
  '04:00 PM',
  '04:30 PM',
  '05:00 PM',
  '05:30 PM',
]

interface InterviewFormData {
  candidateId: string
  jobId: string
  type: string
  date: string
  time: string
  duration: string
  interviewers: string[]
  location: string
  notes: string
}

export function InterviewSchedulingModal({
  isOpen,
  onClose,
  candidateId,
  jobId,
  candidateName = '',
  jobTitle = '',
}: InterviewSchedulingModalProps) {
  const { toast } = useToast()
  const createInterview = useMutation(api.interviews.create)

  // Fetch candidates and jobs for selection if not provided
  const candidates = useQuery(api.candidates.list, {}) || []
  const jobs = useQuery(api.jobs.list, {}) || []

  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState<InterviewFormData>({
    candidateId: candidateId || '',
    jobId: jobId || '',
    type: 'video',
    date: '',
    time: '10:00 AM',
    duration: '60 min',
    interviewers: [''],
    location: '',
    notes: '',
  })

  const [errors, setErrors] = useState<Partial<Record<keyof InterviewFormData, string>>>({})

  // Get tomorrow as minimum date
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  const minDate = tomorrow.toISOString().split('T')[0]

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof InterviewFormData, string>> = {}

    if (!formData.candidateId) {
      newErrors.candidateId = 'Please select a candidate'
    }
    if (!formData.jobId) {
      newErrors.jobId = 'Please select a job'
    }
    if (!formData.date) {
      newErrors.date = 'Please select a date'
    }
    if (!formData.location.trim()) {
      newErrors.location = 'Please provide interview location or link'
    }
    if (formData.interviewers.filter((i) => i.trim()).length === 0) {
      newErrors.interviewers = 'Please add at least one interviewer'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setIsLoading(true)

    try {
      // Filter out empty interviewers
      const interviewers = formData.interviewers.filter((interviewer) => interviewer.trim() !== '')

      await createInterview({
        candidateId: formData.candidateId as Id<'candidates'>,
        jobId: formData.jobId as Id<'jobs'>,
        type: formData.type,
        date: formData.date,
        time: formData.time,
        duration: formData.duration,
        interviewers,
        location: formData.location.trim(),
      })

      const selectedCandidate = candidates.find((c) => c._id === formData.candidateId)
      const selectedJob = jobs.find((j) => j._id === formData.jobId)

      toast({
        title: 'Interview Scheduled Successfully',
        description: `Interview with ${selectedCandidate?.name || candidateName} for ${selectedJob?.title || jobTitle} has been scheduled.`,
      })

      // Reset form
      setFormData({
        candidateId: candidateId || '',
        jobId: jobId || '',
        type: 'video',
        date: '',
        time: '10:00 AM',
        duration: '60 min',
        interviewers: [''],
        location: '',
        notes: '',
      })

      onClose()
    } catch (_error) {
      toast({
        title: 'Error Scheduling Interview',
        description: 'There was an error scheduling the interview. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleInterviewerChange = (index: number, value: string) => {
    const newInterviewers = [...formData.interviewers]
    newInterviewers[index] = value
    setFormData({ ...formData, interviewers: newInterviewers })
  }

  const addInterviewer = () => {
    setFormData({
      ...formData,
      interviewers: [...formData.interviewers, ''],
    })
  }

  const removeInterviewer = (index: number) => {
    if (formData.interviewers.length > 1) {
      const newInterviewers = formData.interviewers.filter((_, i) => i !== index)
      setFormData({ ...formData, interviewers: newInterviewers })
    }
  }

  const getLocationPlaceholder = () => {
    switch (formData.type) {
      case 'video':
        return 'e.g. Zoom meeting link or Google Meet'
      case 'phone':
        return 'e.g. Conference call number'
      case 'in-person':
        return 'e.g. Conference Room A, Main Office'
      default:
        return 'Interview location or meeting details'
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Schedule Interview"
      description="Schedule a new interview with a candidate"
      size="lg"
    >
      <form onSubmit={handleSubmit} className="px-6 py-4 space-y-6">
        {/* Candidate and Job Selection */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Interview Details</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-2">
                Candidate *
              </label>
              {candidateId ? (
                <div className="input-clean bg-muted flex items-center">
                  <Users className="h-4 w-4 mr-2 text-muted-foreground" />
                  {candidateName}
                </div>
              ) : (
                <select
                  value={formData.candidateId}
                  onChange={(e) => setFormData({ ...formData, candidateId: e.target.value })}
                  className={`input-clean ${errors.candidateId ? 'border-red-500' : ''}`}
                >
                  <option value="">Select Candidate</option>
                  {candidates.map((candidate) => (
                    <option key={candidate._id} value={candidate._id}>
                      {candidate.name} - {candidate.position}
                    </option>
                  ))}
                </select>
              )}
              {errors.candidateId && (
                <p className="text-sm text-red-500 mt-1">{errors.candidateId}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-2">
                Position *
              </label>
              {jobId ? (
                <div className="input-clean bg-muted flex items-center">
                  <MapPin className="h-4 w-4 mr-2 text-muted-foreground" />
                  {jobTitle}
                </div>
              ) : (
                <select
                  value={formData.jobId}
                  onChange={(e) => setFormData({ ...formData, jobId: e.target.value })}
                  className={`input-clean ${errors.jobId ? 'border-red-500' : ''}`}
                >
                  <option value="">Select Position</option>
                  {jobs.map((job) => (
                    <option key={job._id} value={job._id}>
                      {job.title} - {job.department}
                    </option>
                  ))}
                </select>
              )}
              {errors.jobId && <p className="text-sm text-red-500 mt-1">{errors.jobId}</p>}
            </div>
          </div>
        </div>

        {/* Interview Type and Timing */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Scheduling</h3>

          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-2">
              Interview Type
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {interviewTypes.map((type) => (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => setFormData({ ...formData, type: type.value })}
                  className={`p-3 rounded-md border transition-colors text-left ${
                    formData.type === type.value
                      ? 'border-primary bg-primary/5 text-primary'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <div className="text-lg mb-1">{type.icon}</div>
                  <div className="text-sm font-medium">{type.label}</div>
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-2">
                <Calendar className="inline h-4 w-4 mr-1" />
                Date *
              </label>
              <input
                type="date"
                value={formData.date}
                min={minDate}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className={`input-clean ${errors.date ? 'border-red-500' : ''}`}
              />
              {errors.date && <p className="text-sm text-red-500 mt-1">{errors.date}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-2">
                <Clock className="inline h-4 w-4 mr-1" />
                Time
              </label>
              <select
                value={formData.time}
                onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                className="input-clean"
              >
                {timeSlots.map((time) => (
                  <option key={time} value={time}>
                    {time}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-2">
                Duration
              </label>
              <select
                value={formData.duration}
                onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                className="input-clean"
              >
                {durations.map((duration) => (
                  <option key={duration.value} value={duration.value}>
                    {duration.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Location and Interviewers */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-2">
              <Video className="inline h-4 w-4 mr-1" />
              Location / Meeting Details *
            </label>
            <input
              type="text"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              className={`input-clean ${errors.location ? 'border-red-500' : ''}`}
              placeholder={getLocationPlaceholder()}
            />
            {errors.location && <p className="text-sm text-red-500 mt-1">{errors.location}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-2">
              Interviewers *
            </label>
            {formData.interviewers.map((interviewer, index) => (
              <div key={index} className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={interviewer}
                  onChange={(e) => handleInterviewerChange(index, e.target.value)}
                  className="input-clean flex-1"
                  placeholder="Interviewer name"
                />
                {formData.interviewers.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeInterviewer(index)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-md transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={addInterviewer}
              className="btn-secondary text-sm inline-flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Add Interviewer
            </button>
            {errors.interviewers && (
              <p className="text-sm text-red-500 mt-1">{errors.interviewers}</p>
            )}
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex gap-3 pt-4 border-t border-border">
          <button
            type="button"
            onClick={onClose}
            className="btn-secondary flex-1"
            disabled={isLoading}
          >
            Cancel
          </button>
          <button type="submit" className="btn-primary flex-1" disabled={isLoading}>
            {isLoading ? 'Scheduling...' : 'Schedule Interview'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
