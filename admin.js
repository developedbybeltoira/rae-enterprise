// RAE ENTERPRISE — Admin Panel
// Hardcoded admin: Chinedu / Jopoboy2010.
// Works WITHOUT needing a profiles row — bypass login entirely

var ADMIN_UN = 'Chinedu';
var ADMIN_PW = 'Jopoboy2010.';
var adminAuthed = false; // tracks if admin logged in this session
var adminTab = 'orders';

var DEFAULT_CATEGORIES = ['Fashion','Beauty','Tech','Home','Shoes','Accessories',
  'Gifts','Jewelry','Kids','Sports','Electronics','Food','Books','Art','Music'];

// ── Entry point ──────────────────────────────────────
function renderAdmin() {
  // Allow access if: hardcoded session OR profile role=admin
  if (!adminAuthed && !Store.isAdmin()) {
    renderAdminLogin();
    return;
  }
  buildAdminUI();
}

function renderAdminLogin() {
  document.getElementById('app').innerHTML =
    '<div style="min-height:100vh;display:flex;align-items:center;justify-content:center;padding:24px;padding-top:80px">' +
    '<div class="auth-card glow-border" style="max-width:380px;width:100%;padding:36px">' +
    '<div style="text-align:center;margin-bottom:24px">' +
    '<div style="font-size:2.5rem;margin-bottom:8px">\u2699\ufe0f</div>' +
    '<h2 class="text-gradient" style="font-family:var(--font-display)">Admin Access</h2>' +
    '<p style="color:var(--text-secondary);font-size:0.85rem;margin-top:6px">Rae Enterprise Control Panel</p>' +
    '</div>' +
    '<div class="input-group"><label>Username</label>' +
    '<div class="input-wrapper"><input class="input-field" type="text" id="adm-u" placeholder="Admin username" autocomplete="username"/>' +
    '<span class="input-icon">\ud83d\udc64</span></div></div>' +
    '<div class="input-group"><label>Password</label>' +
    '<div class="input-wrapper"><input class="input-field" type="password" id="adm-p" placeholder="Admin password" autocomplete="current-password" onkeydown="if(event.key===\'Enter\')checkAdminLogin()"/>' +
    '<span class="input-icon" onclick="togglePw(\'adm-p\',this)" style="cursor:pointer">\ud83d\udc41</span></div></div>' +
    '<button class="btn btn-primary btn-full btn-lg" onclick="checkAdminLogin()" id="adm-btn">\u2699\ufe0f Enter Admin Panel</button>' +
    '<div style="text-align:center;margin-top:16px">' +
    '<button class="btn btn-ghost btn-sm" onclick="navigate(\'home\')">\u2190 Back to Store</button>' +
    '</div></div></div>';
}

function checkAdminLogin() {
  var u = (document.getElementById('adm-u').value || '').trim();
  var p = (document.getElementById('adm-p').value || '').trim();
  if (u === ADMIN_UN && p === ADMIN_PW) {
    adminAuthed = true;
    sessionStorage.setItem('rae_admin', '1');
    toast('Welcome, Admin Chinedu! \ud83d\udc9c');
    buildAdminUI();
  } else {
    toast('Wrong admin credentials \ud83d\udc94', 'error');
    var btn = document.getElementById('adm-btn');
    if (btn) { btn.style.animation = 'shake 0.4s ease'; setTimeout(function(){ btn.style.animation=''; }, 500); }
  }
}

function buildAdminUI() {
  var TABS = [
    { id:'orders',      label:'\ud83d\udce6 Orders' },
    { id:'products',    label:'\ud83d\uded2 Products' },
    { id:'users',       label:'\ud83d\udc65 Users' },
    { id:'notify',      label:'\ud83d\udd14 Notify' },
    { id:'requests',    label:'\ud83d\udce3 Requests' },
    { id:'add-product', label:'\u2795 Add Product' },
    { id:'categories',  label:'\ud83c\udff7\ufe0f Categories' },
  ];

  document.getElementById('app').innerHTML =
    '<div class="admin-page container page-enter">' +
    '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:20px;flex-wrap:wrap;gap:10px">' +
    '<div style="display:flex;align-items:center;gap:12px">' +
    '<h1 class="section-title">\u2699\ufe0f Admin Panel</h1>' +
    '<span class="badge badge-pink">Admin</span>' +
    '</div>' +
    '<button class="btn btn-ghost btn-sm" onclick="adminLogout()">\ud83d\udeaa Logout Admin</button>' +
    '</div>' +
    '<div class="admin-tabs">' +
    TABS.map(function(t) {
      return '<button class="admin-tab ' + (adminTab === t.id ? 'active' : '') + '" onclick="switchAdminTab(\'' + t.id + '\')">' + t.label + '</button>';
    }).join('') +
    '</div>' +
    '<div id="admin-content"><div style="text-align:center;padding:40px"><div class="spinner" style="margin:auto"></div></div></div>' +
    '</div>';

  loadAdminTab(adminTab);
}

