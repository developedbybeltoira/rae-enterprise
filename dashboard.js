// RAE ENTERPRISE — Dashboard, Orders (animated tracking), Referrals, Wallet, Settings

var ORDER_STEPS = [
  { key: 'awaiting_approval', label: 'Payment Confirmed', icon: '\ud83d\udcb3', msg: 'We got your payment! \ud83c\udf89' },
  { key: 'approved',          label: 'Preparing Order',  icon: '\ud83d\udd27', msg: 'Your item is being prepared \ud83d\udd27' },
  { key: 'processing',        label: 'Packaged',         icon: '\ud83d\udce6', msg: 'Packaged and ready to ship \ud83d\udce6' },
  { key: 'shipped',           label: 'On the Way',       icon: '\ud83d\ude9a', msg: 'On the way to you \ud83d\ude9a' },
  { key: 'delivered',         label: 'Delivered',        icon: '\ud83c\udf89', msg: 'Delivered! Enjoy \ud83c\udf89' },
];

function getStepIndex(status) {
  for (var i = 0; i < ORDER_STEPS.length; i++) { if (ORDER_STEPS[i].key === status) return i; }
  return 0;
}

function getDeliveryEstimate(order) {
  var stepIdx = getStepIndex(order.status);
  if (order.status === 'delivered') return 'Delivered! \ud83c\udf89';
  if (order.status === 'shipped')   return 'Almost there \ud83d\udc40 Expected in 1\u20133 days';
  var created = new Date(order.created_at);
  var eta = new Date(created.getTime() + 19 * 86400000);
  var etaEnd = new Date(created.getTime() + 21 * 86400000);
  var opts = { month: 'short', day: 'numeric' };
  return 'Expected ' + eta.toLocaleDateString('en-NG', opts) + ' \u2013 ' + etaEnd.toLocaleDateString('en-NG', opts) + ' (19\u201321 days)';
}

async function renderDashboard() {
  if (!Store.user) { navigate('login'); return; }
  var p = Store.profile;
  var level = getLevel(p.total_spent || 0);
  var initials = (p.username || '??').slice(0, 2).toUpperCase();

  document.getElementById('app').innerHTML =
    '<div class="dashboard-page container page-enter">' +
    '<div class="dashboard-header">' +
    '<div class="dashboard-avatar">' + initials + '</div>' +
    '<div>' +
    '<div class="dashboard-name">' + (p.username || 'Shopper') + ' <span class="' + level.class + '">' + level.icon + '</span></div>' +
    '<div class="dashboard-level">' +
    '<span class="badge badge-purple">' + level.icon + ' ' + level.name + ' Member</span>' +
    '<span style="font-size:0.8rem;color:var(--text-muted)">' + (p.email || '') + '</span>' +
    '</div>' +
    '<div style="margin-top:6px;font-size:0.8rem;color:var(--text-muted)">\ud83d\udcf1 ' + (p.phone || 'N/A') + '</div>' +
    '</div>' +
    '</div>' +

    '<div class="stats-grid">' +
    statCard('\ud83d\udcb0', formatNaira(p.wallet_balance || 0), 'Wallet Balance', 'text-neon-cyan') +
    statCard('\ud83d\uded2', formatNaira(p.total_spent || 0), 'Total Spent', 'text-neon-purple') +
    statCard('\ud83d\udc65', p.referral_count || 0, 'Referrals', 'text-neon-pink') +
    statCard(level.icon, level.name, 'Current Level', level.class) +
    '</div>' +

    '<div style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:24px">' +
    '<button class="btn btn-ghost" onclick="renderOrders()">\ud83d\udce6 My Orders</button>' +
    '<button class="btn btn-ghost" onclick="renderReferrals()">\ud83c\udf81 Referrals</button>' +
    '<button class="btn btn-ghost" onclick="renderWallet()">\ud83d\udcb0 Wallet</button>' +
    '<button class="btn btn-ghost" onclick="renderSettings()">\ud83d\udd10 Security</button>' +
    '</div>' +

    '<div class="glass-card" style="padding:24px">' +
    '<h3 style="margin-bottom:14px">Level Progress \ud83d\ude80</h3>' +
    renderLevelProgress(p.total_spent || 0) +
    '</div></div>';
}

function statCard(icon, val, label, cls) {
  return '<div class="stat-card"><div class="stat-card-icon">' + icon + '</div>' +
    '<div class="stat-card-value ' + cls + '">' + val + '</div>' +
    '<div class="stat-card-label">' + label + '</div></div>';
}

