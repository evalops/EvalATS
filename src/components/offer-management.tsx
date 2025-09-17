'use client'

import { useState } from 'react'
import { useQuery, useMutation } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { Id } from '@/convex/_generated/dataModel'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { Checkbox } from '@/components/ui/checkbox'
import { toast } from '@/components/ui/use-toast'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  DollarSign,
  Calendar,
  MapPin,
  Briefcase,
  Gift,
  FileText,
  Send,
  Check,
  X,
  Clock,
  AlertCircle,
  Eye,
  Download,
  Edit,
  Users,
  Building,
  TrendingUp,
  Shield,
  Mail,
  Phone,
  User,
  CheckCircle2,
  XCircle,
  Timer,
  History,
  ArrowRight,
  PlusCircle
} from 'lucide-react'
import { format, addDays } from 'date-fns'
import { cn } from '@/lib/utils'

interface OfferManagementProps {
  candidateId: Id<'candidates'>
  jobId: Id<'jobs'>
  onComplete?: () => void
}

interface OfferDetails {
  salary: number
  currency: string
  bonus?: number
  equity?: string
  startDate: string
  location: string
  employmentType: string
  benefits: string[]
}

const standardBenefits = [
  'Health Insurance',
  'Dental Insurance',
  'Vision Insurance',
  '401(k) Matching',
  'Life Insurance',
  'Disability Insurance',
  'Paid Time Off',
  'Sick Leave',
  'Parental Leave',
  'Professional Development',
  'Remote Work Options',
  'Flexible Hours',
  'Commuter Benefits',
  'Gym Membership',
  'Stock Options',
  'Bonus Plan',
  'Relocation Assistance',
  'Tuition Reimbursement'
]

const employmentTypes = [
  { value: 'full-time', label: 'Full-Time' },
  { value: 'part-time', label: 'Part-Time' },
  { value: 'contract', label: 'Contract' },
  { value: 'temporary', label: 'Temporary' },
  { value: 'internship', label: 'Internship' }
]

