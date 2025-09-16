'use client'

import { useState } from 'react'
import { Modal } from '@/components/ui/modal'
import { useToast } from '@/hooks/use-toast'
import { useMutation, useQuery } from 'convex/react'
import { api } from '../../../convex/_generated/api'
import { Star, User, Clock, Calendar } from 'lucide-react'
import { Id } from '../../../convex/_generated/dataModel'

interface InterviewFeedbackModalProps {
  isOpen: boolean
  onClose: () => void
  interviewId: Id<"interviews">
}

interface FeedbackFormData {
  rating: number
  technicalSkills: number
  culturalFit: number
  communication: number
  problemSolving: number
  experience: number
  overallFeedback: string
  strengths: string
  concerns: string
  recommendation: 'strong_hire' | 'hire' | 'no_hire' | 'strong_no_hire'
  wouldWorkWithAgain: boolean
}

const recommendationOptions = [
  { value: 'strong_hire', label: 'Strong Hire', color: 'text-green-700 bg-green-100 dark:bg-green-900/20 dark:text-green-400' },
  { value: 'hire', label: 'Hire', color: 'text-blue-700 bg-blue-100 dark:bg-blue-900/20 dark:text-blue-400' },
  { value: 'no_hire', label: 'No Hire', color: 'text-orange-700 bg-orange-100 dark:bg-orange-900/20 dark:text-orange-400' },
  { value: 'strong_no_hire', label: 'Strong No Hire', color: 'text-red-700 bg-red-100 dark:bg-red-900/20 dark:text-red-400' },
]