function renderLevelProgress(spent) {
  var tiers = [
    { name: 'Bronze', icon: '\ud83e\udd49', min: 0, max: 30000, cls: 'level-bronze' },
    { name: 'Silver', icon: '\ud83e\udd48', min: 30000, max: 100000, cls: 'level-silver' },
    { name: 'Gold',   icon: '\ud83e\udd47', min: 100000, max: Infinity, cls: 'level-gold' },
  ];
  var curIdx = 0;
  for (var i = 0; i < tiers.length; i++) { if (spent >= tiers[i].min) curIdx = i; }
  var cur = tiers[curIdx], next = tiers[curIdx + 1];
  var pct = next ? Math.min(100, Math.round(((spent - cur.min) / (next.min - cur.min)) * 100)) : 100;

  var tiersHTML = tiers.map(function(t) {
    return '<div style="flex:1;text-align:center;opacity:' + (spent >= t.min ? 1 : 0.35) + '">' +
      '<div style="font-size:1.8rem">' + t.icon + '</div>' +
      '<div class="' + t.cls + '" style="font-size:0.8rem;font-weight:700">' + t.name + '</div>' +
      '<div style="font-size:0.7rem;color:var(--text-muted)">' + formatNaira(t.min) + '+</div>' +
      '</div>';
  }).join('<div style="color:var(--text-muted);align-self:center">\u2192</div>');

  return '<div style="display:flex;align-items:center;gap:8px;margin-bottom:14px">' + tiersHTML + '</div>' +
    '<div class="progress-bar"><div class="progress-fill" style="width:' + pct + '%"></div></div>' +
    '<div style="display:flex;justify-content:space-between;margin-top:8px;font-size:0.78rem;color:var(--text-muted)">' +
    '<span>' + formatNaira(spent) + ' spent</span>' +
    (next ? '<span>' + formatNaira(next.min - spent) + ' more to ' + next.name + ' ' + next.icon + '</span>' : '<span class="text-gold">Max level! \ud83c\udfc6</span>') +
    '</div>';
}

// ── ORDERS with animated tracker ──
async function renderOrders() {
  if (!Store.user) { navigate('login'); return; }
  var res = await db.from('orders').select('*').eq('user_id', Store.user.id).order('created_at', { ascending: false });
  var orders = res.data || [];

  document.getElementById('app').innerHTML =
    '<div class="dashboard-page container page-enter">' +
    '<div style="display:flex;align-items:center;gap:12px;margin-bottom:28px">' +
    '<button class="btn btn-ghost btn-sm" onclick="renderDashboard()">\u2190 Back</button>' +
    '<h1 class="section-title">My Orders \ud83d\udce6</h1></div>' +
    '<div class="orders-list">' +
    (!orders.length ?
      '<div style="text-align:center;padding:60px;color:var(--text-muted)">' +
      '<div style="font-size:3rem;margin-bottom:12px">\ud83d\udce6</div>' +
      '<p>No orders yet. Time to shop! \ud83d\uded2</p>' +
      '<button class="btn btn-primary" style="margin-top:16px" onclick="navigate(\'home\')">Shop Now</button></div>'
      :
      orders.map(function(o) { return renderOrderCard(o); }).join('')
    ) +
    '</div></div>';
}

