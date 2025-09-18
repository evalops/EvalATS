'use client'

import { useMemo } from 'react'
import { useQuery } from 'convex/react'
import { api } from '../../../convex/_generated/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import {
  Activity as ActivityIcon,
  Bell,
  Calendar,
  CheckCircle,
  MessageSquare,
  Send,
  UserPlus,
  XCircle,
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

type ActivityEntry = {
  _id: string
  action: string
  actor?: {
    id?: string
    name?: string
    avatar?: string
  }
  target?: {
    type?: string
    id?: string
    name?: string
  }
  metadata?: {
    message?: string
    status?: string
  }
  timestamp?: string
}

type ActivityDisplay = {
  icon: typeof ActivityIcon
  colorClass: string
  getTitle: (activity: ActivityEntry) => string
  getDescription?: (activity: ActivityEntry) => string | undefined
}

const ACTIVITY_DISPLAY_MAP: Record<string, ActivityDisplay> = {
  candidate_applied: {
    icon: Send,
    colorClass: 'text-blue-500',
    getTitle: (activity) =>
      `${activity.target?.name ?? 'A candidate'} applied`,
    getDescription: (activity) =>
      activity.actor?.name
        ? `Reviewed by ${activity.actor.name}`
        : 'New application received',
  },
  status_changed: {
    icon: ActivityIcon,
    colorClass: 'text-amber-500',
    getTitle: (activity) =>
      `${activity.actor?.name ?? 'Someone'} updated ${activity.target?.name ?? 'a candidate'}`,
    getDescription: (activity) =>
      activity.metadata?.status
        ? `Status set to ${humanize(activity.metadata.status)}`
        : 'Status updated',
  },
  interview_scheduled: {
    icon: Calendar,
    colorClass: 'text-yellow-500',
    getTitle: (activity) =>
      `${activity.actor?.name ?? 'Someone'} scheduled an interview`,
    getDescription: (activity) =>
      activity.target?.name
        ? `For ${activity.target.name}`
        : 'Interview added to the calendar',
  },
  feedback_submitted: {
    icon: CheckCircle,
    colorClass: 'text-green-500',
    getTitle: (activity) =>
      `${activity.actor?.name ?? 'An interviewer'} submitted feedback`,
    getDescription: (activity) =>
      activity.target?.name
        ? `Feedback for ${activity.target.name}`
        : undefined,
  },
  comment_added: {
    icon: MessageSquare,
    colorClass: 'text-purple-500',
    getTitle: (activity) =>
      `${activity.actor?.name ?? 'A teammate'} left a comment`,
    getDescription: (activity) =>
      activity.target?.name
        ? `On ${activity.target.name}`
        : undefined,
  },
  offer_sent: {
    icon: Send,
    colorClass: 'text-emerald-500',
    getTitle: (activity) =>
      `${activity.actor?.name ?? 'Someone'} sent an offer`,
    getDescription: (activity) =>
      activity.target?.name
        ? `Offer for ${activity.target.name}`
        : 'Offer communication sent',
  },
  candidate_rejected: {
    icon: XCircle,
    colorClass: 'text-red-500',
    getTitle: (activity) =>
      `${activity.actor?.name ?? 'A teammate'} rejected ${activity.target?.name ?? 'a candidate'}`,
  },
  task_completed: {
    icon: CheckCircle,
    colorClass: 'text-green-500',
    getTitle: (activity) =>
      `${activity.actor?.name ?? 'A teammate'} completed a task`,
    getDescription: (activity) =>
      activity.target?.name
        ? `Related to ${activity.target.name}`
        : undefined,
  },
  team_member_added: {
    icon: UserPlus,
    colorClass: 'text-sky-500',
    getTitle: (activity) =>
      `${activity.actor?.name ?? 'A teammate'} joined the hiring team`,
    getDescription: (activity) =>
      activity.target?.name
        ? `Job: ${activity.target.name}`
        : undefined,
  },
  notification: {
    icon: Bell,
    colorClass: 'text-orange-500',
    getTitle: () => 'Workflow notification',
    getDescription: (activity) =>
      activity.metadata?.message ??
      (activity.target?.name
        ? `Update for ${activity.target.name}`
        : 'Automated workflow update'),
  },
}

export function RecentActivity() {
  const activities = useQuery(api.teams.getActivityFeed, { limit: 10 })

  const isLoading = activities === undefined
  const normalizedActivities = useMemo(
    () => activities?.map((activity) => activity as ActivityEntry) ?? [],
    [activities]
  )

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-4">
            {[...Array(4)].map((_, index) => (
              <div key={index} className="flex items-start gap-4 animate-pulse">
                <div className="mt-0.5 h-8 w-8 rounded-full bg-muted" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 w-1/2 rounded bg-muted" />
                  <div className="h-3 w-3/4 rounded bg-muted/70" />
                  <div className="h-3 w-1/4 rounded bg-muted/60" />
                </div>
                <div className="h-8 w-8 rounded-full bg-muted" />
              </div>
            ))}
          </div>
        ) : normalizedActivities.length === 0 ? (
          <div className="py-6 text-center text-sm text-muted-foreground">
            No recent activity yet.
          </div>
        ) : (
          <div className="space-y-4">
            {normalizedActivities.map((activity) => {
              const display = ACTIVITY_DISPLAY_MAP[activity.action] ?? {
                icon: ActivityIcon,
                colorClass: 'text-muted-foreground',
                getTitle: defaultTitle,
                getDescription: defaultDescription,
              }

              const Icon = display.icon
              const timeAgo = formatTimestamp(activity.timestamp)
              const description = display.getDescription?.(activity)

              return (
                <div key={activity._id} className="flex items-start gap-4">
                  <div className={`mt-0.5 p-2 rounded-full bg-muted ${display.colorClass}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {display.getTitle(activity)}
                    </p>
                    {description && (
                      <p className="text-sm text-muted-foreground">
                        {description}
                      </p>
                    )}
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{timeAgo}</span>
                      {activity.target?.type && (
                        <Badge variant="outline" className="uppercase tracking-wide">
                          {formatTargetType(activity.target.type)}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <Avatar className="h-8 w-8">
                    {activity.actor?.avatar ? (
                      <AvatarImage src={activity.actor.avatar} alt={activity.actor?.name ?? 'Team member'} />
                    ) : (
                      <AvatarFallback>
                        {getInitials(activity.actor?.name ?? 'Team Member')}
                      </AvatarFallback>
                    )}
                  </Avatar>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function defaultTitle(activity: ActivityEntry) {
  const actorName = activity.actor?.name ?? 'Someone'
  const action = humanize(activity.action)
  const target = activity.target?.name
  return target ? `${actorName} ${action} ${target}` : `${actorName} ${action}`
}

function defaultDescription(activity: ActivityEntry) {
  return activity.target?.name
    ? `${humanize(activity.target.type ?? '')}: ${activity.target.name}`
    : undefined
}

function humanize(value: string) {
  return value
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase())
}

function getInitials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .map((part) => part[0]?.toUpperCase())
    .join('')
    .slice(0, 2) || 'TM'
}

function formatTimestamp(timestamp?: string) {
  if (!timestamp) {
    return 'Just now'
  }

  const date = new Date(timestamp)
  if (Number.isNaN(date.getTime())) {
    return 'Just now'
  }

  return formatDistanceToNow(date, { addSuffix: true })
}

function formatTargetType(targetType: string) {
  if (!targetType) return 'Item'
  return targetType.replace(/_/g, ' ').toUpperCase()
}