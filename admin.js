// RAE ENTERPRISE — Admin Panel
var ADMIN_UN = 'Chinedu';
var adminAuthed = false;
var adminTab = 'orders';
var DEFAULT_CATEGORIES = ['Fashion','Beauty','Tech','Home','Shoes','Accessories','Gifts','Jewelry','Kids','Sports','Electronics','Food','Books','Art','Music'];

function renderAdmin() {
  if (Store.profile && Store.profile.username === 'Chinedu') {
    adminAuthed = true;
    try { sessionStorage.setItem('rae_admin','1'); } catch(e){}
  }
  if (!adminAuthed && !Store.isAdmin()) { toast('Access denied','error'); navigate('home'); return; }
  buildAdminUI();
}

function buildAdminUI() {
  var TABS = [
    {id:'orders',label:'\ud83d\udce6 Orders'},
    {id:'products',label:'\ud83d\uded2 Products'},
    {id:'users',label:'\ud83d\udc65 Users'},
    {id:'notify',label:'\ud83d\udd14 Notify'},
    {id:'requests',label:'\ud83d\udce3 Requests'},
    {id:'add-product',label:'\u2795 Add Product'},
    {id:'categories',label:'\ud83c\udff7\ufe0f Categories'},
  ];
  document.getElementById('app').innerHTML =
    '<div class="admin-page container page-enter">' +
    '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:20px;flex-wrap:wrap;gap:10px">' +
    '<div style="display:flex;align-items:center;gap:12px"><h1 class="section-title">\u2699\ufe0f Admin Panel</h1><span class="badge badge-pink">Admin</span></div>' +
    '<button class="btn btn-ghost btn-sm" onclick="adminLogout()">\ud83d\udeaa Logout Admin</button>' +
    '</div>' +
    '<div class="admin-tabs">' +
    TABS.map(function(t){ return '<button class="admin-tab ' + (adminTab===t.id?'active':'') + '" onclick="switchAdminTab(\'' + t.id + '\')">' + t.label + '</button>'; }).join('') +
    '</div>' +
    '<div id="admin-content"><div style="text-align:center;padding:40px"><div class="spinner" style="margin:auto"></div></div></div>' +
    '</div>';
  loadAdminTab(adminTab);
}

function adminLogout() {
  adminAuthed = false;
  try { sessionStorage.removeItem('rae_admin'); } catch(e){}
  toast('Admin session ended','info');
  navigate('home');
}

function switchAdminTab(tab) {
  adminTab = tab;
  document.querySelectorAll('.admin-tab').forEach(function(btn,i) {
    var ids = ['orders','products','users','notify','requests','add-product','categories'];
    btn.classList.toggle('active', ids[i] === tab);
  });
  loadAdminTab(tab);
}

async function loadAdminTab(tab) {
  var c = document.getElementById('admin-content');
  if (!c) return;
  c.innerHTML = '<div style="text-align:center;padding:40px"><div class="spinner" style="margin:auto"></div></div>';
  if (tab==='orders') await renderAdminOrders(c);
  else if (tab==='products') await renderAdminProducts(c);
  else if (tab==='users') await renderAdminUsers(c);
  else if (tab==='notify') renderNotifyTab(c);
  else if (tab==='requests') await renderAdminRequests(c);
  else if (tab==='add-product') renderAddProductForm(c, null);
  else if (tab==='categories') renderCategoriesTab(c);
}

// ── ORDERS ──
var ORDER_STATUS_OPTIONS = ['awaiting_approval','approved','processing','shipped','delivered','cancelled'];

async function renderAdminOrders(c) {
  var res = await db.from('orders').select('*').order('created_at', {ascending:false}).limit(80);
  var orders = res.data || [];
  window._allOrders = orders;
  c.innerHTML =
    '<div style="margin-bottom:14px"><input class="input-field" id="ord-search" placeholder="\ud83d\udd0d Search order ID or name..." style="max-width:320px" oninput="filterOrders(this.value)" /></div>' +
    '<div class="admin-table-wrap" id="orders-table">' + buildOrdersTable(orders) + '</div>';
}

