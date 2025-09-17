"use client"

import { useState, useEffect, useCallback } from "react"
import { useQuery, useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Id } from "@/convex/_generated/dataModel"
import { Search, Filter, X, Save, History, Download, ChevronDown, User, Briefcase, Calendar, Mail, FileText, Building } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Checkbox } from "@/components/ui/checkbox"
import { ScrollArea } from "@/components/ui/scroll-area"
import { debounce } from "lodash"

type SearchEntity = "candidates" | "jobs" | "interviews" | "all"
type SortBy = "relevance" | "date" | "name" | "salary" | "experience"

interface SearchFilters {
  status?: string[]
  department?: string[]
  location?: string[]
  experienceRange?: [number, number]
  salaryRange?: [number, number]
  skills?: string[]
  education?: string[]
  jobType?: string[]
  dateRange?: { from: string; to: string }
  hasResume?: boolean
  hasInterview?: boolean
  hasOffer?: boolean
}

interface SearchResult {
  id: string
  type: "candidate" | "job" | "interview"
  title: string
  subtitle: string
  description: string
  tags: string[]
  status: string
  date?: string
  score?: number
}

interface SavedSearch {
  _id: Id<"savedSearches">
  name: string
  query: string
  filters: SearchFilters
  entity: SearchEntity
  createdAt: string
}

