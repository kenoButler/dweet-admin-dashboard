import { useMemo, useState } from 'react'
import { User } from '@supabase/supabase-js'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase, supabaseAdmin } from '../lib/supabase'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { AdminLayout } from '../components/layout/AdminLayout'
import { Routes, Route, Link } from 'react-router-dom'
import { formatDate } from '../lib/utils'
import { Users, Target, FileText, BookOpen } from 'lucide-react'
import { UserDetailModal } from '../components/UserDetailModal'

interface AdminDashboardProps {
  user: User
}

async function safeCount(client: typeof supabase, table: string): Promise<number> {
  try {
    const { count } = await client
      .from(table)
      .select('id', { count: 'exact', head: true })
    return count || 0
  } catch {
    return 0
  }
}

function Overview() {
  const { data: stats } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: async () => {
      const client = supabaseAdmin || supabase

      // Users count: prefer Auth Admin API when available for accuracy
      let totalUsers = 0
      try {
        if (supabaseAdmin) {
          const { data: authUsers } = await supabaseAdmin.auth.admin.listUsers()
          totalUsers = (authUsers as any)?.total ?? (authUsers?.users?.length ?? 0)
        } else {
          totalUsers = await safeCount(client as any, 'profiles')
        }
      } catch {
        totalUsers = 0
      }

      // Other entity counts (may be limited by RLS when using anon client)
      const tasksCount = await safeCount(client as any, 'tasks')
      const projectsCount = await safeCount(client as any, 'projects')
      const notesCount = await safeCount(client as any, 'notes')

      return {
        totalUsers,
        totalTasks: tasksCount,
        totalProjects: projectsCount,
        totalNotes: notesCount,
        usingServiceRole: Boolean(supabaseAdmin),
      }
    },
  })

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalUsers ?? '—'}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tasks</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalTasks ?? '—'}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Projects</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalProjects ?? '—'}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Notes</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalNotes ?? '—'}</div>
          </CardContent>
        </Card>
      </div>
      {!stats?.usingServiceRole && (
        <div className="text-xs text-muted-foreground">Note: counts may be limited by RLS without an admin service key.</div>
      )}
    </div>
  )
}

