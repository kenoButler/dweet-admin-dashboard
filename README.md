# Dweet Admin Dashboard

A comprehensive administrative dashboard for managing Dweet app users, data, and support operations. This is a standalone React application that connects to the same Supabase database as the main Dweet app.

## 🚀 Features

### Core Modules
- **📊 Overview**: System statistics and health metrics
- **👥 Users**: User management with detailed profiles and search
- **🎁 Gift Codes**: Create and manage promotional codes
- **🛠️ Support Tools**: User account management and administrative actions
- **🔐 Security**: Role-based access control and audit logs
- **⚙️ Settings**: Dashboard configuration and preferences

### User Management
- **Detailed User Profiles**: Complete account information, authentication history, and subscription status
- **Administrative Actions**: 
  - Send custom emails to users
  - Reset passwords and verify email addresses
  - Suspend/unsuspend user accounts
  - Export user data (GDPR compliance)
  - Delete accounts with confirmation
  - User impersonation for support purposes

### Advanced Features
- **Real-time Data**: Live statistics and user information
- **Search & Pagination**: Efficient user lookup and browsing
- **Role-based Access**: Admin, support, and developer roles
- **Audit Trail**: Track administrative actions
- **Data Export**: JSON export of user data

## 🛠️ Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **UI Components**: Shadcn/ui + Radix UI + Tailwind CSS
- **State Management**: TanStack Query (React Query)
- **Database**: Supabase (PostgreSQL + Auth + Real-time)
- **Authentication**: Supabase Auth with role-based access
- **Build Tool**: Vite with TypeScript support

## 📋 Prerequisites

- Node.js 18+ and npm
- Access to the Dweet Supabase project
- Admin role in the Supabase database

## 🚀 Quick Start

### 1. Clone and Install
```bash
git clone <repository-url>
cd dweet-admin-dashboard
npm install
```

### 2. Environment Setup
```bash
# Copy the example environment file
cp .env.example .env.local

# Edit .env.local with your Supabase credentials
```

Required environment variables:
```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_ADMIN_SERVICE_ROLE_KEY=your_supabase_service_role_key
VITE_MAIN_APP_URL=https://your-main-app-url.com
```

### 3. Get Your Supabase Keys
1. Go to your [Supabase Dashboard](https://supabase.com/dashboard)
2. Navigate to Project Settings → API
3. Copy the following:
   - **Project URL** → `VITE_SUPABASE_URL`
   - **anon public** key → `VITE_SUPABASE_ANON_KEY` 
   - **service_role** key → `VITE_ADMIN_SERVICE_ROLE_KEY` ⚠️

⚠️ **Important**: The service role key provides full database access. Keep it secure!

### 4. Grant Admin Access
To access the dashboard, your user account needs admin privileges:

**Option A: Via Supabase Dashboard**
1. Go to Authentication → Users
2. Find your user account
3. Edit the user
4. Add to `raw_app_meta_data`:
```json
{
  "roles": ["admin"]
}
```

**Option B: Via SQL**
```sql
UPDATE auth.users 
SET raw_app_meta_data = raw_app_meta_data || '{"roles": ["admin"]}'::jsonb
WHERE email = 'your-email@example.com';
```

### 5. Run the Dashboard
```bash
npm run dev
```

Visit `http://localhost:3001` and sign in with your admin account.

## 🔐 Authentication & Roles

The dashboard supports multiple authentication methods:
- **Email/Password**: Traditional login
- **Magic Link**: Passwordless authentication  
- **Google OAuth**: Social authentication

### Role Hierarchy
- **admin**: Full access to all features
- **support**: User management and support tools
- **developer**: Technical features and debugging tools

Roles are stored in `app_metadata.roles` or `user_metadata.roles` arrays.

## 📁 Project Structure

```
src/
├── components/           # Reusable UI components
│   ├── ui/              # Shadcn/ui components
│   ├── layout/          # Layout components
│   └── UserDetailModal.tsx  # User profile modal
├── pages/               # Main application pages
│   ├── AdminDashboard.tsx   # Main dashboard with routing
│   ├── Login.tsx           # Authentication page
│   └── AccessDenied.tsx    # Role restriction page
├── lib/                 # Utilities and configuration
│   ├── supabase.ts      # Supabase client setup
│   └── utils.ts         # Helper functions
└── hooks/               # Custom React hooks (if any)
```

## 🚀 Deployment

### Development
```bash
npm run dev          # Start dev server on port 3001
npm run build        # Build for production
npm run preview      # Preview production build
```

### Production Deployment
1. **Build the application**:
```bash
npm run build
```

2. **Deploy the `dist` folder** to your hosting provider:
   - **Vercel**: Connect your GitHub repo
   - **Netlify**: Drag and drop the `dist` folder
   - **AWS S3**: Upload to S3 bucket with static hosting
   - **DigitalOcean**: Use App Platform

3. **Configure environment variables** on your hosting platform

4. **Set up custom domain** (e.g., `admin.dweetapp.com`)

### Security Considerations for Production

⚠️ **Critical**: Never expose the service role key in client-side code for production!

**Recommended Production Setup**:
1. Create Supabase Edge Functions for privileged operations
2. Use Row Level Security (RLS) policies
3. Implement API routes that use the service role on the server
4. Use environment variables only for server-side operations

Example Edge Function for user management:
```typescript
// supabase/functions/admin-users/index.ts
import { createClient } from '@supabase/supabase-js'

export default async function handler(req: Request) {
  const supabaseAdmin = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )
  
  // Perform admin operations server-side
  const { data: users } = await supabaseAdmin.auth.admin.listUsers()
  return new Response(JSON.stringify(users))
}
```

## 🔧 Configuration

### Supabase Setup
Ensure your Supabase project has:
- **Authentication enabled** with your preferred providers
- **Row Level Security (RLS)** configured appropriately
- **Database tables** for user profiles, tasks, projects, notes
- **Proper foreign key relationships** for data integrity

### Required Database Tables
The dashboard expects these tables to exist:
- `profiles` - User profile information
- `tasks` - User tasks
- `projects` - User projects  
- `notes` - User notes
- `gift_codes` - Promotional codes (optional)

## 🐛 Troubleshooting

### Common Issues

**"Invalid API key" error**
- Verify your service role key is correct
- Check that environment variables are loaded properly

**"Access Denied" after login**
- Ensure your user has admin role in `app_metadata` or `user_metadata`
- Sign out and back in to refresh the JWT token

**Users showing 0 count**
- Add the service role key to enable admin API access
- Check RLS policies aren't blocking data access

**Build errors**
- Run `npm install` to ensure all dependencies are installed
- Check TypeScript errors with `npm run build`

### Getting Help
1. Check the browser console for error messages
2. Verify environment variables are set correctly
3. Test Supabase connection in the browser network tab
4. Review Supabase logs for authentication issues

## 📄 License

This project is part of the Dweet application suite.

## 🤝 Contributing

This is an internal administrative tool. For issues or feature requests, please contact the development team. 