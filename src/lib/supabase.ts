import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabaseServiceRoleKey = import.meta.env.VITE_ADMIN_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

// Regular client for auth and user operations
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

// Admin client with service role for privileged operations
export const supabaseAdmin = supabaseServiceRoleKey 
  ? createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        persistSession: false,
      },
    })
  : null;

// Database types (you can copy these from your main app's types file)
export interface UserProfile {
  id: string;
  created_at: string;
  updated_at: string;
  main_focus?: string;
  notifications_enabled: boolean;
}

export interface Task {
  id: string;
  user_id: string;
  title: string;
  notes?: string;
  is_completed: boolean;
  due_date?: string;
  due_time?: string;
  created_at: string;
  updated_at: string;
  priority?: number;
  importance?: number;
  urgency?: number;
  tags?: string;
  list?: string;
  parent_id?: string;
  sort_order?: number;
  completed_at?: string;
  is_deleted?: boolean;
}

export interface Project {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  color?: string;
  icon?: string;
  is_favorite: boolean;
  created_at: string;
  updated_at: string;
  is_deleted: boolean;
}

export interface Note {
  id: string;
  user_id: string;
  title: string;
  content?: string;
  folder?: string;
  tags?: string;
  created_at: string;
  updated_at: string;
  is_deleted: boolean;
}

export interface Journal {
  id: string;
  user_id: string;
  date: string;
  content?: string;
  mood?: number;
  tags?: string;
  created_at: string;
  updated_at: string;
  is_deleted: boolean;
} 