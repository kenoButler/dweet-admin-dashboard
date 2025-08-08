import { useState, useEffect } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { supabase } from './lib/supabase'
import { User } from '@supabase/supabase-js'
import AdminDashboard from './pages/AdminDashboard'
import Login from './pages/Login'
import AccessDenied from './pages/AccessDenied'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 30000,
    },
  },
})

function App() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  // Enforce roles from metadata
  const hasAdminRole = (u: User | null): boolean => {
    if (!u) return false
    const rolesFromApp = (u.app_metadata?.roles as string[] | undefined) ?? []
    const rolesFromUser = (u.user_metadata?.roles as string[] | undefined) ?? []
    const roles = new Set([...(rolesFromApp || []), ...(rolesFromUser || [])])
    // store for AccessDenied debug page
    try { localStorage.setItem('sb-roles-debug', JSON.stringify({ app: rolesFromApp, user: rolesFromUser })) } catch {}
    return ['admin', 'support', 'developer'].some((r) => roles.has(r))
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  const authorized = hasAdminRole(user)

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route 
            path="/login" 
            element={!user ? <Login /> : <Navigate to="/" replace />} 
          />
          <Route 
            path="/access-denied" 
            element={<AccessDenied />} 
          />
          <Route 
            path="/*" 
            element={
              user ? (
                authorized ? <AdminDashboard user={user} /> : <Navigate to="/access-denied" replace />
              ) : (
                <Navigate to="/login" replace />
              )
            } 
          />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  )
}

export default App 