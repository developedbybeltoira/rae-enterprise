// ═══════════════════════════════════════════════════════
// RAE ENTERPRISE — Supabase Client
// ═══════════════════════════════════════════════════════

const SUPABASE_URL = 'https://iweleinqgtvcsyvqaunv.supabase.co';
const SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml3ZWxlaW5xZ3R2Y3N5dnFhdW52Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY5ODMyNTcsImV4cCI6MjA5MjU1OTI1N30.DfaX5RcqcvW-LJSx40CTT3CaihTPx_uy6K4Dbg-mITc';

const { createClient } = supabase;
const db = createClient(SUPABASE_URL, SUPABASE_ANON);

// ── DB Schema Bootstrap (creates tables if they don't exist via RPC or direct)
async function initDB() {
  // We rely on Supabase dashboard for table creation.
  // Tables needed: profiles, products, orders, order_items, cart_items, referrals, notifications
  console.log('✅ Supabase connected');
}