function buildOrdersTable(orders) {
  if (!orders.length) return '<div style="text-align:center;padding:40px;color:var(--text-muted)">No orders yet</div>';
  return '<table class="admin-table"><thead><tr>' +
    '<th>Order ID</th><th>Customer</th><th>Delivery Address</th><th>Amount</th><th>Items/Size</th><th>Date</th><th>Status</th><th>Actions</th>' +
    '</tr></thead><tbody>' +
    orders.map(function(o) {
      var items = o.items || [];
      var sizes = items.map(function(i){ return i.selected_size||''; }).filter(Boolean).join(', ') || '—';
      var itemNames = items.slice(0,2).map(function(i){ return i.name||''; }).join(', ') + (items.length>2 ? ' +' + (items.length-2) : '');
      var uid = o.user_id || '';
      var statusOpts = ORDER_STATUS_OPTIONS.map(function(s) {
        return '<option value="' + s + '"' + (o.status===s?' selected':'') + '>' + s.replace(/_/g,' ') + '</option>';
      }).join('');
      return '<tr>' +
        '<td style="font-family:monospace;color:var(--neon-purple-light);font-size:0.72rem">' + o.id + '</td>' +
        '<td><div style="font-weight:600;font-size:0.875rem">' + (o.full_name||'—') + '</div><div style="font-size:0.72rem;color:var(--text-muted)">' + (o.phone||'') + '</div></td>' +
        '<td style="font-size:0.78rem;max-width:180px">' +
          (o.address ?
            '<div style="color:var(--text-secondary);line-height:1.5">' + o.address + '</div>' +
            (o.sender_name ? '<div style="font-size:0.7rem;color:var(--text-muted);margin-top:2px">Sender: ' + o.sender_name + '</div>' : '')
            :
            '<span style="color:var(--text-muted);font-style:italic;font-size:0.75rem">No address provided</span>'
          ) +
        '</td>' +
        '<td class="text-neon-cyan fw-700">' + formatNaira(o.total_amount) + '</td>' +
        '<td style="font-size:0.78rem;max-width:140px"><div style="color:var(--text-secondary)">' + itemNames + '</div>' +
          (sizes !== '—' ? '<div style="color:var(--neon-purple-light);font-size:0.72rem;margin-top:2px">Size: ' + sizes + '</div>' : '') +
        '</td>' +
        '<td style="font-size:0.75rem;color:var(--text-muted)">' + formatDate(o.created_at) + '</td>' +
        '<td><select class="status-select" data-oid="' + o.id + '" data-uid="' + uid + '" onchange="updateOrderStatus(this)">' + statusOpts + '</select></td>' +
        '<td><div style="display:flex;gap:5px;flex-wrap:wrap">' +
          (o.proof_url ? '<a href="' + o.proof_url + '" target="_blank" class="btn btn-ghost btn-sm">&#128247;</a>' : '') +
          '<button class="btn btn-outline btn-sm" onclick="showInvoice(\'' + o.id + '\')">Receipt</button>' +
        '</div></td></tr>';
    }).join('') + '</tbody></table>';
}

function filterOrders(q) {
  if (!window._allOrders) return;
  q = q.toLowerCase();
  var filtered = !q ? window._allOrders : window._allOrders.filter(function(o) {
    return o.id.toLowerCase().indexOf(q) !== -1 || (o.full_name||'').toLowerCase().indexOf(q) !== -1;
  });
  var tbl = document.getElementById('orders-table');
  if (tbl) tbl.innerHTML = buildOrdersTable(filtered);
}

async function updateOrderStatus(sel) {
  var orderId = sel.getAttribute('data-oid');
  var userId  = sel.getAttribute('data-uid');
  var status  = sel.value;
  await db.from('orders').update({status: status}).eq('id', orderId);
  var msgs = {
    awaiting_approval: '\ud83d\udcb3 We received your order! Awaiting payment confirmation.',
    approved:          '\u2705 Payment confirmed! Your order has been approved \ud83c\udf89',
    cancelled:         '\u274c Your order has been cancelled. Contact us at 08117706203 for help.',
    processing:        '\ud83d\udd27 Your item is being carefully prepared for shipment.',
    shipped:           '\ud83d\ude9a On the way to you! Your order has been shipped.',
    delivered:         '\ud83c\udf89 Delivered! We hope you love your purchase \ud83d\udc9c'
  };
  if (userId) {
    await db.from('notifications').insert({
      user_id: userId,
      message: msgs[status] || 'Order ' + orderId + ' updated: ' + status.replace(/_/g,' '),
      type: 'order_update',
      created_at: new Date().toISOString()
    });
  }
  // When approved: update total_spent for user
  if (status === 'approved' && userId) {
    try {
      var ordR = await db.from('orders').select('total_amount').eq('id', orderId).single();
      if (ordR.data) {
        var profR = await db.from('profiles').select('total_spent').eq('id', userId).single();
        var cur = (profR.data && profR.data.total_spent) || 0;
        await db.from('profiles').update({ total_spent: cur + ordR.data.total_amount }).eq('id', userId);
      }
    } catch(e) { console.warn('total_spent err', e); }
  }
  toast('Updated \u2192 ' + status + ' \u2728');
}

