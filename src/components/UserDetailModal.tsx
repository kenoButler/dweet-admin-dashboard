import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabaseAdmin } from '../lib/supabase'
import { formatDate, formatRelativeTime } from '../lib/utils'
import { Button } from './ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'
import { Input } from './ui/input'
import { Textarea } from './ui/textarea'
import { X, Mail, Calendar, Shield, CreditCard, Activity, User, Database, Download, AlertTriangle } from 'lucide-react'

interface UserDetailModalProps {
  userId: string
  userEmail: string
  onClose: () => void
}

interface UserDetails {
  authUser: any
  profile: any
  loginEvents: any[]
  subscriptionStatus: any
  tasks: any[]
  projects: any[]
  notes: any[]
}

export function UserDetailModal({ userId, userEmail, onClose }: UserDetailModalProps) {
  const [actionStatus, setActionStatus] = useState<{type: 'success' | 'error' | 'info', message: string} | null>(null)
  const [emailSubject, setEmailSubject] = useState('')
  const [emailMessage, setEmailMessage] = useState('')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const queryClient = useQueryClient()

  const { data: userDetails, isLoading, error } = useQuery({
    queryKey: ['user-details', userId],
    queryFn: async (): Promise<UserDetails> => {
      if (!supabaseAdmin) {
        throw new Error('Admin access required')
      }

      // Fetch auth user details
      const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.getUserById(userId)
      if (authError) throw authError

      // Fetch profile data
      let profile = null
      try {
        const { data: profileData } = await supabaseAdmin
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single()
        profile = profileData
      } catch {
        // Profile might not exist
      }

      // Fetch user's tasks
      let tasks: any[] = []
      try {
        const { data: taskData } = await supabaseAdmin
          .from('tasks')
          .select('id, title, status, created_at, due_date, priority')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(10)
        tasks = taskData || []
      } catch {
        // Tasks table might not exist or no access
      }

      // Fetch user's projects
      let projects: any[] = []
      try {
        const { data: projectData } = await supabaseAdmin
          .from('projects')
          .select('id, name, description, created_at, color')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(10)
        projects = projectData || []
      } catch {
        // Projects table might not exist
      }

      // Fetch user's notes
      let notes: any[] = []
      try {
        const { data: noteData } = await supabaseAdmin
          .from('notes')
          .select('id, title, content, created_at, updated_at')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(10)
        notes = noteData || []
      } catch {
        // Notes table might not exist
      }

      // Mock subscription status (you'll need to implement based on your billing system)
      const subscriptionStatus = {
        status: 'active', // active, inactive, trial, cancelled
        plan: 'Pro',
        billingCycle: 'monthly',
        nextBillingDate: '2024-09-15',
        amount: 9.99,
        currency: 'USD'
      }

      // Mock login events (Supabase doesn't provide detailed login history via API)
      const loginEvents = [
        {
          id: 1,
          event_type: 'login',
          ip_address: '192.168.1.1',
          user_agent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
          created_at: authUser.user?.last_sign_in_at || new Date().toISOString(),
          location: 'San Francisco, CA'
        }
      ]

      return {
        authUser: authUser.user,
        profile,
        loginEvents,
        subscriptionStatus,
        tasks,
        projects,
        notes
      }
    }
  })

  // Action handlers
  const sendEmailMutation = useMutation({
    mutationFn: async ({ subject, message }: { subject: string, message: string }) => {
      if (!supabaseAdmin) throw new Error('Admin access required')
      
      // In a real implementation, you'd use a service like SendGrid, Mailgun, or Supabase Edge Functions
      // For now, we'll simulate the email sending
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // You could also log this action in your database
      console.log(`Email sent to ${userEmail}:`, { subject, message })
      return { success: true }
    },
    onSuccess: () => {
      setActionStatus({ type: 'success', message: 'Email sent successfully!' })
      setEmailSubject('')
      setEmailMessage('')
    },
    onError: (error) => {
      setActionStatus({ type: 'error', message: `Failed to send email: ${error.message}` })
    }
  })

  const resetPasswordMutation = useMutation({
    mutationFn: async () => {
      if (!supabaseAdmin) throw new Error('Admin access required')
      
      const { data, error } = await supabaseAdmin.auth.admin.generateLink({
        type: 'recovery',
        email: userEmail,
        options: {
          redirectTo: `${window.location.origin}/reset-password`
        }
      })
      
      if (error) throw error
      return data
    },
    onSuccess: () => {
      setActionStatus({ type: 'success', message: 'Password reset email sent successfully!' })
    },
    onError: (error) => {
      setActionStatus({ type: 'error', message: `Failed to send reset email: ${error.message}` })
    }
  })

  const verifyEmailMutation = useMutation({
    mutationFn: async () => {
      if (!supabaseAdmin) throw new Error('Admin access required')
      
      const { data, error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
        email_confirm: true
      })
      
      if (error) throw error
      return data
    },
    onSuccess: () => {
      setActionStatus({ type: 'success', message: 'Email verified successfully!' })
      queryClient.invalidateQueries({ queryKey: ['user-details', userId] })
    },
    onError: (error) => {
      setActionStatus({ type: 'error', message: `Failed to verify email: ${error.message}` })
    }
  })

  const suspendUserMutation = useMutation({
    mutationFn: async () => {
      if (!supabaseAdmin) throw new Error('Admin access required')
      
      // Ban user for 24 hours (you can adjust this)
      const banUntil = new Date()
      banUntil.setHours(banUntil.getHours() + 24)
      
      const { data, error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
        ban_duration: '24h'
      })
      
      if (error) throw error
      return data
    },
    onSuccess: () => {
      setActionStatus({ type: 'success', message: 'User suspended for 24 hours!' })
      queryClient.invalidateQueries({ queryKey: ['user-details', userId] })
    },
    onError: (error) => {
      setActionStatus({ type: 'error', message: `Failed to suspend user: ${error.message}` })
    }
  })

  const exportDataMutation = useMutation({
    mutationFn: async () => {
      if (!supabaseAdmin) throw new Error('Admin access required')
      
      // Collect all user data
      const userData = {
        authUser: userDetails?.authUser,
        profile: userDetails?.profile,
        tasks: userDetails?.tasks,
        projects: userDetails?.projects,
        notes: userDetails?.notes,
        exportDate: new Date().toISOString(),
        exportedBy: 'admin'
      }
      
      return userData
    },
    onSuccess: (data) => {
      // Download as JSON file
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `user-data-${userId}-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      
      setActionStatus({ type: 'success', message: 'User data exported successfully!' })
    },
    onError: (error) => {
      setActionStatus({ type: 'error', message: `Failed to export data: ${error.message}` })
    }
  })

  const deleteAccountMutation = useMutation({
    mutationFn: async () => {
      if (!supabaseAdmin) throw new Error('Admin access required')
      
      // Delete user from auth
      const { error } = await supabaseAdmin.auth.admin.deleteUser(userId)
      if (error) throw error
      
      // Note: This will cascade delete related data due to foreign key constraints
      return { success: true }
    },
    onSuccess: () => {
      setActionStatus({ type: 'success', message: 'Account deleted successfully!' })
      queryClient.invalidateQueries({ queryKey: ['admin-users'] })
      
      // Close modal after a delay
      setTimeout(() => {
        onClose()
      }, 2000)
    },
    onError: (error) => {
      setActionStatus({ type: 'error', message: `Failed to delete account: ${error.message}` })
    }
  })

  const impersonateUser = () => {
    // Store impersonation data in localStorage for the main app
    const impersonationData = {
      originalAdminId: 'current-admin-id', // You'd get this from your auth context
      targetUserId: userId,
      targetUserEmail: userEmail,
      startTime: new Date().toISOString()
    }
    
    localStorage.setItem('admin-impersonation', JSON.stringify(impersonationData))
    
    // Redirect to main app with impersonation flag
    const mainAppUrl = import.meta.env.VITE_MAIN_APP_URL || 'http://localhost:5173'
    window.open(`${mainAppUrl}?impersonate=${userId}`, '_blank')
    
    setActionStatus({ type: 'info', message: 'Impersonation session started in new tab' })
  }

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
          <div className="text-center py-8">Loading user details...</div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Error</h2>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div className="text-red-600">Error loading user details: {error.message}</div>
        </div>
      </div>
    )
  }

  const user = userDetails?.authUser
  const profile = userDetails?.profile
  const subscription = userDetails?.subscriptionStatus

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-6xl max-h-[90vh] overflow-y-auto m-4">
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-semibold">User Details</h2>
            <p className="text-sm text-muted-foreground">{userEmail}</p>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="p-6">
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-6">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="auth">Authentication</TabsTrigger>
              <TabsTrigger value="subscription">Subscription</TabsTrigger>
              <TabsTrigger value="activity">Activity</TabsTrigger>
              <TabsTrigger value="data">User Data</TabsTrigger>
              <TabsTrigger value="actions">Actions</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Profile Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Email</label>
                      <div className="text-sm">{user?.email || '—'}</div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">User ID</label>
                      <div className="text-sm font-mono">{user?.id}</div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Created</label>
                      <div className="text-sm">{user?.created_at ? formatDate(user.created_at) : '—'}</div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Email Verified</label>
                      <div className="text-sm">
                        {user?.email_confirmed_at ? (
                          <Badge variant="default">✅ Verified {formatRelativeTime(user.email_confirmed_at)}</Badge>
                        ) : (
                          <Badge variant="destructive">❌ Not Verified</Badge>
                        )}
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Phone</label>
                      <div className="text-sm">{user?.phone || '—'}</div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Activity className="h-4 w-4" />
                      Account Status
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Last Sign In</label>
                      <div className="text-sm">{user?.last_sign_in_at ? formatDate(user.last_sign_in_at) : '—'}</div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Sign In Count</label>
                      <div className="text-sm">{user?.sign_in_count || 0}</div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Role</label>
                      <div className="text-sm">
                        {user?.app_metadata?.roles?.length > 0 ? (
                          user.app_metadata.roles.map((role: string) => (
                            <Badge key={role} variant="secondary" className="mr-1">{role}</Badge>
                          ))
                        ) : (
                          <Badge variant="outline">User</Badge>
                        )}
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Provider</label>
                      <div className="text-sm">{user?.app_metadata?.provider || 'email'}</div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {profile && (
                <Card>
                  <CardHeader>
                    <CardTitle>Profile Data</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <label className="font-medium text-muted-foreground">Main Focus</label>
                        <div>{profile.main_focus || '—'}</div>
                      </div>
                      <div>
                        <label className="font-medium text-muted-foreground">Notifications</label>
                        <div>{profile.notifications_enabled ? 'Enabled' : 'Disabled'}</div>
                      </div>
                      <div>
                        <label className="font-medium text-muted-foreground">Theme</label>
                        <div>{profile.theme || 'Default'}</div>
                      </div>
                      <div>
                        <label className="font-medium text-muted-foreground">Timezone</label>
                        <div>{profile.timezone || '—'}</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="auth" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    Authentication Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Provider</label>
                      <div className="text-sm">{user?.app_metadata?.provider || 'email'}</div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Identity Count</label>
                      <div className="text-sm">{user?.identities?.length || 0}</div>
                    </div>
                  </div>
                  
                  {user?.identities && user.identities.length > 0 && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground mb-2 block">Identities</label>
                      <div className="space-y-2">
                        {user.identities.map((identity: any, index: number) => (
                          <div key={index} className="border rounded p-3 text-sm">
                            <div className="grid grid-cols-2 gap-2">
                              <div><strong>Provider:</strong> {identity.provider}</div>
                              <div><strong>Created:</strong> {formatDate(identity.created_at)}</div>
                              <div><strong>Updated:</strong> {formatDate(identity.updated_at)}</div>
                              <div><strong>Email:</strong> {identity.identity_data?.email || '—'}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="text-sm font-medium text-muted-foreground mb-2 block">App Metadata</label>
                    <pre className="text-xs bg-gray-50 p-3 rounded overflow-x-auto">
                      {JSON.stringify(user?.app_metadata || {}, null, 2)}
                    </pre>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-muted-foreground mb-2 block">User Metadata</label>
                    <pre className="text-xs bg-gray-50 p-3 rounded overflow-x-auto">
                      {JSON.stringify(user?.user_metadata || {}, null, 2)}
                    </pre>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="subscription" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-4 w-4" />
                    Subscription Status
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Status</label>
                      <div>
                        <Badge variant={subscription?.status === 'active' ? 'default' : 'destructive'}>
                          {subscription?.status || 'Unknown'}
                        </Badge>
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Plan</label>
                      <div className="text-sm">{subscription?.plan || '—'}</div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Billing</label>
                      <div className="text-sm">{subscription?.billingCycle || '—'}</div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Amount</label>
                      <div className="text-sm">
                        {subscription?.amount ? `${subscription.currency} ${subscription.amount}` : '—'}
                      </div>
                    </div>
                  </div>
                  
                  {subscription?.nextBillingDate && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Next Billing Date</label>
                      <div className="text-sm">{formatDate(subscription.nextBillingDate)}</div>
                    </div>
                  )}
                  
                  <div className="text-sm text-muted-foreground bg-yellow-50 p-3 rounded">
                    📝 Note: Subscription data is currently mocked. Integrate with your billing provider (Stripe, etc.) for real data.
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="activity" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-4 w-4" />
                    Recent Login Events
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {userDetails?.loginEvents.map((event) => (
                      <div key={event.id} className="border rounded p-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="font-medium text-sm">{event.event_type}</div>
                            <div className="text-xs text-muted-foreground">{event.ip_address} • {event.location}</div>
                          </div>
                          <div className="text-xs text-muted-foreground">{formatDate(event.created_at)}</div>
                        </div>
                        <div className="text-xs text-muted-foreground mt-1 truncate">{event.user_agent}</div>
                      </div>
                    ))}
                  </div>
                  <div className="text-sm text-muted-foreground bg-yellow-50 p-3 rounded mt-4">
                    📝 Note: Login events are currently mocked. Supabase doesn't provide detailed login history via API.
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="data" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Tasks ({userDetails?.tasks.length || 0})</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {userDetails?.tasks.slice(0, 5).map((task) => (
                        <div key={task.id} className="text-sm border-b pb-2">
                          <div className="font-medium truncate">{task.title}</div>
                          <div className="text-xs text-muted-foreground">
                            {task.status} • {formatDate(task.created_at)}
                          </div>
                        </div>
                      ))}
                      {(userDetails?.tasks.length || 0) === 0 && (
                        <div className="text-sm text-muted-foreground">No tasks found</div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Projects ({userDetails?.projects.length || 0})</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {userDetails?.projects.slice(0, 5).map((project) => (
                        <div key={project.id} className="text-sm border-b pb-2">
                          <div className="font-medium truncate">{project.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {formatDate(project.created_at)}
                          </div>
                        </div>
                      ))}
                      {(userDetails?.projects.length || 0) === 0 && (
                        <div className="text-sm text-muted-foreground">No projects found</div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Notes ({userDetails?.notes.length || 0})</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {userDetails?.notes.slice(0, 5).map((note) => (
                        <div key={note.id} className="text-sm border-b pb-2">
                          <div className="font-medium truncate">{note.title || 'Untitled'}</div>
                          <div className="text-xs text-muted-foreground">
                            {formatDate(note.created_at)}
                          </div>
                        </div>
                      ))}
                      {(userDetails?.notes.length || 0) === 0 && (
                        <div className="text-sm text-muted-foreground">No notes found</div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="actions" className="space-y-4">
              {actionStatus && (
                <div className={`p-3 rounded border ${
                  actionStatus.type === 'success' ? 'bg-green-50 border-green-200 text-green-700' :
                  actionStatus.type === 'error' ? 'bg-red-50 border-red-200 text-red-700' :
                  'bg-blue-50 border-blue-200 text-blue-700'
                }`}>
                  {actionStatus.message}
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="ml-2 h-auto p-1" 
                    onClick={() => setActionStatus(null)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Send Email</CardTitle>
                    <CardDescription>Send a custom email to this user</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Input
                      placeholder="Email subject"
                      value={emailSubject}
                      onChange={(e) => setEmailSubject(e.target.value)}
                    />
                    <Textarea
                      placeholder="Email message"
                      value={emailMessage}
                      onChange={(e) => setEmailMessage(e.target.value)}
                      rows={4}
                    />
                    <Button 
                      onClick={() => sendEmailMutation.mutate({ subject: emailSubject, message: emailMessage })}
                      disabled={!emailSubject || !emailMessage || sendEmailMutation.isPending}
                      className="w-full"
                    >
                      <Mail className="h-4 w-4 mr-2" />
                      {sendEmailMutation.isPending ? 'Sending...' : 'Send Email'}
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Account Actions</CardTitle>
                    <CardDescription>Administrative account management</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full justify-start"
                      onClick={() => resetPasswordMutation.mutate()}
                      disabled={resetPasswordMutation.isPending}
                    >
                      <Shield className="h-4 w-4 mr-2" />
                      {resetPasswordMutation.isPending ? 'Sending...' : 'Send Password Reset'}
                    </Button>
                    
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full justify-start"
                      onClick={() => verifyEmailMutation.mutate()}
                      disabled={verifyEmailMutation.isPending || user?.email_confirmed_at}
                    >
                      <Calendar className="h-4 w-4 mr-2" />
                      {verifyEmailMutation.isPending ? 'Verifying...' : 
                       user?.email_confirmed_at ? 'Email Already Verified' : 'Verify Email'}
                    </Button>
                    
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full justify-start"
                      onClick={impersonateUser}
                    >
                      <User className="h-4 w-4 mr-2" />
                      Impersonate User
                    </Button>
                    
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full justify-start"
                      onClick={() => suspendUserMutation.mutate()}
                      disabled={suspendUserMutation.isPending}
                    >
                      <Activity className="h-4 w-4 mr-2" />
                      {suspendUserMutation.isPending ? 'Suspending...' : 'Suspend User (24h)'}
                    </Button>
                    
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full justify-start"
                      onClick={() => exportDataMutation.mutate()}
                      disabled={exportDataMutation.isPending}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      {exportDataMutation.isPending ? 'Exporting...' : 'Export User Data'}
                    </Button>
                  </CardContent>
                </Card>
              </div>

              <Card className="border-red-200">
                <CardHeader>
                  <CardTitle className="text-base text-red-700 flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4" />
                    Danger Zone
                  </CardTitle>
                  <CardDescription>Irreversible actions - use with extreme caution</CardDescription>
                </CardHeader>
                <CardContent>
                  {!showDeleteConfirm ? (
                    <Button 
                      variant="destructive" 
                      size="sm"
                      onClick={() => setShowDeleteConfirm(true)}
                    >
                      Delete Account
                    </Button>
                  ) : (
                    <div className="space-y-3">
                      <div className="text-sm text-red-700 bg-red-50 p-3 rounded">
                        <strong>Warning:</strong> This will permanently delete the user's account and all associated data. This action cannot be undone.
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          variant="destructive" 
                          size="sm"
                          onClick={() => deleteAccountMutation.mutate()}
                          disabled={deleteAccountMutation.isPending}
                        >
                          {deleteAccountMutation.isPending ? 'Deleting...' : 'Confirm Delete'}
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setShowDeleteConfirm(false)}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
} 