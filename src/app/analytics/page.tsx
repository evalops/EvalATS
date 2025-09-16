'use client'

import { useQuery } from 'convex/react'
import { api } from '../../../convex/_generated/api'
import { AppShell } from '@/components/layout/app-shell'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  BarChart3,
  Users,
  Calendar,
  TrendingUp,
  Clock,
  Award,
  Target,
  MessageSquare
} from 'lucide-react'

export default function AnalyticsPage() {
  const metrics = useQuery(api.analytics.getHiringMetrics)
  const funnelData = useQuery(api.analytics.getFunnelAnalysis)
  const timeToHire = useQuery(api.analytics.getTimeToHire)
  const sourceData = useQuery(api.analytics.getSourceEffectiveness)
  const interviewMetrics = useQuery(api.analytics.getInterviewMetrics)

  const loading = !metrics || !funnelData || !timeToHire || !sourceData || !interviewMetrics

  if (loading) {
    return (
      <AppShell>
        <div className="section-padding py-8">
          <div className="container-max">
            <div className="animate-pulse space-y-6">
              <div className="h-8 bg-gray-200 rounded w-1/4"></div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="h-32 bg-gray-200 rounded"></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell>
      <div className="min-h-screen">
        {/* Page header */}
        <div className="section-padding py-8 border-b border-border/50">
          <div className="container-max">
            <h1 className="text-2xl font-semibold tracking-tight">Analytics</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Track your hiring performance and optimize your process
            </p>
          </div>
        </div>

        {/* Main content */}
        <div className="section-padding py-8">
          <div className="container-max space-y-8">

            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Jobs</CardTitle>
                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{metrics.totalJobs}</div>
                  <p className="text-xs text-muted-foreground">
                    {metrics.activeJobs} active
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Candidates</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{metrics.totalCandidates}</div>
                  <p className="text-xs text-muted-foreground">
                    {metrics.recentCandidates} in last 30 days
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Interviews</CardTitle>
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{metrics.totalInterviews}</div>
                  <p className="text-xs text-muted-foreground">
                    {metrics.interviewCompletionRate}% completion rate
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Avg. Time to Hire</CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{timeToHire.avgTimeToHire}</div>
                  <p className="text-xs text-muted-foreground">days</p>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

              {/* Hiring Funnel */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Hiring Funnel
                  </CardTitle>
                  <CardDescription>
                    Conversion rates through your hiring process
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {funnelData.map((stage, index) => (
                    <div key={stage.stage} className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium">{stage.stage}</span>
                        <div className="flex items-center gap-2">
                          <span>{stage.count} candidates</span>
                          <Badge variant="secondary" className="text-xs">
                            {stage.conversionRate}%
                          </Badge>
                        </div>
                      </div>
                      <Progress
                        value={stage.conversionRate}
                        className="h-2"
                        style={{
                          '--progress-background': stage.color
                        } as React.CSSProperties}
                      />
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Source Effectiveness */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5" />
                    Source Effectiveness
                  </CardTitle>
                  <CardDescription>
                    Performance by candidate source
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {sourceData.slice(0, 5).map((source) => (
                      <div key={source.source} className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-medium">{source.source}</span>
                          <div className="text-right">
                            <div className="text-xs text-muted-foreground">
                              {source.totalApplications} applications
                            </div>
                            <div className="text-xs">
                              {source.hireRate}% hire rate
                            </div>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <div className="text-xs text-muted-foreground">Interview Rate</div>
                            <Progress value={source.interviewRate} className="h-1" />
                          </div>
                          <div>
                            <div className="text-xs text-muted-foreground">Hire Rate</div>
                            <Progress value={source.hireRate} className="h-1" />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Interview Performance */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="h-5 w-5" />
                    Interview Performance
                  </CardTitle>
                  <CardDescription>
                    Feedback and rating analysis
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold">{interviewMetrics.avgRating}</div>
                      <div className="text-xs text-muted-foreground">Avg Rating</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold">{interviewMetrics.feedbackRate}%</div>
                      <div className="text-xs text-muted-foreground">Feedback Rate</div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="text-sm font-medium">Rating Distribution</div>
                    {interviewMetrics.ratingDistribution.map((rating) => (
                      <div key={rating.rating} className="flex items-center gap-2">
                        <span className="text-xs w-12">{rating.rating} star{rating.rating !== 1 ? 's' : ''}</span>
                        <Progress
                          value={(rating.count / interviewMetrics.totalInterviews) * 100}
                          className="flex-1 h-2"
                        />
                        <span className="text-xs text-muted-foreground w-8">{rating.count}</span>
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center pt-4 border-t">
                    <div>
                      <div className="text-lg font-semibold text-green-600">
                        {interviewMetrics.outcomes.completed}
                      </div>
                      <div className="text-xs text-muted-foreground">Completed</div>
                    </div>
                    <div>
                      <div className="text-lg font-semibold text-blue-600">
                        {interviewMetrics.outcomes.scheduled}
                      </div>
                      <div className="text-xs text-muted-foreground">Scheduled</div>
                    </div>
                    <div>
                      <div className="text-lg font-semibold text-red-600">
                        {interviewMetrics.outcomes.cancelled}
                      </div>
                      <div className="text-xs text-muted-foreground">Cancelled</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Recent Hires */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Award className="h-5 w-5" />
                    Recent Hires
                  </CardTitle>
                  <CardDescription>
                    Latest successful hires and time to hire
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {timeToHire.recentHires.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        No recent hires to display
                      </p>
                    ) : (
                      timeToHire.recentHires.map((hire) => (
                        <div key={hire.candidateId} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                          <div>
                            <div className="font-medium text-sm">{hire.candidateName}</div>
                            <div className="text-xs text-muted-foreground">{hire.jobTitle}</div>
                          </div>
                          <Badge variant="outline" className="text-xs">
                            {hire.daysToHire} days
                          </Badge>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Candidate Status Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle>Candidate Status Distribution</CardTitle>
                <CardDescription>
                  Current state of all candidates in your pipeline
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  {Object.entries(metrics.candidatesByStatus).map(([status, count]) => (
                    <div key={status} className="text-center">
                      <div className="text-2xl font-bold">{count}</div>
                      <div className="text-xs text-muted-foreground capitalize">
                        {status.replace('_', ' ')}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AppShell>
  )
}