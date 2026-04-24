// ═══════════════════════════════════════════════════════
// RAE ENTERPRISE — Supabase Client
// ═══════════════════════════════════════════════════════

const SUPABASE_URL = 'https://iweleinqgtvcsyvqaunv.supabase.co';
const SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml3ZWxlaW5xZ3R2Y3N5dnFhdW52Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY5ODMyNTcsImV4cCI6MjA5MjU1OTI1N30.DfaX5RcqcvW-LJSx40CTT3CaihTPx_uy6K4Dbg-mITc';

// Supabase v2 CDN exposes window.supabase — must use explicit window reference
const db = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON);