// ── INVOICE ──
async function showInvoice(orderId) {
  var res = await db.from('orders').select('*').eq('id', orderId).single();
  if (!res.data) { toast('Order not found','error'); return; }
  var o = res.data;
  var items = o.items || [];
  var ov = document.createElement('div');
  ov.className = 'overlay'; ov.id = 'inv-ov';
  ov.innerHTML =
    '<div class="modal" style="max-width:500px">' +
    '<div style="text-align:center;padding-bottom:14px;margin-bottom:14px;border-bottom:1px solid var(--glass-border)">' +
    '<div style="font-family:var(--font-script);font-size:2rem;background:linear-gradient(135deg,#7B2EFF,#00F5FF);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text">Rae Enterprise</div>' +
    '<div style="font-size:0.75rem;color:var(--text-muted)">Premium Shopping \u2014 Nigeria\'s Finest \u2022 \ud83d\udcde 08117706203</div>' +
    '</div>' +
    '<div style="display:flex;justify-content:space-between;margin-bottom:12px;font-size:0.82rem">' +
    '<div><strong>Invoice:</strong> ' + o.id + '</div><div><strong>Date:</strong> ' + formatDate(o.created_at) + '</div>' +
    '</div>' +
    '<div style="background:var(--glass);border-radius:10px;padding:12px;margin-bottom:14px;font-size:0.82rem">' +
    '<strong>Customer:</strong> ' + (o.full_name||'—') + '<br>' +
    '<strong>Phone:</strong> ' + (o.phone||'—') + '<br>' +
    '<strong>Address:</strong> ' + (o.address||'—') +
    '</div>' +
    '<table style="width:100%;font-size:0.82rem;border-collapse:collapse;margin-bottom:14px">' +
    '<thead><tr style="border-bottom:1px solid var(--glass-border)">' +
    '<th style="text-align:left;padding:6px 4px;color:var(--text-muted)">Product</th>' +
    '<th style="text-align:center;padding:6px 4px;color:var(--text-muted)">Size</th>' +
    '<th style="text-align:center;padding:6px 4px;color:var(--text-muted)">Qty</th>' +
    '<th style="text-align:right;padding:6px 4px;color:var(--text-muted)">Price</th>' +
    '</tr></thead><tbody>' +
    items.map(function(item) {
      return '<tr style="border-bottom:1px solid rgba(123,46,255,0.08)">' +
        '<td style="padding:6px 4px">' + (item.name||'—') + '</td>' +
        '<td style="text-align:center;padding:6px 4px">' + (item.selected_size||'—') + '</td>' +
        '<td style="text-align:center;padding:6px 4px">' + (item.qty||1) + '</td>' +
        '<td style="text-align:right;padding:6px 4px;color:var(--neon-cyan);font-weight:700">' + formatNaira((item.discount_price||item.price||0)*(item.qty||1)) + '</td>' +
        '</tr>';
    }).join('') +
    '</tbody></table>' +
    '<div style="display:flex;justify-content:space-between;font-weight:700;font-size:1rem;padding-top:12px;border-top:1px solid var(--glass-border)">' +
    '<span>Total</span><span style="color:var(--neon-cyan)">' + formatNaira(o.total_amount) + '</span>' +
    '</div>' +
    '<div style="text-align:center;margin-top:12px;font-size:0.75rem;color:var(--text-muted)">Thank you for shopping with Rae Enterprise! \ud83d\udc9c</div>' +
    '<div style="display:flex;gap:10px;margin-top:16px">' +
    '<button class="btn btn-primary" style="flex:1" onclick="window.print()">\ud83d\udda8\ufe0f Print</button>' +
    '<button class="btn btn-ghost" style="flex:1" onclick="document.getElementById(\'inv-ov\').remove()">Close</button>' +
    '</div></div>';
  document.body.appendChild(ov);
  ov.addEventListener('click', function(e){ if(e.target===ov) ov.remove(); });
}

// ── PRODUCTS ──
async function renderAdminProducts(c) {
  var res = await db.from('products').select('*').order('created_at',{ascending:false});
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
        '<td style="font-weight:600;font-size:0.875rem;max-width:160px">' + p.name + '</td>' +
        '<td style="text-decoration:line-through;color:var(--text-muted)">' + formatNaira(p.price) + '</td>' +
        '<td class="text-neon-cyan fw-700">' + formatNaira(p.discount_price) + '</td>' +
        '<td style="color:' + (p.stock_count<=5?'var(--neon-pink)':'var(--neon-cyan)') + ';font-weight:700">' + p.stock_count + '</td>' +
        '<td><span class="badge ' + (p.in_stock?'badge-cyan':'badge-pink') + '">' + (p.in_stock?'In Stock':'Out of Stock') + '</span></td>' +
        '<td><div style="display:flex;gap:5px">' +
        '<button class="btn btn-ghost btn-sm" onclick="editProduct(\'' + p.id + '\')">\u270f\ufe0f</button>' +
        '<button class="btn btn-sm" style="background:rgba(255,46,189,0.15);color:var(--neon-pink);border:1px solid rgba(255,46,189,0.3)" onclick="deleteProduct(\'' + p.id + '\')">\ud83d\uddd1</button>' +
        '</div></td></tr>';
    }).join('') : '<tr><td colspan="7" style="text-align:center;padding:40px;color:var(--text-muted)">No products yet</td></tr>') +
    '</tbody></table></div>';
}

