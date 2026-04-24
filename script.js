// ═══════════════════════════════════════════════════════
// RAE ENTERPRISE — Main App Router & Init
// ═══════════════════════════════════════════════════════

async function initApp() {
  // Show loader
  const loader = document.createElement('div');
  loader.className = 'page-loader';
  loader.innerHTML = `
    <div class="spinner" style="width:56px;height:56px;border-width:4px"></div>
    <div class="logo-text">Rae Enterprise ✨</div>
  `;
  document.body.appendChild(loader);

  // Load user session
  await Store.loadUser();

  // Render persistent UI
  renderNavbar();
  renderChatbot();

  // Route
  routeTo(getRoutePage());

  // Remove loader
  setTimeout(() => loader.remove(), 1600);

  // Handle browser back/forward
  window.addEventListener('popstate', () => routeTo(getRoutePage()));

  // Handle custom navigate events
  window.addEventListener('routeChange', (e) => {
    routeTo(e.detail.page, e.detail.params);
  });
}

function getRoutePage() {
  const hash = window.location.hash.replace('#', '') || 'home';
  return hash;
}

function routeTo(page, params = {}) {
  // Scroll to top
  window.scrollTo({ top: 0, behavior: 'smooth' });

  // Update navbar active states if any
  renderNavbar();

  switch (page) {
    case 'home':
      renderHome();
      break;
    case 'login':
      renderAuth('login');
      break;
    case 'register':
      renderAuth('register');
      break;
    case 'product':
      if (params.id) renderProduct(params.id);
      else navigate('home');
      break;
    case 'cart':
      renderCart();
      break;
    case 'dashboard':
      renderDashboard();
      break;
    case 'orders':
      renderOrders();
      break;
    case 'referrals':
      renderReferrals();
      break;
    case 'wallet':
      renderWallet();
      break;
    case 'admin':
      renderAdmin();
      break;
    case 'notifications':
      renderNotifications();
      break;
    default:
      renderHome();
  }
}

// Override navigate to also update URL hash
const _navigate = navigate;
window.navigate = function(page, params = {}) {
  const hash = page;
  window.history.pushState({ page, params }, '', `#${hash}`);
  routeTo(page, params);
};

// ── Notifications Page ──
async function renderNotifications() {
  if (!Store.user) { navigate('login'); return; }

  const { data: notifs } = await db.from('notifications')
    .select('*').eq('user_id', Store.user.id)
    .order('created_at', { ascending: false }).limit(30);

  document.getElementById('app').innerHTML = `
    <div class="dashboard-page container page-enter">
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:28px">
        <button class="btn btn-ghost btn-sm" onclick="navigate('home')">← Back</button>
        <h1 class="section-title">🔔 Notifications</h1>
      </div>
      <div style="display:flex;flex-direction:column;gap:12px">
        ${!notifs?.length ? `
          <div style="text-align:center;padding:60px;color:var(--text-muted)">
            <div style="font-size:3rem;margin-bottom:12px">🔔</div>
            <p>No notifications yet. Start shopping to get updates! 💜</p>
          </div>
        ` : notifs.map(n => `
          <div style="display:flex;align-items:flex-start;gap:14px;padding:18px;background:var(--glass);border:1px solid var(--glass-border);border-radius:var(--radius);transition:var(--transition)" 
            onmouseenter="this.style.borderColor='var(--neon-purple)'" 
            onmouseleave="this.style.borderColor='var(--glass-border)'">
            <div style="font-size:1.5rem;flex-shrink:0">
              ${n.type === 'reward' ? '🎁' : n.type === 'order_update' ? '📦' : '💜'}
            </div>
            <div style="flex:1">
              <div style="font-size:0.9rem;margin-bottom:4px">${n.message}</div>
              <div style="font-size:0.75rem;color:var(--text-muted)">${timeAgo(n.created_at)}</div>
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

// ── DB Setup Helper (run once from console if needed) ──
async function setupDatabase() {
  console.log(`
  ════════════════════════════════════════════
  RAE ENTERPRISE — Supabase Table Setup Guide
  ════════════════════════════════════════════
  
  Create these tables in your Supabase dashboard:
  
  1. profiles
     - id (uuid, PK, references auth.users)
     - username (text, unique)
     - email (text)
     - phone (text)
     - role (text, default: 'user')
     - wallet_balance (numeric, default: 0)
     - total_spent (numeric, default: 0)
     - referral_count (integer, default: 0)
     - referred_by (text, nullable)
     - created_at (timestamptz)
  
  2. products
     - id (uuid, PK, default: gen_random_uuid())
     - name (text)
     - description (text)
     - price (numeric)
     - discount_price (numeric)
     - stock_count (integer)
     - category (text)
     - tags (text[])
     - images (text[])
     - is_flash (boolean, default: false)
     - in_stock (boolean, default: true)
     - created_at (timestamptz)
     - updated_at (timestamptz)
  
  3. orders
     - id (text, PK)  ← custom RAE-XXX format
     - user_id (uuid, references profiles.id)
     - items (jsonb)
     - total_amount (numeric)
     - full_name (text)
     - address (text)
     - phone (text)
     - sender_name (text)
     - proof_url (text)
     - status (text, default: 'awaiting_approval')
     - payment_method (text)
     - created_at (timestamptz)
  
  4. notifications
     - id (uuid, PK)
     - user_id (uuid, references profiles.id)
     - message (text)
     - type (text)
     - read (boolean, default: false)
     - created_at (timestamptz)
  
  5. Storage Buckets (public):
     - product-images
     - order-proofs
  
  6. RLS Policies:
     - profiles: users can read/update their own row
     - orders: users can insert and read their own orders
     - products: all users can read, only admin can insert/update/delete
     - notifications: users can read their own
  
  To make a user admin, run in SQL Editor:
    UPDATE profiles SET role = 'admin' WHERE email = 'your@email.com';
  `);
}

// ── Start App ──
document.addEventListener('DOMContentLoaded', initApp);
