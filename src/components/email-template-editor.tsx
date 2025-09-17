"use client"

import { useState, useEffect } from "react"
import { useQuery, useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Id } from "@/convex/_generated/dataModel"
import {
  Mail, Plus, Trash2, Edit, Save, X, Eye, Send,
  Code, Copy, FileText, Users, Calendar, Package,
  ChevronDown, Tag, Sparkles, Link, Image, List,
  Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight,
  AlertCircle,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { toast } from "sonner"

type TemplateCategory = "application" | "interview" | "offer" | "rejection" | "general"
type TemplateVariable = {
  key: string
  label: string
  example: string
}

interface EmailTemplate {
  _id?: Id<"emailTemplates">
  name: string
  category: TemplateCategory
  subject: string
  content: string
  variables: string[]
  tags: string[]
  isActive: boolean
  lastUsed?: string
  useCount: number
}

const templateVariables: TemplateVariable[] = [
  { key: "{{candidate_name}}", label: "Candidate Name", example: "John Doe" },
  { key: "{{candidate_first}}", label: "First Name", example: "John" },
  { key: "{{candidate_email}}", label: "Candidate Email", example: "john@example.com" },
  { key: "{{position}}", label: "Position", example: "Senior Software Engineer" },
  { key: "{{department}}", label: "Department", example: "Engineering" },
  { key: "{{company}}", label: "Company Name", example: "Acme Corp" },
  { key: "{{interview_date}}", label: "Interview Date", example: "March 15, 2024" },
  { key: "{{interview_time}}", label: "Interview Time", example: "2:00 PM PST" },
  { key: "{{interview_type}}", label: "Interview Type", example: "Technical Interview" },
  { key: "{{interview_location}}", label: "Location/Link", example: "Zoom Meeting" },
  { key: "{{interviewers}}", label: "Interviewers", example: "Jane Smith, Bob Johnson" },
  { key: "{{salary}}", label: "Salary", example: "$150,000" },
  { key: "{{start_date}}", label: "Start Date", example: "April 1, 2024" },
  { key: "{{deadline}}", label: "Deadline", example: "March 20, 2024" },
  { key: "{{recruiter_name}}", label: "Recruiter Name", example: "Sarah Wilson" },
  { key: "{{recruiter_email}}", label: "Recruiter Email", example: "sarah@company.com" },
  { key: "{{recruiter_phone}}", label: "Recruiter Phone", example: "(555) 123-4567" },
]

const defaultTemplates: Omit<EmailTemplate, "_id">[] = [
  {
    name: "Application Received",
    category: "application",
    subject: "Application Received - {{position}} at {{company}}",
    content: `Dear {{candidate_name}},

Thank you for your interest in the {{position}} position at {{company}}. We have received your application and are currently reviewing it.

Our hiring team will carefully evaluate your qualifications and experience. If your profile matches our requirements, we will contact you within the next 5-7 business days to discuss the next steps.

In the meantime, feel free to learn more about our company culture and values on our careers page.

Best regards,
{{recruiter_name}}
{{company}} Talent Acquisition Team`,
    variables: ["candidate_name", "position", "company", "recruiter_name"],
    tags: ["application", "acknowledgment"],
    isActive: true,
    useCount: 0
  },
  {
    name: "Interview Invitation",
    category: "interview",
    subject: "Interview Invitation - {{position}} at {{company}}",
    content: `Dear {{candidate_first}},

We are pleased to inform you that you have been selected for an interview for the {{position}} position at {{company}}.

Interview Details:
- Date: {{interview_date}}
- Time: {{interview_time}}
- Type: {{interview_type}}
- Location: {{interview_location}}
- Interviewers: {{interviewers}}

Please confirm your availability by replying to this email. If you need to reschedule, please let us know as soon as possible.

We look forward to speaking with you!

Best regards,
{{recruiter_name}}
{{recruiter_email}}`,
    variables: ["candidate_first", "position", "company", "interview_date", "interview_time", "interview_type", "interview_location", "interviewers", "recruiter_name", "recruiter_email"],
    tags: ["interview", "invitation", "scheduling"],
    isActive: true,
    useCount: 0
  },
  {
    name: "Offer Letter",
    category: "offer",
    subject: "Job Offer - {{position}} at {{company}}",
    content: `Dear {{candidate_name}},

Congratulations! We are excited to extend an offer for the {{position}} position at {{company}}.

Offer Details:
- Position: {{position}}
- Department: {{department}}
- Annual Salary: {{salary}}
- Start Date: {{start_date}}

This offer is contingent upon successful completion of our background check and reference verification process.

Please review the attached formal offer letter for complete details including benefits, equity, and other compensation elements. We would appreciate your response by {{deadline}}.

If you have any questions, please don't hesitate to reach out.

Welcome to the team!

Best regards,
{{recruiter_name}}
{{company}}`,
    variables: ["candidate_name", "position", "company", "department", "salary", "start_date", "deadline", "recruiter_name"],
    tags: ["offer", "compensation", "hiring"],
    isActive: true,
    useCount: 0
  },
  {
    name: "Rejection - After Interview",
    category: "rejection",
    subject: "Update on Your Application - {{position}} at {{company}}",
    content: `Dear {{candidate_name}},

Thank you for taking the time to interview with us for the {{position}} position at {{company}}. We appreciate your interest in joining our team and the opportunity to learn about your background and experience.

After careful consideration, we have decided to move forward with other candidates whose qualifications more closely match our current needs.

We were impressed by your skills and experience, and we encourage you to apply for future opportunities that align with your expertise. We will keep your resume on file for consideration as new positions become available.

We wish you the best in your job search and future endeavors.

Sincerely,
{{recruiter_name}}
{{company}} Talent Acquisition Team`,
    variables: ["candidate_name", "position", "company", "recruiter_name"],
    tags: ["rejection", "post-interview"],
    isActive: true,
    useCount: 0
  }
]

export function EmailTemplateEditor() {
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null)
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null)
  const [showPreview, setShowPreview] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [categoryFilter, setCategoryFilter] = useState<TemplateCategory | "all">("all")
  const [isCreating, setIsCreating] = useState(false)
  const [testData, setTestData] = useState<Record<string, string>>({})

  // Mock Convex queries - replace with actual API calls
  const templates = useQuery(api.teams.getEmailTemplates) || defaultTemplates
  const saveTemplate = useMutation(api.teams.saveEmailTemplate)
  const deleteTemplate = useMutation(api.teams.deleteEmailTemplate)
  const duplicateTemplate = useMutation(api.teams.duplicateEmailTemplate)

  useEffect(() => {
    // Initialize test data with example values
    const data: Record<string, string> = {}
    templateVariables.forEach(v => {
      data[v.key] = v.example
    })
    setTestData(data)
  }, [])

  const filteredTemplates = templates.filter(t => {
    const matchesSearch = !searchQuery ||
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.content.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesCategory = categoryFilter === "all" || t.category === categoryFilter

    return matchesSearch && matchesCategory
  })

  const handleCreateNew = () => {
    const newTemplate: EmailTemplate = {
      name: "New Template",
      category: "general",
      subject: "",
      content: "",
      variables: [],
      tags: [],
      isActive: true,
      useCount: 0
    }
    setEditingTemplate(newTemplate)
    setIsCreating(true)
  }

  const handleSaveTemplate = async () => {
    if (!editingTemplate) return

    try {
      // Extract variables from content and subject
      const contentVars = (editingTemplate.content.match(/\{\{[^}]+\}\}/g) || [])
      const subjectVars = (editingTemplate.subject.match(/\{\{[^}]+\}\}/g) || [])
      const allVars = [...new Set([...contentVars, ...subjectVars])]
        .map(v => v.replace(/[{}]/g, "").trim())

      await saveTemplate({
        ...editingTemplate,
        variables: allVars
      })

      toast.success(`Template "${editingTemplate.name}" saved successfully`)
      setEditingTemplate(null)
      setIsCreating(false)
    } catch (error) {
      toast.error("Failed to save template")
    }
  }

  const handleDeleteTemplate = async (id: Id<"emailTemplates">) => {
    try {
      await deleteTemplate({ id })
      toast.success("Template deleted")
      setSelectedTemplate(null)
    } catch (error) {
      toast.error("Failed to delete template")
    }
  }

  const handleDuplicateTemplate = async (template: EmailTemplate) => {
    try {
      await duplicateTemplate({
        id: template._id!,
        name: `${template.name} (Copy)`
      })
      toast.success("Template duplicated")
    } catch (error) {
      toast.error("Failed to duplicate template")
    }
  }

  const insertVariable = (variable: string) => {
    if (!editingTemplate) return

    const textarea = document.getElementById("template-content") as HTMLTextAreaElement
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const content = editingTemplate.content
    const newContent = content.substring(0, start) + variable + content.substring(end)

    setEditingTemplate({
      ...editingTemplate,
      content: newContent
    })

    // Reset cursor position
    setTimeout(() => {
      textarea.selectionStart = start + variable.length
      textarea.selectionEnd = start + variable.length
      textarea.focus()
    }, 0)
  }

  const renderPreview = (template: EmailTemplate) => {
    let preview = template.content
    let subject = template.subject

    // Replace variables with test data
    Object.entries(testData).forEach(([key, value]) => {
      const regex = new RegExp(key.replace(/[{}]/g, "\\$&"), "g")
      preview = preview.replace(regex, value)
      subject = subject.replace(regex, value)
    })

    return { subject, content: preview }
  }

  const getCategoryIcon = (category: TemplateCategory) => {
    switch (category) {
      case "application":
        return <FileText className="h-4 w-4" />
      case "interview":
        return <Calendar className="h-4 w-4" />
      case "offer":
        return <Package className="h-4 w-4" />
      case "rejection":
        return <X className="h-4 w-4" />
      default:
        return <Mail className="h-4 w-4" />
    }
  }

  const getCategoryColor = (category: TemplateCategory) => {
    switch (category) {
      case "application":
        return "bg-blue-500"
      case "interview":
        return "bg-purple-500"
      case "offer":
        return "bg-green-500"
      case "rejection":
        return "bg-red-500"
      default:
        return "bg-gray-500"
    }
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Email Templates</h1>
          <p className="text-gray-600">Create and manage email templates for candidate communication</p>
        </div>
        <Button onClick={handleCreateNew}>
          <Plus className="h-4 w-4 mr-2" />
          New Template
        </Button>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* Template List */}
        <div className="col-span-4">
          <Card className="h-[calc(100vh-200px)]">
            <CardHeader className="pb-3">
              <div className="space-y-3">
                <Input
                  placeholder="Search templates..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full"
                />
                <Select value={categoryFilter} onValueChange={(v) => setCategoryFilter(v as any)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    <SelectItem value="application">Application</SelectItem>
                    <SelectItem value="interview">Interview</SelectItem>
                    <SelectItem value="offer">Offer</SelectItem>
                    <SelectItem value="rejection">Rejection</SelectItem>
                    <SelectItem value="general">General</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[calc(100vh-350px)]">
                <div className="space-y-2 p-4">
                  {filteredTemplates.map((template) => (
                    <div
                      key={template._id || template.name}
                      className={`p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors ${
                        selectedTemplate?._id === template._id ? "border-blue-500 bg-blue-50" : ""
                      }`}
                      onClick={() => setSelectedTemplate(template)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <div className={`h-2 w-2 rounded-full ${getCategoryColor(template.category)}`} />
                            <p className="font-medium text-sm">{template.name}</p>
                          </div>
                          <p className="text-xs text-gray-600 mt-1 line-clamp-1">{template.subject}</p>
                          <div className="flex items-center gap-2 mt-2">
                            <Badge variant="secondary" className="text-xs">
                              {template.category}
                            </Badge>
                            {template.useCount > 0 && (
                              <span className="text-xs text-gray-500">
                                Used {template.useCount} times
                              </span>
                            )}
                          </div>
                        </div>
                        {!template.isActive && (
                          <Badge variant="outline" className="text-xs">
                            Inactive
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        {/* Template Editor/Viewer */}
        <div className="col-span-8">
          {editingTemplate ? (
            <Card className="h-[calc(100vh-200px)]">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>
                    {isCreating ? "Create New Template" : "Edit Template"}
                  </CardTitle>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setEditingTemplate(null)
                        setIsCreating(false)
                      }}
                    >
                      Cancel
                    </Button>
                    <Button size="sm" onClick={handleSaveTemplate}>
                      <Save className="h-4 w-4 mr-2" />
                      Save
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Template Name</Label>
                      <Input
                        value={editingTemplate.name}
                        onChange={(e) => setEditingTemplate({
                          ...editingTemplate,
                          name: e.target.value
                        })}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label>Category</Label>
                      <Select
                        value={editingTemplate.category}
                        onValueChange={(v) => setEditingTemplate({
                          ...editingTemplate,
                          category: v as TemplateCategory
                        })}
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="application">Application</SelectItem>
                          <SelectItem value="interview">Interview</SelectItem>
                          <SelectItem value="offer">Offer</SelectItem>
                          <SelectItem value="rejection">Rejection</SelectItem>
                          <SelectItem value="general">General</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label>Subject Line</Label>
                    <Input
                      value={editingTemplate.subject}
                      onChange={(e) => setEditingTemplate({
                        ...editingTemplate,
                        subject: e.target.value
                      })}
                      placeholder="Email subject..."
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <Label>Email Content</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" size="sm">
                            <Code className="h-4 w-4 mr-2" />
                            Insert Variable
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-80">
                          <div className="space-y-2">
                            <p className="text-sm font-medium">Available Variables</p>
                            <ScrollArea className="h-[300px]">
                              <div className="space-y-1">
                                {templateVariables.map((variable) => (
                                  <div
                                    key={variable.key}
                                    className="flex items-center justify-between p-2 hover:bg-gray-50 rounded cursor-pointer"
                                    onClick={() => insertVariable(variable.key)}
                                  >
                                    <div>
                                      <p className="text-sm font-medium">{variable.label}</p>
                                      <p className="text-xs text-gray-500">{variable.key}</p>
                                    </div>
                                    <Button size="sm" variant="ghost">
                                      <Plus className="h-3 w-3" />
                                    </Button>
                                  </div>
                                ))}
                              </div>
                            </ScrollArea>
                          </div>
                        </PopoverContent>
                      </Popover>
                    </div>
                    <Textarea
                      id="template-content"
                      value={editingTemplate.content}
                      onChange={(e) => setEditingTemplate({
                        ...editingTemplate,
                        content: e.target.value
                      })}
                      placeholder="Email content..."
                      className="min-h-[300px] font-mono text-sm"
                    />
                  </div>

                  <div>
                    <Label>Tags (comma-separated)</Label>
                    <Input
                      value={editingTemplate.tags.join(", ")}
                      onChange={(e) => setEditingTemplate({
                        ...editingTemplate,
                        tags: e.target.value.split(",").map(t => t.trim()).filter(Boolean)
                      })}
                      placeholder="e.g., interview, technical, followup"
                      className="mt-1"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="active">Active Template</Label>
                    <Switch
                      id="active"
                      checked={editingTemplate.isActive}
                      onCheckedChange={(checked) => setEditingTemplate({
                        ...editingTemplate,
                        isActive: checked
                      })}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : selectedTemplate ? (
            <Card className="h-[calc(100vh-200px)]">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>{selectedTemplate.name}</CardTitle>
                    <CardDescription className="mt-1">
                      {selectedTemplate.category} template • Used {selectedTemplate.useCount} times
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDuplicateTemplate(selectedTemplate)}
                    >
                      <Copy className="h-4 w-4 mr-2" />
                      Duplicate
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditingTemplate(selectedTemplate)}
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => selectedTemplate._id && handleDeleteTemplate(selectedTemplate._id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="template" className="h-full">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="template">Template</TabsTrigger>
                    <TabsTrigger value="preview">Preview</TabsTrigger>
                    <TabsTrigger value="test">Test Send</TabsTrigger>
                  </TabsList>

                  <TabsContent value="template" className="space-y-4">
                    <div>
                      <Label className="text-xs text-gray-500">Subject</Label>
                      <p className="mt-1 p-2 bg-gray-50 rounded text-sm">{selectedTemplate.subject}</p>
                    </div>

                    <div>
                      <Label className="text-xs text-gray-500">Content</Label>
                      <div className="mt-1 p-4 bg-gray-50 rounded">
                        <pre className="whitespace-pre-wrap text-sm font-sans">{selectedTemplate.content}</pre>
                      </div>
                    </div>

                    <div>
                      <Label className="text-xs text-gray-500">Variables Used</Label>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {selectedTemplate.variables.map((v) => (
                          <Badge key={v} variant="secondary">
                            {`{{${v}}}`}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div>
                      <Label className="text-xs text-gray-500">Tags</Label>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {selectedTemplate.tags.map((tag) => (
                          <Badge key={tag} variant="outline">
                            <Tag className="h-3 w-3 mr-1" />
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="preview" className="space-y-4">
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        This preview shows how the email will appear with sample data
                      </AlertDescription>
                    </Alert>

                    <div className="border rounded-lg p-4">
                      <div className="space-y-3">
                        <div>
                          <p className="text-xs text-gray-500 mb-1">From</p>
                          <p className="text-sm">recruiter@company.com</p>
                        </div>
                        <Separator />
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Subject</p>
                          <p className="text-sm font-medium">
                            {renderPreview(selectedTemplate).subject}
                          </p>
                        </div>
                        <Separator />
                        <div>
                          <p className="text-xs text-gray-500 mb-2">Message</p>
                          <div className="bg-white p-4 rounded">
                            <pre className="whitespace-pre-wrap text-sm">
                              {renderPreview(selectedTemplate).content}
                            </pre>
                          </div>
                        </div>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="test" className="space-y-4">
                    <Alert>
                      <Mail className="h-4 w-4" />
                      <AlertDescription>
                        Send a test email to verify the template formatting
                      </AlertDescription>
                    </Alert>

                    <div className="space-y-4">
                      <div>
                        <Label>Test Email Address</Label>
                        <Input
                          type="email"
                          placeholder="test@example.com"
                          className="mt-1"
                        />
                      </div>

                      <div>
                        <Label className="mb-2">Test Data</Label>
                        <ScrollArea className="h-[200px] border rounded-lg p-3">
                          <div className="space-y-2">
                            {selectedTemplate.variables.map((variable) => {
                              const varKey = `{{${variable}}}`
                              const varInfo = templateVariables.find(v => v.key === varKey)
                              return (
                                <div key={variable} className="grid grid-cols-2 gap-2 items-center">
                                  <Label className="text-sm">{varInfo?.label || variable}</Label>
                                  <Input
                                    value={testData[varKey] || ""}
                                    onChange={(e) => setTestData({
                                      ...testData,
                                      [varKey]: e.target.value
                                    })}
                                    className="h-8"
                                  />
                                </div>
                              )
                            })}
                          </div>
                        </ScrollArea>
                      </div>

                      <Button className="w-full">
                        <Send className="h-4 w-4 mr-2" />
                        Send Test Email
                      </Button>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          ) : (
            <Card className="h-[calc(100vh-200px)] flex items-center justify-center">
              <CardContent className="text-center">
                <Mail className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">Select a template to view details</p>
                <p className="text-sm text-gray-500 mt-2">
                  Or create a new template to get started
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}