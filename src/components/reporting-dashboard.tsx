"use client"

import { useState, useEffect } from "react"
import { useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import {
  BarChart, LineChart, PieChart, TrendingUp, TrendingDown,
  Users, Briefcase, Calendar, Clock, Target, Award,
  Download, Filter, ChevronUp, ChevronDown, Activity,
  DollarSign, UserCheck, UserX, Timer, Zap
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"

interface MetricCard {
  title: string
  value: number | string
  change: number
  changeLabel: string
  icon: React.ReactNode
  color: string
}

interface ChartData {
  labels: string[]
  datasets: {
    label: string
    data: number[]
    backgroundColor?: string
    borderColor?: string
  }[]
}

interface FunnelStage {
  name: string
  value: number
  percentage: number
  dropoff: number
}

interface DepartmentMetrics {
  department: string
  openPositions: number
  totalApplications: number
  averageTimeToHire: number
  offerAcceptanceRate: number
}

export function ReportingDashboard() {
  const [timeRange, setTimeRange] = useState("30d")
  const [department, setDepartment] = useState("all")
  const [compareMode, setCompareMode] = useState(false)

  // Mock Convex queries - replace with actual API calls
  const candidates = useQuery(api.teams.getCandidates) || []
  const jobs = useQuery(api.teams.getJobs) || []
  const interviews = useQuery(api.interviews.list, {}) || []
  const teamMembers = useQuery(api.teams.getTeamMembers) || []

  // Calculate metrics
  const calculateMetrics = () => {
    const now = new Date()
    const timeRangeDays = parseInt(timeRange)
    const startDate = new Date(now.getTime() - timeRangeDays * 24 * 60 * 60 * 1000)

    // Filter data by time range
    const filteredCandidates = candidates.filter(c =>
      new Date(c.appliedDate) >= startDate
    )

    const filteredInterviews = interviews.filter(i =>
      new Date(i.date) >= startDate
    )

    // Key metrics
    const totalApplications = filteredCandidates.length
    const activePositions = jobs.filter(j => j.status === "active").length
    const hiredCandidates = filteredCandidates.filter(c => c.status === "hired").length
    const rejectedCandidates = filteredCandidates.filter(c => c.status === "rejected").length

    // Calculate averages
    const avgTimeToHire = hiredCandidates.length > 0
      ? Math.round(Math.random() * 30) // Mock calculation
      : 0

    const offerAcceptanceRate = hiredCandidates.length > 0
      ? Math.round((hiredCandidates.length / (hiredCandidates.length + 2)) * 100)
      : 0

    // Calculate changes (mock data for demo)
    const previousPeriodApplications = Math.round(totalApplications * 0.8)
    const applicationChange = previousPeriodApplications > 0
      ? ((totalApplications - previousPeriodApplications) / previousPeriodApplications) * 100
      : 0

    return {
      totalApplications,
      activePositions,
      hiredCandidates: hiredCandidates.length,
      rejectedCandidates: rejectedCandidates.length,
      avgTimeToHire,
      offerAcceptanceRate,
      applicationChange,
      interviewsScheduled: filteredInterviews.length,
      conversionRate: totalApplications > 0
        ? Math.round((hiredCandidates.length / totalApplications) * 100)
        : 0
    }
  }

  const metrics = calculateMetrics()

  // Metric cards data
  const metricCards: MetricCard[] = [
    {
      title: "Total Applications",
      value: metrics.totalApplications,
      change: metrics.applicationChange,
      changeLabel: "vs last period",
      icon: <Users className="h-4 w-4" />,
      color: "text-blue-600"
    },
    {
      title: "Active Positions",
      value: metrics.activePositions,
      change: 12,
      changeLabel: "new this month",
      icon: <Briefcase className="h-4 w-4" />,
      color: "text-purple-600"
    },
    {
      title: "Avg. Time to Hire",
      value: `${metrics.avgTimeToHire} days`,
      change: -15,
      changeLabel: "improvement",
      icon: <Clock className="h-4 w-4" />,
      color: "text-green-600"
    },
    {
      title: "Offer Acceptance",
      value: `${metrics.offerAcceptanceRate}%`,
      change: 5,
      changeLabel: "vs last quarter",
      icon: <Target className="h-4 w-4" />,
      color: "text-orange-600"
    }
  ]

  // Funnel data
  const funnelData: FunnelStage[] = [
    { name: "Applications", value: metrics.totalApplications, percentage: 100, dropoff: 0 },
    { name: "Screening", value: Math.round(metrics.totalApplications * 0.6), percentage: 60, dropoff: 40 },
    { name: "Interview", value: Math.round(metrics.totalApplications * 0.3), percentage: 30, dropoff: 30 },
    { name: "Offer", value: Math.round(metrics.totalApplications * 0.1), percentage: 10, dropoff: 20 },
    { name: "Hired", value: metrics.hiredCandidates, percentage: metrics.conversionRate, dropoff: 5 }
  ]

  // Department metrics
  const departmentMetrics: DepartmentMetrics[] = [
    { department: "Engineering", openPositions: 8, totalApplications: 245, averageTimeToHire: 28, offerAcceptanceRate: 85 },
    { department: "Design", openPositions: 3, totalApplications: 89, averageTimeToHire: 21, offerAcceptanceRate: 92 },
    { department: "Product", openPositions: 4, totalApplications: 112, averageTimeToHire: 24, offerAcceptanceRate: 88 },
    { department: "Sales", openPositions: 6, totalApplications: 178, averageTimeToHire: 18, offerAcceptanceRate: 78 },
    { department: "Marketing", openPositions: 2, totalApplications: 67, averageTimeToHire: 22, offerAcceptanceRate: 81 }
  ]

  // Source effectiveness data
  const sourceData = [
    { source: "LinkedIn", applications: 145, hires: 12, quality: 8.3 },
    { source: "Indeed", applications: 98, hires: 7, quality: 7.1 },
    { source: "Company Website", applications: 76, hires: 9, quality: 11.8 },
    { source: "Employee Referral", applications: 42, hires: 8, quality: 19.0 },
    { source: "University", applications: 31, hires: 3, quality: 9.7 }
  ]

  // Time to hire trend data
  const timeToHireTrend = {
    labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
    data: [32, 28, 30, 26, 24, 22]
  }

  const getChangeIcon = (change: number) => {
    if (change > 0) return <ChevronUp className="h-3 w-3" />
    if (change < 0) return <ChevronDown className="h-3 w-3" />
    return null
  }

  const getChangeColor = (change: number, inverse: boolean = false) => {
    if (inverse) {
      return change > 0 ? "text-red-600" : change < 0 ? "text-green-600" : "text-gray-600"
    }
    return change > 0 ? "text-green-600" : change < 0 ? "text-red-600" : "text-gray-600"
  }

  const exportReport = () => {
    // Export functionality
    console.log("Exporting report...")
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Recruitment Analytics</h1>
          <p className="text-gray-600">Track your hiring performance and insights</p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={department} onValueChange={setDepartment}>
            <SelectTrigger className="w-[150px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Departments</SelectItem>
              <SelectItem value="engineering">Engineering</SelectItem>
              <SelectItem value="design">Design</SelectItem>
              <SelectItem value="product">Product</SelectItem>
              <SelectItem value="sales">Sales</SelectItem>
            </SelectContent>
          </Select>
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[120px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="365d">Last year</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={exportReport}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-4 gap-4">
        {metricCards.map((metric, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <div className={cn("p-2 bg-gray-100 rounded-lg", metric.color)}>
                  {metric.icon}
                </div>
                {metric.change !== 0 && (
                  <div className={cn("flex items-center text-sm", getChangeColor(metric.change, metric.title.includes("Time")))}>
                    {getChangeIcon(metric.change)}
                    <span>{Math.abs(metric.change)}%</span>
                  </div>
                )}
              </div>
              <div className="space-y-1">
                <p className="text-2xl font-bold">{metric.value}</p>
                <p className="text-sm text-gray-600">{metric.title}</p>
                <p className="text-xs text-gray-500">{metric.changeLabel}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Dashboard Content */}
      <div className="grid grid-cols-12 gap-6">
        {/* Recruitment Funnel */}
        <Card className="col-span-5">
          <CardHeader>
            <CardTitle>Recruitment Funnel</CardTitle>
            <CardDescription>Conversion rates through each stage</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {funnelData.map((stage, i) => (
                <div key={stage.name} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">{stage.name}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-gray-600">{stage.value}</span>
                      <Badge variant="outline">{stage.percentage}%</Badge>
                    </div>
                  </div>
                  <div className="relative">
                    <Progress value={stage.percentage} className="h-2" />
                    {i > 0 && stage.dropoff > 0 && (
                      <span className="absolute -top-5 right-0 text-xs text-red-600">
                        -{stage.dropoff}%
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 pt-4 border-t">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Overall Conversion</p>
                  <p className="text-2xl font-bold">{metrics.conversionRate}%</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium">Quality Score</p>
                  <div className="flex items-center gap-1">
                    <Award className="h-4 w-4 text-yellow-500" />
                    <span className="text-lg font-bold">8.2/10</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Time to Hire Trend */}
        <Card className="col-span-7">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Time to Hire Trend</CardTitle>
                <CardDescription>Average days from application to hire</CardDescription>
              </div>
              <Badge variant="outline" className="gap-1">
                <TrendingDown className="h-3 w-3 text-green-600" />
                Improving
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-[250px] flex items-end justify-between gap-2">
              {timeToHireTrend.labels.map((month, i) => (
                <div key={month} className="flex-1 flex flex-col items-center gap-2">
                  <div className="relative w-full bg-gray-100 rounded-t" style={{
                    height: `${(timeToHireTrend.data[i] / Math.max(...timeToHireTrend.data)) * 200}px`
                  }}>
                    <div className="absolute inset-0 bg-blue-500 rounded-t" />
                    <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-sm font-medium">
                      {timeToHireTrend.data[i]}
                    </span>
                  </div>
                  <span className="text-xs text-gray-600">{month}</span>
                </div>
              ))}
            </div>

            <div className="mt-6 grid grid-cols-3 gap-4">
              <div className="text-center">
                <p className="text-sm text-gray-600">Current Average</p>
                <p className="text-xl font-bold">{metrics.avgTimeToHire} days</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-600">Industry Benchmark</p>
                <p className="text-xl font-bold">28 days</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-600">Target</p>
                <p className="text-xl font-bold text-green-600">20 days</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Department Performance */}
      <Card>
        <CardHeader>
          <CardTitle>Department Performance</CardTitle>
          <CardDescription>Hiring metrics by department</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4">Department</th>
                  <th className="text-center py-3 px-4">Open Positions</th>
                  <th className="text-center py-3 px-4">Applications</th>
                  <th className="text-center py-3 px-4">Avg. Time to Hire</th>
                  <th className="text-center py-3 px-4">Offer Acceptance</th>
                  <th className="text-center py-3 px-4">Efficiency Score</th>
                </tr>
              </thead>
              <tbody>
                {departmentMetrics.map((dept) => {
                  const efficiencyScore = Math.round(
                    (100 - dept.averageTimeToHire + dept.offerAcceptanceRate) / 2
                  )
                  return (
                    <tr key={dept.department} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4 font-medium">{dept.department}</td>
                      <td className="text-center py-3 px-4">
                        <Badge variant="outline">{dept.openPositions}</Badge>
                      </td>
                      <td className="text-center py-3 px-4">{dept.totalApplications}</td>
                      <td className="text-center py-3 px-4">
                        <div className="flex items-center justify-center gap-1">
                          <Timer className="h-3 w-3 text-gray-500" />
                          {dept.averageTimeToHire} days
                        </div>
                      </td>
                      <td className="text-center py-3 px-4">
                        <div className="flex items-center justify-center gap-2">
                          <Progress value={dept.offerAcceptanceRate} className="w-16 h-2" />
                          <span className="text-sm">{dept.offerAcceptanceRate}%</span>
                        </div>
                      </td>
                      <td className="text-center py-3 px-4">
                        <Badge className={cn(
                          efficiencyScore >= 80 ? "bg-green-500" :
                          efficiencyScore >= 60 ? "bg-yellow-500" : "bg-red-500"
                        )}>
                          {efficiencyScore}
                        </Badge>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Source Effectiveness */}
      <div className="grid grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Source Effectiveness</CardTitle>
            <CardDescription>Performance by recruitment channel</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {sourceData.map((source) => (
                <div key={source.source} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-sm">{source.source}</span>
                    <div className="flex items-center gap-4 text-sm">
                      <span className="text-gray-600">{source.applications} apps</span>
                      <Badge variant="outline">{source.hires} hires</Badge>
                      <Badge className="bg-blue-500">{source.quality}% quality</Badge>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Progress value={(source.hires / source.applications) * 100} className="flex-1 h-2" />
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 pt-4 border-t">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Best performing source:</span>
                <Badge className="bg-green-500">Employee Referral - 19% conversion</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Diversity Metrics */}
        <Card>
          <CardHeader>
            <CardTitle>Diversity & Inclusion</CardTitle>
            <CardDescription>Tracking diversity goals and progress</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Gender Diversity</span>
                  <span className="text-sm text-gray-600">Target: 50/50</span>
                </div>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <Progress value={45} className="h-3" />
                    <p className="text-xs text-gray-600 mt-1">45% Female</p>
                  </div>
                  <div className="flex-1">
                    <Progress value={55} className="h-3 bg-blue-100 [&>div]:bg-blue-500" />
                    <p className="text-xs text-gray-600 mt-1">55% Male</p>
                  </div>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Underrepresented Groups</span>
                  <span className="text-sm text-gray-600">Target: 30%</span>
                </div>
                <Progress value={28} className="h-3" />
                <p className="text-xs text-gray-600 mt-1">Currently at 28%</p>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">International Hires</span>
                  <span className="text-sm text-gray-600">Target: 25%</span>
                </div>
                <Progress value={22} className="h-3" />
                <p className="text-xs text-gray-600 mt-1">Currently at 22%</p>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Diversity Score</span>
                <div className="flex items-center gap-2">
                  <Progress value={75} className="w-20 h-2" />
                  <Badge className="bg-yellow-500">B+</Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Key Insights */}
      <Card>
        <CardHeader>
          <CardTitle>Key Insights & Recommendations</CardTitle>
          <CardDescription>AI-powered insights to improve your hiring process</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex gap-3 p-4 bg-green-50 rounded-lg border border-green-200">
              <Zap className="h-5 w-5 text-green-600 mt-0.5" />
              <div>
                <p className="font-medium text-sm">Strong Performer</p>
                <p className="text-sm text-gray-600 mt-1">
                  Employee referrals show 19% conversion rate, 3x higher than average. Consider increasing referral incentives.
                </p>
              </div>
            </div>
            <div className="flex gap-3 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
              <Activity className="h-5 w-5 text-yellow-600 mt-0.5" />
              <div>
                <p className="font-medium text-sm">Opportunity</p>
                <p className="text-sm text-gray-600 mt-1">
                  Engineering department has 28-day avg time to hire. Streamlining technical assessments could reduce by 20%.
                </p>
              </div>
            </div>
            <div className="flex gap-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <TrendingUp className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <p className="font-medium text-sm">Trending Up</p>
                <p className="text-sm text-gray-600 mt-1">
                  Offer acceptance rate improved 5% this quarter. Compensation competitiveness is paying off.
                </p>
              </div>
            </div>
            <div className="flex gap-3 p-4 bg-purple-50 rounded-lg border border-purple-200">
              <Target className="h-5 w-5 text-purple-600 mt-0.5" />
              <div>
                <p className="font-medium text-sm">Action Required</p>
                <p className="text-sm text-gray-600 mt-1">
                  40% dropout rate at screening stage. Review screening criteria and improve candidate communication.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}