function adminLogout() {
  adminAuthed = false;
  sessionStorage.removeItem('rae_admin');
  toast('Admin session ended', 'info');
  navigate('home');
}

function switchAdminTab(tab) {
  adminTab = tab;
  document.querySelectorAll('.admin-tab').forEach(function(btn, i) {
    var ids = ['orders','products','users','notify','requests','add-product','categories'];
    btn.classList.toggle('active', ids[i] === tab);
  });
  loadAdminTab(tab);
}

async function loadAdminTab(tab) {
  var c = document.getElementById('admin-content');
  if (!c) return;
  c.innerHTML = '<div style="text-align:center;padding:40px"><div class="spinner" style="margin:auto"></div></div>';
  if (tab === 'orders')       await renderAdminOrders(c);
  else if (tab === 'products') await renderAdminProducts(c);
  else if (tab === 'users')    await renderAdminUsers(c);
  else if (tab === 'notify')   renderNotifyTab(c);
  else if (tab === 'requests') await renderAdminRequests(c);
  else if (tab === 'add-product') renderAddProductForm(c, null);
  else if (tab === 'categories')  renderCategoriesTab(c);
}

// ── ORDERS ───────────────────────────────────────────
var ORDER_STEPS_ADMIN = [
  { key:'awaiting_approval', label:'Awaiting Payment' },
  { key:'approved',          label:'Approved' },
  { key:'processing',        label:'Processing' },
  { key:'shipped',           label:'Shipped' },
  { key:'delivered',         label:'Delivered' },
];

async function renderAdminOrders(c) {
  var res = await db.from('orders').select('*').order('created_at', { ascending: false }).limit(80);
  var orders = res.data || [];

  c.innerHTML =
    '<div style="margin-bottom:14px;display:flex;gap:10px;flex-wrap:wrap">' +
    '<input class="input-field" id="ord-search" placeholder="\ud83d\udd0d Search order ID or name..." style="flex:1;max-width:300px" oninput="filterOrders(this.value)" />' +
    '</div>' +
    '<div class="admin-table-wrap" id="orders-table">' +
    buildOrdersTable(orders) +
    '</div>';

  window._allOrders = orders;
}

function buildOrdersTable(orders) {
  if (!orders.length) return '<div style="text-align:center;padding:40px;color:var(--text-muted)">No orders yet</div>';
  return '<table class="admin-table"><thead><tr>' +
    '<th>Order ID</th><th>Customer</th><th>Amount</th><th>Items/Size</th><th>Date</th><th>Status</th><th>Actions</th>' +
    '</tr></thead><tbody>' +
    orders.map(function(o) {
      var items = o.items || [];
      var sizes = items.map(function(i){ return i.selected_size || ''; }).filter(Boolean).join(', ') || '—';
      var itemNames = items.slice(0,2).map(function(i){ return i.name; }).join(', ') + (items.length > 2 ? ' +' + (items.length-2) : '');
      return '<tr>' +
        '<td style="font-family:monospace;color:var(--neon-purple-light);font-size:0.75rem">' + o.id + '</td>' +
        '<td><div style="font-weight:600;font-size:0.875rem">' + (o.full_name || '—') + '</div>' +
        '<div style="font-size:0.72rem;color:var(--text-muted)">' + (o.phone || '') + '</div></td>' +
        '<td class="text-neon-cyan fw-700">' + formatNaira(o.total_amount) + '</td>' +
        '<td style="font-size:0.78rem"><div>' + itemNames + '</div><div style="color:var(--neon-purple-light)">' + sizes + '</div></td>' +
        '<td style="font-size:0.75rem;color:var(--text-muted)">' + formatDate(o.created_at) + '</td>' +
        '<td>' +
        '<select class="status-select" onchange="updateOrderStatus(\'' + o.id + '\',this.value,\'' + (o.user_id||'') + '\')">' +
        ORDER_STEPS_ADMIN.map(function(s){ return '<option value="' + s.key + '"' + (o.status === s.key ? ' selected' : '') + '>' + s.label + '</option>'; }).join('') +
        '</select></td>' +
        '<td><div style="display:flex;gap:5px;flex-wrap:wrap">' +
        (o.proof_url ? '<a href="' + o.proof_url + '" target="_blank" class="btn btn-ghost btn-sm">\ud83d\udcf7 Proof</a>' : '') +
        '<button class="btn btn-outline btn-sm" onclick="showInvoice(\'' + o.id + '\')">🧾 Invoice</button>' +
        '</div></td>' +
        '</tr>';
    }).join('') +
    '</tbody></table>';
}

