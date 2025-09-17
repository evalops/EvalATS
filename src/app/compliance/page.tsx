'use client'

import { useQuery } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { ComplianceDashboard } from '@/components/compliance-dashboard'
import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent, CardHeader } from '@/components/ui/card'

export default function CompliancePage() {
  // Get latest audit data from Convex
  const auditData = useQuery(api.compliance.getLatestAudit)

  // Get AI decisions from Convex
  const aiDecisions = useQuery(api.compliance.getAIDecisions, { limit: 20 })

  // Format AI decisions for the dashboard
  const formattedAIDecisions = aiDecisions?.map(decision => ({
    id: decision._id,
    timestamp: decision.timestamp,
    decisionType: decision.decisionType
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' '),
    candidateName: decision.candidateName,
    score: decision.score || 0,
    humanReview: decision.humanReview
  })) || []

  if (!auditData && !aiDecisions) {
    return (
      <div className="container mx-auto p-6">
        <div className="space-y-6">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">EEOC Compliance Dashboard</h2>
            <p className="text-muted-foreground">
              Monitor hiring fairness and AI decision auditing
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i}>
                <CardHeader className="space-y-0 pb-2">
                  <Skeleton className="h-4 w-[100px]" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-8 w-[120px]" />
                  <Skeleton className="h-3 w-[80px] mt-2" />
                </CardContent>
              </Card>
            ))}
          </div>

          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-[200px]" />
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6">
      <ComplianceDashboard
        auditData={auditData || undefined}
        aiDecisions={formattedAIDecisions}
      />
    </div>
  )
}