export function OfferManagement({ candidateId, jobId, onComplete }: OfferManagementProps) {
  const [activeTab, setActiveTab] = useState('details')
  const [offerDetails, setOfferDetails] = useState<OfferDetails>({
    salary: 0,
    currency: 'USD',
    bonus: undefined,
    equity: undefined,
    startDate: format(addDays(new Date(), 14), 'yyyy-MM-dd'),
    location: '',
    employmentType: 'full-time',
    benefits: []
  })
  const [customTerms, setCustomTerms] = useState('')
  const [selectedBenefits, setSelectedBenefits] = useState<string[]>([])
  const [showPreview, setShowPreview] = useState(false)
  const [sendingOffer, setSendingOffer] = useState(false)

  // Get data from Convex
  const candidate = useQuery(api.candidates.getById, { id: candidateId })
  const job = useQuery(api.jobs.getById, { id: jobId })
  const offer = useQuery(api.teams.getOffer, { candidateId, jobId })
  const hiringTeam = useQuery(api.teams.getHiringTeam, { jobId })

  // Mutations
  const upsertOffer = useMutation(api.teams.upsertOffer)
  const sendOffer = useMutation(api.teams.sendOffer)
  const reviewOffer = useMutation(api.teams.reviewOffer)

  // Get current user (would come from auth)
  const currentUser = hiringTeam?.[0] // Placeholder

  // Calculate total compensation
  const calculateTotalComp = () => {
    const base = offerDetails.salary || 0
    const bonus = offerDetails.bonus || 0
    return base + bonus
  }

  // Handle offer creation/update
  const handleSaveOffer = async () => {
    if (!currentUser) {
      toast({
        title: "Error",
        description: "Unable to identify current user",
        variant: "destructive"
      })
      return
    }

    try {
      await upsertOffer({
        candidateId,
        jobId,
        details: {
          ...offerDetails,
          benefits: selectedBenefits
        },
        customTerms,
        expiresAt: format(addDays(new Date(), 7), 'yyyy-MM-dd'),
        createdBy: currentUser.teamMemberId
      })

      toast({
        title: "Offer saved",
        description: "The offer has been saved as a draft"
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save offer",
        variant: "destructive"
      })
    }
  }

  // Handle sending offer
  const handleSendOffer = async () => {
    if (!offer) {
      toast({
        title: "Error",
        description: "Please save the offer first",
        variant: "destructive"
      })
      return
    }

    if (offer.status !== 'approved') {
      toast({
        title: "Approval required",
        description: "The offer must be approved before sending",
        variant: "destructive"
      })
      return
    }

    setSendingOffer(true)
    try {
      // Generate offer letter URL (would integrate with document generation service)
      const letterUrl = `https://offers.company.com/${offer._id}`

      await sendOffer({
        offerId: offer._id,
        letterUrl
      })

      toast({
        title: "Offer sent!",
        description: `Offer has been sent to ${candidate?.email}`
      })

      onComplete?.()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send offer",
        variant: "destructive"
      })
    } finally {
      setSendingOffer(false)
    }
  }

  // Handle approval
  const handleApproval = async (approved: boolean) => {
    if (!offer || !currentUser) return

    try {
      await reviewOffer({
        offerId: offer._id,
        approverId: currentUser.teamMemberId,
        status: approved ? 'approved' : 'rejected',
        comments: approved ? 'Approved' : 'Changes required'
      })

      toast({
        title: approved ? "Offer approved" : "Offer rejected",
        description: approved
          ? "The offer is now ready to send"
          : "Please make the necessary changes"
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update approval status",
        variant: "destructive"
      })
    }
  }

  // Offer status badge
  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      draft: { variant: 'outline', icon: Edit },
      pending_approval: { variant: 'warning', icon: Clock },
      approved: { variant: 'default', icon: CheckCircle2 },
      sent: { variant: 'secondary', icon: Send },
      viewed: { variant: 'secondary', icon: Eye },
      accepted: { variant: 'success', icon: Check },
      declined: { variant: 'destructive', icon: X },
      expired: { variant: 'destructive', icon: Timer },
      withdrawn: { variant: 'outline', icon: X }
    }

    const config = variants[status] || variants.draft
    const Icon = config.icon

    return (
      <Badge variant={config.variant} className="gap-1">
        <Icon className="h-3 w-3" />
        {status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
      </Badge>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl">Offer Management</CardTitle>
              <CardDescription>
                Create and manage offer for {candidate?.name} - {job?.title}
              </CardDescription>
            </div>
            {offer && getStatusBadge(offer.status)}
          </div>
        </CardHeader>
        <CardContent>
          {/* Offer Timeline */}
          {offer && (
            <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Created</p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(offer.createdAt), 'MMM d, yyyy')}
                    </p>
                  </div>
                </div>

                {offer.sentAt && (
                  <>
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    <div className="flex items-center gap-2">
                      <Send className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">Sent</p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(offer.sentAt), 'MMM d, yyyy')}
                        </p>
                      </div>
                    </div>
                  </>
                )}

                {offer.viewedAt && (
                  <>
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    <div className="flex items-center gap-2">
                      <Eye className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">Viewed</p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(offer.viewedAt), 'MMM d, yyyy')}
                        </p>
                      </div>
                    </div>
                  </>
                )}

                {offer.respondedAt && (
                  <>
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    <div className="flex items-center gap-2">
                      {offer.status === 'accepted' ? (
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-600" />
                      )}
                      <div>
                        <p className="text-sm font-medium">
                          {offer.status === 'accepted' ? 'Accepted' : 'Declined'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(offer.respondedAt), 'MMM d, yyyy')}
                        </p>
                      </div>
                    </div>
                  </>
                )}
              </div>

              <div className="text-right">
                <p className="text-sm text-muted-foreground">Expires</p>
                <p className="text-sm font-medium">
                  {format(new Date(offer.expiresAt), 'MMM d, yyyy')}
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="details">Offer Details</TabsTrigger>
          <TabsTrigger value="benefits">Benefits</TabsTrigger>
          <TabsTrigger value="approvals">Approvals</TabsTrigger>
          <TabsTrigger value="preview">Preview</TabsTrigger>
        </TabsList>

        <TabsContent value="details">
          <Card>
            <CardHeader>
              <CardTitle>Compensation & Details</CardTitle>
              <CardDescription>
                Define the compensation package and employment terms
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Salary */}
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="salary">Base Salary</Label>
                  <div className="flex gap-2">
                    <Select
                      value={offerDetails.currency}
                      onValueChange={(v) => setOfferDetails({...offerDetails, currency: v})}
                    >
                      <SelectTrigger className="w-24">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="USD">USD</SelectItem>
                        <SelectItem value="EUR">EUR</SelectItem>
                        <SelectItem value="GBP">GBP</SelectItem>
                        <SelectItem value="CAD">CAD</SelectItem>
                        <SelectItem value="AUD">AUD</SelectItem>
                      </SelectContent>
                    </Select>
                    <Input
                      id="salary"
                      type="number"
                      placeholder="120000"
                      value={offerDetails.salary || ''}
                      onChange={(e) => setOfferDetails({
                        ...offerDetails,
                        salary: parseInt(e.target.value) || 0
                      })}
                      className="flex-1"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bonus">Signing/Annual Bonus (Optional)</Label>
                  <Input
                    id="bonus"
                    type="number"
                    placeholder="20000"
                    value={offerDetails.bonus || ''}
                    onChange={(e) => setOfferDetails({
                      ...offerDetails,
                      bonus: parseInt(e.target.value) || undefined
                    })}
                  />
                </div>
              </div>

              {/* Equity */}
              <div className="space-y-2">
                <Label htmlFor="equity">Equity/Stock Options (Optional)</Label>
                <Input
                  id="equity"
                  placeholder="e.g., 10,000 stock options over 4 years"
                  value={offerDetails.equity || ''}
                  onChange={(e) => setOfferDetails({
                    ...offerDetails,
                    equity: e.target.value || undefined
                  })}
                />
              </div>

              {/* Employment Type & Start Date */}
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Employment Type</Label>
                  <Select
                    value={offerDetails.employmentType}
                    onValueChange={(v) => setOfferDetails({...offerDetails, employmentType: v})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {employmentTypes.map(type => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="startDate">Start Date</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={offerDetails.startDate}
                    onChange={(e) => setOfferDetails({
                      ...offerDetails,
                      startDate: e.target.value
                    })}
                  />
                </div>
              </div>

              {/* Location */}
              <div className="space-y-2">
                <Label htmlFor="location">Work Location</Label>
                <Input
                  id="location"
                  placeholder="e.g., San Francisco, CA / Remote"
                  value={offerDetails.location}
                  onChange={(e) => setOfferDetails({
                    ...offerDetails,
                    location: e.target.value
                  })}
                />
              </div>

              {/* Custom Terms */}
              <div className="space-y-2">
                <Label htmlFor="customTerms">Additional Terms (Optional)</Label>
                <Textarea
                  id="customTerms"
                  placeholder="Any special conditions, relocation assistance, etc."
                  value={customTerms}
                  onChange={(e) => setCustomTerms(e.target.value)}
                  rows={4}
                />
              </div>

              {/* Total Compensation Summary */}
              <div className="p-4 bg-muted/50 rounded-lg">
                <h4 className="font-semibold mb-2">Total Compensation Summary</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>Base Salary:</span>
                    <span className="font-medium">
                      {offerDetails.currency} {offerDetails.salary.toLocaleString()}
                    </span>
                  </div>
                  {offerDetails.bonus && (
                    <div className="flex justify-between">
                      <span>Bonus:</span>
                      <span className="font-medium">
                        {offerDetails.currency} {offerDetails.bonus.toLocaleString()}
                      </span>
                    </div>
                  )}
                  {offerDetails.equity && (
                    <div className="flex justify-between">
                      <span>Equity:</span>
                      <span className="font-medium">{offerDetails.equity}</span>
                    </div>
                  )}
                  <Separator className="my-2" />
                  <div className="flex justify-between font-semibold">
                    <span>Total Cash Compensation:</span>
                    <span>
                      {offerDetails.currency} {calculateTotalComp().toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={handleSaveOffer} className="w-full">
                <Check className="h-4 w-4 mr-2" />
                Save Offer Details
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="benefits">
          <Card>
            <CardHeader>
              <CardTitle>Benefits Package</CardTitle>
              <CardDescription>
                Select the benefits included in this offer
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {standardBenefits.map(benefit => (
                  <div key={benefit} className="flex items-center space-x-2">
                    <Checkbox
                      id={benefit}
                      checked={selectedBenefits.includes(benefit)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedBenefits([...selectedBenefits, benefit])
                        } else {
                          setSelectedBenefits(selectedBenefits.filter(b => b !== benefit))
                        }
                      }}
                    />
                    <Label
                      htmlFor={benefit}
                      className="text-sm font-normal cursor-pointer"
                    >
                      {benefit}
                    </Label>
                  </div>
                ))}
              </div>

              <div className="mt-6 p-4 bg-muted/50 rounded-lg">
                <p className="text-sm font-medium mb-2">Selected Benefits ({selectedBenefits.length})</p>
                <div className="flex flex-wrap gap-2">
                  {selectedBenefits.map(benefit => (
                    <Badge key={benefit} variant="secondary">
                      {benefit}
                    </Badge>
                  ))}
                  {selectedBenefits.length === 0 && (
                    <p className="text-sm text-muted-foreground">No benefits selected</p>
                  )}
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={handleSaveOffer} className="w-full">
                <Check className="h-4 w-4 mr-2" />
                Save Benefits
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="approvals">
          <Card>
            <CardHeader>
              <CardTitle>Approval Process</CardTitle>
              <CardDescription>
                Review and approve the offer before sending
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Approval Requirements */}
              <Alert>
                <Shield className="h-4 w-4" />
                <AlertTitle>Approval Requirements</AlertTitle>
                <AlertDescription>
                  This offer requires approval from the hiring manager and HR before it can be sent to the candidate.
                </AlertDescription>
              </Alert>

              {/* Approvers */}
              <div className="space-y-3">
                <h4 className="font-medium">Required Approvals</h4>
                {offer?.approvals && offer.approvals.length > 0 ? (
                  <div className="space-y-2">
                    {offer.approvals.map((approval, idx) => {
                      const approver = hiringTeam?.find(m => m.teamMemberId === approval.approverId)
                      return (
                        <div key={idx} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={approver?.member?.avatar} />
                              <AvatarFallback>
                                {approver?.member?.name?.split(' ').map(n => n[0]).join('')}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="text-sm font-medium">{approver?.member?.name}</p>
                              <p className="text-xs text-muted-foreground">{approval.role}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {approval.status === 'approved' && (
                              <Badge variant="success" className="gap-1">
                                <CheckCircle2 className="h-3 w-3" />
                                Approved
                              </Badge>
                            )}
                            {approval.status === 'rejected' && (
                              <Badge variant="destructive" className="gap-1">
                                <XCircle className="h-3 w-3" />
                                Rejected
                              </Badge>
                            )}
                            {approval.status === 'pending' && (
                              <Badge variant="warning" className="gap-1">
                                <Clock className="h-3 w-3" />
                                Pending
                              </Badge>
                            )}
                            <span className="text-xs text-muted-foreground">
                              {format(new Date(approval.timestamp), 'MMM d, h:mm a')}
                            </span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {hiringTeam?.filter(m =>
                      m.role === 'hiring_manager' || m.role === 'recruiter'
                    ).map(member => (
                      <div key={member.teamMemberId} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={member.member?.avatar} />
                            <AvatarFallback>
                              {member.member?.name?.split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-sm font-medium">{member.member?.name}</p>
                            <p className="text-xs text-muted-foreground">{member.role}</p>
                          </div>
                        </div>
                        <Badge variant="outline" className="gap-1">
                          <Clock className="h-3 w-3" />
                          Pending
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Approval Actions */}
              {offer && offer.status === 'draft' && (
                <div className="flex gap-3">
                  <Button
                    onClick={() => handleApproval(true)}
                    className="flex-1"
                    variant="default"
                  >
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Approve Offer
                  </Button>
                  <Button
                    onClick={() => handleApproval(false)}
                    className="flex-1"
                    variant="destructive"
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Request Changes
                  </Button>
                </div>
              )}

              {offer && offer.status === 'approved' && (
                <Alert className="border-green-200 bg-green-50">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <AlertTitle>Offer Approved</AlertTitle>
                  <AlertDescription>
                    This offer has been approved and is ready to send to the candidate.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="preview">
          <Card>
            <CardHeader>
              <CardTitle>Offer Letter Preview</CardTitle>
              <CardDescription>
                Review the offer letter before sending
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="border rounded-lg p-6 space-y-4 bg-white">
                {/* Letter Header */}
                <div className="text-center space-y-2">
                  <h2 className="text-2xl font-bold">Offer Letter</h2>
                  <p className="text-muted-foreground">{format(new Date(), 'MMMM d, yyyy')}</p>
                </div>

                <Separator />

                {/* Recipient */}
                <div>
                  <p className="font-medium">{candidate?.name}</p>
                  <p className="text-sm text-muted-foreground">{candidate?.email}</p>
                  <p className="text-sm text-muted-foreground">{candidate?.phone}</p>
                </div>

                {/* Letter Content */}
                <div className="space-y-4 text-sm">
                  <p>Dear {candidate?.name},</p>

                  <p>
                    We are pleased to offer you the position of <strong>{job?.title}</strong> at our company.
                    We believe your skills and experience will be valuable assets to our team.
                  </p>

                  <div className="space-y-2">
                    <p className="font-medium">Position Details:</p>
                    <ul className="list-disc pl-6 space-y-1">
                      <li>Position: {job?.title}</li>
                      <li>Department: {job?.department}</li>
                      <li>Employment Type: {offerDetails.employmentType}</li>
                      <li>Start Date: {format(new Date(offerDetails.startDate), 'MMMM d, yyyy')}</li>
                      <li>Location: {offerDetails.location}</li>
                    </ul>
                  </div>

                  <div className="space-y-2">
                    <p className="font-medium">Compensation:</p>
                    <ul className="list-disc pl-6 space-y-1">
                      <li>Base Salary: {offerDetails.currency} {offerDetails.salary.toLocaleString()} per year</li>
                      {offerDetails.bonus && (
                        <li>Signing/Annual Bonus: {offerDetails.currency} {offerDetails.bonus.toLocaleString()}</li>
                      )}
                      {offerDetails.equity && (
                        <li>Equity: {offerDetails.equity}</li>
                      )}
                    </ul>
                  </div>

                  {selectedBenefits.length > 0 && (
                    <div className="space-y-2">
                      <p className="font-medium">Benefits:</p>
                      <ul className="list-disc pl-6 space-y-1">
                        {selectedBenefits.slice(0, 6).map(benefit => (
                          <li key={benefit}>{benefit}</li>
                        ))}
                        {selectedBenefits.length > 6 && (
                          <li>And {selectedBenefits.length - 6} more benefits...</li>
                        )}
                      </ul>
                    </div>
                  )}

                  {customTerms && (
                    <div className="space-y-2">
                      <p className="font-medium">Additional Terms:</p>
                      <p>{customTerms}</p>
                    </div>
                  )}

                  <p>
                    This offer is contingent upon successful completion of our standard background check and reference verification process.
                  </p>

                  <p>
                    Please indicate your acceptance of this offer by signing and returning this letter by{' '}
                    <strong>{format(addDays(new Date(), 7), 'MMMM d, yyyy')}</strong>.
                  </p>

                  <p>
                    We look forward to welcoming you to our team!
                  </p>

                  <div className="mt-6">
                    <p>Sincerely,</p>
                    <p className="mt-3 font-medium">Hiring Team</p>
                    <p className="text-sm text-muted-foreground">Your Company Name</p>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex gap-3">
              <Button variant="outline" className="flex-1">
                <Download className="h-4 w-4 mr-2" />
                Download PDF
              </Button>
              <Button
                onClick={handleSendOffer}
                disabled={!offer || offer.status !== 'approved' || sendingOffer}
                className="flex-1"
              >
                {sendingOffer ? (
                  <>
                    <Clock className="h-4 w-4 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Send Offer
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}