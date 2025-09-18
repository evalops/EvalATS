'use client'

import { useMutation, useQuery } from 'convex/react'
import { Download, FileText } from 'lucide-react'
import { useState } from 'react'
import { FileUpload } from '@/components/ui/file-upload'
import { Modal } from '@/components/ui/modal'
import { useToast } from '@/hooks/use-toast'
import { api } from '../../../convex/_generated/api'
import type { Id } from '../../../convex/_generated/dataModel'

interface CandidateFileModalProps {
  isOpen: boolean
  onClose: () => void
  candidateId: Id<'candidates'>
  candidateName: string
}

export function CandidateFileModal({
  isOpen,
  onClose,
  candidateId,
  candidateName,
}: CandidateFileModalProps) {
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)

  // Fetch candidate data
  const candidate = useQuery(api.candidates.get, { id: candidateId })
  const deleteFile = useMutation(api.files.deleteFile)
  const updateCandidateResume = useMutation(api.files.updateCandidateResume)
  const updateCandidateCoverLetter = useMutation(api.files.updateCandidateCoverLetter)

  const handleDeleteResume = async () => {
    if (!candidate?.resumeUrl) return

    setIsLoading(true)
    try {
      await deleteFile({ storageId: candidate.resumeUrl })
      await updateCandidateResume({
        candidateId,
        storageId: undefined,
        filename: undefined,
      })

      toast({
        title: 'Resume Deleted',
        description: 'Resume has been successfully deleted',
      })
    } catch (_error) {
      toast({
        title: 'Error',
        description: 'Failed to delete resume. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteCoverLetter = async () => {
    if (!candidate?.coverLetter) return

    setIsLoading(true)
    try {
      await deleteFile({ storageId: candidate.coverLetter })
      await updateCandidateCoverLetter({
        candidateId,
        storageId: undefined,
        filename: undefined,
      })

      toast({
        title: 'Cover Letter Deleted',
        description: 'Cover letter has been successfully deleted',
      })
    } catch (_error) {
      toast({
        title: 'Error',
        description: 'Failed to delete cover letter. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleDownloadFile = async (storageId: Id<'_storage'>, filename: string) => {
    try {
      const url = await fetch(`/api/files/download/${storageId}`)
      const blob = await url.blob()

      // Create download link
      const downloadUrl = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = downloadUrl
      link.download = filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(downloadUrl)
    } catch (_error) {
      toast({
        title: 'Download Failed',
        description: 'Failed to download file. Please try again.',
        variant: 'destructive',
      })
    }
  }

  if (!candidate) {
    return null
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Manage Files"
      description={`Upload and manage files for ${candidateName}`}
      size="lg"
    >
      <div className="px-6 py-4 space-y-6">
        {/* Resume Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Resume
            </h3>
            {candidate.resumeUrl && candidate.resumeFilename && (
              <div className="flex gap-2">
                <button
                  onClick={() =>
                    handleDownloadFile(candidate.resumeUrl!, candidate.resumeFilename!)
                  }
                  className="btn-secondary text-sm inline-flex items-center gap-2"
                  disabled={isLoading}
                >
                  <Download className="h-4 w-4" />
                  Download
                </button>
              </div>
            )}
          </div>

          <FileUpload
            type="resume"
            candidateId={candidateId}
            currentFileId={candidate.resumeUrl}
            currentFileName={candidate.resumeFilename}
            onUploadComplete={(_storageId, _filename) => {
              toast({
                title: 'Resume Updated',
                description: 'Resume has been successfully uploaded',
              })
            }}
            onDelete={handleDeleteResume}
            accept=".pdf,.doc,.docx"
            maxSize={10}
            disabled={isLoading}
          />
        </div>

        {/* Cover Letter Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Cover Letter
            </h3>
            {candidate.coverLetter && candidate.coverLetterFilename && (
              <div className="flex gap-2">
                <button
                  onClick={() =>
                    handleDownloadFile(candidate.coverLetter!, candidate.coverLetterFilename!)
                  }
                  className="btn-secondary text-sm inline-flex items-center gap-2"
                  disabled={isLoading}
                >
                  <Download className="h-4 w-4" />
                  Download
                </button>
              </div>
            )}
          </div>

          <FileUpload
            type="coverLetter"
            candidateId={candidateId}
            currentFileId={candidate.coverLetter}
            currentFileName={candidate.coverLetterFilename}
            onUploadComplete={(_storageId, _filename) => {
              toast({
                title: 'Cover Letter Updated',
                description: 'Cover letter has been successfully uploaded',
              })
            }}
            onDelete={handleDeleteCoverLetter}
            accept=".pdf,.doc,.docx,.txt"
            maxSize={10}
            disabled={isLoading}
          />
        </div>

        {/* Actions */}
        <div className="flex justify-end pt-4 border-t border-border">
          <button onClick={onClose} className="btn-secondary" disabled={isLoading}>
            Close
          </button>
        </div>
      </div>
    </Modal>
  )
}
