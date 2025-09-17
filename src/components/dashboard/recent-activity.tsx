'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Clock, CheckCircle, XCircle, Calendar, Send } from 'lucide-react'

const activities = [
  {
    id: '1',
    type: 'application',
    title: 'New application received',
    description: 'Emily Chen applied for Senior Frontend Engineer',
    time: '5 minutes ago',
    icon: Send,
    color: 'text-blue-500',
  },
  {
    id: '2',
    type: 'interview',
    title: 'Interview scheduled',
    description: 'Jonathan Haas - Backend Developer interview tomorrow at 2 PM',
    time: '1 hour ago',
    icon: Calendar,
    color: 'text-yellow-500',
  },
  {
    id: '3',
    type: 'offer',
    title: 'Offer accepted',
    description: 'Sarah Johnson accepted offer for Product Designer',
    time: '2 hours ago',
    icon: CheckCircle,
    color: 'text-green-500',
  },
  {
    id: '4',
    type: 'rejection',
    title: 'Application rejected',
    description: 'Michael Brown - DevOps Engineer position filled',
    time: '3 hours ago',
    icon: XCircle,
    color: 'text-red-500',
  },
  {
    id: '5',
    type: 'reminder',
    title: 'Scorecard reminder',
    description: 'Submit scorecard for David Wilson interview',
    time: '4 hours ago',
    icon: Clock,
    color: 'text-purple-500',
  },
]

export function RecentActivity() {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.map((activity) => {
            const Icon = activity.icon
            return (
              <div key={activity.id} className="flex items-start gap-4">
                <div className={`mt-0.5 p-2 rounded-full bg-muted ${activity.color}`}>
                  <Icon className="h-4 w-4" />
                </div>
                <div className="flex-1 space-y-1">
                  <p className="text-sm font-medium leading-none">
                    {activity.title}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {activity.description}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {activity.time}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}