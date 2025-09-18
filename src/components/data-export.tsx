'use client'

import { useQuery } from 'convex/react'
import {
  AlertCircle,
  Briefcase,
  Calendar,
  ClipboardList,
  Download,
  FileText,
  Loader2,
  Package,
  Table,
  Users,
} from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { api } from '../../convex/_generated/api'

type ExportFormat = 'csv' | 'excel' | 'json' | 'pdf'
type ExportEntity = 'candidates' | 'jobs' | 'interviews' | 'offers' | 'team' | 'analytics'

interface ExportField {
  key: string
  label: string
  selected: boolean
  group?: string
}

interface ExportConfig {
  entity: ExportEntity
  format: ExportFormat
  fields: ExportField[]
  filters: {
    dateRange?: { from: Date; to: Date }
    status?: string[]
    department?: string[]
    location?: string[]
  }
  includeRelated?: boolean
  includeAttachments?: boolean
}

interface ExportPreset {
  id: string
  name: string
  description: string
  config: Partial<ExportConfig>
  icon: React.ReactNode
}

const exportPresets: ExportPreset[] = [
  {
    id: 'candidate-pipeline',
    name: 'Candidate Pipeline Report',
    description: 'All candidates with status and evaluation',
    config: {
      entity: 'candidates',
      format: 'excel',
      includeRelated: true,
    },
    icon: <Users className="h-4 w-4" />,
  },
  {
    id: 'interview-summary',
    name: 'Interview Summary',
    description: 'All interviews with feedback and ratings',
    config: {
      entity: 'interviews',
      format: 'excel',
      includeRelated: true,
    },
    icon: <ClipboardList className="h-4 w-4" />,
  },
  {
    id: 'monthly-hiring',
    name: 'Monthly Hiring Report',
    description: 'Hiring metrics for the current month',
    config: {
      entity: 'analytics',
      format: 'pdf',
      filters: {
        dateRange: {
          from: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
          to: new Date(),
        },
      },
    },
    icon: <Calendar className="h-4 w-4" />,
  },
  {
    id: 'offer-tracking',
    name: 'Offer Tracking',
    description: 'All offers with compensation details',
    config: {
      entity: 'offers',
      format: 'excel',
      includeRelated: true,
    },
    icon: <Package className="h-4 w-4" />,
  },
]

