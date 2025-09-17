'use client'

import { useState } from 'react'
import { useMutation, useQuery } from 'convex/react'
import { api } from '../../../convex/_generated/api'
import { Id } from '../../../convex/_generated/dataModel'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Mail,
  Send,
  FileText,
  Plus,
  X,
  Paperclip,
  User,
  Briefcase
} from 'lucide-react'

interface EmailComposeModalProps {
  isOpen: boolean
  onClose: () => void
  candidateId: Id<"candidates">
  candidateName: string
  candidateEmail: string
  jobId?: Id<"jobs">
  jobTitle?: string
  threadId?: string
  replyToId?: Id<"emails">
}

interface EmailFormData {
  to: string
  cc: string[]
  bcc: string[]
  subject: string
  content: string
  template?: string
}

export function EmailComposeModal({
  isOpen,
  onClose,
  candidateId,
  candidateName,
  candidateEmail,
  jobId,
  jobTitle,
  threadId,
  replyToId
}: EmailComposeModalProps) {
  const [formData, setFormData] = useState<EmailFormData>({
    to: candidateEmail,
    cc: [],
    bcc: [],
    subject: replyToId ? 'Re: ' : '',
    content: '',
    template: undefined
  })
  const [showCcBcc, setShowCcBcc] = useState(false)
  const [ccInput, setCcInput] = useState('')
  const [bccInput, setBccInput] = useState('')

  const { toast } = useToast()
  const templates = useQuery(api.emails.getEmailTemplates, {})
  const sendEmail = useMutation(api.emails.sendEmail)
  const processTemplate = useMutation(api.emails.processEmailTemplate)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      await sendEmail({
        candidateId,
        jobId,
        to: formData.to,
        cc: formData.cc.length > 0 ? formData.cc : undefined,
        bcc: formData.bcc.length > 0 ? formData.bcc : undefined,
        subject: formData.subject,
        content: formData.content,
        template: formData.template,
        threadId,
        replyTo: replyToId,
        sender: 'John Doe' // This would come from auth context
      })

      toast({
        title: 'Email sent',
        description: `Message delivered to ${formData.to}.`,
      })
      onClose()
    } catch (error) {
      toast({
        title: 'Failed to send email',
        description: 'There was an issue delivering the email. Please try again.',
        variant: 'destructive',
      })
      console.error('Error sending email:', error)
    }
  }

  const handleTemplateSelect = async (templateId: string) => {
    if (!templateId) {
      setFormData({
        ...formData,
        template: undefined,
      })
      return
    }

    try {
      const processed = await processTemplate({
        templateId: templateId as Id<"emailTemplates">,
        variables: {
          candidateName,
          jobTitle: jobTitle || '',
          // Add more variables as needed
        }
      })

      setFormData({
        ...formData,
        subject: processed.subject,
        content: processed.content,
        template: processed.template
      })
    } catch (error) {
      toast({
        title: 'Template error',
        description: 'We were unable to load that template. Please try again.',
        variant: 'destructive',
      })
    }
  }

  const addCcEmail = () => {
    if (ccInput && !formData.cc.includes(ccInput)) {
      setFormData({ ...formData, cc: [...formData.cc, ccInput] })
      setCcInput('')
    }
  }

  const addBccEmail = () => {
    if (bccInput && !formData.bcc.includes(bccInput)) {
      setFormData({ ...formData, bcc: [...formData.bcc, bccInput] })
      setBccInput('')
    }
  }

  const removeCcEmail = (email: string) => {
    setFormData({ ...formData, cc: formData.cc.filter(e => e !== email) })
  }

  const removeBccEmail = (email: string) => {
    setFormData({ ...formData, bcc: formData.bcc.filter(e => e !== email) })
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            {replyToId ? 'Reply to' : 'Compose Email'}
          </DialogTitle>
          <DialogDescription>
            Send an email to {candidateName}
            {jobTitle && ` regarding ${jobTitle}`}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Template Selection */}
          <div className="space-y-2">
            <Label htmlFor="template">Email Template</Label>
            <Select value={formData.template ?? ''} onValueChange={handleTemplateSelect}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a template (optional)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">No template</SelectItem>
                {templates?.map((template) => (
                  <SelectItem key={template._id} value={template._id}>
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      {template.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Candidate & Job Info */}
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{candidateName}</span>
                  <span className="text-muted-foreground">({candidateEmail})</span>
                </div>
                {jobTitle && (
                  <div className="flex items-center gap-2">
                    <Briefcase className="h-4 w-4 text-muted-foreground" />
                    <span>{jobTitle}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Email Fields */}
          <div className="space-y-4">
            {/* To Field */}
            <div className="space-y-2">
              <Label htmlFor="to">To</Label>
              <Input
                id="to"
                type="email"
                value={formData.to}
                onChange={(e) => setFormData({ ...formData, to: e.target.value })}
                required
              />
            </div>

            {/* CC/BCC Toggle */}
            {!showCcBcc && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShowCcBcc(true)}
                className="text-muted-foreground"
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Cc/Bcc
              </Button>
            )}

            {/* CC Field */}
            {showCcBcc && (
              <div className="space-y-2">
                <Label htmlFor="cc">Cc</Label>
                <div className="flex gap-2">
                  <Input
                    id="cc"
                    type="email"
                    placeholder="Add Cc recipient"
                    value={ccInput}
                    onChange={(e) => setCcInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addCcEmail())}
                  />
                  <Button type="button" onClick={addCcEmail} size="sm">
                    Add
                  </Button>
                </div>
                {formData.cc.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {formData.cc.map((email) => (
                      <Badge key={email} variant="secondary">
                        {email}
                        <button
                          type="button"
                          onClick={() => removeCcEmail(email)}
                          className="ml-1 hover:text-destructive"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* BCC Field */}
            {showCcBcc && (
              <div className="space-y-2">
                <Label htmlFor="bcc">Bcc</Label>
                <div className="flex gap-2">
                  <Input
                    id="bcc"
                    type="email"
                    placeholder="Add Bcc recipient"
                    value={bccInput}
                    onChange={(e) => setBccInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addBccEmail())}
                  />
                  <Button type="button" onClick={addBccEmail} size="sm">
                    Add
                  </Button>
                </div>
                {formData.bcc.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {formData.bcc.map((email) => (
                      <Badge key={email} variant="secondary">
                        {email}
                        <button
                          type="button"
                          onClick={() => removeBccEmail(email)}
                          className="ml-1 hover:text-destructive"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Subject */}
            <div className="space-y-2">
              <Label htmlFor="subject">Subject</Label>
              <Input
                id="subject"
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                required
              />
            </div>

            {/* Content */}
            <div className="space-y-2">
              <Label htmlFor="content">Message</Label>
              <Textarea
                id="content"
                rows={12}
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                placeholder="Type your message here..."
                required
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-4 border-t">
            <div className="flex items-center gap-2">
              <Button type="button" variant="outline" size="sm">
                <Paperclip className="h-4 w-4 mr-1" />
                Attach Files
              </Button>
              <span className="text-sm text-muted-foreground">
                {formData.template && `Using template: ${formData.template}`}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit">
                <Send className="h-4 w-4 mr-1" />
                Send Email
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}