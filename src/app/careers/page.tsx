import { Metadata } from 'next'
import Link from 'next/link'
import { MapPin, Clock, Briefcase, Search, Filter, Building2, Users, TrendingUp, Heart } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Careers at EvalATS - Join Our Team',
  description: 'Explore exciting career opportunities at EvalATS. We are always looking for talented individuals to join our growing team.',
  openGraph: {
    title: 'Careers at EvalATS',
    description: 'Join our team and help us build the future of hiring',
    type: 'website',
  },
}

// This would come from Convex in a real implementation
const jobs = [
  {
    id: '1',
    title: 'Senior Software Engineer',
    department: 'Engineering',
    location: 'San Francisco, CA',
    type: 'Full-time',
    experience: '5+ years',
    salary: '$150k - $200k',
    description: 'We are looking for a talented Senior Software Engineer to join our team...',
    posted: '2 days ago',
    urgency: 'high',
  },
  {
    id: '2',
    title: 'Product Designer',
    department: 'Design',
    location: 'Remote',
    type: 'Full-time',
    experience: '3+ years',
    salary: '$120k - $160k',
    description: 'Join our design team to create beautiful and intuitive user experiences...',
    posted: '1 week ago',
    urgency: 'medium',
  },
  {
    id: '3',
    title: 'Marketing Manager',
    department: 'Marketing',
    location: 'New York, NY',
    type: 'Full-time',
    experience: '4+ years',
    salary: '$100k - $140k',
    description: 'Lead our marketing efforts and help us grow our brand presence...',
    posted: '3 days ago',
    urgency: 'medium',
  },
  {
    id: '4',
    title: 'Data Analyst',
    department: 'Analytics',
    location: 'Austin, TX',
    type: 'Full-time',
    experience: '2+ years',
    salary: '$80k - $110k',
    description: 'Help us make data-driven decisions and improve our product...',
    posted: '5 days ago',
    urgency: 'low',
  },
]

const departments = ['All', 'Engineering', 'Design', 'Marketing', 'Analytics', 'Sales', 'HR']
const locations = ['All Locations', 'San Francisco, CA', 'New York, NY', 'Austin, TX', 'Remote']
const types = ['All Types', 'Full-time', 'Part-time', 'Contract', 'Internship']

export default function CareersPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-600 to-purple-700 text-white">
        <div className="absolute inset-0 bg-grid-white/10"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 sm:py-32">
          <div className="text-center">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-6">
              Join Our Team at EvalATS
            </h1>
            <p className="text-xl sm:text-2xl text-blue-100 mb-8 max-w-3xl mx-auto">
              Help us revolutionize the hiring process. We’re looking for passionate individuals
              who want to make a difference.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a href="#openings" className="inline-flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-blue-600 bg-white hover:bg-blue-50 md:py-4 md:text-lg md:px-10 transition-colors">
                View Open Positions
              </a>
              <a href="#culture" className="inline-flex items-center justify-center px-8 py-3 border border-white text-base font-medium rounded-md text-white hover:bg-white/10 md:py-4 md:text-lg md:px-10 transition-colors">
                Learn About Our Culture
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 bg-white dark:bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-4xl font-bold text-blue-600 dark:text-blue-400">50+</div>
              <div className="text-gray-600 dark:text-gray-400 mt-2">Team Members</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-blue-600 dark:text-blue-400">15+</div>
              <div className="text-gray-600 dark:text-gray-400 mt-2">Open Positions</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-blue-600 dark:text-blue-400">4.8</div>
              <div className="text-gray-600 dark:text-gray-400 mt-2">Glassdoor Rating</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-blue-600 dark:text-blue-400">100%</div>
              <div className="text-gray-600 dark:text-gray-400 mt-2">Remote Friendly</div>
            </div>
          </div>
        </div>
      </section>

      {/* Job Listings Section */}
      <section id="openings" className="py-16 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Open Positions
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400">
              Find your next career opportunity with us
            </p>
          </div>

          {/* Filters */}
          <div className="mb-8 bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  type="text"
                  placeholder="Search positions..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                />
              </div>
              <select className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white">
                {departments.map(dept => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
              <select className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white">
                {locations.map(loc => (
                  <option key={loc} value={loc}>{loc}</option>
                ))}
              </select>
              <select className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white">
                {types.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Job Cards */}
          <div className="space-y-4">
            {jobs.map(job => (
              <Link
                key={job.id}
                href={`/careers/${job.id}`}
                className="block bg-white dark:bg-gray-800 rounded-lg shadow-sm hover:shadow-md transition-shadow p-6"
              >
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-xl font-semibold text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                          {job.title}
                        </h3>
                        <div className="flex flex-wrap gap-4 mt-2 text-sm text-gray-600 dark:text-gray-400">
                          <span className="flex items-center gap-1">
                            <Building2 className="h-4 w-4" />
                            {job.department}
                          </span>
                          <span className="flex items-center gap-1">
                            <MapPin className="h-4 w-4" />
                            {job.location}
                          </span>
                          <span className="flex items-center gap-1">
                            <Briefcase className="h-4 w-4" />
                            {job.type}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            {job.posted}
                          </span>
                        </div>
                      </div>
                      {job.urgency === 'high' && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400">
                          Urgent
                        </span>
                      )}
                    </div>
                    <p className="mt-3 text-gray-600 dark:text-gray-400 line-clamp-2">
                      {job.description}
                    </p>
                    <div className="flex items-center gap-4 mt-4">
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {job.salary}
                      </span>
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {job.experience} experience
                      </span>
                    </div>
                  </div>
                  <div className="mt-4 sm:mt-0 sm:ml-6">
                    <span className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors">
                      Apply Now
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Culture Section */}
      <section id="culture" className="py-16 bg-white dark:bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Why Work With Us
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400">
              We offer more than just a job - we offer a career
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 dark:bg-blue-900/20 rounded-full mb-4">
                <Users className="h-8 w-8 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Great Team</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Work with talented and passionate people who love what they do
              </p>
            </div>
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full mb-4">
                <TrendingUp className="h-8 w-8 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Growth</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Continuous learning opportunities and career development
              </p>
            </div>
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-100 dark:bg-purple-900/20 rounded-full mb-4">
                <Heart className="h-8 w-8 text-purple-600 dark:text-purple-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Benefits</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Competitive salary, health insurance, and flexible work arrangements
              </p>
            </div>
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-orange-100 dark:bg-orange-900/20 rounded-full mb-4">
                <Building2 className="h-8 w-8 text-orange-600 dark:text-orange-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Remote First</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Work from anywhere with flexible hours and async communication
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            Don’t see the right position?
          </h2>
          <p className="text-xl mb-8 text-blue-100">
            We’re always looking for talented people. Send us your resume and we’ll keep you in mind for future opportunities.
          </p>
          <a
            href="mailto:careers@evalats.com"
            className="inline-flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-blue-600 bg-white hover:bg-blue-50 md:py-4 md:text-lg md:px-10 transition-colors"
          >
            Send Your Resume
          </a>
        </div>
      </section>
    </div>
  )
}