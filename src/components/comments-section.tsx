'use client'

import { useState, useRef, useEffect } from 'react'
import { useQuery, useMutation } from 'convex/react'
import { api } from '../../convex/_generated/api'
import { Id } from '../../convex/_generated/dataModel'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import {
  MessageSquare,
  Send,
  Reply,
  Edit2,
  Trash2,
  MoreVertical,
  AtSign,
  Smile,
  Paperclip,
  ThumbsUp,
  Heart,
  Star,
  Flag
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { cn } from '@/lib/utils'
import { useUser } from '@clerk/nextjs'

interface CommentsSectionProps {
  entityType: 'candidate' | 'job' | 'interview'
  entityId: string
  className?: string
}

interface Comment {
  _id: Id<'comments'>
  _creationTime: number
  content: string
  authorId: Id<'teamMembers'>
  author?: {
    _id: Id<'teamMembers'>
    _creationTime: number
    department?: string
    avatar?: string
    name: string
    email: string
    role: string
    createdAt: string
    userId: string
    isActive: boolean
    permissions: string[]
  } | null
  entityType: string
  entityId: string
  createdAt: string
  isEdited: boolean
  editedAt?: string
  parentId?: Id<'comments'>
  mentions: Id<'teamMembers'>[]
  mentionedUsers?: Array<{
    _id: Id<'teamMembers'>
    _creationTime: number
    department?: string
    avatar?: string
    name: string
    email: string
    role: string
    createdAt: string
    userId: string
    isActive: boolean
    permissions: string[]
  } | null>
  reactions?: Array<{ emoji: string; userId: Id<'teamMembers'> }>
  isDeleted: boolean
  replies?: Comment[]
}

const reactionEmojis = [
  { emoji: '👍', label: 'Like' },
  { emoji: '❤️', label: 'Love' },
  { emoji: '⭐', label: 'Star' },
  { emoji: '🎉', label: 'Celebrate' },
  { emoji: '🤔', label: 'Thinking' },
  { emoji: '👀', label: 'Looking' },
]

export function CommentsSection({ entityType, entityId, className }: CommentsSectionProps) {
  const { user } = useUser()
  const [newComment, setNewComment] = useState('')
  const [replyingTo, setReplyingTo] = useState<Id<'comments'> | null>(null)
  const [editingComment, setEditingComment] = useState<Id<'comments'> | null>(null)
  const [editContent, setEditContent] = useState('')
  const [showMentions, setShowMentions] = useState(false)
  const [mentionSearch, setMentionSearch] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Get current team member
  const teamMembers = useQuery(api.teams.getTeamMembers)
  const currentMember = teamMembers?.find(m => m.userId === user?.id)

  // Get comments for this entity
  const comments = useQuery(api.teams.getComments, {
    entityType,
    entityId,
  })

  // Mutations
  const addComment = useMutation(api.teams.addComment)
  const editComment = useMutation(api.teams.editComment)
  const deleteComment = useMutation(api.teams.deleteComment)
  const addReaction = useMutation(api.teams.addReaction)
  const removeReaction = useMutation(api.teams.removeReaction)

  // Organize comments into threads
  const organizeComments = (comments: Comment[] | undefined) => {
    if (!comments) return []

    const commentMap = new Map<string, Comment>()
    const rootComments: Comment[] = []

    // First pass: create map
    comments.forEach(comment => {
      commentMap.set(comment._id, { ...comment, replies: [] })
    })

    // Second pass: build tree
    comments.forEach(comment => {
      const mappedComment = commentMap.get(comment._id)!
      if (comment.parentId) {
        const parent = commentMap.get(comment.parentId)
        if (parent) {
          parent.replies = parent.replies || []
          parent.replies.push(mappedComment)
        }
      } else {
        rootComments.push(mappedComment)
      }
    })

    return rootComments
  }

  const threadedComments = organizeComments(comments)

  // Handle mention detection
  const handleCommentChange = (value: string) => {
    setNewComment(value)

    // Check for @ mentions
    const lastAtIndex = value.lastIndexOf('@')
    if (lastAtIndex >= 0) {
      const textAfterAt = value.substring(lastAtIndex + 1)
      const spaceIndex = textAfterAt.indexOf(' ')

      if (spaceIndex === -1 || spaceIndex > 0) {
        setShowMentions(true)
        setMentionSearch(spaceIndex === -1 ? textAfterAt : textAfterAt.substring(0, spaceIndex))
      } else {
        setShowMentions(false)
      }
    } else {
      setShowMentions(false)
    }
  }

  // Handle mention selection
  const insertMention = (member: any) => {
    const lastAtIndex = newComment.lastIndexOf('@')
    const beforeAt = newComment.substring(0, lastAtIndex)
    const afterSearch = newComment.substring(lastAtIndex + 1 + mentionSearch.length)

    setNewComment(`${beforeAt}@${member.name} ${afterSearch}`)
    setShowMentions(false)
    textareaRef.current?.focus()
  }

  // Submit comment
  const handleSubmit = async () => {
    if (!newComment.trim() || !currentMember) return

    // Extract mentions
    const mentionRegex = /@(\w+\s?\w*)/g
    const mentionedNames = [...newComment.matchAll(mentionRegex)].map(match => match[1])
    const mentionedMembers = teamMembers?.filter(m =>
      mentionedNames.some(name => m.name.toLowerCase().includes(name.toLowerCase()))
    ) || []

    await addComment({
      entityType,
      entityId,
      authorId: currentMember._id,
      content: newComment,
      parentId: replyingTo || undefined,
      mentions: mentionedMembers.map(m => m._id),
    })

    setNewComment('')
    setReplyingTo(null)
  }

  // Edit comment
  const handleEdit = async (commentId: Id<'comments'>) => {
    if (!editContent.trim()) return

    await editComment({
      commentId,
      content: editContent,
    })

    setEditingComment(null)
    setEditContent('')
  }

  // Delete comment
  const handleDelete = async (commentId: Id<'comments'>) => {
    if (confirm('Are you sure you want to delete this comment?')) {
      await deleteComment({ commentId })
    }
  }

  // Toggle reaction
  const toggleReaction = async (commentId: Id<'comments'>, emoji: string) => {
    if (!currentMember) return

    const comment = comments?.find(c => c._id === commentId)
    const existingReaction = comment?.reactions?.find(
      r => r.userId === currentMember._id && r.emoji === emoji
    )

    if (existingReaction) {
      await removeReaction({ commentId, emoji })
    } else {
      await addReaction({ commentId, emoji, userId: currentMember._id })
    }
  }

  // Render comment component
  const CommentItem = ({ comment, depth = 0 }: { comment: Comment; depth?: number }) => {
    const isAuthor = currentMember?._id === comment.authorId
    const isEditing = editingComment === comment._id

    return (
      <div className={cn('group', depth > 0 && 'ml-12 mt-3')}>
        <div className="flex gap-3">
          <Avatar className="h-8 w-8 flex-shrink-0">
            <AvatarImage src={comment.author?.avatar} />
            <AvatarFallback>
              {comment.author?.name?.split(' ').map(n => n[0]).join('') || '?'}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <span className="font-medium text-sm">
                  {comment.author?.name}
                </span>
                <Badge variant="outline" className="text-xs">
                  {comment.author?.role}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                </span>
                {comment.isEdited && (
                  <span className="text-xs text-muted-foreground">(edited)</span>
                )}
              </div>

              {isAuthor && !isEditing && (
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 opacity-0 group-hover:opacity-100"
                    >
                      <MoreVertical className="h-3 w-3" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-40" align="end">
                    <div className="space-y-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full justify-start"
                        onClick={() => {
                          setEditingComment(comment._id)
                          setEditContent(comment.content)
                        }}
                      >
                        <Edit2 className="h-3 w-3 mr-2" />
                        Edit
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full justify-start text-destructive"
                        onClick={() => handleDelete(comment._id)}
                      >
                        <Trash2 className="h-3 w-3 mr-2" />
                        Delete
                      </Button>
                    </div>
                  </PopoverContent>
                </Popover>
              )}
            </div>

            {isEditing ? (
              <div className="mt-2 space-y-2">
                <Textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="min-h-[60px]"
                  autoFocus
                />
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => handleEdit(comment._id)}
                  >
                    Save
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setEditingComment(null)
                      setEditContent('')
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <p className="text-sm mt-1 whitespace-pre-wrap">
                  {comment.content.split(/(@\w+\s?\w*)/g).map((part, i) => {
                    if (part.startsWith('@')) {
                      const mentionedUser = comment.mentionedUsers?.find(u =>
                        u && part.includes(u.name)
                      )
                      return mentionedUser ? (
                        <span key={i} className="text-blue-600 font-medium">
                          {part}
                        </span>
                      ) : part
                    }
                    return part
                  })}
                </p>

                <div className="flex items-center gap-1 mt-2">
                  {/* Reactions */}
                  <div className="flex items-center gap-1">
                    {reactionEmojis.map(({ emoji, label }) => {
                      const reactions = comment.reactions?.filter(r => r.emoji === emoji) || []
                      const hasReacted = reactions.some(r => r.userId === currentMember?._id)

                      return reactions.length > 0 || hasReacted ? (
                        <Button
                          key={emoji}
                          variant={hasReacted ? 'secondary' : 'ghost'}
                          size="sm"
                          className="h-7 px-2"
                          onClick={() => toggleReaction(comment._id, emoji)}
                        >
                          <span className="text-sm">{emoji}</span>
                          {reactions.length > 0 && (
                            <span className="ml-1 text-xs">{reactions.length}</span>
                          )}
                        </Button>
                      ) : null
                    })}

                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-7 px-2">
                          <Smile className="h-3 w-3" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-2" align="start">
                        <div className="flex gap-1">
                          {reactionEmojis.map(({ emoji, label }) => (
                            <Button
                              key={emoji}
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0"
                              onClick={() => toggleReaction(comment._id, emoji)}
                              title={label}
                            >
                              {emoji}
                            </Button>
                          ))}
                        </div>
                      </PopoverContent>
                    </Popover>
                  </div>

                  {/* Reply button */}
                  {depth < 2 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2 ml-2"
                      onClick={() => setReplyingTo(comment._id)}
                    >
                      <Reply className="h-3 w-3 mr-1" />
                      Reply
                    </Button>
                  )}
                </div>
              </>
            )}

            {/* Replies */}
            {comment.replies && comment.replies.length > 0 && (
              <div className="mt-3">
                {comment.replies.map(reply => (
                  <CommentItem key={reply._id} comment={reply} depth={depth + 1} />
                ))}
              </div>
            )}

            {/* Reply input */}
            {replyingTo === comment._id && (
              <div className="mt-3">
                <div className="flex gap-2">
                  <Textarea
                    placeholder="Write a reply..."
                    value={newComment}
                    onChange={(e) => handleCommentChange(e.target.value)}
                    className="min-h-[60px]"
                    autoFocus
                  />
                  <div className="flex flex-col gap-2">
                    <Button size="sm" onClick={handleSubmit}>
                      <Send className="h-3 w-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setReplyingTo(null)
                        setNewComment('')
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <Card className={cn('p-4', className)}>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Comments
            {comments && comments.length > 0 && (
              <Badge variant="secondary">{comments.length}</Badge>
            )}
          </h3>
        </div>

        {/* Comment input */}
        <div className="relative">
          <div className="flex gap-3">
            <Avatar className="h-8 w-8">
              <AvatarImage src={user?.imageUrl} />
              <AvatarFallback>
                {user?.firstName?.[0]}{user?.lastName?.[0]}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <Textarea
                ref={textareaRef}
                placeholder="Write a comment... Use @ to mention team members"
                value={newComment}
                onChange={(e) => handleCommentChange(e.target.value)}
                className="min-h-[80px]"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                    handleSubmit()
                  }
                }}
              />

              {/* Mention suggestions */}
              {showMentions && teamMembers && (
                <Card className="absolute z-10 mt-1 p-2 w-64">
                  <div className="text-xs text-muted-foreground mb-1">Team Members</div>
                  <div className="space-y-1 max-h-48 overflow-y-auto">
                    {teamMembers
                      .filter(m => m.name.toLowerCase().includes(mentionSearch.toLowerCase()))
                      .slice(0, 5)
                      .map(member => (
                        <Button
                          key={member._id}
                          variant="ghost"
                          size="sm"
                          className="w-full justify-start"
                          onClick={() => insertMention(member)}
                        >
                          <Avatar className="h-5 w-5 mr-2">
                            <AvatarImage src={member.avatar} />
                            <AvatarFallback>
                              {member.name.split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-sm">{member.name}</span>
                          <Badge variant="outline" className="ml-auto text-xs">
                            {member.role}
                          </Badge>
                        </Button>
                      ))}
                  </div>
                </Card>
              )}

              <div className="flex items-center justify-between mt-2">
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm">
                    <Paperclip className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm">
                    <AtSign className="h-4 w-4" />
                  </Button>
                </div>
                <Button
                  size="sm"
                  onClick={handleSubmit}
                  disabled={!newComment.trim()}
                >
                  <Send className="h-4 w-4 mr-1" />
                  Comment
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Comments list */}
        <div className="space-y-4">
          {threadedComments.length > 0 ? (
            threadedComments.map(comment => (
              <CommentItem key={comment._id} comment={comment} />
            ))
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-20" />
              <p className="text-sm">No comments yet</p>
              <p className="text-xs mt-1">Be the first to comment</p>
            </div>
          )}
        </div>
      </div>
    </Card>
  )
}