export function AdvancedSearch() {
  const [searchQuery, setSearchQuery] = useState("")
  const [entity, setEntity] = useState<SearchEntity>("all")
  const [filters, setFilters] = useState<SearchFilters>({})
  const [sortBy, setSortBy] = useState<SortBy>("relevance")
  const [showFilters, setShowFilters] = useState(false)
  const [showSavedSearches, setShowSavedSearches] = useState(false)
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [saveSearchName, setSaveSearchName] = useState("")

  // Mock Convex queries - replace with actual API calls
  const candidates = useQuery(api.teams.getCandidates) || []
  const jobs = useQuery(api.teams.getJobs) || []
  const interviews = useQuery(api.interviews.list, {}) || []
  const savedSearches = useQuery(api.teams.getSavedSearches) || []

  const saveSearch = useMutation(api.teams.saveSearch)
  const deleteSearch = useMutation(api.teams.deleteSavedSearch)
  const addToSearchHistory = useMutation(api.teams.addSearchHistory)

  // Debounced search function
  const performSearch = useCallback(
    debounce(async (query: string, entityType: SearchEntity, searchFilters: SearchFilters) => {
      setIsSearching(true)

      // Add to search history
      if (query) {
        await addToSearchHistory({ query, entity: entityType, filters: searchFilters })
      }

      // Simulate search with local data - replace with actual search API
      const results: SearchResult[] = []

      if (entityType === "all" || entityType === "candidates") {
        candidates
          .filter((c: any) => {
            const matchesQuery = !query ||
              c.name.toLowerCase().includes(query.toLowerCase()) ||
              c.email.toLowerCase().includes(query.toLowerCase()) ||
              c.skills?.some((s: string) => s.toLowerCase().includes(query.toLowerCase()))

            const matchesStatus = !searchFilters.status?.length ||
              searchFilters.status.includes(c.status)

            const matchesLocation = !searchFilters.location?.length ||
              searchFilters.location.includes(c.location)

            return matchesQuery && matchesStatus && matchesLocation
          })
          .forEach((c: any) => {
            results.push({
              id: c._id,
              type: "candidate",
              title: c.name,
              subtitle: `${c.role} • ${c.location}`,
              description: c.summary || "",
              tags: c.skills || [],
              status: c.status,
              date: c.appliedDate,
              score: Math.random() * 100 // Mock relevance score
            })
          })
      }

      if (entityType === "all" || entityType === "jobs") {
        jobs
          .filter(j => {
            const matchesQuery = !query ||
              j.title.toLowerCase().includes(query.toLowerCase()) ||
              j.department.toLowerCase().includes(query.toLowerCase()) ||
              j.description?.toLowerCase().includes(query.toLowerCase())

            const matchesStatus = !searchFilters.status?.length ||
              searchFilters.status.includes(j.status)

            const matchesDepartment = !searchFilters.department?.length ||
              searchFilters.department.includes(j.department)

            const matchesLocation = !searchFilters.location?.length ||
              searchFilters.location.includes(j.location)

            const matchesType = !searchFilters.jobType?.length ||
              searchFilters.jobType.includes(j.type)

            return matchesQuery && matchesStatus && matchesDepartment && matchesLocation && matchesType
          })
          .forEach(j => {
            results.push({
              id: j._id,
              type: "job",
              title: j.title,
              subtitle: `${j.department} • ${j.location}`,
              description: j.description || "",
              tags: j.requirements || [],
              status: j.status,
              date: j.postedDate,
              score: Math.random() * 100
            })
          })
      }

      if (entityType === "all" || entityType === "interviews") {
        interviews
          .filter(i => {
            const matchesQuery = !query ||
              i.candidateName?.toLowerCase().includes(query.toLowerCase()) ||
              i.position?.toLowerCase().includes(query.toLowerCase()) ||
              i.type.toLowerCase().includes(query.toLowerCase())

            const matchesStatus = !searchFilters.status?.length ||
              searchFilters.status.includes(i.status)

            const matchesDateRange = !searchFilters.dateRange ||
              (i.date >= searchFilters.dateRange.from && i.date <= searchFilters.dateRange.to)

            return matchesQuery && matchesStatus && matchesDateRange
          })
          .forEach(i => {
            results.push({
              id: i._id,
              type: "interview",
              title: `${i.type} Interview`,
              subtitle: `${i.candidateName} for ${i.position}`,
              description: `${i.date} at ${i.time} • ${i.location}`,
              tags: i.interviewers || [],
              status: i.status,
              date: i.date,
              score: Math.random() * 100
            })
          })
      }

      // Sort results
      results.sort((a, b) => {
        switch (sortBy) {
          case "relevance":
            return (b.score || 0) - (a.score || 0)
          case "date":
            return (b.date || "").localeCompare(a.date || "")
          case "name":
            return a.title.localeCompare(b.title)
          default:
            return 0
        }
      })

      setSearchResults(results)
      setIsSearching(false)
    }, 300),
    [candidates, jobs, interviews, sortBy, addToSearchHistory]
  )

  useEffect(() => {
    performSearch(searchQuery, entity, filters)
  }, [searchQuery, entity, filters, performSearch])

  const handleSaveSearch = async () => {
    if (!saveSearchName) return

    await saveSearch({
      name: saveSearchName,
      query: searchQuery,
      filters,
      entity
    })

    setSaveSearchName("")
    setShowSavedSearches(true)
  }

  const loadSavedSearch = (search: SavedSearch) => {
    setSearchQuery(search.query)
    setFilters(search.filters)
    setEntity(search.entity)
    setShowSavedSearches(false)
  }

  const exportResults = () => {
    const csv = [
      ["Type", "Title", "Subtitle", "Status", "Tags", "Date"],
      ...searchResults.map(r => [
        r.type,
        r.title,
        r.subtitle,
        r.status,
        r.tags.join(", "),
        r.date || ""
      ])
    ].map(row => row.join(",")).join("\n")

    const blob = new Blob([csv], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `search-results-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
  }

  const getEntityIcon = (type: string) => {
    switch (type) {
      case "candidate":
        return <User className="h-4 w-4" />
      case "job":
        return <Briefcase className="h-4 w-4" />
      case "interview":
        return <Calendar className="h-4 w-4" />
      default:
        return null
    }
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      active: "bg-green-500",
      new: "bg-blue-500",
      reviewing: "bg-yellow-500",
      scheduled: "bg-purple-500",
      completed: "bg-gray-500",
      rejected: "bg-red-500",
      hired: "bg-green-600",
      open: "bg-blue-500",
      closed: "bg-gray-500",
      draft: "bg-gray-400"
    }
    return colors[status] || "bg-gray-400"
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Advanced Search</h1>
          <p className="text-gray-600">Search across candidates, jobs, and interviews</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setShowSavedSearches(!showSavedSearches)}
          >
            <History className="h-4 w-4 mr-2" />
            Saved Searches
          </Button>
          <Button variant="outline" onClick={exportResults}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Search Bar */}
      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search by name, email, skills, position..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={entity} onValueChange={(v) => setEntity(v as SearchEntity)}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="candidates">Candidates</SelectItem>
                  <SelectItem value="jobs">Jobs</SelectItem>
                  <SelectItem value="interviews">Interviews</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
                className={showFilters ? "bg-blue-50" : ""}
              >
                <Filter className="h-4 w-4 mr-2" />
                Filters
                {Object.keys(filters).length > 0 && (
                  <Badge className="ml-2">{Object.keys(filters).length}</Badge>
                )}
              </Button>
            </div>

            {/* Filters Panel */}
            {showFilters && (
              <Card>
                <CardContent className="p-4">
                  <div className="grid grid-cols-4 gap-4">
                    {/* Status Filter */}
                    <div className="space-y-2">
                      <Label>Status</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" className="w-full justify-between">
                            {filters.status?.length ? `${filters.status.length} selected` : "Any"}
                            <ChevronDown className="h-4 w-4" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[200px]">
                          <ScrollArea className="h-[200px]">
                            {["new", "reviewing", "scheduled", "completed", "hired", "rejected"].map(status => (
                              <div key={status} className="flex items-center space-x-2 py-2">
                                <Checkbox
                                  checked={filters.status?.includes(status)}
                                  onCheckedChange={(checked) => {
                                    if (checked) {
                                      setFilters(prev => ({
                                        ...prev,
                                        status: [...(prev.status || []), status]
                                      }))
                                    } else {
                                      setFilters(prev => ({
                                        ...prev,
                                        status: prev.status?.filter(s => s !== status)
                                      }))
                                    }
                                  }}
                                />
                                <Label className="capitalize">{status}</Label>
                              </div>
                            ))}
                          </ScrollArea>
                        </PopoverContent>
                      </Popover>
                    </div>

                    {/* Department Filter */}
                    <div className="space-y-2">
                      <Label>Department</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" className="w-full justify-between">
                            {filters.department?.length ? `${filters.department.length} selected` : "Any"}
                            <ChevronDown className="h-4 w-4" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[200px]">
                          <ScrollArea className="h-[200px]">
                            {["Engineering", "Design", "Product", "Sales", "Marketing", "HR", "Finance"].map(dept => (
                              <div key={dept} className="flex items-center space-x-2 py-2">
                                <Checkbox
                                  checked={filters.department?.includes(dept)}
                                  onCheckedChange={(checked) => {
                                    if (checked) {
                                      setFilters(prev => ({
                                        ...prev,
                                        department: [...(prev.department || []), dept]
                                      }))
                                    } else {
                                      setFilters(prev => ({
                                        ...prev,
                                        department: prev.department?.filter(d => d !== dept)
                                      }))
                                    }
                                  }}
                                />
                                <Label>{dept}</Label>
                              </div>
                            ))}
                          </ScrollArea>
                        </PopoverContent>
                      </Popover>
                    </div>

                    {/* Location Filter */}
                    <div className="space-y-2">
                      <Label>Location</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" className="w-full justify-between">
                            {filters.location?.length ? `${filters.location.length} selected` : "Any"}
                            <ChevronDown className="h-4 w-4" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[200px]">
                          <ScrollArea className="h-[200px]">
                            {["Remote", "New York", "San Francisco", "London", "Berlin", "Tokyo"].map(loc => (
                              <div key={loc} className="flex items-center space-x-2 py-2">
                                <Checkbox
                                  checked={filters.location?.includes(loc)}
                                  onCheckedChange={(checked) => {
                                    if (checked) {
                                      setFilters(prev => ({
                                        ...prev,
                                        location: [...(prev.location || []), loc]
                                      }))
                                    } else {
                                      setFilters(prev => ({
                                        ...prev,
                                        location: prev.location?.filter(l => l !== loc)
                                      }))
                                    }
                                  }}
                                />
                                <Label>{loc}</Label>
                              </div>
                            ))}
                          </ScrollArea>
                        </PopoverContent>
                      </Popover>
                    </div>

                    {/* Job Type Filter */}
                    <div className="space-y-2">
                      <Label>Job Type</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" className="w-full justify-between">
                            {filters.jobType?.length ? `${filters.jobType.length} selected` : "Any"}
                            <ChevronDown className="h-4 w-4" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[200px]">
                          {["Full-time", "Part-time", "Contract", "Internship", "Freelance"].map(type => (
                            <div key={type} className="flex items-center space-x-2 py-2">
                              <Checkbox
                                checked={filters.jobType?.includes(type)}
                                onCheckedChange={(checked) => {
                                  if (checked) {
                                    setFilters(prev => ({
                                      ...prev,
                                      jobType: [...(prev.jobType || []), type]
                                    }))
                                  } else {
                                    setFilters(prev => ({
                                      ...prev,
                                      jobType: prev.jobType?.filter(t => t !== type)
                                    }))
                                  }
                                }}
                              />
                              <Label>{type}</Label>
                            </div>
                          ))}
                        </PopoverContent>
                      </Popover>
                    </div>

                    {/* Experience Range */}
                    <div className="space-y-2">
                      <Label>Experience (years)</Label>
                      <div className="px-2">
                        <Slider
                          min={0}
                          max={20}
                          step={1}
                          value={filters.experienceRange || [0, 20]}
                          onValueChange={(value) => setFilters(prev => ({
                            ...prev,
                            experienceRange: value as [number, number]
                          }))}
                        />
                        <div className="flex justify-between text-sm text-gray-500 mt-1">
                          <span>{filters.experienceRange?.[0] || 0}</span>
                          <span>{filters.experienceRange?.[1] || 20}</span>
                        </div>
                      </div>
                    </div>

                    {/* Salary Range */}
                    <div className="space-y-2">
                      <Label>Salary Range (k)</Label>
                      <div className="px-2">
                        <Slider
                          min={0}
                          max={300}
                          step={10}
                          value={filters.salaryRange || [0, 300]}
                          onValueChange={(value) => setFilters(prev => ({
                            ...prev,
                            salaryRange: value as [number, number]
                          }))}
                        />
                        <div className="flex justify-between text-sm text-gray-500 mt-1">
                          <span>${filters.salaryRange?.[0] || 0}k</span>
                          <span>${filters.salaryRange?.[1] || 300}k</span>
                        </div>
                      </div>
                    </div>

                    {/* Boolean Filters */}
                    <div className="space-y-2">
                      <Label>Requirements</Label>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label className="text-sm font-normal">Has Resume</Label>
                          <Switch
                            checked={filters.hasResume || false}
                            onCheckedChange={(checked) => setFilters(prev => ({
                              ...prev,
                              hasResume: checked
                            }))}
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <Label className="text-sm font-normal">Has Interview</Label>
                          <Switch
                            checked={filters.hasInterview || false}
                            onCheckedChange={(checked) => setFilters(prev => ({
                              ...prev,
                              hasInterview: checked
                            }))}
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <Label className="text-sm font-normal">Has Offer</Label>
                          <Switch
                            checked={filters.hasOffer || false}
                            onCheckedChange={(checked) => setFilters(prev => ({
                              ...prev,
                              hasOffer: checked
                            }))}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Clear Filters */}
                    <div className="flex items-end">
                      <Button
                        variant="ghost"
                        onClick={() => setFilters({})}
                        className="w-full"
                      >
                        Clear All
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Save Search */}
            {searchQuery && (
              <div className="flex items-center gap-2">
                <Input
                  placeholder="Name this search..."
                  value={saveSearchName}
                  onChange={(e) => setSaveSearchName(e.target.value)}
                  className="max-w-xs"
                />
                <Button onClick={handleSaveSearch} disabled={!saveSearchName}>
                  <Save className="h-4 w-4 mr-2" />
                  Save Search
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Saved Searches */}
      {showSavedSearches && (
        <Card>
          <CardHeader>
            <CardTitle>Saved Searches</CardTitle>
            <CardDescription>Load a previously saved search</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {savedSearches.map((search) => (
                <div
                  key={search._id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
                >
                  <div className="flex-1">
                    <p className="font-medium">{search.name}</p>
                    <p className="text-sm text-gray-600">
                      {search.entity} • "{search.query}" • {Object.keys(search.filters).length} filters
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => loadSavedSearch(search)}
                    >
                      Load
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => deleteSearch({ id: search._id })}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
              {savedSearches.length === 0 && (
                <p className="text-center text-gray-500 py-4">No saved searches yet</p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Search Results */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-gray-600">
            {isSearching ? "Searching..." : `${searchResults.length} results found`}
          </p>
          <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortBy)}>
            <SelectTrigger className="w-[150px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="relevance">Relevance</SelectItem>
              <SelectItem value="date">Date</SelectItem>
              <SelectItem value="name">Name</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {searchResults.map((result) => (
          <Card key={result.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex gap-4 flex-1">
                  <div className="flex items-center justify-center h-10 w-10 bg-gray-100 rounded-lg">
                    {getEntityIcon(result.type)}
                  </div>
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">{result.title}</h3>
                      <Badge variant="outline">{result.type}</Badge>
                      <div className={`h-2 w-2 rounded-full ${getStatusColor(result.status)}`} />
                      <span className="text-sm text-gray-600">{result.status}</span>
                    </div>
                    <p className="text-sm text-gray-600">{result.subtitle}</p>
                    {result.description && (
                      <p className="text-sm text-gray-500">{result.description}</p>
                    )}
                    <div className="flex gap-2 flex-wrap">
                      {result.tags.slice(0, 5).map((tag, i) => (
                        <Badge key={i} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                      {result.tags.length > 5 && (
                        <Badge variant="secondary" className="text-xs">
                          +{result.tags.length - 5} more
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  {result.score && (
                    <div className="text-sm text-gray-500">
                      {Math.round(result.score)}% match
                    </div>
                  )}
                  {result.date && (
                    <div className="text-sm text-gray-500">
                      {new Date(result.date).toLocaleDateString()}
                    </div>
                  )}
                  <Button size="sm" variant="outline">
                    View
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {searchResults.length === 0 && !isSearching && (
          <Card>
            <CardContent className="p-12 text-center">
              <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No results found</p>
              <p className="text-sm text-gray-500 mt-2">Try adjusting your search or filters</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}