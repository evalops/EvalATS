'use client'

import { useState } from 'react'
import { AppShell } from '@/components/layout/app-shell'
import { User, Bell, Shield, Palette, Globe, Database, Key, Save } from 'lucide-react'
import { useQuery } from 'convex/react'
import { api } from '../../../convex/_generated/api'

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('profile')
  const [emailNotifications, setEmailNotifications] = useState(true)
  const [pushNotifications, setPushNotifications] = useState(false)
  const [theme, setTheme] = useState('system')

  // Get current user data from Convex
  const currentUser = useQuery(api.users.getCurrentUser)

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'appearance', label: 'Appearance', icon: Palette },
    { id: 'integrations', label: 'Integrations', icon: Globe },
    { id: 'data', label: 'Data & Privacy', icon: Database },
  ]

  return (
    <AppShell>
      <div className="min-h-screen">
        <div className="section-padding py-8 border-b border-border/50">
          <div className="container-max">
            <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Manage your account settings and preferences
            </p>
          </div>
        </div>

        <div className="section-padding py-8">
          <div className="container-max">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
              {/* Sidebar */}
              <div className="lg:col-span-1">
                <nav className="space-y-1">
                  {tabs.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                        activeTab === tab.id
                          ? 'bg-accent text-accent-foreground'
                          : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
                      }`}
                    >
                      <tab.icon className="h-4 w-4" />
                      {tab.label}
                    </button>
                  ))}
                </nav>
              </div>

              {/* Content */}
              <div className="lg:col-span-3">
                {activeTab === 'profile' && (
                  <div className="card-clean">
                    <h2 className="text-lg font-medium mb-6">Profile Information</h2>
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Full Name</label>
                        <input
                          type="text"
                          defaultValue={currentUser?.name || ''}
                          className="input-clean mt-1"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Email</label>
                        <input
                          type="email"
                          defaultValue={currentUser?.email || ''}
                          className="input-clean mt-1"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Role</label>
                        <input
                          type="text"
                          defaultValue="Hiring Manager"
                          className="input-clean mt-1"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Department</label>
                        <input
                          type="text"
                          defaultValue="Engineering"
                          className="input-clean mt-1"
                        />
                      </div>
                      <button className="btn-primary inline-flex items-center gap-2">
                        <Save className="h-4 w-4" />
                        Save Changes
                      </button>
                    </div>
                  </div>
                )}

                {activeTab === 'notifications' && (
                  <div className="card-clean">
                    <h2 className="text-lg font-medium mb-6">Notification Preferences</h2>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between py-3 border-b border-border">
                        <div>
                          <p className="font-medium">Email Notifications</p>
                          <p className="text-sm text-muted-foreground">Receive notifications via email</p>
                        </div>
                        <button
                          onClick={() => setEmailNotifications(!emailNotifications)}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                            emailNotifications ? 'bg-primary' : 'bg-muted'
                          }`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                              emailNotifications ? 'translate-x-6' : 'translate-x-1'
                            }`}
                          />
                        </button>
                      </div>
                      <div className="flex items-center justify-between py-3 border-b border-border">
                        <div>
                          <p className="font-medium">Push Notifications</p>
                          <p className="text-sm text-muted-foreground">Receive browser push notifications</p>
                        </div>
                        <button
                          onClick={() => setPushNotifications(!pushNotifications)}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                            pushNotifications ? 'bg-primary' : 'bg-muted'
                          }`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                              pushNotifications ? 'translate-x-6' : 'translate-x-1'
                            }`}
                          />
                        </button>
                      </div>
                      <div className="space-y-2 pt-4">
                        <p className="font-medium">Notify me about:</p>
                        <label className="flex items-center gap-2">
                          <input type="checkbox" defaultChecked className="rounded" />
                          <span className="text-sm">New applications</span>
                        </label>
                        <label className="flex items-center gap-2">
                          <input type="checkbox" defaultChecked className="rounded" />
                          <span className="text-sm">Interview reminders</span>
                        </label>
                        <label className="flex items-center gap-2">
                          <input type="checkbox" defaultChecked className="rounded" />
                          <span className="text-sm">Candidate updates</span>
                        </label>
                        <label className="flex items-center gap-2">
                          <input type="checkbox" className="rounded" />
                          <span className="text-sm">Weekly reports</span>
                        </label>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'security' && (
                  <div className="card-clean">
                    <h2 className="text-lg font-medium mb-6">Security Settings</h2>
                    <div className="space-y-6">
                      <div>
                        <h3 className="font-medium mb-4">Change Password</h3>
                        <div className="space-y-4 max-w-md">
                          <div>
                            <label className="text-sm font-medium text-muted-foreground">Current Password</label>
                            <input
                              type="password"
                              className="input-clean mt-1"
                            />
                          </div>
                          <div>
                            <label className="text-sm font-medium text-muted-foreground">New Password</label>
                            <input
                              type="password"
                              className="input-clean mt-1"
                            />
                          </div>
                          <div>
                            <label className="text-sm font-medium text-muted-foreground">Confirm New Password</label>
                            <input
                              type="password"
                              className="input-clean mt-1"
                            />
                          </div>
                          <button className="btn-primary">Update Password</button>
                        </div>
                      </div>
                      <div className="pt-6 border-t border-border">
                        <h3 className="font-medium mb-4">Two-Factor Authentication</h3>
                        <p className="text-sm text-muted-foreground mb-4">
                          Add an extra layer of security to your account
                        </p>
                        <button className="btn-secondary">Enable 2FA</button>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'appearance' && (
                  <div className="card-clean">
                    <h2 className="text-lg font-medium mb-6">Appearance</h2>
                    <div className="space-y-4">
                      <div>
                        <p className="font-medium mb-3">Theme</p>
                        <div className="grid grid-cols-3 gap-3 max-w-md">
                          {['light', 'dark', 'system'].map((t) => (
                            <button
                              key={t}
                              onClick={() => setTheme(t)}
                              className={`px-4 py-2 rounded-md capitalize transition-colors ${
                                theme === t
                                  ? 'bg-primary text-primary-foreground'
                                  : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                              }`}
                            >
                              {t}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'integrations' && (
                  <div className="card-clean">
                    <h2 className="text-lg font-medium mb-6">Integrations</h2>
                    <div className="space-y-4">
                      <div className="p-4 border border-border rounded-lg">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="font-medium">Google Calendar</h3>
                            <p className="text-sm text-muted-foreground mt-1">
                              Sync interview schedules with Google Calendar
                            </p>
                          </div>
                          <button className="btn-secondary text-sm">Connect</button>
                        </div>
                      </div>
                      <div className="p-4 border border-border rounded-lg">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="font-medium">Slack</h3>
                            <p className="text-sm text-muted-foreground mt-1">
                              Get notifications in Slack channels
                            </p>
                          </div>
                          <button className="btn-secondary text-sm">Connect</button>
                        </div>
                      </div>
                      <div className="p-4 border border-border rounded-lg">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="font-medium">LinkedIn</h3>
                            <p className="text-sm text-muted-foreground mt-1">
                              Import candidate profiles from LinkedIn
                            </p>
                          </div>
                          <button className="btn-secondary text-sm">Connect</button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'data' && (
                  <div className="card-clean">
                    <h2 className="text-lg font-medium mb-6">Data & Privacy</h2>
                    <div className="space-y-6">
                      <div>
                        <h3 className="font-medium mb-2">Data Export</h3>
                        <p className="text-sm text-muted-foreground mb-4">
                          Download a copy of your data
                        </p>
                        <button className="btn-secondary">Export Data</button>
                      </div>
                      <div className="pt-6 border-t border-border">
                        <h3 className="font-medium mb-2">Data Retention</h3>
                        <p className="text-sm text-muted-foreground mb-4">
                          Configure how long candidate data is retained
                        </p>
                        <select className="input-clean max-w-xs">
                          <option>6 months</option>
                          <option>1 year</option>
                          <option>2 years</option>
                          <option>Indefinitely</option>
                        </select>
                      </div>
                      <div className="pt-6 border-t border-border">
                        <h3 className="font-medium mb-2 text-red-600 dark:text-red-400">Danger Zone</h3>
                        <p className="text-sm text-muted-foreground mb-4">
                          Permanently delete your account and all associated data
                        </p>
                        <button className="px-4 py-2 rounded-md bg-red-600 text-white hover:bg-red-700">
                          Delete Account
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  )
}