// ── USERS ──
async function renderAdminUsers(c) {
  var res = await db.from('profiles').select('*').order('created_at',{ascending:false}).limit(80);
  var users = res.data || [];
  c.innerHTML = '<div class="admin-table-wrap"><table class="admin-table"><thead><tr>' +
    '<th>Username</th><th>Email</th><th>Phone</th><th>Wallet</th><th>Spent</th><th>Level</th><th>Actions</th>' +
    '</tr></thead><tbody>' +
    (users.length ? users.map(function(u) {
      var lvl = getLevel(u.total_spent||0);
      return '<tr>' +
        '<td style="font-weight:700">' + (u.username||'—') + '</td>' +
        '<td style="font-size:0.8rem;color:var(--text-muted)">' + (u.email||'—') + '</td>' +
        '<td style="font-size:0.8rem">' + (u.phone||'—') + '</td>' +
        '<td class="text-neon-cyan">' + formatNaira(u.wallet_balance||0) + '</td>' +
        '<td>' + formatNaira(u.total_spent||0) + '</td>' +
        '<td><span class="' + lvl.class + '">' + lvl.icon + ' ' + lvl.name + '</span></td>' +
        '<td><button class="btn btn-outline btn-sm" onclick="adjustWallet(\'' + u.id + '\',\'' + (u.username||'user') + '\')">\ud83d\udcb0</button></td>' +
        '</tr>';
    }).join('') : '<tr><td colspan="7" style="text-align:center;padding:40px;color:var(--text-muted)">No users</td></tr>') +
    '</tbody></table></div>';
}

function adjustWallet(userId, username) {
  var ov = document.createElement('div'); ov.className='overlay'; ov.id='wal-ov';
  ov.innerHTML = '<div class="modal" style="max-width:360px">' +
    '<h3 style="margin-bottom:18px">Wallet \u2014 <span class="text-neon-purple">' + username + '</span></h3>' +
    '<div class="input-group"><label>Action</label><select class="input-field" id="wa-act"><option value="add">Add</option><option value="remove">Remove</option></select></div>' +
    '<div class="input-group"><label>Amount (\u20a6)</label><input class="input-field" type="number" id="wa-amt" placeholder="Enter amount" min="1" /></div>' +
    '<div style="display:flex;gap:10px"><button class="btn btn-primary" onclick="applyWallet(\'' + userId + '\')">Apply</button>' +
    '<button class="btn btn-ghost" onclick="document.getElementById(\'wal-ov\').remove()">Cancel</button></div></div>';
  document.body.appendChild(ov);
  ov.addEventListener('click', function(e){ if(e.target===ov) ov.remove(); });
}

async function applyWallet(userId) {
  var action = document.getElementById('wa-act').value;
  var amount = parseFloat(document.getElementById('wa-amt').value);
  if (!amount||amount<=0) { toast('Enter a valid amount','warn'); return; }
  var res = await db.from('profiles').select('wallet_balance').eq('id',userId).single();
  var cur = (res.data&&res.data.wallet_balance)||0;
  var newBal = action==='add' ? cur+amount : Math.max(0,cur-amount);
  await db.from('profiles').update({wallet_balance:newBal}).eq('id',userId);
  document.getElementById('wal-ov').remove();
  toast((action==='add'?'Credited':'Debited') + ' ' + formatNaira(amount) + ' \u2728');
  loadAdminTab('users');
}

// ── NOTIFY ──
function renderNotifyTab(c) {
  c.innerHTML =
    '<div class="glass-card" style="padding:28px;margin-bottom:20px">' +
    '<h3 style="margin-bottom:6px">\ud83d\udd14 Send Notification</h3>' +
    '<p style="color:var(--text-secondary);font-size:0.85rem;margin-bottom:18px">Send to all users or a specific user.</p>' +
    '<div class="input-group"><label>Recipient</label>' +
    '<select class="input-field" id="notif-target" onchange="document.getElementById(\'notif-user-wrap\').style.display=this.value===\'one\'?\'block\':\'none\'">' +
    '<option value="all">All Users</option><option value="one">Specific User</option></select></div>' +
    '<div id="notif-user-wrap" style="display:none"><div class="input-group"><label>Username</label>' +
    '<input class="input-field" id="notif-username" placeholder="Enter username" /></div></div>' +
    '<div class="input-group"><label>Message</label><textarea class="input-field" id="notif-msg" rows="3" placeholder="Type your message..."></textarea></div>' +
    '<button class="btn btn-primary" id="notif-btn" onclick="sendAdminNotif()">\ud83d\udce8 Send</button>' +
    '</div>' +
    '<div class="glass-card" style="padding:24px"><h3 style="margin-bottom:14px">Quick Templates</h3>' +
    '<div style="display:flex;flex-direction:column;gap:8px">' +
    [
      ['\ud83d\udd25 Flash Sale!','\ud83d\udd25 FLASH SALE is LIVE! Up to 70% OFF today only on Rae Enterprise!'],
      ['\u2728 New Arrivals','\u2728 New products just dropped! Check out the latest collection on Rae Enterprise.'],
      ['\ud83c\udf81 Earn Rewards','\ud83c\udf81 Refer friends and earn up to \u20a610,000 in wallet rewards!'],
      ['\ud83d\udc9c We Miss You!','\ud83d\udc9c We miss you! Amazing deals are waiting at Rae Enterprise \u2728']
    ].map(function(t) {
      return '<div style="display:flex;align-items:center;justify-content:space-between;padding:10px 14px;background:var(--glass);border:1px solid var(--glass-border);border-radius:var(--radius-sm)">' +
        '<span style="font-size:0.875rem">' + t[0] + '</span>' +
        '<button class="btn btn-ghost btn-sm" onclick="document.getElementById(\'notif-msg\').value=\'' + t[1] + '\'">Use</button>' +
        '</div>';
    }).join('') + '</div></div>';
}

