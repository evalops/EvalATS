'use client'

import { useMutation } from 'convex/react'
import { CheckCircle, type File, Upload, X } from 'lucide-react'
import { useCallback, useRef, useState } from 'react'
import { useToast } from '@/hooks/use-toast'
import { api } from '../../../convex/_generated/api'
import type { Id } from '../../../convex/_generated/dataModel'

interface FileUploadProps {
  type: 'resume' | 'coverLetter'
  candidateId?: Id<'candidates'>
  currentFileId?: Id<'_storage'>
  currentFileName?: string
  onUploadComplete?: (storageId: Id<'_storage'>, filename: string) => void
  onUploadError?: (error: string) => void
  onDelete?: () => void
  accept?: string
  maxSize?: number // in MB
  disabled?: boolean
}

export function FileUpload({
  type,
  candidateId,
  currentFileId,
  currentFileName,
  onUploadComplete,
  onUploadError,
  onDelete,
  accept = '.pdf,.doc,.docx,.txt',
  maxSize = 10,
  disabled = false,
}: FileUploadProps) {
  const { toast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [isDragOver, setIsDragOver] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)

  const generateUploadUrl = useMutation(api.files.generateUploadUrl)
  const updateCandidateResume = useMutation(api.files.updateCandidateResume)
  const updateCandidateCoverLetter = useMutation(api.files.updateCandidateCoverLetter)

  const validateFile = (file: File): string | null => {
    // Check file size
    if (file.size > maxSize * 1024 * 1024) {
      return `File size must be less than ${maxSize}MB`
    }

    // Check file type
    const allowedTypes = accept.split(',').map((t) => t.trim())
    const fileExtension = `.${file.name.split('.').pop()?.toLowerCase()}`

    if (!allowedTypes.includes(fileExtension)) {
      return `File type must be one of: ${allowedTypes.join(', ')}`
    }

    return null
  }

  const handleUpload = async (file: File) => {
    const validationError = validateFile(file)
    if (validationError) {
      toast({
        title: 'Invalid File',
        description: validationError,
        variant: 'destructive',
      })
      onUploadError?.(validationError)
      return
    }

    setIsUploading(true)
    setUploadProgress(0)

    try {
      // Step 1: Get upload URL
      const uploadUrl = await generateUploadUrl()

      // Step 2: Upload file with progress tracking
      const xhr = new XMLHttpRequest()

      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const progress = (event.loaded / event.total) * 100
          setUploadProgress(progress)
        }
      }

      const uploadPromise = new Promise<{ storageId: Id<'_storage'> }>((resolve, reject) => {
        xhr.onload = () => {
          if (xhr.status === 200) {
            resolve(JSON.parse(xhr.responseText))
          } else {
            reject(new Error('Upload failed'))
          }
        }
        xhr.onerror = () => reject(new Error('Upload failed'))
      })

      xhr.open('POST', uploadUrl)
      xhr.setRequestHeader('Content-Type', file.type)
      xhr.send(file)

      const { storageId } = await uploadPromise

      // Step 3: Update candidate record if candidateId provided
      if (candidateId) {
        if (type === 'resume') {
          await updateCandidateResume({
            candidateId,
            storageId,
            filename: file.name,
          })
        } else {
          await updateCandidateCoverLetter({
            candidateId,
            storageId,
            filename: file.name,
          })
        }
      }

      toast({
        title: 'Upload Successful',
        description: `${type === 'resume' ? 'Resume' : 'Cover letter'} uploaded successfully`,
      })

      onUploadComplete?.(storageId, file.name)
    } catch (_error) {
      const errorMessage = 'Failed to upload file. Please try again.'
      toast({
        title: 'Upload Failed',
        description: errorMessage,
        variant: 'destructive',
      })
      onUploadError?.(errorMessage)
    } finally {
      setIsUploading(false)
      setUploadProgress(0)
    }
  }

  const handleDragOver = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      if (!disabled) {
        setIsDragOver(true)
      }
    },
    [disabled]
  )

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setIsDragOver(false)

      if (disabled || isUploading) return

      const files = Array.from(e.dataTransfer.files)
      if (files.length > 0) {
        handleUpload(files[0])
      }
    },
    [disabled, isUploading, handleUpload]
  )

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files
      if (files && files.length > 0) {
        handleUpload(files[0])
      }
      // Reset input value so same file can be selected again
      e.target.value = ''
    },
    [handleUpload]
  )

  const handleClick = () => {
    if (!disabled && !isUploading) {
      fileInputRef.current?.click()
    }
  }

  // If file exists, show file info
  if (currentFileId && currentFileName && !isUploading) {
    return (
      <div className="border border-border rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-50 dark:bg-green-900/20 rounded-md">
              <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-sm font-medium">{currentFileName}</p>
              <p className="text-xs text-muted-foreground">
                {type === 'resume' ? 'Resume' : 'Cover Letter'} uploaded
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={handleClick} className="btn-secondary text-sm" disabled={disabled}>
              Replace
            </button>
            {onDelete && (
              <button
                onClick={onDelete}
                className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors"
                disabled={disabled}
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          onChange={handleFileSelect}
          className="hidden"
          disabled={disabled}
        />
      </div>
    )
  }

  // Upload area
  return (
    <div
      className={`relative border-2 border-dashed rounded-lg p-6 transition-colors ${
        isDragOver ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={handleClick}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleFileSelect}
        className="hidden"
        disabled={disabled || isUploading}
      />

      <div className="text-center">
        {isUploading ? (
          <div className="space-y-3">
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-full w-fit mx-auto">
              <Upload className="h-6 w-6 text-blue-600 dark:text-blue-400 animate-pulse" />
            </div>
            <div>
              <p className="text-sm font-medium">Uploading...</p>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mt-2">
                <div
                  className="bg-primary h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {Math.round(uploadProgress)}% complete
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-full w-fit mx-auto">
              <Upload className="h-6 w-6 text-muted-foreground" />
            </div>
            <div>
              <p className="text-sm font-medium">
                Upload {type === 'resume' ? 'Resume' : 'Cover Letter'}
              </p>
              <p className="text-xs text-muted-foreground">Drag and drop or click to select</p>
              <p className="text-xs text-muted-foreground mt-1">
                Accepted: {accept} • Max size: {maxSize}MB
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
