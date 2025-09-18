'use client'

import { useMutation } from 'convex/react'
import { Info, Shield } from 'lucide-react'
import { useState } from 'react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { toast } from '@/components/ui/use-toast'
import { api } from '../../convex/_generated/api'
import type { Id } from '../../convex/_generated/dataModel'

interface EEOFormData {
  race?: string
  gender?: string
  veteranStatus?: string
  disabilityStatus?: string
}

interface EEOFormProps {
  candidateId: Id<'candidates'>
  onSubmit?: (data: EEOFormData) => void
  isRequired?: boolean
}

export function EEOForm({ candidateId, onSubmit, isRequired = false }: EEOFormProps) {
  const [formData, setFormData] = useState<EEOFormData>({})
  const [showForm, setShowForm] = useState(false)
  const storeEEOData = useMutation(api.compliance.storeEEOData)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      await storeEEOData({
        candidateId,
        race: formData.race as any,
        gender: formData.gender as any,
        veteranStatus: formData.veteranStatus as any,
        disabilityStatus: formData.disabilityStatus as any,
      })

      toast({
        title: 'Thank you',
        description: 'Your information has been recorded confidentially.',
      })

      if (onSubmit) {
        onSubmit(formData)
      }
    } catch (_error) {
      toast({
        title: 'Error',
        description: 'Failed to save information. Please try again.',
        variant: 'destructive',
      })
    }
  }

  const handleDecline = async () => {
    try {
      await storeEEOData({
        candidateId,
        race: 'decline_to_answer',
        gender: 'decline_to_answer',
        veteranStatus: 'decline_to_answer',
        disabilityStatus: 'decline_to_answer',
      })

      toast({
        title: 'Thank you',
        description: 'Your preference has been recorded.',
      })

      if (onSubmit) {
        onSubmit({
          race: 'decline_to_answer',
          gender: 'decline_to_answer',
          veteranStatus: 'decline_to_answer',
          disabilityStatus: 'decline_to_answer',
        })
      }
    } catch (_error) {
      toast({
        title: 'Error',
        description: 'Failed to save information. Please try again.',
        variant: 'destructive',
      })
    }
  }

  if (!showForm) {
    return (
      <Card className="max-w-3xl mx-auto">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-blue-600" />
            <CardTitle>Voluntary Self-Identification</CardTitle>
          </div>
          <CardDescription>Help us ensure equal employment opportunity for all</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              <strong>Why we ask:</strong> The U.S. Equal Employment Opportunity Commission (EEOC)
              requires employers to track applicant demographics to ensure fair hiring practices.
              This information is kept separate from your application and will not be used in hiring
              decisions.
            </AlertDescription>
          </Alert>

          <div className="prose prose-sm max-w-none">
            <p className="text-sm text-muted-foreground">
              Completion of this form is{' '}
              <strong>{isRequired ? 'required' : 'entirely voluntary'}</strong>. Whatever your
              decision, it will not be considered in the hiring process or thereafter. Any
              information you provide will be recorded and maintained in a confidential file,
              separate from your application.
            </p>
          </div>

          <div className="flex gap-3">
            <Button onClick={() => setShowForm(true)}>Complete Form</Button>
            {!isRequired && (
              <Button variant="outline" onClick={handleDecline}>
                Decline to Self-Identify
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="max-w-3xl mx-auto">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-blue-600" />
          <CardTitle>Voluntary Self-Identification Form</CardTitle>
        </div>
        <CardDescription>This information is used for EEOC reporting only</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Race/Ethnicity */}
          <div className="space-y-3">
            <Label>Race/Ethnicity</Label>
            <RadioGroup
              value={formData.race}
              onValueChange={(value: string) => setFormData({ ...formData, race: value })}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="american_indian_alaska_native" id="race1" />
                <Label htmlFor="race1" className="font-normal">
                  American Indian or Alaska Native
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="asian" id="race2" />
                <Label htmlFor="race2" className="font-normal">
                  Asian
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="black_african_american" id="race3" />
                <Label htmlFor="race3" className="font-normal">
                  Black or African American
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="hispanic_latino" id="race4" />
                <Label htmlFor="race4" className="font-normal">
                  Hispanic or Latino
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="native_hawaiian_pacific_islander" id="race5" />
                <Label htmlFor="race5" className="font-normal">
                  Native Hawaiian or Other Pacific Islander
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="white" id="race6" />
                <Label htmlFor="race6" className="font-normal">
                  White
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="two_or_more_races" id="race7" />
                <Label htmlFor="race7" className="font-normal">
                  Two or More Races
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="decline_to_answer" id="race8" />
                <Label htmlFor="race8" className="font-normal">
                  I decline to self-identify
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Gender */}
          <div className="space-y-3">
            <Label>Gender</Label>
            <RadioGroup
              value={formData.gender}
              onValueChange={(value: string) => setFormData({ ...formData, gender: value })}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="male" id="gender1" />
                <Label htmlFor="gender1" className="font-normal">
                  Male
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="female" id="gender2" />
                <Label htmlFor="gender2" className="font-normal">
                  Female
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="non_binary" id="gender3" />
                <Label htmlFor="gender3" className="font-normal">
                  Non-Binary
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="decline_to_answer" id="gender4" />
                <Label htmlFor="gender4" className="font-normal">
                  I decline to self-identify
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Veteran Status */}
          <div className="space-y-3">
            <Label>Veteran Status</Label>
            <RadioGroup
              value={formData.veteranStatus}
              onValueChange={(value: string) => setFormData({ ...formData, veteranStatus: value })}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="protected_veteran" id="vet1" />
                <Label htmlFor="vet1" className="font-normal">
                  I am a protected veteran
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="not_protected_veteran" id="vet2" />
                <Label htmlFor="vet2" className="font-normal">
                  I am not a protected veteran
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="decline_to_answer" id="vet3" />
                <Label htmlFor="vet3" className="font-normal">
                  I decline to self-identify
                </Label>
              </div>
            </RadioGroup>
            <p className="text-xs text-muted-foreground">
              Protected veterans include disabled veterans, recently separated veterans, active duty
              wartime or campaign badge veterans, and Armed Forces service medal veterans.
            </p>
          </div>

          {/* Disability Status */}
          <div className="space-y-3">
            <Label>Disability Status</Label>
            <RadioGroup
              value={formData.disabilityStatus}
              onValueChange={(value: string) =>
                setFormData({ ...formData, disabilityStatus: value })
              }
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="yes" id="disability1" />
                <Label htmlFor="disability1" className="font-normal">
                  Yes, I have a disability (or previously had a disability)
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="no" id="disability2" />
                <Label htmlFor="disability2" className="font-normal">
                  No, I do not have a disability
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="decline_to_answer" id="disability3" />
                <Label htmlFor="disability3" className="font-normal">
                  I decline to self-identify
                </Label>
              </div>
            </RadioGroup>
            <p className="text-xs text-muted-foreground">
              Disability is defined as a physical or mental impairment or medical condition that
              substantially limits a major life activity, or a history or record of such an
              impairment.
            </p>
          </div>

          <Alert>
            <Shield className="h-4 w-4" />
            <AlertDescription>
              <strong>Privacy Notice:</strong> This information is collected solely for EEOC
              compliance and reporting. It is stored separately from your application and will not
              be shared with hiring managers or used in hiring decisions.
            </AlertDescription>
          </Alert>

          <div className="flex gap-3">
            <Button type="submit">Submit</Button>
            <Button type="button" variant="outline" onClick={handleDecline}>
              Decline All
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