function filterOrders(q) {
  if (!window._allOrders) return;
  q = q.toLowerCase();
  var filtered = !q ? window._allOrders : window._allOrders.filter(function(o) {
    return o.id.toLowerCase().indexOf(q) !== -1 || (o.full_name || '').toLowerCase().indexOf(q) !== -1;
  });
  var tbl = document.getElementById('orders-table');
  if (tbl) tbl.innerHTML = buildOrdersTable(filtered);
}

async function updateOrderStatus(orderId, status, userId) {
  await db.from('orders').update({ status: status }).eq('id', orderId);
  // Friendly notification messages
  var msgs = {
    'awaiting_approval': '\ud83d\udcb3 We received your order! Awaiting payment confirmation.',
    'approved':          '\u2705 Payment confirmed! Your order has been approved.',
    'processing':        '\ud83d\udd27 Your item is being prepared for shipment.',
    'shipped':           '\ud83d\ude9a On the way to you! Your order has been shipped.',
    'delivered':         '\ud83c\udf89 Delivered! We hope you love your purchase from Rae Enterprise \ud83d\udc9c'
  };
  if (userId) {
    await db.from('notifications').insert({
      user_id: userId,
      message: msgs[status] || ('Your order ' + orderId + ' is now: ' + status.replace(/_/g,' ')),
      type: 'order_update',
      created_at: new Date().toISOString()
    });
  }
  toast('Order updated \u2192 ' + status + ' \u2728');
  loadAdminTab('orders');
}

// ── INVOICE ──────────────────────────────────────────
async function showInvoice(orderId) {
  var res = await db.from('orders').select('*').eq('id', orderId).single();
  if (!res.data) { toast('Order not found', 'error'); return; }
  var o = res.data;
  var items = o.items || [];

  var ov = document.createElement('div');
  ov.className = 'overlay'; ov.id = 'inv-ov';
  ov.innerHTML =
    '<div class="modal" style="max-width:500px;font-family:var(--font-body)">' +
    '<div style="text-align:center;padding-bottom:18px;margin-bottom:18px;border-bottom:1px solid var(--glass-border)">' +
    '<div style="font-family:var(--font-script);font-size:2.2rem;background:linear-gradient(135deg,#7B2EFF,#00F5FF);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text">Rae Enterprise</div>' +
    '<div style="font-size:0.78rem;color:var(--text-muted)">Premium Shopping \u2014 Nigeria\'s Finest</div>' +
    '<div style="font-size:0.75rem;color:var(--text-muted);margin-top:3px">\ud83d\udcde 08117706203</div>' +
    '</div>' +
    '<div style="display:flex;justify-content:space-between;margin-bottom:14px;font-size:0.83rem">' +
    '<div><strong>Invoice:</strong> ' + o.id + '</div><div><strong>Date:</strong> ' + formatDate(o.created_at) + '</div>' +
    '</div>' +
    '<div style="background:var(--glass);border-radius:10px;padding:12px;margin-bottom:14px;font-size:0.83rem">' +
    '<strong>Customer:</strong> ' + (o.full_name||'—') + '<br>' +
    '<strong>Phone:</strong> ' + (o.phone||'—') + '<br>' +
    '<strong>Address:</strong> ' + (o.address||'—') +
    '</div>' +
    '<table style="width:100%;font-size:0.82rem;border-collapse:collapse;margin-bottom:14px">' +
    '<thead><tr style="border-bottom:1px solid var(--glass-border)">' +
    '<th style="text-align:left;padding:7px 4px;color:var(--text-muted)">Product</th>' +
    '<th style="text-align:center;padding:7px 4px;color:var(--text-muted)">Size</th>' +
    '<th style="text-align:center;padding:7px 4px;color:var(--text-muted)">Qty</th>' +
    '<th style="text-align:right;padding:7px 4px;color:var(--text-muted)">Price</th>' +
    '</tr></thead><tbody>' +
    items.map(function(item) {
      return '<tr style="border-bottom:1px solid rgba(123,46,255,0.08)">' +
        '<td style="padding:7px 4px">' + (item.name||'—') + '</td>' +
        '<td style="text-align:center;padding:7px 4px">' + (item.selected_size||'—') + '</td>' +
        '<td style="text-align:center;padding:7px 4px">' + (item.qty||1) + '</td>' +
        '<td style="text-align:right;padding:7px 4px;color:var(--neon-cyan);font-weight:700">' + formatNaira((item.discount_price||item.price||0)*(item.qty||1)) + '</td>' +
        '</tr>';
    }).join('') +
    '</tbody></table>' +
    '<div style="display:flex;justify-content:space-between;font-weight:700;font-size:1rem;padding-top:12px;border-top:1px solid var(--glass-border)">' +
    '<span>Total</span><span style="color:var(--neon-cyan)">' + formatNaira(o.total_amount) + '</span>' +
    '</div>' +
    '<div style="text-align:center;margin-top:16px;font-size:0.75rem;color:var(--text-muted)">Thank you for shopping with Rae Enterprise! \ud83d\udc9c</div>' +
    '<div style="display:flex;gap:10px;margin-top:18px">' +
    '<button class="btn btn-primary" style="flex:1" onclick="window.print()">\ud83d\udda8\ufe0f Print</button>' +
    '<button class="btn btn-ghost" style="flex:1" onclick="document.getElementById(\'inv-ov\').remove()">Close</button>' +
    '</div></div>';

  document.body.appendChild(ov);
  ov.addEventListener('click', function(e){ if(e.target===ov) ov.remove(); });
}

