'use client'

import { Users, Briefcase, Calendar, TrendingUp } from 'lucide-react'

const stats = [
  {
    label: 'Total Candidates',
    value: '2,420',
    change: '+12% from last month',
    icon: Users,
  },
  {
    label: 'Open Positions',
    value: '24',
    change: '3 added this week',
    icon: Briefcase,
  },
  {
    label: 'Interviews Today',
    value: '8',
    change: '2 upcoming',
    icon: Calendar,
  },
  {
    label: 'Avg. Time to Hire',
    value: '21 days',
    change: '3 days faster',
    icon: TrendingUp,
  },
]

export function StatsOverview() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="stat-card-clean group hover:shadow-md"
        >
          <div className="flex items-start justify-between mb-4">
            <stat.icon className="h-5 w-5 text-muted-foreground" />
          </div>

          <div className="space-y-1">
            <p className="text-label">{stat.label}</p>
            <p className="text-value">{stat.value}</p>
            <p className="text-xs text-muted-foreground">
              {stat.change}
            </p>
          </div>
        </div>
      ))}
    </div>
  )
}