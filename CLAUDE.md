# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

```bash
# Development server (runs on port 3001)
npm run dev

# Build for production
npm run build

# Lint TypeScript files
npm run lint

# Preview production build
npm run preview
```

## Environment Setup

This application requires several environment variables to function properly:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_ADMIN_SERVICE_ROLE_KEY=your_supabase_service_role_key
VITE_MAIN_APP_URL=https://your-main-app-url.com
```

## Architecture Overview

This is a React-based admin dashboard for managing Dweet app users and data. Key architectural decisions:

### Core Structure
- **Frontend Framework**: React 18 + TypeScript + Vite
- **UI Components**: Shadcn/ui + Radix UI components with Tailwind CSS
- **State Management**: TanStack Query (React Query) for server state
- **Routing**: React Router DOM with protected routes
- **Database**: Supabase (PostgreSQL + Auth + Real-time)

### Authentication & Authorization
- Uses Supabase Auth with role-based access control
- Requires users to have `admin`, `support`, or `developer` roles in `app_metadata.roles` or `user_metadata.roles`
- Two Supabase clients:
  - `supabase`: Regular client for auth and user operations (src/lib/supabase.ts:12)
  - `supabaseAdmin`: Admin client with service role for privileged operations (src/lib/supabase.ts:20)

### Key Components
- **App.tsx**: Root component with auth state management and route protection
- **AdminDashboard.tsx**: Main dashboard with modular sections (Overview, Users, Support, etc.)
- **AdminLayout.tsx**: Sidebar navigation layout with 8 main sections
- **UserDetailModal.tsx**: Modal for detailed user profile management

### Database Schema
The app expects these Supabase tables to exist:
- `profiles` - User profile information
- `tasks` - User tasks
- `projects` - User projects  
- `notes` - User notes
- `gift_codes` - Promotional codes (optional, with SQL schema provided in AdminDashboard.tsx:535-551)

### Modular Dashboard Sections
Each section in AdminDashboard.tsx is implemented as a separate component:
- **Overview**: System statistics and health metrics
- **Users**: User management with search and detailed profiles
- **Support**: User account management and administrative actions
- **Gift Codes**: Create and manage promotional codes
- **Security, Settings, Data, Impersonation**: Placeholder modules for future features

## Development Patterns

### Component Organization
- UI components in `src/components/ui/` (Shadcn/ui components)
- Layout components in `src/components/layout/`
- Page components in `src/pages/`
- Business logic components directly in `src/components/`

### Data Fetching
- All server state managed through TanStack Query
- Error handling with try-catch patterns
- Fallbacks for missing service role key (shows limited functionality)

### Styling
- Tailwind CSS for styling
- CSS-in-JS not used, pure Tailwind approach
- Responsive design with mobile-first approach

### TypeScript Usage
- Strict TypeScript configuration
- Interface definitions for all Supabase table types in src/lib/supabase.ts:28-93
- Proper typing for User objects from Supabase Auth

## Security Considerations

- Service role key should never be exposed in production client-side code
- Row Level Security (RLS) policies should be implemented in Supabase
- Admin access controlled through metadata roles, not client-side logic
- All privileged operations require admin service role key