// ── PRODUCTS ─────────────────────────────────────────
async function renderAdminProducts(c) {
  var res = await db.from('products').select('*').order('created_at', { ascending: false });
  var products = res.data || [];
  c.innerHTML =
    '<div style="display:flex;justify-content:flex-end;margin-bottom:14px">' +
    '<button class="btn btn-primary btn-sm" onclick="switchAdminTab(\'add-product\')">\u2795 Add Product</button></div>' +
    '<div class="admin-table-wrap"><table class="admin-table"><thead><tr>' +
    '<th>Image</th><th>Name</th><th>Price</th><th>Discount</th><th>Stock</th><th>Status</th><th>Actions</th>' +
    '</tr></thead><tbody>' +
    (products.length ? products.map(function(p) {
      var img = (p.images && p.images[0]) || 'https://placehold.co/48x48/7B2EFF/fff?text=R';
      return '<tr>' +
        '<td><img style="width:48px;height:48px;border-radius:8px;object-fit:cover" src="' + img + '" onerror="this.src=\'https://placehold.co/48x48/7B2EFF/fff?text=R\'" /></td>' +
        '<td style="font-weight:600;max-width:160px;font-size:0.875rem">' + p.name + '</td>' +
        '<td style="text-decoration:line-through;color:var(--text-muted)">' + formatNaira(p.price) + '</td>' +
        '<td class="text-neon-cyan fw-700">' + formatNaira(p.discount_price) + '</td>' +
        '<td style="color:' + (p.stock_count <= 5 ? 'var(--neon-pink)' : 'var(--neon-cyan)') + ';font-weight:700">' + p.stock_count + '</td>' +
        '<td><span class="badge ' + (p.in_stock ? 'badge-cyan' : 'badge-pink') + '">' + (p.in_stock ? 'In Stock' : 'Out of Stock') + '</span></td>' +
        '<td><div style="display:flex;gap:5px">' +
        '<button class="btn btn-ghost btn-sm" onclick="editProduct(\'' + p.id + '\')">\u270f\ufe0f Edit</button>' +
        '<button class="btn btn-sm" style="background:rgba(255,46,189,0.15);color:var(--neon-pink);border:1px solid rgba(255,46,189,0.3)" onclick="deleteProduct(\'' + p.id + '\')">\ud83d\uddd1</button>' +
        '</div></td></tr>';
    }).join('') : '<tr><td colspan="7" style="text-align:center;padding:40px;color:var(--text-muted)">No products yet. Add one!</td></tr>') +
    '</tbody></table></div>';
}

// ── USERS ────────────────────────────────────────────
async function renderAdminUsers(c) {
  var res = await db.from('profiles').select('*').order('created_at', { ascending: false }).limit(80);
  var users = res.data || [];
  c.innerHTML =
    '<div class="admin-table-wrap"><table class="admin-table"><thead><tr>' +
    '<th>Username</th><th>Email</th><th>Phone</th><th>Wallet</th><th>Spent</th><th>Level</th><th>Actions</th>' +
    '</tr></thead><tbody>' +
    (users.length ? users.map(function(u) {
      var lvl = getLevel(u.total_spent || 0);
      return '<tr>' +
        '<td style="font-weight:700">' + (u.username||'—') + '</td>' +
        '<td style="font-size:0.8rem;color:var(--text-muted)">' + (u.email||'—') + '</td>' +
        '<td style="font-size:0.8rem">' + (u.phone||'—') + '</td>' +
        '<td class="text-neon-cyan">' + formatNaira(u.wallet_balance||0) + '</td>' +
        '<td style="color:var(--text-secondary)">' + formatNaira(u.total_spent||0) + '</td>' +
        '<td><span class="' + lvl.class + '">' + lvl.icon + ' ' + lvl.name + '</span></td>' +
        '<td><button class="btn btn-outline btn-sm" onclick="adjustWallet(\'' + u.id + '\',\'' + (u.username||'user') + '\')">\ud83d\udcb0 Wallet</button></td>' +
        '</tr>';
    }).join('') : '<tr><td colspan="7" style="text-align:center;padding:40px;color:var(--text-muted)">No users yet</td></tr>') +
    '</tbody></table></div>';
}

