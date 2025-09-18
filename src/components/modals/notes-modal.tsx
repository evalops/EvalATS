'use client'

import { useState } from 'react'
import { useQuery, useMutation } from 'convex/react'
import { api } from '../../../convex/_generated/api'
import { Id } from '../../../convex/_generated/dataModel'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { formatDistanceToNow } from 'date-fns'
import { MessageSquare, Send } from 'lucide-react'

interface NotesModalProps {
  isOpen: boolean
  onClose: () => void
  entityType: 'candidate' | 'job' | 'interview'
  entityId: string
  entityName?: string
}

export function NotesModal({ isOpen, onClose, entityType, entityId, entityName }: NotesModalProps) {
  const [newNote, setNewNote] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Get current user and comments
  const currentUser = useQuery(api.users.getCurrentUser)
  const comments = useQuery(api.teams.getComments, { 
    entityType, 
    entityId 
  }) || []

  // Mutations
  const addComment = useMutation(api.teams.addComment)

  const handleSubmitNote = async () => {
    if (!newNote.trim() || !currentUser || isSubmitting) return

    setIsSubmitting(true)
    try {
      await addComment({
        entityType,
        entityId,
        authorId: currentUser._id,
        content: newNote.trim(),
      })
      setNewNote('')
    } catch (error) {
      console.error('Failed to add note:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Notes {entityName && `for ${entityName}`}
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          {/* Add new note */}
          <div className="space-y-3">
            <Textarea
              placeholder="Add a note..."
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              className="min-h-[100px]"
            />
            <div className="flex justify-end">
              <Button 
                onClick={handleSubmitNote}
                disabled={!newNote.trim() || isSubmitting}
                className="flex items-center gap-2"
              >
                <Send className="h-4 w-4" />
                {isSubmitting ? 'Adding...' : 'Add Note'}
              </Button>
            </div>
          </div>

          {/* Existing notes */}
          <ScrollArea className="flex-1 max-h-[400px]">
            {comments.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                No notes yet. Add the first note above.
              </div>
            ) : (
              <div className="space-y-4">
                {comments.map((comment) => (
                  <div key={comment._id} className="flex gap-3 p-4 border rounded-lg">
                    <Avatar className="h-8 w-8 flex-shrink-0">
                      <AvatarImage src={comment.author?.avatar} />
                      <AvatarFallback>
                        {comment.author?.name?.charAt(0) || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2 text-sm">
                        <span className="font-medium">{comment.author?.name}</span>
                        <span className="text-muted-foreground">
                          {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                        </span>
                      </div>
                      <p className="text-sm leading-relaxed whitespace-pre-wrap">
                        {comment.content}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  )
}