function renderOrderCard(o) {
  var stepIdx = getStepIndex(o.status);
  var totalSteps = ORDER_STEPS.length;
  var pct = Math.round((stepIdx / (totalSteps - 1)) * 100);
  var friendlyMsg = ORDER_STEPS[stepIdx] ? ORDER_STEPS[stepIdx].msg : o.status;
  var eta = getDeliveryEstimate(o);
  var items = o.items || [];

  return '<div class="order-card" id="oc-' + o.id + '">' +
    '<div class="order-card-header">' +
    '<div>' +
    '<div class="order-id">' + o.id + '</div>' +
    '<div style="font-size:0.78rem;color:var(--text-muted);margin-top:2px">' + formatDate(o.created_at) + '</div>' +
    '</div>' +
    '<div style="display:flex;align-items:center;gap:10px">' +
    '<span class="order-status-badge status-' + o.status + '">' + (ORDER_STEPS[stepIdx] ? ORDER_STEPS[stepIdx].icon + ' ' + ORDER_STEPS[stepIdx].label : o.status.replace(/_/g,' ')) + '</span>' +
    '<span class="price-discount" style="font-size:1rem">' + formatNaira(o.total_amount) + '</span>' +
    '</div>' +
    '</div>' +

    // Friendly status message
    '<div style="background:rgba(123,46,255,0.08);border-left:3px solid var(--neon-purple);padding:10px 14px;border-radius:0 10px 10px 0;margin-bottom:14px;font-size:0.875rem;color:var(--text-primary)">' +
    friendlyMsg +
    '</div>' +

    // Animated progress tracker
    '<div style="position:relative;margin:20px 0 10px">' +
    // Track line background
    '<div style="position:absolute;top:14px;left:24px;right:24px;height:3px;background:var(--glass);border-radius:2px"></div>' +
    // Track line filled (animated)
    '<div style="position:absolute;top:14px;left:24px;height:3px;background:linear-gradient(90deg,var(--neon-purple),var(--neon-cyan));border-radius:2px;width:' + pct + '%;max-width:calc(100% - 48px);transition:width 1s ease;box-shadow:0 0 8px rgba(0,245,255,0.4)"></div>' +
    // Glowing dot on current position
    '<div style="position:absolute;top:8px;left:calc(24px + ' + pct + '% * (100% - 48px) / 100 - 8px);width:16px;height:16px;border-radius:50%;background:var(--neon-cyan);box-shadow:0 0 12px rgba(0,245,255,0.8),0 0 24px rgba(0,245,255,0.4);animation:dotPulse 1.5s ease-in-out infinite;z-index:2"></div>' +
    // Step dots
    '<div style="position:relative;display:flex;justify-content:space-between;z-index:1">' +
    ORDER_STEPS.map(function(step, i) {
      var done = i <= stepIdx;
      var active = i === stepIdx;
      return '<div style="display:flex;flex-direction:column;align-items:center;gap:5px;flex:1">' +
        '<div style="width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:0.75rem;transition:all 0.4s;' +
        (done ? 'background:' + (active ? 'var(--neon-cyan)' : 'var(--neon-purple)') + ';box-shadow:0 0 ' + (active ? '16px rgba(0,245,255,0.7)' : '8px rgba(123,46,255,0.5)') + ';animation:' + (active ? 'dotPulse 1.5s ease-in-out infinite' : 'none') : 'background:var(--glass);border:2px solid var(--glass-border)') + '">' +
        (done ? (active ? step.icon : '\u2713') : (i + 1)) +
        '</div>' +
        '<div style="font-size:0.58rem;text-align:center;color:' + (done ? (active ? 'var(--neon-cyan)' : 'var(--neon-purple-light)') : 'var(--text-muted)') + ';font-weight:' + (active ? '700' : '400') + ';max-width:52px;line-height:1.2">' + step.label + '</div>' +
        '</div>';
    }).join('') +
    '</div></div>' +

    // ETA
    '<div style="display:flex;align-items:center;gap:8px;padding:10px 14px;background:rgba(0,245,255,0.06);border:1px solid rgba(0,245,255,0.15);border-radius:10px;font-size:0.82rem;color:var(--neon-cyan);margin-bottom:12px">' +
    '\u23f0 ' + eta +
    '</div>' +

    // Expandable timeline
    '<div>' +
    '<button onclick="toggleTimeline(\'' + o.id + '\')" style="background:none;border:none;color:var(--neon-purple-light);font-size:0.82rem;cursor:pointer;font-family:var(--font-body);display:flex;align-items:center;gap:6px;padding:0">' +
    '\ud83d\udccd View Full Timeline <span id="tl-arrow-' + o.id + '">\u25bc</span>' +
    '</button>' +
    '<div id="timeline-' + o.id + '" style="display:none;margin-top:12px;padding:14px;background:var(--glass);border-radius:12px;border:1px solid var(--glass-border)">' +
    '<div style="position:relative">' +
    '<div style="position:absolute;left:14px;top:0;bottom:0;width:2px;background:var(--glass-border)"></div>' +
    ORDER_STEPS.map(function(step, i) {
      var done = i <= stepIdx;
      return '<div style="display:flex;gap:14px;margin-bottom:' + (i < ORDER_STEPS.length - 1 ? '16px' : '0') + ';position:relative">' +
        '<div style="width:28px;height:28px;border-radius:50%;flex-shrink:0;display:flex;align-items:center;justify-content:center;font-size:0.8rem;z-index:1;' +
        (done ? 'background:var(--neon-purple);box-shadow:0 0 10px rgba(123,46,255,0.5)' : 'background:var(--glass);border:2px solid var(--glass-border)') + '">' +
        (done ? step.icon : '') + '</div>' +
        '<div style="padding-top:4px">' +
        '<div style="font-size:0.85rem;font-weight:700;color:' + (done ? 'var(--text-primary)' : 'var(--text-muted)') + '">' + step.label + '</div>' +
        '<div style="font-size:0.75rem;color:var(--text-muted)">' +
        (done ? (i === stepIdx ? 'Current stage \u2022 ' + formatDate(o.created_at) : 'Completed \u2713') : 'Pending') +
        '</div></div></div>';
    }).join('') +
    '</div></div></div>' +

    // Product thumbnails
    (items.length ?
      '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:12px">' +
      items.slice(0, 4).map(function(item) {
        return '<img src="' + ((item.images && item.images[0]) || 'https://placehold.co/40x40/7B2EFF/fff?text=R') + '" ' +
          'style="width:40px;height:40px;border-radius:8px;object-fit:cover" />';
      }).join('') +
      (items.length > 4 ? '<div style="width:40px;height:40px;border-radius:8px;background:var(--glass);display:flex;align-items:center;justify-content:center;font-size:0.75rem;color:var(--text-muted)">+' + (items.length - 4) + '</div>' : '') +
      '</div>'
    : '') +

    '</div>';
}

