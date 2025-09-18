'use client'

import { useQuery } from 'convex/react'
import { AlertCircle, Check, Clock, Forward, Mail, MoreVertical, Reply, Send } from 'lucide-react'
import { useState } from 'react'
import { EmailComposeModal } from '@/components/modals/email-compose-modal'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { api } from '../../../convex/_generated/api'
import type { Id } from '../../../convex/_generated/dataModel'

interface EmailThreadProps {
  candidateId: Id<'candidates'>
  candidateName: string
  candidateEmail: string
  jobId?: Id<'jobs'>
  jobTitle?: string
}

interface EmailItemProps {
  email: {
    _id: Id<'emails'>
    from: string
    to: string
    subject: string
    content: string
    status: 'draft' | 'sent' | 'delivered' | 'failed'
    sentAt?: string
    deliveredAt?: string
    readAt?: string
    sender: string
    createdAt: string
    threadId?: string
  }
  candidateId: Id<'candidates'>
  candidateName: string
  candidateEmail: string
  jobId?: Id<'jobs'>
  jobTitle?: string
  onReply: (emailId: Id<'emails'>, threadId?: string) => void
}

function EmailItem({
  email,
  candidateId,
  candidateName,
  candidateEmail,
  jobId,
  jobTitle,
  onReply,
}: EmailItemProps) {
  const getStatusIcon = () => {
    switch (email.status) {
      case 'draft':
        return <Clock className="h-4 w-4 text-gray-500" />
      case 'sent':
        return <Send className="h-4 w-4 text-blue-500" />
      case 'delivered':
        return <Check className="h-4 w-4 text-green-500" />
      case 'failed':
        return <AlertCircle className="h-4 w-4 text-red-500" />
      default:
        return <Clock className="h-4 w-4 text-gray-500" />
    }
  }

  const getStatusText = () => {
    switch (email.status) {
      case 'draft':
        return 'Draft'
      case 'sent':
        return 'Sent'
      case 'delivered':
        return 'Delivered'
      case 'failed':
        return 'Failed'
      default:
        return 'Unknown'
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString()
  }

  return (
    <Card className="mb-4">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-sm font-medium">
              {email.sender.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-medium">{email.sender}</span>
                <span className="text-sm text-muted-foreground">({email.from})</span>
              </div>
              <div className="text-sm text-muted-foreground">to {email.to}</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="flex items-center gap-1">
              {getStatusIcon()}
              {getStatusText()}
            </Badge>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onReply(email._id, email.threadId)}>
                  <Reply className="h-4 w-4 mr-2" />
                  Reply
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Forward className="h-4 w-4 mr-2" />
                  Forward
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        <div className="text-sm text-muted-foreground">
          {email.sentAt ? formatDate(email.sentAt) : formatDate(email.createdAt)}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="font-medium text-lg">{email.subject}</div>
          <div className="prose prose-sm max-w-none">
            <div className="whitespace-pre-wrap text-sm leading-relaxed">{email.content}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export function EmailThread({
  candidateId,
  candidateName,
  candidateEmail,
  jobId,
  jobTitle,
}: EmailThreadProps) {
  const [isComposeOpen, setIsComposeOpen] = useState(false)
  const [replyToId, setReplyToId] = useState<Id<'emails'> | undefined>()
  const [threadId, setThreadId] = useState<string | undefined>()

  const emails = useQuery(api.emails.getEmailsByCandidate, { candidateId })

  const handleReply = (emailId: Id<'emails'>, emailThreadId?: string) => {
    setReplyToId(emailId)
    setThreadId(emailThreadId)
    setIsComposeOpen(true)
  }

  const handleComposeNew = () => {
    setReplyToId(undefined)
    setThreadId(undefined)
    setIsComposeOpen(true)
  }

  const handleCloseCompose = () => {
    setIsComposeOpen(false)
    setReplyToId(undefined)
    setThreadId(undefined)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Mail className="h-5 w-5" />
          <h3 className="text-lg font-semibold">Email Communications</h3>
          <Badge variant="secondary">{emails?.length || 0} emails</Badge>
        </div>
        <Button onClick={handleComposeNew}>
          <Mail className="h-4 w-4 mr-2" />
          Send Email
        </Button>
      </div>

      <div className="h-[600px] overflow-y-auto">
        {emails && emails.length > 0 ? (
          <div className="space-y-4">
            {emails.map((email) => (
              <EmailItem
                key={email._id}
                email={email}
                candidateId={candidateId}
                candidateName={candidateName}
                candidateEmail={candidateEmail}
                jobId={jobId}
                jobTitle={jobTitle}
                onReply={handleReply}
              />
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="py-8 text-center">
              <Mail className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h4 className="text-lg font-medium mb-2">No emails yet</h4>
              <p className="text-muted-foreground mb-4">
                Start a conversation with {candidateName}
              </p>
              <Button onClick={handleComposeNew}>
                <Mail className="h-4 w-4 mr-2" />
                Send First Email
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      <EmailComposeModal
        isOpen={isComposeOpen}
        onClose={handleCloseCompose}
        candidateId={candidateId}
        candidateName={candidateName}
        candidateEmail={candidateEmail}
        jobId={jobId}
        jobTitle={jobTitle}
        threadId={threadId}
        replyToId={replyToId}
      />
    </div>
  )
}
