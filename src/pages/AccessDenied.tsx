import { Button } from '../components/ui/button'

export default function AccessDenied() {
  // Pull roles from the JWT available on the client for quick feedback
  let rolesFromApp: string[] = []
  let rolesFromUser: string[] = []
  try {
    const raw = localStorage.getItem('sb-roles-debug')
    if (raw) {
      const parsed = JSON.parse(raw)
      rolesFromApp = parsed.app || []
      rolesFromUser = parsed.user || []
    }
  } catch {}

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="max-w-lg w-full border rounded-lg p-6 bg-white">
        <h1 className="text-xl font-semibold mb-2">Access denied</h1>
        <p className="text-sm text-muted-foreground mb-4">
          Your account is signed in, but it does not have the required role to access the admin dashboard.
        </p>
        <div className="text-sm bg-gray-50 border rounded p-3 mb-4">
          <div className="mb-1 font-medium">Detected roles</div>
          <div>app_metadata.roles: [{rolesFromApp.join(', ')}]</div>
          <div>user_metadata.roles: [{rolesFromUser.join(', ')}]</div>
        </div>
        <ul className="text-sm list-disc list-inside space-y-1 mb-4">
          <li>Required role: admin, support, or developer</li>
          <li>If you just updated roles, sign out and sign back in to refresh your session</li>
          <li>Ensure the role is set in app_metadata or user_metadata</li>
        </ul>
        <div className="flex gap-2">
          <Button asChild>
            <a href="/login">Sign out and try again</a>
          </Button>
        </div>
      </div>
    </div>
  )
} 