// ── WALLET ADJUST ─────────────────────────────────────
function adjustWallet(userId, username) {
  var ov = document.createElement('div'); ov.className = 'overlay'; ov.id = 'wal-ov';
  ov.innerHTML =
    '<div class="modal" style="max-width:360px">' +
    '<h3 style="margin-bottom:18px">Wallet \u2014 <span class="text-neon-purple">' + username + '</span></h3>' +
    '<div class="input-group"><label>Action</label>' +
    '<select class="input-field" id="wa-act"><option value="add">Add Balance</option><option value="remove">Remove Balance</option></select></div>' +
    '<div class="input-group"><label>Amount (\u20a6)</label>' +
    '<input class="input-field" type="number" id="wa-amt" placeholder="Enter amount" min="1" /></div>' +
    '<div style="display:flex;gap:10px;margin-top:4px">' +
    '<button class="btn btn-primary" onclick="applyWallet(\'' + userId + '\')">Apply \u2728</button>' +
    '<button class="btn btn-ghost" onclick="document.getElementById(\'wal-ov\').remove()">Cancel</button>' +
    '</div></div>';
  document.body.appendChild(ov);
  ov.addEventListener('click', function(e){ if(e.target===ov) ov.remove(); });
}

async function applyWallet(userId) {
  var action = document.getElementById('wa-act').value;
  var amount = parseFloat(document.getElementById('wa-amt').value);
  if (!amount || amount <= 0) { toast('Enter a valid amount', 'warn'); return; }
  var res = await db.from('profiles').select('wallet_balance').eq('id', userId).single();
  var cur = (res.data && res.data.wallet_balance) || 0;
  var newBal = action === 'add' ? cur + amount : Math.max(0, cur - amount);
  await db.from('profiles').update({ wallet_balance: newBal }).eq('id', userId);
  document.getElementById('wal-ov').remove();
  toast((action === 'add' ? 'Credited' : 'Debited') + ' ' + formatNaira(amount) + ' \u2728');
  loadAdminTab('users');
}

// ── SEND NOTIFICATIONS ────────────────────────────────
function renderNotifyTab(c) {
  c.innerHTML =
    '<div class="glass-card" style="padding:28px;margin-bottom:20px">' +
    '<h3 style="margin-bottom:6px">\ud83d\udd14 Send Notification to Users</h3>' +
    '<p style="color:var(--text-secondary);font-size:0.85rem;margin-bottom:20px">Send a message directly to all users or a specific user.</p>' +

    '<div class="input-group"><label>Recipient</label>' +
    '<select class="input-field" id="notif-target">' +
    '<option value="all">All Users</option>' +
    '<option value="one">Specific User (by username)</option>' +
    '</select></div>' +

    '<div id="notif-user-wrap" style="display:none">' +
    '<div class="input-group"><label>Username</label>' +
    '<input class="input-field" id="notif-username" placeholder="Enter exact username" /></div>' +
    '</div>' +

    '<div class="input-group"><label>Message Type</label>' +
    '<select class="input-field" id="notif-type" onchange="fillTemplate(this.value)">' +
    '<option value="">Custom message</option>' +
    '<option value="promo">🔥 Promo / Flash Sale</option>' +
    '<option value="stock">✨ New Arrivals</option>' +
    '<option value="reward">🎁 Bonus / Reward</option>' +
    '<option value="reminder">💜 Shopping Reminder</option>' +
    '</select></div>' +

    '<div class="input-group"><label>Message</label>' +
    '<textarea class="input-field" id="notif-msg" rows="3" placeholder="Type your message here..." style="resize:vertical"></textarea></div>' +

    '<button class="btn btn-primary" id="notif-btn" onclick="sendAdminNotif()">\ud83d\udce8 Send Notification</button>' +
    '</div>' +

    '<div class="glass-card" style="padding:28px">' +
    '<h3 style="margin-bottom:16px">Quick Templates</h3>' +
    '<div style="display:flex;flex-direction:column;gap:10px">' +
    [
      ['\ud83d\udd25 Flash Sale Alert', '\ud83d\udd25 FLASH SALE! Up to 70% OFF on selected items \u2014 today only! Shop now on Rae Enterprise before it ends!', 'promo'],
      ['\u2728 New Arrivals', '\u2728 New products just dropped on Rae Enterprise! Check out our latest collection \u2014 you don\'t want to miss this!', 'stock'],
      ['\ud83c\udf81 Referral Reminder', '\ud83c\udf81 Remind your friends about Rae Enterprise and earn up to \u20a610,000 in wallet rewards! Share your referral link now.', 'reward'],
      ['\ud83d\udc9c Come Back!', '\ud83d\udc9c We miss you! Come shop at Rae Enterprise \u2014 great deals are waiting just for you \u2728', 'reminder'],
    ].map(function(t) {
      return '<div style="display:flex;align-items:center;justify-content:space-between;padding:12px 16px;background:var(--glass);border:1px solid var(--glass-border);border-radius:var(--radius-sm);gap:12px">' +
        '<span style="font-size:0.875rem">' + t[0] + '</span>' +
        '<button class="btn btn-ghost btn-sm" onclick="useTemplate(\'' + t[2] + '\',`' + t[1] + '`)">Use</button>' +
        '</div>';
    }).join('') +
    '</div></div>';

  // Toggle specific user field
  var sel = document.getElementById('notif-target');
  if (sel) sel.onchange = function() {
    var wrap = document.getElementById('notif-user-wrap');
    if (wrap) wrap.style.display = this.value === 'one' ? 'block' : 'none';
  };
}

