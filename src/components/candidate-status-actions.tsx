'use client'

import { useMutation, useQuery } from 'convex/react'
import {
  ArrowRight,
  Calendar,
  CheckCircle,
  Mail,
  MessageSquare,
  MoreHorizontal,
  Phone,
  User,
  XCircle,
} from 'lucide-react'
import { useState } from 'react'
import { EmailComposeModal } from '@/components/modals/email-compose-modal'
import { NotesModal } from '@/components/modals/notes-modal'
import { ConfirmationModal } from '@/components/ui/modal'
import { useToast } from '@/hooks/use-toast'
import { api } from '../../convex/_generated/api'
import type { Id } from '../../convex/_generated/dataModel'

interface CandidateStatusActionsProps {
  candidateId: Id<'candidates'>
  currentStatus: string
  candidateName: string
  compact?: boolean
}

const statusFlow = {
  applied: { next: 'screening', label: 'Move to Screening', icon: ArrowRight },
  screening: { next: 'interview', label: 'Schedule Interview', icon: Calendar },
  interview: { next: 'offer', label: 'Make Offer', icon: CheckCircle },
  offer: { next: 'hired', label: 'Mark as Hired', icon: User },
  hired: null,
  rejected: null,
  withdrawn: null,
}

const statusColors = {
  applied: 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400',
  screening: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
  interview: 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400',
  offer: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
  hired: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-400',
  rejected: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400',
  withdrawn: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400',
}

export function CandidateStatusActions({
  candidateId,
  currentStatus,
  candidateName,
  compact = false,
}: CandidateStatusActionsProps) {
  const { toast } = useToast()
  const updateStatus = useMutation(api.candidates.updateStatus)
  const candidate = useQuery(api.candidates.get, { id: candidateId })

  const [isUpdating, setIsUpdating] = useState(false)
  const [showRejectModal, setShowRejectModal] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)
  const [showEmailModal, setShowEmailModal] = useState(false)
  const [showNotesModal, setShowNotesModal] = useState(false)

  const handleStatusUpdate = async (newStatus: string, action: string) => {
    setIsUpdating(true)

    try {
      await updateStatus({
        id: candidateId,
        status: newStatus as any,
      })

      toast({
        title: `${action} Successful`,
        description: `${candidateName} has been moved to ${newStatus.charAt(0).toUpperCase() + newStatus.slice(1)}.`,
      })
    } catch (_error) {
      toast({
        title: 'Update Failed',
        description: 'There was an error updating the candidate status. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setIsUpdating(false)
    }
  }

  const handleReject = () => {
    handleStatusUpdate('rejected', 'Rejection')
    setShowRejectModal(false)
  }

  const currentFlow = statusFlow[currentStatus as keyof typeof statusFlow]

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <span className={`badge-clean ${statusColors[currentStatus as keyof typeof statusColors]}`}>
          {currentStatus}
        </span>

        {currentFlow && (
          <button
            onClick={() => handleStatusUpdate(currentFlow.next, currentFlow.label)}
            disabled={isUpdating}
            className="p-1 rounded-md hover:bg-accent transition-colors"
            title={currentFlow.label}
          >
            <currentFlow.icon className="h-4 w-4" />
          </button>
        )}

        {currentStatus !== 'rejected' && currentStatus !== 'withdrawn' && (
          <button
            onClick={() => setShowRejectModal(true)}
            disabled={isUpdating}
            className="p-1 rounded-md hover:bg-red-50 text-red-600 transition-colors"
            title="Reject candidate"
          >
            <XCircle className="h-4 w-4" />
          </button>
        )}
      </div>
    )
  }

  return (
    <>
      <div className="flex items-center gap-2">
        <span className={`badge-clean ${statusColors[currentStatus as keyof typeof statusColors]}`}>
          {currentStatus}
        </span>

        {/* Primary Action Button */}
        {currentFlow && (
          <button
            onClick={() => handleStatusUpdate(currentFlow.next, currentFlow.label)}
            disabled={isUpdating}
            className="btn-primary text-sm inline-flex items-center gap-2"
          >
            <currentFlow.icon className="h-4 w-4" />
            {isUpdating ? 'Updating...' : currentFlow.label}
          </button>
        )}

        {/* Secondary Actions Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className="p-2 rounded-md hover:bg-accent transition-colors"
            title="More actions"
          >
            <MoreHorizontal className="h-4 w-4" />
          </button>

          {showDropdown && (
            <div className="absolute right-0 top-full mt-2 w-48 bg-background border border-border rounded-md shadow-lg z-10">
              <div className="py-1">
                <button
                  onClick={() => {
                    setShowDropdown(false)
                    setShowEmailModal(true)
                  }}
                  className="w-full text-left px-4 py-2 text-sm hover:bg-accent flex items-center gap-2"
                >
                  <Mail className="h-4 w-4" />
                  Send Email
                </button>
                <button
                  onClick={() => {
                    setShowDropdown(false)
                    // Simple implementation - open phone dialer on mobile or show phone number
                    if (candidate?.phone) {
                      window.location.href = `tel:${candidate.phone}`
                    } else {
                      toast({
                        title: 'No Phone Number',
                        description: 'This candidate has no phone number on file.',
                      })
                    }
                  }}
                  className="w-full text-left px-4 py-2 text-sm hover:bg-accent flex items-center gap-2"
                >
                  <Phone className="h-4 w-4" />
                  Call Candidate
                </button>
                <button
                  onClick={() => {
                    setShowDropdown(false)
                    setShowNotesModal(true)
                  }}
                  className="w-full text-left px-4 py-2 text-sm hover:bg-accent flex items-center gap-2"
                >
                  <MessageSquare className="h-4 w-4" />
                  Add Note
                </button>

                {currentStatus !== 'rejected' && currentStatus !== 'withdrawn' && (
                  <>
                    <div className="border-t border-border my-1"></div>
                    <button
                      onClick={() => {
                        setShowDropdown(false)
                        setShowRejectModal(true)
                      }}
                      className="w-full text-left px-4 py-2 text-sm hover:bg-red-50 text-red-600 flex items-center gap-2"
                    >
                      <XCircle className="h-4 w-4" />
                      Reject Candidate
                    </button>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Reject Confirmation Modal */}
      <ConfirmationModal
        isOpen={showRejectModal}
        onClose={() => setShowRejectModal(false)}
        onConfirm={handleReject}
        title="Reject Candidate"
        message={`Are you sure you want to reject ${candidateName}? This action cannot be undone.`}
        confirmText="Reject"
        variant="destructive"
      />

      {/* Email Compose Modal */}
      {candidate && (
        <EmailComposeModal
          isOpen={showEmailModal}
          onClose={() => setShowEmailModal(false)}
          candidateId={candidateId}
          candidateName={candidateName}
          candidateEmail={candidate.email}
        />
      )}

      {/* Notes Modal */}
      <NotesModal
        isOpen={showNotesModal}
        onClose={() => setShowNotesModal(false)}
        entityType="candidate"
        entityId={candidateId}
        entityName={candidateName}
      />

      {/* Click outside to close dropdown */}
      {showDropdown && <div className="fixed inset-0 z-0" onClick={() => setShowDropdown(false)} />}
    </>
  )
}
