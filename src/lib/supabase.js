import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://yqlozmtpgwegtgssdnuc.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlxbG96bXRwZ3dlZ3Rnc3NkbnVjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA3MjQxNDYsImV4cCI6MjA5NjMwMDE0Nn0.C0LQlKruHFaINhrfEqeEbG5U4E9io3e4YlvL2Tyt7Yg'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