var NOTIF_TEMPLATES = {
  promo:    '\ud83d\udd25 FLASH SALE is LIVE on Rae Enterprise! Up to 70% OFF \u2014 shop now before it ends!',
  stock:    '\u2728 New arrivals just dropped on Rae Enterprise! Check out the latest collection today.',
  reward:   '\ud83c\udf81 You have a special reward waiting! Check your wallet on Rae Enterprise.',
  reminder: '\ud83d\udc9c We miss you at Rae Enterprise! Amazing deals are waiting for you. Come shop! \u2728',
};

function fillTemplate(type) {
  if (!type) return;
  var msg = document.getElementById('notif-msg');
  if (msg && NOTIF_TEMPLATES[type]) msg.value = NOTIF_TEMPLATES[type];
}

function useTemplate(type, text) {
  var sel = document.getElementById('notif-type'); if (sel) sel.value = type;
  var msg = document.getElementById('notif-msg'); if (msg) msg.value = text;
}

async function sendAdminNotif() {
  var btn = document.getElementById('notif-btn');
  var target = (document.getElementById('notif-target').value || 'all');
  var message = (document.getElementById('notif-msg').value || '').trim();
  var type = (document.getElementById('notif-type').value || 'info') || 'promo';

  if (!message) { toast('Please write a message first \ud83d\udc94', 'error'); return; }
  setLoading(btn, true);

  try {
    if (target === 'all') {
      var usersRes = await db.from('profiles').select('id');
      var users = usersRes.data || [];
      if (!users.length) { toast('No users found', 'warn'); setLoading(btn, false); return; }
      var notifs = users.map(function(u) {
        return { user_id: u.id, message: message, type: type, created_at: new Date().toISOString() };
      });
      // Insert in batches of 50
      for (var i = 0; i < notifs.length; i += 50) {
        await db.from('notifications').insert(notifs.slice(i, i + 50));
      }
      toast('Notification sent to ' + users.length + ' users! \ud83d\udce8\u2728');
    } else {
      var uname = (document.getElementById('notif-username').value || '').trim();
      if (!uname) { toast('Enter a username', 'warn'); setLoading(btn, false); return; }
      var uRes = await db.from('profiles').select('id').eq('username', uname).single();
      if (!uRes.data) { toast('User "' + uname + '" not found \ud83d\udc94', 'error'); setLoading(btn, false); return; }
      await db.from('notifications').insert({ user_id: uRes.data.id, message: message, type: type, created_at: new Date().toISOString() });
      toast('Notification sent to ' + uname + '! \ud83d\udce8');
    }

    // Clear form
    var msg = document.getElementById('notif-msg'); if (msg) msg.value = '';
    var nt = document.getElementById('notif-type'); if (nt) nt.value = '';
  } catch(e) {
    toast('Error sending: ' + (e.message || 'unknown'), 'error');
  }
  setLoading(btn, false);
}