export function InterviewFeedbackModal({
  isOpen,
  onClose,
  interviewId
}: InterviewFeedbackModalProps) {
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)

  // Fetch interview details
  const interview = useQuery(api.interviews.get, { id: interviewId })
  const addFeedback = useMutation(api.interviews.addFeedback)

  const [formData, setFormData] = useState<FeedbackFormData>({
    rating: 0,
    technicalSkills: 0,
    culturalFit: 0,
    communication: 0,
    problemSolving: 0,
    experience: 0,
    overallFeedback: '',
    strengths: '',
    concerns: '',
    recommendation: 'hire',
    wouldWorkWithAgain: true,
  })

  const [errors, setErrors] = useState<Partial<Record<keyof FeedbackFormData, string>>>({})

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof FeedbackFormData, string>> = {}

    if (formData.rating === 0) {
      newErrors.rating = 'Please provide an overall rating'
    }
    if (!formData.overallFeedback.trim()) {
      newErrors.overallFeedback = 'Please provide overall feedback'
    }
    if (!formData.strengths.trim()) {
      newErrors.strengths = 'Please highlight candidate strengths'
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
      await addFeedback({
        id: interviewId,
        feedback: formData.overallFeedback,
        rating: formData.rating,
        technicalSkills: formData.technicalSkills,
        culturalFit: formData.culturalFit,
        communication: formData.communication,
        problemSolving: formData.problemSolving,
        experience: formData.experience,
        strengths: formData.strengths,
        concerns: formData.concerns,
        recommendation: formData.recommendation,
        wouldWorkWithAgain: formData.wouldWorkWithAgain,
      })

      toast({
        title: 'Feedback Submitted',
        description: 'Interview feedback has been successfully saved.',
      })

      onClose()
    } catch (error) {
      toast({
        title: 'Error Submitting Feedback',
        description: 'There was an error saving the feedback. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const StarRating = ({
    value,
    onChange,
    label,
    error
  }: {
    value: number
    onChange: (rating: number) => void
    label: string
    error?: string
  }) => (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-muted-foreground">
        {label}
      </label>
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            className="p-1 hover:scale-110 transition-transform"
          >
            <Star
              className={`h-6 w-6 ${
                star <= value
                  ? 'fill-yellow-400 text-yellow-400'
                  : 'text-gray-300 hover:text-yellow-300'
              }`}
            />
          </button>
        ))}
        <span className="ml-2 text-sm text-muted-foreground">
          {value > 0 ? `${value}/5` : 'Not rated'}
        </span>
      </div>
      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  )

  if (!interview) {
    return null
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Interview Feedback"
      description={`Provide feedback for ${interview.candidate?.name}`}
      size="lg"
    >
      <form onSubmit={handleSubmit} className="px-6 py-4 space-y-6">
        {/* Interview Details Header */}
        <div className="bg-muted/50 rounded-lg p-4 space-y-2">
          <div className="flex items-center gap-3">
            <User className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">{interview.candidate?.name}</span>
            <span className="text-muted-foreground">•</span>
            <span className="text-sm text-muted-foreground">{interview.job?.title}</span>
          </div>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {interview.date}
            </div>
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {interview.time}
            </div>
            <div className="flex items-center gap-1">
              {interview.duration}
            </div>
          </div>
        </div>

        {/* Overall Rating */}
        <StarRating
          value={formData.rating}
          onChange={(rating) => setFormData({ ...formData, rating })}
          label="Overall Rating *"
          error={errors.rating}
        />

        {/* Detailed Ratings */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Detailed Assessment</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <StarRating
              value={formData.technicalSkills}
              onChange={(rating) => setFormData({ ...formData, technicalSkills: rating })}
              label="Technical Skills"
            />
            <StarRating
              value={formData.culturalFit}
              onChange={(rating) => setFormData({ ...formData, culturalFit: rating })}
              label="Cultural Fit"
            />
            <StarRating
              value={formData.communication}
              onChange={(rating) => setFormData({ ...formData, communication: rating })}
              label="Communication"
            />
            <StarRating
              value={formData.problemSolving}
              onChange={(rating) => setFormData({ ...formData, problemSolving: rating })}
              label="Problem Solving"
            />
            <StarRating
              value={formData.experience}
              onChange={(rating) => setFormData({ ...formData, experience: rating })}
              label="Relevant Experience"
            />
          </div>
        </div>

        {/* Written Feedback */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Written Feedback</h3>

          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-2">
              Overall Feedback *
            </label>
            <textarea
              value={formData.overallFeedback}
              onChange={(e) => setFormData({ ...formData, overallFeedback: e.target.value })}
              className={`input-clean min-h-[100px] ${errors.overallFeedback ? 'border-red-500' : ''}`}
              placeholder="Provide your overall assessment of the candidate..."
            />
            {errors.overallFeedback && (
              <p className="text-sm text-red-500 mt-1">{errors.overallFeedback}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-2">
              Key Strengths *
            </label>
            <textarea
              value={formData.strengths}
              onChange={(e) => setFormData({ ...formData, strengths: e.target.value })}
              className={`input-clean min-h-[80px] ${errors.strengths ? 'border-red-500' : ''}`}
              placeholder="What are the candidate's main strengths?"
            />
            {errors.strengths && (
              <p className="text-sm text-red-500 mt-1">{errors.strengths}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-2">
              Areas of Concern (Optional)
            </label>
            <textarea
              value={formData.concerns}
              onChange={(e) => setFormData({ ...formData, concerns: e.target.value })}
              className="input-clean min-h-[80px]"
              placeholder="Any concerns or areas for improvement?"
            />
          </div>
        </div>

        {/* Recommendation */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Recommendation</h3>

          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-3">
              Hiring Recommendation
            </label>
            <div className="grid grid-cols-2 gap-3">
              {recommendationOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setFormData({ ...formData, recommendation: option.value as any })}
                  className={`p-3 rounded-md border transition-colors text-left ${
                    formData.recommendation === option.value
                      ? `border-primary ${option.color}`
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <div className="font-medium">{option.label}</div>
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="wouldWorkWithAgain"
              checked={formData.wouldWorkWithAgain}
              onChange={(e) => setFormData({ ...formData, wouldWorkWithAgain: e.target.checked })}
              className="rounded"
            />
            <label htmlFor="wouldWorkWithAgain" className="text-sm font-medium">
              I would be comfortable working with this candidate
            </label>
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
          <button
            type="submit"
            className="btn-primary flex-1"
            disabled={isLoading}
          >
            {isLoading ? 'Saving...' : 'Submit Feedback'}
          </button>
        </div>
      </form>
    </Modal>
  )
}