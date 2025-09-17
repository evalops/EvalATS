'use client'

import { useState } from 'react'
import { Modal } from '@/components/ui/modal'
import { useToast } from '@/hooks/use-toast'
import { useMutation } from 'convex/react'
import { api } from '../../../convex/_generated/api'
import { MapPin, Clock, DollarSign, Users, Building, Calendar } from 'lucide-react'

interface JobCreationModalProps {
  isOpen: boolean
  onClose: () => void
}

const jobTypes = [
  { value: 'full-time', label: 'Full-time' },
  { value: 'part-time', label: 'Part-time' },
  { value: 'contract', label: 'Contract' },
] as const

const departments = [
  'Engineering',
  'Product',
  'Design',
  'Marketing',
  'Sales',
  'HR',
  'Finance',
  'Operations',
  'Customer Success',
  'Legal',
]

const urgencyLevels = [
  { value: 'low', label: 'Low Priority', color: 'text-green-600' },
  { value: 'medium', label: 'Medium Priority', color: 'text-yellow-600' },
  { value: 'high', label: 'High Priority', color: 'text-red-600' },
]

type JobType = (typeof jobTypes)[number]['value']

interface JobFormData {
  title: string
  department: string
  location: string
  type: JobType
  urgency: 'low' | 'medium' | 'high'
  salaryMin: string
  salaryMax: string
  description: string
  requirements: string[]
}