// ── REQUESTS ─────────────────────────────────────────
async function renderAdminRequests(c) {
  var res = await db.from('item_requests').select('*').order('count', { ascending: false });
  var requests = res.data || [];

  var grouped = {};
  requests.forEach(function(r) {
    if (!grouped[r.product_id]) grouped[r.product_id] = { name: r.product_name, total: 0, users: [] };
    grouped[r.product_id].total += (r.count || 1);
    if (grouped[r.product_id].users.indexOf(r.username) === -1) grouped[r.product_id].users.push(r.username || 'Unknown');
  });

  var keys = Object.keys(grouped);
  c.innerHTML =
    '<div class="glass-card" style="padding:14px 18px;margin-bottom:16px">' +
    '<p style="font-size:0.875rem;color:var(--text-secondary)">' +
    'These products were requested by users when out of stock. Restock to meet demand! \ud83d\udce6' +
    '</p></div>' +
    '<div class="admin-table-wrap"><table class="admin-table"><thead><tr>' +
    '<th>Product</th><th>Total Requests</th><th>Requested By</th><th>Action</th>' +
    '</tr></thead><tbody>' +
    (keys.length ? keys.map(function(pid) {
      var g = grouped[pid];
      return '<tr>' +
        '<td style="font-weight:600">' + (g.name || pid) + '</td>' +
        '<td><span class="badge badge-pink" style="font-size:0.9rem;padding:6px 14px">' + g.total + ' \ud83d\udce3</span></td>' +
        '<td style="font-size:0.8rem;color:var(--text-muted)">' + g.users.slice(0,5).join(', ') + (g.users.length > 5 ? ' +' + (g.users.length-5) + ' more' : '') + '</td>' +
        '<td><button class="btn btn-outline btn-sm" onclick="switchAdminTab(\'products\')">Restock</button></td>' +
        '</tr>';
    }).join('') : '<tr><td colspan="4" style="text-align:center;padding:40px;color:var(--text-muted)">No requests yet</td></tr>') +
    '</tbody></table></div>';
}

// ── CATEGORIES ───────────────────────────────────────
function renderCategoriesTab(c) {
  var cats = [];
  try { cats = JSON.parse(localStorage.getItem('rae_categories') || 'null') || DEFAULT_CATEGORIES; } catch(e) { cats = DEFAULT_CATEGORIES; }

  c.innerHTML =
    '<div class="glass-card" style="padding:24px">' +
    '<h3 style="margin-bottom:16px">Manage Categories</h3>' +
    '<div style="display:flex;gap:10px;margin-bottom:20px">' +
    '<input class="input-field" id="new-cat" placeholder="Add new category..." style="flex:1" onkeydown="if(event.key===\'Enter\')addCategory()" />' +
    '<button class="btn btn-primary" onclick="addCategory()">\u2795 Add</button>' +
    '</div>' +
    '<div style="display:flex;flex-wrap:wrap;gap:10px" id="cat-list">' +
    cats.map(function(cat) {
      return '<div style="display:flex;align-items:center;gap:8px;background:var(--glass);border:1px solid var(--glass-border);border-radius:50px;padding:8px 16px">' +
        '<span>' + cat + '</span>' +
        '<button onclick="removeCategory(\'' + cat + '\')" style="background:none;border:none;color:var(--neon-pink);cursor:pointer;font-size:1.1rem;line-height:1">\u00d7</button>' +
        '</div>';
    }).join('') +
    '</div>' +
    '<p style="margin-top:16px;font-size:0.8rem;color:var(--text-muted)">Changes apply to product form and home category pills.</p>' +
    '</div>';
}

function addCategory() {
  var input = document.getElementById('new-cat');
  var val = (input && input.value || '').trim();
  if (!val) return;
  var cats = [];
  try { cats = JSON.parse(localStorage.getItem('rae_categories') || 'null') || DEFAULT_CATEGORIES; } catch(e) { cats = DEFAULT_CATEGORIES; }
  if (cats.indexOf(val) === -1) { cats.push(val); localStorage.setItem('rae_categories', JSON.stringify(cats)); }
  if (input) input.value = '';
  renderCategoriesTab(document.getElementById('admin-content'));
  toast('"' + val + '" added! \u2728');
}

function removeCategory(cat) {
  var cats = [];
  try { cats = JSON.parse(localStorage.getItem('rae_categories') || 'null') || DEFAULT_CATEGORIES; } catch(e) { cats = DEFAULT_CATEGORIES; }
  cats = cats.filter(function(c){ return c !== cat; });
  localStorage.setItem('rae_categories', JSON.stringify(cats));
  renderCategoriesTab(document.getElementById('admin-content'));
}

