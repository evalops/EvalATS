'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { useQuery } from 'convex/react'
import { api } from '../../../convex/_generated/api'
import {
  Briefcase,
  Users,
  Calendar,
  LayoutGrid,
  Settings,
  Menu,
  X,
  Bell,
  Search,
  Moon,
  Sun,
  ChevronDown,
  LogOut,
  BarChart3,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useTheme } from 'next-themes'

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutGrid },
  { name: 'Jobs', href: '/jobs', icon: Briefcase },
  { name: 'Candidates', href: '/candidates', icon: Users },
  { name: 'Interviews', href: '/interviews', icon: Calendar },
  { name: 'Analytics', href: '/analytics', icon: BarChart3 },
  { name: 'Settings', href: '/settings', icon: Settings },
]

export function AppShell({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [mounted, setMounted] = useState(false)

  // Get current user data from Convex
  const currentUser = useQuery(api.users.getCurrentUser)
  const pathname = usePathname()
  const { theme, setTheme } = useTheme()

  useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile sidebar backdrop */}
      <div
        className={cn(
          'fixed inset-0 z-40 bg-black/20 lg:hidden transition-opacity',
          sidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        )}
        onClick={() => setSidebarOpen(false)}
      />

      {/* Sidebar - Mobile & Desktop */}
      <aside className={cn(
        'fixed top-0 left-0 z-50 h-full w-64 bg-card border-r border-border transition-transform lg:translate-x-0',
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      )}>
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="flex h-16 items-center justify-between px-6 border-b border-border">
            <h1 className="text-xl font-semibold">ATS</h1>
            <button
              onClick={() => setSidebarOpen(false)}
              className="p-1 rounded-md lg:hidden hover:bg-accent"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1 px-3 py-4">
            {navigation.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    'sidebar-item',
                    isActive && 'sidebar-item-active'
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  {item.name}
                </Link>
              )
            })}
          </nav>

          {/* Bottom section */}
          <div className="p-4 border-t border-border">
            <div className="flex items-center gap-3 px-3 py-2">
              <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-sm font-medium">
                {currentUser?.avatar ? (
                  <img
                    src={currentUser.avatar}
                    alt={currentUser.name || 'User'}
                    className="h-full w-full rounded-full object-cover"
                  />
                ) : (
                  currentUser?.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'U'
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{currentUser?.name || 'Loading...'}</p>
                <p className="text-xs text-muted-foreground truncate">{currentUser?.email || ''}</p>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main content area */}
      <div className="lg:pl-64">
        {/* Top header */}
        <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-sm border-b border-border">
          <div className="flex h-16 items-center gap-4 px-4 sm:px-6 lg:px-8">
            {/* Mobile menu button */}
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 rounded-md hover:bg-accent lg:hidden"
            >
              <Menu className="h-5 w-5" />
            </button>

            {/* Search bar */}
            <div className="flex-1 flex items-center gap-4">
              <div className="relative max-w-md w-full">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="search"
                  placeholder="Search candidates, jobs..."
                  className="input-clean pl-10 pr-4 h-9 text-sm"
                />
              </div>
            </div>

            {/* Right side actions */}
            <div className="flex items-center gap-2">
              {/* Theme toggle */}
              <button
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className="p-2 rounded-md hover:bg-accent"
              >
                {mounted && theme === 'dark' ? (
                  <Sun className="h-4 w-4" />
                ) : (
                  <Moon className="h-4 w-4" />
                )}
              </button>

              {/* Notifications */}
              <button className="p-2 rounded-md hover:bg-accent relative">
                <Bell className="h-4 w-4" />
                <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-red-500" />
              </button>

              {/* User menu */}
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 p-2 rounded-md hover:bg-accent"
                >
                  <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-sm font-medium">
                    {currentUser?.avatar ? (
                      <img
                        src={currentUser.avatar}
                        alt={currentUser.name || 'User'}
                        className="h-full w-full rounded-full object-cover"
                      />
                    ) : (
                      currentUser?.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'U'
                    )}
                  </div>
                  <ChevronDown className="h-4 w-4 hidden sm:block" />
                </button>

                {userMenuOpen && (
                  <div className="absolute right-0 mt-2 w-56 rounded-md bg-popover border border-border shadow-lg animate-in">
                    <div className="py-1">
                      <a href="#" className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-accent">
                        <Settings className="h-4 w-4" />
                        Settings
                      </a>
                      <hr className="my-1 border-border" />
                      <button className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-accent w-full text-left">
                        <LogOut className="h-4 w-4" />
                        Sign out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="min-h-[calc(100vh-4rem)]">
          {children}
        </main>
      </div>
    </div>
  )
}