export function JobCreationModal({ isOpen, onClose }: JobCreationModalProps) {
  const { toast } = useToast()
  const createJob = useMutation(api.jobs.create)

  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState<JobFormData>({
    title: '',
    department: '',
    location: '',
    type: 'full-time',
    urgency: 'medium',
    salaryMin: '',
    salaryMax: '',
    description: '',
    requirements: [''],
  })

  const [errors, setErrors] = useState<Partial<Record<keyof JobFormData, string>>>({})

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof JobFormData, string>> = {}

    if (!formData.title.trim()) {
      newErrors.title = 'Job title is required'
    }
    if (!formData.department) {
      newErrors.department = 'Department is required'
    }
    if (!formData.location.trim()) {
      newErrors.location = 'Location is required'
    }
    if (!formData.description.trim()) {
      newErrors.description = 'Job description is required'
    }
    if (formData.salaryMin && formData.salaryMax) {
      const min = parseInt(formData.salaryMin.replace(/,/g, ''))
      const max = parseInt(formData.salaryMax.replace(/,/g, ''))
      if (min >= max) {
        newErrors.salaryMin = 'Minimum salary must be less than maximum'
      }
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
      // Filter out empty requirements
      const requirements = formData.requirements.filter(req => req.trim() !== '')

      // Convert salary strings to numbers
      const salaryMin = formData.salaryMin ? parseInt(formData.salaryMin.replace(/,/g, '')) : undefined
      const salaryMax = formData.salaryMax ? parseInt(formData.salaryMax.replace(/,/g, '')) : undefined

      await createJob({
        title: formData.title.trim(),
        department: formData.department,
        location: formData.location.trim(),
        type: formData.type,
        urgency: formData.urgency,
        salaryMin,
        salaryMax,
        description: formData.description.trim(),
        requirements,
      })

      toast({
        title: 'Job Created Successfully',
        description: `${formData.title} has been posted and is now accepting applications.`,
      })

      // Reset form
      setFormData({
        title: '',
        department: '',
        location: '',
        type: 'full-time',
        urgency: 'medium',
        salaryMin: '',
        salaryMax: '',
        description: '',
        requirements: [''],
      })

      onClose()
    } catch (error) {
      toast({
        title: 'Error Creating Job',
        description: 'There was an error creating the job posting. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleRequirementChange = (index: number, value: string) => {
    const newRequirements = [...formData.requirements]
    newRequirements[index] = value
    setFormData({ ...formData, requirements: newRequirements })
  }

  const addRequirement = () => {
    setFormData({
      ...formData,
      requirements: [...formData.requirements, '']
    })
  }

  const removeRequirement = (index: number) => {
    if (formData.requirements.length > 1) {
      const newRequirements = formData.requirements.filter((_, i) => i !== index)
      setFormData({ ...formData, requirements: newRequirements })
    }
  }

  const formatSalary = (value: string) => {
    const number = value.replace(/[^\d]/g, '')
    return number.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Post New Job"
      description="Create a new job posting to start receiving applications"
      size="lg"
    >
      <form onSubmit={handleSubmit} className="px-6 py-4 space-y-6">
        {/* Basic Information */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Basic Information</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-2">
                Job Title *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className={`input-clean ${errors.title ? 'border-red-500' : ''}`}
                placeholder="e.g. Senior Frontend Engineer"
              />
              {errors.title && (
                <p className="text-sm text-red-500 mt-1">{errors.title}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-2">
                Department *
              </label>
              <select
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                className={`input-clean ${errors.department ? 'border-red-500' : ''}`}
              >
                <option value="">Select Department</option>
                {departments.map((dept) => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
              {errors.department && (
                <p className="text-sm text-red-500 mt-1">{errors.department}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-2">
                <MapPin className="inline h-4 w-4 mr-1" />
                Location *
              </label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className={`input-clean ${errors.location ? 'border-red-500' : ''}`}
                placeholder="e.g. San Francisco, CA or Remote"
              />
              {errors.location && (
                <p className="text-sm text-red-500 mt-1">{errors.location}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-2">
                <Clock className="inline h-4 w-4 mr-1" />
                Job Type
              </label>
              <select
                value={formData.type}
                onChange={(e) =>
                  setFormData({ ...formData, type: e.target.value as JobType })
                }
                className="input-clean"
              >
                {jobTypes.map((type) => (
                  <option key={type.value} value={type.value}>{type.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-2">
                Priority Level
              </label>
              <select
                value={formData.urgency}
                onChange={(e) =>
                  setFormData({ ...formData, urgency: e.target.value as JobFormData['urgency'] })
                }
                className="input-clean"
              >
                {urgencyLevels.map((level) => (
                  <option key={level.value} value={level.value}>{level.label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Compensation */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">
            <DollarSign className="inline h-5 w-5 mr-2" />
            Compensation
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-2">
                Minimum Salary (Annual)
              </label>
              <input
                type="text"
                value={formData.salaryMin}
                onChange={(e) => setFormData({ ...formData, salaryMin: formatSalary(e.target.value) })}
                className={`input-clean ${errors.salaryMin ? 'border-red-500' : ''}`}
                placeholder="80,000"
              />
              {errors.salaryMin && (
                <p className="text-sm text-red-500 mt-1">{errors.salaryMin}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-2">
                Maximum Salary (Annual)
              </label>
              <input
                type="text"
                value={formData.salaryMax}
                onChange={(e) => setFormData({ ...formData, salaryMax: formatSalary(e.target.value) })}
                className="input-clean"
                placeholder="120,000"
              />
            </div>
          </div>
        </div>

        {/* Job Description */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Job Description</h3>

          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-2">
              Description *
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className={`input-clean ${errors.description ? 'border-red-500' : ''}`}
              rows={4}
              placeholder="Describe the role, responsibilities, and what makes this position exciting..."
            />
            {errors.description && (
              <p className="text-sm text-red-500 mt-1">{errors.description}</p>
            )}
          </div>
        </div>

        {/* Requirements */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Requirements</h3>

          {formData.requirements.map((requirement, index) => (
            <div key={index} className="flex gap-2">
              <input
                type="text"
                value={requirement}
                onChange={(e) => handleRequirementChange(index, e.target.value)}
                className="input-clean flex-1"
                placeholder="e.g. 3+ years of React experience"
              />
              {formData.requirements.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeRequirement(index)}
                  className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-md transition-colors"
                >
                  Remove
                </button>
              )}
            </div>
          ))}

          <button
            type="button"
            onClick={addRequirement}
            className="btn-secondary text-sm"
          >
            Add Requirement
          </button>
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
            {isLoading ? 'Creating Job...' : 'Post Job'}
          </button>
        </div>
      </form>
    </Modal>
  )
}