const entityFields: Record<ExportEntity, ExportField[]> = {
  candidates: [
    { key: 'name', label: 'Name', selected: true, group: 'Basic Info' },
    { key: 'email', label: 'Email', selected: true, group: 'Basic Info' },
    { key: 'phone', label: 'Phone', selected: true, group: 'Basic Info' },
    { key: 'location', label: 'Location', selected: true, group: 'Basic Info' },
    { key: 'position', label: 'Applied Position', selected: true, group: 'Application' },
    { key: 'appliedDate', label: 'Applied Date', selected: true, group: 'Application' },
    { key: 'status', label: 'Status', selected: true, group: 'Application' },
    { key: 'experience', label: 'Years of Experience', selected: true, group: 'Professional' },
    { key: 'currentCompany', label: 'Current Company', selected: false, group: 'Professional' },
    { key: 'education', label: 'Education', selected: false, group: 'Professional' },
    { key: 'skills', label: 'Skills', selected: true, group: 'Professional' },
    { key: 'evaluation.overall', label: 'Overall Rating', selected: true, group: 'Evaluation' },
    {
      key: 'evaluation.technical',
      label: 'Technical Rating',
      selected: false,
      group: 'Evaluation',
    },
    { key: 'evaluation.cultural', label: 'Cultural Fit', selected: false, group: 'Evaluation' },
    {
      key: 'evaluation.communication',
      label: 'Communication',
      selected: false,
      group: 'Evaluation',
    },
    { key: 'linkedin', label: 'LinkedIn', selected: false, group: 'Social' },
    { key: 'github', label: 'GitHub', selected: false, group: 'Social' },
    { key: 'portfolio', label: 'Portfolio', selected: false, group: 'Social' },
    { key: 'resumeUrl', label: 'Resume Link', selected: false, group: 'Documents' },
    { key: 'coverLetter', label: 'Cover Letter', selected: false, group: 'Documents' },
  ],
  jobs: [
    { key: 'title', label: 'Job Title', selected: true, group: 'Basic Info' },
    { key: 'department', label: 'Department', selected: true, group: 'Basic Info' },
    { key: 'location', label: 'Location', selected: true, group: 'Basic Info' },
    { key: 'type', label: 'Employment Type', selected: true, group: 'Basic Info' },
    { key: 'status', label: 'Status', selected: true, group: 'Status' },
    { key: 'postedDate', label: 'Posted Date', selected: true, group: 'Status' },
    { key: 'description', label: 'Description', selected: false, group: 'Details' },
    { key: 'requirements', label: 'Requirements', selected: true, group: 'Details' },
    { key: 'salary.min', label: 'Min Salary', selected: true, group: 'Compensation' },
    { key: 'salary.max', label: 'Max Salary', selected: true, group: 'Compensation' },
    { key: 'applicantCount', label: 'Total Applicants', selected: true, group: 'Metrics' },
  ],
  interviews: [
    { key: 'candidateName', label: 'Candidate', selected: true, group: 'Basic Info' },
    { key: 'position', label: 'Position', selected: true, group: 'Basic Info' },
    { key: 'type', label: 'Interview Type', selected: true, group: 'Interview Details' },
    { key: 'date', label: 'Date', selected: true, group: 'Interview Details' },
    { key: 'time', label: 'Time', selected: true, group: 'Interview Details' },
    { key: 'duration', label: 'Duration', selected: true, group: 'Interview Details' },
    { key: 'location', label: 'Location', selected: true, group: 'Interview Details' },
    { key: 'status', label: 'Status', selected: true, group: 'Status' },
    { key: 'interviewers', label: 'Interviewers', selected: true, group: 'Participants' },
    { key: 'rating', label: 'Overall Rating', selected: true, group: 'Feedback' },
    { key: 'technicalSkills', label: 'Technical Skills', selected: false, group: 'Feedback' },
    { key: 'culturalFit', label: 'Cultural Fit', selected: false, group: 'Feedback' },
    { key: 'communication', label: 'Communication', selected: false, group: 'Feedback' },
    { key: 'recommendation', label: 'Recommendation', selected: true, group: 'Feedback' },
    { key: 'feedback', label: 'Detailed Feedback', selected: false, group: 'Feedback' },
  ],
  offers: [
    { key: 'candidateName', label: 'Candidate', selected: true, group: 'Basic Info' },
    { key: 'position', label: 'Position', selected: true, group: 'Basic Info' },
    { key: 'salary', label: 'Base Salary', selected: true, group: 'Compensation' },
    { key: 'bonus', label: 'Signing Bonus', selected: true, group: 'Compensation' },
    { key: 'equity', label: 'Equity', selected: true, group: 'Compensation' },
    { key: 'startDate', label: 'Start Date', selected: true, group: 'Terms' },
    { key: 'expiryDate', label: 'Expiry Date', selected: true, group: 'Terms' },
    { key: 'status', label: 'Status', selected: true, group: 'Status' },
    { key: 'benefits', label: 'Benefits', selected: false, group: 'Benefits' },
    { key: 'approvalStatus', label: 'Approval Status', selected: true, group: 'Approval' },
    { key: 'approvers', label: 'Approvers', selected: false, group: 'Approval' },
  ],
  team: [
    { key: 'name', label: 'Name', selected: true, group: 'Basic Info' },
    { key: 'email', label: 'Email', selected: true, group: 'Basic Info' },
    { key: 'role', label: 'Role', selected: true, group: 'Basic Info' },
    { key: 'department', label: 'Department', selected: true, group: 'Basic Info' },
    { key: 'permissions', label: 'Permissions', selected: false, group: 'Access' },
    { key: 'isActive', label: 'Active', selected: true, group: 'Status' },
    { key: 'createdAt', label: 'Joined Date', selected: false, group: 'Status' },
  ],
  analytics: [
    { key: 'metric', label: 'Metric Name', selected: true, group: 'Metrics' },
    { key: 'value', label: 'Value', selected: true, group: 'Metrics' },
    { key: 'period', label: 'Period', selected: true, group: 'Time' },
    { key: 'comparison', label: 'vs Previous Period', selected: true, group: 'Comparison' },
  ],
}