async function sendAdminNotif() {
  var btn = document.getElementById('notif-btn');
  var target = document.getElementById('notif-target').value;
  var message = (document.getElementById('notif-msg').value||'').trim();
  if (!message) { toast('Write a message first','error'); return; }
  setLoading(btn, true);
  try {
    if (target==='all') {
      var ur = await db.from('profiles').select('id');
      var users = ur.data||[];
      for (var i=0; i<users.length; i+=50) {
        await db.from('notifications').insert(users.slice(i,i+50).map(function(u){ return {user_id:u.id,message:message,type:'promo',created_at:new Date().toISOString()}; }));
      }
      toast('Sent to ' + users.length + ' users! \ud83d\udce8');
    } else {
      var uname = (document.getElementById('notif-username').value||'').trim();
      if (!uname) { toast('Enter a username','warn'); setLoading(btn,false); return; }
      var uRes = await db.from('profiles').select('id').eq('username',uname).single();
      if (!uRes.data) { toast('User not found','error'); setLoading(btn,false); return; }
      await db.from('notifications').insert({user_id:uRes.data.id,message:message,type:'promo',created_at:new Date().toISOString()});
      toast('Sent to ' + uname + '!');
    }
    document.getElementById('notif-msg').value = '';
  } catch(e) { toast('Error: '+(e.message||'unknown'),'error'); }
  setLoading(btn, false);
}

// ── REQUESTS ──
async function renderAdminRequests(c) {
  var res = await db.from('item_requests').select('*').order('count',{ascending:false});
  var reqs = res.data||[];
  var grouped = {};
  reqs.forEach(function(r) {
    if (!grouped[r.product_id]) grouped[r.product_id] = {name:r.product_name,total:0,users:[]};
    grouped[r.product_id].total += (r.count||1);
    if (grouped[r.product_id].users.indexOf(r.username)===-1) grouped[r.product_id].users.push(r.username||'Unknown');
  });
  var keys = Object.keys(grouped);
  c.innerHTML = '<div class="admin-table-wrap"><table class="admin-table"><thead><tr>' +
    '<th>Product</th><th>Requests</th><th>By</th><th>Action</th></tr></thead><tbody>' +
    (keys.length ? keys.map(function(pid) {
      var g = grouped[pid];
      return '<tr><td style="font-weight:600">' + (g.name||pid) + '</td>' +
        '<td><span class="badge badge-pink">' + g.total + ' \ud83d\udce3</span></td>' +
        '<td style="font-size:0.8rem;color:var(--text-muted)">' + g.users.slice(0,5).join(', ') + '</td>' +
        '<td><button class="btn btn-outline btn-sm" onclick="switchAdminTab(\'add-product\')">Restock</button></td></tr>';
    }).join('') : '<tr><td colspan="4" style="text-align:center;padding:40px;color:var(--text-muted)">No requests yet</td></tr>') +
    '</tbody></table></div>';
}

// ── CATEGORIES ──
function renderCategoriesTab(c) {
  var cats = [];
  try { cats = JSON.parse(localStorage.getItem('rae_categories')||'null')||DEFAULT_CATEGORIES; } catch(e) { cats = DEFAULT_CATEGORIES; }
  c.innerHTML = '<div class="glass-card" style="padding:24px">' +
    '<h3 style="margin-bottom:14px">Manage Categories</h3>' +
    '<div style="display:flex;gap:10px;margin-bottom:18px">' +
    '<input class="input-field" id="new-cat" placeholder="New category..." style="flex:1" onkeydown="if(event.key===\'Enter\')addCategory()" />' +
    '<button class="btn btn-primary" onclick="addCategory()">\u2795 Add</button></div>' +
    '<div style="display:flex;flex-wrap:wrap;gap:8px">' +
    cats.map(function(cat) {
      return '<div style="display:flex;align-items:center;gap:6px;background:var(--glass);border:1px solid var(--glass-border);border-radius:50px;padding:7px 14px">' +
        '<span>' + cat + '</span>' +
        '<button onclick="removeCategory(\'' + cat + '\')" style="background:none;border:none;color:var(--neon-pink);cursor:pointer;font-size:1rem">\u00d7</button>' +
        '</div>';
    }).join('') + '</div></div>';
}