function toggleTimeline(orderId) {
  var tl = document.getElementById('timeline-' + orderId);
  var arrow = document.getElementById('tl-arrow-' + orderId);
  if (!tl) return;
  var open = tl.style.display !== 'none';
  tl.style.display = open ? 'none' : 'block';
  if (arrow) arrow.textContent = open ? '\u25bc' : '\u25b2';
}

// ── REFERRALS ──
async function renderReferrals() {
  if (!Store.user) { navigate('login'); return; }
  var p = Store.profile;
  var refLink = window.location.origin + window.location.pathname + '?ref=' + (p.username || '') + '#register';

  document.getElementById('app').innerHTML =
    '<div class="dashboard-page container page-enter">' +
    '<div style="display:flex;align-items:center;gap:12px;margin-bottom:28px">' +
    '<button class="btn btn-ghost btn-sm" onclick="renderDashboard()">\u2190 Back</button>' +
    '<h1 class="section-title">Referral Program \ud83c\udf81</h1></div>' +

    '<div class="referral-link-card">' +
    '<div style="font-size:2.5rem;margin-bottom:10px">\ud83c\udf81</div>' +
    '<h2 class="text-gradient" style="font-family:var(--font-display);font-size:1.6rem;margin-bottom:8px">Earn While You Share!</h2>' +
    '<p style="color:var(--text-secondary);margin-bottom:16px">Share your link — earn rewards when friends shop</p>' +
    '<div class="referral-link-display">' +
    '<span style="flex:1;word-break:break-all;font-size:0.82rem">' + refLink + '</span>' +
    '<button class="btn btn-primary btn-sm" onclick="copyToClipboard(\'' + refLink + '\')">\ud83d\udccb Copy</button>' +
    '</div>' +
    '<div style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap">' +
    '<button class="btn btn-ghost" onclick="shareWhatsApp(\'\ud83d\uded2 Join Rae Enterprise! Use my link: ' + refLink + '\')">\ud83d\udcac WhatsApp</button>' +
    '</div></div>' +

    '<div class="glass-card" style="padding:24px;margin-bottom:20px">' +
    '<h3 style="margin-bottom:14px">Reward Structure \ud83d\udcb0</h3>' +
    [['Friend spends \u20a610,000', '\u20a61,000 reward'], ['Friend spends \u20a6100,000', '\u20a610,000 reward']].map(function(row) {
      return '<div style="display:flex;align-items:center;justify-content:space-between;padding:12px;background:var(--glass);border:1px solid var(--glass-border);border-radius:var(--radius-sm);margin-bottom:10px">' +
        '<span style="font-size:0.9rem">' + row[0] + '</span><span class="badge badge-cyan">' + row[1] + '</span></div>';
    }).join('') +
    '<p style="font-size:0.78rem;color:var(--text-muted);margin-top:8px">\u26a0\ufe0f Rewards go to wallet balance (no withdrawal — used for purchases only)</p>' +
    '</div>' +

    '<div class="stats-grid">' +
    statCard('\ud83d\udc65', p.referral_count || 0, 'Total Referrals', 'text-neon-purple') +
    statCard('\ud83d\udcb0', formatNaira(p.wallet_balance || 0), 'Wallet Balance', 'text-neon-cyan') +
    '</div></div>';
}