export function DataExport() {
  const [config, setConfig] = useState<ExportConfig>({
    entity: 'candidates',
    format: 'csv',
    fields: entityFields.candidates,
    filters: {},
    includeRelated: false,
    includeAttachments: false,
  })

  const [isExporting, setIsExporting] = useState(false)
  const [exportProgress, setExportProgress] = useState(0)
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null)

  // Convex queries
  const candidates = useQuery(api.candidates.list, {}) || []
  const jobs = useQuery(api.jobs.list, {}) || []
  const interviews = useQuery(api.interviews.list, {}) || []
  const teamMembers = useQuery(api.teams.getTeamMembers, {}) || []

  const handlePresetSelect = (presetId: string) => {
    const preset = exportPresets.find((p) => p.id === presetId)
    if (!preset) return

    setSelectedPreset(presetId)
    setConfig((prev) => ({
      ...prev,
      ...preset.config,
      fields: preset.config.entity ? entityFields[preset.config.entity] : prev.fields,
    }))
  }

  const handleFieldToggle = (fieldKey: string) => {
    setConfig((prev) => ({
      ...prev,
      fields: prev.fields.map((f) => (f.key === fieldKey ? { ...f, selected: !f.selected } : f)),
    }))
  }

  const handleSelectAllFields = (group?: string) => {
    setConfig((prev) => ({
      ...prev,
      fields: prev.fields.map((f) => (!group || f.group === group ? { ...f, selected: true } : f)),
    }))
  }

  const handleDeselectAllFields = (group?: string) => {
    setConfig((prev) => ({
      ...prev,
      fields: prev.fields.map((f) => (!group || f.group === group ? { ...f, selected: false } : f)),
    }))
  }

  const getExportData = () => {
    let data: any[] = []

    switch (config.entity) {
      case 'candidates':
        data = candidates
        break
      case 'jobs':
        data = jobs
        break
      case 'interviews':
        data = interviews
        break
      case 'team':
        data = teamMembers
        break
      default:
        data = []
    }

    // Apply filters
    if (config.filters.status?.length) {
      data = data.filter((item) => config.filters.status?.includes(item.status))
    }

    if (config.filters.dateRange) {
      data = data.filter((item) => {
        const itemDate = new Date(
          item.appliedDate || item.postedDate || item.date || item.createdAt
        )
        return (
          itemDate >= config.filters.dateRange?.from && itemDate <= config.filters.dateRange?.to
        )
      })
    }

    // Select only chosen fields
    const selectedFields = config.fields.filter((f) => f.selected)
    return data.map((item) => {
      const exportItem: any = {}
      selectedFields.forEach((field) => {
        const keys = field.key.split('.')
        let value = item
        for (const key of keys) {
          value = value?.[key]
        }
        exportItem[field.label] = value
      })
      return exportItem
    })
  }

  const exportToCSV = (data: any[]) => {
    if (!data.length) return

    const headers = Object.keys(data[0])
    const csv = [
      headers.join(','),
      ...data.map((row) =>
        headers
          .map((header) => {
            const value = row[header]
            if (value === null || value === undefined) return ''
            if (Array.isArray(value)) return `"${value.join(', ')}"`
            if (typeof value === 'string' && value.includes(',')) return `"${value}"`
            return value
          })
          .join(',')
      ),
    ].join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${config.entity}-export-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
  }

  const exportToJSON = (data: any[]) => {
    const json = JSON.stringify(data, null, 2)
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${config.entity}-export-${new Date().toISOString().split('T')[0]}.json`
    a.click()
  }

  const exportToExcel = async (data: any[]) => {
    // This would require a library like xlsx
    // For now, we'll export as CSV
    toast.info('Excel export would require additional libraries. Exporting as CSV instead.')
    exportToCSV(data)
  }

  const exportToPDF = async (_data: any[]) => {
    // This would require a library like jsPDF
    toast.info('PDF export would require additional libraries. Please use CSV or JSON format.')
  }

  const handleExport = async () => {
    setIsExporting(true)
    setExportProgress(0)

    try {
      // Simulate progress
      const progressInterval = setInterval(() => {
        setExportProgress((prev) => Math.min(prev + 20, 90))
      }, 200)

      const data = getExportData()

      if (!data.length) {
        toast.error('No data to export with current filters')
        clearInterval(progressInterval)
        setIsExporting(false)
        return
      }

      switch (config.format) {
        case 'csv':
          exportToCSV(data)
          break
        case 'json':
          exportToJSON(data)
          break
        case 'excel':
          await exportToExcel(data)
          break
        case 'pdf':
          await exportToPDF(data)
          break
      }

      clearInterval(progressInterval)
      setExportProgress(100)
      toast.success(`Successfully exported ${data.length} records`)

      setTimeout(() => {
        setIsExporting(false)
        setExportProgress(0)
      }, 1000)
    } catch (_error) {
      toast.error('Export failed. Please try again.')
      setIsExporting(false)
      setExportProgress(0)
    }
  }

  const selectedFieldCount = config.fields.filter((f) => f.selected).length
  const exportData = getExportData()

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Data Export</h1>
        <p className="text-gray-600">Export your ATS data in various formats</p>
      </div>

      {/* Quick Export Presets */}
      <div>
        <h3 className="text-lg font-semibold mb-3">Quick Export</h3>
        <div className="grid grid-cols-4 gap-3">
          {exportPresets.map((preset) => (
            <Card
              key={preset.id}
              className={`cursor-pointer hover:shadow-md transition-shadow ${
                selectedPreset === preset.id ? 'ring-2 ring-blue-500' : ''
              }`}
              onClick={() => handlePresetSelect(preset.id)}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-gray-100 rounded-lg">{preset.icon}</div>
                  <div className="flex-1">
                    <p className="font-medium text-sm">{preset.name}</p>
                    <p className="text-xs text-gray-600 mt-1">{preset.description}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Custom Export Configuration */}
      <Card>
        <CardHeader>
          <CardTitle>Custom Export</CardTitle>
          <CardDescription>Configure your export settings</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="data" className="space-y-4">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="data">Data Source</TabsTrigger>
              <TabsTrigger value="fields">Fields</TabsTrigger>
              <TabsTrigger value="filters">Filters</TabsTrigger>
              <TabsTrigger value="format">Format</TabsTrigger>
            </TabsList>

            <TabsContent value="data" className="space-y-4">
              <div>
                <Label>Select Data Type</Label>
                <RadioGroup
                  value={config.entity}
                  onValueChange={(value: string) => {
                    setConfig((prev) => ({
                      ...prev,
                      entity: value as ExportEntity,
                      fields: entityFields[value as ExportEntity],
                    }))
                  }}
                  className="grid grid-cols-3 gap-4 mt-2"
                >
                  <div className="flex items-center space-x-2 border rounded-lg p-3">
                    <RadioGroupItem value="candidates" id="candidates" />
                    <Label htmlFor="candidates" className="flex items-center gap-2 cursor-pointer">
                      <Users className="h-4 w-4" />
                      Candidates
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2 border rounded-lg p-3">
                    <RadioGroupItem value="jobs" id="jobs" />
                    <Label htmlFor="jobs" className="flex items-center gap-2 cursor-pointer">
                      <Briefcase className="h-4 w-4" />
                      Jobs
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2 border rounded-lg p-3">
                    <RadioGroupItem value="interviews" id="interviews" />
                    <Label htmlFor="interviews" className="flex items-center gap-2 cursor-pointer">
                      <Calendar className="h-4 w-4" />
                      Interviews
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2 border rounded-lg p-3">
                    <RadioGroupItem value="offers" id="offers" />
                    <Label htmlFor="offers" className="flex items-center gap-2 cursor-pointer">
                      <Package className="h-4 w-4" />
                      Offers
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2 border rounded-lg p-3">
                    <RadioGroupItem value="team" id="team" />
                    <Label htmlFor="team" className="flex items-center gap-2 cursor-pointer">
                      <Users className="h-4 w-4" />
                      Team Members
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2 border rounded-lg p-3">
                    <RadioGroupItem value="analytics" id="analytics" />
                    <Label htmlFor="analytics" className="flex items-center gap-2 cursor-pointer">
                      <Table className="h-4 w-4" />
                      Analytics
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label htmlFor="include-related">Include Related Data</Label>
                  <Checkbox
                    id="include-related"
                    checked={config.includeRelated}
                    onCheckedChange={(checked) =>
                      setConfig((prev) => ({ ...prev, includeRelated: checked as boolean }))
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="include-attachments">Include Attachment Links</Label>
                  <Checkbox
                    id="include-attachments"
                    checked={config.includeAttachments}
                    onCheckedChange={(checked) =>
                      setConfig((prev) => ({ ...prev, includeAttachments: checked as boolean }))
                    }
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="fields" className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-600">
                  {selectedFieldCount} of {config.fields.length} fields selected
                </p>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => handleSelectAllFields()}>
                    Select All
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => handleDeselectAllFields()}>
                    Deselect All
                  </Button>
                </div>
              </div>

              <div className="space-y-4 max-h-[400px] overflow-y-auto">
                {Array.from(new Set(config.fields.map((f) => f.group))).map((group) => (
                  <div key={group} className="space-y-2">
                    <div className="flex items-center justify-between sticky top-0 bg-white py-2">
                      <h4 className="font-medium text-sm">{group}</h4>
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleSelectAllFields(group)}
                        >
                          All
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDeselectAllFields(group)}
                        >
                          None
                        </Button>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 pl-4">
                      {config.fields
                        .filter((f) => f.group === group)
                        .map((field) => (
                          <div key={field.key} className="flex items-center space-x-2">
                            <Checkbox
                              id={field.key}
                              checked={field.selected}
                              onCheckedChange={() => handleFieldToggle(field.key)}
                            />
                            <Label
                              htmlFor={field.key}
                              className="text-sm font-normal cursor-pointer"
                            >
                              {field.label}
                            </Label>
                          </div>
                        ))}
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="filters" className="space-y-4">
              <div>
                <Label>Date Range</Label>
                <div className="mt-2">
                  {/* Date picker would go here */}
                  <p className="text-sm text-gray-500">Date range picker component</p>
                </div>
              </div>

              <div>
                <Label>Status Filter</Label>
                <Select>
                  <SelectTrigger className="mt-2">
                    <SelectValue placeholder="All statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Department Filter</Label>
                <Select>
                  <SelectTrigger className="mt-2">
                    <SelectValue placeholder="All departments" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Departments</SelectItem>
                    <SelectItem value="engineering">Engineering</SelectItem>
                    <SelectItem value="design">Design</SelectItem>
                    <SelectItem value="product">Product</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </TabsContent>

            <TabsContent value="format" className="space-y-4">
              <div>
                <Label>Export Format</Label>
                <RadioGroup
                  value={config.format}
                  onValueChange={(value: string) =>
                    setConfig((prev) => ({ ...prev, format: value as ExportFormat }))
                  }
                  className="grid grid-cols-2 gap-4 mt-2"
                >
                  <div className="flex items-center space-x-2 border rounded-lg p-3">
                    <RadioGroupItem value="csv" id="csv" />
                    <Label htmlFor="csv" className="flex items-center gap-2 cursor-pointer">
                      <FileText className="h-4 w-4" />
                      <div>
                        <p className="font-medium">CSV</p>
                        <p className="text-xs text-gray-500">Comma-separated values</p>
                      </div>
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2 border rounded-lg p-3">
                    <RadioGroupItem value="excel" id="excel" />
                    <Label htmlFor="excel" className="flex items-center gap-2 cursor-pointer">
                      <Table className="h-4 w-4" />
                      <div>
                        <p className="font-medium">Excel</p>
                        <p className="text-xs text-gray-500">Microsoft Excel format</p>
                      </div>
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2 border rounded-lg p-3">
                    <RadioGroupItem value="json" id="json" />
                    <Label htmlFor="json" className="flex items-center gap-2 cursor-pointer">
                      <FileText className="h-4 w-4" />
                      <div>
                        <p className="font-medium">JSON</p>
                        <p className="text-xs text-gray-500">JavaScript Object Notation</p>
                      </div>
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2 border rounded-lg p-3 opacity-50">
                    <RadioGroupItem value="pdf" id="pdf" disabled />
                    <Label htmlFor="pdf" className="flex items-center gap-2 cursor-pointer">
                      <FileText className="h-4 w-4" />
                      <div>
                        <p className="font-medium">PDF</p>
                        <p className="text-xs text-gray-500">Portable Document Format</p>
                      </div>
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Excel and PDF formats may require additional processing time for large datasets.
                </AlertDescription>
              </Alert>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Export Preview */}
      <Card>
        <CardHeader>
          <CardTitle>Export Preview</CardTitle>
          <CardDescription>Preview of data to be exported</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Badge variant="outline">{config.entity}</Badge>
                <Badge variant="outline">{config.format.toUpperCase()}</Badge>
                <Badge>{exportData.length} records</Badge>
                <Badge variant="secondary">{selectedFieldCount} fields</Badge>
              </div>
            </div>

            {exportData.length > 0 && (
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      {Object.keys(exportData[0])
                        .slice(0, 5)
                        .map((key) => (
                          <th key={key} className="px-4 py-2 text-left font-medium">
                            {key}
                          </th>
                        ))}
                      {Object.keys(exportData[0]).length > 5 && (
                        <th className="px-4 py-2 text-left font-medium">...</th>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {exportData.slice(0, 5).map((row, i) => (
                      <tr key={i} className="border-t">
                        {Object.values(row)
                          .slice(0, 5)
                          .map((value: any, j) => (
                            <td key={j} className="px-4 py-2">
                              {Array.isArray(value) ? value.join(', ') : value?.toString() || '-'}
                            </td>
                          ))}
                        {Object.keys(row).length > 5 && <td className="px-4 py-2">...</td>}
                      </tr>
                    ))}
                  </tbody>
                </table>
                {exportData.length > 5 && (
                  <div className="bg-gray-50 px-4 py-2 text-center text-sm text-gray-600">
                    ... and {exportData.length - 5} more rows
                  </div>
                )}
              </div>
            )}

            {exportData.length === 0 && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  No data available with current selection and filters
                </AlertDescription>
              </Alert>
            )}

            {/* Export Progress */}
            {isExporting && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Exporting...</span>
                  <span>{exportProgress}%</span>
                </div>
                <Progress value={exportProgress} className="h-2" />
              </div>
            )}

            {/* Export Button */}
            <div className="flex justify-end">
              <Button
                onClick={handleExport}
                disabled={isExporting || exportData.length === 0}
                size="lg"
              >
                {isExporting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Exporting...
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4 mr-2" />
                    Export {exportData.length} Records
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
