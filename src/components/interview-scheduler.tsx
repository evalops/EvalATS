'use client'

import { useState } from 'react'
import { useQuery, useMutation } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { Id } from '@/convex/_generated/dataModel'
import { Calendar } from '@/components/ui/calendar'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
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
  CalendarDays,
  Clock,
  MapPin,
  Users,
  Video,
  Phone,
  Building2,
  Plus,
  Check,
  X,
  AlertCircle,
  Send,
  ChevronLeft,
  ChevronRight,
  User,
  Mail,
  Calendar as CalendarIcon,
  Link2,
  FileText
} from 'lucide-react'
import { format, addDays, startOfWeek, addHours, isSameDay, isAfter, isBefore, parseISO } from 'date-fns'
import { cn } from '@/lib/utils'

interface InterviewSchedulerProps {
  candidateId: Id<'candidates'>
  jobId: Id<'jobs'>
  onScheduled?: () => void
}

interface TimeSlot {
  start: Date
  end: Date
  available: boolean
  interviewerId?: Id<'teamMembers'>
}

export function InterviewScheduler({ candidateId, jobId, onScheduled }: InterviewSchedulerProps) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date())
  const [selectedTime, setSelectedTime] = useState<string>('')
  const [duration, setDuration] = useState<number>(60)
  const [interviewType, setInterviewType] = useState<string>('video')
  const [selectedInterviewers, setSelectedInterviewers] = useState<Id<'teamMembers'>[]>([])
  const [location, setLocation] = useState('')
  const [meetingLink, setMeetingLink] = useState('')
  const [notes, setNotes] = useState('')
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [viewMode, setViewMode] = useState<'calendar' | 'slots'>('calendar')

  // Get candidate and job details
  const candidate = useQuery(api.candidates.getById, { id: candidateId })
  const job = useQuery(api.jobs.getById, { id: jobId })
  const hiringTeam = useQuery(api.teams.getHiringTeam, { jobId })
  const interviews = useQuery(api.interviews.getByCandidate, { candidateId })

  // Mutations
  const scheduleInterview = useMutation(api.interviews.schedule)
  const updateInterview = useMutation(api.interviews.update)
  const cancelInterview = useMutation(api.interviews.cancel)
  const sendInvite = useMutation(api.interviews.sendInvite)

  // Generate time slots for selected date
  const generateTimeSlots = (date: Date): TimeSlot[] => {
    const slots: TimeSlot[] = []
    const startHour = 9 // 9 AM
    const endHour = 17 // 5 PM

    for (let hour = startHour; hour < endHour; hour++) {
      const slotStart = new Date(date)
      slotStart.setHours(hour, 0, 0, 0)

      const slotEnd = new Date(slotStart)
      slotEnd.setMinutes(slotStart.getMinutes() + 30)

      // Check if slot conflicts with existing interviews
      const hasConflict = interviews?.some(interview => {
        const interviewStart = parseISO(interview.date + 'T' + interview.time)
        const interviewEnd = addHours(interviewStart, parseInt(interview.duration) / 60)

        return (
          (isAfter(slotStart, interviewStart) && isBefore(slotStart, interviewEnd)) ||
          (isAfter(slotEnd, interviewStart) && isBefore(slotEnd, interviewEnd)) ||
          (isSameDay(slotStart, interviewStart) &&
           slotStart.getHours() === interviewStart.getHours())
        )
      })

      slots.push({
        start: slotStart,
        end: slotEnd,
        available: !hasConflict && isAfter(slotStart, new Date()),
      })

      // Add 30-minute slot
      const slotStart30 = new Date(date)
      slotStart30.setHours(hour, 30, 0, 0)

      const slotEnd30 = new Date(slotStart30)
      slotEnd30.setMinutes(slotStart30.getMinutes() + 30)

      const hasConflict30 = interviews?.some(interview => {
        const interviewStart = parseISO(interview.date + 'T' + interview.time)
        const interviewEnd = addHours(interviewStart, parseInt(interview.duration) / 60)

        return (
          (isAfter(slotStart30, interviewStart) && isBefore(slotStart30, interviewEnd)) ||
          (isAfter(slotEnd30, interviewStart) && isBefore(slotEnd30, interviewEnd))
        )
      })

      slots.push({
        start: slotStart30,
        end: slotEnd30,
        available: !hasConflict30 && isAfter(slotStart30, new Date()),
      })
    }

    return slots
  }

  const timeSlots = selectedDate ? generateTimeSlots(selectedDate) : []

  // Handle interview scheduling
  const handleSchedule = async () => {
    if (!selectedDate || !selectedTime || selectedInterviewers.length === 0) {
      toast({
        title: "Missing information",
        description: "Please select date, time, and interviewers",
        variant: "destructive",
      })
      return
    }

    try {
      const interviewId = await scheduleInterview({
        candidateId,
        jobId,
        type: interviewType,
        date: format(selectedDate, 'yyyy-MM-dd'),
        time: selectedTime,
        duration: duration.toString(),
        interviewers: selectedInterviewers.map(id => {
          const member = hiringTeam?.find(m => m.teamMemberId === id)
          return member?.member?.name || 'Unknown'
        }),
        location: interviewType === 'video' ? meetingLink : location,
        status: 'scheduled',
      })

      toast({
        title: "Interview scheduled",
        description: "Calendar invites will be sent to all participants",
      })

      setShowConfirmDialog(false)
      onScheduled?.()
    } catch (error) {
      toast({
        title: "Failed to schedule interview",
        description: "Please try again",
        variant: "destructive",
      })
    }
  }

  // Interview type config
  const interviewTypes = [
    { value: 'phone', label: 'Phone Screen', icon: Phone, duration: 30 },
    { value: 'video', label: 'Video Interview', icon: Video, duration: 60 },
    { value: 'onsite', label: 'On-site Interview', icon: Building2, duration: 90 },
    { value: 'panel', label: 'Panel Interview', icon: Users, duration: 120 },
  ]

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CalendarDays className="h-5 w-5" />
          Schedule Interview
        </CardTitle>
        <CardDescription>
          Schedule an interview with {candidate?.name} for {job?.title}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Interview Type Selection */}
        <div className="space-y-3">
          <Label>Interview Type</Label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {interviewTypes.map((type) => {
              const Icon = type.icon
              return (
                <Button
                  key={type.value}
                  variant={interviewType === type.value ? 'default' : 'outline'}
                  className="flex flex-col items-center gap-2 h-auto py-4"
                  onClick={() => {
                    setInterviewType(type.value)
                    setDuration(type.duration)
                  }}
                >
                  <Icon className="h-5 w-5" />
                  <span className="text-xs">{type.label}</span>
                  <Badge variant="secondary" className="text-xs">
                    {type.duration} min
                  </Badge>
                </Button>
              )
            })}
          </div>
        </div>

        {/* Date & Time Selection */}
        <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as 'calendar' | 'slots')}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="calendar">Calendar View</TabsTrigger>
            <TabsTrigger value="slots">Time Slots</TabsTrigger>
          </TabsList>

          <TabsContent value="calendar" className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label>Select Date</Label>
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  className="rounded-md border mt-2"
                  disabled={(date) => date < new Date() || date.getDay() === 0 || date.getDay() === 6}
                />
              </div>

              <div>
                <Label>Select Time</Label>
                <div className="grid grid-cols-3 gap-2 mt-2 max-h-[350px] overflow-y-auto">
                  {timeSlots.map((slot) => (
                    <Button
                      key={slot.start.toISOString()}
                      variant={selectedTime === format(slot.start, 'HH:mm') ? 'default' : 'outline'}
                      size="sm"
                      disabled={!slot.available}
                      onClick={() => setSelectedTime(format(slot.start, 'HH:mm'))}
                      className="text-xs"
                    >
                      {format(slot.start, 'h:mm a')}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="slots" className="space-y-4">
            {/* Week view with available slots */}
            <div className="border rounded-lg p-4">
              <div className="grid grid-cols-6 gap-2">
                {Array.from({ length: 5 }, (_, i) => {
                  const date = addDays(startOfWeek(new Date(), { weekStartsOn: 1 }), i)
                  const slots = generateTimeSlots(date)
                  const availableSlots = slots.filter(s => s.available)

                  return (
                    <div key={i} className="text-center">
                      <div className="font-medium text-sm mb-2">
                        {format(date, 'EEE')}
                        <br />
                        {format(date, 'MMM d')}
                      </div>
                      <div className="space-y-1">
                        {availableSlots.slice(0, 4).map((slot) => (
                          <Button
                            key={slot.start.toISOString()}
                            variant="ghost"
                            size="sm"
                            className="w-full text-xs"
                            onClick={() => {
                              setSelectedDate(date)
                              setSelectedTime(format(slot.start, 'HH:mm'))
                            }}
                          >
                            {format(slot.start, 'h:mm a')}
                          </Button>
                        ))}
                        {availableSlots.length > 4 && (
                          <p className="text-xs text-muted-foreground">
                            +{availableSlots.length - 4} more
                          </p>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* Interviewer Selection */}
        <div className="space-y-3">
          <Label>Select Interviewers</Label>
          <div className="space-y-2">
            {hiringTeam?.map((member) => (
              <div
                key={member.teamMemberId}
                className={cn(
                  "flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors",
                  selectedInterviewers.includes(member.teamMemberId)
                    ? "bg-primary/10 border-primary"
                    : "hover:bg-muted/50"
                )}
                onClick={() => {
                  if (selectedInterviewers.includes(member.teamMemberId)) {
                    setSelectedInterviewers(prev =>
                      prev.filter(id => id !== member.teamMemberId)
                    )
                  } else {
                    setSelectedInterviewers(prev => [...prev, member.teamMemberId])
                  }
                }}
              >
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
                {selectedInterviewers.includes(member.teamMemberId) && (
                  <Check className="h-4 w-4 text-primary" />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Location/Meeting Details */}
        <div className="space-y-3">
          <Label>
            {interviewType === 'video' ? 'Meeting Link' : 'Location'}
          </Label>
          {interviewType === 'video' ? (
            <div className="space-y-2">
              <Input
                placeholder="Enter video meeting link"
                value={meetingLink}
                onChange={(e) => setMeetingLink(e.target.value)}
              />
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setMeetingLink('https://zoom.us/j/123456789')}
                >
                  Generate Zoom Link
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setMeetingLink('https://meet.google.com/abc-defg-hij')}
                >
                  Generate Meet Link
                </Button>
              </div>
            </div>
          ) : (
            <Textarea
              placeholder="Enter interview location (e.g., Conference Room A, 123 Main St)"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              rows={2}
            />
          )}
        </div>

        {/* Duration */}
        <div className="space-y-3">
          <Label>Duration (minutes)</Label>
          <Select value={duration.toString()} onValueChange={(v) => setDuration(parseInt(v))}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="30">30 minutes</SelectItem>
              <SelectItem value="45">45 minutes</SelectItem>
              <SelectItem value="60">1 hour</SelectItem>
              <SelectItem value="90">1.5 hours</SelectItem>
              <SelectItem value="120">2 hours</SelectItem>
              <SelectItem value="180">3 hours</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Notes */}
        <div className="space-y-3">
          <Label>Interview Notes (Optional)</Label>
          <Textarea
            placeholder="Add any special instructions or topics to cover..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
          />
        </div>

        {/* Summary */}
        {selectedDate && selectedTime && (
          <Alert>
            <CalendarIcon className="h-4 w-4" />
            <AlertDescription>
              <strong>Interview Summary:</strong><br />
              {format(selectedDate, 'EEEE, MMMM d, yyyy')} at {selectedTime}<br />
              Type: {interviewTypes.find(t => t.value === interviewType)?.label}<br />
              Duration: {duration} minutes<br />
              Interviewers: {selectedInterviewers.length} selected
            </AlertDescription>
          </Alert>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => onScheduled?.()}>
            Cancel
          </Button>
          <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
            <DialogTrigger asChild>
              <Button
                disabled={!selectedDate || !selectedTime || selectedInterviewers.length === 0}
              >
                <Send className="h-4 w-4 mr-2" />
                Schedule & Send Invites
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Confirm Interview Details</DialogTitle>
                <DialogDescription>
                  Please review the interview details before sending invites
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-3 py-4">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{candidate?.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    {selectedDate && format(selectedDate, 'EEEE, MMMM d, yyyy')} at {selectedTime}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{duration} minutes</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{selectedInterviewers.length} interviewers</span>
                </div>
                {interviewType === 'video' && meetingLink && (
                  <div className="flex items-center gap-2">
                    <Link2 className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm truncate">{meetingLink}</span>
                  </div>
                )}
                {interviewType !== 'video' && location && (
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{location}</span>
                  </div>
                )}
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setShowConfirmDialog(false)}>
                  Back
                </Button>
                <Button onClick={handleSchedule}>
                  Confirm & Send Invites
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Existing Interviews */}
        {interviews && interviews.length > 0 && (
          <div className="space-y-3">
            <Label>Scheduled Interviews</Label>
            <div className="space-y-2">
              {interviews.map((interview) => (
                <div
                  key={interview._id}
                  className="flex items-center justify-between p-3 rounded-lg border bg-muted/30"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-background rounded">
                      <CalendarDays className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">
                        {interview.type} Interview
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {format(parseISO(interview.date), 'MMM d, yyyy')} at {interview.time}
                      </p>
                    </div>
                  </div>
                  <Badge
                    variant={
                      interview.status === 'scheduled' ? 'default' :
                      interview.status === 'completed' ? 'success' :
                      interview.status === 'cancelled' ? 'destructive' :
                      'secondary'
                    }
                  >
                    {interview.status}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}