// ── WALLET ──
async function renderWallet() {
  if (!Store.user) { navigate('login'); return; }
  var p = Store.profile;
  var res = await db.from('orders').select('id,total_amount,created_at,status').eq('user_id', Store.user.id).order('created_at', { ascending: false }).limit(10);
  var orders = res.data || [];

  document.getElementById('app').innerHTML =
    '<div class="dashboard-page container page-enter">' +
    '<div style="display:flex;align-items:center;gap:12px;margin-bottom:28px">' +
    '<button class="btn btn-ghost btn-sm" onclick="renderDashboard()">\u2190 Back</button>' +
    '<h1 class="section-title">My Wallet \ud83d\udcb0</h1></div>' +

    '<div class="wallet-card">' +
    '<div style="font-size:1rem;color:var(--text-secondary)">Available Balance</div>' +
    '<div class="wallet-balance text-gradient">' + formatNaira(p.wallet_balance || 0) + '</div>' +
    '<div class="badge badge-purple">Used for purchases only</div>' +
    '</div>' +

    '<div class="glass-card" style="padding:22px;margin-bottom:20px">' +
    '<h3 style="margin-bottom:12px">How to earn credits?</h3>' +
    ['\ud83c\udf81 Referral rewards when friends shop', '\u2b50 Admin bonuses & promotions', '\ud83d\udcb0 Level-up rewards'].map(function(i) {
      return '<div style="display:flex;align-items:center;gap:10px;font-size:0.875rem;color:var(--text-secondary);margin-bottom:8px">' + i + '</div>';
    }).join('') +
    '</div>' +

    '<h3 style="margin-bottom:14px">Order History</h3>' +
    (orders.length ?
      orders.map(function(o) {
        return '<div style="display:flex;align-items:center;justify-content:space-between;padding:12px 14px;background:var(--glass);border:1px solid var(--glass-border);border-radius:var(--radius-sm);margin-bottom:10px">' +
          '<div><div style="font-size:0.8rem;font-family:monospace;color:var(--neon-purple-light)">' + o.id + '</div>' +
          '<div style="font-size:0.75rem;color:var(--text-muted)">' + formatDate(o.created_at) + '</div></div>' +
          '<div style="text-align:right"><div style="font-weight:700;color:var(--neon-cyan)">' + formatNaira(o.total_amount) + '</div>' +
          '<span class="order-status-badge status-' + o.status + '" style="font-size:0.62rem">' + o.status.replace(/_/g,' ') + '</span></div>' +
          '</div>';
      }).join('')
    : '<p style="color:var(--text-muted);text-align:center;padding:20px">No orders yet</p>') +
    '</div>';
}

// ── NOTIFICATIONS ──
async function renderNotifications() {
  if (!Store.user) { navigate('login'); return; }
  var res = await db.from('notifications').select('*').eq('user_id', Store.user.id).order('created_at', { ascending: false }).limit(30);
  var notifs = res.data || [];

  var ICONS = { reward: '\ud83c\udf81', order_update: '\ud83d\udce6', promo: '\ud83d\udd25', info: '\ud83d\udc9c' };

  document.getElementById('app').innerHTML =
    '<div class="dashboard-page container page-enter">' +
    '<div style="display:flex;align-items:center;gap:12px;margin-bottom:28px">' +
    '<button class="btn btn-ghost btn-sm" onclick="navigate(\'home\')">\u2190 Back</button>' +
    '<h1 class="section-title">\ud83d\udd14 Notifications</h1></div>' +
    '<div style="display:flex;flex-direction:column;gap:10px">' +
    (!notifs.length ?
      '<div style="text-align:center;padding:60px;color:var(--text-muted)"><div style="font-size:3rem">\ud83d\udd14</div><p style="margin-top:12px">No notifications yet. Start shopping! \ud83d\udc9c</p></div>'
      :
      notifs.map(function(n) {
        return '<div style="display:flex;align-items:flex-start;gap:14px;padding:16px;background:var(--glass);border:1px solid var(--glass-border);border-radius:var(--radius);transition:border-color 0.2s" onmouseenter="this.style.borderColor=\'var(--neon-purple)\'" onmouseleave="this.style.borderColor=\'var(--glass-border)\'">' +
          '<div style="font-size:1.5rem;flex-shrink:0">' + (ICONS[n.type] || '\ud83d\udc9c') + '</div>' +
          '<div style="flex:1"><div style="font-size:0.875rem;margin-bottom:4px">' + n.message + '</div>' +
          '<div style="font-size:0.75rem;color:var(--text-muted)">' + timeAgo(n.created_at) + '</div></div>' +
          '</div>';
      }).join('')
    ) +
    '</div></div>';
}

