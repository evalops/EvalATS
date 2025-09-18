'use client'

import { useQuery } from 'convex/react'
import { Briefcase, Calendar, TrendingUp, Users } from 'lucide-react'
import { api } from '../../../convex/_generated/api'

export function StatsOverview() {
  const metrics = useQuery(api.analytics.getHiringMetrics)
  const timeToHire = useQuery(api.analytics.getTimeToHire)

  if (!metrics || !timeToHire) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="stat-card-clean animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
            <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
            <div className="h-3 bg-gray-200 rounded w-2/3"></div>
          </div>
        ))}
      </div>
    )
  }

  const stats = [
    {
      label: 'Total Candidates',
      value: metrics.totalCandidates.toLocaleString(),
      change: `${metrics.recentCandidates} in last 30 days`,
      icon: Users,
    },
    {
      label: 'Open Positions',
      value: metrics.activeJobs.toString(),
      change: `${metrics.totalJobs} total jobs`,
      icon: Briefcase,
    },
    {
      label: 'Total Interviews',
      value: metrics.totalInterviews.toString(),
      change: `${metrics.interviewCompletionRate}% completion rate`,
      icon: Calendar,
    },
    {
      label: 'Avg. Time to Hire',
      value: `${timeToHire.avgTimeToHire} days`,
      change: `${timeToHire.recentHires.length} recent hires`,
      icon: TrendingUp,
    },
  ]

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat) => (
        <div key={stat.label} className="stat-card-clean group hover:shadow-md">
          <div className="flex items-start justify-between mb-4">
            <stat.icon className="h-5 w-5 text-muted-foreground" />
          </div>

          <div className="space-y-1">
            <p className="text-label">{stat.label}</p>
            <p className="text-value">{stat.value}</p>
            <p className="text-xs text-muted-foreground">{stat.change}</p>
          </div>
        </div>
      ))}
    </div>
  )
}