function addCategory() {
  var input = document.getElementById('new-cat');
  var val = (input&&input.value||'').trim();
  if (!val) return;
  var cats = [];
  try { cats = JSON.parse(localStorage.getItem('rae_categories')||'null')||DEFAULT_CATEGORIES; } catch(e) { cats = DEFAULT_CATEGORIES; }
  if (cats.indexOf(val)===-1) { cats.push(val); localStorage.setItem('rae_categories',JSON.stringify(cats)); }
  if (input) input.value = '';
  renderCategoriesTab(document.getElementById('admin-content'));
  toast('"' + val + '" added!');
}

function removeCategory(cat) {
  var cats = [];
  try { cats = JSON.parse(localStorage.getItem('rae_categories')||'null')||DEFAULT_CATEGORIES; } catch(e) { cats = DEFAULT_CATEGORIES; }
  cats = cats.filter(function(c){ return c!==cat; });
  localStorage.setItem('rae_categories', JSON.stringify(cats));
  renderCategoriesTab(document.getElementById('admin-content'));
}

// ── ADD/EDIT PRODUCT — Phone Upload + URL ──
function renderAddProductForm(c, existing) {
  var p = existing || {};
  var cats = [];
  try { cats = JSON.parse(localStorage.getItem('rae_categories')||'null')||DEFAULT_CATEGORIES; } catch(e) { cats = DEFAULT_CATEGORIES; }
  var existingImgs = p.images || [];
  window._slotImgs  = [existingImgs[0]||'', existingImgs[1]||'', existingImgs[2]||''];
  window._slotFiles = [null, null, null];

  c.innerHTML =
    '<div class="glass-card" style="padding:28px">' +
    '<h3 style="margin-bottom:22px">' + (p.id?'\u270f\ufe0f Edit Product':'\u2795 Add New Product') + '</h3>' +
    '<form onsubmit="saveProduct(event,\'' + (p.id||'') + '\')">' +
    '<div class="product-form">' +
    '<div class="input-group"><label>Product Name</label><input class="input-field" id="pf-name" required placeholder="Amazing Product" value="' + (p.name||'') + '" /></div>' +
    '<div class="input-group"><label>Category</label><select class="input-field" id="pf-cat">' + cats.map(function(cat){ return '<option value="' + cat + '"' + (p.category===cat?' selected':'') + '>' + cat + '</option>'; }).join('') + '</select></div>' +
    '<div class="input-group"><label>Original Price (\u20a6)</label><input class="input-field" id="pf-price" type="number" required placeholder="5000" value="' + (p.price||'') + '" /></div>' +
    '<div class="input-group"><label>Discount Price (\u20a6)</label><input class="input-field" id="pf-disc" type="number" required placeholder="3500" value="' + (p.discount_price||'') + '" /></div>' +
    '<div class="input-group"><label>Stock Count</label><input class="input-field" id="pf-stock" type="number" required placeholder="100" value="' + (p.stock_count||'') + '" /></div>' +
    '<div class="input-group"><label>Tags (comma-separated)</label><input class="input-field" id="pf-tags" placeholder="fashion,trending" value="' + ((p.tags||[]).join(', ')) + '" /></div>' +
    '<div class="input-group full-width"><label>Description</label><textarea class="input-field" id="pf-desc" rows="3" placeholder="Product description...">' + (p.description||'') + '</textarea></div>' +
    '<div class="input-group"><label>Clothing Sizes</label><input class="input-field" id="pf-sizes" placeholder="S,M,L,XL,XXL" value="' + ((p.sizes||['S','M','L','XL','XXL']).join(',')) + '" /></div>' +
    '<div class="input-group"><label>Shoe Sizes (EU)</label><input class="input-field" id="pf-shoe" placeholder="39,40,41,42,43,44" value="' + ((p.shoe_sizes||['39','40','41','42','43','44']).join(',')) + '" /></div>' +
    '<div class="input-group"><label style="display:flex;align-items:center;gap:8px;cursor:pointer;text-transform:none"><input type="checkbox" id="pf-flash" ' + (p.is_flash?'checked':'') + ' /> \u26a1 Flash Sale</label></div>' +
    '<div class="input-group"><label style="display:flex;align-items:center;gap:8px;cursor:pointer;text-transform:none"><input type="checkbox" id="pf-in" ' + (!p.id||p.in_stock?'checked':'') + ' /> \u2705 In Stock</label></div>' +
    '</div>' +

    // ── IMAGE SECTION ──
    '<div style="margin:20px 0">' +
    '<label style="font-size:0.82rem;font-weight:700;color:var(--text-secondary);letter-spacing:0.04em;text-transform:uppercase;display:block;margin-bottom:14px">Product Images (up to 3)</label>' +

    // 3 fixed-size upload slots
    '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:16px">' +
    [0,1,2].map(function(i) {
      var hasImg = existingImgs[i];
      return '<div style="position:relative">' +
        '<div id="slot-' + i + '" onclick="document.getElementById(\'fi-' + i + '\').click()" ' +
        'style="aspect-ratio:1;border-radius:14px;border:2px dashed var(--glass-border);display:flex;flex-direction:column;align-items:center;justify-content:center;cursor:pointer;overflow:hidden;background:rgba(123,46,255,0.06);transition:border-color 0.2s;position:relative" ' +
        'onmouseenter="this.style.borderColor=\'var(--neon-purple)\'" onmouseleave="this.style.borderColor=\'var(--glass-border)\'">' +
        (hasImg ?
          '<img src="' + hasImg + '" style="width:100%;height:100%;object-fit:cover;position:absolute;inset:0" />' +
          '<div style="position:absolute;bottom:0;left:0;right:0;background:linear-gradient(transparent,rgba(0,0,0,0.7));padding:6px 4px 4px;text-align:center;font-size:0.65rem;color:#fff">Tap to change</div>'
          :
          '<div style="text-align:center;padding:10px">' +
          '<div style="font-size:1.8rem;margin-bottom:4px">\ud83d\udcf7</div>' +
          '<div style="font-size:0.68rem;color:var(--text-muted);line-height:1.4">Upload from<br>Phone / Files</div>' +
          '</div>'
        ) +
        '</div>' +
        '<input type="file" id="fi-' + i + '" accept="image/*" style="display:none" onchange="handleImgUpload(this,' + i + ')" />' +
        '<button type="button" id="clr-' + i + '" onclick="clearSlot(' + i + ')" ' +
        'style="position:absolute;top:4px;right:4px;width:22px;height:22px;border-radius:50%;background:rgba(255,46,189,0.9);border:none;color:#fff;cursor:pointer;font-size:0.75rem;display:' + (hasImg?'flex':'none') + ';align-items:center;justify-content:center">\u00d7</button>' +
        '</div>';
    }).join('') +
    '</div>' +

    // URL section — collapsible
    '<div>' +
    '<button type="button" id="url-toggle-btn" onclick="toggleUrlSection()" style="background:none;border:none;color:var(--neon-purple-light);font-size:0.82rem;cursor:pointer;font-family:var(--font-body);display:flex;align-items:center;gap:6px;padding:0;margin-bottom:10px">' +
    '\ud83d\udd17 Or paste image URLs <span id="url-arrow">\u25bc</span></button>' +
    '<div id="url-section" style="display:none;flex-direction:column;gap:8px">' +
    [0,1,2].map(function(i) {
      return '<input class="input-field" id="pf-url-' + i + '" placeholder="Image URL ' + (i+1) + ' (https://...)" value="' + (existingImgs[i]||'') + '" style="font-size:0.82rem" oninput="previewUrlImg(this.value,' + i + ')" />';
    }).join('') +
    '</div></div>' +

    '<div id="upload-status" style="display:none;align-items:center;gap:8px;margin-top:8px;font-size:0.82rem;color:var(--text-secondary)">' +
    '<div class="spinner" style="width:18px;height:18px;border-width:2px"></div>Uploading images...</div>' +
    '</div>' +

    '<div style="display:flex;gap:10px">' +
    '<button type="submit" class="btn btn-primary" id="pf-btn">' + (p.id?'\ud83d\udcbe Update':'\u2728 Add Product') + '</button>' +
    '<button type="button" class="btn btn-ghost" onclick="switchAdminTab(\'products\')">Cancel</button>' +
    '</div></form></div>';

  // Show URLs if editing with existing images
  if (existingImgs.length) { toggleUrlSection(); }
}

