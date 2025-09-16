'use client'

import { useState } from 'react'
import { AppShell } from '@/components/layout/app-shell'
import { StatsOverview } from '@/components/dashboard/stats-overview'
import { RecentActivity } from '@/components/dashboard/recent-activity'
import { PipelineBoard } from '@/components/pipeline/pipeline-board'
import { Plus } from 'lucide-react'

export default function HomePage() {
  const [activeView, setActiveView] = useState<'overview' | 'pipeline'>('overview')

  return (
    <AppShell>
      <div className="min-h-screen">
        {/* Page header with generous spacing */}
        <div className="section-padding py-8 border-b border-border/50">
          <div className="container-max">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
                <p className="text-sm text-muted-foreground mt-1">
                  Track your hiring pipeline and manage candidates
                </p>
              </div>

              <button className="btn-primary inline-flex items-center gap-2 self-start">
                <Plus className="h-4 w-4" />
                <span>Add Candidate</span>
              </button>
            </div>

            {/* View tabs */}
            <div className="flex gap-1 mt-6">
              <button
                onClick={() => setActiveView('overview')}
                className={cn(
                  'px-4 py-2 text-sm font-medium rounded-md transition-colors',
                  activeView === 'overview'
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                Overview
              </button>
              <button
                onClick={() => setActiveView('pipeline')}
                className={cn(
                  'px-4 py-2 text-sm font-medium rounded-md transition-colors',
                  activeView === 'pipeline'
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                Pipeline
              </button>
            </div>
          </div>
        </div>

        {/* Main content with generous padding */}
        <div className="section-padding py-8">
          <div className="container-max space-y-8">
            {activeView === 'overview' ? (
              <>
                {/* Stats cards */}
                <StatsOverview />

                {/* Activity section */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  <div className="lg:col-span-2">
                    <h2 className="text-lg font-medium mb-4">Recent Activity</h2>
                    <RecentActivity />
                  </div>

                  <div>
                    <h2 className="text-lg font-medium mb-4">Quick Actions</h2>
                    <div className="space-y-3">
                      <button className="w-full text-left px-4 py-3 rounded-lg border border-border hover:bg-accent transition-colors">
                        <div className="text-sm font-medium">Review pending applications</div>
                        <div className="text-xs text-muted-foreground mt-1">12 new today</div>
                      </button>
                      <button className="w-full text-left px-4 py-3 rounded-lg border border-border hover:bg-accent transition-colors">
                        <div className="text-sm font-medium">Schedule interviews</div>
                        <div className="text-xs text-muted-foreground mt-1">5 candidates waiting</div>
                      </button>
                      <button className="w-full text-left px-4 py-3 rounded-lg border border-border hover:bg-accent transition-colors">
                        <div className="text-sm font-medium">Send offer letters</div>
                        <div className="text-xs text-muted-foreground mt-1">2 ready to send</div>
                      </button>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <PipelineBoard />
            )}
          </div>
        </div>
      </div>
    </AppShell>
  )
}

function cn(...classes: (string | undefined | boolean)[]) {
  return classes.filter(Boolean).join(' ')
}