// ── SETTINGS / SECURITY ──
async function renderSettings() {
  if (!Store.user) { navigate('login'); return; }
  var p = Store.profile;

  document.getElementById('app').innerHTML =
    '<div class="dashboard-page container page-enter">' +
    '<div style="display:flex;align-items:center;gap:12px;margin-bottom:28px">' +
    '<button class="btn btn-ghost btn-sm" onclick="renderDashboard()">\u2190 Back</button>' +
    '<h1 class="section-title">\ud83d\udd10 Security Settings</h1></div>' +

    '<div class="glass-card" style="padding:28px;margin-bottom:20px">' +
    '<h3 style="margin-bottom:20px">Change Password</h3>' +
    '<div class="input-group"><label>Current Password</label>' +
    '<div class="input-wrapper"><input class="input-field" type="password" id="cp-old" placeholder="Current password" />' +
    '<span class="input-icon" onclick="togglePw(\'cp-old\',this)" style="cursor:pointer">\ud83d\udc41</span></div></div>' +
    '<div class="input-group"><label>New Password</label>' +
    '<div class="input-wrapper"><input class="input-field" type="password" id="cp-new" placeholder="New password (min 4 chars)" />' +
    '<span class="input-icon" onclick="togglePw(\'cp-new\',this)" style="cursor:pointer">\ud83d\udc41</span></div></div>' +
    '<div class="input-group"><label>Confirm New Password</label>' +
    '<div class="input-wrapper"><input class="input-field" type="password" id="cp-con" placeholder="Confirm new password" />' +
    '<span class="input-icon" onclick="togglePw(\'cp-con\',this)" style="cursor:pointer">\ud83d\udc41</span></div></div>' +
    '<button class="btn btn-primary" id="cp-btn" onclick="changePassword()">\ud83d\udd10 Update Password</button>' +
    '</div>' +

    '<div class="glass-card" style="padding:28px">' +
    '<h3 style="margin-bottom:16px">Account Info</h3>' +
    '<div style="display:flex;flex-direction:column;gap:10px">' +
    [['Username', p.username || '—'], ['Email', p.email || '—'], ['Phone', p.phone || '—'], ['Member Since', formatDate(p.created_at)]].map(function(row) {
      return '<div style="display:flex;justify-content:space-between;padding:12px;background:var(--glass);border-radius:var(--radius-sm);font-size:0.875rem">' +
        '<span style="color:var(--text-muted)">' + row[0] + '</span>' +
        '<span style="font-weight:600">' + row[1] + '</span></div>';
    }).join('') +
    '</div></div></div>';
}

async function changePassword() {
  var btn = document.getElementById('cp-btn');
  var oldPw  = (document.getElementById('cp-old').value || '').trim();
  var newPw  = (document.getElementById('cp-new').value || '').trim();
  var conPw  = (document.getElementById('cp-con').value || '').trim();

  if (!oldPw || !newPw || !conPw) { toast('Fill all password fields \ud83d\udc94', 'error'); return; }
  if (newPw !== conPw) { toast('New passwords don\'t match \ud83d\udc94', 'error'); return; }
  if (newPw.length < 4) { toast('Password too short \ud83d\udc94', 'error'); return; }

  setLoading(btn, true);

  var oldHash = await sha256(oldPw);
  var res = await db.from('profiles').select('password').eq('id', Store.user.id).single();

  if (!res.data || res.data.password !== oldHash) {
    toast('Current password is wrong \ud83d\udc94', 'error');
    setLoading(btn, false); return;
  }

  var newHash = await sha256(newPw);
  await db.from('profiles').update({ password: newHash }).eq('id', Store.user.id);
  setLoading(btn, false);
  toast('Password updated successfully! \ud83d\udd10\u2728');
  document.getElementById('cp-old').value = '';
  document.getElementById('cp-new').value = '';
  document.getElementById('cp-con').value = '';
}