// ── ADD / EDIT PRODUCT ───────────────────────────────
function renderAddProductForm(c, existing) {
  var p = existing || {};
  var cats = [];
  try { cats = JSON.parse(localStorage.getItem('rae_categories') || 'null') || DEFAULT_CATEGORIES; } catch(e) { cats = DEFAULT_CATEGORIES; }

  c.innerHTML =
    '<div class="glass-card" style="padding:28px">' +
    '<h3 style="margin-bottom:22px">' + (p.id ? '\u270f\ufe0f Edit Product' : '\u2795 Add New Product') + '</h3>' +
    '<form onsubmit="saveProduct(event,\'' + (p.id||'') + '\')">' +
    '<div class="product-form">' +
    fld('Product Name','pf-name','text',p.name||'','Amazing Product',true) +
    '<div class="input-group"><label>Category</label><select class="input-field" id="pf-cat">' +
    cats.map(function(cat){ return '<option value="' + cat + '"' + (p.category===cat?' selected':'') + '>' + cat + '</option>'; }).join('') +
    '</select></div>' +
    fld('Original Price (\u20a6)','pf-price','number',p.price||'','5000',true) +
    fld('Discount Price (\u20a6)','pf-disc','number',p.discount_price||'','3500',true) +
    fld('Stock Count','pf-stock','number',p.stock_count||'','100',true) +
    fld('Tags (comma-separated)','pf-tags','text',(p.tags||[]).join(', '),'fashion, trending',false) +
    '<div class="input-group full-width"><label>Description</label>' +
    '<textarea class="input-field" id="pf-desc" rows="3" placeholder="Beautiful product description...">' + (p.description||'') + '</textarea></div>' +
    '<div class="input-group full-width"><label>Image URLs (one per line, up to 5 images)</label>' +
    '<textarea class="input-field" id="pf-imgs" rows="4" placeholder="https://example.com/image1.jpg\nhttps://example.com/image2.jpg">' + (p.images||[]).join('\n') + '</textarea></div>' +
    fld('Clothing Sizes (comma-separated)','pf-sizes','text',(p.sizes||['S','M','L','XL','XXL']).join(','),'S,M,L,XL,XXL',false) +
    fld('Shoe Sizes (EU, comma-separated)','pf-shoe','text',(p.shoe_sizes||['39','40','41','42','43','44']).join(','),'39,40,41,42,43,44',false) +
    '<div class="input-group"><label style="display:flex;align-items:center;gap:8px;cursor:pointer;text-transform:none">' +
    '<input type="checkbox" id="pf-flash" ' + (p.is_flash?'checked':'') + ' /> \u26a1 Flash Sale Item</label></div>' +
    '<div class="input-group"><label style="display:flex;align-items:center;gap:8px;cursor:pointer;text-transform:none">' +
    '<input type="checkbox" id="pf-in" ' + (!p.id||p.in_stock?'checked':'') + ' /> \u2705 In Stock</label></div>' +
    '</div>' +
    '<div style="display:flex;gap:10px;margin-top:12px">' +
    '<button type="submit" class="btn btn-primary" id="pf-btn">' + (p.id ? '\ud83d\udcbe Update' : '\u2728 Add Product') + '</button>' +
    '<button type="button" class="btn btn-ghost" onclick="switchAdminTab(\'products\')">Cancel</button>' +
    '</div></form></div>';
}

function fld(label, id, type, val, ph, req) {
  return '<div class="input-group"><label>' + label + '</label>' +
    '<input class="input-field" id="' + id + '" type="' + type + '" value="' + (val||'') + '" placeholder="' + ph + '" ' + (req?'required':'') + ' /></div>';
}

async function saveProduct(e, existingId) {
  e.preventDefault();
  var btn = document.getElementById('pf-btn');
  setLoading(btn, true);

  var imgs = (document.getElementById('pf-imgs').value||'').split('\n').map(function(s){return s.trim();}).filter(Boolean).slice(0,5);
  var tags = (document.getElementById('pf-tags').value||'').split(',').map(function(s){return s.trim();}).filter(Boolean);
  var sizes = (document.getElementById('pf-sizes').value||'').split(',').map(function(s){return s.trim();}).filter(Boolean);
  var shoeSizes = (document.getElementById('pf-shoe').value||'').split(',').map(function(s){return s.trim();}).filter(Boolean);

  var data = {
    name:          document.getElementById('pf-name').value,
    category:      document.getElementById('pf-cat').value,
    price:         parseFloat(document.getElementById('pf-price').value),
    discount_price:parseFloat(document.getElementById('pf-disc').value),
    stock_count:   parseInt(document.getElementById('pf-stock').value),
    description:   document.getElementById('pf-desc').value,
    tags: tags, images: imgs, sizes: sizes, shoe_sizes: shoeSizes,
    is_flash:  document.getElementById('pf-flash').checked,
    in_stock:  document.getElementById('pf-in').checked,
    updated_at: new Date().toISOString(),
  };

  var err;
  if (existingId) {
    err = (await db.from('products').update(data).eq('id', existingId)).error;
  } else {
    data.created_at = new Date().toISOString();
    err = (await db.from('products').insert(data)).error;
  }

  setLoading(btn, false);
  if (err) { toast('Error: ' + err.message, 'error'); return; }
  toast(existingId ? 'Product updated! \u2728' : 'Product added! \u2728');
  switchAdminTab('products');
}

async function editProduct(id) {
  var res = await db.from('products').select('*').eq('id', id).single();
  if (res.data) renderAddProductForm(document.getElementById('admin-content'), res.data);
}

async function deleteProduct(id) {
  if (!confirm('Delete this product? This cannot be undone.')) return;
  await db.from('products').delete().eq('id', id);
  toast('Product deleted \ud83d\uddd1', 'info');
  loadAdminTab('products');
}