function toggleUrlSection() {
  var sec = document.getElementById('url-section');
  var arrow = document.getElementById('url-arrow');
  if (!sec) return;
  var open = sec.style.display === 'flex';
  sec.style.display = open ? 'none' : 'flex';
  if (arrow) arrow.textContent = open ? '\u25bc' : '\u25b2';
}

function handleImgUpload(input, i) {
  var file = input.files[0]; if (!file) return;
  window._slotFiles[i] = file;
  // Use object URL for instant preview without size limits
  var objUrl = URL.createObjectURL(file);
  window._slotPreviewUrls = window._slotPreviewUrls || [null,null,null];
  // Revoke old object URL
  if (window._slotPreviewUrls[i]) { try { URL.revokeObjectURL(window._slotPreviewUrls[i]); } catch(e){} }
  window._slotPreviewUrls[i] = objUrl;
  window._slotImgs[i] = ''; // will be set after upload
  var slot = document.getElementById('slot-' + i);
  if (slot) {
    slot.innerHTML = '<img src="' + objUrl + '" style="width:100%;height:100%;object-fit:cover;position:absolute;inset:0" />' +
      '<div style="position:absolute;bottom:0;left:0;right:0;background:linear-gradient(transparent,rgba(0,0,0,0.7));padding:6px 4px 4px;text-align:center;font-size:0.65rem;color:#fff">Ready to upload</div>';
  }
  var clr = document.getElementById('clr-' + i); if (clr) clr.style.display = 'flex';
  var urlF = document.getElementById('pf-url-' + i); if (urlF) urlF.value = '';
}

