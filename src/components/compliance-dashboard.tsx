'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Shield,
  AlertTriangle,
  CheckCircle,
  Download,
  Eye,
  TrendingUp,
  Users,
  BarChart3,
  Activity
} from 'lucide-react'

interface SelectionRate {
  group: string
  category: string
  rate: number
  count: number
  total: number
}

interface ImpactRatio {
  category: string
  group1: string
  group2: string
  ratio: number
  passes_four_fifths: boolean
}

interface BiasAuditData {
  auditId: string
  auditDate: string
  jobTitle?: string
  period: {
    start: string
    end: string
  }
  metrics: {
    selectionRates: {
      overall: number
      byGroup: SelectionRate[]
    }
    impactRatios: ImpactRatio[]
  }
  recommendations: string[]
  status: 'draft' | 'under_review' | 'approved' | 'archived'
}

interface ComplianceDashboardProps {
  auditData?: BiasAuditData
  aiDecisions?: Array<{
    id: string
    timestamp: string
    decisionType: string
    candidateName: string
    score: number
    humanReview?: {
      agreedWithAI: boolean
      reviewDate: string
    }
  }>
}

export function ComplianceDashboard({ auditData, aiDecisions = [] }: ComplianceDashboardProps) {
  const [selectedTab, setSelectedTab] = useState('overview')

  // Calculate compliance metrics
  const fourFifthsCompliant = auditData?.metrics.impactRatios.every(r => r.passes_four_fifths) ?? true
  const aiAccuracy = aiDecisions.length > 0
    ? (aiDecisions.filter(d => d.humanReview?.agreedWithAI).length / aiDecisions.filter(d => d.humanReview).length) * 100
    : 0

  const exportReport = () => {
    // In production, this would generate a PDF or CSV report
    console.log('Exporting compliance report...')
  }

  return (
    <div className="space-y-6">
      {/* Compliance Status Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">EEOC Compliance Dashboard</h2>
          <p className="text-muted-foreground">
            Monitor hiring fairness and AI decision auditing
          </p>
        </div>
        <Button onClick={exportReport}>
          <Download className="mr-2 h-4 w-4" />
          Export Report
        </Button>
      </div>

      {/* Compliance Status Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Four-Fifths Rule</CardTitle>
            {fourFifthsCompliant ? (
              <CheckCircle className="h-4 w-4 text-green-600" />
            ) : (
              <AlertTriangle className="h-4 w-4 text-amber-600" />
            )}
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {fourFifthsCompliant ? 'Compliant' : 'Review Required'}
            </div>
            <p className="text-xs text-muted-foreground">
              Selection rate ratio: {fourFifthsCompliant ? '>80%' : '<80%'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">AI Decisions Reviewed</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {aiDecisions.filter(d => d.humanReview).length}/{aiDecisions.length}
            </div>
            <Progress
              value={(aiDecisions.filter(d => d.humanReview).length / aiDecisions.length) * 100}
              className="mt-2"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">AI Accuracy</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{aiAccuracy.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              Human-AI agreement rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Last Audit</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {auditData ? new Date(auditData.auditDate).toLocaleDateString() : 'N/A'}
            </div>
            <p className="text-xs text-muted-foreground">
              Status: {auditData?.status || 'No audits'}
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="selection-rates">Selection Rates</TabsTrigger>
          <TabsTrigger value="ai-audit">AI Audit Trail</TabsTrigger>
          <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {/* Four-Fifths Rule Analysis */}
          {auditData && (
            <Card>
              <CardHeader>
                <CardTitle>Four-Fifths Rule Analysis</CardTitle>
                <CardDescription>
                  Adverse impact testing across protected categories
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Category</TableHead>
                      <TableHead>Comparison</TableHead>
                      <TableHead>Impact Ratio</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {auditData.metrics.impactRatios.map((ratio, idx) => (
                      <TableRow key={idx}>
                        <TableCell className="font-medium">{ratio.category}</TableCell>
                        <TableCell>
                          {ratio.group1} vs {ratio.group2}
                        </TableCell>
                        <TableCell>{(ratio.ratio * 100).toFixed(1)}%</TableCell>
                        <TableCell>
                          {ratio.passes_four_fifths ? (
                            <Badge variant="success">Compliant</Badge>
                          ) : (
                            <Badge variant="destructive">Review Required</Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

          {!fourFifthsCompliant && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Compliance Review Required</AlertTitle>
              <AlertDescription>
                Selection rates indicate potential adverse impact. Review hiring practices
                and consider adjustments to ensure fair selection across all groups.
              </AlertDescription>
            </Alert>
          )}
        </TabsContent>

        <TabsContent value="selection-rates" className="space-y-4">
          {auditData && (
            <Card>
              <CardHeader>
                <CardTitle>Selection Rates by Group</CardTitle>
                <CardDescription>
                  Detailed breakdown of selection rates across protected categories
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                    <div>
                      <p className="text-sm font-medium">Overall Selection Rate</p>
                      <p className="text-2xl font-bold">
                        {(auditData.metrics.selectionRates.overall * 100).toFixed(1)}%
                      </p>
                    </div>
                    <Users className="h-8 w-8 text-muted-foreground" />
                  </div>

                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Category</TableHead>
                        <TableHead>Group</TableHead>
                        <TableHead>Selected</TableHead>
                        <TableHead>Total</TableHead>
                        <TableHead>Rate</TableHead>
                        <TableHead>vs Overall</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {auditData.metrics.selectionRates.byGroup.map((rate, idx) => {
                        const diff = rate.rate - auditData.metrics.selectionRates.overall
                        return (
                          <TableRow key={idx}>
                            <TableCell className="font-medium">{rate.category}</TableCell>
                            <TableCell>{rate.group}</TableCell>
                            <TableCell>{rate.count}</TableCell>
                            <TableCell>{rate.total}</TableCell>
                            <TableCell>{(rate.rate * 100).toFixed(1)}%</TableCell>
                            <TableCell>
                              <span className={diff >= 0 ? 'text-green-600' : 'text-red-600'}>
                                {diff >= 0 ? '+' : ''}{(diff * 100).toFixed(1)}%
                              </span>
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="ai-audit" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>AI Decision Audit Trail</CardTitle>
              <CardDescription>
                Track and review all AI-assisted hiring decisions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Decision Type</TableHead>
                    <TableHead>Candidate</TableHead>
                    <TableHead>AI Score</TableHead>
                    <TableHead>Human Review</TableHead>
                    <TableHead>Agreement</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {aiDecisions.map((decision) => (
                    <TableRow key={decision.id}>
                      <TableCell>
                        {new Date(decision.timestamp).toLocaleDateString()}
                      </TableCell>
                      <TableCell>{decision.decisionType}</TableCell>
                      <TableCell>{decision.candidateName}</TableCell>
                      <TableCell>{decision.score}%</TableCell>
                      <TableCell>
                        {decision.humanReview ? (
                          <Badge variant="secondary">Reviewed</Badge>
                        ) : (
                          <Badge variant="outline">Pending</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {decision.humanReview ? (
                          decision.humanReview.agreedWithAI ? (
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          ) : (
                            <AlertTriangle className="h-4 w-4 text-amber-600" />
                          )
                        ) : (
                          '-'
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="recommendations" className="space-y-4">
          {auditData && auditData.recommendations.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Compliance Recommendations</CardTitle>
                <CardDescription>
                  Actions to improve hiring fairness and maintain compliance
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {auditData.recommendations.map((rec, idx) => (
                    <Alert key={idx}>
                      <TrendingUp className="h-4 w-4" />
                      <AlertDescription>{rec}</AlertDescription>
                    </Alert>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Best Practices</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                  <span className="text-sm">
                    Regularly audit AI decisions for bias across protected categories
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                  <span className="text-sm">
                    Ensure human review of AI recommendations before final decisions
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                  <span className="text-sm">
                    Maintain documentation of all hiring decisions for compliance reporting
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                  <span className="text-sm">
                    Collect EEO data separately from application materials
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                  <span className="text-sm">
                    Train hiring teams on unconscious bias and fair selection practices
                  </span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}