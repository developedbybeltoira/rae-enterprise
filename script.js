// ═══════════════════════════════════════════════════════
// RAE ENTERPRISE — Router & App Init (bulletproof)
// ═══════════════════════════════════════════════════════

function navigate(page, params) {
  params = params || {};
  window.history.pushState({ page: page, params: params }, '', '#' + page);
  routeTo(page, params);
}

function getRoutePage() {
  return (window.location.hash || '').replace('#', '') || 'home';
}

function routeTo(page, params) {
  params = params || {};
  window.scrollTo(0, 0);
  renderNavbar();
  try {
    switch (page) {
      case 'home':          renderHome(); break;
      case 'login':         renderAuth('login'); break;
      case 'register':      renderAuth('register'); break;
      case 'product':       params.id ? renderProduct(params.id) : renderHome(); break;
      case 'cart':          renderCart(); break;
      case 'dashboard':     renderDashboard(); break;
      case 'orders':        renderOrders(); break;
      case 'referrals':     renderReferrals(); break;
      case 'wallet':        renderWallet(); break;
      case 'admin':         renderAdmin(); break;
      case 'notifications': renderNotifications(); break;
      default:              renderHome(); break;
    }
  } catch(e) {
    console.error('Route error:', e);
    renderHome();
  }
}

async function renderNotifications() {
  if (!Store.user) { navigate('login'); return; }
  var notifs = [];
  try {
    var res = await db.from('notifications').select('*')
      .eq('user_id', Store.user.id)
      .order('created_at', { ascending: false }).limit(30);
    notifs = res.data || [];
  } catch(e) {}

  var rows = notifs.length ? notifs.map(function(n) {
    return '<div style="display:flex;align-items:flex-start;gap:14px;padding:18px;background:var(--glass);border:1px solid var(--glass-border);border-radius:var(--radius);margin-bottom:10px">' +
      '<div style="font-size:1.5rem">' + (n.type==='reward'?'🎁':n.type==='order_update'?'📦':'💜') + '</div>' +
      '<div><div style="font-size:0.9rem;margin-bottom:4px">' + (n.message||'') + '</div>' +
      '<div style="font-size:0.75rem;color:var(--text-muted)">' + timeAgo(n.created_at) + '</div></div></div>';
  }).join('') : '<div style="text-align:center;padding:60px;color:var(--text-muted)"><div style="font-size:3rem">🔔</div><p>No notifications yet</p></div>';

  document.getElementById('app').innerHTML =
    '<div class="dashboard-page container page-enter">' +
    '<div style="display:flex;align-items:center;gap:12px;margin-bottom:28px">' +
    '<button class="btn btn-ghost btn-sm" onclick="navigate(\'home\')">← Back</button>' +
    '<h1 class="section-title">🔔 Notifications</h1></div>' + rows + '</div>';
}

// ── INIT ──
function removeLdr() {
  var l = document.getElementById('rae-loader');
  if (l) {
    l.style.opacity = '0';
    l.style.transition = 'opacity 0.4s';
    setTimeout(function() { if (l && l.parentNode) l.parentNode.removeChild(l); }, 450);
  }
}

async function initApp() {
  // Safety: always remove loader after max 4 seconds no matter what
  var safetyTimer = setTimeout(removeLdr, 4000);

  try { await Store.loadUser(); } catch(e) { console.warn('Session err:', e); }

  // Restore admin session from sessionStorage
  try {
    if (sessionStorage.getItem('rae_admin') === '1') { adminAuthed = true; }
  } catch(e) {}

  try { renderNavbar(); } catch(e) { console.warn('Navbar err:', e); }
  try { renderChatbot(); } catch(e) { console.warn('Chatbot err:', e); }

  
  try { routeTo(getRoutePage()); } catch(e) { console.warn('Route err:', e); renderHome(); }

  window.addEventListener('popstate', function() {
    try { routeTo(getRoutePage()); } catch(e) { renderHome(); }
  });

  clearTimeout(safetyTimer);
  removeLdr();
}

document.addEventListener('DOMContentLoaded', function() {
  // Extra safety: if Supabase CDN not loaded after 5s, show error
  var tries = 0;
  var check = setInterval(function() {
    tries++;
    if (window.supabase) {
      clearInterval(check);
      initApp();
    } else if (tries > 50) {
      clearInterval(check);
      removeLdr();
      document.getElementById('app').innerHTML =
        '<div style="text-align:center;padding:80px 20px;padding-top:140px">' +
        '<div style="font-size:3rem;margin-bottom:16px">💜</div>' +
        '<h2 style="margin-bottom:12px;color:#F0E6FF">Rae Enterprise</h2>' +
        '<p style="color:rgba(240,230,255,0.6)">Please check your internet connection and refresh.</p>' +
        '<button onclick="location.reload()" style="margin-top:20px;padding:12px 28px;background:linear-gradient(135deg,#7B2EFF,#5B0FCC);color:#fff;border:none;border-radius:50px;font-size:1rem;cursor:pointer">Refresh ✨</button>' +
        '</div>';
    }
  }, 100);
});