function clearSlot(i) {
  window._slotFiles[i] = null; window._slotImgs[i] = '';
  var slot = document.getElementById('slot-' + i);
  if (slot) slot.innerHTML = '<div style="text-align:center;padding:10px"><div style="font-size:1.8rem;margin-bottom:4px">\ud83d\udcf7</div><div style="font-size:0.68rem;color:var(--text-muted);line-height:1.4">Upload from<br>Phone / Files</div></div>';
  var clr = document.getElementById('clr-' + i); if (clr) clr.style.display = 'none';
  var fi = document.getElementById('fi-' + i); if (fi) fi.value = '';
  var urlF = document.getElementById('pf-url-' + i); if (urlF) urlF.value = '';
}

function previewUrlImg(url, i) {
  if (!url || !url.startsWith('http')) return;
  window._slotImgs[i] = url;
  window._slotFiles[i] = null;
  var slot = document.getElementById('slot-' + i);
  if (slot) {
    slot.innerHTML = '<img src="' + url + '" style="width:100%;height:100%;object-fit:cover;position:absolute;inset:0" onerror="this.parentElement.innerHTML=\'<div style=padding:10px;text-align:center;font-size:0.7rem;color:var(--neon-pink)>Invalid URL</div>\'" />' +
      '<div style="position:absolute;bottom:0;left:0;right:0;background:linear-gradient(transparent,rgba(0,0,0,0.7));padding:6px 4px 4px;text-align:center;font-size:0.65rem;color:#fff">URL preview</div>';
  }
  var clr = document.getElementById('clr-' + i); if (clr) clr.style.display = 'flex';
}

async function saveProduct(e, existingId) {
  e.preventDefault();
  var btn = document.getElementById('pf-btn');
  var status = document.getElementById('upload-status');
  setLoading(btn, true);
  if (status) status.style.display = 'flex';

  var finalImgs = [];
  for (var i = 0; i < 3; i++) {
    var file = window._slotFiles && window._slotFiles[i];
    var urlVal = (document.getElementById('pf-url-' + i).value||'').trim();
    if (file) {
      try {
        var path = 'products/' + Date.now() + '_' + i + '_' + file.name.replace(/[^a-zA-Z0-9.]/g,'_');
        var up = await db.storage.from('product-images').upload(path, file, {upsert:true});
        if (!up.error) {
          var pub = db.storage.from('product-images').getPublicUrl(path);
          if (pub.data && pub.data.publicUrl) { finalImgs.push(pub.data.publicUrl); continue; }
        }
      } catch(uploadErr) {
        toast('Image upload failed. Please set up "product-images" bucket in Supabase Storage (public).','warn');
      }
    } else if (urlVal && urlVal.startsWith('http')) {
      finalImgs.push(urlVal);
    } else if (window._slotImgs && window._slotImgs[i] && window._slotImgs[i].startsWith('http')) {
      finalImgs.push(window._slotImgs[i]);
    }
  }
  finalImgs = finalImgs.filter(Boolean).slice(0, 3);

  if (status) status.style.display = 'none';

  var data = {
    name:          document.getElementById('pf-name').value,
    category:      document.getElementById('pf-cat').value,
    price:         parseFloat(document.getElementById('pf-price').value),
    discount_price:parseFloat(document.getElementById('pf-disc').value),
    stock_count:   parseInt(document.getElementById('pf-stock').value),
    description:   document.getElementById('pf-desc').value,
    tags:     (document.getElementById('pf-tags').value||'').split(',').map(function(s){return s.trim();}).filter(Boolean),
    sizes:    (document.getElementById('pf-sizes').value||'').split(',').map(function(s){return s.trim();}).filter(Boolean),
    shoe_sizes:(document.getElementById('pf-shoe').value||'').split(',').map(function(s){return s.trim();}).filter(Boolean),
    images:   finalImgs,
    is_flash: document.getElementById('pf-flash').checked,
    in_stock: document.getElementById('pf-in').checked,
  };

  var err;
  if (existingId) { err = (await db.from('products').update(data).eq('id',existingId)).error; }
  else { data.created_at = new Date().toISOString(); err = (await db.from('products').insert(data)).error; }

  setLoading(btn, false);
  if (err) { toast('Error: ' + err.message, 'error'); return; }
  window._slotFiles = null; window._slotImgs = null;
  toast(existingId ? 'Product updated! \u2728' : 'Product added! \u2728');
  switchAdminTab('products');
}

async function editProduct(id) {
  var res = await db.from('products').select('*').eq('id',id).single();
  if (res.data) renderAddProductForm(document.getElementById('admin-content'), res.data);
}
async function deleteProduct(id) {
  if (!confirm('Delete this product? Cannot be undone.')) return;
  await db.from('products').delete().eq('id',id);
  toast('Deleted','info'); loadAdminTab('products');
}
