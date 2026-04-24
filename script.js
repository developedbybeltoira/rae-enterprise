// ═══════════════════════════════════════════════════════
// RAE ENTERPRISE — Main App Router & Init
// ═══════════════════════════════════════════════════════

// ── Router ──
function navigate(page, params) {
  params = params || {};
  var hash = page;
  window.history.pushState({ page: page, params: params }, '', '#' + hash);
  routeTo(page, params);
}

function getRoutePage() {
  return window.location.hash.replace('#', '') || 'home';
}

function routeTo(page, params) {
  params = params || {};
  window.scrollTo({ top: 0, behavior: 'smooth' });
  renderNavbar();

  switch (page) {
    case 'home':        renderHome(); break;
    case 'login':       renderAuth('login'); break;
    case 'register':    renderAuth('register'); break;
    case 'product':     params.id ? renderProduct(params.id) : navigate('home'); break;
    case 'cart':        renderCart(); break;
    case 'dashboard':   renderDashboard(); break;
    case 'orders':      renderOrders(); break;
    case 'referrals':   renderReferrals(); break;
    case 'wallet':      renderWallet(); break;
    case 'admin':       renderAdmin(); break;
    case 'notifications': renderNotifications(); break;
    default:            renderHome(); break;
  }
}

// ── Notifications Page ──
async function renderNotifications() {
  if (!Store.user) { navigate('login'); return; }

  const { data: notifs } = await db.from('notifications')
    .select('*').eq('user_id', Store.user.id)
    .order('created_at', { ascending: false }).limit(30);

  document.getElementById('app').innerHTML = '\
    <div class="dashboard-page container page-enter">\
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:28px">\
        <button class="btn btn-ghost btn-sm" onclick="navigate(\'home\')">← Back</button>\
        <h1 class="section-title">🔔 Notifications</h1>\
      </div>\
      <div style="display:flex;flex-direction:column;gap:12px">' +
      ((!notifs || !notifs.length) ?
        '<div style="text-align:center;padding:60px;color:var(--text-muted)"><div style="font-size:3rem;margin-bottom:12px">🔔</div><p>No notifications yet. Start shopping to get updates! 💜</p></div>'
        :
        notifs.map(function(n) {
          return '<div style="display:flex;align-items:flex-start;gap:14px;padding:18px;background:var(--glass);border:1px solid var(--glass-border);border-radius:var(--radius)">' +
            '<div style="font-size:1.5rem;flex-shrink:0">' + (n.type === 'reward' ? '🎁' : n.type === 'order_update' ? '📦' : '💜') + '</div>' +
            '<div><div style="font-size:0.9rem;margin-bottom:4px">' + n.message + '</div>' +
            '<div style="font-size:0.75rem;color:var(--text-muted)">' + timeAgo(n.created_at) + '</div></div>' +
            '</div>';
        }).join('')
      ) +
      '</div></div>';
}

// ── App Init ──
async function initApp() {
  // Show loader
  var loader = document.createElement('div');
  loader.className = 'page-loader';
  loader.id = 'page-loader';
  loader.innerHTML = '<div class="spinner" style="width:56px;height:56px;border-width:4px"></div>' +
    '<div class="logo-text">Rae Enterprise ✨</div>';
  document.body.appendChild(loader);

  try {
    // Load user session
    await Store.loadUser();
  } catch(e) {
    console.warn('Session load error:', e);
  }

  // Render persistent UI
  renderNavbar();
  renderChatbot();

  // Register auth state listener NOW (after db is ready)
  db.auth.onAuthStateChange(async function(event, session) {
    if (event === 'SIGNED_IN' && session) {
      await Store.loadUser();
      renderNavbar();
    } else if (event === 'SIGNED_OUT') {
      Store.user = null;
      Store.profile = null;
      Store.cart = [];
      Store.cartCount = 0;
      renderNavbar();
    }
  });

  // Route to correct page
  routeTo(getRoutePage());

  // Handle browser back/forward
  window.addEventListener('popstate', function() {
    routeTo(getRoutePage());
  });

  // Remove loader
  setTimeout(function() {
    var l = document.getElementById('page-loader');
    if (l) { l.classList.add('fade-out'); setTimeout(function(){ if(l) l.remove(); }, 450); }
  }, 1200);
}

// ── Boot ──
document.addEventListener('DOMContentLoaded', initApp);