function UsersModule() {
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(0)
  const [selectedUser, setSelectedUser] = useState<{id: string, email: string} | null>(null)
  const pageSize = 20

  const { data, isLoading, error } = useQuery({
    queryKey: ['admin-users', query, page],
    queryFn: async () => {
      if (!supabaseAdmin) {
        throw new Error('Admin service role key required to list users')
      }

      // Fetch users directly from auth API
      const { data: authResponse, error } = await supabaseAdmin.auth.admin.listUsers({
        page: page + 1, // Supabase uses 1-based pagination
        perPage: pageSize
      })

      if (error) {
        throw error
      }

      let users = authResponse?.users || []
      const total = (authResponse as any)?.total ?? users.length

      // Filter by query if provided
      if (query.trim()) {
        users = users.filter(user => 
          user.email?.toLowerCase().includes(query.toLowerCase()) ||
          user.id.toLowerCase().includes(query.toLowerCase())
        )
      }

      // Try to enrich with profile data if profiles table exists
      let profileById: Record<string, any> = {}
      try {
        if (users.length > 0) {
          const userIds = users.map(u => u.id)
          const { data: profiles } = await supabaseAdmin
            .from('profiles')
            .select('id, main_focus, notifications_enabled')
            .in('id', userIds)
          
          profileById = Object.fromEntries((profiles || []).map(p => [p.id, p]))
        }
      } catch {
        // Profiles table might not exist, that's okay
      }

              return {
          rows: users.map(user => ({
            id: user.id,
            email: user.email || '—',
            created_at: user.created_at,
            email_confirmed_at: user.email_confirmed_at,
            last_sign_in_at: user.last_sign_in_at,
            main_focus: profileById[user.id]?.main_focus || '—',
            app_metadata: user.app_metadata,
            user_metadata: user.user_metadata
          })),
          total: query.trim() ? users.length : total,
        }
    },
  })

  const totalPages = useMemo(() => Math.max(1, Math.ceil((data?.total || 0) / pageSize)), [data?.total])

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Input placeholder="Search by user id" value={query} onChange={(e) => { setQuery(e.target.value); setPage(0) }} />
        <Button onClick={() => setPage(0)}>Search</Button>
        <Link to="/impersonation" className="ml-auto text-sm underline">Go to Impersonation</Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Users ({data?.total ?? 0})</CardTitle>
          <CardDescription>Newest users first</CardDescription>
        </CardHeader>
        <CardContent>
          {error ? (
            <div className="text-sm text-red-600 bg-red-50 p-3 rounded">
              Error loading users: {error.message}
            </div>
          ) : isLoading ? (
            <div className="text-sm text-muted-foreground">Loading...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-muted-foreground">
                    <th className="py-2 pr-4">Email</th>
                    <th className="py-2 pr-4">User ID</th>
                    <th className="py-2 pr-4">Created</th>
                    <th className="py-2 pr-4">Last Sign In</th>
                    <th className="py-2 pr-4">Email Verified</th>
                  </tr>
                </thead>
                <tbody>
                  {(data?.rows || []).map((u) => (
                    <tr 
                      key={u.id} 
                      className="border-t hover:bg-gray-50 cursor-pointer"
                      onClick={() => setSelectedUser({id: u.id, email: u.email})}
                    >
                      <td className="py-2 pr-4">{u.email}</td>
                      <td className="py-2 pr-4 font-mono text-xs">{u.id}</td>
                      <td className="py-2 pr-4">{formatDate(u.created_at)}</td>
                      <td className="py-2 pr-4">{u.last_sign_in_at ? formatDate(u.last_sign_in_at) : '—'}</td>
                      <td className="py-2 pr-4">{u.email_confirmed_at ? '✅' : '❌'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <div className="flex items-center gap-2 mt-4">
            <Button variant="outline" disabled={page === 0} onClick={() => setPage((p) => Math.max(0, p - 1))}>Prev</Button>
            <div className="text-xs text-muted-foreground">Page {page + 1} / {totalPages}</div>
            <Button variant="outline" disabled={page + 1 >= totalPages} onClick={() => setPage((p) => p + 1)}>Next</Button>
          </div>
        </CardContent>
      </Card>

      {selectedUser && (
        <UserDetailModal
          userId={selectedUser.id}
          userEmail={selectedUser.email}
          onClose={() => setSelectedUser(null)}
        />
      )}
    </div>
  )
}

function ImpersonationModule() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>User Impersonation</CardTitle>
        <CardDescription>Implement via Edge Function; audit actions.</CardDescription>
      </CardHeader>
      <CardContent>
        Coming soon.
      </CardContent>
    </Card>
  )
}

function DataModule() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Data</CardTitle>
        <CardDescription>Manage tasks, projects, notes, journals</CardDescription>
      </CardHeader>
      <CardContent>Coming soon.</CardContent>
    </Card>
  )
}

function SupportModule() {
  const [email, setEmail] = useState('')
  const [userId, setUserId] = useState('')
  const [loadedUser, setLoadedUser] = useState<any | null>(null)
  const [info, setInfo] = useState<string | null>(null)
  const [err, setErr] = useState<string | null>(null)

  const requireAdmin = !supabaseAdmin

  const loadUser = async () => {
    setErr(null); setInfo(null); setLoadedUser(null)
    try {
      if (!supabaseAdmin) throw new Error('Admin service key required')
      if (userId.trim()) {
        const { data, error } = await supabaseAdmin.auth.admin.getUserById(userId.trim())
        if (error) throw error
        setLoadedUser(data.user)
        return
      }
      if (email.trim()) {
        const { data } = await supabaseAdmin.auth.admin.listUsers()
        const match = data.users.find(u => (u.email || '').toLowerCase() === email.trim().toLowerCase())
        if (!match) throw new Error('User not found')
        setLoadedUser(match)
        return
      }
      throw new Error('Enter email or user id')
    } catch (e: any) {
      setErr(e?.message || 'Failed to load user')
    }
  }

  const doPasswordReset = async () => {
    setErr(null); setInfo(null)
    try {
      if (!supabaseAdmin) throw new Error('Admin service key required')
      if (!loadedUser?.email) throw new Error('Loaded user has no email')
      const { error } = await supabaseAdmin.auth.admin.generateLink({
        type: 'recovery',
        email: loadedUser.email,
      })
      if (error) throw error
      setInfo('Password recovery email sent')
    } catch (e: any) { setErr(e?.message || 'Failed to send recovery email') }
  }

  const doVerifyEmail = async () => {
    setErr(null); setInfo(null)
    try {
      if (!supabaseAdmin) throw new Error('Admin service key required')
      const { error } = await supabaseAdmin.auth.admin.updateUserById(loadedUser.id, { email_confirm: true })
      if (error) throw error
      setInfo('User email marked as verified')
    } catch (e: any) { setErr(e?.message || 'Failed to verify email') }
  }



  const doMagicLink = async () => {
    setErr(null); setInfo(null)
    try {
      if (!supabaseAdmin) throw new Error('Admin service key required')
      if (!loadedUser?.email) throw new Error('Loaded user has no email')
      const { error } = await supabaseAdmin.auth.admin.generateLink({
        type: 'magiclink',
        email: loadedUser.email,
      })
      if (error) throw error
      setInfo('Magic link sent')
    } catch (e: any) { setErr(e?.message || 'Failed to send magic link') }
  }



  const doSuspend = async () => {
    setErr(null); setInfo(null)
    try {
      if (!supabaseAdmin) throw new Error('Admin service key required')
      const { error } = await supabaseAdmin.auth.admin.updateUserById(loadedUser.id, { ban_duration: 'forever' as any })
      if (error) throw error
      setInfo('User suspended')
    } catch (e: any) { setErr(e?.message || 'Failed to suspend user') }
  }

  const doUnsuspend = async () => {
    setErr(null); setInfo(null)
    try {
      if (!supabaseAdmin) throw new Error('Admin service key required')
      const { error } = await supabaseAdmin.auth.admin.updateUserById(loadedUser.id, { ban_duration: 'none' as any })
      if (error) throw error
      setInfo('User unsuspended')
    } catch (e: any) { setErr(e?.message || 'Failed to unsuspend user') }
  }

  const doDelete = async () => {
    setErr(null); setInfo(null)
    try {
      if (!supabaseAdmin) throw new Error('Admin service key required')
      const { error } = await supabaseAdmin.auth.admin.deleteUser(loadedUser.id)
      if (error) throw error
      setInfo('User deleted')
      setLoadedUser(null)
    } catch (e: any) { setErr(e?.message || 'Failed to delete user') }
  }

  const [roleInput, setRoleInput] = useState('admin')
  const addRole = async () => {
    setErr(null); setInfo(null)
    try {
      if (!supabaseAdmin) throw new Error('Admin service key required')
      const currentAppRoles: string[] = (loadedUser?.app_metadata?.roles as any) || []
      const currentUserRoles: string[] = (loadedUser?.user_metadata?.roles as any) || []
      const roles = Array.from(new Set([...currentAppRoles, ...currentUserRoles, roleInput]))
      const { error } = await supabaseAdmin.auth.admin.updateUserById(loadedUser.id, { app_metadata: { ...(loadedUser.app_metadata||{}), roles } })
      if (error) throw error
      setInfo(`Role '${roleInput}' added`)
    } catch (e: any) { setErr(e?.message || 'Failed to add role') }
  }

  const removeRole = async () => {
    setErr(null); setInfo(null)
    try {
      if (!supabaseAdmin) throw new Error('Admin service key required')
      const currentAppRoles: string[] = (loadedUser?.app_metadata?.roles as any) || []
      const roles = currentAppRoles.filter((r) => r !== roleInput)
      const { error } = await supabaseAdmin.auth.admin.updateUserById(loadedUser.id, { app_metadata: { ...(loadedUser.app_metadata||{}), roles } })
      if (error) throw error
      setInfo(`Role '${roleInput}' removed`)
    } catch (e: any) { setErr(e?.message || 'Failed to remove role') }
  }

  return (
    <div className="space-y-4">
      {requireAdmin && (
        <div className="text-sm text-yellow-700 bg-yellow-50 border border-yellow-200 rounded p-3">
          Admin service role key not configured. Viewing limited data only. Actions are disabled.
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Lookup User</CardTitle>
          <CardDescription>Search by exact email or user id</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2 items-center">
            <Input placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-64" />
            <div className="text-xs text-muted-foreground">or</div>
            <Input placeholder="User ID" value={userId} onChange={(e) => setUserId(e.target.value)} className="w-64" />
            <Button onClick={loadUser} disabled={requireAdmin}>Load</Button>
          </div>
          {err && <div className="mt-3 text-sm text-red-600">{err}</div>}
          {loadedUser && (
            <div className="mt-4 text-sm">
              <div><span className="font-medium">Email:</span> {loadedUser.email || '—'}</div>
              <div><span className="font-medium">User ID:</span> {loadedUser.id}</div>
              <div><span className="font-medium">Email Confirmed:</span> {String(loadedUser.email_confirmed_at ? true : false)}</div>
              <div><span className="font-medium">Roles:</span> {((loadedUser.app_metadata?.roles as any) || []).join(', ') || '—'}</div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Account Actions</CardTitle>
          <CardDescription>Administrative actions for the loaded user</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={doPasswordReset} disabled={!loadedUser || requireAdmin}>Send Password Reset</Button>
            <Button variant="outline" onClick={doVerifyEmail} disabled={!loadedUser || requireAdmin}>Verify Email</Button>
            <Button variant="outline" onClick={doMagicLink} disabled={!loadedUser || requireAdmin}>Send Magic Link</Button>
            <Button variant="outline" onClick={doSuspend} disabled={!loadedUser || requireAdmin}>Suspend</Button>
            <Button variant="outline" onClick={doUnsuspend} disabled={!loadedUser || requireAdmin}>Unsuspend</Button>
            <Button variant="destructive" onClick={doDelete} disabled={!loadedUser || requireAdmin}>Delete Account</Button>
          </div>
          <div className="flex flex-wrap gap-2 items-center">
            <Input placeholder="Role (admin/support/developer)" value={roleInput} onChange={(e)=>setRoleInput(e.target.value)} className="w-64" />
            <Button variant="outline" onClick={addRole} disabled={!loadedUser || requireAdmin}>Add Role</Button>
            <Button variant="outline" onClick={removeRole} disabled={!loadedUser || requireAdmin}>Remove Role</Button>
          </div>
          {info && <div className="text-sm text-green-700 bg-green-50 border border-green-200 rounded p-2">{info}</div>}
          {err && <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded p-2">{err}</div>}
        </CardContent>
      </Card>
    </div>
  )
}

function SecurityModule() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Security</CardTitle>
        <CardDescription>Sessions, MFA, audit logs</CardDescription>
      </CardHeader>
      <CardContent>Coming soon.</CardContent>
    </Card>
  )
}

function SettingsModule() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Settings</CardTitle>
        <CardDescription>Feature flags, maintenance mode, etc.</CardDescription>
      </CardHeader>
      <CardContent>Coming soon.</CardContent>
    </Card>
  )
}

function GiftCodesModule() {
  const [code, setCode] = useState('')
  const [amountMonths, setAmountMonths] = useState(1)
  const [page, setPage] = useState(0)
  const pageSize = 20
  const qc = useQueryClient()

  const { data, isLoading, error } = useQuery({
    queryKey: ['gift-codes', page],
    queryFn: async () => {
      const client = supabaseAdmin || supabase
      const { data, count, error } = await client
        .from('gift_codes')
        .select('id, code, months, redeemed_by, redeemed_at, created_at', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(page * pageSize, page * pageSize + pageSize - 1)
      if (error) throw error
      return { rows: data || [], total: count || 0 }
    },
  })

  const createMutation = useMutation({
    mutationFn: async () => {
      const client = supabaseAdmin || supabase
      const payload = {
        code: code || crypto.randomUUID().slice(0, 8).toUpperCase(),
        months: amountMonths,
      }
      const { error } = await client.from('gift_codes').insert(payload)
      if (error) throw error
    },
    onSuccess: () => {
      setCode('')
      setAmountMonths(1)
      qc.invalidateQueries({ queryKey: ['gift-codes'] })
    },
  })

  const totalPages = useMemo(() => Math.max(1, Math.ceil((data?.total || 0) / pageSize)), [data?.total])

  const schemaHelp = (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle>Setup Required</CardTitle>
        <CardDescription>Run this SQL to create the gift_codes table</CardDescription>
      </CardHeader>
      <CardContent>
        <pre className="text-xs whitespace-pre-wrap">
{`create table if not exists public.gift_codes (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  months integer not null check (months > 0),
  redeemed_by uuid references auth.users(id),
  redeemed_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.gift_codes enable row level security;

-- simple policy for admins only (adjust as needed)
create policy "read gift codes" on public.gift_codes
for select to authenticated using (true);
create policy "insert gift codes" on public.gift_codes
for insert to authenticated with check (true);
`}
        </pre>
      </CardContent>
    </Card>
  )

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Create Gift Code</CardTitle>
          <CardDescription>Generate codes for complimentary months</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2 items-center">
            <Input placeholder="Custom code (optional)" value={code} onChange={(e) => setCode(e.target.value)} className="w-48" />
            <Input type="number" min={1} max={36} value={amountMonths} onChange={(e) => setAmountMonths(parseInt(e.target.value || '1', 10))} className="w-28" />
            <Button onClick={() => createMutation.mutate()} disabled={createMutation.isPending}>
              {createMutation.isPending ? 'Creating...' : 'Create Code'}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Gift Codes ({data?.total ?? 0})</CardTitle>
          <CardDescription>Newest first</CardDescription>
        </CardHeader>
        <CardContent>
          {error ? (
            <div className="text-sm text-red-600">{String(error.message || error)}</div>
          ) : isLoading ? (
            <div className="text-sm text-muted-foreground">Loading...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-muted-foreground">
                    <th className="py-2 pr-4">Code</th>
                    <th className="py-2 pr-4">Months</th>
                    <th className="py-2 pr-4">Redeemed By</th>
                    <th className="py-2 pr-4">Redeemed At</th>
                    <th className="py-2 pr-4">Created</th>
                  </tr>
                </thead>
                <tbody>
                  {(data?.rows || []).map((g: any) => (
                    <tr key={g.id} className="border-t">
                      <td className="py-2 pr-4 font-mono">{g.code}</td>
                      <td className="py-2 pr-4">{g.months}</td>
                      <td className="py-2 pr-4">{g.redeemed_by || '—'}</td>
                      <td className="py-2 pr-4">{g.redeemed_at ? formatDate(g.redeemed_at) : '—'}</td>
                      <td className="py-2 pr-4">{formatDate(g.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="flex items-center gap-2 mt-4">
                <Button variant="outline" disabled={page === 0} onClick={() => setPage((p) => Math.max(0, p - 1))}>Prev</Button>
                <div className="text-xs text-muted-foreground">Page {page + 1} / {totalPages}</div>
                <Button variant="outline" disabled={page + 1 >= totalPages} onClick={() => setPage((p) => p + 1)}>Next</Button>
              </div>
            </div>
          )}
          {!isLoading && !data && !error && schemaHelp}
        </CardContent>
      </Card>
    </div>
  )
}

export default function AdminDashboard({ user }: AdminDashboardProps) {
  const handleLogout = async () => {
    try {
      await supabase.auth.signOut()
    } finally {
      window.location.href = '/login'
    }
  }
  return (
    <AdminLayout headerRight={
      <div className="flex items-center gap-3">
        <div className="text-sm text-muted-foreground">{user.email}</div>
        <Button variant="outline" size="sm" onClick={handleLogout}>Logout</Button>
      </div>
    }>
      <Routes>
        <Route path="/" element={<Overview />} />
        <Route path="/users" element={<UsersModule />} />
        <Route path="/impersonation" element={<ImpersonationModule />} />
        <Route path="/data" element={<DataModule />} />
        <Route path="/gift-codes" element={<GiftCodesModule />} />
        <Route path="/support" element={<SupportModule />} />
        <Route path="/security" element={<SecurityModule />} />
        <Route path="/settings" element={<SettingsModule />} />
      </Routes>
    </AdminLayout>
  )
} 