# Dweet Admin Dashboard - TODO

## Security Improvements

### High Priority - Production Security
- [ ] **Implement Supabase Edge Functions** to keep service role key server-side
  - The service role key (`VITE_ADMIN_SERVICE_ROLE_KEY`) is currently exposed in the client bundle due to the `VITE_` prefix
  - This is flagged as a security risk in the README (lines 169-176)
  - Create Edge Functions for privileged operations like user management
  - Move admin operations to server-side API endpoints
  
- [ ] **Implement Row Level Security (RLS) policies** in Supabase
  - Add proper RLS policies for all database tables
  - Ensure admin users can only access appropriate data
  - Test with regular anon key instead of service role for client operations

### Authentication & Authorization
- [ ] **Add audit logging** for administrative actions
  - Log all user management operations (password resets, suspensions, deletions)
  - Track who performed what action and when
  - Store logs in dedicated audit table

- [ ] **Implement proper role-based access control**
  - Define clear permission levels for admin, support, and developer roles
  - Restrict certain operations to specific roles
  - Add role validation on both client and server side

## Feature Development

### User Management
- [ ] **Complete user impersonation feature** (src/pages/AdminDashboard.tsx:247-258)
  - Implement via Edge Function for security
  - Add audit trail for impersonation sessions
  - Create secure session handoff mechanism

- [ ] **Enhance user search functionality**
  - Add search by user metadata fields
  - Implement advanced filtering options
  - Add bulk operations for multiple users

### Data Management
- [ ] **Implement Data module** (src/pages/AdminDashboard.tsx:261-270)
  - Manage tasks, projects, notes, journals
  - Add data export/import functionality
  - Implement data cleanup tools

### Subscription Management
- [ ] **Integrate real billing provider** (replace mocked data)
  - Connect to Stripe, Paddle, or other billing service
  - Show real subscription status and history
  - Add subscription management actions

### System Administration
- [ ] **Implement Security module** (src/pages/AdminDashboard.tsx:463-472)
  - Session management
  - Multi-factor authentication settings
  - Security audit logs

- [ ] **Implement Settings module** (src/pages/AdminDashboard.tsx:475-484)
  - Feature flags management
  - System maintenance mode
  - Application configuration

## Database Schema
- [ ] **Create required database tables** for optional features
  - `gift_codes` table (SQL schema provided in AdminDashboard.tsx:535-551)
  - `audit_logs` table for tracking admin actions
  - `feature_flags` table for system settings

## Monitoring & Analytics
- [ ] **Add system health monitoring**
  - Database connection status
  - API response times
  - Error rate tracking

- [ ] **Implement user activity analytics**
  - Real login history (beyond mocked data)
  - Usage statistics
  - User engagement metrics

## UI/UX Improvements
- [ ] **Add loading states and error boundaries**
  - Better loading indicators for all operations
  - Graceful error handling throughout the app
  - Retry mechanisms for failed operations

- [ ] **Improve responsive design**
  - Mobile-optimized admin interface
  - Better tablet layout support
  - Accessibility improvements

## Development & Deployment
- [ ] **Set up proper CI/CD pipeline**
  - Automated testing on pull requests
  - Environment-specific deployments
  - Security scanning

- [ ] **Add comprehensive testing**
  - Unit tests for utility functions
  - Integration tests for admin operations
  - E2E tests for critical workflows

## Documentation
- [ ] **Create admin user guide**
  - How to perform common tasks
  - Security best practices
  - Troubleshooting guide

- [ ] **API documentation** for Edge Functions (once implemented)
  - Endpoint specifications
  - Authentication requirements
  - Error codes and responses